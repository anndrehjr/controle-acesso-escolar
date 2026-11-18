# Plano de Evolução do escolaDB

**Conclusão principal:** o sistema já possui dados suficientes para histórico de notas, evolução, recuperação, relatórios por turma, disciplina e aluno, indicadores objetivos e auditoria. O sistema atualmente não registra os dados necessários para frequência; essa parte exige um módulo próprio.

## 1. Situação atual

O escolaDB usa Next.js, React, TypeScript, PostgreSQL e Docker. O backend está no App Router, usa SQL parametrizado e cookies `httpOnly`. O acesso é definido por papéis e capacidades, com filtros de escola, turma e disciplina no servidor.

Módulos verificados:

- escolas e dashboard;
- alunos e histórico individual;
- turmas, disciplinas e matriz;
- matrícula anual e transferências;
- usuários, papéis e sessões;
- vínculos de professores e diário;
- notas em lote;
- avaliações e recuperação;
- analytics e indicadores de risco;
- auditoria;
- relatórios e exportações.

## 2. Problemas encontrados

| Achado | Prioridade | Complexidade | Impacto | Situação |
|---|---|---|---|---|
| Sessões antigas continuavam válidas após redefinição de senha | Alta | Média | Alto | Corrigido |
| Usuário inativo não era revalidado em cada requisição | Alta | Média | Alto | Corrigido |
| Auditoria e notas podiam divergir | Alta | Média | Alto | Corrigido |
| Não havia matrícula anual | Alta | Complexa | Alto | Corrigido |
| Recuperação não tinha nota anterior/final estruturada | Alta | Complexa | Alto | Corrigido |
| Logs não expunham antes/depois | Alta | Média | Alto | Corrigido |
| Uma disciplina ativa duplicada estava vazia | Média | Fácil | Médio | Preservada como inativa |
| Dois transferidos estavam ativos no cadastro legado | Média | Fácil | Médio | Sincronizados |
| Lint geral tinha três erros e dois avisos | Média | Fácil | Médio | Corrigido |
| Não havia relatórios oficiais exportáveis | Média | Complexa | Alto | Implementado |
| Frequência não possui dados nem modelo | Média | Complexa | Alto | Recomendação futura |
| Dependências possuem alertas de segurança | Alta | Média | Alto | Rodada separada |
| `middleware.ts` está depreciado | Média | Fácil | Médio | Rodada separada |

## 3. Melhorias rápidas concluídas

- filtros de ano e bimestre corrigidos;
- autorização centralizada;
- índices e restrições de integridade;
- importação com simulação e transação;
- auditoria com valor anterior e novo;
- revogação global por versão de sessão;
- lint sem erros nem avisos;
- CSV seguro e impressão/PDF;
- estados de transferência sincronizados;
- nomes duplicados de disciplinas bloqueados entre registros ativos.

## 4. Novas funcionalidades entregues

### Diário e vínculo docente

Usam `professor_vinculos`, `matriculas`, `matriz_disciplinas` e `notas`. O professor só visualiza e lança no escopo atribuído.

### Avaliações e recuperação

`avaliacoes` registra instrumento, peso e nota máxima. `resultados_avaliacoes` guarda o resultado por matrícula. `recuperacoes` guarda nota anterior, recuperação, critério e nota final.

### Relatórios

Uma tela com filtros concentra seis formatos, evitando aumentar desnecessariamente o menu. Os mesmos parâmetros controlam a tela, o CSV e a impressão.

## 5. Relatórios recomendados e estado

| Relatório | Dados | Estado |
|---|---|---|
| Por turma | Notas, alunos, matrículas e turmas | Entregue |
| Por disciplina | Notas, disciplinas e turmas | Entregue |
| Por aluno | Notas, matrícula e recuperação | Entregue |
| Recuperação | Nota anterior, recuperação e final | Entregue |
| Evolução | Notas por bimestre | Entregue |
| Risco objetivo | Médias, recorrência e queda | Entregue |
| Frequência e rendimento | Frequência e notas | Sem dados disponíveis |

