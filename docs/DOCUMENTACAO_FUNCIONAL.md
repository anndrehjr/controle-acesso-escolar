# Documentação funcional — Sistema Pedagógico

**Versão documentada:** 13 de outubro de 2026  
**Endereço:** https://escola.andre-aguiar-jr.com.br/  
**Objetivo:** orientar usuários e administradores sobre as funções disponíveis, regras de cálculo, permissões e fluxos de trabalho.

## 1. Visão geral

O Sistema Pedagógico centraliza notas, avaliações, recuperações, acompanhamento de turmas, alertas acadêmicos, relatórios, gestão de alunos e usuários e a análise separada da Prova Paulista.

As informações são sempre limitadas à escola, às turmas e às disciplinas que o perfil autenticado pode acessar. A Prova Paulista permanece separada das notas escolares: seus percentuais não entram no boletim, na média ou nos cálculos de aprovação.

## 2. Perfis e permissões

| Perfil | Escolas | Turmas | Notas e avaliações | Relatórios | Usuários e vínculos | Auditoria | Ajuste em lote |
|---|---|---|---|---|---|---|---|
| Dev Master | Todas | Todas | Completo | Sim | Completo | Sim | Sim |
| Administrador Multi-Escolas | Todas | Todas | Completo | Sim | Completo dentro da hierarquia | Sim | Apenas quando autorizado pela regra especial do sistema |
| Direção/Coordenação | Própria escola | Todas da escola | Completo | Sim | Professores e leitores da própria escola | Não | Não |
| Professor | Própria escola | Somente vinculadas | Somente disciplinas vinculadas, ou todas quando o vínculo não especifica disciplina | Sim, no próprio escopo | Não | Não | Não |
| Somente leitura | Própria escola | Todas da escola | Consulta | Sim | Não | Não | Não |

Regras importantes:

- Um usuário não pode administrar um perfil acima do próprio nível.
- Direção/Coordenação gerencia usuários apenas da própria escola.
- Professores enxergam somente as turmas e disciplinas definidas em seus vínculos ativos.
- Sessões antigas são revogadas após redefinição de senha ou desativação do usuário.
- O Dev Master exige o papel correto e a identificação interna exclusiva do sistema.

## 3. Acesso e navegação

### 3.1 Login

O acesso é feito com e-mail e senha. Uma conta inativa ou uma sessão revogada não consegue acessar áreas protegidas. Quando uma senha temporária é definida, o sistema pode exigir a troca antes de liberar as demais páginas.

### 3.2 Barra superior

A barra superior mostra o usuário e seu perfil, os atalhos permitidos e as seguintes ações:

- **Início:** retorna ao dashboard inicial correto para o perfil e a escola do usuário.
- **Diário de classe:** abre o lançamento direto de notas.
- **Avaliações e recuperação:** abre avaliações detalhadas, resultados e recuperação.
- **Relatórios:** abre relatórios filtráveis e exportáveis.
- **Prova Paulista:** abre o painel exclusivo da avaliação externa.
- **Gestão de alunos:** disponível para gestores da escola.
- **Usuários e vínculos:** disponíveis conforme a permissão do perfil.
- **Logs:** disponível para perfis com auditoria.
- **Ajustar notas:** aparece somente para contas especialmente autorizadas.
- **Tema:** alterna entre modo claro e escuro.
- **Sair:** encerra a sessão atual.

Em páginas longas, uma seta aparece no canto inferior direito depois de uma rolagem considerável. Ela retorna suavemente ao início da página. O botão não aparece em páginas curtas.

## 4. Dashboard pedagógico da escola

O cabeçalho identifica a escola, cidade, estado e ano letivo. Também oferece:

- seleção de turma;
- seleção de bimestre;
- acesso à visão geral executiva;
- encerramento da sessão.

O ano letivo é o contexto principal. O bimestre selecionado permanece na navegação por parâmetro da página até que o usuário faça outra escolha.

### 4.1 Aba Visão Geral

Apresenta os principais indicadores do contexto selecionado:

- total de alunos ativos e turmas;
- média geral das notas válidas;
- alunos pré-reprovados;
- alunos em atenção;
- percentual adequado ou avançado;
- melhor turma e turma que exige atenção;
- disciplina mais crítica;
- melhor aluno e alunos com menores médias quando uma turma está selecionada;
- distribuição pedagógica por faixa;
- tendência dos bimestres;
- resumo pedagógico e lista de turmas.

