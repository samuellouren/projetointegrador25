# Como Corrigir o Erro de Banco de Dados Corrompido

## Problema
Você está vendo o erro: `SqliteError: database disk image is malformed`

## Solução

### Passo 1: Resetar o Banco de Dados
Execute o seguinte comando na pasta `Backend`:

\`\`\`bash
npm run reset-db
\`\`\`

Este comando irá deletar o banco de dados corrompido.

### Passo 2: Reiniciar o Servidor
Após resetar, inicie o servidor novamente:

\`\`\`bash
npm run dev
\`\`\`

O banco de dados será recriado automaticamente com todas as tabelas necessárias.

## O que aconteceu?
O arquivo `users.db` estava corrompido. O script de reset deleta o arquivo corrompido e permite que o sistema crie um novo banco de dados limpo.

## Importante
- Todos os dados anteriores serão perdidos após o reset
- Se você tem dados importantes, faça backup antes de executar o reset
- O banco será recriado automaticamente na próxima inicialização
