# Controle de Acesso Escolar — Documentação do Sistema

**Escola:** EE Carlos Bernardes Staut — Ribeirão dos Índios, SP  
**Ano letivo:** 2026

---

## 1. Visão Geral

Dashboard pedagógico para acompanhamento de desempenho escolar por bimestre, turma e disciplina. Permite visualizar médias, alunos críticos, comparativos entre bimestres e evolução ao longo do ano.

---

## 2. Stack tecnológico

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router, Server Components) |
| Banco de dados | Supabase (PostgreSQL) |
| ORM/cliente | `@supabase/supabase-js` |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| Gráficos | Recharts v3 |
| Ícones | Lucide React |

---

## 3. Variáveis de ambiente

Arquivo `.env.local` na raiz do projeto:

```
NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave-anon>
SUPABASE_SERVICE_ROLE_KEY=<chave-service-role>   # apenas para o script de importação
NEXT_PUBLIC_ESCOLA_ID=6b50af3f-8023-497f-bccb-32ceec3d0252
```

---

## 4. Banco de dados

### 4.1 Tabelas e campos principais

#### `escolas`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | PK |
| `nome` | text | Nome da escola |
| `cidade` | text | |
| `estado` | text | |
| `ano_letivo` | integer | Ex: 2026 |
| `bimestre_atual` | integer | 1, 2, 3 ou 4 — define o bimestre padrão do dashboard |

#### `turmas`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | PK |
| `escola_id` | uuid | FK → escolas |
| `nome` | text | Ex: "6º Ano A", "1ª Série A" |
| `etapa` | text | "EF" ou "EM" |
| `ano_serie` | integer | Número do ano/série |
| `periodo` | text | Ex: "Manhã" |
| `total_ativos` | integer | Qtd de alunos ativos |
| `grupo_pedagogico` | text | Código do grupo (ver seção 5) |
| `ativo` | boolean | |

#### `alunos`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | PK |
| `escola_id` | uuid | FK → escolas |
| `turma_id` | uuid | FK → turmas |
| `nome` | text | Nome completo em maiúsculas |
| `numero_chamada` | integer | Número na chamada |
| `status` | text | "ATIVO" ou "TRANSFERIDO" |
| `em_atencao` | boolean | Marcado manualmente no school-data |
| `ativo` | boolean | |

#### `disciplinas`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | PK |
| `escola_id` | uuid | FK → escolas |
| `nome` | text | Ex: "Matemática" |
| `codigo` | text | Código abreviado |
| `etapa` | text | "AMBOS", "EF" ou "EM" |
| `ativo` | boolean | |

#### `matriz_disciplinas`
Liga grupos pedagógicos às disciplinas. Define quais disciplinas cada grupo de turmas tem.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | PK |
| `escola_id` | uuid | FK → escolas |
| `etapa` | text | Código do grupo pedagógico (ex: "FUND_69") |
| `codigo` | text | Código da disciplina na turma (ex: "C01", "C09") |
| `disciplina_id` | uuid | FK → disciplinas |
| `ativo` | boolean | |

#### `notas`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | PK |
| `escola_id` | uuid | FK → escolas |
| `turma_id` | uuid | FK → turmas |
| `aluno_id` | uuid | FK → alunos |
| `disciplina_id` | uuid | FK → disciplinas |
| `ano_letivo` | integer | Ex: 2026 |
| `bimestre` | integer | 1, 2, 3 ou 4 |
| `nota` | numeric | Valor da nota |
| `status` | text | "NORMAL" |

#### `usuarios`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | PK |
| `auth_id` | uuid | ID do Supabase Auth |
| `role` | text | "SUPER_ADMIN" ou "ADMIN_ESCOLA" |
| `escola_id` | uuid | FK → escolas |
| `ativo` | boolean | |

---

## 5. Grupos pedagógicos

O campo `grupo_pedagogico` das turmas define qual currículo (matriz) ela segue. É atribuído automaticamente pelo script de importação com base no ano/série.

