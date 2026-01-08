require('dotenv').config();
const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { logError, logInfo, logWarn } = require('../Utils/logger');

const AUTOROLE = process.env.AUTOROLE;
const LOGS_CHANNEL_WELCOME = process.env.LOGS_CHANNEL_WELCOME;
const CHANNEL_HELP = process.env.CHANNEL_HELP;
const CHANNEL_REGRAS = process.env.CHANNEL_REGRAS;

module.exports = {
  name: Events.GuildMemberAdd,
  run: async (client, member) => {
    // Autorole
    const role = member.guild.roles.cache.get(AUTOROLE);
    if (role) {
      try {
        await member.roles.add(role.id);
      } catch (err) {
        logError(`❌ Não foi possível adicionar o cargo ao usuário ${member.user.tag}:`, err);
      }
    } else {
      logWarn('❌ O cargo de autorole não foi encontrado no cache.');
    }

    // Embed de boas-vindas
    const channel = member.guild.channels.cache.get(LOGS_CHANNEL_WELCOME);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🌋 Projeto Genoma | Bem-vindo(a)!')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setImage(
          'https://cdn.discordapp.com/attachments/123456789012345678/123456789012345678/genoma_banner.png'
        )
        .addFields(
          {
            name: '👋 Saiba que...',
            value: `Atualmente temos **${member.guild.memberCount} membros** no servidor!`,
            inline: true,
          },
          {
            name: '🏷️ Tag do Usuário',
            value: `\`${member.user.tag}\` (${member.id})`,
            inline: true,
          },
          {
            name: '🆘 Precisa de ajuda?',
            value: `Chame a equipe em: <#${CHANNEL_HELP}>`,
            inline: true,
          },
          {
            name: '⚠️ Evite punições!',
            value: `Leia as nossas 📜 <#${CHANNEL_REGRAS}> para evitar punições.`,
            inline: true,
          }
        )
        .setFooter({ text: `${member.guild.name} • © Todos os direitos reservados` })
        .setTimestamp();

      // Cria os botões de link
      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Verificação')
          .setStyle(ButtonStyle.Link)
          .setURL('https://discord.com/channels/1353437609682276443/1353475845062398093'),

        new ButtonBuilder()
          .setLabel('Regras')
          .setStyle(ButtonStyle.Link)
          .setURL('https://discord.com/channels/1353437609682276443/1353475836598030367'),

        new ButtonBuilder()
          .setLabel('Suporte')
          .setStyle(ButtonStyle.Link)
          .setURL('https://discord.com/channels/1353437609682276443/1353512604353433741')
      );

      await channel.send({ content: `${member}`, embeds: [embed], components: [buttons] });
    } else {
      console.log('❌ Canal de boas-vindas não encontrado.');
    }
  },
};
