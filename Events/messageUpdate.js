const { EmbedBuilder } = require('discord.js');
require('dotenv').config();
const { logWarn } = require('../Utils/logger');

module.exports = {
  name: 'messageUpdate',
  run: async (client, oldMessage, newMessage) => {
    try {
      if (oldMessage.partial || newMessage.partial) return;
      if (oldMessage.author?.bot) return;
      if (oldMessage.content === newMessage.content) return;

      const logChannelId = process.env.LOG_CHANNEL_MSGUPDATE;
      if (!logChannelId) {
        logWarn('⚠️ LOG_CHANNEL_ID não configurado no .env');
        return;
      }

      const logChannel = newMessage.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const oldContent = oldMessage.content || '*Sem texto*';
      const newContent = newMessage.content || '*Sem texto*';

      const maxLength = 1024;
      const formatContent = content =>
        content.length > maxLength ? content.slice(0, maxLength - 3) + '...' : content;

      const embed = new EmbedBuilder()
        .setColor('#FAA61A') // laranja vibrante
        .setAuthor({
          name: oldMessage.author.tag,
          iconURL: oldMessage.author.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(`✏️ **Mensagem editada no canal <#${oldMessage.channel.id}>**`)
        .addFields(
          { name: '🆔 ID do Autor', value: `${oldMessage.author.id}`, inline: true },
          { name: '🕒 Editada em', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          { name: '💬 Antes', value: formatContent(oldContent) },
          { name: '💬 Depois', value: formatContent(newContent) }
        )
        .setFooter({ text: `ID da Mensagem: ${oldMessage.id}` })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erro no evento messageUpdate:', error);
    }
  },
};
