// Interactions/modals/aposta_modal.js
const { EmbedBuilder } = require('discord.js');
const { getUserData, setUserData } = require('../../database/userData');

const COLLECTION_NAME = 'apostas';

module.exports = {
  type: 'modal',
  customId: /^modal_aposta_/,

  /**
   * run(client, interaction, clientMongo)
   * - interaction: ModalSubmitInteraction
   */
  async run(client, interaction, clientMongo) {
    try {
      if (!interaction.isModalSubmit()) return;

      const cid = interaction.customId; // modal_aposta_<messageId>_<side>_<userId>
      const parts = cid.split('_');
      if (parts.length < 5) {
        return interaction.reply({ content: '❌ ID do modal inválido.', ephemeral: true });
      }

      const messageId = parts[2];
      const side = Number(parts[3]);
      const expectedUserId = parts[4];

      if (interaction.user.id !== expectedUserId) {
        return interaction.reply({
          content: '❌ Este formulário não é para você.',
          ephemeral: true,
        });
      }

      const raw = interaction.fields.getTextInputValue('valor_aposta') || '';
      const valor = parseInt(raw.replace(/\D/g, ''), 10);
      if (!valor || isNaN(valor))
        return interaction.reply({ content: '❌ Valor inválido.', ephemeral: true });

      // Buscar doc da aposta (mongo ou memória)
      const db = clientMongo && typeof clientMongo.db === 'function' ? clientMongo.db() : null;
      let doc = null;
      if (db) {
        doc = await db.collection(COLLECTION_NAME).findOne({ messageId, active: true });
      } else {
        if (!client.apostasMap) client.apostasMap = new Map();
        doc = client.apostasMap.get(messageId);
      }

      if (!doc)
        return interaction.reply({
          content: '❌ Aposta não encontrada ou inativa.',
          ephemeral: true,
        });

      // validar minimo
      if (valor < doc.minimo) {
        return interaction.reply({
          content: `❌ Aposta mínima: ${doc.minimo} coins.`,
          ephemeral: true,
        });
      }

      // pegar saldo atual
      const userData = await getUserData(interaction.user.id);
      const saldoAtual = userData.coins || 0;

      // verifica se já apostou antes
      const previous = (doc.bets || []).find(b => b.userId === interaction.user.id);

      // se já apostou, devolver o valor anterior antes de tentar nova aposta
      if (previous) {
        await setUserData(interaction.user.id, { coins: saldoAtual + previous.amount });

        // remove aposta anterior do doc
        if (db) {
          await db
            .collection(COLLECTION_NAME)
            .updateOne({ messageId }, { $pull: { bets: { userId: interaction.user.id } } });
        } else {
          doc.bets = doc.bets.filter(b => b.userId !== interaction.user.id);
          client.apostasMap.set(messageId, doc);
        }
      }

      // recarregar saldo após estorno (se houve)
      const afterRefund = (await getUserData(interaction.user.id)).coins || 0;
      if (afterRefund < valor) {
        return interaction.reply({
          content: `❌ Saldo insuficiente. Seu saldo atual: ${afterRefund}`,
          ephemeral: true,
        });
      }

      // deduzir imediatamente
      const novoSaldo = Math.max(afterRefund - valor, 0);
      await setUserData(interaction.user.id, { coins: novoSaldo });

      // criar bet entry
      const betEntry = {
        userId: interaction.user.id,
        username: interaction.user.tag,
        amount: valor,
        side,
        createdAt: new Date(),
      };

      if (db) {
        await db
          .collection(COLLECTION_NAME)
          .updateOne({ messageId }, { $push: { bets: betEntry } });
        doc = await db.collection(COLLECTION_NAME).findOne({ messageId });
      } else {
        doc.bets = doc.bets || [];
        doc.bets.push(betEntry);
        client.apostasMap.set(messageId, doc);
      }

      // responder ao usuário
      await interaction.reply({
        content: `✅ Aposta registrada: **${valor} coins** no lado **${
          side === 1 ? doc.lutador1.nome : doc.lutador2.nome
        }**. Novo saldo: **${novoSaldo} coins**.`,
        ephemeral: true,
      });

      // tentar enviar DM de confirmação (silencioso em falha)
      try {
        const embed = new EmbedBuilder()
          .setTitle('📝 Confirmação de Aposta')
          .setColor('#ff2a2a')
          .addFields(
            { name: 'Batalha', value: `${doc.lutador1.nome} vs ${doc.lutador2.nome}` },
            {
              name: 'Lado',
              value:
                side === 1
                  ? `${doc.lutador1.nome} — ${doc.lutador1.dino}`
                  : `${doc.lutador2.nome} — ${doc.lutador2.dino}`,
            },
            { name: 'Valor', value: `${valor} coins` },
            { name: 'Saldo atual', value: `${novoSaldo} coins` }
          )
          .setFooter({ text: `Sistema de Apostas • ${interaction.guild?.name || 'DM'}` })
          .setTimestamp();

        await interaction.user.send({ embeds: [embed] }).catch(() => null);
      } catch (e) {
        /* ignore DM failures */
      }

      // opcional: você pode atualizar a mensagem pública com novos totais aqui, se desejar.
    } catch (err) {
      console.error('Erro em aposta_modal handler:', err);
      try {
        if (!interaction.replied)
          await interaction.reply({ content: '❌ Erro ao processar sua aposta.', ephemeral: true });
      } catch {
        // eslint-disable-next-line no-empty
      }
    }
  },
};
