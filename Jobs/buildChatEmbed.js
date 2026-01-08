const { EmbedBuilder } = require('discord.js');
const { parseDate } = require('./dateParser');

const CHAT_REGEX =
  /^\[(.+?)\]\[LogTheIsleChatData\]: \[(Global|Local|Group|System)\](?: \[GROUP-\d+\])? (.+?) \[(\d+)\]: (.*)$/;

const MAX_FIELD = 1024;

module.exports = function buildChatEmbed(line) {
  if (!line || typeof line !== 'string') return null;

  const match = line.match(CHAT_REGEX);
  if (!match) return null;

  const [, nameRaw, steamId, messageRaw] = match;

  const name = nameRaw?.trim() || 'Desconhecido';
  const message = messageRaw?.trim() || '*sem conteúdo*';

  const dateMatch = line.match(/\[(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2})\]/);
  const date = parseDate(dateMatch?.[1]) || new Date();

  const safeMessage = message.length > MAX_FIELD ? message.slice(0, MAX_FIELD - 20) + '…' : message;

  return new EmbedBuilder()
    .setTitle('💬 Mensagem Global')
    .setColor(0xffa500)
    .addFields(
      { name: 'Usuário', value: name, inline: true },
      { name: 'SteamID', value: steamId, inline: true },
      { name: 'Mensagem', value: safeMessage, inline: false }
    )
    .setTimestamp(date)
    .setFooter({ text: 'The Isle EVRIMA Logs' });
};
