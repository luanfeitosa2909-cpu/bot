const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  type: 'button',
  customId: 'abrir_sugestao',
  match: id => id === 'abrir_sugestao',

  run: async (client, interaction) => {
    const modal = new ModalBuilder()
      .setCustomId('modal_sugestao')
      .setTitle('💡 Envie sua Sugestão');

    const tituloInput = new TextInputBuilder()
      .setCustomId('input_titulo')
      .setLabel('Título da Sugestão')
      .setStyle(TextInputStyle.Short)
      .setMinLength(3)
      .setMaxLength(100)
      .setPlaceholder('Ex: Melhorar economia do servidor')
      .setRequired(true);

    const sugestaoInput = new TextInputBuilder()
      .setCustomId('input_sugestao')
      .setLabel('Descrição da Sugestão')
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(10)
      .setMaxLength(1000)
      .setPlaceholder('Escreva aqui sua sugestão...')
      .setRequired(true);

    const categoriaInput = new TextInputBuilder()
      .setCustomId('input_categoria')
      .setLabel('Categoria (opcional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Economia, Administração, Eventos')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(tituloInput),
      new ActionRowBuilder().addComponents(sugestaoInput),
      new ActionRowBuilder().addComponents(categoriaInput)
    );

    await interaction.showModal(modal);
  },
};
