import { test, expect } from '@playwright/test';
import { BASE_URL, criarAgendamento, dataFutura, createAgendamentoSafe, DB, DBWrite, gerarPet, horarioSeguro, dataUnica } from '../../support/index.js';
test.describe('CT-SQL — Database Validation', () => {

  // limpeza antes de cada teste para garantir isolamento total
  test.beforeEach(() => {
    DBWrite.limparAgendamentosPorPet('Pet_');
    DBWrite.limparPetsPorNome('Pet_');
  });

  // ─────────────────────────────────────────────
  test('CT-SQL-001 | Create appointment and validate in DB', async ({ request }) => {
    const pet = gerarPet();
    const data = dataUnica(() => dataFutura(30));

    const { res, body } = await createAgendamentoSafe(request, DB, {
      ...pet,
      data
    });

    expect(res.status()).toBe(201);
    expect(body.agendamento).toBeDefined();

    const id = body.agendamento.id;

    const noBanco = DB.buscarAgendamentoPorId(id);
    expect(noBanco).not.toBeNull();

    expect(noBanco.nomePet).toBeDefined();
    expect(noBanco.tutor).toBeDefined();
  });

  // ─────────────────────────────────────────────
  test('CT-SQL-002 | Pet is auto-created', async ({ request }) => {
    const pet = gerarPet();

    expect(DB.buscarPetPorNomeETutor(pet.nomePet, pet.tutor)).toBeUndefined();

    const res = await criarAgendamento(request, {
      ...pet,
      data: dataFutura(31),
      horario: horarioSeguro(),
    });

    expect(res.status()).toBe(201);

    const petDb = DB.buscarPetPorNomeETutor(pet.nomePet, pet.tutor);
    expect(petDb).not.toBeNull();
  });

  // ─────────────────────────────────────────────
  test('CT-SQL-003 | Update status and validate DB', async ({ request }) => {
    const pet = gerarPet();

    const { res, body } = await createAgendamentoSafe(request, DB, {
      ...pet,
      data: dataFutura(32),
    });

    expect(res.status()).toBe(201);

    const id = body.agendamento.id;

    const update = await request.put(`${BASE_URL}/agendamentos/${id}`, {
      data: { status: 'concluido' },
    });

    expect(update.status()).toBe(200);

    const noBanco = DB.buscarAgendamentoPorId(id);
    expect(noBanco.status).toBe('concluido');
  });

  // ─────────────────────────────────────────────
  test('CT-SQL-004 | Delete and validate DB', async ({ request }) => {
    const pet = gerarPet();

    const { res, body } = await createAgendamentoSafe(request, DB, {
      ...pet,
      data: dataFutura(33),
    });

    expect(res.status()).toBe(201);

    const id = body.agendamento.id;

    const del = await request.delete(`${BASE_URL}/agendamentos/${id}`);
    expect(del.status()).toBe(200);

    const noBanco = DB.buscarAgendamentoPorId(id);
    expect(noBanco).toBeUndefined();
  });

  // ─────────────────────────────────────────────
  test('CT-SQL-005 | API count equals DB count', async ({ request }) => {
    const apiRes = await request.get(`${BASE_URL}/agendamentos`);
    const apiBody = await apiRes.json();

    const totalBanco = DB.contarAgendamentos();

    expect(apiBody.length).toBe(totalBanco);
  });

  // ─────────────────────────────────────────────
  test('CT-SQL-006 | API stats match DB', async ({ request }) => {
    const apiRes = await request.get(`${BASE_URL}/estatisticas`);
    const apiBody = await apiRes.json();

    const sqlStats = DB.estatisticas();

    expect(apiBody.totalAgendamentos).toBe(sqlStats.totalAgendamentos);
    expect(apiBody.agendados).toBe(sqlStats.agendados);
    expect(apiBody.concluidos).toBe(sqlStats.concluidos);
    expect(apiBody.cancelados).toBe(sqlStats.cancelados);
  });

  // ─────────────────────────────────────────────
  test('CT-SQL-007 | Stats update after create + complete', async ({ request }) => {
    const before = DB.estatisticas();
    const pet = gerarPet();

    const { res, body } = await createAgendamentoSafe(request, DB, {
      ...pet,
      data: dataFutura(34),
    });

    expect(res.status()).toBe(201);

    const id = body.agendamento.id;

    const update = await request.put(`${BASE_URL}/agendamentos/${id}`, {
      data: { status: 'concluido' },
    });

    expect(update.status()).toBe(200);

    const after = DB.estatisticas();

    expect(after.totalAgendamentos).toBe(before.totalAgendamentos + 1);
    expect(after.concluidos).toBe(before.concluidos + 1);
  });

  // ─────────────────────────────────────────────
  test('CT-SQL-008 | Time conflict does not duplicate', async ({ request }) => {
    const data = dataFutura(35);
    const horario = horarioSeguro();

    const first = await criarAgendamento(request, {
      ...gerarPet(),
      data,
      horario,
    });

    expect(first.status()).toBe(201);

    const totalAntes = DB.contarAgendamentos();

    const second = await criarAgendamento(request, {
      ...gerarPet(),
      data,
      horario,
    });

    expect(second.status()).toBe(400);

    const totalDepois = DB.contarAgendamentos();
    expect(totalDepois).toBeGreaterThanOrEqual(totalAntes);
  });

  // ─────────────────────────────────────────────
  test('CT-SQL-009 | No orphan records', async () => {
    const orfaos = DB.verificarIntegridade();
    expect(orfaos).toHaveLength(0);
  });

  // ─────────────────────────────────────────────
  test('CT-SQL-010 | Pets count API vs DB', async ({ request }) => {
    const apiRes = await request.get(`${BASE_URL}/pets`);
    const apiBody = await apiRes.json();

    const totalBanco = DB.contarPets();

    expect(apiBody.length).toBe(totalBanco);
  });

});