Faixas usadas nos painéis de notas escolares:

| Faixa | Classificação |
|---|---|
| abaixo de 5,0 | Abaixo do Básico |
| 5,0 a 6,9 | Básico |
| 7,0 a 7,9 | Adequado |
| 8,0 a 10,0 | Avançado |

### 4.2 Aba Turmas

Exibe o ranking das turmas com média e quantidade de registros, junto do resumo pedagógico. A seleção de uma turma altera o restante do dashboard para aquele grupo.

### 4.3 Aba Disciplinas

Mostra as disciplinas com maior percentual de notas abaixo de 5,0. Uma barra maior representa maior proporção de resultados abaixo do básico e, portanto, maior necessidade de intervenção.

A análise pode ser apresentada de forma geral e separada por Ensino Fundamental e Ensino Médio. A separação usa o grupo pedagógico da turma e, quando necessário, uma identificação pelo nome da turma.

### 4.4 Aba Alertas

O alerta acadêmico é acumulado no ano até o bimestre atual:

- **Atenção:** uma ou duas disciplinas em risco.
- **Pré-Reprovado:** três ou mais disciplinas em risco simultaneamente.

Cada registro mostra aluno, turma, média geral atual, quantidade de disciplinas em risco, nomes das disciplinas e médias acumuladas. Os dados podem ser filtrados por turma e situação.

### 4.5 Aba Heatmap

Organiza visualmente os alunos e seus resultados por disciplina. As cores facilitam a identificação de notas baixas, situação adequada e concentração de dificuldades. É possível abrir o perfil individual do aluno a partir da matriz.

O Heatmap usa as mesmas faixas pedagógicas do restante do sistema: abaixo de 5,0; básico de 5,0 a 6,9; adequado de 7,0 a 7,9; e avançado de 8,0 a 10,0.

### 4.6 Aba Comparativo

Aparece quando uma turma está selecionada. Compara os bimestres disponíveis da turma, incluindo:

- média geral;
- estudantes em pré-reprovação;
- percentual adequado ou avançado;
- componentes curriculares e percentual abaixo do básico;
- tendência anual;
- alunos e disciplinas que precisam de atenção.

O comparativo considera os dados existentes; bimestres ainda não lançados aparecem como sem dados.

O bloco **Alunos que precisam de intervenção** usa um recorte específico para acompanhamento até o 3º bimestre. O aluno aparece quando possui **três ou mais disciplinas com média acumulada abaixo de 4,5**. Esse índice serve para antecipar intervenção pedagógica e não substitui a regra geral de pré-reprovação nem a decisão do conselho.

## 5. Visão Geral executiva

A página executiva trabalha com o ano letivo completo e detecta automaticamente o último bimestre que possui notas. Ela contém:

- evolução da média por bimestre;
- média anual acumulada;
- entradas e saídas da zona de atenção;
- entradas e saídas da situação de pré-reprovação;
- rankings de turmas e disciplinas;
- separação entre Ensino Fundamental e Ensino Médio;
- matrículas ativas e transferidas;
- observações automáticas produzidas a partir dos números reais;
- comparações entre o primeiro bimestre com dados, o período anterior e o último período disponível.

As observações mudam conforme novos bimestres são lançados. Elas não substituem decisão pedagógica ou conselho de classe.

## 6. Perfil individual do aluno

O perfil reúne o histórico anual do estudante:

- identificação, turma e número de chamada;
- média geral acumulada;
- classificação pedagógica;
- situação de atenção ou pré-reprovação;
- quantidade e lista de disciplinas em risco;
- notas do 1º ao 4º bimestre por disciplina;
- média acumulada de cada disciplina;
- tendência entre os dois últimos bimestres com nota;
- indicação de evolução, queda, risco ou conselho.

A média mostrada por disciplina é a média dos bimestres já lançados, e não a nota isolada do bimestre atualmente selecionado no dashboard.

## 7. Diário de classe

O Diário de classe permite lançamento direto por:

1. escola, quando o perfil pode acessar mais de uma;
2. turma;
3. disciplina;
4. ano letivo;
5. bimestre.

Depois de carregar o diário, o usuário informa notas de 0 a 10 para os alunos ativos e salva as alterações. O sistema restringe professores às turmas e disciplinas de seus vínculos ativos. A gravação mantém unicidade por matrícula, disciplina, ano e bimestre e registra a alteração para auditoria.

