# Demanda IA

Sistema para classificar e exibir **demandas técnicas de fibra óptica** vindas de grupos do WhatsApp.

| Pasta | Descrição |
|-------|-----------|
| `backend/` | API Express — webhook, classificação (IA ou local), CRUD em memória |
| `frontend/` | Painel [dashboard-demanda](https://github.com/TorresCleb/dashboard-demanda) (Next.js) |

## Pré-requisitos

- Node.js 18+
- npm

## Instalação

Na raiz do projeto:

```bash
npm run install:all
```

## Configuração

**Backend** — copie e edite se necessário:

```bash
copy backend\.env.example backend\.env
```

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta da API (padrão `3000`) |
| `ANTHROPIC_API_KEY` | Opcional; vazio = classificação por palavras-chave |
| `EVOLUTION_API_KEY` | Chave do Evolution API (webhook) |

**Frontend** — copie e edite se necessário:

```bash
copy frontend\.env.example frontend\.env.local
```

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | URL da API (padrão `http://localhost:3000`) |

## Executar (desenvolvimento)

Na raiz, sobe **API + painel** ao mesmo tempo:

```bash
npm run dev
```

- **API:** http://localhost:3000  
- **Painel:** http://localhost:3001  

Ou separado:

```bash
npm run dev:backend
npm run dev:frontend
```

## Fluxo

1. Evolution API envia mensagens para `POST http://localhost:3000/webhook`
2. O backend classifica e grava demandas (memória — reiniciar zera os dados)
3. O painel consome `GET /resumo`, `GET /demandas`, `DELETE /demandas/:id`

## Estrutura

```
demandaIA/
├── backend/
│   ├── server.js
│   ├── database.js
│   ├── classificador-ia.js
│   └── package.json
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/api.ts
│   └── package.json
└── package.json
```

A pasta `files/` é legado; use `backend/` e `frontend/`.
