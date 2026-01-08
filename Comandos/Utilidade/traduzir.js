const { SlashCommandBuilder, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const traduzir = require('@vitalets/google-translate-api');
const { logError } = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('traduzir')
    .setDescription('「Utilidade」Traduz uma palavra ou frase de sua escolha.')
    .setNameLocalizations({ 'pt-BR': 'traduzir', 'en-US': 'translate' })
    .setDescriptionLocalizations({
      'pt-BR': '「Utilidade」Traduz uma palavra ou frase de sua escolha.',
      'en-US': '「Utility」Translates a word or phrase of your choice.',
    })
    .addStringOption(option =>
      option
        .setName('de')
        .setDescription('Qual é o idioma que sua frase/palavra está?')
        .setDescriptionLocalizations({
          'pt-BR': 'Qual é o idioma que sua frase/palavra está?',
          'en-US': 'What language is your phrase/word in?',
        })
        .setNameLocalizations({ 'pt-BR': 'de', 'en-US': 'from' })
        .setRequired(true)
        .addChoices(
          { name: 'Detecção automática', value: 'auto' },
          { name: 'Português', value: 'pt' },
          { name: 'Inglês', value: 'en' },
          { name: 'Espanhol', value: 'es' },
          { name: 'Francês', value: 'fr' },
          { name: 'Alemão', value: 'de' },
          { name: 'Italiano', value: 'it' },
          { name: 'Russo', value: 'ru' },
          { name: 'Chinês (simplificado)', value: 'zh-cn' },
          { name: 'Japonês', value: 'ja' },
          { name: 'Coreano', value: 'ko' },
          { name: 'Árabe', value: 'ar' },
          { name: 'Turco', value: 'tr' },
          { name: 'Holandês', value: 'nl' },
          { name: 'Polonês', value: 'pl' },
          { name: 'Hindi', value: 'hi' },
          { name: 'Sueco', value: 'sv' },
          { name: 'Norueguês', value: 'no' },
          { name: 'Dinamarquês', value: 'da' },
          { name: 'Finlandês', value: 'fi' },
          { name: 'Hebraico', value: 'he' },
          { name: 'Indonésio', value: 'id' },
          { name: 'Tailandês', value: 'th' },
          { name: 'Grego', value: 'el' },
          { name: 'Eslovaco', value: 'sk' }
        )
    )
    .addStringOption(option =>
      option
        .setName('para')
        .setDescription('Qual é o idioma que sua frase/palavra deverá ser traduzida?')
        .setNameLocalizations({ 'pt-BR': 'para', 'en-US': 'to' })
        .setDescriptionLocalizations({
          'pt-BR': 'Qual é o idioma que sua frase/palavra deverá ser traduzida?',
          'en-US': 'What language should your sentence/word be translated into?',
        })
        .setRequired(true)
        .addChoices(
          { name: 'Português', value: 'pt' },
          { name: 'Inglês', value: 'en' },
          { name: 'Espanhol', value: 'es' },
          { name: 'Francês', value: 'fr' },
          { name: 'Alemão', value: 'de' },
          { name: 'Italiano', value: 'it' },
          { name: 'Russo', value: 'ru' },
          { name: 'Chinês (simplificado)', value: 'zh-cn' },
          { name: 'Japonês', value: 'ja' },
          { name: 'Coreano', value: 'ko' },
          { name: 'Árabe', value: 'ar' },
          { name: 'Turco', value: 'tr' },
          { name: 'Holandês', value: 'nl' },
          { name: 'Polonês', value: 'pl' },
          { name: 'Hindi', value: 'hi' },
          { name: 'Sueco', value: 'sv' },
          { name: 'Norueguês', value: 'no' },
          { name: 'Dinamarquês', value: 'da' },
          { name: 'Finlandês', value: 'fi' },
          { name: 'Hebraico', value: 'he' },
          { name: 'Indonésio', value: 'id' },
          { name: 'Tailandês', value: 'th' },
          { name: 'Grego', value: 'el' },
          { name: 'Eslovaco', value: 'sk' },
          { name: 'Malaio', value: 'ms' }
        )
    )
    .addStringOption(option =>
      option
        .setName('texto')
        .setDescription('O texto que deverá ser traduzido.')
        .setNameLocalizations({ 'pt-BR': 'texto', 'en-US': 'text' })
        .setDescriptionLocalizations({
          'pt-BR': 'O texto que deverá ser traduzido.',
          'en-US': 'The text to be translated',
        })
        .setRequired(true)
    ),

  async run(client, interaction, _clientMongo) {
    const texto = interaction.options.getString('texto');
    const de = interaction.options.getString('de');
    const para = interaction.options.getString('para');

    const locale = interaction.locale.startsWith('pt') ? 'pt-BR' : 'en-US';

    const idiomasPT = {
      pt: 'Português',
      en: 'Inglês',
      es: 'Espanhol',
      fr: 'Francês',
      de: 'Alemão',
      it: 'Italiano',
      ru: 'Russo',
      'zh-cn': 'Chinês (simplificado)',
      ja: 'Japonês',
      ko: 'Coreano',
      ar: 'Árabe',
      tr: 'Turco',
      nl: 'Holandês',
      pl: 'Polonês',
      hi: 'Hindi',
      sv: 'Sueco',
      no: 'Norueguês',
      da: 'Dinamarquês',
      fi: 'Finlandês',
      he: 'Hebraico',
      id: 'Indonésio',
      th: 'Tailandês',
      el: 'Grego',
      sk: 'Eslovaco',
      ms: 'Malaio',
    };
    const idiomasEN = {
      pt: 'Portuguese',
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      ru: 'Russian',
      'zh-cn': 'Chinese (Simplified)',
      ja: 'Japanese',
      ko: 'Korean',
      ar: 'Arabic',
      tr: 'Turkish',
      nl: 'Dutch',
      pl: 'Polish',
      hi: 'Hindi',
      sv: 'Swedish',
      no: 'Norwegian',
      da: 'Danish',
      fi: 'Finnish',
      he: 'Hebrew',
      id: 'Indonesian',
      th: 'Thai',
      el: 'Greek',
      sk: 'Slovak',
      ms: 'Malay',
    };

    const langMap = locale === 'pt-BR' ? idiomasPT : idiomasEN;

    try {
      const result = await traduzir.translate(texto, { from: de, to: para });

      const idiomaOrigem =
        de === 'auto'
          ? langMap[result.from.language.iso] || result.from.language.iso
          : langMap[de] || de;
      const idiomaDestino = langMap[para] || para;

      const embed = new EmbedBuilder()
        .setColor('#5865f2')
        .setTitle(locale === 'pt-BR' ? '🌐 Tradução de Texto' : '🌐 Text Translation')
        .setThumbnail('https://cdn-icons-png.flaticon.com/512/2991/2991148.png')
        .addFields(
          {
            name: locale === 'pt-BR' ? 'Idioma de Origem' : 'Source Language',
            value: `\`${idiomaOrigem}\``,
            inline: true,
          },
          {
            name: locale === 'pt-BR' ? 'Idioma de Destino' : 'Target Language',
            value: `\`${idiomaDestino}\``,
            inline: true,
          },
          {
            name: locale === 'pt-BR' ? 'Texto Original' : 'Original Text',
            value: `\`\`\`${texto}\`\`\``,
          },
          {
            name: locale === 'pt-BR' ? 'Texto Traduzido' : 'Translated Text',
            value: `\`\`\`${result.text}\`\`\``,
          }
        )
        .setFooter({
          text: 'Powered by Google Translate',
          iconURL: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png',
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 1 << 6 });
    } catch (e) {
      logError('Erro ao traduzir:', e);
      await interaction.reply({
        content:
          locale === 'pt-BR'
            ? '❌ Ocorreu um erro ao traduzir. Tente novamente mais tarde.'
            : '❌ An error occurred while translating. Please try again later.',
        flags: 1 << 6,
      });
    }
  },
};