## 8. Avaliações e recuperação

### 8.1 Criar avaliação

Uma avaliação pertence a uma turma, disciplina, ano e bimestre. Os tipos disponíveis são:

- atividade;
- prova;
- trabalho;
- simulado;
- outra.

Cada avaliação possui nome, peso, nota máxima e data opcional. Nome, peso e nota máxima são validados antes da gravação.

### 8.2 Lançar resultados

Ao selecionar uma avaliação, o sistema lista os estudantes e permite informar:

- resultado obtido;
- ausência;
- observação.

Quando os resultados são salvos, a média da disciplina no bimestre é recalculada automaticamente pela média ponderada normalizada para a escala de 0 a 10:

`média = soma((resultado / nota máxima) × 10 × peso) / soma dos pesos`

### 8.3 Aplicar recuperação

Tipos disponíveis:

- paralela;
- bimestral;
- final.

Critérios disponíveis:

- **Manter a maior nota:** usa o maior valor entre a nota anterior e a recuperação.
- **Média aritmética:** calcula a média entre a nota anterior e a recuperação.
- **Substituição:** usa a nota de recuperação no lugar da nota anterior.

As recuperações atualizam a nota final e deixam registro de auditoria com os valores anterior, de recuperação e final.

## 9. Gestão de alunos

Disponível para perfis com gestão de usuários da escola.

### 9.1 Adicionar aluno

Informe nome completo, turma e número de chamada disponível. O sistema cria o aluno como ativo e vincula a matrícula ao ano letivo atual da escola.

Quando o estudante ingressa durante o ano, as notas podem começar no bimestre atual. Os bimestres anteriores permanecem sem nota até que a escola tenha informação oficial para preenchê-los; o sistema não inventa nem replica valores anteriores.

### 9.2 Consultar alunos

A lista permite busca por nome ou número de chamada e filtro por turma. Também informa turma e situação atual.

### 9.3 Registrar saída

Tipos disponíveis:

- transferência para outra escola;
- inativação ou abandono.

É obrigatório registrar o motivo. A saída remove o aluno das listas ativas, mas preserva notas, histórico e vínculo anterior para consulta e auditoria.

## 10. Usuários

A gestão de usuários permite:

- criar conta com nome, e-mail, perfil e escola;
- consultar usuários no escopo permitido;
- redefinir senha;
- ativar ou desativar conta;
- ajustar papel e escola quando a hierarquia permitir.

A nova senha deve ter pelo menos oito caracteres. Depois de uma redefinição, sessões anteriores são revogadas. O usuário pode ser obrigado a trocar a senha temporária no próximo acesso.

## 11. Vínculos de professores

O vínculo determina o conteúdo disponível para cada professor no diário e nas funções pedagógicas.

- Um vínculo sempre informa professor e turma.
- A disciplina pode ser específica.
- A opção **Todas as disciplinas** concede acesso completo àquela turma.
- Um vínculo pode ser desativado sem apagar o histórico.
- Somente vínculos ativos concedem acesso.

## 12. Relatórios oficiais

Tipos disponíveis:

- relatório por turma;
- relatório por disciplina;
- histórico por aluno;
- relatório de recuperação;
- evolução entre bimestres;
- indicadores objetivos de risco.

Filtros disponíveis conforme o relatório:

- escola;
- ano letivo;
- bimestre;
- turma;
- disciplina;
- aluno;
- situação da matrícula: ativa, transferida, concluída ou cancelada.

O resultado apresenta quantidade de registros, média geral, notas abaixo de 5 e recuperações. Pode ser exportado em CSV ou impresso/salvo em PDF pelo navegador.

Alguns relatórios apresentam um índice composto experimental:

- 50% da média normalizada;
- 30% do percentual de notas iguais ou superiores a 5;
- 20% da evolução entre períodos comparáveis.

Esse índice serve como apoio visual. Ele não define aprovação nem diagnóstico pedagógico.

## 13. Prova Paulista

O painel da Prova Paulista é independente das notas escolares.

Filtros:

- ano letivo;
- turma ou visão geral;
- bimestre em destaque.

Indicadores e visualizações:

- percentual geral de acertos;
- melhor turma;
- turma com maior evolução;
- disciplina que exige atenção;
- evolução das turmas por bimestre;
- resultado das disciplinas no período selecionado;
- tabela comparativa por disciplina;
- variação entre o primeiro bimestre e o período escolhido.

