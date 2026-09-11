import { Loader2, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Produto } from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

interface AjusteEstoqueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto?: Produto | null;
}

export function AjusteEstoqueDialog({ open, onOpenChange, produto }: AjusteEstoqueDialogProps) {
  const { ajustarEstoque } = usePetCare();
  const [modo, setModo] = useState<"entrada" | "saida">("entrada");
  const [quantidade, setQuantidade] = useState("1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setModo("entrada");
      setQuantidade("1");
    }
  }, [open]);

  if (!produto) return null;

  const qtd = parseInt(quantidade, 10);
  const valido = !Number.isNaN(qtd) && qtd > 0;
  const delta = modo === "entrada" ? qtd : -qtd;
  const resultado = valido ? Math.max(0, produto.quantidadeEstoque + delta) : produto.quantidadeEstoque;

  const handleConfirm = async () => {
    if (!valido) return;
    setSaving(true);
    try {
      await ajustarEstoque(produto.id, delta);
      toast.success(
        modo === "entrada"
          ? `Entrada de ${qtd} ${produto.unidadeMedida} em "${produto.nome}".`
          : `Saída de ${qtd} ${produto.unidadeMedida} de "${produto.nome}".`,
      );
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível ajustar o estoque. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar estoque</DialogTitle>
          <DialogDescription>
            {produto.nome} — estoque atual: {produto.quantidadeEstoque} {produto.unidadeMedida}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={modo === "entrada" ? "default" : "outline"}
              onClick={() => setModo("entrada")}>
              <Plus className="size-4" /> Entrada
            </Button>
            <Button type="button" variant={modo === "saida" ? "default" : "outline"}
              onClick={() => setModo("saida")}>
              <Minus className="size-4" /> Saída
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ajuste-qtd">Quantidade</Label>
            <Input id="ajuste-qtd" type="number" min="1" value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)} />
          </div>

          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
            Novo estoque: <span className="font-bold">{resultado} {produto.unidadeMedida}</span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={saving || !valido} onClick={handleConfirm}>
            {saving ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Confirmar ajuste"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
