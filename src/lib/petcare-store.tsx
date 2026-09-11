import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Especie,
  Pet,
  Porte,
  Sexo,
  StatusAgendamento,
  Tutor,
  Veterinario,
  Servico,
  Agendamento,
  Produto,
  TransacaoFinanceira,
  TipoTransacao,
  StatusTransacao,
} from "@/lib/petcare";
import {
  PetCareContext,
  type PetCareContextValue,
  type PetInput,
  type TutorInput,
  type VeterinarioInput,
  type ServicoInput,
  type AgendamentoInput,
  type ProdutoInput,
  type TransacaoInput,
} from "@/lib/petcare-context";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";

export type { PetInput, TutorInput } from "@/lib/petcare-context";
export type { VeterinarioInput, ServicoInput, AgendamentoInput } from "@/lib/petcare-context";
export type { ProdutoInput, TransacaoInput } from "@/lib/petcare-context";

// ---------- Mapeadores ----------

interface TutorRow {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  endereco: string | null;
  criado_em: string;
  atualizado_em: string;
}

interface PetRow {
  id: string;
  tutor_id: string;
  nome: string;
  especie: string;
  raca: string | null;
  porte: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  observacoes_medicas: string | null;
  criado_em: string;
  atualizado_em: string;
  tutores?: { nome: string } | null;
}

