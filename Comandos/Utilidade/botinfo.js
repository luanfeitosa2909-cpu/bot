const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const os = require('os');
const moment = require('moment');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Mostra informações detalhadas sobre o bot.'),

  async run(client, interaction, _clientMongo) {
    const donoId = process.env.OWNER_ID || '857972001251524628';
    const dono = await client.users.fetch(donoId).catch(() => null);

    // Estatísticas
    const servidores = client.guilds.cache.size;
    const canais = client.channels.cache.size;
    const usuarios = client.users.cache.size;
    const ping = client.ws.ping;
    const uptime = moment.duration(client.uptime).humanize();

    // Recursos do sistema
    const usoMemoria = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalMemoria = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const cpu = os.cpus()[0].model;
    const plataforma = os.platform();
    const hostname = os.hostname();
    const ip =
      Object.values(os.networkInterfaces())
        .flat()
        .find(iface => iface.family === 'IPv4' && !iface.internal)?.address || 'Indefinido';

    // Versões
    const nodeVersion = process.version;
    const discordJsVersion = version;

    const embed = new EmbedBuilder()
      .setColor('Random')
      .setAuthor({ name: client.user.tag, iconURL: client.user.displayAvatarURL() })
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({
        text: `Solicitado por ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp()
      .setTitle('📊 Informações do Bot')
      .addFields(
        { name: '🤖 Nome', value: `\`${client.user.tag}\``, inline: true },
        { name: '👑 Dono', value: dono ? dono.tag : `<@${donoId}>`, inline: true },
        { name: '📌 ID', value: `\`${client.user.id}\``, inline: true },
        { name: '⚙ Servidores', value: `\`${servidores}\``, inline: true },
        { name: '⚙ Canais', value: `\`${canais}\``, inline: true },
        { name: '⚙ Usuários (cache)', value: `\`${usuarios}\``, inline: true },
        { name: '📡 Ping', value: `\`${ping}ms\``, inline: true },
        { name: '⏳ Uptime', value: `\`${uptime}\``, inline: true },
        {
          name: '💾 Memória usada',
          value: `\`${usoMemoria} MB / ${totalMemoria} GB\``,
          inline: true,
        },
        { name: '🖥 CPU', value: `\`${cpu}\``, inline: false },
        { name: '💻 Plataforma', value: `\`${plataforma}\``, inline: true },
        { name: '🌐 Hostname', value: `\`${hostname}\``, inline: true },
        { name: '🌍 IP Local', value: `\`${ip}\``, inline: true },
        { name: '📚 Node.js', value: `\`${nodeVersion}\``, inline: true },
        { name: '📚 Discord.js', value: `\`${discordJsVersion}\``, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
