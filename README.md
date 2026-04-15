# 🧪 PetCare SQL Tests
![Playwright](https://img.shields.io/badge/Playwright-E2E%20Testing-green?logo=playwright&style=for-the-badge)
![Testing](https://img.shields.io/badge/Tests-30%20Total-success?style=for-the-badge)
![Coverage](https://img.shields.io/badge/Type-API%20%7C%20SQL%20%7C%20E2E-blue?style=for-the-badge)

Suíte de testes **Playwright** para o projeto [PetCare SQL QA](https://github.com/rebvisconti/petcare-sql-qa) — cobrindo API REST e validação direta no banco de dados SQLite.

---

## ✨ Diferenciais deste projeto

- **Testes de API** — validam todos os endpoints REST
- **Testes SQL** — cruzam API + banco de dados SQLite diretamente
- **Testes E2E** — fluxos completos que simulam uso real
- **Organização por projeto** — API, SQL e E2E separados e independentes

---

## ⚠️ Pré-condição obrigatória

Esta suíte depende do projeto **PetCare SQL QA** rodando localmente.

Antes de executar os testes:

```bash
# Em outro terminal
cd petcare-sql-qa
npm start
```

## 🛠️ Pré-requisitos

- Node.js instalado
- **PetCare SQL QA rodando** em `http://localhost:3002`

---

## 🚀 Como rodar

**1. Instale as dependências:**
```bash
npm install
npx playwright install chromium
```

**2. Certifique-se que o PetCare SQL QA está rodando:**
```bash
# Em outro terminal, na pasta petcare-sql-qa:
npm start
```

Para garantir testes confiáveis e evitar dados residuais (“lixo” no banco), recomenda-se resetar o banco antes da execução:

```bash
npm run reset-db
npm start
```

**3. Execute os testes:**

```bash
# Todos os testes
npm test

# Só testes de API
npm run test:api

# Só testes SQL (API + banco)
npm run test:sql

# Só testes E2E
npm run test:e2e

# Ver relatório HTML
npm run test:report
```

---

## 📁 Estrutura

```
petcare-sql-tests/
├── 📁support/
│   ├── api-client.js                   
│   └── db-helper.js  
│   └── data-factory.js
│   └── index.js        
├── 📁tests/
│   ├── 📁api/
│   │   ├── auth.spec.js                
│   │   ├── agendamentos.spec.js        
│   │   └── pets-e-estatisticas.spec.js 
│   ├── 📁sql/
│   │   └── validacao-sql.spec.js       
│   └── 📁e2e/
│       └── fluxos-completos.spec.js               
├── playwright.config.js
├── package.json
└── README.md

```

---

## 📊 Cobertura de testes

| Suite | Testes | O que cobre |
|-------|--------|-------------|
| API   | 16     | Login, CRUD agendamentos, pets, estatísticas |
| SQL   | 10     | Persistência, contadores, integridade referencial |
| E2E   | 4      | Ciclo de vida completo, consistência API + banco |
| **Total** | **30** | |

---

## 🎯 Destaque: Testes SQL

Os testes em `tests/sql/` são o **diferencial deste portfólio** — eles validam não só a resposta da API, mas confirmam diretamente no banco de dados SQLite que os dados foram persistidos corretamente.

### Exemplo — CT-SQL-001

```javascript
test('CT-SQL-001 | Create appointment and validate in DB', async ({ request }) => {

  // 1. Gera dados dinâmicos (pet + data futura)
  const pet = gerarPet();
  const data = dataUnica(() => dataFutura(30));

  // 2. Cria agendamento via API (com proteção contra conflitos)
  const { res, body } = await createAgendamentoSafe(request, DB, {
    ...pet,
    data
  });

  // 3. Valida resposta da API
  expect(res.status()).toBe(201);
  expect(body.agendamento).toBeDefined();

  const id = body.agendamento.id;

  // 4. Valida DIRETAMENTE NO BANCO DE DADOS
  const noBanco = DB.buscarAgendamentoPorId(id);
  expect(noBanco).not.toBeNull();

  // 5. Garante consistência dos dados persistidos
  expect(noBanco.nomePet).toBeDefined();
  expect(noBanco.tutor).toBeDefined();
});
```
---

## 🤝 Contribuições

Sinta-se à vontade para enviar sugestões e melhorias via pull requests.
