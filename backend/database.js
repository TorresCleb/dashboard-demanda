// ─────────────────────────────────────────────────────────────────────────────
// database.js — versão com persistência em arquivo JSON (lowdb)
//
// O lowdb salva todos os dados num arquivo "demandas.json" no disco.
// Diferente da versão em memória, os dados NÃO somem ao reiniciar o servidor.
//
// Como funciona:
//   - Toda operação (inserir, remover) salva automaticamente no arquivo
//   - O arquivo é lido uma vez ao iniciar o servidor
//   - É como um banco de dados simples em arquivo, sem precisar de servidor
// ─────────────────────────────────────────────────────────────────────────────

const { JSONFileSyncAdapter, SyncAdapter } = require('lowdb')
const { LowSync } = require('lowdb')
const { JSONFileSync } = require('lowdb/node')
const path = require('path')

// ── Inicialização do banco ────────────────────────────────────────────────────
//
// O arquivo "demandas.json" será criado na pasta do projeto automaticamente.
// Se já existir (servidor reiniciou), os dados são carregados dele.
//
// db.data é o objeto JavaScript que representa o banco inteiro.
// db.write() salva as alterações no arquivo.

const arquivo = path.join(__dirname, 'demandas.json')
const adapter = new JSONFileSync(arquivo)
const db      = new LowSync(adapter, { demandas: [], nextId: 1 })

// Lê o arquivo ao iniciar — carrega os dados existentes na memória
db.read()

// Garante que a estrutura existe (caso o arquivo esteja vazio ou corrompido)
db.data.demandas ??= []
db.data.nextId   ??= 1

console.log(`[DB] Banco carregado — ${db.data.demandas.length} demanda(s) existente(s)`)


// ── inserir() ─────────────────────────────────────────────────────────────────
//
// Cria uma nova demanda, adiciona no array e salva no arquivo imediatamente.
// db.write() é o que efetivamente grava no disco.

function inserir({ tecnico, mensagem, tipo, urgente, resumo, timestamp }) {
  const demanda = {
    id:      db.data.nextId++,
    tecnico,
    mensagem,
    resumo:  resumo ?? mensagem,
    tipo,
    urgente: !!urgente,
    data:    new Date(timestamp).toLocaleDateString('pt-BR'),
    hora:    new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit'
    }),
  }

  // Adiciona no início do array (mais recente primeiro)
  db.data.demandas.unshift(demanda)

  // Salva no arquivo — sem isso os dados só ficam na memória
  db.write()

  return demanda
}


// ── listar() ─────────────────────────────────────────────────────────────────
//
// Retorna demandas com filtros opcionais.
// Sempre lê do array em memória (já sincronizado com o arquivo).

function listar({ tipo, busca } = {}) {
  return db.data.demandas.filter(d => {
    const tipoOk  = !tipo  || d.tipo === tipo
    const buscaOk = !busca || [d.tecnico, d.mensagem, d.resumo]
      .join(' ').toLowerCase().includes(busca.toLowerCase())
    return tipoOk && buscaOk
  })
}


// ── buscarPorId() ─────────────────────────────────────────────────────────────

function buscarPorId(id) {
  return db.data.demandas.find(d => d.id === id) ?? null
}


// ── remover() ─────────────────────────────────────────────────────────────────
//
// Remove a demanda do array e salva o arquivo atualizado.

function remover(id) {
  const idx = db.data.demandas.findIndex(d => d.id === id)
  if (idx === -1) return null
  const [removida] = db.data.demandas.splice(idx, 1)
  db.write()  // salva a remoção no arquivo
  return removida
}


// ── resumo() ─────────────────────────────────────────────────────────────────

function resumo() {
  const { demandas } = db.data
  return {
    total:     demandas.length,
    cto:       demandas.filter(d => d.tipo === 'CTO').length,
    splitter:  demandas.filter(d => d.tipo === 'Splitter').length,
    fusao:     demandas.filter(d => d.tipo === 'Fusão').length,
    estrutura: demandas.filter(d => d.tipo === 'Estrutura').length,
    urgentes:  demandas.filter(d => d.urgente).length,
  }
}

module.exports = { inserir, listar, buscarPorId, remover, resumo }