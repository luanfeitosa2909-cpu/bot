const { EmbedBuilder } = require('discord.js');
const { parseDate } = require('./dateParser');

const JOIN_REGEX =
  /LogTheIsleJoinData:.*?\s(.+?)\s\[(\d+)\]\sJoined The Server,?\sWas playing as:\s(.+?),\sGender:\s(.+?),\sGrowth:\s([\d.]+)/s;

const MAX_FIELD = 1024;

module.exports = function buildJoinEmbed(line) {
  if (!line || typeof line !== 'string') return null;

  const match = line.match(JOIN_REGEX);
  if (!match) return null;

  const [, nameRaw, steamIdRaw, dinoRaw, genderRaw, growthRaw] = match;

  const name = nameRaw?.trim() || 'Desconhecido';
  const steamId = steamIdRaw?.trim() || 'Desconhecido';
  const dino = dinoRaw?.trim() || 'Desconhecido';
  const gender = genderRaw?.trim() || 'Desconhecido';
  const growth = growthRaw?.trim() || 'Desconhecido';

  const dateMatch = line.match(/\[(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2})\]/);
  const date = parseDate(dateMatch?.[1]) || new Date();

  return new EmbedBuilder()
    .setTitle('🚪 Entrada no Servidor')
    .setColor(0x00ff00)
    .addFields(
      { name: 'Usuário', value: name, inline: true },
      { name: 'SteamID', value: steamId, inline: true },
      { name: 'Dino', value: dino.slice(0, MAX_FIELD), inline: true },
      { name: 'Gênero', value: gender.slice(0, MAX_FIELD), inline: true },
      { name: 'Growth', value: growth.slice(0, MAX_FIELD), inline: true }
    )
    .setTimestamp(date)
    .setFooter({ text: 'The Isle EVRIMA Logs' });
};
