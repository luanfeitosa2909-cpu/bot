// Interactions/Modals/modal_staff_remover_membro.js
module.exports = {
  type: 'modal',
  customId: 'modal_staff_remover_membro',
  async run(client, interaction, clientMongo) {
    if (!interaction.isModalSubmit() || interaction.customId !== this.customId) return;

    const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: '❌ Apenas staff.', flags: 1 << 6 });
    }

    const input = interaction.fields.getTextInputValue('input_id_membro_remover').trim();
    let member = null;

    try {
      member = await interaction.guild.members.fetch(input);
    } catch {
      if (/^\d{17,19}$/.test(input)) {
        const userData = await clientMongo
          .db('ProjetoGenoma')
          .collection('DataBase')
          .findOne({ steamid: input });
        if (userData?.user_id) {
          try {
            member = await interaction.guild.members.fetch(userData.user_id);
          } catch {
            // eslint-disable-next-line no-empty
          }
        }
      }
    }

    if (!member) {
      return interaction.reply({ content: '❌ Membro não encontrado.', flags: 1 << 6 });
    }

    // Remove permissões do canal
    await interaction.channel.permissionOverwrites.edit(member.id, {
      ViewChannel: false,
      SendMessages: false,
      ReadMessageHistory: false,
      AttachFiles: false,
      EmbedLinks: false,
    });

    await interaction.reply({
      content: `✅ ${member.user.tag} removido do ticket!`,
      flags: 1 << 6,
    });
  },
};
