const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');

const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avaliacaostaff')
    .setDescription('Envia a mensagem de avaliação de staff no canal.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // Apenas staff pode usar

  run: async (client, interaction, clientMongo) => {
    try {
      await interaction.deferReply({ ephemeral: true });
      // Checagem de permissão extra usando ROLE do .env
      const staffRoleId = process.env.STAFF_ROLE_ID;
      if (staffRoleId && !interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.editReply({
          content: '❌ Você não tem permissão para enviar avaliações de staff.',
        });
      }

      // Criação do botão
      const button = new ButtonBuilder()
        .setCustomId('avaliacaoStaffButton')
        .setLabel('✍️ Avaliar Staff')
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(button);

      // Embed profissional e moderna
      const embed = new EmbedBuilder()
        .setTitle('📋 Avaliação de Staff')
        .setColor('#1ABC9C')
        .setDescription(
          'Clique no botão abaixo para avaliar o atendimento de um staff.\n\n' +
            '💡 **Instruções:**\n' +
            '1️⃣ Preencha o nome ou ID do Discord do staff avaliado.\n' +
            '2️⃣ Dê uma nota de 0 a 10.\n' +
            '3️⃣ Escreva sua avaliação e sugestões se desejar.'
        )
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setFooter({
          text: `Sistema de Avaliação • Projeto Genoma`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      // Envia embed com botão
      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      logger.logError('avaliacaostaff', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro ao enviar avaliação de staff.' });
        else
          await interaction.followUp({
            content: '❌ Erro ao enviar avaliação de staff.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('avaliacaostaff_notify_error', e);
      }
    }
  },
};
