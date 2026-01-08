const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');

const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

function formatDateTime(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function createPollEmbed({
  titulo,
  autorTag,
  autorAvatar,
  servidorIcon,
  opcoes,
  tempoRaw,
  horaFim,
}) {
  const opcoesFormatadas = opcoes.map((opt, i) => `${emojis[i]} **${opt}**`).join('\n');

  return new EmbedBuilder()
    .setTitle(`🗳️ Nova Enquete: ${titulo}`)
    .setAuthor({ name: autorTag, iconURL: autorAvatar })
    .setThumbnail(servidorIcon)
    .setColor('#f1c40f')
    .setDescription(
      `**Instruções:**\nReaja com o emoji correspondente para votar.\n\n` +
        `**Opções:**\n${opcoesFormatadas}\n\n` +
        `**Duração da enquete:** ${tempoRaw} (até ${horaFim})`
    )
    .setFooter({ text: 'Enquete criada em:' })
    .setTimestamp();
}

function createResultEmbed({
  titulo,
  autorTag,
  autorAvatar,
  servidorIcon,
  opcoes,
  votos,
  vencedores,
  totalVotos,
}) {
  const resultados = opcoes
    .map((opt, i) => {
      const count = votos[i];
      const percent = totalVotos ? ((count / totalVotos) * 100).toFixed(1) : 0;
      return `${emojis[i]} **${opt}** — ${count} voto(s) (${percent}%)`;
    })
    .join('\n');

  let textoVencedor;
  if (totalVotos === 0) {
    textoVencedor = 'Nenhum voto registrado.';
  } else if (vencedores.length === 1) {
    textoVencedor = `🏆 **Vencedor:** ${vencedores[0]} com ${
      votos[opcoes.indexOf(vencedores[0])]
    } voto(s)!`;
  } else {
    textoVencedor = `🤝 **Empate entre:** ${vencedores.join(', ')} com ${
      votos[opcoes.indexOf(vencedores[0])]
    } voto(s) cada!`;
  }

  return new EmbedBuilder()
    .setTitle(`📊 Enquete encerrada: ${titulo}`)
    .setAuthor({ name: autorTag, iconURL: autorAvatar })
    .setThumbnail(servidorIcon)
    .setColor('#2ecc71')
    .setDescription(`**Resultados:**\n${resultados}\n\n${textoVencedor}`)
    .setFooter({ text: 'Enquete finalizada' })
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('enquete')
    .setDescription('Crie uma enquete detalhada com até 5 opções.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('titulo').setDescription('Título da enquete').setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('tempo')
        .setDescription('Duração da enquete (ex: 10s, 5m, 1h, 1d)')
        .setRequired(true)
    )
    .addStringOption(opt => opt.setName('opcao1').setDescription('Opção 1').setRequired(true))
    .addStringOption(opt => opt.setName('opcao2').setDescription('Opção 2').setRequired(true))
    .addStringOption(opt =>
      opt.setName('opcao3').setDescription('Opção 3 (opcional)').setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('opcao4').setDescription('Opção 4 (opcional)').setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('opcao5').setDescription('Opção 5 (opcional)').setRequired(false)
    ),

  run: async (client, interaction, clientMongo) => {
    const logger = require('../../Utils/logger');
    await interaction.deferReply({ ephemeral: true });
    try {
      const titulo = interaction.options.getString('titulo');
      const tempoRaw = interaction.options.getString('tempo');
      const tempoms = ms(tempoRaw);

      if (!tempoms || tempoms < 10000) {
        return interaction.editReply({ content: '⏳ Tempo inválido! Use pelo menos 10 segundos.' });
      }

      if (tempoms > 86400000) {
        return interaction.editReply({ content: '⏳ Tempo máximo permitido: 1 dia.' });
      }

      const opcoes = [];
      for (let i = 1; i <= 5; i++) {
        const opt = interaction.options.getString(`opcao${i}`);
        if (opt) opcoes.push(opt.trim());
      }

      if (opcoes.length < 2) {
        return interaction.editReply({ content: '❗ Você precisa colocar pelo menos 2 opções.' });
      }

      const horaFim = formatDateTime(new Date(Date.now() + tempoms));

      const embed = createPollEmbed({
        titulo,
        autorTag: interaction.user.tag,
        autorAvatar: interaction.user.displayAvatarURL({ dynamic: true }),
        servidorIcon: interaction.guild.iconURL({ dynamic: true }),
        opcoes,
        tempoRaw,
        horaFim,
      });

      await interaction.editReply({ content: '✅ Enquete criada!' });

      const msg = await interaction.channel.send({ embeds: [embed] });

      for (let i = 0; i < opcoes.length; i++) {
        try {
          await msg.react(emojis[i]);
        } catch (err) {
          logger.logWarn(`Erro ao reagir com emoji ${emojis[i]}: ${err.message || err}`);
        }
      }

      setTimeout(async () => {
        try {
          const fetchedMsg = await interaction.channel.messages.fetch(msg.id);
          const votos = opcoes.map((_, i) => {
            const count = fetchedMsg.reactions.cache.get(emojis[i])?.count - 1 || 0;
            return count;
          });

          const totalVotos = votos.reduce((a, b) => a + b, 0);
          const maxVotos = Math.max(...votos);
          const vencedores = opcoes.filter((_, i) => votos[i] === maxVotos && maxVotos > 0);

          const embedResultado = createResultEmbed({
            titulo,
            autorTag: interaction.user.tag,
            autorAvatar: interaction.user.displayAvatarURL({ dynamic: true }),
            servidorIcon: interaction.guild.iconURL({ dynamic: true }),
            opcoes,
            votos,
            vencedores,
            totalVotos,
          });

          await fetchedMsg.edit({ embeds: [embedResultado] });

          await interaction.followUp({
            content: '✅ Enquete finalizada! Veja os resultados no chat.',
            ephemeral: true,
          });
        } catch (error) {
          logger.logError('enquete', error);
          try {
            if (!interaction.replied)
              await interaction.followUp({
                content: '❌ Erro ao finalizar a enquete.',
                ephemeral: true,
              });
            else
              await interaction.followUp({
                content: '❌ Erro ao finalizar a enquete.',
                ephemeral: true,
              });
          } catch (e) {
            logger.logError('enquete_notify_error', e);
          }
        }
      }, tempoms);
    } catch (error) {
      logger.logError('enquete', error);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Ocorreu um erro ao executar o comando.' });
        else
          await interaction.followUp({
            content: '❌ Ocorreu um erro ao executar o comando.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('enquete_notify_error', e);
      }
    }
  },
};
