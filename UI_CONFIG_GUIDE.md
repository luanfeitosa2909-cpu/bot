# UI Config — Padronização de UX

O `Utils/uiConfig.js` centraliza todas as configurações visuais e mensagens da aplicação.

## Importação

```javascript
const uiConfig = require('../../Utils/uiConfig');
const embedFactory = require('../../Jobs/embedFactory');
```

## Cores Padronizadas

```javascript
// Acessar cores
console.log(uiConfig.colors.success); // '#2ecc71'
console.log(uiConfig.colors.error); // '#e74c3c'
console.log(uiConfig.getColor('warning')); // '#f39c12'

// Usar com embedFactory
const embed = embedFactory.success('OK', 'Tudo certo!', {
  color: uiConfig.getColor('success'),
});
```

**Cores disponíveis:**

- `success` — Verde (#2ecc71)
- `error` — Vermelho (#e74c3c)
- `warning` — Amarelo (#f39c12)
- `info` — Azul (#3498db)
- `primary` — Primária (customizável)
- `secondary` — Secundária (customizável)

## Emojis Padronizados

```javascript
// Acessar emojis
const emoji = uiConfig.getEmoji('success'); // ✅
const info = uiConfig.emojis.info; // ℹ️

// Usar em mensagens
const msg = `${uiConfig.getEmoji('success')} Operação concluída!`;
const warning = `${uiConfig.getEmoji('warning')} Atenção: X fez Y`;
```

**Emojis disponíveis:**

```
success: ✅
error: ❌
warning: ⚠️
info: ℹ️
loading: ⏳
money: 💰
user: 👤
users: 👥
settings: ⚙️
trash: 🗑️
check: ✓
cross: ✗
```

## Mensagens Padrão

```javascript
// Acessar mensagens
console.log(uiConfig.messages.noPermission);
// "Você não tem permissão para usar este comando."

// Com formatação
const cooldownMsg = uiConfig.formatMessage(uiConfig.messages.cooldown, { time: 5 }); // "Você está em cooldown. Tente novamente em 5s."
```

**Mensagens disponíveis:**

- `noPermission` — Sem permissão
- `cooldown` — Em cooldown
- `rateLimitExceeded` — Rate-limit excedido
- `guildOnly` — Apenas em servidor
- `ownerOnly` — Apenas owner
- `success` — Sucesso genérico
- `error` — Erro genérico
- `loading` — Carregando

## Timeouts Padrão

```javascript
// Usar timeouts padronizados
setTimeout(() => {
  msg.delete();
}, uiConfig.timeouts.ephemeral); // 3 segundos

// Para componentes
button.setDisabled(true);
// Remove após 5 minutos
setTimeout(() => {
  button.setDisabled(false);
}, uiConfig.timeouts.buttonTimeout);
```

**Timeouts disponíveis:**

- `ephemeral` — 3 segundos (mensagens temporárias)
- `modalTimeout` — 15 minutos
- `buttonTimeout` — 5 minutos
- `selectTimeout` — 5 minutos

## Limites Padrão

```javascript
// Validar comprimento de campo
const description = 'Texto longo...';
const truncated = description.slice(0, uiConfig.limits.maxEmbedDescription);

// Validar nome
if (name.length > uiConfig.limits.maxNameLength) {
  throw new Error('Nome muito longo');
}
```

**Limites disponíveis:**

- `maxFieldLength` — 1024 caracteres
- `maxFields` — 25 campos por embed
- `maxEmbedDescription` — 4096 caracteres
- `maxNameLength` — 256 caracteres
- `maxButtonLabel` — 80 caracteres

## Configuração via .env

```env
# Cores
COLOR_SUCCESS=#2ecc71
COLOR_ERROR=#e74c3c
COLOR_WARNING=#f39c12
COLOR_INFO=#3498db
COLOR_PRIMARY=#2ecc71
COLOR_SECONDARY=#95a5a6

# Branding
BOT_NAME=Meu Bot
BOT_VERSION=1.0.0
BOT_FOOTER=© 2026 Todos os direitos reservados
BOT_WEBSITE=https://example.com
```

## Exemplo Completo

```javascript
const { SlashCommandBuilder } = require('discord.js');
const embedFactory = require('../../Jobs/embedFactory');
const uiConfig = require('../../Utils/uiConfig');
const authMiddleware = require('../../Utils/authMiddleware');

module.exports = {
  data: new SlashCommandBuilder().setName('example').setDescription('Comando com UX padronizada'),

  async run(client, interaction, clientMongo) {
    try {
      // Mostrar loading
      const loadingEmbed = embedFactory.loading(
        `${uiConfig.getEmoji('loading')} Processando`,
        'Aguarde um momento...'
      );
      await interaction.reply({ embeds: [loadingEmbed] });

      // Simular processamento
      await new Promise(r => setTimeout(r, 2000));

      // Sucesso
      const successEmbed = embedFactory.success('Tudo Certo!', 'Operação concluída com sucesso', {
        color: uiConfig.getColor('success'),
        fields: [
          {
            name: `${uiConfig.getEmoji('check')} Status`,
            value: 'OK',
            inline: true,
          },
          {
            name: `${uiConfig.getEmoji('info')} Detalhes`,
            value: 'Sem erros',
            inline: true,
          },
        ],
      });

      // Atualizar resposta
      await interaction.editReply({ embeds: [successEmbed] });

      // Auto-delete após timeout
      setTimeout(() => {
        interaction.deleteReply().catch(() => {});
      }, uiConfig.timeouts.ephemeral);
    } catch (err) {
      const errorEmbed = embedFactory.error('Erro na Operação', uiConfig.messages.error, {
        color: uiConfig.getColor('error'),
        thumbnail: 'https://cdn-icons-png.flaticon.com/512/753/753345.png',
      });

      if (interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};
```

## Formatar Mensagens Dinâmicas

```javascript
// Template de mensagem
const template = 'Olá {name}! Você tem {count} mensagens.';

// Substituir placeholders
const message = uiConfig.formatMessage(template, {
  name: 'João',
  count: 5,
});
// "Olá João! Você tem 5 mensagens."

// Usar em embeds
const embed = embedFactory.info(
  'Notificação',
  uiConfig.formatMessage(uiConfig.messages.cooldown, { time: 10 })
);
```

## Branding Dinâmico

```javascript
// Footers com branding
const footer = `${uiConfig.branding.name} v${uiConfig.branding.version}`;

// Website no footer
const footerWithWeb = `${uiConfig.branding.footer} • ${uiConfig.branding.website}`;

// Usar em custom embeds
const embed = embedFactory.custom({
  title: 'Sobre',
  description: `Site: ${uiConfig.branding.website}`,
  footerText: footer,
});
```

## Best Practices

✅ **Use cores via `getColor()`** — Centraliza mudanças visuais  
✅ **Use emojis via `getEmoji()`** — Padronização automática  
✅ **Use mensagens via `messages`** — Manutenção facilitada  
✅ **Configure tudo no .env** — Sem hardcoding  
✅ **Use `formatMessage()` para dinâmico** — Flexibilidade com padrão  
✅ **Respeite limites** — Evita erros do Discord

## Integração com Outros Módulos

```javascript
// embedFactory já usa uiConfig internamente
const embed = embedFactory.success('OK', 'Tudo bem!');

// authMiddleware usa uiConfig para cores
await authMiddleware.checkPermissions(interaction, ['MANAGE_MESSAGES']);

// Todos os novos comandos devem usar essa padronização
```

## Estrutura de Cores Recomendada

| Tipo      | Cor                | Uso                     |
| --------- | ------------------ | ----------------------- |
| Success   | Verde (#2ecc71)    | Operações bem-sucedidas |
| Error     | Vermelho (#e74c3c) | Erros ou falhas         |
| Warning   | Amarelo (#f39c12)  | Avisos e confirmações   |
| Info      | Azul (#3498db)     | Informações genéricas   |
| Primary   | Customizável       | Destaque principal      |
| Secondary | Customizável       | Menos importante        |

---

**Benefícios:**
✅ Consistência visual em toda a app  
✅ Fácil mudança de tema (via .env)  
✅ Menos código repetitivo  
✅ UX profissional e polida
