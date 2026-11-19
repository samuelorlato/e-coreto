// Situações da proposta e regras de fluxo (espelho de model/ProposalStatus.java).
// O back-end é quem decide de verdade; aqui servem para mostrar/esconder botões.

export const STATUS = {
  COLLECTING_VOTES: { label: 'Coletando apoio', dot: 'bg-sky-500' },
  AWAITING_REVIEW: { label: 'Aguardando análise', dot: 'bg-amber-500' },
  UNDER_REVIEW: { label: 'Em análise', dot: 'bg-violet-500' },
  APPROVED: { label: 'Aprovada', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Recusada', dot: 'bg-rose-500' },
  IN_PROGRESS: { label: 'Em execução', dot: 'bg-indigo-500' },
  COMPLETED: { label: 'Concluída', dot: 'bg-teal-500' },
};

/** Caminho "feliz" de uma proposta (a recusa é um desvio). */
export const FLOW = ['COLLECTING_VOTES', 'AWAITING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'];

/** Fases mostradas na lista: agrupam as 7 situações do jeito que o morador pensa. */
export const PHASES = [
  { id: 'todas', label: 'Todas', statuses: null },
  { id: 'votacao', label: 'Em votação', statuses: ['COLLECTING_VOTES'] },
  { id: 'prefeitura', label: 'Na prefeitura', statuses: ['AWAITING_REVIEW', 'UNDER_REVIEW'] },
  { id: 'andamento', label: 'Em andamento', statuses: ['APPROVED', 'IN_PROGRESS'] },
  { id: 'concluidas', label: 'Concluídas', statuses: ['COMPLETED'] },
  { id: 'arquivadas', label: 'Arquivadas', archived: true },
];

/** Transições que uma autoridade pode fazer manualmente. */
export const MANUAL_TRANSITIONS = {
  AWAITING_REVIEW: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
};

export const TRANSITION_ACTIONS = {
  UNDER_REVIEW: { label: 'Iniciar análise', confirm: 'A votação fecha e a proposta passa para "Em análise".' },
  APPROVED: { label: 'Aprovar', confirm: 'A proposta será marcada como aprovada pela prefeitura.' },
  REJECTED: {
    label: 'Recusar',
    danger: true,
    confirm: 'A proposta será recusada e arquivada. Depois, publique uma resposta explicando o motivo.',
  },
  IN_PROGRESS: { label: 'Iniciar execução', confirm: 'A proposta passa para "Em execução".' },
  COMPLETED: { label: 'Concluir', confirm: 'A proposta será marcada como concluída, a última etapa.' },
};

export const isVotingOpen = (status) => status === 'COLLECTING_VOTES' || status === 'AWAITING_REVIEW';
export const acceptsOfficialResponse = (status) =>
  ['APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'].includes(status);
export const statusLabel = (status) => STATUS[status]?.label ?? status;
export const statusDot = (status) => STATUS[status]?.dot ?? 'bg-stone-400';

export const VOTE_LABELS = { IN_FAVOR: 'A favor', AGAINST: 'Contra' };
