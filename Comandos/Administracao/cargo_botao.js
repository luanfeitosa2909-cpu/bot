const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cargo_botao')
    .setDescription('Ganhe cargos clicando nos botões.')
    .addRoleOption(option =>
      option
        .setName('cargo')
        .setDescription('Cargo que será adicionado no botão.')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({
          content: 'Você não possui permissão para utilizar este comando.',
          ephemeral: true,
        });
      }

      const cargo = interaction.options.getRole('cargo');

      const embed = new EmbedBuilder()
        .setColor('Random')
        .setAuthor({
          name: interaction.guild.name,
          iconURL: interaction.guild.iconURL({ dynamic: true }),
        })
        .setDescription(`Clique no botão abaixo para resgatar o cargo **${cargo.name}**.`);

      const customId = `cargo_b_${Date.now()}`;
      const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(customId)
          .setLabel('Clique Aqui!')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({ embeds: [embed], components: [botao] });

      const coletor = interaction.channel.createMessageComponentCollector({
        filter: i => i.customId === customId,
        time: 1000 * 60 * 60,
      });

      coletor.on('collect', async c => {
        try {
          if (!c.member.roles.cache.has(cargo.id)) {
            await c.member.roles.add(cargo.id);
            await c.reply({
              content: `Olá **${c.user.username}**, você resgatou o cargo **${cargo.name}**.`,
              ephemeral: true,
            });
          } else {
            await c.member.roles.remove(cargo.id);
            await c.reply({
              content: `Olá **${c.user.username}**, você perdeu o cargo **${cargo.name}**.`,
              ephemeral: true,
            });
          }
        } catch (err) {
          logger.logError('Erro no coletor cargo_botao:', err);
          if (!c.replied)
            await c.reply({ content: '❌ Erro ao processar sua ação.', ephemeral: true });
        }
      });
    } catch (err) {
      logger.logError('Erro no comando cargo_botao:', err);
      if (!interaction.replied)
        await interaction.reply({ content: '❌ Erro ao criar botão de cargo.', ephemeral: true });
    }
  },
};
