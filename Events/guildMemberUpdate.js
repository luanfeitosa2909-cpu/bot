const { EmbedBuilder, Events } = require('discord.js');
const { clientMongo } = require('../database/mongodb');
const { logWarn } = require('../Utils/logger');
require('dotenv').config(); // ⚠️ Certifique-se de ter isso no topo do seu index.js também

module.exports = {
  name: Events.GuildMemberUpdate,

  async run(oldMember, newMember) {
    const boosterRole = newMember.guild.premiumSubscriberRole;
    if (!boosterRole) return;

    const antesTinhaBoost = oldMember.roles.cache.has(boosterRole.id);
    const agoraTemBoost = newMember.roles.cache.has(boosterRole.id);

    if (!antesTinhaBoost && agoraTemBoost) {
      const geralChannelId = process.env.LOG_CHANNEL_BOOST;
      if (!geralChannelId) {
        logWarn('⚠️ GERAL_CHANNEL_ID não configurado no .env');
        return;
      }

      const canalGeral = newMember.guild.channels.cache.get(geralChannelId);

      const fimCaçada = Date.now() + 60 * 60 * 1000; // 1 hora
      const horaFimFormatada = new Date(fimCaçada).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (canalGeral) {
        const embed = new EmbedBuilder()
          .setColor(0xff3dcf)
          .setTitle('💠 BOOST INVOCAÇÃO | MODO CAÇADA ATIVADO')
          .setDescription(
            [
              `✨ O lendário ${newMember} nos concedeu seu **impulso sagrado**!`,
              `\n🌀 Em resposta, o **Modo Caçada** foi **ativado por 1 hora!**`,
              `🔊 Todos em **call de voz** agora recebem **x2 moedas por hora!**`,
              `\n🎯 Aproveite esse tempo limitado para farmar ao máximo.`,
              `\n━━━━━━━━━━━━━━━━━━━━`,
            ].join('\n')
          )
          .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 1024 }))
          .setFooter({
            text: `🎁 Coins em dobro até ${horaFimFormatada}`,
            iconURL: newMember.user.displayAvatarURL({ dynamic: true }),
          })
          .setTimestamp();

        await canalGeral.send({
          content: `@everyone 🚨 **ALERTA DE BOOST ATIVO!** 🚨\n${newMember}`,
          embeds: [embed],
        });
      }

      // Salva no MongoDB
      try {
        const globalCollection = clientMongo.db('ProjetoGenoma').collection('GlobalData');

        await globalCollection.updateOne(
          { servidor: newMember.guild.id },
          {
            $set: {
              cacada: true,
              cacada_ativada_em: Date.now(),
              cacada_termina_em: fimCaçada,
            },
          },
          { upsert: true }
        );

        console.log('✅ Modo Caçada ativado por boost.');
      } catch (err) {
        console.error('❌ Erro ao ativar modo Caçada no MongoDB:', err);
      }

      // Desativa após 1 hora
      setTimeout(async () => {
        try {
          const globalCollection = clientMongo.db('ProjetoGenoma').collection('GlobalData');
          await globalCollection.updateOne(
            { servidor: newMember.guild.id },
            { $set: { cacada: false } }
          );

          console.log('🕒 Modo Caçada finalizado após 1 hora.');
        } catch (err) {
          console.error('❌ Erro ao desativar modo Caçada no MongoDB:', err);
        }
      }, 60 * 60 * 1000);
    }
  },
};
