require('dotenv').config();
const { ChannelType } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const { logInfo, logError } = require('../Utils/logger.js'); // Corrigido o caminho para utils/logger.js

const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;

async function conectarCanalDeVoz(client) {
  const canal = client.channels.cache.get(VOICE_CHANNEL_ID);
  if (canal?.type === ChannelType.GuildVoice) {
    try {
      const connection = joinVoiceChannel({
        channelId: canal.id,
        guildId: canal.guild.id,
        adapterCreator: canal.guild.voiceAdapterCreator,
      });

      connection.on('error', error => {
        logError('❌ Erro na conexão de voz:', error);
      });

      connection.on('stateChange', (oldState, newState) => {
        if (newState.status === VoiceConnectionStatus.Disconnected) {
          logError('🔌 Conexão de voz desconectada!');
        }
      });

      logInfo(`✅ Entrei no canal de voz: ${canal.name}`);
    } catch (error) {
      logError('❌ Erro ao entrar no canal de voz:', error);
    }
  }
}

module.exports = { conectarCanalDeVoz };
