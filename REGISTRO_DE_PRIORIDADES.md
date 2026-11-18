# Registro de Prioridades do escolaDB

**Rodadas concluídas:** prioridades 1 a 17  
**Inicio:** 13 de setembro de 2026, horario de Brasilia  
**Última implantação:** 14 de setembro de 2026, 15:19:38 UTC  
**Ambiente:** VPS de producao  
**Estado:** concluida e verificada

## Estados usados

- **PENDENTE:** ainda nao iniciada.
- **EM EXECUCAO:** implementacao parcial ou documentacao em andamento.
- **CONCLUIDA:** implantada e verificada na VPS.

## Regra de manutenção do registro

- Ao concluir qualquer prioridade, atualizar este documento na mesma rodada.
- Registrar estado, resumo do que mudou, arquivos, banco, testes, implantação e backup.
- Sincronizar a versão atualizada com a VPS depois da verificação em produção.

## Backlog

| Ordem | Prioridade | Estado | Resumo |
|---:|---|---|---|
| 1 | Corrigir autorizacao de analytics e pagina individual do aluno | CONCLUIDA | Analytics resolve a escola permitida e limita turmas, alunos e notas ao escopo do usuario. A pagina do aluno valida escola e turma antes de carregar dados. A API de tendencia tambem respeita as turmas visiveis do professor. |
| 2 | Corrigir filtro de ano e nome do indicador de recuperacao | CONCLUIDA | Notas e distribuicao filtram ano e bimestre antes dos calculos. Parametros invalidos sao tratados. O indicador agora se chama variacao de notas abaixo da media e informa que a medida agregada nao representa recuperacao individual. |
| 3 | Alinhar capacidades, menus e guardas de usuarios e logs | CONCLUIDA | Guardas derivam os papeis da matriz central de capacidades. Dev Master e Super Admin acessam logs; Dev Master, Super Admin e Direcao/Coordenacao acessam usuarios, conforme menus e APIs. |
| 4 | Adicionar restricoes de integridade no PostgreSQL | CONCLUIDA | Migração transacional adicionou 11 restrições CHECK, obrigatoriedade de campos críticos e 6 índices únicos. Corrigido o valor legado AMBUS para AMBOS. As 3.105 notas foram preservadas, sem valores inválidos ou duplicidades. |
| 5 | Substituir importacao por fluxo validado e transacional | CONCLUIDA | Importador destrutivo substituído por simulação padrão e upserts em transação única. Valida fonte, zeros, TR, matriz, escola, ano e bimestre; exige operador, backup e confirmação para aplicar; registra o lote em logs_acesso. |
| 6 | Tornar gravacao de notas e auditoria atomicas | CONCLUIDA | A API de notas valida o lote inteiro e grava notas e auditoria na mesma transação. Qualquer falha cancela o lote completo, evitando gravações parciais e logs incompletos. |
| 7 | Criar vinculos de professor e diario de classe | CONCLUIDA | Criadas API e tela para vínculos de professor por escola, turma e disciplina, com validação de escopo e auditoria. O diário lista apenas turmas e disciplinas autorizadas e usa as matrículas anuais. |
| 8 | Modelar matricula anual antes de 2027 | CONCLUIDA | Criada a tabela de matrículas por ano letivo, com situação, datas, número de chamada, integridade e índices. As 131 matrículas de 2026 foram geradas e as 3.105 notas foram vinculadas sem perda. |
| 9 | Modelar avaliacoes e recuperacao real | CONCLUIDA | Criadas avaliações por turma, disciplina, ano e bimestre, resultados por matrícula, cálculo de média ponderada e recuperação pelos critérios maior nota, média aritmética ou substituição. O lançamento recalcula a nota oficial com auditoria atômica. |
| 10 | Expor valores anteriores e novos na auditoria | CONCLUIDA | A API e a tela de logs agora exibem tabela, registro e valores anteriores e novos. Dados sensíveis são ocultados recursivamente, e as operações de avaliação, recuperação e notas registram alterações na mesma transação. |
| 11 | Revogar sessoes apos redefinicao ou desativacao | CONCLUIDA | Criada versão global de sessão validada em toda requisição. Redefinição de senha, troca da própria senha e desativação incrementam a versão; usuários inativos e tokens anteriores são rejeitados. |
| 12 | Copiar backups para fora da VPS e testar restauracao | CONCLUIDA | Dump restaurado em bancos temporários, migração aplicada duas vezes e testes funcionais revertidos. O pacote final foi copiado para armazenamento local fora da VPS e teve os checksums validados no destino. |
| 13 | Corrigir lint e ampliar testes de autorizacao | CONCLUIDA | Corrigidos três erros e dois avisos gerais de lint. A suíte passou a cobrir versão de sessão, relatórios, CSV, índice composto e a capacidade de relatórios: 61 testes aprovados. |
| 14 | Criar relatorios e exportacoes oficiais | CONCLUIDA | Criada uma tela única com relatórios por turma, disciplina, aluno, recuperação, evolução e risco objetivo. Filtros são aplicados no servidor; CSV seguro e impressão/PDF respeitam o mesmo recorte. |
| 15 | Atualizar documentacao operacional | CONCLUIDA | Criados a documentação operacional completa e o Plano de Evolução do escolaDB, com arquitetura, telas, APIs, banco, segurança, relatórios, implantação, restauração, limitações e próximos passos. |
| 16 | Medir e avaliar indice composto de notas | CONCLUIDA | Índice experimental implementado com 50% média normalizada, 30% percentual de notas ≥ 5 e 20% evolução. Exibe amostra e pares comparáveis e não decide aprovação nem diagnóstico. |
| 17 | Revisar disciplina duplicada e estados de transferencia | CONCLUIDA | A disciplina C22, vazia e sem referências, foi preservada como inativa; C05 permanece em uso. Índice impede duplicidade ativa por nome normalizado. A matrícula anual agora sincroniza o estado legado do aluno; oito transferidos estão inativos. |

