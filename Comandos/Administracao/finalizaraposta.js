// Comandos/diversao/finalizaraposta.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const { getUserData, setUserData } = require('../../database/userData');

const COLLECTION_NAME = 'apostas';
const BONUS_APOSTADOR = 0.4;
const BONUS_LUTADOR = 0.2;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('finalizaraposta')
    .setDescription('Finaliza a aposta ativa e distribui prêmios (Admin).')
    .addIntegerOption(opt =>
      opt.setName('vencedor').setDescription('Lutador vencedor (1 ou 2)').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async run(client, interaction, clientMongo) {
    const logger = require('../../Utils/logger');
    await interaction.deferReply({ ephemeral: true });

    try {
      const vencedor = interaction.options.getInteger('vencedor');
      if (![1, 2].includes(vencedor)) {
        return interaction.editReply('❌ Defina **1** ou **2** como vencedor.');
      }

      const db = clientMongo && clientMongo.db ? clientMongo.db() : null;

      // Buscar aposta ativa no canal (Modo A: 1 aposta por canal)
      let apostaDoc = null;
      if (db) {
        apostaDoc = await db
          .collection(COLLECTION_NAME)
          .findOne({ channelId: interaction.channelId, active: true });
      } else {
        apostaDoc = client.apostasMap
          ? Array.from(client.apostasMap.values()).find(
              a => a.channelId === interaction.channelId && a.active
            )
          : null;
      }

      if (!apostaDoc) {
        return interaction.editReply('❌ Não existe aposta ativa neste canal.');
      }

      const bets = apostaDoc.bets || [];
      if (bets.length === 0) {
        // marcar encerrada mesmo sem apostas (para manter consistência)
        try {
          if (db) {
            await db.collection(COLLECTION_NAME).updateOne(
              { messageId: apostaDoc.messageId },
              {
                $set: {
                  active: false,
                  endedAt: new Date(),
                  winner: vencedor,
                  resultSummary: 'Sem apostadores',
                },
              }
            );
          }
        } catch (e) {
          logger.logWarn('Falha ao marcar aposta como encerrada sem apostas: ' + (e.message || e));
        }
        if (client.apostasMap) client.apostasMap.delete(apostaDoc.messageId);
        return interaction.editReply(
          '❌ Não há apostadores registrados nesta aposta. A aposta foi encerrada sem distribuição de prêmios.'
        );
      }

      // Totais
      const total1 = bets.filter(b => b.side === 1).reduce((t, b) => t + b.amount, 0);
      const total2 = bets.filter(b => b.side === 2).reduce((t, b) => t + b.amount, 0);
      const totalAll = total1 + total2;

      const vencedorObj = vencedor === 1 ? apostaDoc.lutador1 : apostaDoc.lutador2;
      const perdedorObj = vencedor === 1 ? apostaDoc.lutador2 : apostaDoc.lutador1;

      const ganhos = [];
      const perdas = [];

      // Processar apostas: pagar apostadores vencedores (isolando erros por bet)
      for (const bet of bets) {
        try {
          if (bet.side === vencedor) {
            const bonus = Math.floor(bet.amount * BONUS_APOSTADOR);
            const pay = bet.amount + bonus;

            const data = await getUserData(bet.userId).catch(() => null);
            const current = data && data.coins ? data.coins : 0;
            await setUserData(bet.userId, { coins: current + pay }).catch(err => {
              console.error(`Erro ao setUserData para ${bet.userId}:`, err);
            });

            ganhos.push({ ...bet, pay });
          } else {
            perdas.push(bet);
          }
        } catch (err) {
          logger.logError('Erro ao processar aposta individual:', err);
        }
      }

      // Pagar lutador vencedor (prêmio do lutador)
      const premioLutador = Math.floor(totalAll * BONUS_LUTADOR);
      try {
        const lut = await getUserData(vencedorObj.id).catch(() => null);
        const currentLut = lut && lut.coins ? lut.coins : 0;
        await setUserData(vencedorObj.id, { coins: currentLut + premioLutador }).catch(err => {
          logger.logError('Erro ao setUserData do lutador vencedor:', err);
        });
      } catch (err) {
        logger.logError('Erro ao pagar lutador vencedor:', err);
      }

      // Marcar aposta como encerrada e gravar resumo (não apagar)
      try {
        if (db) {
          await db.collection(COLLECTION_NAME).updateOne(
            { messageId: apostaDoc.messageId },
            {
              $set: {
                active: false,
                endedAt: new Date(),
                winner: vencedor,
                resultSummary: {
                  totalApostado: totalAll,
                  total1,
                  total2,
                  topGanhadores: ganhos.slice(0, 10),
                },
              },
            }
          );
        }
      } catch (e) {
        logger.logError('Erro ao atualizar doc como encerrado:', e);
      }

      // Remove do cache local
      if (client.apostasMap) {
        client.apostasMap.delete(apostaDoc.messageId);
      }

      // ╔══════════════════════════════════════════╗
      //     EMBED FINAL — RESULTADO DE ALTO NÍVEL
      // ╚══════════════════════════════════════════╝
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setAuthor({ name: '🏁 Resultado Final da Aposta' })
        .setThumbnail('https://i.imgur.com/7yZ9F1T.png')
        .setDescription(
          `A batalha chegou ao fim!\n\n` +
            `**🔥 Lutador vencedor:**\n` +
            `> 🏅 **${vencedorObj.nome}** usando **${vencedorObj.dino}**\n\n` +
            `**⚔ Lutador derrotado:**\n` +
            `> 😵 **${perdedorObj.nome}** usando **${perdedorObj.dino}**\n`
        )
        .addFields(
          {
            name: '💰 Total Apostado',
            value: `**${totalAll} coins**`,
            inline: true,
          },
          {
            name: '🎖 Prêmio do Lutador Vencedor',
            value: `**${premioLutador} coins** (20%)`,
            inline: true,
          }
        )
        .addFields({
          name: '📊 Estatísticas da Batalha',
          value:
            `🔴 ${apostaDoc.lutador1.nome}: **${total1} coins**\n` +
            `🔵 ${apostaDoc.lutador2.nome}: **${total2} coins**\n`,
          inline: false,
        })
        .addFields({
          name: '🏆 Top Vencedores',
          value: ganhos.length
            ? ganhos
                .sort((a, b) => b.pay - a.pay)
                .slice(0, 5)
                .map(
                  (g, i) =>
                    `\`${i + 1}°\` **${g.username}** — ganhou **${g.pay} coins** (apostou ${
                      g.amount
                    })`
                )
                .join('\n')
            : '*Nenhum apostador acertou.*',
          inline: false,
        })
        .addFields({
          name: '📉 Total Perdido',
          value: `**${perdas.reduce((t, p) => t + p.amount, 0)} coins**`,
          inline: false,
        })
        .setFooter({ text: 'Sistema de Apostas • Projeto Genoma' })
        .setTimestamp();

      // Editar a mensagem original (se possível)
      try {
        const channel = await client.channels.fetch(apostaDoc.channelId).catch(() => null);
        if (channel) {
          const msg = await channel.messages.fetch(apostaDoc.messageId).catch(() => null);
          if (msg) {
            await msg.edit({ embeds: [embed], components: [] }).catch(err => {
              console.error('Erro ao editar mensagem da aposta:', err);
            });
          }
        }
      } catch (err) {
        logger.logWarn('Não consegui editar a mensagem original: ' + (err.message || err));
      }
      await interaction.editReply('✅ Aposta encerrada com sucesso! Resultado publicado no chat.');
    } catch (err) {
      logger.logError('finalizaraposta', err);
      await interaction.editReply({
        content: '❌ Erro interno ao finalizar aposta.',
        ephemeral: true,
      });
    }
  },
};
