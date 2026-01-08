const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Exibe informações detalhadas sobre o servidor.'),

  async run(client, interaction, _clientMongo) {
    const guild = interaction.guild;
    const nome = guild.name;
    const id = guild.id;
    const icon = guild.iconURL({ dynamic: true, size: 4096 }) || client.user.displayAvatarURL();
    const membros = guild.memberCount;
    const criacao = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`;
    const owner = await guild.fetchOwner();

    const canais_total = guild.channels.cache.size;
    const canais_texto = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
    const canais_voz = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
    const canais_categoria = guild.channels.cache.filter(
      c => c.type === ChannelType.GuildCategory
    ).size;
    const canais_forum = guild.channels.cache.filter(c => c.type === ChannelType.GuildForum).size;
    const canais_stage = guild.channels.cache.filter(
      c => c.type === ChannelType.GuildStageVoice
    ).size;

    const boosts = guild.premiumSubscriptionCount || 0;
    const boostLevel = guild.premiumTier ? `Nível ${guild.premiumTier}` : 'Nenhum';

    const emojis = guild.emojis.cache.size;
    const animatedEmojis = guild.emojis.cache.filter(e => e.animated).size;
    const staticEmojis = emojis - animatedEmojis;
    const stickers = guild.stickers.cache.size;

    const cargos = guild.roles.cache.size;
    const banner = guild.bannerURL({ size: 4096 });

    const verificationLevels = ['Nenhum', 'Baixo', 'Médio', 'Alto', 'Muito Alto'];
    const verification = verificationLevels[guild.verificationLevel] || 'Desconhecido';
    const nsfw = guild.nsfwLevel ? '🔞 Ativo' : 'Desativado';

    const color = '#0099ff';

    const embed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({ name: nome, iconURL: icon })
      .setThumbnail(icon)
      .setTitle('📊 Informações do Servidor')
      .setDescription(`Informações detalhadas sobre o servidor **${nome}**`)
      .addFields(
        { name: '👑 Dono', value: `<@${owner.id}> (\`${owner.user.tag}\`)`, inline: true },
        { name: '🆔 ID', value: `\`${id}\``, inline: true },
        { name: '📅 Criado em', value: criacao, inline: true },
        { name: '🔒 Verificação', value: verification, inline: true },
        { name: '🔞 NSFW', value: nsfw, inline: true },
        { name: '👥 Membros', value: `\`${membros}\``, inline: true },
        { name: '💬 Texto', value: `\`${canais_texto}\``, inline: true },
        { name: '🔊 Voz', value: `\`${canais_voz}\``, inline: true },
        { name: '📁 Categorias', value: `\`${canais_categoria}\``, inline: true },
        { name: '🗂️ Fórum', value: `\`${canais_forum}\``, inline: true },
        { name: '🎤 Stage', value: `\`${canais_stage}\``, inline: true },
        { name: '📦 Total de Canais', value: `\`${canais_total}\``, inline: true },
        { name: '🛡️ Cargos', value: `\`${cargos}\``, inline: true },
        { name: '🏷️ Stickers', value: `\`${stickers}\``, inline: true },
        { name: '🚀 Boosts', value: `\`${boosts}\` (${boostLevel})`, inline: true },
        {
          name: '😃 Emojis',
          value: `Total: \`${emojis}\`\nEstáticos: \`${staticEmojis}\`\nAnimados: \`${animatedEmojis}\``,
          inline: true,
        }
      )
      .setFooter({ text: `ID do servidor: ${id}`, iconURL: icon })
      .setTimestamp();

    if (banner) embed.setImage(banner);

    const botao = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setURL(icon).setLabel('Ícone do servidor').setStyle(ButtonStyle.Link)
    );

    await interaction.reply({ embeds: [embed], components: [botao] });
  },
};
