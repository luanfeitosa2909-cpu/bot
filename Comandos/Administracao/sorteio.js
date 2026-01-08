const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sorteio')
    .setDescription('Cria um sorteio estilizado no servidor (Loritta style)')
    .addStringOption(option =>
      option.setName('premio').setDescription('Título do sorteio / prêmio').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('tempo').setDescription('Duração do sorteio (ex: 5m, 1h)').setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('vencedores')
        .setDescription('Número de vencedores')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('imagem').setDescription('Link da imagem/banner do sorteio').setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('cor')
        .setDescription('Cor do embed')
        .addChoices(
          { name: 'Roxo', value: 'Purple' },
          { name: 'Vermelho', value: 'Red' },
          { name: 'Verde', value: 'Green' },
          { name: 'Azul', value: 'Blue' },
          { name: 'Amarelo', value: 'Yellow' },
          { name: 'Rosa', value: 'Pink' }
        )
        .setRequired(false)
    )
    .addRoleOption(option =>
      option.setName('cargo').setDescription('Cargo necessário para participar').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  run: async (client, interaction, clientMongo) => {
    const logger = require('../../Utils/logger');
    try {
      client.sorteiosTemp = client.sorteiosTemp || {};

      client.sorteiosTemp[interaction.user.id] = {
        premio: interaction.options.getString('premio'),
        tempo: interaction.options.getString('tempo'),
        vencedores: interaction.options.getInteger('vencedores'),
        imagem: interaction.options.getString('imagem'),
        cor: interaction.options.getString('cor') || 'Purple',
        cargo: interaction.options.getRole('cargo') || null,
      };

      const modal = new ModalBuilder()
        .setCustomId('modal_sorteio')
        .setTitle('📝 Descrição do Sorteio');

      const descricaoInput = new TextInputBuilder()
        .setCustomId('descricao')
        .setLabel('Digite os detalhes do sorteio')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Ex: ⚠️ Regras, requisitos, avisos...')
        .setMaxLength(1000)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(descricaoInput);
      modal.addComponents(row);

      await interaction.showModal(modal);
    } catch (err) {
      const logger = require('../../Utils/logger');
      logger.logError('sorteio', err);
      if (!interaction.replied)
        await interaction.reply({ content: '❌ Erro ao iniciar o sorteio.', ephemeral: true });
    }
  },
};
