const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserData, setUserData } = require('../../database/userData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('valor')
    .setDescription('💰 Adiciona uma quantia gasta para calcular o nível de apoiador.')
    .addNumberOption(option =>
      option.setName('valor').setDescription('Valor da despesa em R$').setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('usuário')
        .setDescription('Usuário para aplicar o valor (padrão: você)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction) {
    const logger = require('../../Utils/logger');
    try {
      await interaction.deferReply({ ephemeral: true });

      const targetUser = interaction.options.getUser('usuário') || interaction.user;
      const userId = targetUser.id;
      const valorInserido = interaction.options.getNumber('valor');

      if (valorInserido <= 0) {
        return interaction.editReply({
          content: '❌ O valor inserido deve ser maior que **0**.',
        });
      }

      // Obter dados do usuário
      const userData = (await getUserData(userId)) || {};
      const despesaAtual = Number(userData.despesa) || 0;

      // Somar valor novo
      const novaDespesa = despesaAtual + valorInserido;

      // Atualizar no banco
      await setUserData(userId, { despesa: novaDespesa });

      // Resposta
      await interaction.editReply({
        content: `✅ **Despesa registrada com sucesso!**\n👤 Usuário: **${
          targetUser.username
        }**\n💸 Valor adicionado: \`R$ ${valorInserido.toFixed(
          2
        )}\`\n📊 Total acumulado: \`R$ ${novaDespesa.toFixed(2)}\``,
      });
    } catch (error) {
      logger.logError('valor', error);
      try {
        if (!interaction.replied)
          await interaction.editReply({
            content: '❌ Ocorreu um erro ao adicionar a despesa. Tente novamente.',
          });
      } catch (e) {
        logger.logError('valor_notify_error', e);
      }
    }
  },
};
