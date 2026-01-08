const { TextInputStyle } = require('discord.js');
const produtos = require('../../Loja/produtosLoja');

module.exports = {
  type: 'modal',
  customId: id => id.startsWith('modal_cupom_'),

  run: async (client, interaction, clientMongo) => {
    const db = clientMongo.db('ProjetoGenoma');
    const cupomCollection = db.collection('cupom');

    const userId = interaction.user.id;
    const codigoCupom = interaction.fields.getTextInputValue('codigo_cupom').toUpperCase().trim();
    const produtoId = interaction.customId.replace('modal_cupom_', '');
    const produto = produtos[produtoId];

    if (!produto) {
      return interaction.reply({
        content: '❌ Produto inválido.',
        flags: 1 << 6,
      });
    }

    await interaction.deferReply({ flags: 1 << 6 });

    const cupomData = await cupomCollection.findOne({ codigo: codigoCupom });

    if (!cupomData) {
      return interaction.editReply({ content: '❌ Cupom inválido.' });
    }

    if (Date.now() > cupomData.expiracao) {
      return interaction.editReply({ content: '❌ Este cupom expirou.' });
    }

    if (cupomData.usadoPor?.includes(userId)) {
      return interaction.editReply({ content: '❌ Você já utilizou este cupom.' });
    }

    const desconto = cupomData.desconto > 1 ? cupomData.desconto : cupomData.desconto * 100;
    const novoPreco = Math.ceil(produto.preco * (1 - desconto / 100));

    const confirmarId = `confirmar_${produtoId}_${codigoCupom}`;

    return interaction.editReply({
      content: `💸 **Cupom aplicado com sucesso!**\nDesconto: **${desconto}%**\nPreço com desconto: **${novoPreco} coins**\nClique no botão abaixo para confirmar a compra.`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              label: 'Confirmar Compra',
              custom_id: confirmarId,
            },
            {
              type: 2,
              style: 4,
              label: 'Cancelar',
              custom_id: 'cancelar',
            },
          ],
        },
      ],
    });
  },
};
