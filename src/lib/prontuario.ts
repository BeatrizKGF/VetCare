import { supabase } from "@/lib/supabase";

// ---------------------------------- Tipos ----------------------------------

export interface Prescricao {
  id: string;
  prontuarioId: string;
  medicamento: string;
  dosagem: string;
  frequencia: string;
  duracaoDias: number;
  instrucoesUso: string;
  criadoEm: string;
}

export interface Prontuario {
  id: string;
  petId: string;
  veterinarioId: string;
  veterinarioNome: string;
  agendamentoId: string | null;
  dataAtendimento: string;
  pesoKg: number | null;
  temperaturaC: number | null;
  frequenciaCardiaca: number | null;
  queixaPrincipal: string;
  exameFisico: string;
  diagnostico: string;
  tratamentoRecomendado: string;
  criadoEm: string;
  prescricoes: Prescricao[];
}

export interface Vacina {
  id: string;
  petId: string;
  veterinarioId: string;
  veterinarioNome: string;
  nomeVacina: string;
  lote: string;
  dataAplicacao: string;
  dataProximaDose: string;
  observacoes: string;
  criadoEm: string;
}

export interface PrescricaoInput {
  medicamento: string;
  dosagem: string;
  frequencia: string;
  duracaoDias: number;
  instrucoesUso: string;
}

export interface ProntuarioInput {
  petId: string;
  veterinarioId: string;
  agendamentoId: string | null;
  dataAtendimento: string;
  pesoKg: number | null;
  temperaturaC: number | null;
  frequenciaCardiaca: number | null;
  queixaPrincipal: string;
  exameFisico: string;
  diagnostico: string;
  tratamentoRecomendado: string;
  prescricoes: PrescricaoInput[];
}

export interface VacinaInput {
  petId: string;
  veterinarioId: string;
  nomeVacina: string;
  lote: string;
  dataAplicacao: string;
  dataProximaDose: string;
  observacoes: string;
}

// --------------------------------- Mapeadores -------------------------------

interface PrescricaoRow {
  id: string;
  prontuario_id: string;
  medicamento: string;
  dosagem: string;
  frequencia: string;
  duracao_dias: number;
  instrucoes_uso: string | null;
  criado_em: string;
}

interface ProntuarioRow {
  id: string;
  pet_id: string;
  veterinario_id: string | null;
  veterinario_nome?: string | null;
  agendamento_id: string | null;
  data_atendimento: string;
  peso_kg: number | string | null;
  temperatura_c: number | string | null;
  frequencia_cardiaca: number | null;
  queixa_principal: string;
  exame_fisico: string | null;
  diagnostico: string | null;
  tratamento_recomendado: string | null;
  criado_em: string;
  veterinarios?: { nome: string } | null;
  prescricoes?: PrescricaoRow[] | null;
}

interface VacinaRow {
  id: string;
  pet_id: string;
  veterinario_id: string | null;
  veterinario_nome?: string | null;
  nome_vacina: string;
  lote: string | null;
  data_aplicacao: string;
  data_proxima_dose: string | null;
  observacoes: string | null;
  criado_em: string;
  veterinarios?: { nome: string } | null;
}

const num = (v: number | string | null): number | null =>
  v === null || v === "" ? null : Number(v);

const prescricaoFromRow = (row: PrescricaoRow): Prescricao => ({
  id: row.id,
  prontuarioId: row.prontuario_id,
  medicamento: row.medicamento,
  dosagem: row.dosagem,
  frequencia: row.frequencia,
  duracaoDias: row.duracao_dias,
  instrucoesUso: row.instrucoes_uso ?? "",
  criadoEm: row.criado_em,
});

