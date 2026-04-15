// tests/api/auth.spec.js — Testes de autenticação

import { test, expect } from '@playwright/test';
import { BASE_URL } from '../../support/index.js';

test.describe('CT-API — Autenticação', () => {

  test('CT-API-001 | Login com credenciais válidas', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/auth/login`, {
      data: { usuario: 'admin', senha: 'petcare123' },
    });
    const body = await res.json();

    expect(res.status()).toBe(200);
    expect(body.mensagem).toBe('Login realizado com sucesso');
    expect(body.usuario.usuario).toBe('admin');
    expect(body.usuario).not.toHaveProperty('senha');
  });

  test('CT-API-002 | Login com senha incorreta', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/auth/login`, {
      data: { usuario: 'admin', senha: 'senhaerrada' },
    });
    const body = await res.json();

    expect(res.status()).toBe(401);
    expect(body.mensagem).toBe('Usuário ou senha incorretos.');
  });

  test('CT-API-003 | Login com usuário incorreto', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/auth/login`, {
      data: { usuario: 'hacker', senha: 'petcare123' },
    });

    expect(res.status()).toBe(401);
  });

  test('CT-API-004 | Login sem body', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/auth/login`, { data: {} });
    const body = await res.json();

    expect(res.status()).toBe(400);
    expect(body.mensagem).toBe('Usuário e senha são obrigatórios.');
  });

  test('CT-API-005 | Login sem campo senha', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/auth/login`, {
      data: { usuario: 'admin' },
    });

    expect(res.status()).toBe(400);
  });

  test('CT-API-006 | Tempo de resposta inferior a 2 segundos', async ({ request }) => {
  const inicio = performance.now();

  const res = await request.post(`${BASE_URL}/auth/login`, {
    data: { usuario: 'admin', senha: 'petcare123' },
  });

  const tempo = performance.now() - inicio;

  expect(res.status()).toBe(200);
  expect(tempo).toBeLessThan(2000);
});
});