Ao clicar no gráfico de disciplinas, abre-se uma análise interativa que permite:

- comparar 1º, 2º e 3º bimestres no mesmo gráfico;
- destacar um único bimestre;
- escolher uma matéria;
- acompanhar sua evolução em linha e em cartões percentuais.

Faixas visuais do painel:

| Percentual de acertos | Faixa |
|---|---|
| abaixo de 40% | crítica |
| 40% a 59,9% | intermediária |
| 60% ou mais | adequada |

Os valores representam percentuais de acerto e nunca devem ser interpretados como notas de 0 a 10.

## 14. Logs de auditoria

Disponível para perfis autorizados. Registra operações relevantes, como:

- login com sucesso ou falha;
- edição e recálculo de notas;
- criação de avaliação;
- alteração de resultado de avaliação;
- aplicação de recuperação;
- criação de usuário;
- redefinição de senha;
- alterações administrativas.

Os filtros incluem e-mail do usuário, ação e tabela. Cada registro pode informar data, responsável, ação, registro afetado, sucesso ou falha e valores anteriores e novos.

## 15. Atualização de notas em lote

É uma função restrita a contas especialmente autorizadas. Permite carregar uma turma e editar várias notas em uma matriz de alunos por disciplinas.

Proteções existentes:

- notas aceitas somente entre 0 e 10;
- destaque das células alteradas;
- contador de alterações pendentes;
- opção de descartar rascunhos;
- motivo geral obrigatório;
- confirmação antes da gravação;
- salvamento transacional do lote;
- auditoria das notas anteriores e novas.

## 16. Regras pedagógicas centrais

### 16.1 Disciplina em risco durante o ano

Enquanto houver menos de quatro bimestres lançados para uma disciplina, ela fica em risco quando a média dos bimestres disponíveis é inferior a 5,0.

### 16.2 Fechamento anual

Com quatro bimestres lançados, a referência é a soma anual:

- soma igual ou superior a 20 pontos: fora do risco por nota;
- soma inferior a 20: em risco;
- valores próximos ao limite podem receber indicação de conselho conforme a margem configurada.

### 16.3 Situação do aluno

- nenhuma disciplina em risco: situação regular;
- uma ou duas disciplinas em risco: atenção;
- três ou mais disciplinas em risco: pré-reprovado.

O termo pré-reprovado representa um alerta para acompanhamento e conselho. Não é uma decisão automática de reprovação.

### 16.4 Faixas de desempenho

As classificações usadas nos cartões, gráficos, comparativos, perfil individual, distribuição pedagógica e Heatmap são:

- abaixo de 5,0: abaixo do básico;
- de 5,0 a 6,9: básico;
- de 7,0 a 7,9: adequado;
- de 8,0 a 10,0: avançado.

### 16.5 Dados considerados

- Alunos transferidos não entram nos indicadores atuais de alunos ativos.
- Notas nulas ou inválidas não entram nos cálculos.
- O risco acadêmico é acumulado desde o primeiro bimestre até o período analisado.
- Rankings e gráficos respeitam escola, turma, ano, bimestre e permissões do usuário.

## 17. Segurança e integridade

- Autenticação por sessão assinada e cookie seguro.
- Controle de acesso no menu, nas páginas e nas APIs.
- Isolamento de dados por escola.
- Restrição de professores por vínculo.
- Proteção contra ações fora da hierarquia do usuário.
- Revogação de sessões no logout e em redefinições relevantes.
- Limitação de tentativas nas operações de autenticação.
- Auditoria das ações sensíveis.
- Unicidade de notas para impedir duplicidade no mesmo contexto.
- Preservação de histórico quando alunos, usuários ou vínculos são desativados.

## 18. Fluxos recomendados

### Início do ano

1. Conferir escola, ano letivo, turmas, disciplinas e matriz curricular.
2. Cadastrar ou conferir usuários.
3. Criar vínculos dos professores.
4. Cadastrar novos alunos e conferir números de chamada.

### Durante o bimestre

1. Criar avaliações e lançar resultados ou usar o Diário de classe.
2. Conferir médias recalculadas.
3. Aplicar recuperações quando necessário.
4. Acompanhar Alertas, Heatmap e perfil individual.

### Conselho e fechamento

1. Conferir disciplinas em risco e estudantes pré-reprovados.
2. Consultar histórico individual e relatórios de evolução.
3. Validar recuperações e possíveis indicações de conselho.
4. Exportar relatórios oficiais.
5. Registrar transferências ou inativações sem apagar o histórico.

