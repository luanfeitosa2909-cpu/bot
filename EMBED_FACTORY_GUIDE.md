# embedFactory — Guia de Uso

O `Jobs/embedFactory.js` é um utilitário centralizado para criar embeds padronizadas com branding automático.

## Importação

```javascript
const embedFactory = require('../../Jobs/embedFactory');
```

## Tipos de Embeds Disponíveis

### 1. Success (Sucesso)

```javascript
const embed = embedFactory.success(
  'Usuário adicionado',
  'O usuário foi adicionado com sucesso ao cargo!',
  {
    fields: [
      { name: 'ID', value: '123456789', inline: true },
      { name: 'Cargo', value: 'Moderador', inline: true },
    ],
  }
);

await interaction.reply({ embeds: [embed] });
```

### 2. Error (Erro)

```javascript
const embed = embedFactory.error(
  'Operação falhou',
  'Não foi possível adicionar o usuário ao cargo. Verifique as permissões.',
  {
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/753/753345.png',
  }
);

await interaction.reply({ embeds: [embed], ephemeral: true });
```

### 3. Warning (Aviso)

```javascript
const embed = embedFactory.warning(
  'Ação não recomendada',
  'Você está prestes a deletar 100 mensagens. Tem certeza?',
  {
    color: '#ff6b6b',
  }
);

await interaction.reply({ embeds: [embed] });
```

### 4. Info (Informação)

```javascript
const embed = embedFactory.info('Status do Servidor', 'Membros: 1.234 | Canais: 45 | Cargos: 28', {
  fields: [
    { name: 'Uptime', value: '15 dias', inline: true },
    { name: 'Ping', value: '45ms', inline: true },
  ],
});

await interaction.reply({ embeds: [embed] });
```

### 5. Loading (Carregamento)

```javascript
const embed = embedFactory.loading('Processando...', 'Analisando banco de dados');

const msg = await interaction.reply({ embeds: [embed] });

// Depois de processar...
const finalEmbed = embedFactory.success('Pronto!', 'Processamento concluído');
await msg.edit({ embeds: [finalEmbed] });
```

### 6. Confirm (Confirmação)

```javascript
const embed = embedFactory.confirm('Clique no botão abaixo para confirmar a ação');

await interaction.reply({
  embeds: [embed],
  components: [
    /* buttons */
  ],
});
```

### 7. Custom (Personalizado)

```javascript
const embed = embedFactory.custom({
  color: '#9b59b6',
  title: 'Painel Customizado',
  description: 'Conteúdo totalmente customizado',
  author: {
    name: 'Bot Name',
    iconURL: 'https://...',
  },
  thumbnail: 'https://...',
  fields: [
    { name: 'Campo 1', value: 'Valor 1', inline: true },
    { name: 'Campo 2', value: 'Valor 2', inline: true },
  ],
  footerText: 'Rodapé customizado',
  timestamp: true,
});

await interaction.reply({ embeds: [embed] });
```

## Variáveis de Ambiente

Configure no `.env` para personalizar os footers:

```env
BOT_NAME=Meu Bot
BOT_VERSION=1.0.0
BRAND_COLOR=#2ecc71
```

## Uso em Catch Blocks

```javascript
try {
  // Lógica do comando
} catch (err) {
  logError('Erro em comando:', err);
  const embed = embedFactory.error(
    'Erro ao processar comando',
    'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  );
  await interaction.reply({ embeds: [embed], ephemeral: true });
}
```

## Opções Disponíveis

Todos os métodos aceitam um objeto `options` com:

- `color` — Cor do embed (hex ou número)
- `thumbnail` — URL da imagem pequena
- `image` — URL da imagem grande
- `fields` — Array de campos adicionais
- `timestamp` — Se false, não adiciona timestamp
- Para `custom()`: aceita qualquer propriedade de EmbedBuilder

## Exemplo Completo em Comando

```javascript
const { SlashCommandBuilder } = require('discord.js');
const embedFactory = require('../../Jobs/embedFactory');
const { logError } = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder().setName('test').setDescription('Comando de teste'),

  async run(client, interaction, clientMongo) {
    try {
      const user = interaction.user;

      const embed = embedFactory.success('Bem-vindo!', `Olá ${user.username}! Bem-vindo ao bot.`, {
        thumbnail: user.displayAvatarURL({ dynamic: true }),
        fields: [
          { name: 'ID', value: user.id, inline: true },
          { name: 'Bot', value: 'Sim', inline: true },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      logError('Erro em /test:', err);
      const errorEmbed = embedFactory.error('Erro', 'Não foi possível processar o comando.');
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
```

## Footers Automáticos

Cada embed inclui automaticamente um footer com:

- Nome do bot (do `.env` ou padrão)
- Versão (do `.env` ou padrão)
- Mensagem customizada (opcional)

Exemplo:

```
Operação bem-sucedida • Bot v1.0.0
```

---

**Benefícios:**
✅ Padrão visual consistente  
✅ Branding automático  
✅ Menos código repetitivo  
✅ Fácil manutenção de temas  
✅ Suporta reutilização em 50+ comandos
