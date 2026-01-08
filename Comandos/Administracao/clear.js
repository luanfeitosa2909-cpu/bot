const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Limpe o canal de texto')
    .addIntegerOption(option =>
      option
        .setName('quantidade')
        .setDescription('Número de mensagens para apagar (1–99)')
        .setMinValue(1)
        .setMaxValue(99)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction) {
    const logger = require('../../Utils/logger');
    const numero = interaction.options.getInteger('quantidade');

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: 'Você não possui permissão para utilizar este comando.',
        ephemeral: true,
      });
    }

    try {
      await interaction.channel.bulkDelete(numero, true);

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setAuthor({
          name: interaction.guild.name,
          iconURL: interaction.guild.iconURL({ dynamic: true }),
        })
        .setDescription(
          `O canal ${interaction.channel} teve \`${numero}\` mensagens deletadas por \`${interaction.user.username}\`.`
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      logger.logError('Erro no comando clear:', err);
      if (!interaction.replied)
        await interaction.reply({ content: '❌ Erro ao apagar mensagens.', ephemeral: true });
    }
  },
};
