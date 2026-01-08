const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sugestao')
    .setDescription('Envie uma mensagem para sugestões no servidor (apenas admins)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // já limita no registro

  async run(client, interaction, _clientMongo) {
    try {
      await interaction.deferReply();

      const button = new ButtonBuilder()
        .setCustomId('abrir_sugestao')
        .setLabel('💡 Enviar Sugestão')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝');

      const row = new ActionRowBuilder().addComponents(button);

      const thumbnailUrl =
        interaction.guild.iconURL({ dynamic: true, size: 1024 }) ||
        'https://cdn-icons-png.flaticon.com/512/1828/1828911.png';

      const embed = new EmbedBuilder()
        .setTitle('💡 Queremos ouvir você!')
        .setDescription(
          'Aqui é o seu espaço para ajudar a **melhorar nosso servidor**!\n' +
            'Sua sugestão pode transformar a comunidade e trazer novidades incríveis. 🚀\n\n' +
            '**Como participar?**\n' +
            'Clique no botão abaixo para enviar sua ideia de forma rápida e fácil. 🤩'
        )
        .setColor('#FF0000')
        .setThumbnail(thumbnailUrl)
        .addFields(
          {
            name: '📝 Dicas para sua sugestão',
            value:
              '- Seja claro e objetivo\n- Explique o motivo\n- Seja respeitoso\n- Quanto mais detalhes, melhor!',
          },
          {
            name: '📢 O que acontece depois?',
            value:
              'Nossa equipe analisará cuidadosamente todas as sugestões e poderá implementar as melhores! Fique de olho nas atualizações.',
          }
        )
        .setFooter({ text: `Sistema de Sugestões • ${interaction.guild.name}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      const { logError } = require('../../Utils/logger');
      logError('Erro ao enviar embed de sugestão:', error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Ocorreu um erro ao tentar enviar a sugestão.',
          flags: 1 << 6,
        });
      } else {
        try {
          await interaction.editReply({
            content: '❌ Ocorreu um erro ao tentar enviar a sugestão.',
            embeds: [],
            components: [],
          });
          // eslint-disable-next-line no-empty
        } catch {}
      }
    }
  },
};