## Arquivos alterados nas prioridades 1 a 3

- `package.json`
- `src/types/roles.ts`
- `src/lib/permissions.test.ts`
- `src/app/dashboard/usuarios/page.tsx`
- `src/app/dashboard/logs/page.tsx`
- `src/app/analytics/page.tsx`
- `src/components/analytics/RecomposicaoCard.tsx`
- `src/app/dashboard/aluno/[id]/page.tsx`
- `src/components/escola-dashboard/DashboardConteudo.tsx`
- `src/components/escola-dashboard/HeaderEscola.tsx`
- `src/app/api/dashboard/distribuicao/route.ts`
- `src/app/api/dashboard/tendencia/route.ts`

## Atualização das prioridades 4 e 5

**Arquivos alterados:**

- `.dockerignore`
- `package.json`
- `scripts/import-school-data.ts`
- `scripts/import-school-data-lib.ts`
- `scripts/import-school-data.test.ts`
- `sql/006_integridade_dados.sql`

**Banco envolvido:** `notas`, `alunos`, `turmas`, `disciplinas`, `matriz_disciplinas`, `usuarios`, `professor_vinculos` e `logs_acesso`.

**Validação e implantação:**

- Migração validada duas vezes sobre restauração isolada do banco.
- Build Docker e TypeScript aprovados.
- 39 de 39 testes aprovados na imagem final.
- Simulação do 1º bimestre executada sem escrita.
- Fonte incompleta do 2º bimestre bloqueada por conter zeros provisórios.
- Total antes e depois: 3.105 notas.
- Contêiner `escola-app` em execução; `/login` respondeu normalmente.
- Imagem ativa: `sha256:31c02a132216e73fda826e62126d9c66839cab9ec9abb8cee551f028ab73ff22`

**Backup e rastreabilidade:**

- Diretório: `/home/sombra/backups/escola/prioridades-4-5-20260914-013956`
- Backup do banco antes: `banco-antes.dump`
- Backup do banco depois: `banco-depois.dump`
- Código antes: `codigo-antes.tar.gz`
- Código depois: `codigo-depois.tar.gz`
- Pacote implantado: `prioridades-4-5.tar.gz`
- Checksums: `SHA256SUMS-FINAL`
- Log técnico: `resultado-prioridades-4-5.log`
- Imagem de reversão: `docker-site-escola:pre-p45`

## Atualização das prioridades 6 a 8

**Arquivos alterados:**

- `package.json`
- `scripts/import-school-data.ts`
- `sql/007_diario_matriculas.sql`
- `src/lib/audit.ts`
- `src/lib/notas-batch.ts`
- `src/lib/notas-batch.test.ts`
- `src/lib/permissions.ts`
- `src/app/api/notas/route.ts`
- `src/app/api/professor-vinculos/route.ts`
- `src/app/api/diario/route.ts`
- `src/app/dashboard/diario/page.tsx`
- `src/app/dashboard/vinculos-professores/page.tsx`
- `src/components/UserMenu.tsx`

**Banco envolvido:** `matriculas`, `notas`, `alunos`, `turmas`, `disciplinas`, `matriz_disciplinas`, `professor_vinculos` e `logs_acesso`.

**Validação e implantação:**

