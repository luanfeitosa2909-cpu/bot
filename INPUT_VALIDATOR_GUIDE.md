# inputValidator — Guia de Validação e Sanitização

O `Utils/inputValidator.js` oferece funções para validar e sanitizar entradas de usuário antes de persistir no banco de dados.

## Importação

```javascript
const {
  sanitizeString,
  sanitizeUsername,
  isValidDiscordId,
  isValidEmail,
  isValidInteger,
  isValidUrl,
  isValidSteamId,
  validateUserData,
  validateAposta,
  validateLongText,
  isSuspicious,
} = require('../../Utils/inputValidator');
```

## Funções de Sanitização

### 1. Sanitizar String Genérica

Remove caracteres perigosos e limita tamanho:

```javascript
const input = 'Usuário<script>alert("xss")</script>';
const safe = sanitizeString(input);
// "Usuárioscriptalertxssscript" (limpo)
```

**Remover:**

- `< > " ' \` $ (caracteres perigosos)
- Espaços extras
- Limita a 1024 caracteres

### 2. Sanitizar Nome de Usuário

Permite apenas alphanumeric, underscore e hífen:

```javascript
const username = 'User@#$%2023!';
const safe = sanitizeUsername(username);
// "User2023"

// Retorna null se inválido
const invalid = sanitizeUsername('!!!');
// null
```

**Validações:**

- Apenas `[a-zA-Z0-9_-]`
- Máximo 32 caracteres
- Retorna `null` se vazio

## Funções de Validação

### 3. Validar Discord ID

```javascript
const userId = '123456789012345678';
if (isValidDiscordId(userId)) {
  // ID válido (18+ dígitos)
}
```

**Critério:**

- Número com 18+ dígitos

### 4. Validar Email

```javascript
const email = 'user@example.com';
if (isValidEmail(email)) {
  // Email válido
}
```

**Critério:**

- Formato `nome@dominio.extensão`
- Máximo 254 caracteres

### 5. Validar Número Inteiro

```javascript
const coins = 5000;
if (isValidInteger(coins, 1, 999999)) {
  // Válido: entre 1 e 999.999
  return Math.floor(coins); // Garante inteiro
}
```

**Parâmetros:**

- `value` — Valor a validar
- `min` — Mínimo (padrão 0)
- `max` — Máximo (padrão MAX_SAFE_INTEGER)

### 6. Validar URL

```javascript
const url = 'https://example.com';
if (isValidUrl(url)) {
  // URL válida
}
```

### 7. Validar SteamID

```javascript
const steamid = '76561198123456789';
if (isValidSteamId(steamid)) {
  // SteamID válido (formato 76561198...)
}
```

## Validações Compostas

### 8. Validar Dados de Usuário

```javascript
const userData = {
  user_id: '123456789012345678',
  nome: 'João Silva',
  coins: 5000,
  steamid: '76561198123456789',
  createdAt: Date.now(),
};

const validated = validateUserData(userData);
if (!validated) {
  // Dados inválidos
  console.error('Dados inválidos');
} else {
  // Salvar no banco
  await saveUser(validated);
}
```

**Validações incluídas:**

- ✅ `user_id` — Discord ID válido (obrigatório)
- ✅ `nome` — String sanitizada (opcional)
- ✅ `coins` — Integer 0-999.999.999 (opcional)
- ✅ `steamid` — SteamID válido (opcional)
- ✅ `createdAt` — Timestamp (opcional)

### 9. Validar Dados de Aposta

```javascript
const apostaData = {
  userId: '123456789012345678',
  valor: 5000,
  descricao: 'Aposta sobre X',
  status: 'pendente', // pendente, ganha, perde, cancelada
};

const validated = validateAposta(apostaData);
if (validated) {
  await saveAposta(validated);
}
```

### 10. Validar Texto Longo

```javascript
const description = req.body.description;
const validated = validateLongText(description, 4096); // Máximo 4096 chars

if (!validated) {
  return res.status(400).json({ error: 'Descrição inválida' });
}

// Usar validated
```

## Detecção de Padrões Suspeitos

### 11. Verificar Injeção/XSS

```javascript
const userInput = req.body.texto;

if (isSuspicious(userInput)) {
  logWarn('Entrada suspeita detectada');
  return interaction.reply({
    content: '❌ Entrada contém padrões suspeitos',
    ephemeral: true,
  });
}

// Prosseguir se seguro
```

**Padrões detectados:**

- MongoDB injection: `$where`, `$ne`, `$gt`
- XSS: `javascript:`, `onerror=`, `onclick=`, `<script`

## Exemplos Completos em Comandos

### Exemplo 1: Adicionar Coins com Validação

```javascript
const inputValidator = require('../../Utils/inputValidator');
const { logError, logWarn } = require('../../Utils/logger');