## 6. Melhorias no banco

As migrações adicionaram:

- restrições de escala, período, estado e unicidade;
- matrícula anual e vínculo obrigatório da nota;
- avaliações, resultados e recuperações;
- origem e atualização da nota;
- versão global de sessão;
- gatilhos de validação e sincronização;
- índices específicos para relatórios;
- proteção de nome normalizado de disciplina ativa.

Não houve remoção de tabela ou coluna. O cadastro duplicado foi mantido inativo para rastreabilidade.

## 7. Melhorias de segurança

- JWT assinado, expirável e em cookie `httpOnly`;
- versão de sessão consultada no banco;
- revogação por logout, senha e desativação;
- limite de login e redefinição;
- SQL parametrizado;
- proteção de escopo no backend;
- auditoria de operações críticas;
- ocultação de senha, token, segredo e hash em logs;
- neutralização de fórmulas em CSV;
- senha obrigatória no primeiro acesso após reset.

Recomendação seguinte: atualizar dependências em uma imagem isolada, executar regressão e migrar `middleware.ts` para `proxy.ts`.

## 8. Melhorias de usabilidade

O fluxo do professor foi concentrado no diário e em avaliações. Selecionar escola, turma, disciplina e período carrega a lista anual de matrículas. O lançamento em lote reduz repetição, e os relatórios usam filtros na mesma tela.

A interface preserva menu, cabeçalho, tokens de cor, tipografia, botões, tabelas e temas existentes.

## 9. Dados armazenados que agora são aproveitados

O sistema armazena e exibe:

- `created_at` e `updated_at`;
- `origem_calculo`;
- nota anterior, recuperação e final;
- usuário, tela e registro alterado;
- valores anteriores e novos;
- estado anual da matrícula;
- peso e nota máxima das avaliações;
- evolução entre bimestres.

Para notas anteriores ao início da auditoria detalhada, a recuperação depende dos backups históricos; alterações novas ficam disponíveis em `logs_acesso`.

## 10. Índice composto de notas

A avaliação técnica resultou em um índice experimental de 0 a 100:

- 50%: média das notas convertida para 0–100;
- 30%: percentual de notas maiores ou iguais a 5;
- 20%: evolução média entre primeiro e último bimestre comparável.

O índice mostra tamanho da amostra e quantidade de pares comparáveis. Ele não substitui média, regra de aprovação, conselho de classe ou análise pedagógica. A recomendação é observá-lo por um ciclo letivo completo antes de decidir se tem utilidade institucional.

## 11. Performance

As consultas de relatório são limitadas, parametrizadas e usam índices por escola, ano, turma, disciplina, bimestre e aluno. Carregamentos independentes usam concorrência. O conjunto atual é pequeno, com 3.105 notas, e não apresentou evidência de gargalo que justifique otimização adicional.

## 12. Fases futuras

### Fase 1 — essencial

- atualizar dependências com alertas de segurança;
- migrar o middleware para o padrão atual do Next.js;
- automatizar retenção e monitoramento de backups externos.

### Fase 2 — importante

- modelar frequência, justificativas e calendário letivo;
- criar relatório de presença após existirem dados confiáveis;
- cadastrar professores e vínculos reais.

### Fase 3 — evolução

- observar o índice composto durante um ano;
- avaliar exportação XLSX nativa se CSV não atender à operação;
- definir assinatura visual ou numeração institucional de documentos, caso a escola exija.

## 13. Resultado do ciclo 1–17

As prioridades foram executadas sem reconstruir o sistema e sem mudança de identidade. O banco ganhou integridade, histórico e matrícula anual; as APIs passaram a aplicar escopo e transações; o professor ganhou diário e avaliações; a gestão ganhou auditoria, relatórios, exportação, revogação de sessões, documentação e backups verificáveis.