- Migração validada duas vezes em restauração isolada antes de ser aplicada em produção.
- 44 de 44 testes aprovados dentro da imagem final.
- TypeScript, ESLint dos arquivos alterados e build Docker aprovados.
- Teste autenticado do diário aprovado com 17 alunos e 17 registros na seleção verificada.
- APIs de diário, notas e vínculos e páginas de diário e vínculos responderam normalmente.
- Total preservado: 3.105 notas, todas ligadas a matrícula válida, sem duplicidades.
- Matrículas de 2026: 131, sendo 123 ativas e 8 transferidas.
- A permissão da nova tabela foi concedida ao usuário interno `app_escola` e incorporada à migração.
- Contêiner `escola-app` em execução, sem erros recentes.
- Imagem ativa: `sha256:d6ad11ff3611ecd113c1800684c8eabfb47903dd739c0cf06692df23eba73aa2`.

**Backup e rastreabilidade:**

- Diretório: `/home/sombra/backups/escola/prioridades-6-8-20260914-022613`
- Backup do banco antes: `banco-antes.dump`
- Código antes: `codigo-antes.tar.gz`
- Pacote implantado: `prioridades-6-8.tar.gz`
- SHA-256 do pacote: `7ea235f1d0d82a18073526147d4e559cbfdbb0c1076bc2146355fba733386c59`
- Imagem de reversão: `docker-site-escola:pre-p68`
- Os artefatos finais, logs e checksums ficam no mesmo diretório.


## Atualização das prioridades 9 e 10

**Arquivos alterados:**

- `package.json`
- `scripts/import-school-data.ts`
- `sql/008_avaliacoes_recuperacao_auditoria.sql`
- `src/lib/avaliacoes.ts`
- `src/lib/avaliacoes.test.ts`
- `src/app/api/avaliacoes/route.ts`
- `src/app/api/recuperacoes/route.ts`
- `src/app/api/notas/route.ts`
- `src/app/api/logs/route.ts`
- `src/app/dashboard/avaliacoes/page.tsx`
- `src/app/dashboard/logs/page.tsx`
- `src/components/UserMenu.tsx`

**Banco envolvido:** `avaliacoes`, `resultados_avaliacoes`, `recuperacoes`, `notas`, `matriculas`, `turmas`, `disciplinas` e `logs_acesso`.

**Validação e implantação:**

- Migração aditiva e transacional validada duas vezes em restauração isolada antes da aplicação em produção.
- Teste isolado confirmou criação de avaliação, resultado e recuperação, bloqueio de nota acima do máximo e cálculo correto da recuperação; a transação de teste foi revertida.
- 48 de 48 testes aprovados localmente e dentro da imagem final.
- TypeScript, ESLint dos arquivos alterados e build Docker aprovados.
- Testes autenticados das APIs de avaliações, recuperações e logs e das páginas correspondentes responderam normalmente.
- Total preservado: 3.105 notas, sem valores inválidos ou duplicidades; todas permanecem com origem `LANCAMENTO_MANUAL`.
- As novas tabelas estão vazias em produção, sem dados fictícios, prontas para os lançamentos reais.
- O usuário interno `app_escola` recebeu permissões de leitura e gravação nas três novas tabelas.
- Contêiner `escola-app` em execução, sem erros recentes.
- Imagem ativa: `sha256:ddfe7293aa781f70a39e5e2831138fb73df24ae26996658bc3823b11e91391ae`.

**Backup e rastreabilidade:**

- Diretório: `/home/sombra/backups/escola/prioridades-9-10-20260914-140738`
- Backup do banco antes: `banco-antes.dump`
- Código antes: `codigo-antes.tar.gz`
- Pacote implantado: `prioridades-9-10.tar.gz`
- SHA-256 do pacote: `24ccc2529e9909583a8171d8c544d96b84df0d4648b7643ada5c7ce0eb8f4312`
- Imagem de reversão: `docker-site-escola:pre-p910`
- Os artefatos finais, logs de validação e checksums ficam no mesmo diretório.


## Atualização das prioridades 11 a 17

**Arquivos alterados:**

- `package.json`
- `README.md`
- `DOCUMENTACAO_OPERACIONAL.md`
- `PLANO_DE_EVOLUCAO_ESCOLADB.md`
- `sql/009_sessoes_consistencia_relatorios.sql`
- `src/lib/auth.ts`
- `src/lib/auth-session.test.ts`
- `src/lib/permissions.test.ts`
- `src/lib/relatorios.ts`
- `src/lib/relatorios.test.ts`
- `src/lib/analytics/indiceComposto.ts`
- `src/lib/analytics/indiceComposto.test.ts`
- `src/types/roles.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/trocar-senha/route.ts`
- `src/app/api/usuarios/[id]/route.ts`
- `src/app/api/usuarios/[id]/resetar-senha/route.ts`
- `src/app/api/relatorios/route.ts`
- `src/app/dashboard/relatorios/page.tsx`
- `src/app/dashboard/usuarios/page.tsx`
- `src/components/UserMenu.tsx`
- `src/components/NavigationProgressBar.tsx`
- `src/components/ThemeToggle.tsx`
- `src/components/escola-dashboard/PainelAlertas.tsx`
- `src/app/dashboard/aluno/[id]/page.tsx`
- `src/app/globals.css`

