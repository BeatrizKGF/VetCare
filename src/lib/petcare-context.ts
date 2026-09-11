import { createContext } from "react";
import type { Pet, Tutor, Veterinario, Servico, Agendamento, Produto, TransacaoFinanceira } from "@/lib/petcare";

export type TutorInput = Omit<Tutor, "id" | "criadoEm">;
export type PetInput = Omit<Pet, "id" | "criadoEm">;
export type VeterinarioInput = Omit<Veterinario, "id" | "criadoEm" | "atualizadoEm">;
export type ServicoInput = Omit<Servico, "id" | "criadoEm" | "atualizadoEm">;
export type ProdutoInput = Omit<Produto, "id" | "criadoEm" | "atualizadoEm">;
export type TransacaoInput = Omit<TransacaoFinanceira, "id" | "criadoEm" | "atualizadoEm" | "tutorNome">;
export type AgendamentoInput = Omit<Agendamento, "id" | "criadoEm" | "atualizadoEm" | "petNome" | "tutorNome" | "especie" | "veterinarioNome" | "servicoNome" | "servicoPreco" | "servicoDuracao">;

export interface PetCareContextValue {
  tutors: Tutor[];
  pets: Pet[];
  veterinarios: Veterinario[];
  servicos: Servico[];
  agendamentos: Agendamento[];
  produtos: Produto[];
  transacoes: TransacaoFinanceira[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addTutor: (input: TutorInput) => Promise<Tutor>;
  updateTutor: (id: string, input: TutorInput) => Promise<void>;
  deleteTutor: (id: string) => Promise<void>;
  addPet: (input: PetInput) => Promise<Pet>;
  updatePet: (id: string, input: PetInput) => Promise<void>;
  deletePet: (id: string) => Promise<void>;
  addVeterinario: (input: VeterinarioInput) => Promise<Veterinario>;
  updateVeterinario: (id: string, input: VeterinarioInput) => Promise<void>;
  deleteVeterinario: (id: string) => Promise<void>;
  addServico: (input: ServicoInput) => Promise<Servico>;
  updateServico: (id: string, input: ServicoInput) => Promise<void>;
  deleteServico: (id: string) => Promise<void>;
  addAgendamento: (input: AgendamentoInput) => Promise<Agendamento>;
  updateAgendamento: (id: string, input: AgendamentoInput) => Promise<void>;
  deleteAgendamento: (id: string) => Promise<void>;
  addProduto: (input: ProdutoInput) => Promise<Produto>;
  updateProduto: (id: string, input: ProdutoInput) => Promise<void>;
  deleteProduto: (id: string) => Promise<void>;
  ajustarEstoque: (id: string, delta: number) => Promise<void>;
  addTransacao: (input: TransacaoInput) => Promise<TransacaoFinanceira>;
  updateTransacao: (id: string, input: TransacaoInput) => Promise<void>;
  deleteTransacao: (id: string) => Promise<void>;
  marcarComoPago: (id: string, formaPagamento?: string) => Promise<void>;
  tutorById: (id: string) => Tutor | undefined;
  petsByTutor: (tutorId: string) => Pet[];
}

// Contexto em módulo separado para manter identidade estável durante HMR
export const PetCareContext = createContext<PetCareContextValue | null>(null);
