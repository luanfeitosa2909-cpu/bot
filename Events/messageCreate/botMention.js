const { Events, EmbedBuilder } = require('discord.js');

const COOLDOWN_MS = 15 * 1000; // 15 segundos de cooldown

const cooldowns = new Map();

module.exports = {
  name: Events.MessageCreate,
  run: async (client, message) => {
    if (message.author.bot || !message.guild) return;

    const mentionRegex = new RegExp(`^<@!?${client.user.id}>`);
    const content = message.content.trim();

    // Só responde se for mencionado diretamente
    if (!mentionRegex.test(content)) return;

    const pergunta = content.replace(mentionRegex, '').trim();

    // Sem pergunta, mostra ajuda
    if (!pergunta) return replyHelp(message, client);

    // Cooldown por usuário
    const now = Date.now();
    if (cooldowns.has(message.author.id) && now - cooldowns.get(message.author.id) < COOLDOWN_MS) {
      return message.reply('⏳ Aguarde antes de perguntar novamente.');
    }
    cooldowns.set(message.author.id, now);

    // Resposta padrão
    return message.reply(
      '🤖 Oi! No momento estou ativo, mas ainda não tenho comandos específicos configurados. Use `/help` se disponível.'
    );
  },
};

function replyHelp(message, client) {
  const embed = new EmbedBuilder()
    .setColor('Yellow')
    .setAuthor({
      name: client.user.username,
      iconURL: client.user.displayAvatarURL({ dynamic: true }),
    })
    .setDescription(
      `Olá ${message.member}, mencione-me seguido de uma pergunta ou use \`/help\` para saber o que posso fazer!`
    );
  return message.reply({ embeds: [embed] });
}
