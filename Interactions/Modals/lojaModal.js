require('dotenv').config();
const { gerarResumoCompra, gerarLogCompra, enviarLogCompra } = require('../../Loja/lojaUtils');
const produtos = require('../../Loja/produtosLoja');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  type: 'modal',
  match: id => id.startsWith('modal_confirmar_'),

  async run(client, interaction, clientMongo) {
    await interaction.deferReply({ flags: 1 << 6 });

    const [, , produtoId, cupom] = interaction.customId.split('_');

    const descricao =
      interaction.fields.getTextInputValue('descricao') || 'Nenhuma descrição fornecida';
    const dinossauro = interaction.fields.getTextInputValue('dinossauro') || 'Não informado';

    const db = clientMongo.db('ProjetoGenoma');
    const users = db.collection('DataBase');
    const userId = interaction.user.id;
    const userData = (await users.findOne({ user_id: userId })) || {};

    const produto = produtos[produtoId];
    if (!produto) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('❌ Produto Inválido')
            .setDescription('O produto selecionado não existe.'),
        ],
      });
    }

    let desconto = 0;
    let cupData = null;

    if (cupom && cupom !== 'nocup') {
      cupData = await db.collection('cupom').findOne({ codigo: cupom });

      if (!cupData || Date.now() > cupData.expiracao || cupData.usadoPor?.includes(userId)) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#e74c3c')
              .setTitle('❌ Cupom Inválido')
              .setDescription('O cupom inserido é inválido, expirado ou já usado por você.'),
          ],
        });
      }

      desconto = cupData.desconto > 1 ? cupData.desconto / 100 : cupData.desconto;
    }

    const preco = Math.ceil(produto.preco * (1 - desconto));
    const saldoAtual = userData.coins || 0;

    if (saldoAtual < preco) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('❌ Saldo Insuficiente')
            .setDescription(
              `Você possui **${saldoAtual.toLocaleString(
                'pt-BR'
              )} coins**, mas precisa de **${preco.toLocaleString('pt-BR')} coins**.`
            ),
        ],
      });
    }

    const novoSaldo = saldoAtual - preco;

    await users.updateOne({ user_id: userId }, { $set: { coins: novoSaldo } }, { upsert: true });

    const timestamp = new Date().toLocaleString('pt-BR');

    // ---------------- DM do usuário ----------------
    const resumoEmbed = gerarResumoCompra(
      interaction,
      produto,
      preco,
      timestamp,
      novoSaldo,
      dinossauro
    );

    await interaction.user.send({ embeds: [resumoEmbed] }).catch(() => {});

    // ---------------- Log da Staff ----------------
    const canalLog = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_LOJA);

    if (canalLog?.isTextBased()) {
      const logEmbed = gerarLogCompra(
        interaction,
        userId,
        produto,
        preco,
        novoSaldo,
        userData.steamid,
        timestamp,
        descricao,
        dinossauro
      );

      await enviarLogCompra(canalLog, logEmbed, userId, produtoId);
    }

    if (cupData) {
      await db
        .collection('cupom')
        .updateOne({ codigo: cupData.codigo }, { $addToSet: { usadoPor: userId } });
    }

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('✅ Compra Confirmada!')
          .setDescription(
            `Você adquiriu **${produto.label}** por **${preco.toLocaleString(
              'pt-BR'
            )} coins**.\nVerifique sua DM para detalhes completos.`
          )
          .setFooter({
            text: `The Isle • ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setTimestamp(),
      ],
    });
  },
};
