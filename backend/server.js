// ─────────────────────────────────────────────────────────────────────────────
// server.js
//
// Ponto de entrada da API. Aqui definimos todas as rotas HTTP.
// Pense neste arquivo como o "porteiro" do sistema:
// ele recebe as requisições, chama quem sabe fazer o trabalho
// (classificador, banco de dados) e devolve a resposta.
// ─────────────────────────────────────────────────────────────────────────────

// dotenv primeiro: classificador e outras libs leem process.env ao carregar
require('dotenv').config()

const express = require('express')
const cors = require('cors')

const db = require('./database')
const { classificar } = require('./classificador-gemini')


const GRUPOS_AUTORIZADOS = new Set([
  '120363406293885960@g.us',  // grupo de teste
  // '120363xxxxxxxxx@g.us',  // adicione outros grupos aqui quando precisar
])
const app = express()
const PORT = process.env.PORT || 3000

// ── Middlewares ───────────────────────────────────────────────────────────────
//
// Middlewares são funções que processam a requisição ANTES de chegar na rota.
//
// cors()         → permite que o painel React (rodando em outra porta/domínio)
//                  acesse esta API. Sem isso, o navegador bloqueia a requisição.
//
// express.json() → faz o Express conseguir ler o corpo das requisições em JSON.
//                  Sem isso, req.body seria undefined.

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001']
}))
app.use(express.json())


// ─────────────────────────────────────────────────────────────────────────────
// ROTA 1: POST /webhook
//
// Esta é a rota mais importante. O Evolution API chama ela automaticamente
// toda vez que uma mensagem nova chega no grupo do WhatsApp.
//
// O fluxo completo acontece aqui:
//   1. Recebe o payload do Evolution API
//   2. Filtra: só processa mensagens de grupos
//   3. Extrai o nome do técnico e o texto
//   4. Chama a IA para classificar
//   5. Salva no banco
// ─────────────────────────────────────────────────────────────────────────────

app.post('/webhook', async (req, res) => {
  try {

    // req.body é o objeto JSON que o Evolution API enviou
    const payload = req.body

    // Ignora qualquer evento que não seja "mensagem nova"
    // O Evolution API dispara vários tipos de evento (conexão, status, etc.)
    // Queremos apenas mensagens de texto chegando
    if (payload.event !== 'messages.upsert') return res.sendStatus(200)

    const data = payload.data
    const remoteJid = data?.key?.remoteJid ?? ''

    // remoteJid identifica de onde veio a mensagem.
    // Grupos sempre terminam com "@g.us".
    // Conversas diretas terminam com "@s.whatsapp.net".
    // Só queremos processar mensagens de grupos.



    if (!remoteJid.endsWith('@g.us')) return res.sendStatus(200)

    if (!GRUPOS_AUTORIZADOS.has(remoteJid)) {
      console.log(`[Webhook] Grupo não autorizado ignorado: ${remoteJid}`)
      return res.sendStatus(200)
    }

    // Ignora mensagens que o próprio número conectado enviou
    // (para não criar demandas a partir das respostas automáticas do bot)
    if (data?.key?.fromMe) return res.sendStatus(200)

    // Extrai o nome do técnico e o texto da mensagem
    // O operador "??" significa "se o valor da esquerda for null/undefined,
    // use o valor da direita como padrão"
    const tecnico = data.pushName ?? 'Desconhecido'
    const mensagem = data.message?.conversation
      ?? data.message?.extendedTextMessage?.text
      ?? ''

    // Não processa mensagens vazias (fotos, áudios, stickers...)
    if (!mensagem.trim()) return res.sendStatus(200)



    // ── Aqui entra a IA ───────────────────────────────────────────────────────
    //
    // classificar() é uma função assíncrona (async), por isso usamos "await".
    // "await" significa: "espere essa operação terminar antes de continuar".
    //
    // Enquanto o classificador (Gemini ou local) processa (~0,5–2 s), o Node.js pode atender
    // outras requisições — ele não fica travado esperando.
    //
    // A função devolve: { tipo, urgente, resumo }

    const { tipo, urgente, resumo } = await classificar(mensagem)

    // Se a IA retornou tipo null, é uma mensagem irrelevante (ex: "bom dia")
    // Não criamos demanda, apenas confirmamos o recebimento com status 200
    if (!tipo) return res.sendStatus(200)

    // Converte o timestamp Unix (segundos desde 1970) em data legível
    // O WhatsApp envia o horário neste formato numérico
    const timestamp = data.messageTimestamp
      ? new Date(data.messageTimestamp * 1000).toISOString()
      : new Date().toISOString()

    // Salva a demanda completa no banco de dados
    // O campo "resumo" vem da IA — é uma frase mais clara que o texto original
    const demanda = db.inserir({ tecnico, mensagem, tipo, urgente, resumo, timestamp })

    console.log(`[Nova demanda] ${tipo} · ${tecnico} · resumo: ${resumo}`)

    // Responde com status 201 (Created) e os dados da demanda criada
    res.status(201).json({ ok: true, demanda })

  } catch (erro) {
    // Se algo deu errado (IA fora do ar, banco cheio, etc.),
    // loga o erro e responde com 500 (Internal Server Error)
    console.error('[Webhook error]', erro)
    res.status(500).json({ ok: false, erro: erro.message })
  }
})


