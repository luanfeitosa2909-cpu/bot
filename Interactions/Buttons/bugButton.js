const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  type: 'button',
  match: id => id === 'report_bug',

  run: async (client, interaction) => {
    if (!interaction.isButton()) return;

    const modal = new ModalBuilder().setCustomId('modal_report_bug').setTitle('🐞 Reportar Bug');

    const situacaoInput = new TextInputBuilder()
      .setCustomId('situacao_bug')
      .setLabel('Em que situação ocorreu o bug?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const erroInput = new TextInputBuilder()
      .setCustomId('erro_bug')
      .setLabel('Qual erro encontrado?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const detalheInput = new TextInputBuilder()
      .setCustomId('detalhe_bug')
      .setLabel('Detalhe como aconteceu')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const imagemInput = new TextInputBuilder()
      .setCustomId('imagem_bug')
      .setLabel('Caso queira, coloque uma imagem (opcional)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(situacaoInput),
      new ActionRowBuilder().addComponents(erroInput),
      new ActionRowBuilder().addComponents(detalheInput),
      new ActionRowBuilder().addComponents(imagemInput)
    );

    await interaction.showModal(modal);
  },
};
