const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ninho')
    .setDescription('Cria um ninho de dinossauro interativo')
    .addStringOption(option =>
      option.setName('dino').setDescription('Nome do dinossauro').setRequired(true)
    )
    .addUserOption(option =>
      option.setName('femea').setDescription('Selecione a fêmea').setRequired(true)
    )
    .addUserOption(option =>
      option.setName('macho').setDescription('Selecione o macho').setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('ovos')
        .setDescription('Quantidade de ovos')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(20)
    ),

  async run(client, interaction, _clientMongo) {
    const dino = interaction.options.getString('dino');
    const femea = interaction.options.getUser('femea');
    const macho = interaction.options.getUser('macho');
    const ovos = interaction.options.getInteger('ovos');

    const embed = new EmbedBuilder()
      .setTitle(`🦖 Ninho de ${dino}`)
      .setColor('#2b7a78')
      .setDescription(
        `💠 **Fêmea:** ${femea}\n` +
          `💠 **Macho:** ${macho}\n` +
          `🥚 **Ovos:** ${ovos}\n` +
          `👥 **Quem pegou:** Ninguem ainda\n` +
          `🔹 **Ovos restantes:** ${ovos}`
      )
      .setFooter({ text: 'Projeto Genoma - Use /ninho e anuncie o seu!' });

    const customId = `ninho_${interaction.channelId}_${interaction.id}`; // único por canal + mensagem
    const button = new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(`🥚 Pegar ovo (${ovos} restantes)`)
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      content: `<@&1353475730993844285>`,
      embeds: [embed],
      components: [row],
    });
  },
};
