require('dotenv').config();
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { connectDB, getUserDataCollection } = require('../../database/mongodb');
const { logError } = require('../../Utils/logger');

const canalLogId = process.env.LOG_CHANNEL_LIMPARDATABASE;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('limpardb')
    .setDescription(
      "🧹 Remove campos com 'tempo' ou 'entrada' em todos os documentos (admin apenas)"
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

    try {
      await connectDB();
      const collection = getUserDataCollection();

      const documentos = await collection
        .find({
          $or: [
            { entrada: { $exists: true } },
            { tempo_1353437609682276443: { $exists: true } },
            { entrada_1353437609682276443: { $exists: true } },
          ],
        })
        .toArray();

      if (documentos.length === 0) {
        return interaction.reply({
          content: "📭 Nenhum documento com campos 'tempo' ou 'entrada' encontrado.",
          flags: 1 << 6,
        });
      }

      const camposParaRemover = new Set();
      documentos.forEach(doc => {
        Object.keys(doc).forEach(key => {
          if (key.includes('tempo') || key.includes('entrada')) {
            camposParaRemover.add(key);
          }
        });
      });

      if (camposParaRemover.size === 0) {
        return interaction.reply({
          content: "📭 Nenhum campo 'tempo' ou 'entrada' encontrado para remover.",
          flags: 1 << 6,
        });
      }

      const unsetObj = {};
      camposParaRemover.forEach(key => {
        unsetObj[key] = '';
      });

      const resultado = await collection.updateMany({}, { $unset: unsetObj });

      await interaction.reply({
        content: `✅ Campos removidos com sucesso de ${resultado.modifiedCount} documentos.`,
        flags: 1 << 6,
      });

      const canalLogs = client.channels.cache.get(canalLogId);
      if (canalLogs?.isTextBased()) {
        const embedLog = new EmbedBuilder()
          .setTitle("🗑️ Limpeza de campos 'tempo' e 'entrada'")
          .setColor('Red')
          .addFields(
            {
              name: '👤 Executado por',
              value: `<@${interaction.user.id}> (${interaction.user.tag})`,
            },
            { name: '📊 Total documentos afetados', value: `${resultado.modifiedCount}` },
            {
              name: '🗝️ Campos removidos',
              value:
                [...camposParaRemover]
                  .slice(0, 20)
                  .map(k => `- \`${k}\``)
                  .join('\n') +
                (camposParaRemover.size > 20
                  ? `\n...e mais ${camposParaRemover.size - 20} campos.`
                  : ''),
            },
            { name: '🕒 Data', value: new Date().toLocaleString('pt-BR') }
          )
          .setFooter({ text: 'Sistema de Gerenciamento de Database' })
          .setTimestamp();

        await canalLogs.send({ embeds: [embedLog] }).catch(logError);
      }
    } catch (error) {
      logError('Erro ao executar comando limpardb:', error);
      await interaction.reply({ content: `❌ Ocorreu um erro: ${error.message}`, flags: 1 << 6 });
    }
  },
};
