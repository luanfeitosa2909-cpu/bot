// Interactions/buttons/aposta_buttons.js
const {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require('discord.js');

const COLLECTION_NAME = 'apostas';

/**
 * Handler único para os botões de aposta:
 * - aposta_status -> mostra o status atual (ephemeral)
 * - aposta_vote_1 / aposta_vote_2 -> abre modal vinculado à messageId e userId
 *
 * O loader do seu projeto suporta RegExp para customId; aqui usamos /^aposta_/
 */
module.exports = {
  type: 'button',
  customId: /^aposta_/,

  /**
   * run(client, interaction, clientMongo)
   */
  async run(client, interaction, clientMongo) {
    try {
      const cid = interaction.customId;

      // -----------------------------
      // Status -> mostrar resumo da aposta
      // -----------------------------
      if (cid === 'aposta_status') {
        const messageId = interaction.message.id;
        const db = clientMongo && typeof clientMongo.db === 'function' ? clientMongo.db() : null;
        let doc = null;

        if (db) {
          doc = await db.collection(COLLECTION_NAME).findOne({ messageId, active: true });
        } else {
          client.apostasMap = client.apostasMap || new Map();
          doc = client.apostasMap.get(messageId);
        }

        if (!doc) {
          return interaction.reply({
            content: '❌ Esta aposta não está mais ativa.',
            ephemeral: true,
          });
        }

        const total1 = (doc.bets || []).filter(b => b.side === 1).reduce((s, b) => s + b.amount, 0);
        const total2 = (doc.bets || []).filter(b => b.side === 2).reduce((s, b) => s + b.amount, 0);
        const count1 = (doc.bets || []).filter(b => b.side === 1).length;
        const count2 = (doc.bets || []).filter(b => b.side === 2).length;
        const totalAll = total1 + total2;
        const pct = v => (totalAll ? Math.round((v / totalAll) * 100) : 0);
        const makeBar = p => {
          const full = Math.round(p / 10);
          const filled = '▰'.repeat(full);
          const empty = '▱'.repeat(10 - full);
          return `${filled}${empty} ${p}%`;
        };

        const embed = new EmbedBuilder()
          .setTitle('📊 Status da Aposta — BATALHA SANGRENTA')
          .setColor(0xff2a2a)
          .addFields(
            {
              name: `🔴 ${doc.lutador1.nome} — ${doc.lutador1.dino}`,
              value: `Apostadores: **${count1}**\nTotal apostado: **${total1} coins**\n${makeBar(
                pct(total1)
              )}`,
              inline: false,
            },
            {
              name: `🔵 ${doc.lutador2.nome} — ${doc.lutador2.dino}`,
              value: `Apostadores: **${count2}**\nTotal apostado: **${total2} coins**\n${makeBar(
                pct(total2)
              )}`,
              inline: false,
            },
            { name: '🔎 Total geral', value: `**${totalAll} coins**`, inline: false }
          )
          .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // -----------------------------
      // Voto -> abrir modal para apostar
      // -----------------------------
      // aceita "aposta_vote_1" e "aposta_vote_2"
      const voteMatch = cid.match(/^aposta_vote_(1|2)$/);
      if (voteMatch) {
        const side = Number(voteMatch[1]); // 1 ou 2
        // Modal customId vinculado à messageId e ao user que clicou:
        // formato: modal_aposta_<messageId>_<side>_<userId>
        const modalCustomId = `modal_aposta_${interaction.message.id}_${side}_${interaction.user.id}`;

        const modal = new ModalBuilder()
          .setCustomId(modalCustomId)
          .setTitle(
            `Apostar em ${
              side === 1
                ? `🔴 ${interaction.message.embeds?.[0]?.data?.fields?.[0]?.name || 'Lado 1'}`
                : `🔵 ${interaction.message.embeds?.[0]?.data?.fields?.[1]?.name || 'Lado 2'}`
            }`
          );

        const input = new TextInputBuilder()
          .setCustomId('valor_aposta')
          .setLabel('Quanto quer apostar? (use apenas números)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: 500')
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
      }

      // -----------------------------
      // Caso não tratado
      // -----------------------------
      return interaction.reply({ content: '❌ Botão de aposta não reconhecido.', ephemeral: true });
    } catch (err) {
      console.error('Erro no handler de botões de aposta:', err);
      try {
        if (!interaction.replied)
          await interaction.reply({ content: '❌ Erro ao processar o botão.', ephemeral: true });
        // eslint-disable-next-line no-empty
      } catch {}
    }
  },
};
