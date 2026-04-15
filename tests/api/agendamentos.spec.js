// tests/api/agendamentos.spec.js — Testes de agendamentos

import { test, expect } from '@playwright/test';
import { BASE_URL, createAgendamentoSafe, dataFutura, gerarPet, DB } from '../../support/index.js';

test.describe('CT-API — Agendamentos', () => {

  test('CT-API-07 | Criar agendamento com sucesso', async ({ request }) => {
    const pet = gerarPet();

    const { res, body } = await createAgendamentoSafe(request, DB, {
      ...pet,
      data: dataFutura(10),
    });

    expect(res.status()).toBe(201);
    expect(body.agendamento.id).toBeTruthy();
    expect(body.agendamento.nomePet).toBe(pet.nomePet);
    expect(body.agendamento.status).toBe('agendado');
  });

  test('CT-API-08 | Criar agendamento com horário ocupado', async ({ request }) => {
    const data = dataFutura(15);

    const first = await createAgendamentoSafe(request, DB, {
      ...gerarPet(),
      data,
    });

    expect(first.res.status()).toBe(201);

    // força conflito manual
    const payload = {
      ...gerarPet(),
      data,
      horario: first.payload.horario,
    };

    const res = await request.post(`${BASE_URL}/agendamentos`, {
      data: payload,
    });

    expect(res.status()).toBe(400);
  });

  test('CT-API-09 | Atualizar status do agendamento', async ({ request }) => {
    const { res, body } = await createAgendamentoSafe(request, DB, {
      ...gerarPet(),
      data: dataFutura(20),
    });

    expect(res.status()).toBe(201);

    const id = body.agendamento.id;

    const update = await request.put(`${BASE_URL}/agendamentos/${id}`, {
      data: { status: 'concluido' },
    });

    expect(update.status()).toBe(200);

    const updated = await update.json();
    expect(updated.agendamento.status).toBe('concluido');
  });

  test('CT-API-010 | Excluir agendamento existente', async ({ request }) => {
    const { res, body } = await createAgendamentoSafe(request, DB, {
      ...gerarPet(),
      data: dataFutura(25),
    });

    expect(res.status()).toBe(201);

    const id = body.agendamento.id;

    const del = await request.delete(`${BASE_URL}/agendamentos/${id}`);
    expect(del.status()).toBe(200);

    const check = await request.get(`${BASE_URL}/agendamentos/${id}`);
    expect(check.status()).toBe(404);
  });

});