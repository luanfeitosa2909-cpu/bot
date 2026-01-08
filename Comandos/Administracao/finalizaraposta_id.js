const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const { getUserData, setUserData } = require('../../database/userData');

const COLLECTION_NAME = 'apostas';
const BONUS_APOSTADOR = 0.4;
const BONUS_LUTADOR = 0.2;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('finalizaraposta_id')
    .setDescription('Finaliza uma aposta específica pelo messageId e distribui prêmios (Admin).')
    .addStringOption(opt =>
      opt.setName('messageid').setDescription('ID da mensagem da aposta').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('vencedor').setDescription('Lado vencedor (1 ou 2)').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async run(client, interaction, clientMongo) {
    const logger = require('../../Utils/logger');
    await interaction.deferReply({ ephemeral: true });

    try {
      const messageId = interaction.options.getString('messageid');
      const vencedor = interaction.options.getInteger('vencedor');

      if (![1, 2].includes(vencedor)) {
        return interaction.editReply({ content: '❌ Defina **1** ou **2** como vencedor.' });
      }

      const db = clientMongo && clientMongo.db ? clientMongo.db() : null;

      if (!db) {
        return interaction.editReply({ content: '❌ Banco de dados não disponível.' });
      }

      // Buscar aposta pelo messageId
      const apostaDoc = await db.collection(COLLECTION_NAME).findOne({ messageId });

      if (!apostaDoc) {
        return interaction.editReply({
          content: '❌ Nenhuma aposta encontrada com esse messageId.',
        });
      }

      const bets = apostaDoc.bets || [];
      if (bets.length === 0) {
        await db
          .collection(COLLECTION_NAME)
          .updateOne(
            { messageId },
            { $set: { active: false, endedAt: new Date(), winner: vencedor } }
          );
        return interaction.editReply({
          content: '❌ Não há apostadores nesta aposta. Aposta encerrada.',
        });
      }

      const total1 = bets.filter(b => b.side === 1).reduce((t, b) => t + b.amount, 0);
      const total2 = bets.filter(b => b.side === 2).reduce((t, b) => t + b.amount, 0);
      const totalAll = total1 + total2;

      const vencedorObj = vencedor === 1 ? apostaDoc.lutador1 : apostaDoc.lutador2;
      const perdedorObj = vencedor === 1 ? apostaDoc.lutador2 : apostaDoc.lutador1;

      const ganhos = [];
      const perdas = [];

      // processar apostadores
      for (const bet of bets) {
        try {
          if (bet.side === vencedor) {
            const bonus = Math.floor(bet.amount * BONUS_APOSTADOR);
            const pay = bet.amount + bonus;
            const user = await getUserData(bet.userId);
            await setUserData(bet.userId, { coins: (user.coins || 0) + pay });
            ganhos.push({ ...bet, pay });
          } else {
            perdas.push(bet);
          }
        } catch (err) {
          logger.logError('Erro ao pagar apostador:', err);
        }
      }

      // prêmio do lutador
      const premioLutador = Math.floor(totalAll * BONUS_LUTADOR);
      try {
        const lut = await getUserData(vencedorObj.id);
        await setUserData(vencedorObj.id, { coins: (lut.coins || 0) + premioLutador });
      } catch (err) {
        logger.logError('Erro ao pagar lutador:', err);
      }

      // marcar como encerrada
      await db.collection(COLLECTION_NAME).updateOne(
        { messageId },
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

      // editar mensagem original
      try {
        const channel = await client.channels.fetch(apostaDoc.channelId).catch(() => null);
        if (channel) {
          const msg = await channel.messages.fetch(messageId).catch(() => null);
          if (msg) {
            const embed = new EmbedBuilder()
              .setColor(vencedor === 1 ? '#2ECC71' : '#3498DB')
              .setAuthor({
                name: '🏁 Aposta Encerrada – Resultado Final',
                iconURL: 'https://cdn-icons-png.flaticon.com/512/889/889442.png',
              })
              .setThumbnail(vencedor === 1 ? apostaDoc.lutador1.img : apostaDoc.lutador2.img)
              .setDescription(
                [
                  `✨ **Aposta finalizada com sucesso!**`,
                  ``,
                  `🏆 **Vencedor:** **${vencedorObj.nome}**`,
                  `🦖 **Dinossauro:** ${vencedorObj.dino}`,
                  ``,
                  `💰 **Prêmio do Lutador:** \`${premioLutador} coins\``,
                  `📊 **Total Apostado:** \`${totalAll} coins\``,
                  ``,
                  `🔽 **Resumo da Partida:**`,
                ].join('\n')
              )
              .addFields(
                {
                  name: '💥 Lado 1 (Apostas)',
                  value: `\`${total1} coins\``,
                  inline: true,
                },
                {
                  name: '🔥 Lado 2 (Apostas)',
                  value: `\`${total2} coins\``,
                  inline: true,
                },
                {
                  name: '🏅 Top Ganhadores',
                  value:
                    ganhos.length > 0
                      ? ganhos
                          .slice(0, 5)
                          .map(
                            (g, i) =>
                              `**${i + 1}.** <@${g.userId}> — apostou \`${g.amount}\` e ganhou \`${
                                g.pay
                              }\``
                          )
                          .join('\n')
                      : 'Nenhum ganhador.',
                  inline: false,
                }
              )
              .setFooter({
                text: 'Sistema de Apostas — Budokai Z',
                iconURL: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',
              })
              .setTimestamp();

            await msg.edit({ embeds: [embed], components: [] });
          }
        }
      } catch (err) {
        logger.logWarn('Falha ao editar mensagem: ' + (err.message || err));
      }
      await interaction.editReply({
        content: '✅ Aposta finalizada e prêmios distribuídos com sucesso!',
      });
    } catch (err) {
      logger.logError('finalizaraposta_id', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro interno ao finalizar aposta.' });
        else
          await interaction.followUp({
            content: '❌ Erro interno ao finalizar aposta.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('finalizaraposta_id_notify_error', e);
      }
    }
  },
};
