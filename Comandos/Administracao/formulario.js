const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('formulario')
    .setDescription('📥 Exibe o painel de inscrição para se tornar staff')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  run: async (client, interaction, clientMongo) => {
    const logger = require('../../Utils/logger');
    try {
      await interaction.deferReply({ ephemeral: true });
      const guildIcon = interaction.guild.iconURL({ dynamic: true, size: 512 });

      const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle(`🛡️ Torne-se um Staff do ${interaction.guild.name}!`)
        .setThumbnail(guildIcon)
        .setImage(
          'https://media.discordapp.net/attachments/1385726045034123445/1388238944289820672/raw.png?ex=686041c4&is=685ef044&hm=d6cd754c67c35b118aace11ee7d2f22820cf1acd0f8752e06b2456c1feae48d7&=&format=webp&quality=lossless&width=1321&height=881'
        )
        .setDescription(
          [
            'Você tem interesse em ajudar a comunidade, organizar eventos ou moderar o servidor?',
            '',
            '**Estamos em busca de pessoas responsáveis, maduras e comprometidas!**',
            '',
            '> 💼 O cargo de **Staff do Discord** funciona como uma experiência. Se você demonstrar responsabilidade, presença e comprometimento, poderá ser promovido para **Administrador Evrima**.',
            '',
            '🧩 **Requisitos:**',
            '• Ter tempo disponível e se manter presente no servidor',
            '• Saber trabalhar em equipe',
            '• Conhecer bem as regras do servidor',
            '• Ter responsabilidade, empatia e bom senso',
            '',
            '📝 **Como se inscrever?**',
            'Clique no botão abaixo e preencha o formulário com atenção.',
            'Responder com sinceridade aumenta suas chances!',
          ].join('\n')
        )
        .setFooter({
          text: `${interaction.guild.name} • Formulário de Equipe`,
          iconURL: guildIcon,
        })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('abrir_modal_staff')
          .setLabel('📥 Enviar Inscrição')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      logger.logError('Erro no comando formulario:', err);
      if (!interaction.replied)
        await interaction.reply({ content: '❌ Erro ao exibir formulário.', ephemeral: true });
    }
  },
};
