const buildCommandEmbed = require('./buildCommandEmbed');
const buildKillEmbed = require('./buildKillEmbed');
const buildJoinEmbed = require('./buildJoinEmbed');
const buildChatEmbed = require('./buildChatEmbed');
const buildExitEmbed = require('./buildExitEmbed');

function buildEmbed(line) {
  if (!line || typeof line !== 'string') return null;

  if (line.includes('[LogTheIsleCommandData]:')) return buildCommandEmbed(line);
  if (line.includes('[LogTheIsleKillData]:')) return buildKillEmbed(line);
  if (line.includes('[LogTheIsleJoinData]:') && line.includes('Joined'))
    return buildJoinEmbed(line);
  if (line.includes('[LogTheIsleJoinData]:') && line.includes('Left')) return buildExitEmbed(line);
  if (line.includes('[LogTheIsleChatData]:')) return buildChatEmbed(line);

  return null;
}

module.exports = buildEmbed;
