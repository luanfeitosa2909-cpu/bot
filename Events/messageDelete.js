const { EmbedBuilder } = require('discord.js');
require('dotenv').config();
const { logError, logWarn } = require('../Utils/logger');

module.exports = {
  name: 'messageDelete',
  run: async (client, message) => {
    try {
      if (message.partial) return;
      if (message.author?.bot) return;

      const logChannelId = process.env.LOG_CHANNEL_MSGDELETE;
      if (!logChannelId) {
        logWarn('⚠️ LOG_CHANNEL_ID não configurado no .env');
        return;
      }

      const logChannel = message.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      let mensagemConteudo = message.content;
      if (!mensagemConteudo) {
        if (message.attachments.size > 0) {
          mensagemConteudo = '📎 *Mensagem continha anexo(s)*';
        } else if (message.embeds.length > 0) {
          mensagemConteudo = '🖼️ *Mensagem continha embed(s)*';
        } else {
          mensagemConteudo = '*Sem conteúdo visível*';
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#E02B2B')
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(`🗑️ **Mensagem deletada no canal <#${message.channel.id}>**`)
        .addFields(
          { name: '🆔 ID do Autor', value: `${message.author.id}`, inline: true },
          { name: '🕒 Deletada em', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          {
            name: '💬 Conteúdo',
            value:
              mensagemConteudo.length > 1024
                ? mensagemConteudo.slice(0, 1021) + '...'
                : mensagemConteudo,
          }
        )
        .setThumbnail('https://cdn-icons-png.flaticon.com/512/753/753345.png')
        .setFooter({ text: `ID da Mensagem: ${message.id}` })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erro no evento messageDelete:', error);
    }
  },
};
