# authMiddleware — Guia de Uso

O `Utils/authMiddleware.js` oferece middlewares para verificar permissões, cooldowns e rate-limits de forma centralizada.

## Importação

```javascript
const authMiddleware = require('../../Utils/authMiddleware');
```

## Verificações Disponíveis

### 1. Verificar Permissões

```javascript
try {
  await authMiddleware.checkPermissions(interaction, ['MANAGE_MESSAGES', 'MANAGE_ROLES']);
  // Lógica do comando...
} catch (err) {
  // Erro: sem permissões necessárias
}
```

**Permissões disponíveis:**

- `ADMINISTRATOR`
- `MANAGE_GUILD`
- `MANAGE_ROLES`
- `MANAGE_CHANNELS`
- `MANAGE_MESSAGES`
- `BAN_MEMBERS`
- `KICK_MEMBERS`
- `MODERATE_MEMBERS`
- E outras do Discord.js PermissionFlagsBits

### 2. Verificar Cooldown

```javascript
try {
  await authMiddleware.checkCooldown(
    interaction,
    'spam-command',
    5000 // 5 segundos
  );
  // Lógica do comando...
} catch (err) {
  // Erro: usuário em cooldown
}
```

**Use case:** Evitar spam de comandos pesados

### 3. Verificar Rate-Limit

```javascript
try {
  await authMiddleware.checkRateLimit(
    interaction,
    'api-calls',
    10, // máximo 10
    60000 // por minuto
  );
  // Lógica do comando...
} catch (err) {
  // Erro: limite excedido
}
```

**Use case:** Limitar requisições à API externa

### 4. Verificar Owner

```javascript
try {
  // Configure BOT_OWNER_ID no .env
  await authMiddleware.checkOwner(interaction, process.env.BOT_OWNER_ID);
  // Lógica do comando (admin only)...
} catch (err) {
  // Erro: não é owner
}
```

### 5. Verificar Membro

```javascript
try {
  await authMiddleware.checkMember(interaction);
  // Comando requer estar em servidor
} catch (err) {
  // Erro: não está em servidor ou membro inválido
}
```

### 6. Verificações Múltiplas

```javascript
try {
  await authMiddleware.checkMultiple(interaction, {
    permissions: ['MANAGE_MESSAGES'],
    cooldown: 5000,
    rateLimit: {
      max: 10,
      window: 60000,
    },
    ownerOnly: false,
  });
  // Todas as verificações passaram
} catch (err) {
  // Uma ou mais verificações falharam
}
```

## Exemplos Completos em Comandos

### Exemplo 1: Comando com Permissão

```javascript
const { SlashCommandBuilder } = require('discord.js');
const authMiddleware = require('../../Utils/authMiddleware');
const { logError } = require('../../Utils/logger');
const embedFactory = require('../../Jobs/embedFactory');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bane um usuário')
    .addUserOption(opt => opt.setName('user').setDescription('Usuário a banir').setRequired(true)),

  async run(client, interaction, clientMongo) {
    try {
      // Verificar permissão
      await authMiddleware.checkPermissions(interaction, ['BAN_MEMBERS']);

      const user = interaction.options.getUser('user');

      // Lógica de ban...
      const embed = embedFactory.success('Usuário banido', `${user.tag} foi banido do servidor.`);
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      logError('Erro em /ban:', err);
    }
  },
};
```

### Exemplo 2: Comando com Cooldown

```javascript
const { SlashCommandBuilder } = require('discord.js');
const authMiddleware = require('../../Utils/authMiddleware');
const { logError } = require('../../Utils/logger');
const embedFactory = require('../../Jobs/embedFactory');

module.exports = {
  data: new SlashCommandBuilder().setName('search').setDescription('Busca na API externa'),

  async run(client, interaction, clientMongo) {
    try {
      // Cooldown de 30 segundos para evitar spam
      await authMiddleware.checkCooldown(interaction, 'search-api', 30000);

      // Chamar API...
      const result = await fetch('https://api.example.com/search');
      const data = await result.json();

      const embed = embedFactory.success('Resultado', JSON.stringify(data));
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      logError('Erro em /search:', err);
    }
  },
};
```

### Exemplo 3: Comando com Rate-Limit

```javascript
const { SlashCommandBuilder } = require('discord.js');
const authMiddleware = require('../../Utils/authMiddleware');
const embedFactory = require('../../Jobs/embedFactory');

module.exports = {
  data: new SlashCommandBuilder().setName('translate').setDescription('Traduz texto'),

  async run(client, interaction, clientMongo) {
    try {
      // Máximo 5 usos por minuto (preço de API)
      await authMiddleware.checkRateLimit(interaction, 'translate-api', 5, 60000);

      // Lógica de tradução...
      const embed = embedFactory.success('Tradução', 'Hello');
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      // Erro já foi respondido pelo middleware
    }
  },
};
```

### Exemplo 4: Verificações Múltiplas

```javascript
const { SlashCommandBuilder } = require('discord.js');
const authMiddleware = require('../../Utils/authMiddleware');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin-panel')
    .setDescription('Abre painel administrativo'),

  async run(client, interaction, clientMongo) {
    try {
      await authMiddleware.checkMultiple(interaction, {
        permissions: ['ADMINISTRATOR', 'MANAGE_GUILD'],
        cooldown: 5000,
        ownerOnly: false,
      });

      // Lógica do painel...
    } catch (err) {
      // Erro já foi respondido
    }
  },
};
```

### Exemplo 5: Comando Owner-Only

```javascript
const { SlashCommandBuilder } = require('discord.js');
const authMiddleware = require('../../Utils/authMiddleware');

module.exports = {
  data: new SlashCommandBuilder().setName('reload').setDescription('Recarrega comandos'),

  async run(client, interaction, clientMongo) {
    try {
      await authMiddleware.checkOwner(interaction, process.env.BOT_OWNER_ID);

      // Recarregar comandos...
      const embed = embedFactory.success('Recarregado', 'Comandos recarregados');
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      // Erro já foi respondido
    }
  },
};
```

## Configuração no .env

```env
BOT_OWNER_ID=123456789012345678
```

## Funções de Limpeza (Testing)

```javascript
// Limpar cooldowns de um usuário
authMiddleware.clearCooldowns('USER_ID');

// Limpar todos os cooldowns
authMiddleware.clearCooldowns();

// Limpar rate-limits de um usuário
authMiddleware.clearRateLimits('USER_ID');

// Limpar todos os rate-limits
authMiddleware.clearRateLimits();
```

## Fluxo de Erro

Quando uma verificação falha:

1. **embedFactory** cria um embed apropriado (error, warning)
2. **Middleware** responde automaticamente ao usuário
3. **Exceção** é lançada para você tratar se necessário
4. **Comando** não executa lógica

## Best Practices

✅ Use `checkMultiple()` para comandos com múltiplas verificações  
✅ Coloque verificações **antes** da lógica principal  
✅ Use cooldown para comandos pesados (API, DB)  
✅ Use rate-limit para proteção contra DDoS  
✅ Sempre trate erros em `try/catch`  
✅ Configure `BOT_OWNER_ID` para comandos admin

## Performance

- **Cooldowns:** ~1 operação de Map por execução
- **Rate-limits:** ~5 operações de array por execução
- **Permissions:** ~1 verificação de bitwise por permissão
- **Memória:** Limpeza automática de entradas expiradas

Impacto negligenciável no desempenho do bot.