async run(client, interaction, clientMongo) {
  try {
    const user = interaction.options.getUser('usuario');
    const amount = interaction.options.getInteger('quantidade');

    // Validar entrada
    if (!inputValidator.isValidDiscordId(user.id)) {
      return interaction.reply({
        content: '❌ Usuário inválido',
        ephemeral: true,
      });
    }

    if (!inputValidator.isValidInteger(amount, 1, 999999)) {
      return interaction.reply({
        content: '❌ Quantidade inválida (1-999.999)',
        ephemeral: true,
      });
    }

    // Usar dados validados
    await clientMongo
      .collection('users')
      .updateOne(
        { user_id: user.id },
        { $inc: { coins: amount } }
      );

    return interaction.reply('✅ Coins adicionados!');
  } catch (err) {
    logError('Erro em /addcoins:', err);
  }
}
```

### Exemplo 2: Criar Aposta com Validação

```javascript
const inputValidator = require('../../Utils/inputValidator');

async run(client, interaction, clientMongo) {
  try {
    const description = interaction.options.getString('descricao');
    const valor = interaction.options.getInteger('valor');

    // Verificar padrões suspeitos
    if (inputValidator.isSuspicious(description)) {
      logWarn('Aposta com entrada suspeita rejeitada');
      return interaction.reply({
        content: '❌ Descrição contém padrões inválidos',
        ephemeral: true,
      });
    }

    // Validar comprimento
    const validDesc = inputValidator.validateLongText(description, 256);
    if (!validDesc) {
      return interaction.reply({
        content: '❌ Descrição inválida',
        ephemeral: true,
      });
    }

    // Validar valor
    if (!inputValidator.isValidInteger(valor, 100, 999999)) {
      return interaction.reply({
        content: '❌ Valor inválido (100-999.999)',
        ephemeral: true,
      });
    }

    // Criar aposta validada
    const apostaData = inputValidator.validateAposta({
      userId: interaction.user.id,
      valor: valor,
      descricao: validDesc,
      status: 'pendente',
    });

    if (!apostaData) {
      return interaction.reply({
        content: '❌ Erro ao processar aposta',
        ephemeral: true,
      });
    }

    // Salvar
    await clientMongo.collection('apostas').insertOne({
      ...apostaData,
      createdAt: new Date(),
    });

    return interaction.reply('✅ Aposta criada!');
  } catch (err) {
    logError('Erro em /aposta:', err);
  }
}
```

## Integração com authMiddleware

```javascript
const authMiddleware = require('../../Utils/authMiddleware');
const inputValidator = require('../../Utils/inputValidator');

async run(client, interaction, clientMongo) {
  try {
    // Validar permissões
    await authMiddleware.checkPermissions(interaction, ['MANAGE_MESSAGES']);

    // Validar entrada
    const text = interaction.options.getString('texto');
    if (inputValidator.isSuspicious(text)) {
      throw new Error('Entrada suspeita');
    }

    const validated = inputValidator.validateLongText(text, 2000);
    if (!validated) {
      throw new Error('Texto inválido');
    }

    // Prosseguir com dados seguros
    await processText(validated);
  } catch (err) {
    logError('Erro:', err);
  }
}
```

## Fluxo Recomendado

```
1. Pegar entrada do usuário
2. Verificar padrões suspeitos (isSuspicious)
3. Validar formato específico (isValid*, validate*)
4. Sanitizar se necessário (sanitize*)
5. Usar dados validados
6. Persistir no banco
```

## Best Practices

✅ **Sempre validar antes de persistir**  
✅ **Verificar padrões suspeitos em campos de texto**  
✅ **Limitar tamanho de strings**  
✅ **Usar tipos específicos (email, url, steamid)**  
✅ **Logar tentativas suspeitas**  
✅ **Nunca confiar em entrada de usuário**

❌ **Nunca use entrada direta em queries MongoDB**  
❌ **Não limpe dados após salvar — previna antes**  
❌ **Não ignore validações "por performance"**  
❌ **Não misture dados validados com não-validados**

## Impacto de Performance

- **Sanitização:** ~0.1ms por string
- **Validação:** ~0.01ms por campo
- **Detecção de padrões:** ~0.05ms
- **Total:** Negligenciável para a maioria dos casos

---

**Última atualização:** 2026-01-08  
**Responsável:** Tarefa 5.2 (Sanitização de Entradas)
