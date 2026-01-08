const { execStream } = require('../Utils/SSH');
const buildEmbed = require('../Jobs/buildEmbed');
const { logInfo, logError } = require('../Utils/logger');

const { LOGS_CHANNEL_KILLS, LOGS_CHANNEL_JOINS, LOGS_CHANNEL_CHATS, LOGS_CHANNEL_COMMANDS_EVRIMA } =
  process.env;

const LOG_PATH =
  '/home/amp/.ampdata/instances/TheIsleEVRIMA01/theisle/412680/TheIsle/Saved/Logs/TheIsle.log';

let buffer = '';
let multiLineBuffer = [];

async function startLogMonitor(client) {
  logInfo(`📡 Monitorando logs → ${LOG_PATH}`);

  try {
    const stream = await execStream(`tail -n 0 -F ${LOG_PATH}`);

    stream.on('data', data => {
      buffer += data.toString('utf8');
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();

      for (const line of lines) {
        handleLine(line.trim(), client);
      }
    });

    stream.on('close', () => {
      logError('[LOG] Stream fechada — reconectando...');
      multiLineBuffer = [];
      setTimeout(() => startLogMonitor(client), 5000);
    });
  } catch (err) {
    logError('[LOG] Falha ao iniciar stream', err);
    multiLineBuffer = [];
    setTimeout(() => startLogMonitor(client), 5000);
  }
}

function handleLine(line, client) {
  if (!line) return;

  // Eventos multiline (kill)
  if (line.includes('LogTheIsleKillData')) {
    multiLineBuffer = [line];
    return;
  }

  if (multiLineBuffer.length) {
    multiLineBuffer.push(line);

    if (line.includes('at: X=')) {
      const fullLine = multiLineBuffer.join(' ');
      multiLineBuffer = processLine(fullLine, client);
    }
    return;
  }

  // Eventos simples (1 linha)
  processLine(line, client);
}

function processLine(line, client) {
  const embed = buildEmbed(line);
  if (!embed) return [];

  const channelId = resolveChannel(embed.data.title);
  if (!channelId) return [];

  client.channels.cache
    .get(channelId)
    ?.send({ embeds: [embed] })
    .catch(() => {});

  return [];
}

function resolveChannel(title) {
  if (title.includes('Assassinato')) return LOGS_CHANNEL_KILLS;
  if (title.includes('Entrada')) return LOGS_CHANNEL_JOINS;
  if (title.includes('Saída')) return LOGS_CHANNEL_JOINS;
  if (title.includes('Mensagem')) return LOGS_CHANNEL_CHATS;
  if (title.includes('Comando')) return LOGS_CHANNEL_COMMANDS_EVRIMA;
  return null;
}

module.exports = { startLogMonitor };
