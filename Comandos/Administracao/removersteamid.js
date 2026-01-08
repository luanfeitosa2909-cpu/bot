const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getUserData } = require('../../database/userData');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removersteamid')
    .setDescription('Remove a SteamID64 de um usuário da database (Admin apenas).')
    .addUserOption(option =>
      option.setName('usuario').setDescription('Usuário para remover a SteamID64').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),
  async run(client, interaction, clientMongo) {
    try {
      await interaction.deferReply({ ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({
          content: '❌ Você não tem permissão para usar este comando.',
          ephemeral: true,
        });
      }

      const user = interaction.options.getUser('usuario');
      const userData = await getUserData(user.id);

      if (!userData?.steamid) {
        return interaction.editReply({
          content: `❌ O usuário ${user.tag} não possui SteamID64 registrada.`,
          ephemeral: true,
        });
      }

      const db = clientMongo.db('ProjetoGenoma');
      await db
        .collection('DataBase')
        .updateOne(
          { user_id: user.id },
          { $unset: { steamid: '', steamname: '', steamidTimestamp: '' } }
        );
      logger.logInfo(
        `Admin ${interaction.user.tag} removeu SteamID ${userData.steamid} de ${user.tag}`
      );

      const embed = new EmbedBuilder()
        .setTitle('🗑️ SteamID64 Removida')
        .setDescription(`A SteamID64 de ${user.tag} foi removida com sucesso.`)
        .setColor('Red')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed], ephemeral: true });

      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('⚠️ SteamID64 Removida')
          .setDescription(
            'Sua SteamID64 foi removida do sistema por um administrador. Use /verificarsteamid para registrar novamente.'
          )
          .setColor('Orange')
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] });
      } catch {
        // usuário com DM fechada
      }
    } catch (err) {
      logger.logError('removersteamid', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({
            content: '❌ Erro ao remover a SteamID64.',
            ephemeral: true,
          });
        else
          await interaction.followUp({
            content: '❌ Erro ao remover a SteamID64.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('removersteamid_notify_error', e);
      }
    }
  },
};
