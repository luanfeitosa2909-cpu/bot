const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require('discord.js');
const { clientMongo } = require('../../database/mongodb');
const { logError } = require('../../Utils/logger');

const dbName = 'ProjetoGenoma';
const collectionName = 'DataBase';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verdb')
    .setDescription('📂 Consulte o conteúdo da database (somente administradores)')
    .addStringOption(option =>
      option
        .setName('categoria')
        .setDescription('Escolha a categoria que deseja visualizar')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Apenas administradores podem usar este comando.',
        flags: 1 << 6,
      });
    }

    const categoria = interaction.options.getString('categoria').toLowerCase();

    try {
      if (!clientMongo.isConnected?.()) await clientMongo.connect();
      const db = clientMongo.db(dbName);
      const collection = db.collection(collectionName);

      const query = {};
      query[categoria] = { $exists: true };

      const allData = await collection.find(query).toArray();

      if (allData.length === 0) {
        return interaction.reply({
          content: `📭 Não há registros com a categoria **${categoria.toUpperCase()}**.`,
          flags: 1 << 6,
        });
      }

      const maxPorPagina = 8;
      let pagina = 0;

      const gerarDescricao = page => {
        const inicio = page * maxPorPagina;
        const fim = inicio + maxPorPagina;
        const fatia = allData.slice(inicio, fim);

        return fatia
          .map(entry => {
            let desc = `🔸 **ID do documento:** \`${entry._id}\`\n`;
            if (entry.user_id) desc += `👤 **Usuário:** <@${entry.user_id}>\n`;
            const valor = entry[categoria];
            if (typeof valor === 'object' && !Array.isArray(valor)) {
              desc += `📦 **${categoria}:** \`\`\`json\n${JSON.stringify(valor, null, 2)}\n\`\`\``;
            } else {
              desc += `📦 **${categoria}:** \`${valor}\``;
            }
            return desc;
          })
          .join('\n\n');
      };

      const embed = new EmbedBuilder()
        .setTitle(`📊 Database: ${categoria.toUpperCase()}`)
        .setColor('#3498db')
        .setTimestamp()
        .setDescription(gerarDescricao(pagina))
        .setFooter({
          text: `Página ${pagina + 1} de ${Math.ceil(allData.length / maxPorPagina)} | Total: ${
            allData.length
          } registros`,
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('⬅️ Página Anterior')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('➡️ Próxima Página')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(allData.length <= maxPorPagina)
      );

      await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: 1 << 6,
      });

      const msg = await interaction.fetchReply(); // <- Atualização aqui

      const collector = msg.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 2 * 60 * 1000,
      });

      collector.on('collect', async i => {
        if (i.customId === 'prev_page' && pagina > 0) pagina--;
        else if (i.customId === 'next_page' && (pagina + 1) * maxPorPagina < allData.length)
          pagina++;

        embed.setDescription(gerarDescricao(pagina));
        embed.setFooter({
          text: `Página ${pagina + 1} de ${Math.ceil(allData.length / maxPorPagina)} | Total: ${
            allData.length
          } registros`,
        });

        row.components[0].setDisabled(pagina === 0);
        row.components[1].setDisabled((pagina + 1) * maxPorPagina >= allData.length);

        await i.update({ embeds: [embed], components: [row] });
      });

      collector.on('end', async () => {
        try {
          row.components.forEach(button => button.setDisabled(true));
          await msg.edit({ components: [row] });
        } catch (e) {
          if (e.code !== 10008) logError(e);
        }
      });
    } catch (error) {
      logError('Erro ao consultar a database:', error);
      await interaction.reply({ content: '❌ Erro ao consultar a database.', flags: 1 << 6 });
    }
  },

  async autocomplete(client, interaction) {
    if (interaction.commandName !== 'verdb') return;
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'categoria') return;

    try {
      if (!clientMongo.isConnected?.()) await clientMongo.connect();
      const db = clientMongo.db(dbName);
      const collection = db.collection(collectionName);

      const sample = await collection.findOne({});
      if (!sample) return interaction.respond([]);

      const campos = Object.keys(sample).filter(k => k !== '_id');
      const busca = focused.value.toLowerCase();
      const filtrados = campos.filter(c => c.toLowerCase().startsWith(busca)).slice(0, 25);

      await interaction.respond(filtrados.map(c => ({ name: c, value: c })));
    } catch (error) {
      logError('Erro no autocomplete verdb:', error);
      await interaction.respond([]);
    }
  },
};
