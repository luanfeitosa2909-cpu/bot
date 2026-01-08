const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

function formatOptions(options) {
  if (!options || options.length === 0) return 'Nenhuma';
  return options.map(opt => `**${opt.name}**: \`${opt.value ?? 'N/A'}\``).join('\n');
}

async function logSlash(interaction) {
  try {
    // Verifica se é em servidor
    if (!interaction.guild) return;

    // Verifica se o membro tem o cargo staff
    const staffRoleId = process.env.STAFF_ROLE_ID;
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(staffRoleId)) return; // não loga se não for staff

    // Pega o canal de log configurado no .env
    const channel = await interaction.client.channels
      .fetch(process.env.LOGS_CHANNEL_COMMANDS)
      .catch(() => null);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('📘 Slash Command Executado')
      .setColor('Blurple')
      .addFields(
        {
          name: '👤 Usuário',
          value: `${interaction.user.tag} (\`${interaction.user.id}\`)`,
          inline: false,
        },
        { name: '📎 Comando', value: `\`/${interaction.commandName}\``, inline: false },
        { name: '📄 Opções', value: formatOptions(interaction.options?.data), inline: false },
        { name: '📍 Canal', value: `<#${interaction.channelId}>`, inline: true },
        {
          name: '🏠 Servidor',
          value: `${interaction.guild.name} (\`${interaction.guild.id}\`)`,
          inline: true,
        }
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (e) {
    console.error('Erro ao logar slash command:', e);
  }
}

module.exports = {
  logSlash,
};
