const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');

const { getUserData, setUserData } = require('../../database/userData');
const logger = require('../../Utils/logger');

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 horas

module.exports = {
  type: 'button',
  customId: null,
  match: id => id === 'solicitarslay' || id.startsWith('atender_slay_'),

  run: async (client, interaction) => {
    const id = interaction.customId;
    const userId = interaction.user.id;

    if (id === 'solicitarslay') {
      const userData = await getUserData(userId);

      if (!userData.steamid) {
        return interaction.reply({
          content:
            '❌ Você ainda não verificou sua SteamID. Vá para <#1353475845062398093> antes de solicitar um Slay.',
          flags: 1 << 6,
        });
      }

      const now = Date.now();
      const lastSlayTime = userData.lastSlayTimestamp || 0;
      const diff = now - lastSlayTime;

      if (diff < COOLDOWN_MS) {
        const timeLeft = COOLDOWN_MS - diff;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return interaction.reply({
          content: `⏳ Você está em cooldown para solicitar Slay. Tente novamente em ${hours}h ${minutes}m.`,
          flags: 1 << 6,
        });
      }

      // Atualiza o timestamp do último slay
      await setUserData(userId, { lastSlayTimestamp: now });

      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('⚔️ Slay Solicitado!')
        .setDescription(`🔗 SteamID: \`${userData.steamid}\``)
        .setFooter({ text: `${interaction.guild.name} • Sistema de Slays` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 1 << 6 });

      // Log para canal da staff
      const canalLog = client.channels.cache.get(process.env.LOGS_CHANNEL_SLAY);
      if (canalLog?.isTextBased()) {
        const timestamp = Math.floor(now / 1000);

        const logEmbed = new EmbedBuilder()
          .setTitle('🟥 Nova Solicitação de Slay')
          .setColor('#e74c3c')
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
            .setCustomId(`atender_slay_${userId}`)
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
            parse: [],
          },
        });
      }

      logger.logInfo(`Slay solicitado por ${userId}`);
      return;
    }

    // Atendimento continua igual
    if (id.startsWith('atender_slay_')) {
      const alvoId = id.replace('atender_slay_', '');
      const isStaff = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);

      if (!isStaff) {
        return interaction.reply({
          content: '❌ Apenas para membros da staff.',
          flags: 1 << 6,
        });
      }

      const staffMention = `<@${interaction.user.id}>`;
      const dataAtendimento = new Date();
      const dataFormatada = dataAtendimento.toLocaleString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

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
          .setTitle('✅ Seu Slay foi Atendido!')
          .setDescription(
            [
              '🎉 **Parabéns!**',
              '',
              'Sua solicitação de Slay foi **concluída** pela equipe!',
              '🐾 Aproveite sua vitória no mundo dos dinossauros em **The Isle**!',
              '',
              `👤 **Atendido por:** ${staffMention}`,
              `📅 **Data:** ${dataFormatada}`,
              '',
              '> Se tiver dúvidas ou problemas, entre em contato com o suporte.',
            ].join('\n')
          )
          .setColor('#d63031')
          .setThumbnail(
            'https://cdn.discordapp.com/emojis/1200130730543241246.webp?size=96&quality=lossless'
          )
          .setFooter({
            text: `${interaction.guild.name} • Sistema de Slays`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp();

        await user.send({ embeds: [dm] });
        logger.logInfo(`DM de Slay atendido enviada para ${alvoId} por ${staffMention}`);
      } catch (err) {
        logger.logWarn(`⚠️ Não foi possível enviar DM para ${alvoId}`);
      }
    }
  },
};
