// 📁 comandos/regras.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regras')
    .setDescription('Exibe o painel de Regras e Informações do servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('📚 REGRAS & INFORMAÇÕES DO SERVIDOR')
        .setColor('#5865F2')
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setImage(
          'https://media.discordapp.net/attachments/1385726045034123445/1388156260586623159/Regras.png'
        )
        .setDescription(
          [
            `👋 **Bem-vindo ao ${interaction.guild.name}!**`,
            '',
            'Nosso objetivo é oferecer uma experiência divertida, justa e respeitosa para todos.',
            'Aqui você encontrará as **regras essenciais** para manter a ordem tanto no nosso servidor Discord quanto no servidor **The Isle: Evrima**.',
            '',
            '🧾 **O que você encontrará aqui:**',
            '',
            '🔹 **Regras do Discord:**',
            '> Normas de convivência, respeito, uso dos canais, linguagem, flood, e comportamento geral.',
            '',
            '🔹 **Regras do Evrima:**',
            '> Condutas de gameplay, regras de combate, caçadas, KOS, e punições específicas.',
            '',
            '❗ **Importante:**',
            '> O descumprimento de qualquer regra pode resultar em advertências, silenciamentos ou banimentos.',
            '',
            '🚨 **Dúvidas ou denúncias:**',
            '> Abra um ticket em <#1353512604353433741> ou use o comando `/help`.',
            '',
            '⬇️ Clique no botão abaixo para acessar o menu completo de regras!',
          ].join('\n')
        )
        .setFooter({
          text: `${interaction.guild.name} • Sistema de Regras`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('abrir_menu_regras')
          .setLabel('📖 Abrir Menu de Regras')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
    } catch (err) {
      logger.logError('regras', err);
      if (!interaction.replied)
        await interaction.reply({ content: '❌ Erro ao exibir as regras.', ephemeral: true });
    }
  },
};
