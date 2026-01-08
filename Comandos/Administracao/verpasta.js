const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionFlagsBits,
} = require('discord.js');

const execSSH = require('../../Utils/SSH'); // seu execCommand via SSH

const MAX_DESC = 4096;
const LIMITE_PADRAO = 50; // por página
const LIMITE_MAXIMO = 300;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listartudo')
    .setDescription('Lista TODO o servidor via SSH a partir de uma pasta específica (paginado).')
    .addStringOption(opt =>
      opt.setName('caminho').setDescription('Diretório inicial (padrão: /home)').setRequired(false)
    )
    .addIntegerOption(opt =>
      opt
        .setName('limite')
        .setDescription('Máximo de itens por página (padrão: 50)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    const logger = require('../../Utils/logger');
    const caminho = interaction.options.getString('caminho') || '/home';
    const limiteUsuario = interaction.options.getInteger('limite') || LIMITE_PADRAO;
    const limite = Math.min(limiteUsuario, LIMITE_MAXIMO);

    await interaction.deferReply({ ephemeral: true });

    logger.logInfo('verpasta_start', `🔍 [SSH][CMD] Escaneando a partir de: ${caminho}`);

    let lista = [];
    try {
      const findCommand = `find ${caminho} \\( -path /proc -o -path /sys -o -path /dev \\) -prune -o -printf "%y %p %s\\n" 2>/dev/null`;
      const output = await execSSH(findCommand);

      if (!output) return interaction.editReply({ content: '📂 Nenhum arquivo encontrado.' });

      lista = output
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => {
          const [type, ...rest] = l.split(' ');
          const size = rest.pop();
          const path = rest.join(' ');
          return { type: type === 'd' ? 'd' : 'f', path, size: Number(size) || 0 };
        });
    } catch (err) {
      logger.logError('verpasta_ssh', err);
      return interaction.editReply({ content: '❌ Erro ao acessar o servidor via SSH.' });
    }

    if (lista.length === 0) {
      return interaction.editReply({ content: `📂 Nada encontrado em \`${caminho}\`.` });
    }

    lista.sort((a, b) => {
      if (a.type === 'd' && b.type !== 'd') return -1;
      if (a.type !== 'd' && b.type === 'd') return 1;
      return a.path.localeCompare(b.path);
    });

    // Função para montar embed por página
    const buildEmbedPage = page => {
      const start = page * limite;
      const end = Math.min(start + limite, lista.length);
      const itens = lista.slice(start, end);

      let descricao =
        `📍 **Pasta base:** \`${caminho}\`\n` +
        `📦 **Itens encontrados:** ${lista.length}\n` +
        `📄 **Exibindo:** ${start + 1}-${end}/${lista.length}\n\n`;

      for (const item of itens) {
        const icone = item.type === 'd' ? '📁' : '📄';
        const tam = item.size ? `(${item.size} bytes)` : '';
        if ((descricao + icone + ' ' + item.path + tam + '\n').length > MAX_DESC - 80) break;
        descricao += `${icone} \`${item.path}\` ${tam}\n`;
      }

      return new EmbedBuilder()
        .setTitle('📡 Scanner Completo via SSH')
        .setDescription(descricao)
        .setColor(0x5865f2)
        .setTimestamp();
    };

    let currentPage = 0;
    const totalPages = Math.ceil(lista.length / limite);

    // Botões de navegação
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev_page')
        .setLabel('⬅️ Anterior')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('next_page')
        .setLabel('Próximo ➡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(totalPages <= 1)
    );

    const message = await interaction.editReply({
      embeds: [buildEmbedPage(currentPage)],
      components: [row],
    });

    if (totalPages <= 1) return;

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 5 * 60 * 1000, // 5 minutos
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: '❌ Apenas o autor do comando pode usar os botões.',
          ephemeral: true,
        });
      }

      if (i.customId === 'prev_page') currentPage--;
      if (i.customId === 'next_page') currentPage++;

      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('⬅️ Anterior')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('Próximo ➡️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage + 1 === totalPages)
      );

      await i.update({ embeds: [buildEmbedPage(currentPage)], components: [newRow] });
    });

    collector.on('end', async () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('⬅️ Anterior')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('Próximo ➡️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
      );
      await interaction.editReply({ components: [disabledRow] });
      logger.logInfo('verpasta_end', `Collector ended for ${interaction.user.id}`);
    });
  },
};
