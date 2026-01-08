const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGlobalData } = require('../../database/globalData');
const { logError } = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verificar-recompensa')
    .setDescription('🎯 Veja quanto você está ganhando por hora em call (Caçada ativa ou não)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    try {
      const cacadaAtiva = await getGlobalData('cacada');
      const coinsPorHora = cacadaAtiva ? 800 : 400;

      const embed = new EmbedBuilder()
        .setTitle('💰 Recompensa por Hora em Call')
        .setColor(cacadaAtiva ? '#27ae60' : '#e74c3c')
        .setDescription(
          cacadaAtiva
            ? '🦖 **Modo Caçada ATIVO!**\nVocê está ganhando **800 coins/hora** em chamadas de voz.'
            : '🌙 **Modo Caçada DESATIVADO.**\nVocê está ganhando **400 coins/hora** em chamadas de voz.'
        )
        .setFooter({
          text: `Solicitado por ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: 1 << 6,
      });
    } catch (error) {
      logError('❌ Erro ao buscar o status da caçada:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao tentar verificar a recompensa.',
        flags: 1 << 6,
      });
    }
  },
};
