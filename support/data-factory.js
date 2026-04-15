export const HORARIOS = [
  '08:00', '09:00', '10:00', '11:00',
  '14:00', '15:00', '16:00', '17:00'
];

let _offsetCounter = 100;

export function dataUnica(dataFuturaFn, baseOffset = 0) {
  _offsetCounter += 1;
  return dataFuturaFn(baseOffset + _offsetCounter);
}

export function gerarPet() {
  const id = Date.now() + Math.floor(Math.random() * 9999);

  return {
    nomePet:  `Pet_${id}`,
    tutor:    `Tutor_${id}`,
    telefone: '912345678',
    porte:    'medio',
  };
}

export function horarioSeguro() {
  return '10:00';
}