// ─────────────────────────────────────────────────────────────────────────────
// ROTA 2: GET /demandas
//
// O painel React chama esta rota para buscar a lista de demandas.
// Aceita filtros opcionais via query string:
//   GET /demandas              → todas
//   GET /demandas?tipo=CTO     → só CTOs
//   GET /demandas?busca=carlos → filtra por nome ou texto
// ─────────────────────────────────────────────────────────────────────────────

app.get('/demandas', (req, res) => {
  // req.query contém os parâmetros depois do "?" na URL
  const { tipo, busca } = req.query
  const lista = db.listar({ tipo, busca })
  res.json(lista)
})


// ─────────────────────────────────────────────────────────────────────────────
// ROTA 3: GET /demandas/:id
//
// Busca uma demanda específica pelo ID.
// O ":id" é um parâmetro dinâmico — funciona para qualquer número.
// Ex: GET /demandas/42 → busca a demanda de ID 42
// ─────────────────────────────────────────────────────────────────────────────

app.get('/demandas/:id', (req, res) => {
  // req.params.id é uma string, Number() converte para número inteiro
  const demanda = db.buscarPorId(Number(req.params.id))
  if (!demanda) return res.status(404).json({ erro: 'Demanda não encontrada' })
  res.json(demanda)
})


// ─────────────────────────────────────────────────────────────────────────────
// ROTA 4: DELETE /demandas/:id
//
// Remove uma demanda pelo ID.
// Chamada quando o usuário clica no ícone de lixeira no painel.
// ─────────────────────────────────────────────────────────────────────────────

app.delete('/demandas/:id', (req, res) => {
  const removida = db.remover(Number(req.params.id))
  if (!removida) return res.status(404).json({ erro: 'Demanda não encontrada' })
  res.json({ ok: true })
})


// ─────────────────────────────────────────────────────────────────────────────
// ROTA 5: GET /resumo
//
// Retorna os contadores para os cards de métricas no topo do painel.
// Ex: { total: 12, cto: 4, splitter: 3, fusao: 2, estrutura: 3, urgentes: 2 }
// ─────────────────────────────────────────────────────────────────────────────

app.get('/resumo', (req, res) => {
  res.json(db.resumo())
})


// ── Inicia o servidor ─────────────────────────────────────────────────────────
//
// app.listen() faz o servidor começar a "escutar" requisições na porta definida.
// O callback (função que vem depois) roda uma vez quando o servidor sobe.

const server = app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`)
  console.log(`Webhook esperando em http://localhost:${PORT}/webhook`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPorta ${PORT} já está em uso por outro processo.`)
    console.error('Libere a porta ou use outra: crie backend/.env com PORT=<numero livre>.')
    console.error(`No PowerShell: netstat -ano | findstr :${PORT}`)
    console.error('Anote o PID na última coluna e execute: taskkill /PID <PID> /F\n')
  } else {
    console.error(err)
  }
  process.exit(1)
})
