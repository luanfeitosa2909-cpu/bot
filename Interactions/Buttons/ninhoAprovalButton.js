const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  type: 'button',
  match: customId => /^(ninho_approve|ninho_deny)_\d+_\d+_\d+$/.test(customId),

  async run(client, interaction) {
    try {
      const parts = interaction.customId.split('_');
      const action = parts[0] + '_' + parts[1]; // "ninho_approve" ou "ninho_deny"
      const channelId = parts[2]; // canal do ninho
      const messageId = parts[3]; // ID da mensagem do ninho
      const playerId = parts[4]; // player que clicou no ovo

      const isApproved = action === 'ninho_approve';
      const parentId = interaction.user.id; // quem aprovou ou negou

      // 1️⃣ Desabilita botões no PV do pai
      await interaction.update({
        content: isApproved ? '✅ Você aceitou a solicitação!' : '❌ Você negou a solicitação!',
        components: [],
      });

      // 2️⃣ Busca a mensagem original do ninho
      const channel = await client.channels.fetch(channelId);
      const ninhoMsg = await channel.messages.fetch(messageId);
      const embed = ninhoMsg.embeds[0];

      if (!embed) return;

      // 3️⃣ Pega ovos restantes
      const ovosMatch = embed.description.match(/🔹 \*\*Ovos restantes:\*\* (\d+)/);
      let ovosRestantesAtual = ovosMatch ? parseInt(ovosMatch[1]) : 0;

      if (isApproved && ovosRestantesAtual <= 0) {
        return channel.send(`❌ Não há mais ovos restantes neste ninho!`);
      }

      // 4️⃣ Atualiza lista de quem pegou o ovo
      let pegouPorMatch = embed.description.match(/👥 \*\*Quem pegou:\*\* (.+)/);
      let pegouPor = pegouPorMatch ? pegouPorMatch[1] : 'Ninguem ainda';

      if (pegouPor === 'Ninguem ainda') {
        pegouPor = `<@${playerId}>`;
      } else if (!pegouPor.includes(`<@${playerId}>`)) {
        pegouPor += `, <@${playerId}>`;
      }

      // 5️⃣ Notifica o player com embed detalhado
      try {
        const player = await client.users.fetch(playerId);

        const femeaMatch = embed.description.match(/💠 \*\*Fêmea:\*\* <@!?(\d+)>/);
        const machoMatch = embed.description.match(/💠 \*\*Macho:\*\* <@!?(\d+)>/);
        const dinoNameMatch = embed.title?.match(/🦖 Ninho de (.+)/);

        const femeaId = femeaMatch ? femeaMatch[1] : 'Desconhecido';
        const machoId = machoMatch ? machoMatch[1] : 'Desconhecido';
        const dinoName = dinoNameMatch ? dinoNameMatch[1] : 'Desconhecido';

        const embedPlayer = new EmbedBuilder()
          .setTitle(isApproved ? '🥚 Solicitação Aprovada!' : '❌ Solicitação Negada')
          .setColor(isApproved ? '#2b7a78' : '#a52a2a')
          .setDescription(
            `${
              isApproved ? '🎉 Parabéns!' : '⚠️ Infelizmente'
            } sua solicitação para pegar um ovo do ninho foi ${
              isApproved ? '**APROVADA**' : '**NEGADA**'
            }.\n\n` +
              `**Dinossauro / Ninho:** ${dinoName}\n` +
              `**Ovos restantes:** ${ovosRestantesAtual}\n` +
              `**Fêmea (pai do ninho):** <@${femeaId}>\n` +
              `**Macho (pai do ninho):** <@${machoId}>\n` +
              `**Decisão tomada por:** <@${parentId}>`
          )
          .setFooter({ text: 'Projeto Genoma - Sistema de Ninhos' })
          .setTimestamp();

        await player.send({ embeds: [embedPlayer] });
      } catch (err) {
        console.error('Erro ao notificar player:', err);
      }

      // 6️⃣ Atualiza embed do ninho se aprovado
      if (isApproved) {
        ovosRestantesAtual--;

        const newEmbed = EmbedBuilder.from(embed).setDescription(
          embed.description
            .replace(/👥 \*\*Quem pegou:\*\* .+/, `👥 **Quem pegou:** ${pegouPor}`)
            .replace(
              /🔹 \*\*Ovos restantes:\*\* \d+/,
              `🔹 **Ovos restantes:** ${ovosRestantesAtual}`
            )
        );

        const button = ninhoMsg.components[0].components[0];
        const newButton = ButtonBuilder.from(button)
          .setLabel(`🥚 Pegar ovo (${ovosRestantesAtual} restantes)`)
          .setDisabled(ovosRestantesAtual === 0);

        const newRow = new ActionRowBuilder().addComponents(newButton);

        await ninhoMsg.edit({ embeds: [newEmbed], components: [newRow] });
      }
    } catch (err) {
      console.error('Erro ao processar aprovação/negação do ninho:', err);
    }
  },
};
