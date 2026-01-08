const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const sftp = require('../../Utils/SSH');

const LOG_PATH = '/TheIsle/Saved/Logs/TheIsle-Shipping.log';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verlog')
    .setDescription('Mostra as últimas linhas do log do servidor The Isle.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction) {
    const logger = require('../../Utils/logger');
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const txt = await sftp.read(LOG_PATH);
    if (!txt) {
      return interaction.editReply({ content: '❌ Não foi possível ler o log via SFTP.' });
    }

    const lines = txt.trim().split('\n');
    let resposta = '';

    for (let i = lines.length - 1; i >= 0; i--) {
      if (resposta.length + lines[i].length + 1 > 1850) break;
      resposta = lines[i] + '\n' + resposta;
    }

    await interaction.editReply({ content: `📄 **Últimas linhas:**\n\`\`\`\n${resposta}\n\`\`\`` });
  },
};
