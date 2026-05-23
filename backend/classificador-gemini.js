// ─────────────────────────────────────────────────────────────────────────────
// classificador-gemini.js
//
// Classificação via Google Gemini. Sem GEMINI_API_KEY, usa apenas palavras-chave.
// Fallback local também se a API falhar (rede, cota, chave inválida).
// ─────────────────────────────────────────────────────────────────────────────

const { GoogleGenerativeAI } = require('@google/generative-ai')

function getModel () {
  const chave = process.env.GEMINI_API_KEY?.trim()
  if (!chave) return null
  const nomeModelo = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
  const genAI = new GoogleGenerativeAI(chave)
  return genAI.getGenerativeModel({ model: nomeModelo })
}

const PROMPT_SISTEMA = `
Você é um classificador de demandas técnicas de redes de fibra óptica.
Técnicos de campo enviam mensagens informais pelo WhatsApp descrevendo
solicitações de serviço. Sua função é ler cada mensagem e extrair as
informações estruturadas abaixo.

Tipos de serviço possíveis:
- "CTO"       → abertura, instalação ou troca de caixa terminal óptica
- "Splitter"  → inserção, troca ou manutenção de splitter óptico
- "Fusão"     → emenda, fusão ou reparo de cabo de fibra óptica
- "Estrutura" → poste, suporte, braço, fixação ou infraestrutura física
- null        → mensagem que não é uma solicitação técnica (ex: "bom dia")

Responda APENAS com JSON válido, sem markdown, sem explicações, sem texto fora do JSON.
Formato exato:
{
  "tipo": "CTO" | "Splitter" | "Fusão" | "Estrutura" | null,
  "urgente": true | false,
  "resumo": "uma frase curta descrevendo a demanda"
}

Exemplos:
Mensagem: "kto cheia no setor norte, precisamos de nova caixa"
Resposta: {"tipo":"CTO","urgente":false,"resumo":"CTO cheia no setor norte, necessário abertura de nova caixa"}

Mensagem: "URGENTE cabo caiu na av brasil altura 512"
Resposta: {"tipo":"Fusão","urgente":true,"resumo":"Cabo de fibra rompido na Av. Brasil nº 512"}

Mensagem: "oi tudo bem"
Resposta: {"tipo":null,"urgente":false,"resumo":""}
`.trim()

async function classificarComGemini (mensagem) {
  const model = getModel()
  if (!model) {
    throw new Error('GEMINI_API_KEY não configurada')
  }

  const promptCompleto = `${PROMPT_SISTEMA}\n\nMensagem: "${mensagem}"`
  const resultado = await model.generateContent(promptCompleto)
  const textoResposta = resultado.response.text().trim()

  const textoLimpo = textoResposta
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const parsed = JSON.parse(textoLimpo)

  return {
    tipo: parsed.tipo ?? null,
    urgente: parsed.urgente ?? false,
    resumo: parsed.resumo ?? ''
  }
}

function classificarLocal (mensagem) {
  const txt = mensagem.toLowerCase()

  if (/splitter|divisor|1x4|1x8|1x16/.test(txt)) {
    return { tipo: 'Splitter', urgente: /urgente|sem sinal/.test(txt), resumo: mensagem }
  }

  if (/fus[aã]o|emenda|cabo rompido|fibra rompida|splice/.test(txt)) {
    return { tipo: 'Fusão', urgente: /urgente|caiu|cortado/.test(txt), resumo: mensagem }
  }

  if (/abertura de cto|nova cto|cto cheia|nova caixa|cto-/.test(txt)) {
    return { tipo: 'CTO', urgente: /urgente|aguardando/.test(txt), resumo: mensagem }
  }

  if (/poste|estrutura|suporte|bra[çc]o|inclinado|vistoria/.test(txt)) {
    return { tipo: 'Estrutura', urgente: /urgente/.test(txt), resumo: mensagem }
  }

  return { tipo: null, urgente: false, resumo: '' }
}

async function classificar (mensagem) {
  const temChave = Boolean(process.env.GEMINI_API_KEY?.trim())

  if (!temChave) {
    console.log('[classificador] Sem GEMINI_API_KEY — usando palavras-chave locais')
    return classificarLocal(mensagem)
  }

  try {
    const resultado = await classificarComGemini(mensagem)
    console.log(`[Gemini] tipo: ${resultado.tipo ?? 'ignorar'} | urgente: ${resultado.urgente}`)
    return resultado
  } catch (erro) {
    console.warn('[Gemini] Falhou, usando classificador local:', erro.message)
    return classificarLocal(mensagem)
  }
}

module.exports = { classificar }