| Código | Turmas | Critério |
|--------|--------|---------|
| `FUND_69` | 6º Ano, 9º Ano | EF e ano_serie em {6, 9} |
| `FUND_78` | 7º Ano, 8º Ano | EF e ano_serie em {7, 8} |
| `MEDIO_12` | 1ª Série, 2ª Série | EM e ano_serie em {1, 2} |
| `MEDIO_3` | 3ª Série | EM e ano_serie = 3 |

A `matriz_disciplinas` usa o mesmo código no campo `etapa` para ligar disciplinas a grupos. O heatmap usa essa ligação para montar as colunas corretas por turma.

---

## 6. Estrutura de código

```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx                   # Página principal — Server Component
│   │   └── aluno/[id]/page.tsx        # Detalhe do aluno — Server Component
│   └── api/dashboard/
│       ├── heatmap/route.ts           # GET: grade matrix por turma/bimestre
│       ├── comparativo/route.ts       # GET: comparação B1 vs B2 de uma turma
│       ├── tendencia/route.ts         # GET: médias dos 4 bimestres
│       ├── kpis/route.ts              # GET: KPIs gerais
│       ├── ranking/route.ts           # GET: ranking de turmas
│       ├── distribuicao/route.ts      # GET: distribuição por nível
│       └── disciplinas-criticas/route.ts
├── components/escola-dashboard/
│   ├── HeaderEscola.tsx               # Header com seletores de bimestre e turma
│   ├── BimestreSeletor.tsx            # Botões 1º 2º 3º 4º — atualiza ?bimestre=N
│   ├── TurmaSeletor.tsx               # Dropdown de turma — atualiza ?turma=id
│   ├── TabsDashboard.tsx              # Tabs: Visão Geral | Turmas | Disciplinas | Alertas | Heatmap | Comparativo
│   ├── KPICardsReal.tsx               # Cards de KPIs (média, críticos, adequados...)
│   ├── GraficosVisaoGeral.tsx         # Gráficos de distribuição por nível
│   ├── TendenciaBimestres.tsx         # Gráfico de linha B1→B4 (Recharts)
│   ├── ResumoPedagogico.tsx           # Resumo textual (atenção, transferidos, notas)
│   ├── ListaTurmas.tsx                # Lista de turmas no modo "todas"
│   ├── RankingTurmas.tsx              # Ranking de turmas por média
│   ├── DisciplinasCriticas.tsx        # Barras de % crítico por disciplina (Fundamental | Médio | Geral)
│   ├── HeatmapPedagogico.tsx          # Tabela aluno × disciplina colorida por nota
│   └── ComparativoBimestres.tsx       # KPIs + disciplinas + alunos: B1 vs B2
└── lib/
    ├── analytics/
    │   ├── types.ts                   # Tipos: Aluno, Nota, Turma, Disciplina, MatrizDisciplina
    │   ├── buildSchoolDashboard.ts    # Função principal de analytics
    │   ├── buildDistribuicaoPedagogica.ts
    │   └── buildHeatmapPedagogico.ts
    ├── school-data.ts                 # Dados de turmas e notas (fonte: atas de conselho)
    └── supabase/server.ts             # Cliente Supabase para Server Components

scripts/
└── import-school-data.ts              # Script de importação para o Supabase
```

---

## 7. Fluxo de dados

```
Ata de Conselho (papel)
        ↓
  school-data.ts        ← digitação manual das notas
        ↓
  import-school-data.ts ← script de importação (ts-node)
        ↓
    Supabase DB         ← tabelas: turmas, alunos, disciplinas, matriz_disciplinas, notas
        ↓
  dashboard/page.tsx    ← Server Component: busca dados + roda analytics
        ↓
  buildSchoolDashboard  ← calcula médias, níveis, rankings, disciplinas críticas
        ↓
  TabsDashboard         ← Client Component: gerencia qual aba está ativa
        ↓
  Componentes de UI     ← KPIs, Gráficos, Heatmap, Comparativo, Tendência
```