**Banco envolvido:** `usuarios`, `tokens_revogados`, `disciplinas`, `alunos`, `matriculas`, `notas`, `avaliacoes`, `recuperacoes` e `logs_acesso`.

**Validação e implantação:**

- Backup criado antes da alteração de código e banco.
- Dump restaurado em dois bancos temporários; migração validada duas vezes e teste funcional executado em transação revertida.
- 61 de 61 testes aprovados localmente e dentro da imagem Docker.
- TypeScript e lint completo aprovados, sem erros nem avisos.
- O build local foi impedido apenas pelo atalho externo de `node_modules` no Windows; o build canônico dentro do Docker foi aprovado.
- Smoke autenticado aprovou sessão, opções, relatório, CSV e página; acesso sem sessão respondeu 401.
- Relatório de produção testado com 122 linhas, média 6,2 e índice experimental 65,8 sobre 1.537 notas do recorte.
- Total preservado: 3.105 notas, sem valores inválidos ou duplicidades.
- Disciplina C05 permanece ativa com 21 notas; a cópia C22, sem referências, foi preservada inativa.
- Matrículas: 123 alunos ativos e oito transferidos inativos, sem inconsistências.
- Contêiner `escola-app` em execução e sem erros recentes.
- Imagem ativa: `sha256:22e68770d3d0c539829346fe41f1cf7d2950386befb2704c3c5c447d8d9fcf9f`.

**Backup e rastreabilidade:**

- Diretório na VPS: `/home/sombra/backups/escola/prioridades-11-17-20260914-144853`
- Cópia externa: `C:\Users\AndreJr\backups-escola\prioridades-11-17-20260914-144853`
- Backup do banco antes e depois: `banco-antes.dump` e `banco-depois.dump`
- Código antes e depois: `codigo-antes.tar.gz` e `codigo-depois.tar.gz`
- Pacote implantado: `prioridades-11-17.tar.gz`
- SHA-256 do pacote: `670fcac7aa381a9bae025340b4b102535d2522ca83cbe15101d7fda043b38fc0`
- Imagem de reversão: `docker-site-escola:pre-p1117`
- Logs técnicos e validação de checksum: `SHA256SUMS-FINAL` e `checksum-validation.log`.

## Backup e rastreabilidade das prioridades 1 a 3

- Diretorio: `/home/sombra/backups/escola/prioridades-1-3-20260914-010645`
- Backup anterior: `codigo-anterior.tar.gz`
- SHA-256 do backup anterior: `dd51847c729146814902f67ce008a0d547b29f8252d5faa61cc5802d04881224`
- Pacote implantado: `alteracoes-prioridades-1-3.tar.gz`
- SHA-256 do pacote implantado: `df95ca50756da3c0bc5d3a47d21c57aa23b9838e0440b982387c2eb392358414`
- Imagem ativa: `sha256:960ae6453ac120847c37d3a3c3fca8714d659e52d522abe07d1f0f9bd9cc498f`
- O backup contem o estado e o diff que ja existiam no repositorio antes da rodada.
- Nenhuma tabela ou nota foi alterada pela implantacao.

## Validacoes concluídas

- Documentacao da versao instalada do Next.js 16.2.6 consultada antes da edicao.
- Diffs dos arquivos revisados.
- Build isolado na VPS aprovado com Turbopack e TypeScript.
- Build final da imagem de producao aprovado.
- 33 testes aprovados dentro da imagem final: 30 existentes e 3 novos testes de autorizacao.
- Container `escola-app` em estado `running`, iniciado em `2026-09-14T01:31:50.770446197Z`.
- PostgreSQL `escola-db` permaneceu saudavel.
- `/login` respondeu HTTP 200.
- `/analytics` sem sessao respondeu com redirecionamento para `/login`.
- Total de notas confirmado depois da implantacao: 3.105.

## Pendencias observadas

- O build informou 10 vulnerabilidades nas dependencias: 2 baixas, 1 moderada, 6 altas e 1 critica. As bibliotecas nao foram atualizadas nesta rodada porque isso exige analise de impacto e uma entrega separada.
- A convencao `middleware.ts` esta depreciada no Next.js 16 e deve migrar para `proxy.ts` em rodada propria.
- Ainda não existem usuários com papel PROFESSOR nem vínculos cadastrados; a estrutura e as telas estão prontas para o primeiro cadastro.
