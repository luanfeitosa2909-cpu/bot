const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const { logError } = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bugs')
    .setDescription('🐞 Envia o painel para reportar bugs no servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    try {
      const bugImage = null;

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🐞 Sistema de Reportar Bugs')
        .setDescription(
          [
            'Para **reportar** um bug que encontrou clique no botão abaixo.',
            '```\nApós isso irá aparecer uma tela para você colocar seu report e caso tenha uma imagem de exemplo coloque o link direto dela também.\n```',
            'Obrigado por contribuir com esse report para o servidor.',
          ].join('\n')
        )
        .setFooter({ text: `${interaction.guild.name} • Todos os direitos reservados` });

      if (bugImage) embed.setImage(bugImage);

      const button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('report_bug')
          .setLabel('Reportar Bug')
          .setEmoji('🐞')
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({ embeds: [embed], components: [button] });
    } catch (err) {
      logError('Erro no comando bugs:', err);
      if (!interaction.replied) {
        await interaction.reply({ content: '❌ Erro ao exibir painel de bugs.', ephemeral: true });
      }
    }
  },
};
