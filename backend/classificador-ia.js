// ─────────────────────────────────────────────────────────────────────────────
// classificador-ia.js
//
// Este módulo substitui o classificador por regex.
// Em vez de procurar palavras exatas, ele envia a mensagem para a IA
// e recebe de volta o tipo, a urgência e um resumo — tudo estruturado.
// ─────────────────────────────────────────────────────────────────────────────


// ── 1. PROMPT DO SISTEMA ─────────────────────────────────────────────────────
//
// Este é o "manual de instruções" que a IA recebe antes de ler qualquer
// mensagem. Ele explica quem ela é, o que deve fazer e qual formato devolver.
//
// Boas práticas de prompt:
//  - Seja direto sobre o papel da IA ("você é um classificador...")
//  - Liste os valores possíveis de cada campo (evita respostas criativas)
//  - Peça JSON puro, sem explicações ou markdown — mais fácil de processar
//  - Dê exemplos reais do seu contexto (CTO, splitter, fusão...)

const PROMPT_SISTEMA = `
Você é um classificador de demandas técnicas de redes de fibra óptica.
Técnicos de campo enviam mensagens informais pelo WhatsApp descrevendo
solicitações de serviço. Sua função é ler cada mensagem e extrair as
informações estruturadas abaixo.

Tipos de serviço possíveis:
- "CTO"       → abertura, instalação ou troca de caixa terminal óptica
- "Splitter"  → inserção, troca ou manutenção de splitter óptico
- "Fusão"     → emenda, fusão ou reparo de cabo de fibra
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

Mensagem: "bom dia pessoal"
Resposta: {"tipo":null,"urgente":false,"resumo":""}
`.trim()


// ── 2. FUNÇÃO PRINCIPAL: classificarComIA ────────────────────────────────────
//
// Recebe o texto da mensagem e devolve um objeto com tipo, urgente e resumo.
// Toda a comunicação com a API do Claude acontece aqui.

async function classificarComIA(mensagem) {

  // 2a. Monta o corpo da requisição para a API do Claude
  //
  // - model: qual versão do Claude usar
  // - max_tokens: limite de resposta (JSON pequeno, 200 é suficiente)
  // - system: o prompt do sistema que definimos acima
  // - messages: a conversa — aqui é só uma mensagem do usuário
  //   com o texto que chegou do WhatsApp

  const corpo = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: PROMPT_SISTEMA,
    messages: [
      {
        role: 'user',
        content: `Mensagem: "${mensagem}"`
      }
    ]
  }

  // 2b. Faz a chamada HTTP para a API do Claude
  //
  // fetch() é a função nativa do Node.js para fazer requisições HTTP.
  // Aqui estamos fazendo um POST para o endpoint de mensagens da Anthropic.
  // O header 'x-api-key' é onde vai sua chave de API.

  const resposta = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(corpo)
  })

  // 2c. Verifica se a requisição foi bem-sucedida
  if (!resposta.ok) {
    const erro = await resposta.text()
    throw new Error(`Erro na API do Claude (${resposta.status}): ${erro}`)
  }

  // 2d. Lê o JSON de resposta da API
  const data = await resposta.json()
  const textoResposta = data.content[0].text.trim()

  // 2e. Converte o texto JSON em objeto JavaScript
  try {
    const resultado = JSON.parse(textoResposta)
    return {
      tipo:    resultado.tipo    ?? null,
      urgente: resultado.urgente ?? false,
      resumo:  resultado.resumo  ?? ''
    }
  } catch {
    console.warn('[IA] Resposta inválida:', textoResposta)
    return { tipo: null, urgente: false, resumo: '' }
  }
}


// ── 3. FALLBACK: classificação local por palavras-chave ──────────────────────
//
// Se a chamada à API falhar, esta função é usada como plano B.
// Garante que nenhuma demanda seja perdida mesmo sem internet.

function classificarLocal(mensagem) {
  const txt = mensagem.toLowerCase()

  if (/splitter|divisor|1x4|1x8|1x16/.test(txt))
    return { tipo: 'Splitter', urgente: /urgente|sem sinal/.test(txt), resumo: mensagem }

  if (/fus[aã]o|emenda|cabo rompido|fibra rompida|splice/.test(txt))
    return { tipo: 'Fusão', urgente: /urgente|caiu|cortado/.test(txt), resumo: mensagem }

  if (/abertura de cto|nova cto|cto cheia|nova caixa|cto-/.test(txt))
    return { tipo: 'CTO', urgente: /urgente|aguardando/.test(txt), resumo: mensagem }

  if (/poste|estrutura|suporte|bra[çc]o|inclinado|vistoria/.test(txt))
    return { tipo: 'Estrutura', urgente: /urgente/.test(txt), resumo: mensagem }

  return { tipo: null, urgente: false, resumo: '' }
}


// ── 4. EXPORTAÇÃO: função pública com fallback automático ────────────────────
//
// Esta é a única função que o server.js vai chamar.
// Ela tenta a IA primeiro; se falhar, usa o classificador local.

async function classificar(mensagem) {
  const temChave = Boolean(process.env.ANTHROPIC_API_KEY?.trim())

  if (!temChave) {
    console.log('[classificador] Sem ANTHROPIC_API_KEY — usando palavras-chave locais')
    return classificarLocal(mensagem)
  }

  try {
    const resultado = await classificarComIA(mensagem)
    console.log(`[IA] classificou: ${resultado.tipo ?? 'ignorar'} | urgente: ${resultado.urgente}`)
    return resultado
  } catch (erro) {
    console.warn('[IA] Falhou, usando classificador local:', erro.message)
    return classificarLocal(mensagem)
  }
}

module.exports = { classificar }