interface VeterinarioRow {
  id: string;
  nome: string;
  crmv: string;
  especialidade: string;
  telefone: string;
  email: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

interface ServicoRow {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  duracao_minutos: number;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

interface AgendamentoRow {
  id: string;
  pet_id: string;
  veterinario_id: string | null;
  servico_id: string;
  data_hora: string;
  status: string;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  pets?: { nome: string; especie: string; tutores?: { nome: string } | null } | null;
  veterinarios?: { nome: string } | null;
  servicos?: { nome: string; preco: number; duracao_minutos: number } | null;
}

const tutorFromRow = (row: TutorRow): Tutor => ({
  id: row.id, nome: row.nome, cpf: row.cpf, email: row.email,
  telefone: row.telefone, endereco: row.endereco ?? "", criadoEm: row.criado_em,
});

const petFromRow = (row: PetRow): Pet => ({
  id: row.id, tutorId: row.tutor_id, tutorNome: row.tutores?.nome,
  nome: row.nome, especie: row.especie as Especie, raca: row.raca ?? "",
  porte: (row.porte ?? "Médio") as Porte, nascimento: row.data_nascimento ?? "",
  sexo: (row.sexo ?? "M") as Sexo, observacoes: row.observacoes_medicas ?? "",
  criadoEm: row.criado_em,
});

const veterinarioFromRow = (row: VeterinarioRow): Veterinario => ({
  id: row.id, nome: row.nome, crmv: row.crmv, especialidade: row.especialidade,
  telefone: row.telefone, email: row.email, ativo: row.ativo,
  criadoEm: row.criado_em, atualizadoEm: row.atualizado_em,
});

const servicoFromRow = (row: ServicoRow): Servico => ({
  id: row.id, nome: row.nome, descricao: row.descricao ?? "",
  preco: row.preco, duracaoMinutos: row.duracao_minutos, ativo: row.ativo,
  criadoEm: row.criado_em, atualizadoEm: row.atualizado_em,
});

const agendamentoFromRow = (row: AgendamentoRow): Agendamento => ({
  id: row.id, petId: row.pet_id, veterinarioId: row.veterinario_id ?? "",
  servicoId: row.servico_id, dataHora: row.data_hora,
  status: row.status as StatusAgendamento, observacoes: row.observacoes ?? "",
  criadoEm: row.criado_em, atualizadoEm: row.atualizado_em,
  petNome: row.pets?.nome, tutorNome: row.pets?.tutores?.nome,
  especie: row.pets?.especie as Especie | undefined,
  veterinarioNome: row.veterinarios?.nome,
  servicoNome: row.servicos?.nome, servicoPreco: row.servicos?.preco,
  servicoDuracao: row.servicos?.duracao_minutos,
});

const tutorToRow = (input: TutorInput) => ({
  nome: input.nome, cpf: input.cpf, email: input.email,
  telefone: input.telefone, endereco: input.endereco,
  atualizado_em: new Date().toISOString(),
});

const petToRow = (input: PetInput) => ({
  tutor_id: input.tutorId, nome: input.nome, especie: input.especie,
  raca: input.raca, porte: input.porte, data_nascimento: input.nascimento,
  sexo: input.sexo, observacoes_medicas: input.observacoes,
  atualizado_em: new Date().toISOString(),
});

const veterinarioToRow = (input: VeterinarioInput) => ({
  nome: input.nome, crmv: input.crmv, especialidade: input.especialidade,
  telefone: input.telefone, email: input.email, ativo: input.ativo,
  atualizado_em: new Date().toISOString(),
});

const servicoToRow = (input: ServicoInput) => ({
  nome: input.nome, descricao: input.descricao, preco: input.preco,
  duracao_minutos: input.duracaoMinutos, ativo: input.ativo,
  atualizado_em: new Date().toISOString(),
});

const agendamentoToRow = (input: AgendamentoInput) => ({
  pet_id: input.petId, veterinario_id: input.veterinarioId,
  servico_id: input.servicoId, data_hora: input.dataHora,
  status: input.status, observacoes: input.observacoes,
  atualizado_em: new Date().toISOString(),
});

interface ProdutoRow {
  id: string;
  nome: string;
  categoria: string;
  preco_custo: number | null;
  preco_venda: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  unidade_medida: string | null;
  data_validade: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

interface TransacaoRow {
  id: string;
  descricao: string;
  tipo: string;
  categoria: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  forma_pagamento: string | null;
  tutor_id: string | null;
  agendamento_id: string | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  tutores?: { nome: string } | null;
}

const produtoFromRow = (row: ProdutoRow): Produto => ({
  id: row.id, nome: row.nome, categoria: row.categoria,
  precoCusto: Number(row.preco_custo ?? 0), precoVenda: Number(row.preco_venda ?? 0),
  quantidadeEstoque: row.quantidade_estoque ?? 0, estoqueMinimo: row.estoque_minimo ?? 0,
  unidadeMedida: row.unidade_medida ?? "UN", dataValidade: row.data_validade ?? "",
  ativo: row.ativo, criadoEm: row.criado_em, atualizadoEm: row.atualizado_em,
});

const transacaoFromRow = (row: TransacaoRow): TransacaoFinanceira => ({
  id: row.id, descricao: row.descricao, tipo: row.tipo as TipoTransacao,
  categoria: row.categoria, valor: Number(row.valor ?? 0),
  dataVencimento: row.data_vencimento, dataPagamento: row.data_pagamento ?? "",
  status: row.status as StatusTransacao, formaPagamento: row.forma_pagamento ?? "",
  tutorId: row.tutor_id ?? "", agendamentoId: row.agendamento_id ?? "",
  observacoes: row.observacoes ?? "", criadoEm: row.criado_em, atualizadoEm: row.atualizado_em,
  tutorNome: row.tutores?.nome,
});

const produtoToRow = (input: ProdutoInput) => ({
  nome: input.nome, categoria: input.categoria,
  preco_custo: input.precoCusto, preco_venda: input.precoVenda,
  quantidade_estoque: input.quantidadeEstoque, estoque_minimo: input.estoqueMinimo,
  unidade_medida: input.unidadeMedida, data_validade: input.dataValidade || null,
  ativo: input.ativo, atualizado_em: new Date().toISOString(),
});

const transacaoToRow = (input: TransacaoInput) => ({
  descricao: input.descricao, tipo: input.tipo, categoria: input.categoria,
  valor: input.valor, data_vencimento: input.dataVencimento,
  data_pagamento: input.dataPagamento || null, status: input.status,
  forma_pagamento: input.formaPagamento || null,
  tutor_id: input.tutorId || null, agendamento_id: input.agendamentoId || null,
  observacoes: input.observacoes, atualizado_em: new Date().toISOString(),
});

const TRANSACAO_SELECT = "*, tutores(*)";

const PET_SELECT = "*, tutores(nome)";
const AGENDAMENTO_SELECT = "*, pets(nome, especie, tutores(nome)), veterinarios(nome), servicos(nome, preco, duracao_minutos)";

// ---------------------------------- Store ----------------------------------

export function PetCareProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const autenticado = Boolean(user);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<boolean> => {
    setError(null);
    const [tutoresRes, petsRes, vetsRes, servicosRes, agendRes, produtosRes, transRes] = await Promise.all([
      supabase.from("tutores").select("*").order("criado_em", { ascending: false }),
      supabase.from("pets").select(PET_SELECT).order("criado_em", { ascending: false }),
      supabase.from("veterinarios").select("*").order("nome"),
      supabase.from("servicos").select("*").order("nome"),
      supabase.from("agendamentos").select(AGENDAMENTO_SELECT).order("data_hora", { ascending: true }),
      supabase.from("produtos").select("*").order("nome"),
      supabase.from("transacoes_financeiras").select(TRANSACAO_SELECT).order("data_vencimento", { ascending: false }),
    ]);
    const err = tutoresRes.error ?? petsRes.error ?? vetsRes.error ?? servicosRes.error ?? agendRes.error ?? produtosRes.error ?? transRes.error;
    if (err) {
      setError("Não foi possível carregar os dados. Verifique se as tabelas foram criadas no Supabase.");
      return false;
    }
    setTutors(((tutoresRes.data ?? []) as TutorRow[]).map(tutorFromRow));
    setPets(((petsRes.data ?? []) as PetRow[]).map(petFromRow));
    setVeterinarios(((vetsRes.data ?? []) as VeterinarioRow[]).map(veterinarioFromRow));
    setServicos(((servicosRes.data ?? []) as ServicoRow[]).map(servicoFromRow));
    setAgendamentos(((agendRes.data ?? []) as AgendamentoRow[]).map(agendamentoFromRow));
    setProdutos(((produtosRes.data ?? []) as ProdutoRow[]).map(produtoFromRow));
    setTransacoes(((transRes.data ?? []) as unknown as TransacaoRow[]).map(transacaoFromRow));
    return true;
  }, []);

