const {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const categoryEmojis = {
  utilidade: '🛠️',
  economia: '💰',
  tickets: '🎫',
  staff: '🛡️',
  eventos: '🎉',
  musica: '🎵',
  geral: '🌐',
  administracao: '🔒',
  owner: '👑',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Central de ajuda com todos os comandos do servidor'),

  async run(client, interaction, _clientMongo) {
    const comandosDir = path.join(__dirname, '..', '..');
    const comandosFolder = path.join(comandosDir, 'Comandos');

    const staffRoleId = process.env.STAFF_ROLE_ID;
    const isStaff =
      interaction.member.permissions.has('Administrator') ||
      interaction.member.roles.cache.has(staffRoleId);

    let categories = fs
      .readdirSync(comandosFolder)
      .filter(f => fs.statSync(path.join(comandosFolder, f)).isDirectory());

    if (!isStaff) {
      categories = categories.filter(
        name => !['administracao', 'owner'].includes(name.toLowerCase())
      );
    }

    const optionsArr = categories.map(category => ({
      label: category.charAt(0).toUpperCase() + category.slice(1),
      description: `Veja os comandos da categoria ${category}`,
      value: category,
      emoji: categoryEmojis[category.toLowerCase()] || '📂',
    }));

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${interaction.guild?.name || 'Servidor'} • Central de Ajuda`,
        iconURL: interaction.guild?.iconURL() || client.user.displayAvatarURL(),
      })
      .setColor('#00B0F4')
      .setThumbnail(interaction.guild?.iconURL() || client.user.displayAvatarURL())
      .setImage(
        'https://cdn.discordapp.com/attachments/1138578460660942928/1245830918572439632/banner-ajuda.png'
      )
      .setDescription(
        `👋 Olá ${interaction.user}, bem-vindo(a) à central de comandos do **${
          interaction.guild?.name || 'servidor'
        }**!\n\n` +
          '🔹 **Selecione uma categoria abaixo para ver os comandos disponíveis.**\n' +
          '🔹 Todos os comandos possuem descrição para facilitar seu uso.\n\n' +
          '❓ Dúvidas? Abra um ticket ou chame um staff!'
      )
      .setFooter({
        text: `${interaction.guild?.name || 'Servidor'} • Sistema de Ajuda`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('menu-help')
        .setPlaceholder('Selecione uma categoria')
        .addOptions(optionsArr)
    );

    await interaction.reply({
      embeds: [embed],
      components: [menu],
      flags: 1 << 6,
    });

    const filter = i => i.user.id === interaction.user.id && i.customId === 'menu-help';

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on('collect', async i => {
      await i.deferUpdate();
      const selected = i.values[0];
      const categoryPath = path.join(comandosFolder, selected);
      const commandsFiles = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

      const commandsArr = commandsFiles.map(cmdFile => {
        const commandData = require(path.join(categoryPath, cmdFile));
        const commandName =
          commandData?.data?.name || commandData.name || cmdFile.replace('.js', '');
        const commandDesc =
          commandData?.data?.description || commandData.description || 'Sem descrição.';
        return `> **/${commandName}** — ${commandDesc}`;
      });

      embed
        .setTitle(
          `${categoryEmojis[selected.toLowerCase()] || '📂'} Comandos de ${
            selected.charAt(0).toUpperCase() + selected.slice(1)
          }`
        )
        .setDescription(
          commandsArr.length ? commandsArr.join('\n') : 'Nenhum comando encontrado nesta categoria.'
        )
        .setFields([]);

      await interaction.editReply({
        embeds: [embed],
        components: [menu],
      });
    });

    collector.on('end', () => {
      try {
        menu.components[0].setDisabled(true);
        interaction.editReply({ components: [menu] }).catch(() => {});
        // eslint-disable-next-line no-empty
      } catch {}
    });
  },
};
