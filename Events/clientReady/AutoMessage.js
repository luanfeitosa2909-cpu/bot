const { EmbedBuilder } = require('discord.js');
const { logError, logWarn } = require('../../Utils/logger');

module.exports = {
  name: 'ready',
  once: true,
  run: async client => {
    const channelId = process.env.AUTO_MESSAGE;
    const intervaloMs = 1000 * 60 * 60; // 1 hora

    const canal = await client.channels.fetch(channelId).catch(() => null);
    if (!canal || !canal.isTextBased?.()) {
      logWarn(`❌ Canal ${channelId} não encontrado ou não é de texto.`);
      return;
    }

    let lastMessageId = null;

    // função que envia a embed (pode ser chamada manualmente ou no intervalo)
    const enviarMensagem = async () => {
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('📢 Informações Importantes do Servidor')
        .setDescription(
          [
            '👑 **Canais Úteis:**',
            '• <#1395569191016333443> — Solicite seu **Slay**',
            '• <#1353475836598030367> — Leia as **Regras**',
            '• <#1353475888846471311> — Envie sua **Sugestão**',
            '• <#1386085767004291174> — Use seus coins na **Loja**',
            '',
            '🔥 **Promoção Especial:**',
            'Quer um **bot personalizado** para o seu servidor? 🤖',
            '👉 Chame <@857972001251524628> **no PV** e garanta o seu!',
          ].join('\n')
        )
        .setFooter({ text: `${client.user.username}™ © Todos os direitos reservados` })
        .setTimestamp();

      try {
        // Deleta todas mensagens anteriores enviadas pelo bot no canal
        const msgs = await canal.messages.fetch({ limit: 10 });
        const minhasMsgs = msgs.filter(m => m.author.id === client.user.id);
        for (const msg of minhasMsgs.values()) {
          await msg.delete().catch(() => {});
        }

        const newMsg = await canal.send({ embeds: [embed] });
        lastMessageId = newMsg.id;
      } catch (err) {
        logError(`❌ Erro ao enviar mensagem automática:`, err);
      }
    };

    // 🔹 envia imediatamente na inicialização
    await enviarMensagem();

    // 🔹 repete a cada 10 minutos
    setInterval(enviarMensagem, intervaloMs);
  },
};