  useEffect(() => {
    if (!autenticado) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      await fetchData();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchData, autenticado]);

  const refresh = useCallback(async () => { await fetchData(); }, [fetchData]);

  // ---- Tutores ----
  const addTutor = useCallback(async (input: TutorInput): Promise<Tutor> => {
    const { data, error } = await supabase.from("tutores").insert(tutorToRow(input)).select().single();
    if (error) throw new Error(error.message);
    const tutor = tutorFromRow(data as TutorRow);
    setTutors((prev) => [tutor, ...prev]);
    return tutor;
  }, []);

  const updateTutor = useCallback(async (id: string, input: TutorInput): Promise<void> => {
    const { data, error } = await supabase.from("tutores").update(tutorToRow(input)).eq("id", id).select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi atualizada.");
    await fetchData();
  }, [fetchData]);

  const deleteTutor = useCallback(async (id: string): Promise<void> => {
    const { data, error } = await supabase.from("tutores").delete().eq("id", id).select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi excluída.");
    await fetchData();
  }, [fetchData]);

  // ---- Pets ----
  const addPet = useCallback(async (input: PetInput): Promise<Pet> => {
    const { data, error } = await supabase.from("pets").insert(petToRow(input)).select(PET_SELECT).single();
    if (error) throw new Error(error.message);
    const pet = petFromRow(data as PetRow);
    setPets((prev) => [pet, ...prev]);
    return pet;
  }, []);

  const updatePet = useCallback(async (id: string, input: PetInput): Promise<void> => {
    const { data, error } = await supabase.from("pets").update(petToRow(input)).eq("id", id).select(PET_SELECT);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi atualizada.");
    await fetchData();
  }, [fetchData]);

  const deletePet = useCallback(async (id: string): Promise<void> => {
    const { data, error } = await supabase.from("pets").delete().eq("id", id).select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi excluída.");
    await fetchData();
  }, [fetchData]);

  // ---- Veterinários ----
  const addVeterinario = useCallback(async (input: VeterinarioInput): Promise<Veterinario> => {
    const { data, error } = await supabase.from("veterinarios").insert(veterinarioToRow(input)).select().single();
    if (error) throw new Error(error.message);
    const vet = veterinarioFromRow(data as VeterinarioRow);
    setVeterinarios((prev) => [...prev, vet].sort((a, b) => a.nome.localeCompare(b.nome)));
    return vet;
  }, []);

  const updateVeterinario = useCallback(async (id: string, input: VeterinarioInput): Promise<void> => {
    const { data, error } = await supabase.from("veterinarios").update(veterinarioToRow(input)).eq("id", id).select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi atualizada.");
    await fetchData();
  }, [fetchData]);

