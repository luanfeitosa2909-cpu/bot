const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  AttachmentBuilder,
} = require('discord.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { clientMongo } = require('../../database/mongodb');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painelfixar')
    .setDescription('Envia e fixa o painel do servidor. Atualizado automaticamente.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  run: async (client, interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true });

      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({
          content: '❌ Você não tem permissão para usar este comando.',
        });
      }

      const { embed, image } = await gerarEmbed(interaction.guild, client);
      if (!embed) return interaction.editReply({ content: '❌ Erro ao gerar o painel.' });

      const painelMsg = await interaction.channel.send({
        embeds: [embed],
        files: image ? [image] : [],
      });

      const collection = clientMongo.db('ProjetoGenoma').collection('painel');

      await collection.updateOne(
        { guildId: interaction.guild.id },
        {
          $set: {
            guildId: interaction.guild.id,
            canalId: painelMsg.channel.id,
            messageId: painelMsg.id,
          },
        },
        { upsert: true }
      );

      return interaction.editReply({ content: '✅ Painel enviado e salvo com sucesso.' });
    } catch (err) {
      logger.logError('painelfixar', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro ao enviar o painel.' });
      } catch (e) {
        logger.logError('painelfixar_notify_error', e);
      }
    }
  },
};

async function gerarEmbed(guild, client) {
  try {
    const now = Date.now();

    const online = guild.members.cache.filter(m => m.presence?.status === 'online').size;
    const totalMembers = guild.memberCount;

    const voiceChannels = guild.channels.cache.filter(ch => ch.isVoiceBased());
    const inCall = voiceChannels.reduce((acc, vc) => acc + vc.members.size, 0);

    const callPercent = totalMembers ? ((inCall / totalMembers) * 100).toFixed(1) : '0';

    const novatos24h = guild.members.cache.filter(
      m => now - (m.joinedTimestamp || 0) < 86400000
    ).size;

    const usuarios = await clientMongo
      .db('ProjetoGenoma')
      .collection('DataBase')
      .find({}, { projection: { steamname: 1, tempo: 1 } })
      .toArray();

    const totalBanco = usuarios.length;
    const tempoTotalMs = usuarios.reduce((t, u) => t + (u.tempo || 0), 0);
    const tempoTotalHoras = Math.floor(tempoTotalMs / 1000 / 3600);
    const totalBoosts = guild.premiumSubscriptionCount || 0;

    const top = usuarios
      .filter(u => u.tempo && u.steamname)
      .sort((a, b) => b.tempo - a.tempo)
      .slice(0, 5);

    const topTexto =
      top
        .map(
          (u, i) => `\`${i + 1}º\` **${u.steamname}** — \`${Math.floor(u.tempo / 1000 / 3600)}h\``
        )
        .join('\n') || 'Sem dados.';

    const chartBuffer = await gerarGrafico(top);
    const image = chartBuffer ? new AttachmentBuilder(chartBuffer, { name: 'grafico.png' }) : null;

    const embed = new EmbedBuilder()
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
        { name: '🚀 Boosts Ativos', value: `\`${totalBoosts}\``, inline: true },
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
      embed.setFooter({ text: guild.name, iconURL: guild.iconURL() });
    }

    return { embed, image };
  } catch (err) {
    console.error('❌ Erro ao gerar embed do painel:', err);
    return { embed: null, image: null };
  }
}

// 📈 Gera gráfico de barras com Chart.js dos top players
async function gerarGrafico(top) {
  try {
    if (!top || top.length === 0) return null;

    const largura = 800;
    const altura = 400;
    const chart = new ChartJSNodeCanvas({ width: largura, height: altura });

    const nomes = top.map(u => u.steamname);
    const horas = top.map(u => parseFloat((u.tempo / 1000 / 3600).toFixed(2)));

    const config = {
      type: 'bar',
      data: {
        labels: nomes,
        datasets: [
          {
            label: 'Horas jogadas',
            data: horas,
            backgroundColor: '#1e90ff',
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: '🏆 Top Jogadores',
            color: '#fff',
            font: { size: 18 },
          },
        },
        scales: {
          x: {
            ticks: { color: '#fff' },
            grid: { color: '#444' },
          },
          y: {
            ticks: { color: '#fff' },
            grid: { color: '#444' },
          },
        },
      },
    };

    return await chart.renderToBuffer(config);
  } catch (err) {
    console.error('❌ Erro ao gerar gráfico:', err);
    return null;
  }
}
