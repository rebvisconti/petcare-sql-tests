// support/db-helper.js — Acesso ao SQLite para validação e controle de dados nos testes

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// ─────────────────────────────────────────────
// RESOLVE CAMINHO DO PROJETO
// ─────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = path.resolve(
  __dirname,
  '../../petcare-sql-qa/database/petcare.db'
);

// ─────────────────────────────────────────────
// CONEXÃO READ-ONLY (para validações)
// ─────────────────────────────────────────────
let _db = null;

export function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true });
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

// ─────────────────────────────────────────────
// CONEXÃO WRITE (para limpeza e controle de testes)
// ─────────────────────────────────────────────
let _dbWrite = null;

export function getDbWrite() {
  if (!_dbWrite) {
    _dbWrite = new Database(DB_PATH);
    _dbWrite.pragma('foreign_keys = ON');
  }
  return _dbWrite;
}

// ─────────────────────────────────────────────
// OPERAÇÕES DE LIMPEZA (ISOLAMENTO DE TESTES)
// ─────────────────────────────────────────────
export const DBWrite = {
  limparAgendamentosPorPet(nomePetPrefixo) {
    getDbWrite().prepare(`
      DELETE FROM agendamentos
      WHERE pet_id IN (
        SELECT id FROM pets WHERE nome LIKE ?
      )
    `).run(`${nomePetPrefixo}%`);
  },

  limparPetsPorNome(nomePetPrefixo) {
    getDbWrite().prepare(`
      DELETE FROM pets WHERE nome LIKE ?
    `).run(`${nomePetPrefixo}%`);
  },

  limparTudo() {
    getDbWrite().prepare(`DELETE FROM agendamentos`).run();
    getDbWrite().prepare(`DELETE FROM pets`).run();
  }
};

// ─────────────────────────────────────────────
// QUERY HELPERS (READ)
// ─────────────────────────────────────────────
export const DB = {

  // ── AGENDAMENTOS ─────────────────────────────
  buscarAgendamentoPorId(id) {
    return getDb().prepare(`
      SELECT a.*, p.nome AS nomePet, p.tutor, p.telefone, p.porte
      FROM agendamentos a
      JOIN pets p ON p.id = a.pet_id
      WHERE a.id = ?
    `).get(id);
  },

  contarAgendamentos() {
    return getDb()
      .prepare('SELECT COUNT(*) AS total FROM agendamentos')
      .get().total;
  },

  contarAgendamentosPorStatus(status) {
    return getDb()
      .prepare('SELECT COUNT(*) AS total FROM agendamentos WHERE status = ?')
      .get(status).total;
  },

  buscarAgendamentoPorHorario(data, horario) {
    return getDb().prepare(`
      SELECT *
      FROM agendamentos
      WHERE data = ?
        AND horario = ?
        AND status != 'cancelado'
    `).all(data, horario);
  },

  estatisticas() {
    return getDb().prepare(`
      SELECT
        COUNT(*)                                              AS totalAgendamentos,
        SUM(CASE WHEN status = 'agendado'  THEN 1 ELSE 0 END) AS agendados,
        SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) AS concluidos,
        SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) AS cancelados,
        COUNT(DISTINCT pet_id)                                AS petsUnicos
      FROM agendamentos
    `).get();
  },

  // ── PETS ─────────────────────────────────────
  buscarPetPorNomeETutor(nome, tutor) {
    return getDb().prepare(`
      SELECT * FROM pets
      WHERE nome = ? AND tutor = ?
    `).get(nome, tutor);
  },

  contarPets() {
    return getDb()
      .prepare('SELECT COUNT(*) AS total FROM pets')
      .get().total;
  },

  // ── INTEGRIDADE ──────────────────────────────
  verificarIntegridade() {
    return getDb().prepare(`
      SELECT a.id
      FROM agendamentos a
      LEFT JOIN pets p ON p.id = a.pet_id
      WHERE p.id IS NULL
    `).all();
  }
};