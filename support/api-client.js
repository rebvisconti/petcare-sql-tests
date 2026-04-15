import { HORARIOS } from './data-factory.js'; 

export const BASE_URL = 'http://localhost:3002';

export function dataFutura(dias = 7) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

export async function criarAgendamento(request, dados = {}) {
  const defaults = {
    nomePet: 'Teste Pet',
    tutor: 'Tutor Teste',
    telefone: '912345678',
    servico: 'banho',
    porte: 'pequeno',
    data: dataFutura(7),
    horario: '10:00',
    observacoes: '',
  };

  return request.post(`${BASE_URL}/agendamentos`, {
    data: { ...defaults, ...dados },
  });
}

export async function createAgendamentoSafe(request, DB, dados = {}) {
  const data = dados.data || dataFutura(7);

  for (const horario of HORARIOS) {
    const ocupado = DB.buscarAgendamentoPorHorario(data, horario);

    if (!ocupado || ocupado.length === 0) {
      const payload = {
        nomePet: dados.nomePet || `Pet_${Date.now()}`,
        tutor: dados.tutor || `Tutor_${Date.now()}`,
        telefone: dados.telefone || '999999999',
        servico: dados.servico || 'banho',
        porte: dados.porte || 'medio',
        data,
        horario,
        observacoes: dados.observacoes || '',
      };

      const res = await criarAgendamento(request, payload);
      const body = await res.json();

      return { res, body, payload }; // ✅ BODY AGORA EXISTE
    }
  }

  // fallback
  const res = await criarAgendamento(request, {
    ...dados,
    data,
    horario: HORARIOS[0],
  });

  const body = await res.json();

  return { res, body };
}