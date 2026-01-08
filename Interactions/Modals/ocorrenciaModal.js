const { EmbedBuilder, Colors } = require('discord.js');
const {
  getPlayerByUserIdOrSteamId,
  salvarOcorrencia,
  formatarHistorico,
} = require('../../Utils/ocorrenciaUtils');

const CORES = { leve: Colors.Green, media: Colors.Yellow, grave: Colors.Red };
const EMOJIS = { leve: '🟢', media: '🟡', grave: '🔴' };

function formatValue(value) {
  // Se for menção de usuário (Discord), deixa normal
  if (/^<@!?[0-9]+>$/.test(value.trim())) {
    return value;
  }
  // Se tiver múltiplas linhas (ex: descrições grandes), usa bloco de código
  if (value.includes('\n')) {
    return '```fix\n' + value + '\n```';
  }
  // Senão, usa inline code (fundo preto pequeno)
  return '`' + value + '`';
}

module.exports = {
  type: 'modal',
  match: customId => customId.startsWith('modal_ocorrencia|'),

  async run(client, interaction) {
    try {
      const [_, inputBusca, gravidade] = interaction.customId.split('|');
      const descricao = interaction.fields.getTextInputValue('descricao');
      const duracao = interaction.fields.getTextInputValue('duracao') || 'N/A';

      const player = await getPlayerByUserIdOrSteamId(inputBusca);
      if (!player) {
        return interaction.reply({
          content: '❌ Jogador não encontrado na base de dados.',
          flags: 64,
        });
      }

      const data = new Date();

      const sucesso = await salvarOcorrencia({
        userId: player.user_id,
        steamid: player.steamid,
        steamname: player.steamname,
        descricao,
        tipo: gravidade,
        autor: interaction.user.id,
        data,
        duracao,
      });

      if (!sucesso) {
        return interaction.reply({
          content: '❌ Falha ao salvar ocorrência no banco de dados.',
          flags: 64,
        });
      }

      const historico = await formatarHistorico(player.user_id);

      const embed = new EmbedBuilder()
        .setTitle('📄 Ocorrência Registrada')
        .setColor(CORES[gravidade] || Colors.Default)
        .addFields(
          {
            name: '👤 Nome do jogador',
            value: formatValue(`<@${player.user_id}>`),
            inline: true,
          },
          {
            name: '🆔 IDs',
            value:
              `SteamID: ${formatValue(player.steamid || 'N/A')}\n` +
              `Discord: ${formatValue(`<@${player.user_id}>`)}`,
            inline: true,
          },
          {
            name: '📅 Data da ocorrência',
            value: formatValue(data.toLocaleDateString('pt-BR')),
            inline: true,
          },
          {
            name: '⚖️ Tipo da ocorrência',
            value: formatValue(`${EMOJIS[gravidade] || ''} ${gravidade.toUpperCase()}`),
            inline: true,
          },
          {
            name: '📄 Descrição da ocorrência',
            value: formatValue(
              descricao.length > 1024 ? descricao.slice(0, 1020) + '...' : descricao
            ),
            inline: true,
          },
          {
            name: '⏱️ Duração da punição',
            value: formatValue(duracao),
            inline: true,
          },
          {
            name: '👮 Staff responsável',
            value: formatValue(`<@${interaction.user.id}>`),
            inline: true,
          },
          {
            name: '📌 Observações adicionais',
            value: formatValue('Jogador cooperou e será monitorado.'),
            inline: false,
          }
        )
        .setFooter({ text: 'Projeto Genoma - Sistema de Ocorrências' })
        .setTimestamp(data);

      if (historico) {
        embed.addFields({
          name: '📚 Histórico de ocorrências anteriores',
          value: historico.length > 1024 ? historico.slice(0, 1020) + '...' : historico,
        });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('❌ Erro no modal_ocorrencia:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Algo deu errado ao processar sua ocorrência.',
          flags: 64,
        });
      }
    }
  },
};
