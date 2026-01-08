require('dotenv').config();
const { Events, EmbedBuilder } = require('discord.js');
const { getUserData, setUserData } = require('../database/userData');
const { getGlobalData } = require('../database/globalData');
const { logError } = require('../Utils/logger');

const channelRecompensaId = process.env.LOG_CHANNEL_RECOMPENSA;
const channelSaidaId = process.env.LOG_CHANNEL_SAIDA;
const channelRelatorioId = process.env.LOG_CHANNEL_RELATORIO;
const recompensaPorHora = 200;

// 🔹 Carrega canais ignorados do .env (separados por vírgula)
const canaisIgnorados = process.env.IGNORE_CHANNELS_CALL
  ? process.env.IGNORE_CHANNELS_CALL.split(',').map(id => id.trim())
  : [];

// 🔹 Função para verificar se o canal está na lista ignorada
function isCanalIgnorado(channelId) {
  return canaisIgnorados.includes(channelId);
}

function msParaTempo(ms) {
  if (!ms || isNaN(ms)) return '0h 0m 0s';
  const totalSegundos = Math.floor(ms / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  return `${horas}h ${minutos}m ${segundos}s`;
}

const usuariosProcessandoSaida = new Set();

module.exports = {
  name: Events.VoiceStateUpdate,
  run: async (client, oldState, newState) => {
    const userId = newState.id;

    // ⛔ Ignorar bots
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    // ✅ Entrou na call
    if (!oldState.channelId && newState.channelId) {
      if (isCanalIgnorado(newState.channelId)) {
        console.log(
          `🟡 Usuário ${member.user.tag} entrou em um canal ignorado (${newState.channelId}).`
        );
        return;
      }

      const userData = await getUserData(userId);
      if (!userData.entrada) {
        await setUserData(userId, { entrada: Date.now() });
      }
      return;
    }

    // ✅ Saiu da call
    if (oldState.channelId && !newState.channelId) {
      if (isCanalIgnorado(oldState.channelId)) {
        console.log(
          `🟡 Usuário ${member.user.tag} saiu de um canal ignorado (${oldState.channelId}).`
        );
        return;
      }

      if (usuariosProcessandoSaida.has(userId)) return;
      usuariosProcessandoSaida.add(userId);

      try {
        const userData = await getUserData(userId);
        if (!userData.entrada) {
          usuariosProcessandoSaida.delete(userId);
          return;
        }

        const entrada = userData.entrada;
        const tempoNaCall = Date.now() - entrada;

        if (tempoNaCall < 5000) {
          usuariosProcessandoSaida.delete(userId);
          return;
        }

        const tempoTotalAntes = userData.tempo || 0;
        const novoTempoTotal = tempoTotalAntes + tempoNaCall;

        const horasAntes = Math.floor(tempoTotalAntes / 3600000);
        const horasDepois = Math.floor(novoTempoTotal / 3600000);
        const horasGanhas = horasDepois - horasAntes;

        let novosCoins = userData.coins || 0;
        let coinsGanhas = 0;
        const cacadaAtiva = (await getGlobalData('cacada')) === true;
        const boosterRole = member.guild.premiumSubscriberRole;
        const temBoost = boosterRole && member.roles.cache.has(boosterRole.id);

        if (horasGanhas > 0) {
          const multiplicadorBase = cacadaAtiva ? 2 : 1;
          const bonusBooster = temBoost ? 1.3 : 1;
          const multiplicadorFinal = multiplicadorBase * bonusBooster;

          coinsGanhas = Math.floor(horasGanhas * recompensaPorHora * multiplicadorFinal);
          novosCoins += coinsGanhas;
        }

        await setUserData(userId, {
          tempo: novoTempoTotal,
          entrada: null,
          coins: novosCoins,
        });

        const userTag = member.user.tag;
        const userAvatar = member.user.displayAvatarURL({ dynamic: true });

        const embedRelatorio = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('📝 Relatório de Saída da Call')
          .setAuthor({ name: userTag, iconURL: userAvatar })
          .addFields(
            { name: 'Usuário', value: `<@${userId}>`, inline: true },
            { name: 'Entrada Registrada', value: new Date(entrada).toLocaleString(), inline: true },
            { name: 'Tempo na Call', value: msParaTempo(tempoNaCall), inline: true },
            { name: 'Tempo Total (Antes)', value: msParaTempo(tempoTotalAntes), inline: true },
            { name: 'Tempo Total (Agora)', value: msParaTempo(novoTempoTotal), inline: true }
          )
          .setFooter({ text: 'Relatório automático de call' })
          .setTimestamp();

        const embedRecompensa =
          horasGanhas > 0
            ? new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🏆 Recompensa por Tempo em Call')
                .setDescription(
                  [
                    `🎉 <@${userId}> completou **${horasGanhas} hora(s)** em call!`,
                    `💰 *Coins Recebidos:* **${coinsGanhas.toLocaleString()} coins**`,
                    '',
                    cacadaAtiva
                      ? '🔥 **Modo Caçada Ativado!** (`x2` coins por hora)'
                      : '🛡️ *Modo Caçada:* Desativado',
                    temBoost
                      ? '✨ **Boost do Servidor Ativo!** (`+30%` de coins)'
                      : '📡 *Boost:* Não ativo',
                    '',
                    '🔁 *Continue em call para acumular ainda mais recompensas!*',
                  ].join('\n')
                )
                .setThumbnail(userAvatar)
                .setFooter({
                  text: '⏱️ Recompensa calculada automaticamente pelo sistema de chamadas de voz.',
                })
                .setTimestamp()
            : null;

        const embedSaida = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('📈 Relatório de Voz')
          .setDescription(
            `<@${userId}> saiu da call com um total de **${msParaTempo(
              novoTempoTotal
            )}** em chamadas de voz.`
          )
          .setThumbnail(userAvatar)
          .setTimestamp();

        const canalRelatorio = client.channels.cache.get(channelRelatorioId);
        const canalRecompensa = client.channels.cache.get(channelRecompensaId);
        const canalSaida = client.channels.cache.get(channelSaidaId);

        await Promise.allSettled([
          canalRelatorio?.send({ embeds: [embedRelatorio] }),
          embedRecompensa && canalRecompensa?.send({ embeds: [embedRecompensa] }),
          canalSaida?.send({ embeds: [embedSaida] }),
          (async () => {
            if (embedRecompensa) {
              try {
                const user = await client.users.fetch(userId);
                await user.send({ embeds: [embedRecompensa] });
              } catch {
                console.warn(`[DM] Não foi possível enviar DM para o usuário ${userId}.`);
              }
            }
          })(),
        ]);
      } catch (err) {
        logError('❌ Erro no processamento de saída da call:', err);
      } finally {
        usuariosProcessandoSaida.delete(userId);
      }
    }
  },
};
