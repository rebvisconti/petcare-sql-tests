// tests/api/pets-e-estatisticas.spec.js

import { test, expect } from '@playwright/test';
import { BASE_URL, criarAgendamento, dataFutura, createAgendamentoSafe, gerarPet, DB } from '../../support/index.js';

test.describe('CT-API — Pets', () => {

  
  test('CT-API-011 | Listar todos os pets', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/pets`);
    const body = await res.json();

    expect(res.status()).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    const pet = body[0];
    expect(pet).toHaveProperty('id');
    expect(pet).toHaveProperty('nome');
    expect(pet).toHaveProperty('porte');
    expect(pet).toHaveProperty('tutor');
    expect(pet).toHaveProperty('telefone');
  });

  test('CT-API-012 | Buscar pet por ID existente', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/pets/1`);
    const body = await res.json();

    expect(res.status()).toBe(200);
    expect(body.id).toBe(1);
    expect(body.nome).toBeTruthy();
  });

  test('CT-API-013 | Buscar pet por ID inexistente', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/pets/9999`);
    const body = await res.json();

    expect(res.status()).toBe(404);
    expect(body.mensagem).toBe('Pet não encontrado.');
  });
});

test.describe('CT-API — Estatísticas', () => {

  test('CT-API-014 | Obter estatísticas gerais', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/estatisticas`);
    const body = await res.json();

    expect(res.status()).toBe(200);
    expect(body).toHaveProperty('totalAgendamentos');
    expect(body).toHaveProperty('agendados');
    expect(body).toHaveProperty('concluidos');
    expect(body).toHaveProperty('cancelados');
    expect(body).toHaveProperty('petsUnicos');

    // Todos os valores são números não-negativos
    Object.values(body).forEach(v => {
      expect(typeof v).toBe('number');
      expect(v).toBeGreaterThanOrEqual(0);
    });
  });

  test('CT-API-015 | Total = agendados + concluidos + cancelados', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/estatisticas`);
    const body = await res.json();

    expect(body.totalAgendamentos).toBe(
      body.agendados + body.concluidos + body.cancelados
    );
  });

  test('CT-API-016 | Estatísticas atualizam após criar agendamento', async ({ request }) => {
    const antes = await (await request.get(`${BASE_URL}/estatisticas`)).json();

    const { res } = await createAgendamentoSafe(request, DB, {
      ...gerarPet(),
      data: dataFutura(30),
    });

    expect(res.status()).toBe(201);

    const depois = await (await request.get(`${BASE_URL}/estatisticas`)).json();

    expect(depois.totalAgendamentos).toBeGreaterThanOrEqual(antes.totalAgendamentos + 1);
    expect(depois.agendados).toBeGreaterThanOrEqual(antes.agendados + 1);
  });

});
