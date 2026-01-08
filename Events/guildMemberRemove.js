const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logError, logWarn } = require('../Utils/logger');

const filePath = path.join(process.cwd(), 'data', 'invites.json');

module.exports = {
  name: Events.MessageCreate,
  run: async (client, message) => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const hoje = new Date().toISOString().split('T')[0];

    if (!fs.existsSync(filePath)) return;

    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      logError('❌ Erro ao ler invites.json:', err);
      return;
    }

    let alterado = false;

    for (const entry of data) {
      if (!Array.isArray(entry.invited)) continue;

      const convidado = entry.invited.find(c => c.userId === userId);
      if (convidado && !convidado.activeDates.includes(hoje)) {
        convidado.activeDates.push(hoje);
        alterado = true;
        break;
      }
    }

    if (alterado) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      } catch (err) {
        console.error('❌ Erro ao salvar invites.json:', err);
      }
    }
  },
};
