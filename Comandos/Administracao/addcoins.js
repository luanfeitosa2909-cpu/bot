const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserData, setUserData } = require('../../database/userData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addcoins')
    .setDescription('Adiciona coins ao saldo de um membro (Admin apenas).')
    .addUserOption(option =>
      option.setName('usuario').setDescription('Membro para adicionar coins').setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('quantidade')
        .setDescription('Quantidade de coins a adicionar')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

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
      const novoSaldo = saldoAtual + quantidade;

      await setUserData(user.id, { coins: novoSaldo });

      await interaction.editReply({
        content: `✅ Adicionado **${quantidade} coins** para ${user}. Novo saldo: **${novoSaldo} coins**.`,
      });
    } catch (err) {
      logger.logError('addcoins', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro interno ao adicionar coins.' });
        else
          await interaction.followUp({
            content: '❌ Erro interno ao adicionar coins.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('addcoins_notify_error', e);
      }
    }
  },
};
