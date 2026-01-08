const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banir um usuário e bloquear sua SteamID para registros futuros.')
    .addUserOption(option =>
      option.setName('user').setDescription('Usuário a ser banido').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('motivo').setDescription('Motivo do banimento').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    try {
      await interaction.deferReply({ ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.editReply({
          content: '❌ Você não possui permissão para usar este comando.',
          ephemeral: true,
        });
      }

      const userToBan = interaction.options.getUser('user');
      const motivo = interaction.options.getString('motivo') || 'Não definido.';
      const member = interaction.guild.members.cache.get(userToBan.id);

      if (!member)
        return interaction.editReply({
          content: '❌ Usuário não encontrado no servidor.',
          ephemeral: true,
        });
      if (!member.bannable)
        return interaction.editReply({
          content: '❌ Não posso banir este usuário (sem permissão).',
          ephemeral: true,
        });

      await member.ban({ reason: motivo });

      const steamIdKey = `steamid_${userToBan.id}`;
      const steamId = await db.get(steamIdKey);

      if (steamId) {
        let steamBanidos = (await db.get('steamid_banidos')) || [];
        if (!steamBanidos.includes(steamId)) {
          steamBanidos.push(steamId);
          await db.set('steamid_banidos', steamBanidos);
          logger.logInfo(`[BAN] SteamID ${steamId} adicionada à blacklist.`);
        }
      }

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setDescription(
          `✅ O usuário ${userToBan.tag} (${userToBan.id}) foi banido com sucesso!\nMotivo: ${motivo}`
        );

      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      logger.logError('ban', err);
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Ocorreu um erro ao processar o ban.');
      try {
        if (!interaction.replied)
          await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
        else await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } catch (e) {
        logger.logError('ban_notify_error', e);
      }
    }
  },
};
