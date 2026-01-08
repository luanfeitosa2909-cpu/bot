const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../Utils/logger');

const filePath = path.join(process.cwd(), 'data', 'invites.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('relatorio_usuario')
    .setDescription('📈 Veja quem um usuário convidou e se os membros ainda estão ativos.')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('Usuário para consultar os convites')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const targetUser = interaction.options.getUser('usuario');
      if (!fs.existsSync(filePath)) {
        return interaction.editReply('❌ Nenhum dado encontrado ainda.');
      }

      const hoje = new Date().toISOString().split('T')[0];
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const entry = data.find(d => d.userId === targetUser.id);

      if (!entry) {
        return interaction.editReply({
          content: `❌ O usuário ${targetUser.tag} não possui registros de convite.`,
        });
      }

      const convidados = entry.invited || [];
      const aindaNoServidor = convidados.filter(c => c.stillInGuild).length;
      const ativosHoje = convidados.filter(c => c.activeDates.includes(hoje)).length;

      const lista =
        convidados.length > 0
          ? convidados
              .map(c => {
                const icones = [
                  c.stillInGuild ? '✅' : '❌',
                  c.activeDates.includes(hoje) ? '🟢' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                const nome = c.userId === 'desconhecido' ? '**Desconhecido**' : `<@${c.userId}>`;

                return `• ${nome} — ${icones}`;
              })
              .join('\n')
              .slice(0, 1000)
          : 'Nenhum usuário convidado.';

      const embed = new EmbedBuilder()
        .setTitle(`📋 Relatório de Convites — ${targetUser.tag}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setColor('DarkBlue')
        .addFields(
          { name: '👥 Total Convidados', value: `${convidados.length}`, inline: true },
          { name: '✅ Ainda no Servidor', value: `${aindaNoServidor}`, inline: true },
          { name: '🟢 Ativos Hoje', value: `${ativosHoje}`, inline: true },
          { name: '📌 Lista de Convidados', value: lista }
        )
        .setFooter({ text: `Consulta feita em: ${hoje}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      logger.logInfo(
        `relatorio_usuario`,
        `Relatório gerado para ${targetUser.tag} (${targetUser.id})`
      );
    } catch (err) {
      logger.logError(`relatorio_usuario`, err);
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({
            content: '❌ Ocorreu um erro ao gerar o relatório.',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: '❌ Ocorreu um erro ao gerar o relatório.',
            ephemeral: true,
          });
        }
      } catch (replyErr) {
        logger.logError(`relatorio_usuario_reply`, replyErr);
      }
    }
  },
};
