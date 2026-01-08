const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('relatoriogeral')
    .setDescription('📊 Relatório completo de saúde e uso do bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),
  async run(client, interaction, clientMongo) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ Você precisa ser administrador para usar este comando.',
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const totalGuilds = client.guilds.cache.size;
      const totalChannels = client.channels.cache.size;
      const totalUsers = client.guilds.cache.reduce((sum, g) => sum + (g.memberCount || 0), 0);
      const totalCommands = client.slashCommands.size;

      const db = clientMongo.db('ProjetoGenoma');
      const membersCol = db.collection('Members');
      const totalMembers = await membersCol.countDocuments();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newMembers = await membersCol.countDocuments({ registeredAt: { $gte: weekAgo } });

      const logPath = path.resolve(
        process.env.LOG_FILE_PATH || path.join(__dirname, '..', '..', 'logs', 'errors.log')
      );
      let errorCount = 0;
      let warningCount = 0;
      let logReadError = false;
      let lastErrorMsg = null;
      let lastWarningMsg = null;
      let lastErrorDate = null;
      let lastWarningDate = null;

      if (!fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, '');
      }

      try {
        const logData = fs.readFileSync(logPath, 'utf8');
        const lines = logData.split('\n').filter(line => line.trim());
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i];
          if (/\[ERR|erro|error/i.test(line)) {
            errorCount++;
            if (!lastErrorMsg) {
              lastErrorMsg = line;
              const match = line.match(/\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\d{2}/);
              lastErrorDate = match ? match[0] : '';
            }
          }
          if (/\[WARN|warn|warning/i.test(line)) {
            warningCount++;
            if (!lastWarningMsg) {
              lastWarningMsg = line;
              const match = line.match(/\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/);
              lastWarningDate = match ? match[0] : '';
            }
          }
        }
      } catch (err) {
        logReadError = true;
      }

      const uptimeSeconds = Math.floor(process.uptime());
      const uptimeStr = `${Math.floor(uptimeSeconds / 86400)}d ${Math.floor(
        (uptimeSeconds % 86400) / 3600
      )}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`;

      const embed = new EmbedBuilder()
        .setTitle('📊 Relatório Completo do Bot')
        .setColor(errorCount > 0 ? 'Red' : warningCount > 0 ? 'Yellow' : 'Green')
        .setDescription(
          `🔎 **Visão geral de uso e saúde do bot**\n\n> _Gerado em:_ <t:${Math.floor(
            Date.now() / 1000
          )}:f>`
        )
        .addFields(
          { name: '🤖 Uptime', value: uptimeStr, inline: true },
          { name: '🏓 Ping', value: `${client.ws.ping}ms`, inline: true },
          { name: '⚙️ Comandos', value: `${totalCommands}`, inline: true },
          { name: '🗄️ Servidores', value: `${totalGuilds}`, inline: true },
          { name: '👥 Usuários', value: `${totalUsers}`, inline: true },
          { name: '💬 Canais', value: `${totalChannels}`, inline: true },
          { name: '🔐 Membros DB', value: `${totalMembers}`, inline: true },
          { name: '🆕 Novos (7d)', value: `${newMembers}`, inline: true },
          {
            name: '❗️ Erros',
            value: logReadError ? 'Não foi possível ler o log.' : `${errorCount}`,
            inline: true,
          },
          {
            name: '⚠️ Warnings',
            value: logReadError ? 'Não foi possível ler o log.' : `${warningCount}`,
            inline: true,
          },
          { name: '📦 Node.js', value: process.version, inline: true },
          { name: '📚 Discord.js', value: require('discord.js').version, inline: true }
        );

      if (lastErrorMsg) {
        embed.addFields({
          name: '⏰ Último erro',
          value: `\`\`\`${lastErrorMsg}\`\`\`\n🗓️ ${lastErrorDate}`,
        });
      }

      if (lastWarningMsg) {
        embed.addFields({
          name: '⏰ Último warning',
          value: `\`\`\`${lastWarningMsg}\`\`\`\n🗓️ ${lastWarningDate}`,
        });
      }

      embed
        .setFooter({
          text: `${interaction.guild.name} • Relatório gerado por ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.logError('relatoriogeral', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro ao gerar o relatório.' });
        else
          await interaction.followUp({ content: '❌ Erro ao gerar o relatório.', ephemeral: true });
      } catch (e) {
        logger.logError('relatoriogeral_notify_error', e);
      }
    }
  },
};