## 19. Rotas funcionais

| Página | Endereço |
|---|---|
| Dashboard | `/dashboard` ou `/dashboard/escolas/{id}` |
| Visão executiva | `/analytics` |
| Perfil do aluno | `/dashboard/aluno/{id}` |
| Diário | `/dashboard/diario` |
| Avaliações e recuperação | `/dashboard/avaliacoes` |
| Gestão de alunos | `/dashboard/alunos` |
| Relatórios | `/dashboard/relatorios` |
| Prova Paulista | `/dashboard/prova-paulista` |
| Usuários | `/dashboard/usuarios` |
| Vínculos de professores | `/dashboard/vinculos-professores` |
| Logs | `/dashboard/logs` |
| Ajuste restrito de notas | `/dashboard/ajustar-notas` |
| Documentação | `/dashboard/documentacao` |

## 20. Manutenção desta documentação

Esta documentação deve ser revisada quando houver alteração em:

- páginas ou menus;
- perfis e permissões;
- fórmulas de média, risco, recuperação ou índice;
- filtros e exportações;
- status de matrícula;
- integração de avaliações externas;
- regras de autenticação e auditoria.

Antes de atualizar o texto, a implementação deve ser conferida nas páginas, APIs, matriz de permissões e serviços de cálculo. A documentação descreve a versão efetivamente existente no sistema em 16 de outubro de 2026.

## 21. Atualizações recentes

Alterações consolidadas em 13 de outubro de 2026:

- o índice comparativo de intervenção passou a listar alunos com três ou mais disciplinas cuja média acumulada esteja abaixo de 4,5;
- a classificação **Avançado** passou a começar em 8,0 em todas as visualizações pedagógicas;
- as legendas de gráficos, perfil individual, distribuição e Heatmap foram alinhadas às mesmas faixas;
- o cadastro de aluno novo mantém a matrícula ativa no ano atual e permite iniciar o histórico pelo bimestre de ingresso;
- alunos transferidos permanecem fora das listas ativas e dos indicadores atuais, com notas e histórico preservados;
- o comparativo anual contempla os bimestres com dados disponíveis, incluindo o 3º bimestre;
- o painel da Prova Paulista mantém resultados separados das notas escolares e oferece comparação entre os três primeiros bimestres.

## 22. Backup automático do banco de dados

O banco PostgreSQL completo é copiado automaticamente todos os dias. A rotina foi criada para proteger cadastros, matrículas, notas, avaliações, recuperações, permissões e registros de auditoria.

### 22.1 Horário e destino

- execução diária às **23h15**, no horário de Brasília;
- cópia temporária protegida no servidor;
- envio automático para o Google Drive autorizado pela administração;
- pasta de destino: **Sistema Escolar / Backups PostgreSQL**;
- manutenção dos arquivos locais dos últimos 7 dias;
- manutenção dos arquivos do Google Drive por 30 dias.

### 22.2 Validação automática

Cada execução:

1. gera um arquivo completo no formato próprio de restauração do PostgreSQL;
2. confirma que o arquivo não está vazio;
3. testa se a estrutura do backup pode ser lida pelo restaurador;
4. gera um arquivo SHA-256 para conferência de integridade;
5. envia o backup e sua verificação ao Google Drive;
6. registra data, resultado e eventuais falhas no histórico operacional.

Um arquivo existente no Drive não deve ser tratado como válido apenas por estar presente. A restauração deve conferir o SHA-256 e ser testada primeiro em um banco isolado.

### 22.3 Segurança e restauração

- A autorização do Google fica protegida no servidor e não aparece na interface do sistema.
- A senha da conta Google não é armazenada pelo sistema.
- A rotina usa autorização revogável da própria conta Google.
- O banco de produção não deve ser sobrescrito diretamente durante um teste.
- A restauração deve ser feita primeiro em um banco temporário e conferida antes de qualquer decisão sobre o banco oficial.

Se a autorização do Google Drive for revogada ou expirar, o backup local continua sendo produzido e o registro operacional informa que o envio externo precisa ser reconectado.

## 23. Identidade visual do sistema

O ícone oficial do Sistema Escolar representa um livro aberto, um capelo de formatura e indicadores de acompanhamento pedagógico em tons de azul e verde.

Ele é usado:

