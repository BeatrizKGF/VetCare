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
import { maskCPF, maskPhone, type Tutor } from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

interface TutorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutor?: Tutor | null;
}

const emptyForm = { nome: "", cpf: "", email: "", telefone: "", endereco: "" };

export function TutorDialog({ open, onOpenChange, tutor }: TutorDialogProps) {
  const { addTutor, updateTutor } = usePetCare();
  type FormErrors = Partial<Record<keyof typeof emptyForm, string>>;
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(tutor);

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(
        tutor
          ? {
              nome: tutor.nome,
              cpf: tutor.cpf,
              email: tutor.email,
              telefone: tutor.telefone,
              endereco: tutor.endereco,
            }
          : emptyForm,
      );
    }
  }, [open, tutor]);

  const set = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (field === "cpf") value = maskCPF(value);
    if (field === "telefone") value = maskPhone(value);
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    if (!form.nome.trim()) next.nome = "Informe o nome completo.";
    if (form.cpf.replace(/\D/g, "").length !== 11) next.cpf = "CPF deve ter 11 dígitos.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Informe um e-mail válido.";
    if (form.telefone.replace(/\D/g, "").length < 10)
      next.telefone = "Informe um telefone com DDD.";
    if (!form.endereco.trim()) next.endereco = "Informe o endereço.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      nome: form.nome.trim(),
      cpf: form.cpf,
      email: form.email.trim(),
      telefone: form.telefone,
      endereco: form.endereco.trim(),
    };

    setSaving(true);
    try {
      if (tutor) {
        await updateTutor(tutor.id, payload);
        toast.success(`Tutor "${payload.nome}" atualizado com sucesso.`);
      } else {
        await addTutor(payload);
        toast.success(`Tutor "${payload.nome}" cadastrado com sucesso.`);
      }
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar o tutor. Verifique a conexão com o banco de dados.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Tutor" : "Novo Tutor"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do tutor."
              : "Preencha os dados para cadastrar um novo tutor."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tutor-nome">Nome completo</Label>
            <Input
              id="tutor-nome"
              placeholder="Ex.: Maria Silva"
              value={form.nome}
              onChange={set("nome")}
            />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tutor-cpf">CPF</Label>
              <Input
                id="tutor-cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={form.cpf}
                onChange={set("cpf")}
              />
              {errors.cpf && <p className="text-xs text-destructive">{errors.cpf}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tutor-telefone">Telefone</Label>
              <Input
                id="tutor-telefone"
                inputMode="tel"
                placeholder="(00) 00000-0000"
                value={form.telefone}
                onChange={set("telefone")}
              />
              {errors.telefone && (
                <p className="text-xs text-destructive">{errors.telefone}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tutor-email">E-mail</Label>
            <Input
              id="tutor-email"
              type="email"
              placeholder="tutor@email.com"
              value={form.email}
              onChange={set("email")}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tutor-endereco">Endereço</Label>
            <Input
              id="tutor-endereco"
              placeholder="Rua, número, bairro, cidade/UF"
              value={form.endereco}
              onChange={set("endereco")}
            />
            {errors.endereco && (
              <p className="text-xs text-destructive">{errors.endereco}</p>
            )}
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
                "Cadastrar tutor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
