const Discord = require('discord.js');
const { clientMongo } = require('../database/mongodb.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { logError } = require('../Utils/logger.js');

const UPDATE_INTERVAL = 30 * 1000;
const chartCanvas = new ChartJSNodeCanvas({ width: 600, height: 300 });

async function atualizarPaineis(client) {
  try {
    const collection = clientMongo.db('ProjetoGenoma').collection('painel');
    const paineis = await collection.find({}).toArray();
    if (!paineis.length) return;

    for (const { guildId, canalId, messageId } of paineis) {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) continue;

      const canal = await guild.channels.fetch(canalId).catch(() => null);
      if (!canal?.isTextBased()) continue;

      const mensagem = await canal.messages.fetch(messageId).catch(() => null);
      if (!mensagem) continue;

      // Atualiza apenas uma vez a cada X segundos por mensagem
      setInterval(async () => {
        const embedData = await gerarEmbed(guild, client);
        if (!embedData) return;

        await mensagem
          .edit({
            embeds: [embedData.embed],
            files: embedData.files,
          })
          .catch(err => logError('❌ Falha ao editar painel:', err));
      }, UPDATE_INTERVAL);
    }
  } catch (err) {
    logError('❌ Erro ao atualizar paineis:', err);
  }
}

async function gerarEmbed(guild, client) {
  try {
    const now = Date.now();

    const members = await guild.members.fetch();
    const online = members.filter(m => m.presence?.status === 'online').size;
    const totalMembers = members.size;
    const novatos24h = members.filter(m => now - (m.joinedTimestamp || 0) < 86400000).size;

    const inCall = guild.channels.cache
      .filter(ch => ch.isVoiceBased())
      .reduce((acc, ch) => acc + ch.members.size, 0);
    const callPercent = totalMembers ? ((inCall / totalMembers) * 100).toFixed(1) : '0';

    const aggregation = await clientMongo
      .db('ProjetoGenoma')
      .collection('DataBase')
      .aggregate([
        { $match: { tempo: { $gt: 0 } } },
        {
          $facet: {
            totalTempo: [{ $group: { _id: null, total: { $sum: '$tempo' } } }],
            topUsuarios: [
              { $match: { steamname: { $exists: true } } },
              { $sort: { tempo: -1 } },
              { $limit: 5 },
              { $project: { steamname: 1, tempo: 1 } },
            ],
            countUsuarios: [{ $count: 'total' }],
          },
        },
      ])
      .toArray();

    const result = aggregation[0] || {};
    const tempoTotalMs = result.totalTempo?.[0]?.total || 0;
    const tempoTotalHoras = Math.floor(tempoTotalMs / 1000 / 3600);
    const topUsuarios = result.topUsuarios || [];
    const totalBanco = result.countUsuarios?.[0]?.total || 0;

    const topTexto = topUsuarios.length
      ? topUsuarios
          .map(
            (u, i) => `\`${i + 1}º\` **${u.steamname}** — \`${Math.floor(u.tempo / 1000 / 3600)}h\``
          )
          .join('\n')
      : 'Sem dados.';

    const chartConfig = {
      type: 'bar',
      data: {
        labels: topUsuarios.map(u => u.steamname),
        datasets: [
          {
            label: 'Tempo de Jogo (horas)',
            data: topUsuarios.map(u => Math.floor(u.tempo / 1000 / 3600)),
            backgroundColor: '#1e90ff',
          },
        ],
      },
      options: {
        responsive: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    };

    const chartBuffer = await chartCanvas.renderToBuffer(chartConfig);
    const chartAttachment = new Discord.AttachmentBuilder(chartBuffer, { name: 'grafico.png' });

    const embed = new Discord.EmbedBuilder()
      .setColor(0x1e90ff)
      .setTitle('📊 Painel do Servidor')
      .setDescription('Estatísticas ao vivo da comunidade:')
      .addFields(
        { name: '👥 Membros Totais', value: `\`${totalMembers}\``, inline: true },
        { name: '🟢 Online', value: `\`${online}\``, inline: true },
        { name: '🆕 Entraram (24h)', value: `\`${novatos24h}\``, inline: true },
        { name: '🔊 Em Call Agora', value: `\`${inCall}\` (\`${callPercent}%\`)`, inline: true },
        { name: '⏱️ Total de Horas', value: `\`${tempoTotalHoras}h\``, inline: true },
        { name: '👤 Usuários no Banco', value: `\`${totalBanco}\``, inline: true },
        {
          name: '🚀 Boosts Ativos',
          value: `\`${guild.premiumSubscriptionCount || 0}\``,
          inline: true,
        },
        { name: '🏆 Top Jogadores', value: topTexto, inline: false },
        {
          name: '🔗 Links',
          value:
            '[Painel Web](https://protecaomaxima.com.br/imgs/em_desenvolvimento.jpg) • [Regras](https://discord.gg/ymjhUFGdWP)',
        }
      )
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setImage('attachment://grafico.png')
      .setTimestamp();

    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ size: 1024 }));
    }

    return { embed, files: [chartAttachment] };
  } catch (err) {
    logError('❌ Erro ao gerar embed do painel:', err);
    return null;
  }
}

module.exports = { atualizarPaineis };
