import { FileText, Loader2, Pencil, Pill, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";
import {
  createProntuario, fetchProntuarioByAgendamento, updateProntuario,
  type PrescricaoInput, type Prontuario,
} from "@/lib/prontuario";

interface ProntuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPetId?: string | undefined;
  defaultVeterinarioId?: string | undefined;
  defaultAgendamentoId?: string | undefined;
  /** Bloqueia a troca de pet (quando aberto pela ficha do pet). */
  lockPet?: boolean;
  /** Define se o modal abre travado (Concluído) ou editável (Em Atendimento). */
  initialReadOnly?: boolean;
  /** Ao abrir, busca o atendimento já registrado para o agendamento. */
  loadExisting?: boolean;
  onSaved?: () => void;
}

interface PrescricaoForm extends Omit<PrescricaoInput, "duracaoDias"> {
  duracaoDias: string;
}

const emptyPrescricao: PrescricaoForm = {
  medicamento: "", dosagem: "", frequencia: "", duracaoDias: "", instrucoesUso: "",
};

const NENHUM = "__nenhum__";

export function ProntuarioDialog({
  open, onOpenChange, defaultPetId, defaultVeterinarioId, defaultAgendamentoId,
  lockPet, initialReadOnly, loadExisting, onSaved,
}: ProntuarioDialogProps) {
  const { pets, veterinarios, agendamentos } = usePetCare();
  const [petId, setPetId] = useState("");
  const [veterinarioId, setVeterinarioId] = useState("");
  const [agendamentoId, setAgendamentoId] = useState(NENHUM);
  const [peso, setPeso] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [fc, setFc] = useState("");
  const [queixa, setQueixa] = useState("");
  const [exame, setExame] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamento, setTratamento] = useState("");
  const [prescricoes, setPrescricoes] = useState<PrescricaoForm[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<Prontuario | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fillFrom = (p: Prontuario) => {
    setPetId(p.petId);
    setVeterinarioId(p.veterinarioId);
    setAgendamentoId(p.agendamentoId ?? NENHUM);
    setPeso(p.pesoKg === null ? "" : String(p.pesoKg));
    setTemperatura(p.temperaturaC === null ? "" : String(p.temperaturaC));
    setFc(p.frequenciaCardiaca === null ? "" : String(p.frequenciaCardiaca));
    setQueixa(p.queixaPrincipal);
    setExame(p.exameFisico);
    setDiagnostico(p.diagnostico);
    setTratamento(p.tratamentoRecomendado);
    setPrescricoes(
      p.prescricoes.map((pr) => ({
        medicamento: pr.medicamento,
        dosagem: pr.dosagem,
        frequencia: pr.frequencia,
        duracaoDias: String(pr.duracaoDias),
        instrucoesUso: pr.instrucoesUso,
      })),
    );
  };

  useEffect(() => {
    if (!open) return;
    const startLocked = initialReadOnly ?? false;
    setErrors({});
    setExisting(null);
    setReadOnly(startLocked);
    setNotFound(false);
    setPetId(defaultPetId ?? "");
    setVeterinarioId(defaultVeterinarioId ?? "");
    setAgendamentoId(defaultAgendamentoId ?? NENHUM);
    setPeso(""); setTemperatura(""); setFc("");
    setQueixa(""); setExame(""); setDiagnostico(""); setTratamento("");
    setPrescricoes([]);

    if (loadExisting && defaultAgendamentoId) {
      let cancelled = false;
      setLoading(true);
      fetchProntuarioByAgendamento(defaultAgendamentoId)
        .then((p) => {
          if (cancelled) return;
          if (p) {
            setExisting(p);
            setNotFound(false);
            fillFrom(p);
          } else {
            setExisting(null);
            setNotFound(startLocked); // só exibe "não registrado" quando concluído
          }
          setReadOnly(startLocked);
        })
        .catch(() => {
          if (!cancelled) toast.error("Não foi possível carregar o atendimento.");
        })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }
    return;
  }, [open, defaultPetId, defaultVeterinarioId, defaultAgendamentoId, loadExisting, initialReadOnly]);

  const vetsAtivos = veterinarios.filter((v) => v.ativo || v.id === veterinarioId);
  const agendamentosDoPet = agendamentos.filter((a) => !petId || a.petId === petId);

  const updatePrescricao = (index: number, field: keyof PrescricaoForm, value: string) => {
    setPrescricoes((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  const handleSubmit = async () => {
    const next: Record<string, string> = {};
    if (!petId) next["petId"] = "Selecione o pet.";
    if (!veterinarioId) next["veterinarioId"] = "Selecione o veterinário responsável.";
    if (!queixa.trim()) next["queixa"] = "Informe a queixa principal.";
    prescricoes.forEach((p, i) => {
      if (!p.medicamento.trim() || !p.dosagem.trim() || !p.frequencia.trim() || !p.duracaoDias.trim()) {
        next[`presc-${i}`] = "Preencha medicamento, dosagem, frequência e duração.";
      }
    });
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const toNum = (v: string): number | null => {
      const n = parseFloat(v.replace(",", "."));
      return v.trim() === "" || Number.isNaN(n) ? null : n;
    };

    const payload = {
      petId,
      veterinarioId,
      agendamentoId: agendamentoId === NENHUM ? null : agendamentoId,
      dataAtendimento: existing?.dataAtendimento ?? new Date().toISOString(),
      pesoKg: toNum(peso),
      temperaturaC: toNum(temperatura),
      frequenciaCardiaca: fc.trim() ? parseInt(fc, 10) : null,
      queixaPrincipal: queixa.trim(),
      exameFisico: exame.trim(),
      diagnostico: diagnostico.trim(),
      tratamentoRecomendado: tratamento.trim(),
      prescricoes: prescricoes.map((p) => ({
        medicamento: p.medicamento.trim(),
        dosagem: p.dosagem.trim(),
        frequencia: p.frequencia.trim(),
        duracaoDias: parseInt(p.duracaoDias, 10) || 0,
        instrucoesUso: p.instrucoesUso.trim(),
      })),
    };

    setSaving(true);
    try {
      if (existing) {
        const updated = await updateProntuario(existing.id, payload);
        setExisting(updated);
        setReadOnly(true);
        toast.success("Atendimento atualizado com sucesso.");
        onSaved?.();
      } else {
        await createProntuario(payload);
        toast.success("Atendimento registrado com sucesso.");
        onSaved?.();
        onOpenChange(false);
      }
    } catch (e) {
      toast.error(
        e instanceof Error && e.message.includes("does not exist")
          ? "Tabelas de prontuário ainda não criadas no banco. Rode o supabase-setup.sql."
          : "Não foi possível salvar o atendimento.",
      );
    } finally {
      setSaving(false);
    }
  };

  const ro = readOnly;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {notFound
              ? "Atendimento não registrado"
              : existing
                ? (ro ? "Ver atendimento" : "Editar atendimento")
                : "Novo Atendimento"}
          </DialogTitle>
          <DialogDescription>
            {notFound
              ? "Este agendamento está concluído, mas ainda não possui um prontuário registrado."
              : existing
                ? (ro
                    ? `Atendimento registrado em ${formatDateTime(existing.dataAtendimento)}. Clique em "Editar atendimento" para alterar.`
                    : "Altere os dados clínicos e salve as mudanças.")
                : "Registre a consulta clínica, os sinais vitais e as prescrições do pet."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando atendimento...
          </div>
        ) : notFound ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <FileText className="size-7 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold">Atendimento não registrado</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Este agendamento está concluído, mas ainda não possui um prontuário. Clique em "Registrar atendimento" para preencher os dados.
            </p>
          </div>
        ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Pet</Label>
              <Select value={petId} onValueChange={setPetId} disabled={Boolean(lockPet) || ro}>
                <SelectTrigger><SelectValue placeholder="Selecione o pet" /></SelectTrigger>
                <SelectContent>
                  {pets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} — {p.tutorNome ?? "sem tutor"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors["petId"] && <p className="text-xs text-destructive">{errors["petId"]}</p>}
            </div>

            <div className="space-y-2">
              <Label>Veterinário responsável</Label>
              <Select value={veterinarioId} onValueChange={setVeterinarioId} disabled={ro}>
                <SelectTrigger><SelectValue placeholder="Selecione o veterinário" /></SelectTrigger>
                <SelectContent>
                  {vetsAtivos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.nome} — {v.crmv}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors["veterinarioId"] && <p className="text-xs text-destructive">{errors["veterinarioId"]}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Agendamento vinculado (opcional)</Label>
            <Select value={agendamentoId} onValueChange={setAgendamentoId} disabled={ro}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NENHUM}>Nenhum</SelectItem>
                {agendamentosDoPet.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {formatDateTime(a.dataHora)} — {a.servicoNome ?? "serviço"} ({a.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-sm font-bold">Sinais vitais</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="pr-peso">Peso (kg)</Label>
                <Input id="pr-peso" inputMode="decimal" placeholder="Ex.: 12,5" disabled={ro}
                  value={peso} onChange={(e) => setPeso(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pr-temp">Temperatura (°C)</Label>
                <Input id="pr-temp" inputMode="decimal" placeholder="Ex.: 38,5" disabled={ro}
                  value={temperatura} onChange={(e) => setTemperatura(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pr-fc">Freq. cardíaca (BPM)</Label>
                <Input id="pr-fc" inputMode="numeric" placeholder="Ex.: 110" disabled={ro}
                  value={fc} onChange={(e) => setFc(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pr-queixa">Queixa principal</Label>
            <Textarea id="pr-queixa" rows={2} placeholder="Motivo da consulta relatado pelo tutor" disabled={ro}
              value={queixa} onChange={(e) => setQueixa(e.target.value)} />
            {errors["queixa"] && <p className="text-xs text-destructive">{errors["queixa"]}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pr-exame">Exame físico</Label>
              <Textarea id="pr-exame" rows={3} disabled={ro} value={exame} onChange={(e) => setExame(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pr-diag">Diagnóstico</Label>
              <Textarea id="pr-diag" rows={3} disabled={ro} value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pr-trat">Tratamento recomendado</Label>
            <Textarea id="pr-trat" rows={2} disabled={ro} value={tratamento} onChange={(e) => setTratamento(e.target.value)} />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-bold">
                <Pill className="size-4 text-primary" /> Prescrição médica
              </p>
              {!ro && (
                <Button type="button" variant="outline" size="sm"
                  onClick={() => setPrescricoes((prev) => [...prev, { ...emptyPrescricao }])}>
                  <Plus className="size-4" /> Adicionar medicamento
                </Button>
              )}
            </div>

            {prescricoes.length === 0 && (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                {ro ? "Nenhum medicamento prescrito neste atendimento." : "Nenhum medicamento adicionado. Este campo é opcional."}
              </p>
            )}

            {prescricoes.map((p, i) => (
              <div key={i} className="space-y-3 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Medicamento {i + 1}
                  </p>
                  {!ro && (
                    <Button type="button" variant="ghost" size="icon" aria-label="Remover medicamento"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setPrescricoes((prev) => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Medicamento" value={p.medicamento} disabled={ro}
                    onChange={(e) => updatePrescricao(i, "medicamento", e.target.value)} />
                  <Input placeholder="Dosagem (ex.: 250 mg)" value={p.dosagem} disabled={ro}
                    onChange={(e) => updatePrescricao(i, "dosagem", e.target.value)} />
                  <Input placeholder="Frequência (ex.: a cada 12h)" value={p.frequencia} disabled={ro}
                    onChange={(e) => updatePrescricao(i, "frequencia", e.target.value)} />
                  <Input inputMode="numeric" placeholder="Duração (dias)" value={p.duracaoDias} disabled={ro}
                    onChange={(e) => updatePrescricao(i, "duracaoDias", e.target.value)} />
                </div>
                <Textarea rows={2} placeholder="Instruções de uso" value={p.instrucoesUso} disabled={ro}
                  onChange={(e) => updatePrescricao(i, "instrucoesUso", e.target.value)} />
                {errors[`presc-${i}`] && (
                  <p className="text-xs text-destructive">{errors[`presc-${i}`]}</p>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            {ro ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                <Button type="button" onClick={() => setReadOnly(false)}>
                  <Pencil className="size-4" /> {notFound ? "Registrar atendimento" : "Editar atendimento"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => (existing ? (fillFrom(existing), setReadOnly(true)) : onOpenChange(false))}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={saving}>
                  {saving
                    ? <><Loader2 className="size-4 animate-spin" /> Salvando...</>
                    : existing ? "Salvar alterações" : "Salvar atendimento"}
                </Button>
              </>
            )}
          </DialogFooter>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
