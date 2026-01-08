const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  type: 'select',
  customId: 'ticket_select_menu',

  async run(client, interaction) {
    if (!interaction.isStringSelectMenu()) return;

    const selected = interaction.values[0];
    // salva a categoria no customId do modal
    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal:${selected}`)
      .setTitle('📌 Informe o assunto do atendimento');

    const assuntoInput = new TextInputBuilder()
      .setCustomId('ticket_assunto')
      .setLabel('Qual é o assunto do atendimento?')
      .setPlaceholder('Exemplo: Quero denunciar um KOS.')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(300)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(assuntoInput));

    await interaction.showModal(modal);
  },
};
