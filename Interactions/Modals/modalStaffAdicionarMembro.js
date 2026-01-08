// Interactions/Modals/modal_staff_adicionar_membro.js
module.exports = {
  type: 'modal',
  customId: 'modal_staff_adicionar_membro',
  async run(client, interaction, clientMongo) {
    if (!interaction.isModalSubmit() || interaction.customId !== this.customId) return;
    const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: '❌ Apenas staff.', flags: 1 << 6 });
    }
    const input = interaction.fields.getTextInputValue('input_id_membro').trim();
    let member = null;
    try {
      member = await interaction.guild.members.fetch(input);
    } catch {
      if (/^\d{17}$/.test(input)) {
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
    await interaction.channel.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
      EmbedLinks: true,
    });
    await interaction.reply({ content: `✅ ${member.user.tag} adicionado!`, flags: 1 << 6 });
  },
};
