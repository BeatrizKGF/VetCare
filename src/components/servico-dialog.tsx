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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Servico } from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

interface ServicoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servico?: Servico | null;
}

const emptyForm = {
  nome: "", descricao: "", preco: "", duracaoMinutos: "30", ativo: true,
};

export function ServicoDialog({ open, onOpenChange, servico }: ServicoDialogProps) {
  const { addServico, updateServico } = usePetCare();
  type FormErrors = Partial<Record<keyof typeof emptyForm, string>>;
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(servico);

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(
        servico
          ? {
              nome: servico.nome, descricao: servico.descricao,
              preco: servico.preco.toFixed(2).replace(".", ","),
              duracaoMinutos: String(servico.duracaoMinutos), ativo: servico.ativo,
            }
          : emptyForm,
      );
    }
  }, [open, servico]);

  const setField = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    if (!form.nome.trim()) next.nome = "Informe o nome do serviço.";
    const precoNum = parseFloat(form.preco.replace(",", "."));
    if (!form.preco.trim() || Number.isNaN(precoNum) || precoNum <= 0) next.preco = "Informe um preço válido.";
    const durNum = parseInt(form.duracaoMinutos, 10);
    if (!form.duracaoMinutos.trim() || Number.isNaN(durNum) || durNum <= 0) next.duracaoMinutos = "Informe a duração em minutos.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      nome: form.nome.trim(), descricao: form.descricao.trim(),
      preco: precoNum, duracaoMinutos: durNum, ativo: form.ativo,
    };

    setSaving(true);
    try {
      if (servico) {
        await updateServico(servico.id, payload);
        toast.success(`Serviço "${payload.nome}" atualizado com sucesso.`);
      } else {
        await addServico(payload);
        toast.success(`Serviço "${payload.nome}" cadastrado com sucesso.`);
      }
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar o serviço. Verifique os dados e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do serviço." : "Cadastre um novo serviço oferecido pela clínica."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serv-nome">Nome do serviço</Label>
            <Input id="serv-nome" placeholder="Ex.: Consulta, Banho, Vacinação"
              value={form.nome} onChange={(e) => setField("nome", e.target.value)} />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="serv-desc">Descrição</Label>
            <Textarea id="serv-desc" rows={2} placeholder="Descreva o que inclui este serviço..."
              value={form.descricao} onChange={(e) => setField("descricao", e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="serv-preco">Preço (R$)</Label>
              <Input id="serv-preco" placeholder="150,00" value={form.preco}
                onChange={(e) => setField("preco", e.target.value)} />
              {errors.preco && <p className="text-xs text-destructive">{errors.preco}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="serv-dur">Duração (minutos)</Label>
              <Input id="serv-dur" type="number" min="1" placeholder="30"
                value={form.duracaoMinutos} onChange={(e) => setField("duracaoMinutos", e.target.value)} />
              {errors.duracaoMinutos && <p className="text-xs text-destructive">{errors.duracaoMinutos}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <Switch id="serv-ativo" checked={form.ativo} onCheckedChange={(v) => setField("ativo", v)} />
            <Label htmlFor="serv-ativo" className="cursor-pointer font-semibold">
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
