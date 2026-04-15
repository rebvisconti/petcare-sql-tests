// tests/e2e/fluxos-completos.spec.js
// Fluxos E2E que simulam uso real do sistema

import { test, expect } from '@playwright/test';
import { BASE_URL, criarAgendamento, dataFutura, DB } from '../../support/index.js';

test.describe('CT-E2E — Fluxos Completos (API + SQL)', () => {

  test('CT-E2E-001 | Ciclo de vida completo de um agendamento', async ({ request }) => {

    let agendamentoId;

    await test.step('1. Criar agendamento', async () => {
      const res = await criarAgendamento(request, {
        nomePet: 'CicloVida',
        tutor: 'Ciclo Tutor',
        data: dataFutura(50),
        horario: '11:00',
        observacoes: 'Teste de ciclo completo',
      });

      expect(res.status()).toBe(201);

      const body = await res.json();
      expect(body.agendamento).toBeDefined();

      agendamentoId = body.agendamento.id;
    });

    await test.step('2. Verificar no banco após criar', async () => {
      const noBanco = DB.buscarAgendamentoPorId(agendamentoId);

      expect(noBanco).toBeDefined();
      expect(noBanco?.status).toBe('agendado');
      expect(noBanco?.nomePet).toBe('CicloVida');
    });

    await test.step('3. Atualizar para concluído', async () => {
      const upd = await request.put(
        `${BASE_URL}/agendamentos/${agendamentoId}`,
        { data: { status: 'concluido' } }
      );

      expect(upd.status()).toBe(200);
    });

    await test.step('4. Confirmar status no banco', async () => {
      const noBanco = DB.buscarAgendamentoPorId(agendamentoId);

      expect(noBanco).toBeDefined();
      expect(noBanco?.status).toBe('concluido');
    });

    await test.step('5. Excluir agendamento', async () => {
      const del = await request.delete(
        `${BASE_URL}/agendamentos/${agendamentoId}`
      );

      expect(del.status()).toBe(200);
    });

    await test.step('6. Confirmar exclusão no banco e na API', async () => {
      const noBanco = DB.buscarAgendamentoPorId(agendamentoId);
      expect(noBanco).toBeFalsy();

      const naApi = await request.get(
        `${BASE_URL}/agendamentos/${agendamentoId}`
      );

      expect(naApi.status()).toBe(404);
    });
  });

  test('CT-E2E-002 | Pet reutilizado em múltiplos agendamentos', async ({ request }) => {

    const nomePet = 'PetRecorrente';
    const tutor = 'Tutor Recorrente';

    await test.step('Criar dois agendamentos para o mesmo pet', async () => {
      await criarAgendamento(request, {
        nomePet,
        tutor,
        data: dataFutura(55),
        horario: '08:00',
      });

      await criarAgendamento(request, {
        nomePet,
        tutor,
        data: dataFutura(56),
        horario: '09:00',
      });
    });

    await test.step('Validar pet no banco', async () => {
      const pets = DB.contarPets();

      const petNoBanco = DB.buscarPetPorNomeETutor(nomePet, tutor);

      expect(pets).toBeGreaterThan(0);
      expect(petNoBanco).not.toBeNull();
    });

    await test.step('Validar múltiplos agendamentos vinculados ao mesmo pet', async () => {
      const agendamentos = await (
        await request.get(`${BASE_URL}/agendamentos?pet=${nomePet}`)
      ).json();

      expect(agendamentos.length).toBeGreaterThanOrEqual(2);

      const petIds = [...new Set(agendamentos.map(a => a.pet_id))];
      expect(petIds.length).toBe(1);
    });
  });

  test('CT-E2E-003 | Fluxo de autenticação + operação protegida', async ({ request }) => {

    await test.step('Login válido retorna 200', async () => {
      const res = await request.post(`${BASE_URL}/auth/login`, {
        data: { usuario: 'admin', senha: 'petcare123' },
      });

      expect(res.status()).toBe(200);
    });

    await test.step('Login inválido retorna 401', async () => {
      const res = await request.post(`${BASE_URL}/auth/login`, {
        data: { usuario: 'admin', senha: 'errada' },
      });

      expect(res.status()).toBe(401);
    });

    await test.step('API continua operacional após tentativa inválida', async () => {
      const res = await request.get(`${BASE_URL}/agendamentos`);
      expect(res.status()).toBe(200);
    });
  });

  test('CT-E2E-004 | Consistência entre API e banco após múltiplas operações', async ({ request }) => {

    const statsBefore = DB.estatisticas();

    const ids = [];

    await test.step('Criar 3 agendamentos', async () => {
      for (let i = 0; i < 3; i++) {
        const res = await criarAgendamento(request, {
          data: dataFutura(60 + i),
          horario: ['10:00', '11:00', '14:00'][i],
          nomePet: `ConsistPet${i}`,
          tutor: `Consist Tutor ${i}`,
        });

        const body = await res.json();
        ids.push(body.agendamento.id);
      }
    });

    await test.step('Atualizar status dos agendamentos', async () => {

      await request.put(`${BASE_URL}/agendamentos/${ids[0]}`, {
        data: { status: 'concluido' },
      });

      await request.put(`${BASE_URL}/agendamentos/${ids[1]}`, {
        data: { status: 'cancelado' },
      });
    });

    await test.step('Validar estatísticas no banco', async () => {
      const statsAfter = DB.estatisticas();

      expect(statsAfter.totalAgendamentos).toBe(statsBefore.totalAgendamentos + 3);
      expect(statsAfter.agendados).toBe(statsBefore.agendados + 1);
      expect(statsAfter.concluidos).toBe(statsBefore.concluidos + 1);
      expect(statsAfter.cancelados).toBe(statsBefore.cancelados + 1);
    });

    await test.step('Validar consistência com API', async () => {
      const apiStats = await (await request.get(`${BASE_URL}/estatisticas`)).json();

      const statsAfter = DB.estatisticas();

      expect(apiStats).toEqual(statsAfter);
    });
  });

});