const prontuarioFromRow = (row: ProntuarioRow): Prontuario => ({
  id: row.id,
  petId: row.pet_id,
  veterinarioId: row.veterinario_id ?? "",
  veterinarioNome: row.veterinarios?.nome ?? row.veterinario_nome ?? "—",
  agendamentoId: row.agendamento_id,
  dataAtendimento: row.data_atendimento,
  pesoKg: num(row.peso_kg),
  temperaturaC: num(row.temperatura_c),
  frequenciaCardiaca: row.frequencia_cardiaca,
  queixaPrincipal: row.queixa_principal,
  exameFisico: row.exame_fisico ?? "",
  diagnostico: row.diagnostico ?? "",
  tratamentoRecomendado: row.tratamento_recomendado ?? "",
  criadoEm: row.criado_em,
  prescricoes: (row.prescricoes ?? []).map(prescricaoFromRow),
});

const vacinaFromRow = (row: VacinaRow): Vacina => ({
  id: row.id,
  petId: row.pet_id,
  veterinarioId: row.veterinario_id ?? "",
  veterinarioNome: row.veterinarios?.nome ?? row.veterinario_nome ?? "—",
  nomeVacina: row.nome_vacina,
  lote: row.lote ?? "",
  dataAplicacao: row.data_aplicacao,
  dataProximaDose: row.data_proxima_dose ?? "",
  observacoes: row.observacoes ?? "",
  criadoEm: row.criado_em,
});

// ---------------------------------- API -------------------------------------

export async function fetchProntuarios(petId: string): Promise<Prontuario[]> {
  const { data, error } = await supabase
    .from("prontuarios")
    .select("*, veterinarios(*), prescricoes(*)")
    .eq("pet_id", petId)
    .order("data_atendimento", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ProntuarioRow[]).map(prontuarioFromRow);
}

export async function fetchVacinas(petId: string): Promise<Vacina[]> {
  const { data, error } = await supabase
    .from("vacinas")
    .select("*, veterinarios(*)")
    .eq("pet_id", petId)
    .order("data_aplicacao", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as VacinaRow[]).map(vacinaFromRow);
}

export async function createProntuario(input: ProntuarioInput): Promise<Prontuario> {
  const { data, error } = await supabase
    .from("prontuarios")
    .insert({
      pet_id: input.petId,
      veterinario_id: input.veterinarioId,
      agendamento_id: input.agendamentoId,
      data_atendimento: input.dataAtendimento,
      peso_kg: input.pesoKg,
      temperatura_c: input.temperaturaC,
      frequencia_cardiaca: input.frequenciaCardiaca,
      queixa_principal: input.queixaPrincipal,
      exame_fisico: input.exameFisico,
      diagnostico: input.diagnostico,
      tratamento_recomendado: input.tratamentoRecomendado,
    })
    .select("*, veterinarios(*)")
    .single();
  if (error) throw new Error(error.message);

  const prontuario = prontuarioFromRow(data as ProntuarioRow);

  if (input.prescricoes.length > 0) {
    const { data: presc, error: prescError } = await supabase
      .from("prescricoes")
      .insert(
        input.prescricoes.map((p) => ({
          prontuario_id: prontuario.id,
          medicamento: p.medicamento,
          dosagem: p.dosagem,
          frequencia: p.frequencia,
          duracao_dias: p.duracaoDias,
          instrucoes_uso: p.instrucoesUso,
        })),
      )
      .select();
    if (prescError) throw new Error(prescError.message);
    prontuario.prescricoes = ((presc ?? []) as PrescricaoRow[]).map(prescricaoFromRow);
  }

  return prontuario;
}

