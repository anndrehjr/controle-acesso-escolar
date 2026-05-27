export type Aluno = {
  id: string;
  escola_id: string;
  turma_id: string;
  nome: string;
  numero_chamada: number;
  status: string;
  em_atencao: boolean;
  ativo: boolean;
};

export type Nota = {
  id: string;
  aluno_id: string;
  turma_id: string;
  disciplina_id: string;
  nota: number | null;
  bimestre?: number | string | null;
  ano_letivo?: number | string | null;
};

export type Turma = {
  id: string;
  nome: string;
  total_ativos: number;
  grupo_pedagogico?: string;
};

export type Disciplina = {
  id: string;
  nome: string;
};
export type MatrizDisciplina = {
  id: string;
  escola_id: string;
  etapa: string;
  codigo: string;
  disciplina_id: string;
  ativo: boolean;
};
