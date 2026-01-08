// commands/admin/updateid.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateUserIdOrSteamId } = require('../../database/userUpdater');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('updateid')
    .setDescription('Atualiza o Discord ID ou Steam ID de um usuário no banco')
    .addStringOption(option =>
      option
        .setName('tipo')
        .setDescription('Qual campo deseja atualizar?')
        .setRequired(true)
        .addChoices(
          { name: 'Discord ID', value: 'user_id' },
          { name: 'Steam ID', value: 'steamid' }
        )
    )
    .addStringOption(option =>
      option
        .setName('valor_antigo')
        .setDescription('Valor atual (Discord ID ou SteamID)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('valor_novo')
        .setDescription('Novo valor (Discord ID ou SteamID)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  run: async (client, interaction, _clientMongo) => {
    const logger = require('../../Utils/logger');
    await interaction.deferReply({ ephemeral: true });
    try {
      const tipo = interaction.options.getString('tipo'); // "user_id" ou "steamid"
      const valorAntigo = interaction.options.getString('valor_antigo');
      const valorNovo = interaction.options.getString('valor_novo');

      // Filtro para encontrar o usuário pelo valor antigo
      const filter = { [tipo]: valorAntigo };

      // Atualização: troca pelo novo valor
      const updates = { [tipo]: valorNovo };

      const ok = await updateUserIdOrSteamId(filter, updates);

      if (ok) {
        await interaction.editReply({
          content: `✅ ${tipo} atualizado de \`${valorAntigo}\` para \`${valorNovo}\`.`,
          ephemeral: true,
        });
        logger.logInfo(
          'updateid',
          `Atualizado ${tipo} de ${valorAntigo} para ${valorNovo} por ${interaction.user.tag}`
        );
      } else {
        await interaction.editReply({
          content: `⚠️ Nenhum usuário encontrado com ${tipo} = \`${valorAntigo}\`.`,
          ephemeral: true,
        });
      }
    } catch (err) {
      logger.logError('updateid', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({
            content: '❌ Ocorreu um erro ao atualizar o usuário.',
            ephemeral: true,
          });
        else
          await interaction.followUp({
            content: '❌ Ocorreu um erro ao atualizar o usuário.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('updateid_notify_error', e);
      }
    }
  },
};
