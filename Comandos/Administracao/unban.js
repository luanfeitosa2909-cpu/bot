const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Desbanir um usuário e liberar sua SteamID')
    .addUserOption(option =>
      option.setName('user').setDescription('Usuário a ser desbanido').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('motivo').setDescription('Motivo do desbanimento').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async run(client, interaction, _clientMongo) {
    await interaction.deferReply({ ephemeral: true });
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.editReply({
        content: '❌ Você não tem permissão para usar este comando.',
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser('user');
    const motivo = interaction.options.getString('motivo') || 'Não definido';

    try {
      const banInfo = await interaction.guild.bans.fetch(user.id).catch(() => null);
      if (!banInfo) {
        return interaction.editReply({
          content: `❌ O usuário ${user.tag} não está banido.`,
          ephemeral: true,
        });
      }

      const bannedSteamKey = `banned_steamid_${user.id}`;
      const steamidBanido = await db.get(bannedSteamKey);
      if (steamidBanido) {
        await db.delete(bannedSteamKey);
      }

      await interaction.guild.members.unban(user.id, motivo);

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('🔓 Usuário Desbanido')
        .setDescription(`O usuário ${user.tag} (\`${user.id}\`) foi desbanido com sucesso!`)
        .addFields(
          { name: 'Motivo', value: motivo },
          {
            name: 'SteamID liberada',
            value: steamidBanido
              ? `\`${steamidBanido}\``
              : 'Nenhuma SteamID registrada para esse banimento.',
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Desbanido por ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.logError('unban', error);

      const embedErro = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Falha ao desbanir usuário')
        .setDescription(
          `Não foi possível desbanir ${user?.tag || 'usuário'}.\nErro: \`${error.message}\``
        )
        .setTimestamp();

      try {
        if (!interaction.replied)
          return interaction.editReply({ embeds: [embedErro], ephemeral: true });
        return interaction.followUp({ embeds: [embedErro], ephemeral: true });
      } catch (e) {
        logger.logError('unban_notify_error', e);
      }
    }
  },
};
