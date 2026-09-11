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
import { CATEGORIAS_PRODUTO, UNIDADES_MEDIDA, type Produto } from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

interface ProdutoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto?: Produto | null;
}

const emptyForm = {
  nome: "",
  categoria: "Medicamento",
  precoCusto: "",
  precoVenda: "",
  quantidadeEstoque: "0",
  estoqueMinimo: "5",
  unidadeMedida: "UN",
  dataValidade: "",
  ativo: true,
};

type FormErrors = Partial<Record<keyof typeof emptyForm, string>>;

const parseMoney = (v: string) => parseFloat(v.replace(",", "."));

export function ProdutoDialog({ open, onOpenChange, produto }: ProdutoDialogProps) {
  const { addProduto, updateProduto } = usePetCare();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(produto);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      produto
        ? {
            nome: produto.nome,
            categoria: produto.categoria || "Medicamento",
            precoCusto: produto.precoCusto.toFixed(2).replace(".", ","),
            precoVenda: produto.precoVenda.toFixed(2).replace(".", ","),
            quantidadeEstoque: String(produto.quantidadeEstoque),
            estoqueMinimo: String(produto.estoqueMinimo),
            unidadeMedida: produto.unidadeMedida || "UN",
            dataValidade: produto.dataValidade || "",
            ativo: produto.ativo,
          }
        : emptyForm,
    );
  }, [open, produto]);

  const setField = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    if (!form.nome.trim()) next.nome = "Informe o nome do produto.";
    if (!form.categoria.trim()) next.categoria = "Selecione a categoria.";
    const venda = parseMoney(form.precoVenda);
    if (!form.precoVenda.trim() || Number.isNaN(venda) || venda <= 0) next.precoVenda = "Informe um preço de venda válido.";
    const custo = form.precoCusto.trim() ? parseMoney(form.precoCusto) : 0;
    if (Number.isNaN(custo) || custo < 0) next.precoCusto = "Preço de custo inválido.";
    const qtd = parseInt(form.quantidadeEstoque, 10);
    if (Number.isNaN(qtd) || qtd < 0) next.quantidadeEstoque = "Quantidade inválida.";
    const min = parseInt(form.estoqueMinimo, 10);
    if (Number.isNaN(min) || min < 0) next.estoqueMinimo = "Estoque mínimo inválido.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      nome: form.nome.trim(),
      categoria: form.categoria,
      precoCusto: custo,
      precoVenda: venda,
      quantidadeEstoque: qtd,
      estoqueMinimo: min,
      unidadeMedida: form.unidadeMedida,
      dataValidade: form.dataValidade,
      ativo: form.ativo,
    };

    setSaving(true);
    try {
      if (produto) {
        await updateProduto(produto.id, payload);
        toast.success(`Produto "${payload.nome}" atualizado com sucesso.`);
      } else {
        await addProduto(payload);
        toast.success(`Produto "${payload.nome}" cadastrado com sucesso.`);
      }
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar o produto. Verifique os dados e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do produto." : "Cadastre um item no inventário da clínica."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prod-nome">Nome do produto</Label>
              <Input id="prod-nome" placeholder="Ex.: Antipulgas 10kg" value={form.nome}
                onChange={(e) => setField("nome", e.target.value)} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setField("categoria", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_PRODUTO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.categoria && <p className="text-xs text-destructive">{errors.categoria}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prod-custo">Preço de custo (R$)</Label>
              <Input id="prod-custo" placeholder="0,00" value={form.precoCusto}
                onChange={(e) => setField("precoCusto", e.target.value)} />
              {errors.precoCusto && <p className="text-xs text-destructive">{errors.precoCusto}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-venda">Preço de venda (R$)</Label>
              <Input id="prod-venda" placeholder="0,00" value={form.precoVenda}
                onChange={(e) => setField("precoVenda", e.target.value)} />
              {errors.precoVenda && <p className="text-xs text-destructive">{errors.precoVenda}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="prod-qtd">Quantidade em estoque</Label>
              <Input id="prod-qtd" type="number" min="0" value={form.quantidadeEstoque}
                onChange={(e) => setField("quantidadeEstoque", e.target.value)} />
              {errors.quantidadeEstoque && <p className="text-xs text-destructive">{errors.quantidadeEstoque}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-min">Estoque mínimo</Label>
              <Input id="prod-min" type="number" min="0" value={form.estoqueMinimo}
                onChange={(e) => setField("estoqueMinimo", e.target.value)} />
              {errors.estoqueMinimo && <p className="text-xs text-destructive">{errors.estoqueMinimo}</p>}
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={form.unidadeMedida} onValueChange={(v) => setField("unidadeMedida", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIDADES_MEDIDA.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prod-validade">Data de validade</Label>
              <Input id="prod-validade" type="date" value={form.dataValidade}
                onChange={(e) => setField("dataValidade", e.target.value)} />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <Switch id="prod-ativo" checked={form.ativo} onCheckedChange={(v) => setField("ativo", v)} />
              <Label htmlFor="prod-ativo" className="cursor-pointer font-semibold">
                {form.ativo ? "Ativo" : "Inativo"}
              </Label>
            </div>
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
