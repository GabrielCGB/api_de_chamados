# API de Chamados

API para gerenciamento de chamados de suporte. Permite cadastrar, consultar, filtrar, assumir, finalizar e excluir chamados, com autenticação por token, controle de permissão (técnico e administrador) e estatísticas calculadas diretamente no PostgreSQL.

## Tecnologias utilizadas

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [node-postgres (`pg`)](https://node-postgres.com/)
- [dotenv](https://github.com/motdotla/dotenv) (variáveis de ambiente)

## Pré-requisitos

- Node.js instalado
- PostgreSQL instalado e em execução (o pgAdmin pode ser usado para gerenciar o banco)

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
cd NOME-DO-REPOSITORIO
npm install
```

## Configuração do banco de dados

### 1. Criar o banco

No pgAdmin (ou no `psql`), crie um banco de dados, por exemplo `chamados_db`.

### 2. Criar a tabela

Execute o SQL abaixo no banco criado (no pgAdmin: botão direito no banco → *Query Tool*):

```sql
CREATE TABLE chamados (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT NOT NULL,
  setor VARCHAR(100) NOT NULL,
  prioridade VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aberto',
  responsavel VARCHAR(100),
  data_abertura TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 3. Configurar as credenciais

Crie um arquivo `.env` na raiz do projeto, com base no modelo `.env.example`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_NAME=chamados_db
```

> **Atenção:** o arquivo `.env` contém dados sensíveis e **não deve ser enviado ao GitHub**. Ele está listado no `.gitignore`. Apenas o `.env.example`, sem senhas reais, faz parte do repositório.

## Iniciando o servidor

```bash
node server.js
```

O servidor sobe na porta `3000`: `http://localhost:3000`.

## Estrutura da tabela `chamados`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | SERIAL (PK) | Identificador gerado automaticamente |
| `titulo` | VARCHAR(150) | Título do chamado (obrigatório) |
| `descricao` | TEXT | Descrição do problema (obrigatório) |
| `setor` | VARCHAR(100) | Setor solicitante (obrigatório) |
| `prioridade` | VARCHAR(10) | `baixa`, `media` ou `alta` (obrigatório) |
| `status` | VARCHAR(20) | `aberto` (padrão), `em_atendimento` ou `finalizado` |
| `responsavel` | VARCHAR(100) | Nome de quem assumiu o chamado (nulo até ser assumido) |
| `data_abertura` | TIMESTAMP | Data de criação, preenchida automaticamente |

## Autenticação e permissões

As rotas protegidas exigem o header `token`. Os usuários são fixos, definidos no código para fins de estudo:

| Usuário | Tipo | Valor do header `token` |
|---|---|---|
| Carlos | técnico | `tecnico123` |
| Administrador | admin | `admin123` |

- Sem token ou com token inválido: **401**.
- Usuário autenticado sem permissão: **403**.

## Principais rotas

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| GET | `/chamados` | Lista chamados. Filtros opcionais: `?status=` e `?prioridade=` | Público |
| GET | `/chamados/estatisticas` | Totais por status e total de prioridade alta | Público |
| GET | `/chamados/:id` | Busca um chamado pelo ID | Autenticado |
| POST | `/chamados` | Cadastra um chamado | Público |
| PATCH | `/chamados/:id/assumir` | Muda o status para `em_atendimento` e registra o responsável | Autenticado |
| PATCH | `/chamados/:id/finalizar` | Muda o status para `finalizado` | Autenticado |
| DELETE | `/chamados/:id` | Exclui um chamado | Somente admin |

### Regras de negócio

- Um chamado só pode ser **assumido** se estiver `aberto`.
- Um chamado só pode ser **finalizado** se estiver `em_atendimento`. Chamados abertos ou já finalizados retornam **409**.
- IDs inexistentes retornam **404**.
- Rotas inexistentes retornam **404** com `{ "erro": "Rota não encontrada" }`.
- Erros inesperados retornam **500** com `{ "erro": "Erro interno do servidor" }`.

## Exemplos de requisição

### Cadastrar um chamado

```bash
curl -X POST http://localhost:3000/chamados \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Computador não liga",
    "descricao": "O computador do setor financeiro não liga desde ontem",
    "setor": "Financeiro",
    "prioridade": "alta"
  }'
```

Resposta (`201 Created`):

```json
{
  "id": 1,
  "titulo": "Computador não liga",
  "descricao": "O computador do setor financeiro não liga desde ontem",
  "setor": "Financeiro",
  "prioridade": "alta",
  "status": "aberto",
  "responsavel": null,
  "data_abertura": "2026-10-06T14:30:00.000Z"
}
```

### Assumir um chamado

```bash
curl -X PATCH http://localhost:3000/chamados/1/assumir \
  -H "token: tecnico123"
```

### Listar chamados abertos de prioridade alta

```bash
curl "http://localhost:3000/chamados?status=aberto&prioridade=alta"
```

### Consultar estatísticas

```bash
curl http://localhost:3000/chamados/estatisticas
```

Resposta (`200 OK`):

```json
{
  "total": 5,
  "abertos": 2,
  "em_atendimento": 1,
  "finalizados": 2,
  "prioridade_alta": 3
}
```
