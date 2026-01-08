// Sorteios/interacoes.js
const { ButtonStyle, EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  run: async (client, interaction) => {
    const [action, giveawayId] = interaction.customId.split('_').slice(1);

    const giveaway = client.sorteiosTemp?.[giveawayId];
    if (!giveaway)
      return interaction.reply({
        content: '❌ Sorteio não encontrado.',
        flags: 1 << 6,
      });

    const participantes = giveaway.participantes;
    const cargoBloqueadoId = process.env.STRIKE_ROLE_ID; // ID do cargo configurado no .env

    switch (action) {
      case 'join':
        // Impede quem tem o cargo de strike participar
        if (cargoBloqueadoId && interaction.member.roles.cache.has(cargoBloqueadoId)) {
          const embedBloqueio = new EmbedBuilder()
            .setTitle('🚫 Acesso Restrito ao Sorteio')
            .setColor('#ff2a2a')
            .setDescription(
              `Parece que você não pode participar deste sorteio no momento. 😔\n\n` +
                `🔸 **Motivo:** Você possui o cargo de **Strike em Sorteios**.\n` +
                `🔹 Esse cargo indica que houve alguma irregularidade anterior ou uma restrição temporária.\n\n` +
                `⚠️ **Importante:** Caso você acredite que isso seja um engano, entre em contato com um membro da equipe administrativa.`
            )
            .setFooter({ text: 'Sistema de Sorteios • Restrição Ativa' })
            .setTimestamp();

          return interaction.reply({
            embeds: [embedBloqueio],
            ephemeral: true,
          });
        }

        if (participantes.has(interaction.user.id)) {
          return interaction.reply({
            content: '❌ Você já está participando!',
            flags: 1 << 6,
          });
        }

        if (giveaway.dados.cargo && !interaction.member.roles.cache.has(giveaway.dados.cargo.id)) {
          return interaction.reply({
            content: `❌ Apenas membros com o cargo <@&${giveaway.dados.cargo.id}> podem participar.`,
            flags: 1 << 6,
          });
        }

        participantes.add(interaction.user.id);
        return interaction.reply({
          content: '✅ Você entrou no sorteio! Boa sorte! 🎉',
          flags: 1 << 6,
        });

      case 'leave':
        if (!participantes.has(interaction.user.id)) {
          return interaction.reply({
            content: '❌ Você não está participando deste sorteio.',
            flags: 1 << 6,
          });
        }
        participantes.delete(interaction.user.id);
        return interaction.reply({
          content: '⚠️ Você saiu do sorteio. Que pena 😢',
          flags: 1 << 6,
        });

      case 'list': {
        if (participantes.size === 0) {
          return interaction.reply({
            content: 'Nenhum participante ainda.',
            flags: 1 << 6,
          });
        }
        const embed = new EmbedBuilder()
          .setTitle('👥 Participantes do Sorteio')
          .setDescription(
            Array.from(participantes)
              .map(id => `<@${id}>`)
              .join('\n')
          )
          .setColor('Red')
          .setFooter({ text: 'Visualizando participantes' });
        return interaction.reply({ embeds: [embed], flags: 1 << 6 });
      }
    }
  },
};