  const deleteVeterinario = useCallback(async (id: string): Promise<void> => {
    // Preserva o nome do veterinário no histórico clínico (prontuários e vacinas)
    // antes de excluí-lo. Agendamentos ficam sem veterinário (aviso na agenda).
    const vet = veterinarios.find((v) => v.id === id);
    if (!vet) throw new Error("Veterinário não encontrado.");

    const { error: prontuariosError } = await supabase
      .from("prontuarios")
      .update({ veterinario_nome: vet.nome, veterinario_id: null })
      .eq("veterinario_id", id);
    if (prontuariosError) throw new Error(`Não foi possível preservar os prontuários: ${prontuariosError.message}`);

    const { error: vacinasError } = await supabase
      .from("vacinas")
      .update({ veterinario_nome: vet.nome, veterinario_id: null })
      .eq("veterinario_id", id);
    if (vacinasError) throw new Error(`Não foi possível preservar as vacinas: ${vacinasError.message}`);

    const { error: agendamentosError } = await supabase
      .from("agendamentos")
      .update({ veterinario_id: null })
      .eq("veterinario_id", id);
    if (agendamentosError) throw new Error(`Não foi possível desvincular os agendamentos: ${agendamentosError.message}`);

    const { data, error } = await supabase.from("veterinarios").delete().eq("id", id).select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi excluída.");
    await fetchData();
  }, [fetchData, veterinarios]);

  // ---- Serviços ----
  const addServico = useCallback(async (input: ServicoInput): Promise<Servico> => {
    const { data, error } = await supabase.from("servicos").insert(servicoToRow(input)).select().single();
    if (error) throw new Error(error.message);
    const s = servicoFromRow(data as ServicoRow);
    setServicos((prev) => [...prev, s].sort((a, b) => a.nome.localeCompare(b.nome)));
    return s;
  }, []);

  const updateServico = useCallback(async (id: string, input: ServicoInput): Promise<void> => {
    const { data, error } = await supabase.from("servicos").update(servicoToRow(input)).eq("id", id).select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi atualizada.");
    await fetchData();
  }, [fetchData]);

  const deleteServico = useCallback(async (id: string): Promise<void> => {
    const { data, error } = await supabase.from("servicos").delete().eq("id", id).select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi excluída.");
    await fetchData();
  }, [fetchData]);

  // ---- Agendamentos ----
  const addAgendamento = useCallback(async (input: AgendamentoInput): Promise<Agendamento> => {
    const { data, error } = await supabase.from("agendamentos").insert(agendamentoToRow(input)).select(AGENDAMENTO_SELECT).single();
    if (error) throw new Error(error.message);
    const a = agendamentoFromRow(data as AgendamentoRow);
    setAgendamentos((prev) => [...prev, a].sort((x, y) => x.dataHora.localeCompare(y.dataHora)));
    return a;
  }, []);

  const updateAgendamento = useCallback(async (id: string, input: AgendamentoInput): Promise<void> => {
    const { data, error } = await supabase.from("agendamentos").update(agendamentoToRow(input)).eq("id", id).select(AGENDAMENTO_SELECT);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi atualizada.");
    await fetchData();
  }, [fetchData]);

  const deleteAgendamento = useCallback(async (id: string): Promise<void> => {
    // Desvincula registros dependentes para evitar bloqueio por chave estrangeira
    await supabase.from("prontuarios").update({ agendamento_id: null }).eq("agendamento_id", id);
    await supabase
      .from("transacoes_financeiras")
      .update({ agendamento_id: null })
      .eq("agendamento_id", id);

    const { data, error } = await supabase.from("agendamentos").delete().eq("id", id).select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi excluída.");
    await fetchData();
  }, [fetchData]);


  // ---- Produtos ----
  const addProduto = useCallback(async (input: ProdutoInput): Promise<Produto> => {
    const { data, error } = await supabase.from("produtos").insert(produtoToRow(input)).select().single();
    if (error) throw new Error(error.message);
    const p = produtoFromRow(data as ProdutoRow);
    setProdutos((prev) => [...prev, p].sort((a, b) => a.nome.localeCompare(b.nome)));
    return p;
  }, []);

  const updateProduto = useCallback(async (id: string, input: ProdutoInput): Promise<void> => {
    const { data, error } = await supabase.from("produtos").update(produtoToRow(input)).eq("id", id).select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi atualizada.");
    await fetchData();
  }, [fetchData]);

