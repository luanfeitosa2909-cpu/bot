const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserDataCollection } = require('../../database/mongodb.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinsrank')
    .setDescription('📊 Exibe o ranking dos usuários com mais coins')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  run: async (client, interaction, clientMongo) => {
    const logger = require('../../Utils/logger');
    await interaction.deferReply({ ephemeral: true });

    try {
      const collection = getUserDataCollection();

      const topUsersRaw = await collection
        .find({ coins: { $gt: 0 } })
        .sort({ coins: -1 })
        .toArray();

      // Busca todos os membros do servidor
      const members = await interaction.guild.members.fetch();

      // Filtra para manter apenas quem está no servidor
      const topUsers = topUsersRaw.filter(user => members.has(user.user_id)).slice(0, 10);

      if (!topUsers.length) {
        return interaction.editReply({
          content: '⚠️ Nenhum usuário válido com coins encontrado no servidor.',
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🏆 Ranking de Coins — ${interaction.guild.name}`)
        .setColor('#F1C40F')
        .setTimestamp()
        .setFooter({
          text: 'Top 10 usuários com mais coins (membros ativos)',
          iconURL: client.user.displayAvatarURL(),
        });

      // Só adiciona thumbnail se o servidor tiver ícone
      const icon = interaction.guild.iconURL({ dynamic: true });
      if (icon) embed.setThumbnail(icon);

      topUsers.forEach((user, index) => {
        const member = members.get(user.user_id);
        embed.addFields({
          name: `#${index + 1} — ${member.user.tag}`,
          value: `👤 <@${user.user_id}>  •  💰 Coins: \`${user.coins.toLocaleString()}\``,
          inline: false,
        });
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.logError('Erro ao buscar ranking de coins:', error);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao buscar os dados do ranking.',
        ephemeral: true,
      });
    }
  },
};
