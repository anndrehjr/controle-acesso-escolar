# CLAUDE.md — Controle de Acesso Escolar

Este arquivo instrui o Claude (e qualquer IA de codificação) sobre a arquitetura,
infraestrutura e regras deste projeto. Leia antes de qualquer alteração.

---

## 🏫 Sobre o Projeto

Sistema de controle escolar da **EE Carlos Bernardes Staut** (Ribeirão dos Índios, SP).
Gerencia alunos, turmas, notas, disciplinas e usuários com controle de acesso por papel.

- **Framework:** Next.js (App Router)
- **Linguagem:** TypeScript
- **Banco de dados:** PostgreSQL (rodando em Docker na VPS)
- **Autenticação:** A migrar do Supabase Auth para solução própria
- **Deploy atual:** Vercel (em migração para VPS própria)
- **Deploy futuro:** VPS em Docker via Nginx Proxy Manager

---

## 🖥️ Infraestrutura

### VPS
- **IP:** 144.217.161.241
- **OS:** Debian 12 (Bookworm)
- **Usuário:** sombra (sudo sem senha)
- **SSH:** porta 2222, autenticação por chave ED25519
- **Firewall:** UFW ativo (portas 2222/tcp, 80/tcp, 443/tcp liberadas)

### Domínio
- **Principal:** andre-aguiar-jr.com.br
- **DNS:** Cloudflare (Proxied + DDoS protection)
- **Sistema escolar:** escola.andre-aguiar-jr.com.br
- **Portfólio:** andre-aguiar-jr.com.br

### Docker (containers ativos)
| Container | Imagem | Porta | Função |
|---|---|---|---|
| nginx-proxy-app-1 | jc21/nginx-proxy-manager | 80, 443, 81 | Proxy reverso |
| postgres-postgres-1 | postgres:16 | 5432 | Banco de dados |

### Arquivos Docker
```
/home/sombra/docker/
├── nginx-proxy/
│   └── docker-compose.yml
└── postgres/
    └── docker-compose.yml
```

---

## 🗄️ Banco de Dados

### Conexão
```
Host:     144.217.161.241
Porta:    5432
Banco:    escola
Usuário:  admin
Senha:    [ver .env.local — nunca commitar]
```

### Variáveis de ambiente (.env.local)
```env
DATABASE_URL=postgresql://admin:SENHA@144.217.161.241:5432/escola
NEXT_PUBLIC_APP_URL=https://escola.andre-aguiar-jr.com.br
```

> ⚠️ NUNCA commitar o .env.local. Está no .gitignore.

### Tabelas (schema public)
```
escolas            -- escola cadastrada
usuarios           -- usuários (roles: SUPER_ADMIN, ADMIN_ESCOLA, PROFESSOR)
turmas             -- turmas da escola
disciplinas        -- disciplinas por escola e etapa
alunos             -- alunos vinculados a turma e escola
notas              -- notas por aluno, disciplina, bimestre
matriz_disciplinas -- relação etapa + disciplina por escola
logs_acesso        -- auditoria de ações
```

### Dados atuais (1º Bimestre 2026)
- 1 escola: EE Carlos Bernardes Staut
- 2 usuários (SUPER_ADMIN + ADMIN_ESCOLA)
- 7 turmas (6º ao 9º EF + 1ª a 3ª EM)
- 26 disciplinas
- 127 alunos
- 52 entradas na matriz curricular
- 1526 notas lançadas

### Acessar banco direto na VPS
```bash
sudo docker exec -it postgres-postgres-1 psql -U admin -d escola
```

---

## 🔐 Controle de Acesso

### Roles
| Role | Acesso |
|---|---|
| SUPER_ADMIN | Tudo — todas as escolas |
| ADMIN_ESCOLA | Apenas sua escola |
| PROFESSOR | Apenas suas turmas/disciplinas |

### Regra obrigatória
Toda query deve filtrar por `escola_id`:
```sql
SELECT * FROM alunos WHERE escola_id = 'uuid-da-escola' AND ativo = true;
```

---

## 📁 Estrutura do Projeto

```
/
├── src/
│   ├── app/          -- páginas Next.js (App Router)
│   ├── components/   -- componentes React
│   ├── lib/          -- utilitários, conexão DB
│   └── types/        -- tipos TypeScript
├── public/
├── scripts/
├── CLAUDE.md         -- este arquivo
├── AGENTS.md
├── SISTEMA.md
└── .env.local        -- NÃO commitar
```

---

## 🚀 Como rodar localmente

```bash
npm install
cp .env.example .env.local
# Editar .env.local com DATABASE_URL
npm run dev
```

---

## ⚠️ Regras para o Claude

1. **Nunca expor credenciais** — ficam no .env.local
2. **Sempre filtrar por escola_id** — sistema multi-escola
3. **TypeScript estrito** — sem `any` sem justificativa
4. **Banco é PostgreSQL puro** — sem sintaxe específica do Supabase
5. **Não usar Supabase client** — conexão via `pg` ou `postgres.js` direta
6. **SQL puro** — sem ORM pesado
7. **Segurança primeiro** — validar role antes de qualquer operação

---

## 🔄 Status da Migração

| Item | Status |
|---|---|
| Banco de dados | ✅ Migrado para VPS |
| Dados históricos | ✅ Importados (1741 registros) |
| Código fonte | 🔄 Em migração (ainda na Vercel) |
| Autenticação | 🔄 Migrar do Supabase Auth |
| Deploy VPS | ⏳ Próximo passo |
| Domínio | ✅ Configurado no Cloudflare |

---

*Atualizado em: Junho 2026*
