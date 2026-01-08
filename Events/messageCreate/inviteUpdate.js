const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'data', 'invites.json');

module.exports = {
  name: Events.MessageCreate,
  run: async (client, message) => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const hoje = new Date().toISOString().split('T')[0];

    if (!fs.existsSync(filePath)) return;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const entry of data) {
      const convidado = entry.invited.find(c => c.userId === userId);
      if (convidado) {
        if (!convidado.activeDates.includes(hoje)) {
          convidado.activeDates.push(hoje);
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
        break;
      }
    }
  },
};
