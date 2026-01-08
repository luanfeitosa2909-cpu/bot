const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const { getGlobalData, setGlobalData } = require('../../database/globalData');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cacada')
    .setDescription('Ativa ou desativa o modo Caçada (tempo em call com bônus)')
    .addStringOption(option =>
      option
        .setName('status')
        .setDescription('Ativar ou desativar a caçada')
        .addChoices({ name: 'Ativar', value: 'ativar' }, { name: 'Desativar', value: 'desativar' })
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal para anunciar a caçada (opcional)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    try {
      await interaction.deferReply({ ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({
          content: '❌ Apenas administradores podem usar este comando.',
        });
      }

      const status = interaction.options.getString('status');
      const canalSelecionado = interaction.options.getChannel('canal');
      const ativo = status === 'ativar';

      await setGlobalData('cacada', ativo);

      const embedConfirmacao = new EmbedBuilder()
        .setColor(ativo ? '#27ae60' : '#c0392b')
        .setTitle(ativo ? '🦖 Caçada Ativada!' : '🌙 Caçada Encerrada')
        .setDescription(
          ativo
            ? 'Os dinossauros estão em movimento! Ganhos de coins aumentados nas chamadas de voz!'
            : 'A Caçada foi encerrada. Volte amanhã para mais recompensas!'
        )
        .setFooter({
          text: `Gerenciado por ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embedConfirmacao] });

      if (canalSelecionado?.isTextBased()) {
        const embedAnuncio = new EmbedBuilder()
          .setColor('#e67e22')
          .setTitle('📢 Aviso Jurássico!')
          .setDescription(
            ativo
              ? '🦖 **Atenção, sobreviventes!**\nA **Caçada** foi ativada! Coins extras para todos os que estiverem em call!\n\n⚠️ Prepare-se para rugir!'
              : '🌌 A **Caçada** foi encerrada. Os dinossauros voltaram a descansar...'
          )
          .setThumbnail('https://cdn-icons-png.flaticon.com/512/616/616408.png')
          .setFooter({ text: `${interaction.guild.name} - Sistema de Caçada` })
          .setTimestamp();

        await canalSelecionado.send({ embeds: [embedAnuncio] });
      }
    } catch (err) {
      logger.logError('cacada', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro ao alternar caçada.' });
        else
          await interaction.followUp({ content: '❌ Erro ao alternar caçada.', ephemeral: true });
      } catch (e) {
        logger.logError('cacada_notify_error', e);
      }
    }
  },
};
