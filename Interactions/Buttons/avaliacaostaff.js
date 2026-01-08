const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  type: 'button',
  customId: 'avaliacaoStaffButton',

  run: async (client, interaction) => {
    // Modal
    const modal = new ModalBuilder()
      .setCustomId('avaliacaoStaffModal')
      .setTitle('Avaliação de Staff');

    // Inputs
    const staffInput = new TextInputBuilder()
      .setCustomId('staffName')
      .setLabel('Nome ou ID discord do Staff que te atendeu')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const notaInput = new TextInputBuilder()
      .setCustomId('nota')
      .setLabel('Nota (0 a 10)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const avaliacaoInput = new TextInputBuilder()
      .setCustomId('avaliacao')
      .setLabel('Avaliação escrita')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const sugestaoInput = new TextInputBuilder()
      .setCustomId('sugestao')
      .setLabel('Sugestão ou comentário (opcional)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    // Adiciona campos ao modal
    modal.addComponents(
      new ActionRowBuilder().addComponents(staffInput),
      new ActionRowBuilder().addComponents(notaInput),
      new ActionRowBuilder().addComponents(avaliacaoInput),
      new ActionRowBuilder().addComponents(sugestaoInput)
    );

    await interaction.showModal(modal);
  },
};
