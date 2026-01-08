// comandos/conteudo.js
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('conteudo')
    .setDescription('📥 Exibe o painel de inscrição para criadores de conteúdo')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  run: async (client, interaction, clientMongo) => {
    const logger = require('../../Utils/logger');
    try {
      const guildIcon = interaction.guild.iconURL({ dynamic: true, size: 512 });

      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle('🚀 Torne-se um Criador Oficial do Projeto Genoma!')
        .setImage(
          'https://media.discordapp.net/attachments/1385726045034123445/1388227162384892006/raw.png?ex=686036cb&is=685ee54b&hm=5fe77e02558092a39ecaff942ec689c38760cad196ff2697d16c0501d15c0a85&=&format=webp&quality=lossless&width=1321&height=881'
        ) // Substitua pelo banner oficial, se tiver
        .setThumbnail(guildIcon)
        .setDescription(
          [
            '🎥 **Você produz conteúdo para YouTube, Twitch, TikTok ou outras plataformas?**',
            '',
            `O **${interaction.guild.name}** está recrutando criadores talentosos como você para fazer parte do nosso time oficial!`,
            '',
            '💎 **Vantagens exclusivas para Criadores Oficiais:**',
            '✅ Divulgação nas redes sociais e servidor',
            '✅ Suporte da equipe para eventos e produção de conteúdo',
            '✅ Acesso antecipado a novidades, atualizações e recursos especiais',
            '',
            '📝 **Como participar:**',
            'Clique no botão abaixo e preencha o formulário com atenção.',
            '🔍 Todas as inscrições serão avaliadas com cuidado pela nossa equipe!',
          ].join('\n')
        )
        .setFooter({
          text: `📢 ${interaction.guild.name} • Painel de Inscrição de Criadores`,
          iconURL: guildIcon,
        })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('abrir_modal_inscricao')
          .setLabel('📥 Enviar Inscrição')
          .setStyle(ButtonStyle.Success)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
    } catch (err) {
      logger.logError('conteudo', err);
      if (!interaction.replied)
        await interaction.reply({
          content: '❌ Erro ao exibir painel de conteúdo.',
          ephemeral: true,
        });
    }
  },
};
