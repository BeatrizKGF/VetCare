import { Check, ChevronsUpDown, Loader2, PawPrint, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PetDialog } from "@/components/pet-dialog";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_CORES, formatCurrency, normalizeSearch, toDatetimeLocal, type Agendamento, type StatusAgendamento } from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";
import { cn } from "@/lib/utils";

interface AgendamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento?: Agendamento | null;
}

const emptyForm = {
  petId: "", veterinarioId: "", servicoId: "",
  dataHora: "", status: "Agendado" as StatusAgendamento, observacoes: "",
};

export function AgendamentoDialog({ open, onOpenChange, agendamento }: AgendamentoDialogProps) {
  const { tutors, pets, veterinarios, servicos, addAgendamento, updateAgendamento } = usePetCare();
  type FormErrors = Partial<Record<keyof typeof emptyForm | "tutorId", string>>;
  const [form, setForm] = useState(emptyForm);
  const [tutorId, setTutorId] = useState("");
  const [tutorPopoverOpen, setTutorPopoverOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [petDialogOpen, setPetDialogOpen] = useState(false);
  const isEditing = Boolean(agendamento);

  const activeVets = veterinarios.filter((v) => v.ativo);
  const activeServicos = servicos.filter((s) => s.ativo);

  const sortedTutors = useMemo(
    () => [...tutors].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [tutors],
  );
  const selectedTutor = tutors.find((t) => t.id === tutorId);
  const tutorPets = useMemo(
    () => pets.filter((p) => p.tutorId === tutorId),
    [pets, tutorId],
  );

  // Reseta o formulário apenas na transição fechado -> aberto, para que
  // mudanças em `pets` (ex.: pet cadastrado pelo próprio modal) não limpem o form.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened) return;
    setErrors({});
    setTutorPopoverOpen(false);
    setPetDialogOpen(false);
    if (agendamento) {
      setForm({
        petId: agendamento.petId, veterinarioId: agendamento.veterinarioId,
        servicoId: agendamento.servicoId,
        dataHora: toDatetimeLocal(agendamento.dataHora),
        status: agendamento.status, observacoes: agendamento.observacoes,
      });
      setTutorId(pets.find((p) => p.id === agendamento.petId)?.tutorId ?? "");
    } else {
      setForm(emptyForm);
      setTutorId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, agendamento]);

  const setField = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSelectTutor = (id: string) => {
    setTutorId(id);
    setTutorPopoverOpen(false);
    setErrors((prev) => ({ ...prev, tutorId: "", petId: "" }));
    // Ao trocar de tutor, limpa o pet se ele não pertencer ao novo tutor
    setForm((prev) => {
      const pet = pets.find((p) => p.id === prev.petId);
      return pet && pet.tutorId === id ? prev : { ...prev, petId: "" };
    });
  };

  const handleSubmit = async () => {
    const next: FormErrors = {};
    if (!tutorId) next.tutorId = "Busque e selecione o tutor.";
    if (!form.petId) next.petId = "Selecione o pet.";
    if (!form.veterinarioId) next.veterinarioId = "Selecione o veterinário.";
    if (!form.servicoId) next.servicoId = "Selecione o serviço.";
    if (!form.dataHora) next.dataHora = "Informe a data e hora.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      petId: form.petId, veterinarioId: form.veterinarioId,
      servicoId: form.servicoId,
      dataHora: new Date(form.dataHora).toISOString(),
      status: form.status, observacoes: form.observacoes.trim(),
    };

    setSaving(true);
    try {
      if (agendamento) {
        await updateAgendamento(agendamento.id, payload);
        toast.success("Agendamento atualizado com sucesso.");
      } else {
        await addAgendamento(payload);
        toast.success("Agendamento criado com sucesso.");
      }
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar o agendamento. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados do agendamento."
              : "Primeiro busque o tutor, depois selecione o pet e os detalhes do atendimento."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Passo 1: buscar tutor */}
          <div className="space-y-2">
            <Label>1. Tutor</Label>
            <Popover open={tutorPopoverOpen} onOpenChange={setTutorPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={tutorPopoverOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedTutor ? (
                    <span className="truncate">{selectedTutor.nome}</span>
                  ) : (
                    <span className="text-muted-foreground">Buscar tutor por nome...</span>
                  )}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command
                  filter={(value, search) =>
                    normalizeSearch(value).includes(normalizeSearch(search)) ? 1 : 0
                  }
                >
                  <CommandInput placeholder="Digite o nome do tutor..." />
                  <CommandList>
                    <CommandEmpty>Nenhum tutor encontrado.</CommandEmpty>
                    <CommandGroup>
                      {sortedTutors.map((t) => (
                        <CommandItem
                          key={t.id}
                          value={`${t.nome} ${t.cpf}`}
                          onSelect={() => handleSelectTutor(t.id)}
                        >
                          <Check
                            className={cn("mr-2 size-4", tutorId === t.id ? "opacity-100" : "opacity-0")}
                          />
                          <span className="flex-1 truncate">{t.nome}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{t.cpf}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.tutorId && <p className="text-xs text-destructive">{errors.tutorId}</p>}
          </div>

          {/* Passo 2: selecionar pet do tutor */}
          <div className="space-y-2">
            <Label>2. Pet</Label>
            <Select
              value={form.petId}
              onValueChange={(v) => setField("petId", v)}
              disabled={!tutorId || tutorPets.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    tutorId
                      ? tutorPets.length > 0
                        ? "Selecione o pet"
                        : "Este tutor não possui pets cadastrados"
                      : "Selecione um tutor primeiro"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {tutorPets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-1.5">
                      <PawPrint className="size-3.5 text-pet-mint" />
                      {p.nome} ({p.especie})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tutorId && tutorPets.length === 0 && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  {selectedTutor?.nome} ainda não tem pets cadastrados.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setPetDialogOpen(true)}
                >
                  <Plus className="size-4" /> Cadastrar pet
                </Button>
              </div>
            )}
            {errors.petId && <p className="text-xs text-destructive">{errors.petId}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Veterinário</Label>
              <Select value={form.veterinarioId} onValueChange={(v) => setField("veterinarioId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {activeVets.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.nome} — {v.especialidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.veterinarioId && <p className="text-xs text-destructive">{errors.veterinarioId}</p>}
            </div>

            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select value={form.servicoId} onValueChange={(v) => setField("servicoId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {activeServicos.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome} — {formatCurrency(s.preco)} ({s.duracaoMinutos}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.servicoId && <p className="text-xs text-destructive">{errors.servicoId}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ag-data">Data e hora</Label>
              <Input id="ag-data" type="datetime-local" value={form.dataHora}
                onChange={(e) => setField("dataHora", e.target.value)} />
              {errors.dataHora && <p className="text-xs text-destructive">{errors.dataHora}</p>}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setField("status", v as StatusAgendamento)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(STATUS_CORES).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ag-obs">Observações / Queixa principal</Label>
            <Textarea id="ag-obs" rows={3} placeholder="Descreva o motivo da consulta ou observações relevantes..."
              value={form.observacoes} onChange={(e) => setField("observacoes", e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={saving} onClick={handleSubmit}>
              {saving ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : isEditing ? "Salvar alterações" : "Agendar"}
            </Button>
          </DialogFooter>
        </div>

        <PetDialog
          open={petDialogOpen}
          onOpenChange={setPetDialogOpen}
          defaultTutorId={tutorId || undefined}
          onCreated={(pet) => setField("petId", pet.id)}
        />
      </DialogContent>
    </Dialog>
  );
}