  const deleteProduto = useCallback(async (id: string): Promise<void> => {
    const { data, error } = await supabase.from("produtos").delete().eq("id", id).select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi excluída.");
    await fetchData();
  }, [fetchData]);

  const ajustarEstoque = useCallback(async (id: string, delta: number): Promise<void> => {
    const atual = produtos.find((p) => p.id === id);
    if (!atual) throw new Error("Produto não encontrado.");
    const nova = Math.max(0, atual.quantidadeEstoque + delta);
    const { data, error } = await supabase
      .from("produtos")
      .update({ quantidade_estoque: nova, atualizado_em: new Date().toISOString() })
      .eq("id", id)
      .select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi atualizada.");
    setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, quantidadeEstoque: nova } : p)));
  }, [produtos]);

  // ---- Transações financeiras ----
  const addTransacao = useCallback(async (input: TransacaoInput): Promise<TransacaoFinanceira> => {
    const { data, error } = await supabase
      .from("transacoes_financeiras")
      .insert(transacaoToRow(input))
      .select(TRANSACAO_SELECT)
      .single();
    if (error) throw new Error(error.message);
    const t = transacaoFromRow(data as unknown as TransacaoRow);
    setTransacoes((prev) => [t, ...prev].sort((a, b) => b.dataVencimento.localeCompare(a.dataVencimento)));
    return t;
  }, []);

  const updateTransacao = useCallback(async (id: string, input: TransacaoInput): Promise<void> => {
    const { data, error } = await supabase
      .from("transacoes_financeiras")
      .update(transacaoToRow(input))
      .eq("id", id)
      .select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi atualizada.");
    await fetchData();
  }, [fetchData]);

  const deleteTransacao = useCallback(async (id: string): Promise<void> => {
    const { data, error } = await supabase.from("transacoes_financeiras").delete().eq("id", id).select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi excluída.");
    await fetchData();
  }, [fetchData]);

  const marcarComoPago = useCallback(async (id: string, formaPagamento?: string): Promise<void> => {
    const hoje = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const hojeISO = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`;
    const patch: Record<string, unknown> = {
      status: "Pago",
      data_pagamento: hojeISO,
      atualizado_em: new Date().toISOString(),
    };
    if (formaPagamento) patch['forma_pagamento'] = formaPagamento;
    const { data, error } = await supabase
      .from("transacoes_financeiras")
      .update(patch)
      .eq("id", id)
      .select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Nenhuma linha foi atualizada.");
    setTransacoes((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: "Pago" as StatusTransacao, dataPagamento: hojeISO, formaPagamento: formaPagamento ?? t.formaPagamento }
          : t,
      ),
    );
  }, []);

  const tutorById = useCallback((id: string) => tutors.find((t) => t.id === id), [tutors]);
  const petsByTutor = useCallback((tutorId: string) => pets.filter((p) => p.tutorId === tutorId), [pets]);

  const value = useMemo<PetCareContextValue>(() => ({
    tutors, pets, veterinarios, servicos, agendamentos, produtos, transacoes, loading, error, refresh,
    addTutor, updateTutor, deleteTutor, addPet, updatePet, deletePet,
    addVeterinario, updateVeterinario, deleteVeterinario,
    addServico, updateServico, deleteServico,
    addAgendamento, updateAgendamento, deleteAgendamento,
    addProduto, updateProduto, deleteProduto, ajustarEstoque,
    addTransacao, updateTransacao, deleteTransacao, marcarComoPago,
    tutorById, petsByTutor,
  }), [
    tutors, pets, veterinarios, servicos, agendamentos, produtos, transacoes, loading, error, refresh,
    addTutor, updateTutor, deleteTutor, addPet, updatePet, deletePet,
    addVeterinario, updateVeterinario, deleteVeterinario,
    addServico, updateServico, deleteServico,
    addAgendamento, updateAgendamento, deleteAgendamento,
    addProduto, updateProduto, deleteProduto, ajustarEstoque,
    addTransacao, updateTransacao, deleteTransacao, marcarComoPago,
    tutorById, petsByTutor,
  ]);

  return <PetCareContext.Provider value={value}>{children}</PetCareContext.Provider>;
}

export function usePetCare(): PetCareContextValue {
  const ctx = useContext(PetCareContext);
  if (!ctx) throw new Error("usePetCare deve ser usado dentro de PetCareProvider");
  return ctx;
}
