const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserData, setUserData } = require('../../database/userData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removecoins')
    .setDescription('Remove coins do saldo de um membro')
    .addUserOption(option =>
      option.setName('usuario').setDescription('Membro para remover coins').setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('quantidade').setDescription('Quantidade de coins a remover').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async run(client, interaction, _clientMongo) {
    const logger = require('../../Utils/logger');
    await interaction.deferReply({ ephemeral: true });
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({
          content: '❌ Você não tem permissão para usar este comando.',
        });
      }

      const user = interaction.options.getUser('usuario');
      const quantidade = interaction.options.getInteger('quantidade');

      const userData = await getUserData(user.id);
      const saldoAtual = userData.coins || 0;
      const novoSaldo = Math.max(saldoAtual - quantidade, 0);

      await setUserData(user.id, { coins: novoSaldo });

      await interaction.editReply({
        content: `✅ Removido **${quantidade} coins** de ${user}. Novo saldo: **${novoSaldo} coins**.`,
      });
    } catch (err) {
      logger.logError('removecoins', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro interno ao remover coins.' });
        else
          await interaction.followUp({
            content: '❌ Erro interno ao remover coins.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('removecoins_notify_error', e);
      }
    }
  },
};
