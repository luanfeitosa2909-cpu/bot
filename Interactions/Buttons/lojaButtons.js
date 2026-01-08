const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');
const { gerarEmbedAtendido } = require('../../Loja/lojaUtils');
const produtos = require('../../Loja/produtosLoja');

module.exports = {
  type: 'button',
  customId: null,
  match: id =>
    id.startsWith('confirmar_') ||
    id.startsWith('cupom_') ||
    id === 'cancelar' ||
    id.startsWith('atender_'),

  run: async (client, interaction, _clientMongo) => {
    const id = interaction.customId;

    // -------------------- CONFIRMAR PEDIDO --------------------
    if (id.startsWith('confirmar_')) {
      const [, produtoId, cupom] = id.split('_');
      const produto = produtos[produtoId];

      if (!produto) {
        return interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('❌ Produto Inválido')
              .setDescription('O produto selecionado não existe ou foi removido.'),
          ],
          components: [],
        });
      }

      // Modal para descrição + dinossauro
      const modal = new ModalBuilder()
        .setCustomId(`modal_confirmar_${produtoId}_${cupom || 'nocup'}`)
        .setTitle('📝 Confirmar Pedido');

      const descricaoInput = new TextInputBuilder()
        .setCustomId('descricao')
        .setLabel('Descrição do pedido (opcional)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Ex: Entregar rápido, preferência azul...')
        .setRequired(false);

      const dinoInput = new TextInputBuilder()
        .setCustomId('dinossauro')
        .setLabel('Qual dinossauro você deseja?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: Cerato, Trike, Giga, Ava...')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(descricaoInput),
        new ActionRowBuilder().addComponents(dinoInput)
      );

      return interaction.showModal(modal);
    }

    // -------------------- CUPOM DE DESCONTO --------------------
    if (id.startsWith('cupom_')) {
      const produtoId = id.replace('cupom_', '');
      const modal = new ModalBuilder()
        .setCustomId(`modal_cupom_${produtoId}`)
        .setTitle('🎟️ Aplicar Cupom de Desconto');

      const input = new TextInputBuilder()
        .setCustomId('codigo_cupom')
        .setLabel('Digite o código do cupom')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: DESCONTO10')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // -------------------- CANCELAR --------------------
    if (id === 'cancelar') {
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor('Orange')
            .setTitle('❌ Compra Cancelada')
            .setDescription('A operação foi cancelada pelo usuário.'),
        ],
        components: [],
      });
    }

    // -------------------- ATENDER --------------------
    if (id.startsWith('atender_')) {
      const [, alvoId, produtoId] = id.split('_');

      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('🚫 Acesso Negado')
              .setDescription('Apenas membros da equipe podem usar este botão.'),
          ],
          flags: 1 << 6,
        });
      }

      const produto = produtos[produtoId];
      try {
        const user = await client.users.fetch(alvoId);
        const embedAtendido = gerarEmbedAtendido(interaction, produto.label, interaction.user.id);
        if (embedAtendido) {
          await user.send({ embeds: [embedAtendido] }).catch(() => {});
        }
        // eslint-disable-next-line no-empty
      } catch {}

      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor('Green')
            .setTitle('✅ Compra Atendida')
            .setDescription(
              `A compra de <@${alvoId}> foi marcada como atendida por <@${interaction.user.id}>.`
            ),
        ],
        components: [],
      });
    }
  },
};