export async function fetchProntuarioByAgendamento(
  agendamentoId: string,
): Promise<Prontuario | null> {
  const { data, error } = await supabase
    .from("prontuarios")
    .select("*, veterinarios(*), prescricoes(*)")
    .eq("agendamento_id", agendamentoId)
    .order("data_atendimento", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ProntuarioRow[];
  return rows[0] ? prontuarioFromRow(rows[0]) : null;
}

export async function updateProntuario(
  id: string,
  input: ProntuarioInput,
): Promise<Prontuario> {
  const { data, error } = await supabase
    .from("prontuarios")
    .update({
      pet_id: input.petId,
      veterinario_id: input.veterinarioId,
      agendamento_id: input.agendamentoId,
      peso_kg: input.pesoKg,
      temperatura_c: input.temperaturaC,
      frequencia_cardiaca: input.frequenciaCardiaca,
      queixa_principal: input.queixaPrincipal,
      exame_fisico: input.exameFisico,
      diagnostico: input.diagnostico,
      tratamento_recomendado: input.tratamentoRecomendado,
    })
    .eq("id", id)
    .select("*, veterinarios(*)")
    .single();
  if (error) throw new Error(error.message);

  const prontuario = prontuarioFromRow(data as ProntuarioRow);

  const { error: delError } = await supabase
    .from("prescricoes")
    .delete()
    .eq("prontuario_id", id);
  if (delError) throw new Error(delError.message);

  if (input.prescricoes.length > 0) {
    const { data: presc, error: prescError } = await supabase
      .from("prescricoes")
      .insert(
        input.prescricoes.map((p) => ({
          prontuario_id: id,
          medicamento: p.medicamento,
          dosagem: p.dosagem,
          frequencia: p.frequencia,
          duracao_dias: p.duracaoDias,
          instrucoes_uso: p.instrucoesUso,
        })),
      )
      .select();
    if (prescError) throw new Error(prescError.message);
    prontuario.prescricoes = ((presc ?? []) as PrescricaoRow[]).map(prescricaoFromRow);
  }

  return prontuario;
}

export async function deleteProntuario(id: string): Promise<void> {
  const { error } = await supabase.from("prontuarios").delete().eq("id", id);
  if (error) throw new Error(error.message);
}


export async function createVacina(input: VacinaInput): Promise<Vacina> {
  const { data, error } = await supabase
    .from("vacinas")
    .insert({
      pet_id: input.petId,
      veterinario_id: input.veterinarioId,
      nome_vacina: input.nomeVacina,
      lote: input.lote,
      data_aplicacao: input.dataAplicacao,
      data_proxima_dose: input.dataProximaDose || null,
      observacoes: input.observacoes,
    })
    .select("*, veterinarios(*)")
    .single();
  if (error) throw new Error(error.message);
  return vacinaFromRow(data as VacinaRow);
}

export async function deleteVacina(id: string): Promise<void> {
  const { error } = await supabase.from("vacinas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Lista os atendimentos mais recentes de toda a clínica. */
export async function fetchProntuariosRecentes(limit = 200): Promise<Prontuario[]> {
  const { data, error } = await supabase
    .from("prontuarios")
    .select("*, veterinarios(*), prescricoes(*)")
    .order("data_atendimento", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data ?? []) as ProntuarioRow[]).map(prontuarioFromRow);
}

export interface VacinaProxima extends Vacina {
  petNome: string;
  tutorNome: string;
}

interface VacinaProximaRow extends VacinaRow {
  pets?: { nome: string; tutores?: { nome: string } | null } | null;
}

/** Vacinas com próxima dose vencendo nos próximos `dias` dias (a partir de hoje). */
export async function fetchVacinasProximas(dias = 30): Promise<VacinaProxima[]> {
  const hoje = new Date();
  const limite = new Date(hoje.getTime() + dias * 86400000);
  const iso = (d: Date) => d.toLocaleDateString("sv-SE");
  const { data, error } = await supabase
    .from("vacinas")
    .select("*, veterinarios(nome), pets(nome, tutores(nome))")
    .gte("data_proxima_dose", iso(hoje))
    .lte("data_proxima_dose", iso(limite))
    .order("data_proxima_dose", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as VacinaProximaRow[]).map((row) => ({
    ...vacinaFromRow(row),
    petNome: row.pets?.nome ?? "—",
    tutorNome: row.pets?.tutores?.nome ?? "—",
  }));
}
