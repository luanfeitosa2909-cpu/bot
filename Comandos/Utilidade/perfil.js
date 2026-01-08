const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require('discord.js');
const { getUserData } = require('../../database/userData');
require('dotenv').config();
const { logError } = require('../../Utils/logger');

function formatarTempo(ms) {
  if (!ms || isNaN(ms)) return '0h 0m 0s';
  const totalSegundos = Math.floor(ms / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  return `${horas}h ${minutos}m ${segundos}s`;
}

function gerarMensagemMotivacional(ms) {
  const horas = ms / (1000 * 60 * 60);
  const mensagens = [
    'Continue assim, o tempo está a seu favor!',
    'Você está indo bem, continue firme!',
    'Cada minuto conta. Você está progredindo!',
    'Foco e persistência fazem o dinossauro virar lenda!',
  ];

  if (horas < 1)
    return '👣 **Você está iniciando sua jornada jurássica!** Continue ativo para acumular mais tempo e coins.';
  if (horas < 5)
    return `🦕 **Você está indo muito bem!** ${
      mensagens[Math.floor(Math.random() * mensagens.length)]
    }`;
  if (horas < 15)
    return `🦖 **Veterano da selva!** ${mensagens[Math.floor(Math.random() * mensagens.length)]}`;
  return `🚀 **Dinossauro Lendário!** ${mensagens[Math.floor(Math.random() * mensagens.length)]}`;
}

function calcularLevel(coins) {
  return Math.floor(coins / 1000);
}

function obterNivelApoiador(despesa) {
  if (!despesa || isNaN(despesa) || despesa < 10) return '❌ Não';
  if (despesa >= 1000) return '💎 TITAN';
  if (despesa >= 500) return '🏆 MASTER';
  if (despesa >= 250) return '🥇 OURO';
  if (despesa >= 50) return '🥈 PRATA';
  if (despesa >= 30) return '🥉 BRONZE';
  return '🔸 APOIADOR';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Veja o perfil completo de um usuário')
    .addUserOption(option =>
      option
        .setName('usuário')
        .setDescription('Usuário para ver o perfil (opcional)')
        .setRequired(false)
    ),

  async run(client, interaction, _clientMongo) {
    try {
      await interaction.deferReply();

      const targetUser = interaction.options.getUser('usuário') || interaction.user;
      const userId = targetUser.id;

      const userData = (await getUserData(userId)) || {};
      const steamid = userData.steamid || null;
      const steamname = userData.steamname || null;
      const coins = userData.coins || 0;
      const tempoSalvo = Number(userData.tempo) || 0;
      const entrada = userData.entrada || null;
      const despesa = Number(userData.despesa) || 0;

      let tempoAtual = tempoSalvo;
      if (entrada) tempoAtual += Date.now() - entrada;

      const level = calcularLevel(coins);
      const steamProfileUrl = steamid ? `https://steamcommunity.com/profiles/${steamid}` : null;
      const nivelApoiador = obterNivelApoiador(despesa);

      let badge = '';
      const horasTotais = tempoAtual / (1000 * 60 * 60);
      if (horasTotais >= 15) badge = '🚀 Dinossauro Lendário';
      else if (horasTotais >= 5) badge = '🦖 Veterano da selva';
      else if (horasTotais >= 1) badge = '🦕 Explorador da selva';
      else badge = '👣 Novato Jurássico';

      const nextLevelCoins = (level + 1) * 1000;
      const progress = Math.min(1, coins / nextLevelCoins);
      const progressBlocks = 10;
      const filledBlocks = Math.floor(progress * progressBlocks);
      const progressBar = '▓'.repeat(filledBlocks) + '░'.repeat(progressBlocks - filledBlocks);

      let embedColor = '#1B2838';
      if (badge.includes('Lendário')) embedColor = '#FFD700';
      else if (badge.includes('Veterano')) embedColor = '#43B581';
      else if (badge.includes('Explorador')) embedColor = '#7289DA';
      else embedColor = '#99AAB5';

      let row = null;
      if (steamid) {
        row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Ver perfil Steam')
            .setEmoji('<:steam1:1398576292634427392>')
            .setStyle(ButtonStyle.Link)
            .setURL(steamProfileUrl)
        );
      }

      const embed = new EmbedBuilder()
        .setTitle(`👤 Perfil de ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setColor(embedColor)
        .addFields(
          { name: '🆔 ID Discord', value: `\`${targetUser.id}\``, inline: true },
          {
            name: '📅 Conta criada em',
            value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`,
            inline: true,
          },
          { name: '💖 Apoiador', value: `\`${nivelApoiador}\``, inline: true },

          { name: '💰 Coins', value: `\`${coins.toLocaleString('pt-BR')} 🪙\``, inline: true },
          { name: '🎖️ Classificação', value: badge, inline: true },
          { name: '🕒 Tempo em chamadas', value: `\`${formatarTempo(tempoAtual)}\``, inline: true },

          { name: '📢 Motivação', value: gerarMensagemMotivacional(tempoAtual), inline: false },

          {
            name: '<:steam1:1398576292634427392> Steam',
            value: steamid
              ? `${steamname ? `🧾 Nome: \`${steamname}\`\n` : ''}🆔 ID: \`${steamid}\``
              : '❌ Steam não registrada',
            inline: false,
          }
        )
        .setFooter({
          text: `Solicitado por ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
        components: row ? [row] : [],
      });

      // Follow-up se o usuário for o mesmo e não tiver steam
      if (!steamid && targetUser.id === interaction.user.id) {
        const canalVerificacao = process.env.CANAL_VERIFICACAO || '<#1353475845062398093>';
        await interaction.followUp({
          content: `❗ Para acessar todos os recursos, registre sua Steam no canal ${canalVerificacao}.`,
          flags: 1 << 6,
        });
      }
    } catch (error) {
      logError('❌ Erro no comando perfil:', error);
      try {
        if (interaction.deferred) {
          await interaction.editReply({ content: '❌ Ocorreu um erro ao buscar o perfil.' });
        } else if (!interaction.replied) {
          await interaction.reply({
            content: '❌ Ocorreu um erro ao buscar o perfil.',
            flags: 1 << 6,
          });
        }
      } catch (e) {
        logError('Erro ao tentar responder erro:', e);
      }
    }
  },
};
