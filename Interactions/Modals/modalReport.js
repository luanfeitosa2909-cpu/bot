const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  type: 'button',
  match: id => id === 'responder_report',

  run: async (client, interaction) => {
    if (!interaction.isButton()) return;

    const modal = new ModalBuilder().setCustomId('modal_resposta_bug').setTitle('🐞 Responder Bug');

    const respostaInput = new TextInputBuilder()
      .setCustomId('resposta_bug')
      .setLabel('Mensagem enviada ao usuário')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(respostaInput));

    await interaction.showModal(modal);
  },
};
