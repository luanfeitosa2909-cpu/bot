const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');

const { getUserData, setUserData } = require('../../database/userData');
const logger = require('../../Utils/logger');

module.exports = {
  type: 'button',
  customId: null,
  match: id => id === 'solicitargrow' || id.startsWith('atender_grow_'),

  run: async (client, interaction) => {
    const id = interaction.customId;
    const userId = interaction.user.id;

    // =====================
    // Solicitar Grow
    // =====================
    if (id === 'solicitargrow') {
      const userData = await getUserData(userId);

      if (!userData.steamid) {
        return interaction.reply({
          content:
            '❌ Você ainda não verificou sua SteamID. Vá para <#1353475845062398093> antes de solicitar um Grow.',
          flags: 1 << 6,
        });
      }

      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
      if (!isAdmin && userData.grow) {
        return interaction.reply({
          content: '⚠️ Você já solicitou seu Grow.',
          flags: 1 << 6,
        });
      }

      if (!isAdmin) {
        await setUserData(userId, { grow: true });
      }

      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('🎉 Grow Solicitado!')
        .setDescription(`🔗 SteamID: \`${userData.steamid}\``)
        .setFooter({ text: `${interaction.guild.name} • Sistema de Grows` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 1 << 6 });

      // Log para canal da staff
      const canalLog = client.channels.cache.get(process.env.LOG_CHANNEL_GROW_FREE);
      if (canalLog?.isTextBased()) {
        const timestamp = Math.floor(Date.now() / 1000);

        const logEmbed = new EmbedBuilder()
          .setTitle('🟩 Nova Solicitação de Grow')
          .setColor('#2ecc71')
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            {
              name: '👤 Usuário',
              value: `<@${userId}> \`(${userId})\``,
              inline: false,
            },
            {
              name: '🆔 SteamID',
              value: `\`${userData.steamid || 'Não definido'}\``,
              inline: false,
            },
            {
              name: '📅 Solicitado em',
              value: `<t:${timestamp}:F>`,
              inline: false,
            },
            {
              name: '📊 Status',
              value: '⏳ Pendente',
              inline: false,
            }
          )
          .setFooter({
            text: `Sistema de Logs • ${interaction.guild.name}`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`atender_grow_${userId}`)
            .setLabel('✅ Marcar como Atendido')
            .setStyle(ButtonStyle.Success)
        );

        const staffRoleId = process.env.STAFF_ROLE_ID;
        await canalLog.send({
          content: `<@&${staffRoleId}>`,
          embeds: [logEmbed],
          components: [row],
          allowedMentions: {
            roles: [staffRoleId],
            parse: [], // impede o Discord de ignorar a menção
          },
        });
      }

      logger.logInfo(`Grow solicitado por ${userId}`);
      return;
    }

    // =====================
    // Atender Grow
    // =====================
    if (id.startsWith('atender_grow_')) {
      const alvoId = id.replace('atender_grow_', '');
      const isStaff = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);

      if (!isStaff) {
        return interaction.reply({
          content: '❌ Apenas para membros da staff.',
          flags: 1 << 6,
        });
      }

      // Nome do atendente (menção)
      const staffMention = `<@${interaction.user.id}>`;
      // Data formatada
      const dataAtendimento = new Date();
      const dataFormatada = dataAtendimento.toLocaleString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Atualiza a mensagem no canal da staff para "Atendido"
      await interaction.update({
        embeds: [
          EmbedBuilder.from(interaction.message.embeds[0]).spliceFields(3, 1, {
            name: '📊 Status',
            value: `✅ Atendido por ${staffMention} em ${dataFormatada}`,
            inline: false,
          }),
        ],
        components: [],
      });

      try {
        const user = await client.users.fetch(alvoId);

        const dm = new EmbedBuilder()
          .setTitle('✅ Seu Grow foi Atendido!')
          .setDescription(
            [
              '🎉 **Parabéns!**',
              '',
              'Sua solicitação de Grow foi **concluída** pela equipe!',
              '🐾 Aproveite sua evolução no mundo dos dinossauros em **The Isle**!',
              '',
              `👤 **Atendido por:** ${staffMention}`,
              `📅 **Data:** ${dataFormatada}`,
              '',
              '> Se tiver dúvidas ou problemas, entre em contato com o suporte.',
            ].join('\n')
          )
          .setColor('#00b894')
          .setThumbnail(
            'https://cdn.discordapp.com/emojis/1200130730543241246.webp?size=96&quality=lossless'
          )
          .setFooter({
            text: `${interaction.guild.name} • Sistema de Grows`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp();

        await user.send({ embeds: [dm] });
        logger.logInfo(`DM de Grow atendido enviada para ${alvoId} por ${staffMention}`);
      } catch (err) {
        logger.logWarn(`⚠️ Não foi possível enviar DM para ${alvoId}`);
      }
    }
  },
};
