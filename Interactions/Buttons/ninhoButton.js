const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/* =======================
   DM SAFE
======================= */
async function safeDM(user, payload) {
  try {
    await user.send(payload);
    return true;
  } catch (err) {
    if (err.code === 50007) return false; // DM bloqueada
    throw err;
  }
}

module.exports = {
  type: 'button',
  match: customId => /^ninho_\d+_\w+$/.test(customId),

  async run(client, interaction) {
    const message = interaction.message;
    const embed = message.embeds[0];
    if (!embed) return;

    const button = message.components[0].components[0];
    let ovosRestantes = parseInt(button.label.match(/\d+/)?.[0] || '0');

    if (ovosRestantes <= 0) {
      return interaction.reply({
        content: '❌ Não há mais ovos restantes neste ninho!',
        flags: 1 << 6,
      });
    }

    const embedDesc = embed.description;
    const femeaIdMatch = embedDesc.match(/💠 \*\*Fêmea:\*\* <@!?(\d+)>/);
    const machoIdMatch = embedDesc.match(/💠 \*\*Macho:\*\* <@!?(\d+)>/);
    if (!femeaIdMatch || !machoIdMatch) return;

    const femeaId = femeaIdMatch[1];
    const machoId = machoIdMatch[1];

    const createApprovalEmbed = user =>
      new EmbedBuilder()
        .setTitle('🦖 Solicitação de ovo do ninho')
        .setColor('#2b7a78')
        .setDescription(
          `O player <@${interaction.user.id}> deseja pegar **1 ovo** do ninho de **${embed.title}**.\n\n` +
            `💠 **Fêmea:** <@${femeaId}>\n` +
            `💠 **Macho:** <@${machoId}>\n` +
            `🥚 **Ovos restantes:** ${ovosRestantes}\n\n` +
            `Clique no botão abaixo para **Aceitar** ou **Negar**.`
        )
        .setFooter({ text: `Projeto Genoma - Solicitação para ${user.username}` });

    const approveButton = new ButtonBuilder()
      .setCustomId(`ninho_approve_${message.channelId}_${message.id}_${interaction.user.id}`)
      .setLabel('✅ Aceitar')
      .setStyle(ButtonStyle.Success);

    const denyButton = new ButtonBuilder()
      .setCustomId(`ninho_deny_${message.channelId}_${message.id}_${interaction.user.id}`)
      .setLabel('❌ Negar')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(approveButton, denyButton);

    const femeaUser = await client.users.fetch(femeaId);
    const machoUser = await client.users.fetch(machoId);

    let enviados = 0;
    let bloqueados = [];

    const femeaOk = await safeDM(femeaUser, {
      embeds: [createApprovalEmbed(femeaUser)],
      components: [row],
    });

    if (femeaOk) enviados++;
    else bloqueados.push('Fêmea');

    const machoOk = await safeDM(machoUser, {
      embeds: [createApprovalEmbed(machoUser)],
      components: [row],
    });

    if (machoOk) enviados++;
    else bloqueados.push('Macho');

    if (enviados === 0) {
      return interaction.reply({
        content:
          '❌ Não foi possível enviar a solicitação.\n' +
          'Ambos os responsáveis estão com DMs bloqueadas.',
        flags: 1 << 6,
      });
    }

    await interaction.reply({
      content:
        `📨 Solicitação enviada com sucesso!\n` +
        (bloqueados.length
          ? `⚠️ DM bloqueada para: **${bloqueados.join(' e ')}**`
          : '✅ Ambos receberam a solicitação.'),
      flags: 1 << 6,
    });
  },
};
