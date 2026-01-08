const { EmbedBuilder } = require('discord.js');
const { parseDate } = require('./dateParser');

const COMMAND_REGEX = /LogTheIsleCommandData:\s(.+?)\s\[(\d+)\]\sused command:\s(.+)$/;

const MAX_FIELD = 1024;

function buildCommandEmbed(line) {
  if (!line || typeof line !== 'string') return null;

  const match = line.match(COMMAND_REGEX);
  if (!match) return null;

  const [, nameRaw, steamId, commandRaw] = match;

  const name = nameRaw?.trim() || 'Desconhecido';
  const command = commandRaw?.trim() || '*sem comando*';

  const dateMatch = line.match(/\[(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2})\]/);
  const date = parseDate(dateMatch?.[1]) || new Date();

  const safeCommand = command.length > MAX_FIELD ? command.slice(0, MAX_FIELD - 20) + '…' : command;

  return new EmbedBuilder()
    .setTitle('🛠️ Comando Executado')
    .setColor(0x0099ff)
    .addFields(
      { name: 'Usuário', value: name, inline: true },
      { name: 'SteamID', value: steamId, inline: true },
      { name: 'Comando', value: safeCommand, inline: false }
    )
    .setTimestamp(date)
    .setFooter({ text: 'The Isle EVRIMA Logs' });
}

module.exports = buildCommandEmbed;