- na aba do navegador;
- nos favoritos;
- em atalhos instalados no computador ou celular;
- como ícone compatível com dispositivos Apple.

Após uma troca de ícone, o navegador pode manter a versão anterior em cache. Fechar e reabrir o navegador ou limpar o cache do site força a atualização visual.

## 24. Ranking dos alunos

O dashboard de ranking é exclusivo do **Dev Master** e aparece no menu superior com o símbolo de uma coroa.

Ele permite:

- classificar os alunos de toda a escola;
- filtrar uma turma individualmente;
- consultar cada bimestre separadamente;
- consultar o ranking atual acumulado do 1º até o último bimestre com dados;
- visualizar pódio, posição, nome, turma, número de chamada, disciplinas consideradas e média;
- alternar entre escolas quando houver mais de uma unidade cadastrada.

O cálculo considera apenas alunos com matrícula ativa e notas válidas entre 0 e 10. Alunos transferidos não entram na classificação atual. Empates de média recebem a mesma posição.

## 25. Relatório exclusivo de notas abaixo de 5,0

O Dev Master possui um relatório separado, identificado no menu superior pelo ícone de arquivo com alerta. Nenhum outro perfil visualiza o botão ou consegue consultar os dados por endereço direto.

Filtros disponíveis:

- escola;
- uma ou várias séries/turmas na mesma emissão;
- disciplina específica;
- bimestre de referência;
- nota do bimestre ou média acumulada até o bimestre selecionado.

O relatório exibe somente alunos ativos cujo resultado seja inferior a 5,0. A tabela apresenta aluno, turma, número de chamada, notas do 1º ao 4º bimestre e o resultado usado no filtro. Também permite exportar CSV e gerar PDF pela impressão do navegador.

Quando várias turmas são selecionadas, a prévia e o PDF são agrupados e ordenados pedagogicamente: 6º, 7º, 8º e 9º anos, seguidos da 1ª, 2ª e 3ª séries do Ensino Médio. O usuário pode selecionar todas as turmas e retirar apenas as que não deseja incluir.

O código apresentado ao lado da disciplina vem da matriz curricular da turma. O sistema mantém o identificador geral internamente, mas exibe códigos contextuais como **C02 — Ciências** no 6º ano, mesmo que o cadastro interno da disciplina possua outro código.

No modo **Nota do bimestre**, o critério é aplicado apenas à nota do período escolhido. No modo **Média acumulada**, o sistema calcula a média das notas disponíveis da disciplina desde o 1º bimestre até o período selecionado. Notas iguais a 5,0 não entram; resultados de 0,0 a 4,99 entram no relatório.

## 26. Caderno particular de notas

O **Caderno particular de notas** é uma ferramenta exclusiva do Dev Master. Ele aparece no menu superior com o ícone de um livro com marca de conferência e também possui proteção no servidor contra acesso direto por outros perfis.

O caderno permite selecionar:

- escola;
- turma;
- disciplina da matriz curricular da turma;
- ano letivo;
- bimestre.

A tabela usa automaticamente os alunos com matrícula ativa e o número de chamada vigente. Alunos transferidos não aparecem na lista atual, mas um caderno salvo mantém seu histórico no banco de dados.

As colunas de atividade são configuráveis. O modelo inicial de Inglês contém **Avaliação 1, Avaliação 2, Tarefa, Speak, Prova Paulista e Engajamento**. O modelo de Orientação de Estudos contém **Avaliação 1, Avaliação 2, Tarefa, Portfólio e Engajamento**. Nas demais disciplinas, o modelo inicial usa **Avaliação 1, Avaliação 2, Tarefa, Atividades e Engajamento**. O Dev Master pode renomear, adicionar ou remover colunas.

Os pesos são opcionais. Enquanto algum peso estiver em branco, a nota final mostrada é uma média simples provisória apenas dos campos preenchidos. Quando todos os componentes possuem peso, a prévia passa a usar média ponderada normalizada na escala de 0 a 10. A soma dos pesos é mostrada na tela para conferência.

Os dados desta área são privados e separados das notas oficiais. Salvar o caderno não altera boletins, dashboards, rankings, relatórios pedagógicos nem a tabela oficial de notas. Uma futura função de lançamento oficial deverá exigir uma ação específica e uma revisão antes da gravação.

O botão **Imprimir** gera uma tabela limpa para conferência ou PDF. O botão **Salvar caderno** grava colunas, pesos e notas provisórias com auditoria da operação.
