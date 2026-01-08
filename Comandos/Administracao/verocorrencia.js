const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const { getPlayerByUserIdOrSteamId } = require('../../Utils/ocorrenciaUtils');

const { getCollection } = require('../../database/userData');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verocorrencias')
    .setDescription('Visualiza todas as ocorrências registradas de um jogador.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option =>
      option
        .setName('jogador')
        .setDescription('Discord ID, menção ou SteamID do jogador.')
        .setRequired(true)
    ),

  async run(client, interaction, _clientMongo) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const input = interaction.options.getString('jogador');

      // Se vier menção, extrair ID
      const userIdMatch = input.match(/^<@!?(\d+)>$/);
      const resolvedInput = userIdMatch ? userIdMatch[1] : input;

      const player = await getPlayerByUserIdOrSteamId(resolvedInput);

      if (!player) {
        return interaction.editReply({
          content: '❌ Jogador não encontrado no banco de dados.',
        });
      }

      // Buscar ocorrências
      const baseCollection = getCollection();
      const db = baseCollection.databaseName
        ? baseCollection.client.db(baseCollection.databaseName)
        : baseCollection.s?.db || baseCollection.client.db('ProjetoGenoma');

      const ocorrenciasCollection = db.collection('Ocorrencias');

      const ocorrencias = await ocorrenciasCollection
        .find({ user_id: player.user_id })
        .sort({ data: -1 })
        .toArray();

      // Se não houver ocorrências
      if (!ocorrencias.length) {
        const embedSem = new EmbedBuilder()
          .setTitle('📄 Histórico de Ocorrências')
          .setColor(Colors.Green)
          .setDescription(
            `✅ O jogador <@${player.user_id}> **não possui nenhuma ocorrência registrada.**`
          )
          .setFooter({ text: 'Projeto Genoma - Sistema de Ocorrências' })
          .setTimestamp();

        return interaction.editReply({ embeds: [embedSem] });
      }

      // Paginação
      const porPagina = 5;
      let paginaAtual = 0;

      const totalPaginas = Math.ceil(ocorrencias.length / porPagina);

      const gerarEmbed = () => {
        const inicio = paginaAtual * porPagina;
        const pagina = ocorrencias.slice(inicio, inicio + porPagina);

        const embed = new EmbedBuilder()
          .setTitle('📚 Histórico de Ocorrências')
          .setColor(Colors.Blurple)
          .setThumbnail(
            interaction.guild.members.cache.get(player.user_id)?.displayAvatarURL({
              dynamic: true,
            }) || interaction.user.displayAvatarURL()
          )
          .addFields(
            {
              name: '👤 Jogador',
              value: `<@${player.user_id}>`,
              inline: true,
            },
            {
              name: '🆔 SteamID',
              value: player.steamid || 'N/A',
              inline: true,
            },
            {
              name: '📦 Total de ocorrências',
              value: `**${ocorrencias.length} registros**`,
              inline: true,
            }
          )
          .setFooter({
            text: `Página ${paginaAtual + 1} de ${totalPaginas}`,
          })
          .setTimestamp();

        // Listagem das ocorrências
        pagina.forEach((o, i) => {
          embed.addFields({
            name: `#${inicio + i + 1} — ${o.tipo.toUpperCase()} (${new Date(
              o.data
            ).toLocaleDateString('pt-BR')})`,
            value:
              `**Descrição:** ${o.descricao}\n` +
              `**Staff:** <@${o.autor}>\n` +
              `**Steam Name:** ${o.steamname || 'N/A'}\n`,
            inline: false,
          });
        });

        return embed;
      };

      // Botões de navegação
      const gerarBotoes = () => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('anterior')
            .setLabel('⬅ Página anterior')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(paginaAtual === 0),

          new ButtonBuilder()
            .setCustomId('proxima')
            .setLabel('➡ Próxima página')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(paginaAtual === totalPaginas - 1)
        );
      };

      const msg = await interaction.editReply({
        embeds: [gerarEmbed()],
        components: totalPaginas > 1 ? [gerarBotoes()] : [],
      });

      if (totalPaginas <= 1) return;

      // Criar um collector
      const collector = msg.createMessageComponentCollector({
        time: 5 * 60 * 1000, // 5 minutos
      });

      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id)
          return i.reply({
            content: '❌ Apenas quem executou o comando pode usar os botões.',
            ephemeral: true,
          });

        if (i.customId === 'anterior') paginaAtual--;
        if (i.customId === 'proxima') paginaAtual++;

        await i.update({
          embeds: [gerarEmbed()],
          components: [gerarBotoes()],
        });
      });

      collector.on('end', () => {
        msg.edit({ components: [] }).catch(() => {});
        logger.logInfo('verocorrencias_end', `Collector ended for ${interaction.user.id}`);
      });
    } catch (err) {
      logger.logError('verocorrencias', err);
      if (!interaction.replied)
        await interaction.reply({ content: '❌ Erro ao buscar ocorrências.', ephemeral: true });
    }
  },
};
