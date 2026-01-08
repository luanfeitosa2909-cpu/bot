const { EmbedBuilder } = require('discord.js');
const { parseDate } = require('./dateParser');

const KILL_REGEX =
  /LogTheIsleKillData:.*?\[(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2})\]\s(.+?)\s\[(\d+)\]\sDino:\s(.+?),\s(.+?),\s([\d.]+)\s-\sKilled the following player:\s(.+?),\s\[(\d+)\],\sDino:\s(.+?),\sGender:\s(.+?),\sGrowth:\s([\d.]+),\s+at:\s(.+)/s;

module.exports = function buildKillEmbed(line) {
  if (!line || typeof line !== 'string') return null;

  const match = line.match(KILL_REGEX);
  if (!match) return null;

  const [
    ,
    dateRaw,
    killerName,
    killerId,
    killerDino,
    killerGender,
    killerGrowth,
    victimName,
    victimId,
    victimDino,
    victimGender,
    victimGrowth,
    location,
  ] = match;

  const date = parseDate(dateRaw) || new Date();

  return new EmbedBuilder()
    .setTitle('⚔️ Assassinato Registrado')
    .setColor(0xff4500)
    .addFields(
      {
        name: 'Assassino',
        value: `${killerName} (${killerDino}, ${killerGender})`,
        inline: true,
      },
      { name: 'SteamID Assassino', value: killerId, inline: true },
      {
        name: 'Vítima',
        value: `${victimName} (${victimDino}, ${victimGender})`,
        inline: true,
      },
      { name: 'SteamID Vítima', value: victimId, inline: true },
      { name: 'Growth da Vítima', value: victimGrowth, inline: true },
      { name: 'Localização', value: location, inline: false }
    )
    .setTimestamp(date)
    .setFooter({ text: 'The Isle EVRIMA Logs' });
};