Para o Heatmap, Comparativo e Tendência, os componentes são Client Components que buscam dados via API Routes do próprio Next.js.

### Gerenciamento de estado

O sistema usa **estado por URL** — não há Redux, Context API ou zustand. Toda seleção de bimestre e turma atualiza a URL:

- `?bimestre=2` — filtra o bimestre exibido
- `?turma=<uuid>` — filtra por turma específica
- `?tab=comparativo` — abre a aba de comparativo diretamente

O `dashboard/page.tsx` lê esses parâmetros via `searchParams` e faz as queries correspondentes no servidor.

---

## 8. Pipeline de analytics (buildSchoolDashboard)

A função `buildSchoolDashboard` recebe alunos, notas, turmas, disciplinas + bimestre e anoLetivo, e retorna:

- `alunosAtivos` / `alunosTransferidos`
- `notasValidas` (filtradas por bimestre, ano, aluno ativo)
- `mediaGeral`
- `mediasPorAluno` — array com { aluno, media, nivel }
- `alunosCriticos` (média < 5)
- `alunosAdequadosOuAvancados` (média ≥ 7)
- `percentualAdequado`
- `rankingTurmas` — ordenado por média desc
- `disciplinasCriticasGeral` / `Fundamental` / `Medio` — % de notas < 5 por disciplina
- `melhorTurma` / `turmaAlerta`
- `melhorAlunoDaTurma` / `pioresAlunosDaTurma`

**Níveis pedagógicos:**
| Faixa | Nível |
|-------|-------|
| < 5 | Abaixo do Básico (crítico) |
| 5–6 | Básico |
| 7–8 | Adequado |
| ≥ 9 | Avançado |

---

## 9. Como importar dados de um novo bimestre

### 9.1 Passo a passo

**Passo 1 — Criar um novo arquivo de dados do bimestre**

Crie `src/lib/school-data-b2.ts` (ou atualize `school-data.ts` com os dados do B2).
A estrutura é idêntica ao B1: cada turma tem `students` com `grades` usando os mesmos códigos de disciplina (C01, C02...).

```typescript
// src/lib/school-data-b2.ts
export const ALL_CLASSROOMS_B2: ClassRoom[] = [
  {
    id: "6A",
    name: "6º Ano A",
    level: "EF",
    totalActive: 18,
    subjects: [...], // mesmos do B1
    students: [
      { id: 1, name: "ALICIA MARIA GEA SILVA", grades: { C01: 9, C02: 8, ... }, isAttention: false },
      // ... todos os alunos com as notas do 2º bimestre
    ],
  },
  // ... demais turmas
];
```

**Passo 2 — Atualizar o script de importação**

Abra `scripts/import-school-data.ts` e altere:

```typescript
// Linha 5: trocar o import
import { ALL_CLASSROOMS_B2 as ALL_CLASSROOMS } from "../src/lib/school-data-b2";
//                   ↑ ou o nome que você escolheu

// Linha 21: trocar o bimestre
const BIMESTRE = 2;  // era 1
```

**Passo 3 — Rodar o script**

```bash
npx ts-node --project tsconfig.json scripts/import-school-data.ts
```

**Passo 4 — Atualizar o bimestre atual no Supabase**

No Supabase Studio, rode:

```sql
UPDATE escolas
SET bimestre_atual = 2
WHERE id = '6b50af3f-8023-497f-bccb-32ceec3d0252';
```

Isso faz o dashboard abrir no B2 por padrão.

---

### 9.2 ⚠️ ATENÇÃO CRÍTICA — Bug no script de limpeza

O script atual apaga **todas** as notas da escola antes de importar:

```typescript
// LINHA ATUAL (ERRADA para B2+):
await supabase.from("notas").delete().eq("escola_id", ESCOLA_ID);
// ↑ ISSO APAGA OS DADOS DO B1 TAMBÉM!
```

**Corrija isso antes de rodar para o B2.** A linha 100 do script deve ser:

