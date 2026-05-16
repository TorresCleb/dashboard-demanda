// ─────────────────────────────────────────────────────────────────────────────
// database.js
//
// Módulo responsável por guardar e recuperar as demandas.
// Atualmente usa memória (array JavaScript) — simples para aprender.
//
// Para produção, você trocaria o array por chamadas ao SQLite ou PostgreSQL.
// A vantagem desta estrutura: o server.js nunca muda —
// só este arquivo seria reescrito para usar um banco real.
// ─────────────────────────────────────────────────────────────────────────────


// ── Estado interno ────────────────────────────────────────────────────────────
//
// "demandas" é o array que funciona como banco de dados em memória.
// "nextId" é um contador que garante que cada demanda tenha um ID único.
//
// Atenção: ao reiniciar o servidor, os dados são perdidos.
// Para persistência real, use SQLite (arquivo no disco) ou PostgreSQL.

let demandas = []
let nextId   = 1


// ── inserir() ─────────────────────────────────────────────────────────────────
//
// Cria uma nova demanda e adiciona ao array.
// Recebe um objeto com os campos vindos do webhook + classificação da IA.
// Devolve o objeto completo da demanda criada (com ID e datas formatadas).

function inserir({ tecnico, mensagem, tipo, urgente, resumo, timestamp }) {
  const demanda = {
    id:       nextId++,
    tecnico,
    mensagem,   // texto original do WhatsApp (como o técnico digitou)
    resumo,     // frase gerada pela IA (mais clara e padronizada)
    tipo,
    urgente: !!urgente,  // !! garante que o valor seja boolean (true/false)

    // Formata a data e hora para exibição no painel
    // toLocaleDateString e toLocaleTimeString usam o fuso do servidor
    data: new Date(timestamp).toLocaleDateString('pt-BR'),
    hora: new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit'
    }),
  }

  // unshift() adiciona no início do array (mais recente primeiro)
  // push() adicionaria no final (mais recente por último)
  demandas.unshift(demanda)
  return demanda
}


// ── listar() ─────────────────────────────────────────────────────────────────
//
// Retorna todas as demandas, com filtros opcionais.
// filter() percorre o array e mantém apenas os itens que passam nos testes.

function listar({ tipo, busca } = {}) {
  return demandas.filter(d => {
    // Se "tipo" foi informado, a demanda precisa ter esse tipo.
    // Se não foi informado, qualquer tipo passa.
    const tipoOk  = !tipo  || d.tipo === tipo

    // Se "busca" foi informada, procura no nome do técnico E no texto original
    // toLowerCase() garante que "Carlos" e "carlos" sejam tratados igual
    const buscaOk = !busca || [d.tecnico, d.mensagem, d.resumo]
      .join(' ')
      .toLowerCase()
      .includes(busca.toLowerCase())

    return tipoOk && buscaOk
  })
}


// ── buscarPorId() ─────────────────────────────────────────────────────────────
//
// find() percorre o array e retorna o PRIMEIRO item que satisfaz a condição.
// Se não encontrar, retorna undefined — por isso o "?? null" no final.

function buscarPorId(id) {
  return demandas.find(d => d.id === id) ?? null
}


// ── remover() ────────────────────────────────────────────────────────────────
//
// findIndex() retorna a posição do item no array (-1 se não encontrar).
// splice(idx, 1) remove 1 item a partir da posição idx.
// splice() retorna um array com os itens removidos — pegamos o primeiro.

function remover(id) {
  const idx = demandas.findIndex(d => d.id === id)
  if (idx === -1) return null
  const [removida] = demandas.splice(idx, 1)
  return removida
}


// ── resumo() ─────────────────────────────────────────────────────────────────
//
// Calcula os contadores para os cards de métricas do painel.
// filter().length conta quantos itens passam em cada condição.

function resumo() {
  return {
    total:     demandas.length,
    cto:       demandas.filter(d => d.tipo === 'CTO').length,
    splitter:  demandas.filter(d => d.tipo === 'Splitter').length,
    fusao:     demandas.filter(d => d.tipo === 'Fusão').length,
    estrutura: demandas.filter(d => d.tipo === 'Estrutura').length,
    urgentes:  demandas.filter(d => d.urgente).length,
  }
}

// Exporta as funções para que outros arquivos possam usá-las com require()
module.exports = { inserir, listar, buscarPorId, remover, resumo }
