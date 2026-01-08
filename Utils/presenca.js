const { ActivityType } = require('discord.js');
const { logError } = require('./logger');

async function configurarPresenca(client) {
  try {
    await client.application.edit({
      description:
        '🌟 Gold Community: automação e controle!\n' +
        '⚙️ Comandos inteligentes, economia e logs.\n' +
        '✨ Feito por GoldZera | Suporte /help\n' +
        '🎮 https://discord.gg/c3n3tTVn4w',
    });

    client.user.setPresence({
      activities: [
        { name: '💡 /help | Gold Community', type: ActivityType.Listening },
        { name: '👥 membros online', type: ActivityType.Watching },
        { name: '🛒 compras na loja', type: ActivityType.Watching },
      ],
      status: 'dnd',
    });

    // Alterna entre atividades a cada 10 segundos
    let index = 0;
    const activities = [
      { name: '💡 Use /help para comandos!', type: ActivityType.Listening },
      {
        name: `👥 ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} membros online`,
        type: ActivityType.Watching,
      },
      { name: '🛒 Confira a loja do servidor!', type: ActivityType.Watching },
    ];

    setInterval(() => {
      client.user.setActivity(activities[index]);
      index = (index + 1) % activities.length;
    }, 10000);
  } catch (err) {
    logError('❌ Erro ao configurar presença ou descrição:', err);
  }
}

module.exports = { configurarPresenca };
