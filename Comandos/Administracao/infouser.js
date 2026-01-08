const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserDataCollection } = require('../../database/mongodb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infouser')
    .setDescription('Pesquisar informações de um usuário pela SteamID ou Discord ID')
    .addStringOption(option =>
      option.setName('id').setDescription('SteamID ou Discord ID do usuário').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  run: async (client, interaction, clientMongo) => {
    const logger = require('../../Utils/logger');
    const searchId = interaction.options.getString('id');
    await interaction.deferReply({ ephemeral: true });
    try {
      const collection =
        clientMongo && clientMongo.db
          ? clientMongo.db('botdb').collection('users')
          : getUserDataCollection();

      const user = await collection.findOne({
        $or: [{ user_id: searchId }, { steamid: searchId }],
      });

      if (!user) {
        return interaction.editReply({ content: '❌ Usuário não encontrado.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(`Informações do Usuário`)
        .setColor('Blue')
        .addFields(
          { name: 'Nome', value: user.steamname || 'Não informado', inline: true },
          { name: 'Discord ID', value: user.user_id || 'Não informado', inline: true },
          { name: 'Steam ID', value: user.steamid || 'Não informado', inline: true },
          { name: 'Coins', value: user.coins?.toString() || '0', inline: true },
          { name: 'Despesa', value: user.despesa?.toString() || '0', inline: true },
          {
            name: 'Última Entrada',
            value: user.entrada ? user.entrada.toString() : 'Não informado',
            inline: true,
          },
          { name: 'Último Teleporte', value: user.teleporte || 'Não informado', inline: true }
        )
        .setTimestamp();

      interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.logError('infouser', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({
            content: '❌ Ocorreu um erro ao consultar o usuário.',
            ephemeral: true,
          });
        else
          await interaction.followUp({
            content: '❌ Ocorreu um erro ao consultar o usuário.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('infouser_notify_error', e);
      }
    }
  },
};
