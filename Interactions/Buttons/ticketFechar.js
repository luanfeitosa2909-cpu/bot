require('dotenv').config();

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  type: 'button',
  customId: null,
  match: id => id === 'ticket_fechar',

  run: async (client, interaction) => {
    const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({
        content:
          '❌ Somente membros da staff podem fechar o ticket. Use o botão de "Solicitar Fechamento" no Painel do Membro.',
        flags: 1 << 6,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_ticket_fechar')
      .setTitle('🔒 Fechar Ticket');

    const input = new TextInputBuilder()
      .setCustomId('ticket_comentario')
      .setLabel('Comentário')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    await interaction.showModal(modal);
  },
};
