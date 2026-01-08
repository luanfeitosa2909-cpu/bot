const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loja')
    .setDescription('🛒 Abra a loja para comprar produtos com seus coins')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    try {
      await interaction.deferReply({ ephemeral: true });
      // 🔹 Verificação de permissão
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#e74c3c')
              .setTitle('🚫 Acesso Negado')
              .setDescription('Apenas **Administradores** podem abrir a loja.')
              .setTimestamp()
              .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() }),
          ],
        });
      }

      // 🔹 Lista de produtos
      const produtos = [
        { id: 'ninhoale1', label: '🥚 Ninho Aleatório T1/2', preco: 4.5, categoria: 'Ninhos' },
        { id: 'ninhoale2', label: '🥚 Ninho Aleatório T3', preco: 6.5, categoria: 'Ninhos' },
        { id: 'ninhoale3', label: '🥚 Ninho Aleatório T4', preco: 9.5, categoria: 'Ninhos' },
        { id: 'ninhoale4', label: '🥚 Ninho Aleatório T5', preco: 12.5, categoria: 'Ninhos' },
        { id: 'ninhoale5', label: '🥚 Ninho Aleatório T6', preco: 15.5, categoria: 'Ninhos' },
        { id: 'ninhoesp1', label: '🥚 Ninho Escolhido T1/2', preco: 7.5, categoria: 'Ninhos' },
        { id: 'ninhoesp2', label: '🥚 Ninho Escolhido T3', preco: 9.5, categoria: 'Ninhos' },
        { id: 'ninhoesp3', label: '🥚 Ninho Escolhido T4', preco: 14.0, categoria: 'Ninhos' },
        { id: 'ninhoesp4', label: '🥚 Ninho Escolhido T5', preco: 17.0, categoria: 'Ninhos' },
        { id: 'ninhoesp5', label: '🥚 Ninho Escolhido T6', preco: 35.0, categoria: 'Ninhos' },
        {
          id: 'fila',
          label: '🦎 Furar Fila (ABRIR TICKET)',
          preco: 40000000,
          categoria: 'Serviços',
        },
      ];

      // 🔹 Menu de seleção
      const menu = new StringSelectMenuBuilder()
        .setCustomId('loja_selecionar')
        .setPlaceholder('🦴 Escolha seu item')
        .addOptions(
          produtos.map(p => ({
            label: `${p.label}`,
            description: `💰 ${p.preco.toLocaleString('pt-BR')} coins • Categoria: ${p.categoria}`,
            value: p.id,
          }))
        );

      const row = new ActionRowBuilder().addComponents(menu);

      // 🔹 Embed da Loja Profissional
      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle(`🛒 Loja Oficial • ${interaction.guild.name}`)
        .setDescription(
          `✨ **Bem-vindo à Loja Pré-Histórica!**\n\n` +
            `➡️ **Como comprar:** selecione um item no menu abaixo.\n` +
            `💡 **Dica:** participe do servidor para ganhar mais coins.\n` +
            `🎁 Use cupons de desconto quando disponíveis.`
        )
        .addFields(
          {
            name: '🛍️ Categorias Disponíveis',
            value:
              '🥚 **Ninhos** → Mutação aleatória ou escolhida\n**Serviços** → Furar fila ou mudar skin\n🎟️ **Cupons** → Ganhe descontos exclusivos',
          },
          {
            name: '💰 Economia do Servidor',
            value:
              '• Coins podem ser ganhos participando de eventos\n• Ficar em call = Ganhar + Coins\n• Preços variam em igualdade com o item da loja',
          },
          {
            name: '📖 Regras de Compra',
            value:
              '✔️ Cada compra é registrada com seu ID e horário\n✔️ Saldo de coins atualizado automaticamente\n✔️ Não compartilhe sua conta',
          }
        )
        .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 512 }))
        .setImage(
          'https://images-ext-1.discordapp.net/external/LiuXp_8wEo8iiPctJE_QOkIVvFow_gYS5J8CU3A-_dc/%3Fcb%3D20180909083920/https/static.wikia.nocookie.net/isle/images/7/71/IsleBanner.jpg/revision/latest?format=webp'
        )
        .setFooter({
          text: `The Isle • ${interaction.guild.name}`,
          iconURL: interaction.guild.iconURL(),
        })
        .setTimestamp();

      // 🔹 Resposta
      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      logger.logError('loja', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro ao abrir a loja.' });
        else await interaction.followUp({ content: '❌ Erro ao abrir a loja.', ephemeral: true });
      } catch (e) {
        logger.logError('loja_notify_error', e);
      }
    }
  },
};
