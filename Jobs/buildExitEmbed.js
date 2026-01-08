const { EmbedBuilder } = require('discord.js');
const { parseDate } = require('./dateParser');

const EXIT_REGEX =
  /LogTheIsleJoinData:.*?\s(.+?)\s\[(\d+)\]\sLeft The Server while( not)? being safelogged,?\sWas playing as:\s(.+?),\sGender:\s(.+?),\sGrowth:\s([\d.]+)/s;

module.exports = function buildExitEmbed(line) {
  if (!line || typeof line !== 'string') return null;

  const match = line.match(EXIT_REGEX);
  if (!match) return null;

  const [, name, steamId, notSafelogged, dino, gender, growth] = match;

  const dateMatch = line.match(/\[(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2})\]/);
  const date = parseDate(dateMatch?.[1]) || new Date();

  return new EmbedBuilder()
    .setTitle('🚪 Saída do Servidor')
    .setColor(notSafelogged ? 0xff4500 : 0x00ff00)
    .addFields(
      { name: 'Usuário', value: name || 'Desconhecido', inline: true },
      { name: 'SteamID', value: steamId || 'Desconhecido', inline: true },
      { name: 'Dino', value: dino, inline: true },
      { name: 'Gênero', value: gender, inline: true },
      { name: 'Growth', value: growth, inline: true },
      {
        name: 'Safelogged?',
        value: notSafelogged ? '❌ Não' : '✅ Sim',
        inline: true,
      }
    )
    .setTimestamp(date)
    .setFooter({ text: 'The Isle EVRIMA Logs' });
};