```typescript
// CORRETO: apaga apenas as notas do bimestre sendo importado
await supabase.from("notas").delete()
  .eq("escola_id", ESCOLA_ID)
  .eq("bimestre", BIMESTRE);   // ← adicione esta linha
```

A `matriz_disciplinas` pode continuar sendo limpa e recriada normalmente (não depende do bimestre).

---

### 9.3 O que o script faz (em ordem)

1. **Limpa notas** do bimestre atual (após a correção acima)
2. **Limpa e reconstrói `matriz_disciplinas`** — relaciona grupos pedagógicos → disciplinas
3. **Busca disciplinas** existentes no banco; cria as que faltam
4. **Upsert de turmas** — atualiza `total_ativos`, `grupo_pedagogico` etc.
5. **Upsert de alunos** — cria se não existe; atualiza nome, status, `em_atencao`
6. **Insere notas** em lote por aluno (pula alunos transferidos)

Alunos com todas as notas `"TR"` são marcados como `TRANSFERIDO` e não recebem notas.

---

## 10. Páginas e rotas

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Dashboard principal da escola |
| `/dashboard?bimestre=2` | Dashboard filtrado para o 2º bimestre |
| `/dashboard?turma=<uuid>` | Dashboard filtrado por uma turma |
| `/dashboard?turma=<uuid>&tab=comparativo` | Abre direto na aba Comparativo |
| `/dashboard/aluno/<uuid>` | Detalhe do aluno com notas por disciplina e bimestre |

---

## 11. APIs internas

Todas retornam JSON e usam `NEXT_PUBLIC_ESCOLA_ID` do ambiente.

| Endpoint | Parâmetros | Retorna |
|----------|-----------|---------|
| `GET /api/dashboard/heatmap` | `bimestre`, `turma?` | Tabela aluno × disciplina por turma |
| `GET /api/dashboard/comparativo` | `turma` (obrigatório) | KPIs + disciplinas + medias por aluno para B1 e B2 |
| `GET /api/dashboard/tendencia` | `turma?` | Médias dos 4 bimestres (pontos da linha do tempo) |
| `GET /api/dashboard/kpis` | `escolaId` | KPIs gerais da escola |
| `GET /api/dashboard/ranking` | — | Ranking de turmas |
| `GET /api/dashboard/distribuicao` | — | Distribuição por nível pedagógico |
| `GET /api/dashboard/disciplinas-criticas` | — | Disciplinas com maior % de notas críticas |

---

## 12. Funcionalidades do dashboard

### Aba Visão Geral
- KPI cards: total de alunos, média geral, % críticos, % adequados, melhor turma, turma alerta, disciplina mais crítica
- Gráficos de distribuição por nível (por turma e geral)
- **Gráfico de tendência** (B1→B4): evolução da média com linha de referência em 5,0 e 7,0
- Resumo pedagógico e lista de turmas

### Aba Turmas
- Ranking de turmas por média, com botão "B1 × B2" em cada turma para abrir o comparativo

### Aba Disciplinas
- Ensino Fundamental (topo esquerdo)
- Ensino Médio (topo direito)
- Geral da escola (embaixo, largura total)

### Aba Alertas
- Lista de alunos com média < 5,0, ordenados do mais crítico ao menos crítico

### Aba Heatmap
- Tabela aluno × disciplina colorida por faixa de nota
- Dropdown para selecionar a turma
- Toggle para ocultar/mostrar nomes
- Clique no aluno abre a página de detalhe

### Aba Comparativo (aparece apenas quando uma turma está selecionada)
- KPI cards: B1 → B2 (média, críticos, adequados) com badge de variação
- Barras duplas por disciplina (B1 cinza + B2 colorido) com delta em pp
- Lista "Mais evoluíram" e "Mais regrediram" (top 5 alunos)

### Página do aluno (`/dashboard/aluno/:id`)
- Tabela de notas por disciplina × bimestre (todos os 4)
- Média por disciplina e média geral
- Nível pedagógico (Crítico / Básico / Adequado / Avançado)
- Badge de atenção se `em_atencao = true`
