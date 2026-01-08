const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antilink')
    .setDescription('Ative ou desative o sistema de antilink no servidor.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    const logger = require('../../Utils/logger');
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ Você não possui permissão para utilizar este comando.',
          ephemeral: true,
        });
      }

      const configVal = await db.get(`antilink_${interaction.guild.id}`);

      if (configVal === true) {
        await db.set(`antilink_${interaction.guild.id}`, false);
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setDescription(`Olá ${interaction.user}, o sistema de antilink foi \`desativado\`.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        await db.set(`antilink_${interaction.guild.id}`, true);
        const embed = new EmbedBuilder()
          .setColor('Green')
          .setDescription(`Olá ${interaction.user}, o sistema de antilink foi \`ativado\`.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (err) {
      logger.logError('Erro no comando antilink:', err);
      if (!interaction.replied)
        await interaction.reply({
          content: '❌ Erro interno ao alternar antilink.',
          ephemeral: true,
        });
    }
  },
};
