const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('🎫 Exibe o painel de tickets para suporte')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async run(client, interaction, _clientMongo) {
    const logger = require('../../Utils/logger');
    try {
      await interaction.deferReply({ ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.editReply({
          content: '🚫 Você não possui permissão para usar este comando.',
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#6a0dad')
        .setAuthor({
          name: interaction.guild.name,
          iconURL: interaction.guild.iconURL({ dynamic: true }),
        })
        .setTitle('📬 Bem-vindo à Central de Tickets!')
        .setDescription(
          [
            '👋 Precisa de ajuda? Abra um ticket e fale diretamente com a nossa equipe de suporte.',
            '',
            '**📌 Instruções:**',
            '1️⃣ Escolha abaixo o motivo do seu ticket.',
            '2️⃣ Aguarde um membro da equipe responder.',
            '3️⃣ Quando resolvido, o ticket será fechado automaticamente.',
            '',
            '⚠️ Evite abrir múltiplos tickets para o mesmo assunto!',
          ].join('\n')
        )
        .addFields({
          name: '💡 Dica Rápida',
          value: 'Antes de abrir um ticket, veja se sua dúvida já está no canal `#📚・faq`.',
        })
        .setFooter({
          text: `Sistema de Suporte • ${interaction.guild.name}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp()
        .setImage(
          'https://media.discordapp.net/attachments/1385726045034123445/1385733238429061251/raw.png'
        );

      const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('ticket_select_menu')
          .setPlaceholder('📂 Selecione a categoria do seu atendimento')
          .addOptions(
            {
              label: 'Suporte Técnico',
              description: 'Dúvidas técnicas e ajuda com o servidor.',
              value: 'ticket_suporte',
              emoji: '🛠️',
            },
            {
              label: 'Compras e Pagamentos',
              description: 'Suporte com produtos ou pagamentos.',
              value: 'ticket_compras',
              emoji: '🛒',
            },
            {
              label: 'Denúncias',
              description: 'Reportar comportamentos indevidos.',
              value: 'ticket_denuncia',
              emoji: '🚨',
            }
          )
      );

      const faqButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('faq_button')
          .setLabel('📘 Acessar FAQ')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ content: '✅ Painel de tickets enviado com sucesso!' });

      await interaction.channel.send({ embeds: [embed], components: [selectMenu, faqButton] });
    } catch (err) {
      logger.logError('ticket', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro ao abrir painel de tickets.' });
        else
          await interaction.followUp({
            content: '❌ Erro ao abrir painel de tickets.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('ticket_notify_error', e);
      }
    }
  },
};
