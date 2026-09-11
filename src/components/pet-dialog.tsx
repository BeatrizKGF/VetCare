import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ESPECIES,
  PORTES,
  type Especie,
  type Pet,
  type Porte,
  type Sexo,
} from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

interface PetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet?: Pet | null;
  /** Pré-seleciona o tutor ao cadastrar um novo pet (ex.: vindo do agendamento). */
  defaultTutorId?: string | undefined;
  /** Chamado após o cadastro de um novo pet (não na edição). */
  onCreated?: (pet: Pet) => void;
}

const emptyForm = {
  nome: "",
  tutorId: "",
  especie: "" as Especie | "",
  raca: "",
  porte: "" as Porte | "",
  nascimento: "",
  sexo: "" as Sexo | "",
  observacoes: "",
};

export function PetDialog({ open, onOpenChange, pet, defaultTutorId, onCreated }: PetDialogProps) {
  const { tutors, addPet, updatePet } = usePetCare();
  type FormErrors = Partial<Record<keyof typeof emptyForm, string>>;
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(pet);

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(
        pet
          ? {
              nome: pet.nome,
              tutorId: pet.tutorId,
              especie: pet.especie,
              raca: pet.raca,
              porte: pet.porte,
              nascimento: pet.nascimento,
              sexo: pet.sexo,
              observacoes: pet.observacoes,
            }
          : { ...emptyForm, tutorId: defaultTutorId ?? "" },
      );
    }
  }, [open, pet, defaultTutorId]);

  const setField = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    if (!form.nome.trim()) next.nome = "Informe o nome do pet.";
    if (!form.tutorId) next.tutorId = "Selecione o tutor responsável.";
    if (!form.especie) next.especie = "Selecione a espécie.";
    if (!form.raca.trim()) next.raca = "Informe a raça.";
    if (!form.porte) next.porte = "Selecione o porte.";
    if (!form.nascimento) next.nascimento = "Informe a data de nascimento.";
    if (!form.sexo) next.sexo = "Selecione o sexo.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      nome: form.nome.trim(),
      tutorId: form.tutorId,
      especie: form.especie as Especie,
      raca: form.raca.trim(),
      porte: form.porte as Porte,
      nascimento: form.nascimento,
      sexo: form.sexo as Sexo,
      observacoes: form.observacoes.trim(),
    };

    setSaving(true);
    try {
      if (pet) {
        await updatePet(pet.id, payload);
        toast.success(`Pet "${payload.nome}" atualizado com sucesso.`);
      } else {
        const created = await addPet(payload);
        toast.success(`Pet "${payload.nome}" cadastrado com sucesso.`);
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar o pet. Verifique a conexão com o banco de dados.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Pet" : "Novo Pet"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do pet."
              : "Preencha os dados e vincule o pet a um tutor."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pet-nome">Nome do pet</Label>
              <Input
                id="pet-nome"
                placeholder="Ex.: Thor"
                value={form.nome}
                onChange={(e) => setField("nome", e.target.value)}
              />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tutor responsável</Label>
              <Select value={form.tutorId} onValueChange={(v) => setField("tutorId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tutor" />
                </SelectTrigger>
                <SelectContent>
                  {tutors.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tutorId && <p className="text-xs text-destructive">{errors.tutorId}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Espécie</Label>
              <Select
                value={form.especie}
                onValueChange={(v) => setField("especie", v as Especie)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ESPECIES.map((esp) => (
                    <SelectItem key={esp} value={esp}>
                      {esp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.especie && <p className="text-xs text-destructive">{errors.especie}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pet-raca">Raça</Label>
              <Input
                id="pet-raca"
                placeholder="Ex.: Golden Retriever"
                value={form.raca}
                onChange={(e) => setField("raca", e.target.value)}
              />
              {errors.raca && <p className="text-xs text-destructive">{errors.raca}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Porte</Label>
              <Select value={form.porte} onValueChange={(v) => setField("porte", v as Porte)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PORTES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.porte && <p className="text-xs text-destructive">{errors.porte}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pet-nascimento">Nascimento</Label>
              <Input
                id="pet-nascimento"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={form.nascimento}
                onChange={(e) => setField("nascimento", e.target.value)}
              />
              {errors.nascimento && (
                <p className="text-xs text-destructive">{errors.nascimento}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select value={form.sexo} onValueChange={(v) => setField("sexo", v as Sexo)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Macho</SelectItem>
                  <SelectItem value="F">Fêmea</SelectItem>
                </SelectContent>
              </Select>
              {errors.sexo && <p className="text-xs text-destructive">{errors.sexo}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pet-obs">Observações médicas / Alergias</Label>
            <Textarea
              id="pet-obs"
              rows={3}
              placeholder="Ex.: alergia a frango, medicação contínua, histórico relevante..."
              value={form.observacoes}
              onChange={(e) => setField("observacoes", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Salvando...
                </>
              ) : isEditing ? (
                "Salvar alterações"
              ) : (
                "Cadastrar pet"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
