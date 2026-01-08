const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

// Embed de resumo para o usuário (SEM ALTERAÇÕES)
function gerarResumoCompra(interaction, produto, precoFinal, dataCompra, saldo, dinossauro) {
  return new EmbedBuilder()
    .setTitle('🛒 Compra Realizada com Sucesso!')
    .setColor('#00C851')
    .setDescription(
      `Olá! Sua compra foi registrada com sucesso na loja do **${interaction.guild.name}**.\n\n` +
        `**Produto:** ${produto.label}\n` +
        `**Valor:** ${precoFinal} coins\n\n` +
        `Aguarde a entrega do seu produto por um membro da equipe.\n` +
        `Você pode acompanhar o status pelo canal de compras ou abrir um ticket em caso de dúvidas.`
    )
    .addFields(
      { name: '🕒 Data da compra', value: dataCompra, inline: false },
      { name: '💰 Seu saldo atual', value: `${saldo} coins`, inline: false },
      { name: '🦖 Dinossauro Escolhido', value: `**${dinossauro}**`, inline: false }
    )
    .setFooter({ text: 'Obrigado por confiar na nossa loja! 🚀' })
    .setTimestamp();
}

// Embed de log para staff (ATUALIZADO)
function gerarLogCompra(
  interaction,
  userId,
  produto,
  precoFinal,
  saldo,
  steamid,
  dataCompra,
  descricao,
  dinossauro
) {
  const timestamp = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setTitle('🟧 Nova Compra na Loja')
    .setColor('#FFA500')
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '👤 Usuário', value: `<@${userId}> \`(${userId})\``, inline: false },
      { name: '🆔 SteamID', value: `\`${steamid || 'Não registrado'}\``, inline: false },
      { name: '🎁 Produto', value: `\`${produto.label}\``, inline: false },
      { name: '💸 Preço pago', value: `\`${precoFinal} coins\``, inline: true },
      { name: '💰 Saldo restante', value: `\`${saldo} coins\``, inline: true },
      { name: '🦖 Dinossauro', value: `\`${dinossauro}\``, inline: false } // ← CRASE AQUI
    );

  // ❗ Descrição logo após dinossauro
  if (descricao) {
    embed.addFields({ name: '📋 Descrição do Pedido', value: `\`${descricao}\``, inline: false }); // ← CRASE AQUI
  }

  // ❗ Depois vem data e status
  embed.addFields(
    { name: '📅 Data da compra', value: `<t:${timestamp}:F>`, inline: false },
    { name: '📊 Status', value: '⏳ Pendente', inline: false }
  );

  embed
    .setFooter({
      text: `Sistema de Logs • ${interaction.guild.name}`,
      iconURL: interaction.client.user.displayAvatarURL(),
    })
    .setTimestamp();

  return embed;
}

// Embed de compra atendida
function gerarEmbedAtendido(interaction, produtoLabel, atendenteId) {
  return new EmbedBuilder()
    .setColor('Green')
    .setTitle('✅ Sua compra foi atendida!')
    .setDescription(
      `Sua compra de **${produtoLabel}** foi marcada como atendida por <@${atendenteId}>.`
    )
    .setFooter({ text: `${interaction.guild.name} • Loja` })
    .setTimestamp();
}

function criarBotaoAtender(userId, produtoId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`atender_${userId}_${produtoId}`)
      .setLabel('✅ Marcar como Atendido')
      .setStyle(ButtonStyle.Success)
  );
}

async function enviarLogCompra(canal, embed, userId, produtoId) {
  const staffRoleId = process.env.STAFF_ROLE_ID;

  if (!staffRoleId) {
    console.error('❌ STAFF_ROLE_ID não definido no .env!');
    return;
  }

  try {
    await canal.send({
      content: `<@&${staffRoleId}>`,
      embeds: [embed],
      components: [criarBotaoAtender(userId, produtoId)],
      allowedMentions: {
        roles: [staffRoleId],
        parse: [],
      },
    });
  } catch (err) {
    console.error('❌ Erro ao enviar log com menção:', err);
  }
}

module.exports = {
  gerarResumoCompra,
  gerarLogCompra,
  gerarEmbedAtendido,
  criarBotaoAtender,
  enviarLogCompra,
};
