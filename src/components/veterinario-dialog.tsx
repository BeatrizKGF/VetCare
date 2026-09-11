import { Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { maskPhone, type Veterinario } from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

interface VeterinarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  veterinario?: Veterinario | null;
}

const emptyForm = {
  nome: "", crmv: "", especialidade: "", telefone: "", email: "", ativo: true,
};

export function VeterinarioDialog({ open, onOpenChange, veterinario }: VeterinarioDialogProps) {
  const { addVeterinario, updateVeterinario } = usePetCare();
  type FormErrors = Partial<Record<keyof typeof emptyForm, string>>;
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(veterinario);

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(
        veterinario
          ? {
              nome: veterinario.nome, crmv: veterinario.crmv,
              especialidade: veterinario.especialidade, telefone: veterinario.telefone,
              email: veterinario.email, ativo: veterinario.ativo,
            }
          : emptyForm,
      );
    }
  }, [open, veterinario]);

  const setField = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    if (!form.nome.trim()) next.nome = "Informe o nome.";
    if (!form.crmv.trim()) next.crmv = "Informe o CRMV.";
    if (!form.especialidade.trim()) next.especialidade = "Informe a especialidade.";
    if (!form.telefone.trim()) next.telefone = "Informe o telefone.";
    if (!form.email.trim()) next.email = "Informe o e-mail.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "E-mail inválido.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      nome: form.nome.trim(), crmv: form.crmv.trim(),
      especialidade: form.especialidade.trim(), telefone: form.telefone.trim(),
      email: form.email.trim(), ativo: form.ativo,
    };

    setSaving(true);
    try {
      if (veterinario) {
        await updateVeterinario(veterinario.id, payload);
        toast.success(`Veterinário "${payload.nome}" atualizado com sucesso.`);
      } else {
        await addVeterinario(payload);
        toast.success(`Veterinário "${payload.nome}" cadastrado com sucesso.`);
      }
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar o veterinário. Verifique os dados e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Veterinário" : "Novo Veterinário"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do veterinário." : "Cadastre um novo veterinário na equipe."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vet-nome">Nome completo</Label>
              <Input id="vet-nome" placeholder="Dr(a). Ana Souza" value={form.nome}
                onChange={(e) => setField("nome", e.target.value)} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vet-crmv">CRMV</Label>
              <Input id="vet-crmv" placeholder="SP-12345" value={form.crmv}
                onChange={(e) => setField("crmv", e.target.value)} />
              {errors.crmv && <p className="text-xs text-destructive">{errors.crmv}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vet-esp">Especialidade</Label>
            <Input id="vet-esp" placeholder="Ex.: Clínica Geral, Cirurgia, Dermatologia"
              value={form.especialidade} onChange={(e) => setField("especialidade", e.target.value)} />
            {errors.especialidade && <p className="text-xs text-destructive">{errors.especialidade}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vet-tel">Telefone</Label>
              <Input id="vet-tel" placeholder="(11) 99999-0000" value={form.telefone}
                onChange={(e) => setField("telefone", maskPhone(e.target.value))} />
              {errors.telefone && <p className="text-xs text-destructive">{errors.telefone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vet-email">E-mail</Label>
              <Input id="vet-email" type="email" placeholder="vet@clinica.com" value={form.email}
                onChange={(e) => setField("email", e.target.value)} />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <Switch id="vet-ativo" checked={form.ativo}
              onCheckedChange={(v) => setField("ativo", v)} />
            <Label htmlFor="vet-ativo" className="cursor-pointer font-semibold">
              {form.ativo ? "Ativo" : "Inativo"}
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : isEditing ? "Salvar alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
