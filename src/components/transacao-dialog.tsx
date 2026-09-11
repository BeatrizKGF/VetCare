import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIAS_DESPESA, CATEGORIAS_RECEITA, FORMAS_PAGAMENTO,
  STATUS_TRANSACAO, formatCurrency, todayISODate,
  type StatusTransacao, type TipoTransacao, type TransacaoFinanceira,
} from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

interface TransacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transacao?: TransacaoFinanceira | null;
  /** Quando definido (e não é edição), o modal abre já configurado como venda de produto com baixa de estoque. */
  venda?: { produtoId?: string } | null;
}

const SEM_TUTOR = "__sem_tutor__";
const CATEGORIA_VENDA = "Vendas de Produtos";

const emptyForm = {
  descricao: "",
  tipo: "Receita" as TipoTransacao,
  categoria: "",
  valor: "",
  dataVencimento: todayISODate(),
  dataPagamento: "",
  status: "Pendente" as StatusTransacao,
  formaPagamento: "",
  tutorId: SEM_TUTOR,
  observacoes: "",
  produtoId: "",
  quantidade: "1",
};

type FormErrors = Partial<Record<keyof typeof emptyForm, string>>;

export function TransacaoDialog({ open, onOpenChange, transacao, venda }: TransacaoDialogProps) {
  const { tutors, produtos, addTransacao, updateTransacao, ajustarEstoque } = usePetCare();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(transacao);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      transacao
        ? {
            descricao: transacao.descricao,
            tipo: transacao.tipo,
            categoria: transacao.categoria,
            valor: transacao.valor.toFixed(2).replace(".", ","),
            dataVencimento: transacao.dataVencimento,
            dataPagamento: transacao.dataPagamento,
            status: transacao.status,
            formaPagamento: transacao.formaPagamento,
            tutorId: transacao.tutorId || SEM_TUTOR,
            observacoes: transacao.observacoes,
            produtoId: "",
            quantidade: "1",
          }
        : venda
          ? (() => {
              const prod = produtos.find((p) => p.id === venda.produtoId && p.ativo);
              return {
                ...emptyForm,
                dataVencimento: todayISODate(),
                categoria: CATEGORIA_VENDA,
                status: "Pago" as StatusTransacao,
                dataPagamento: todayISODate(),
                produtoId: prod ? prod.id : "",
                ...(prod
                  ? {
                      valor: prod.precoVenda.toFixed(2).replace(".", ","),
                      descricao: `Venda: ${prod.nome} (1 ${prod.unidadeMedida})`,
                    }
                  : {}),
              };
            })()
          : { ...emptyForm, dataVencimento: todayISODate() },
    );
  }, [open, transacao, venda, produtos]);

  const categorias = useMemo(
    () => (form.tipo === "Receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA),
    [form.tipo],
  );

  const produtosDisponiveis = useMemo(
    () => produtos.filter((p) => p.ativo),
    [produtos],
  );

  const isVenda = !isEditing && form.tipo === "Receita" && form.categoria === CATEGORIA_VENDA;
  const produtoSelecionado = produtosDisponiveis.find((p) => p.id === form.produtoId);
  const quantidadeNum = parseInt(form.quantidade, 10);

  const setField = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const recalcVenda = (produtoId: string, quantidade: string) => {
    const produto = produtosDisponiveis.find((p) => p.id === produtoId);
    const qtd = parseInt(quantidade, 10);
    if (!produto || Number.isNaN(qtd) || qtd <= 0) return {};
    return {
      valor: (produto.precoVenda * qtd).toFixed(2).replace(".", ","),
      descricao: `Venda: ${produto.nome} (${qtd} ${produto.unidadeMedida})`,
    };
  };

  const handleProduto = (produtoId: string) => {
    setForm((prev) => ({ ...prev, produtoId, ...recalcVenda(produtoId, prev.quantidade) }));
    setErrors((prev) => ({ ...prev, produtoId: "", valor: "", descricao: "" }));
  };

  const handleQuantidade = (quantidade: string) => {
    setForm((prev) => ({ ...prev, quantidade, ...recalcVenda(prev.produtoId, quantidade) }));
    setErrors((prev) => ({ ...prev, quantidade: "", valor: "", descricao: "" }));
  };

  const handleCategoria = (categoria: string) => {
    setForm((prev) => ({
      ...prev,
      categoria,
      ...(categoria === CATEGORIA_VENDA ? {} : { produtoId: "", quantidade: "1" }),
    }));
    setErrors((prev) => ({ ...prev, categoria: "" }));
  };

  const handleTipo = (tipo: TipoTransacao) => {
    setForm((prev) => ({ ...prev, tipo, categoria: "", produtoId: "", quantidade: "1" }));
    setErrors((prev) => ({ ...prev, tipo: "", categoria: "" }));
  };

  const handleStatus = (status: StatusTransacao) => {
    setForm((prev) => ({
      ...prev,
      status,
      dataPagamento: status === "Pago" && !prev.dataPagamento ? todayISODate() : status === "Pago" ? prev.dataPagamento : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    if (!form.descricao.trim()) next.descricao = "Informe a descrição.";
    if (!form.categoria.trim()) next.categoria = "Selecione a categoria.";
    const valorNum = parseFloat(form.valor.replace(",", "."));
    if (!form.valor.trim() || Number.isNaN(valorNum) || valorNum <= 0) next.valor = "Informe um valor válido.";
    if (!form.dataVencimento) next.dataVencimento = "Informe a data de vencimento.";
    if (isVenda) {
      if (!produtoSelecionado) next.produtoId = "Selecione o produto vendido.";
      else if (Number.isNaN(quantidadeNum) || quantidadeNum <= 0) next.quantidade = "Informe a quantidade.";
      else if (quantidadeNum > produtoSelecionado.quantidadeEstoque)
        next.quantidade = `Estoque insuficiente (disponível: ${produtoSelecionado.quantidadeEstoque}).`;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const obsVenda = isVenda && produtoSelecionado
      ? `Baixa de estoque: ${quantidadeNum} ${produtoSelecionado.unidadeMedida} de ${produtoSelecionado.nome}.`
      : "";

    const payload = {
      descricao: form.descricao.trim(),
      tipo: form.tipo,
      categoria: form.categoria,
      valor: valorNum,
      dataVencimento: form.dataVencimento,
      dataPagamento: form.status === "Pago" ? form.dataPagamento || todayISODate() : "",
      status: form.status,
      formaPagamento: form.formaPagamento,
      tutorId: form.tutorId === SEM_TUTOR ? "" : form.tutorId,
      agendamentoId: transacao?.agendamentoId ?? "",
      observacoes: [form.observacoes.trim(), obsVenda].filter(Boolean).join(" | "),
    };

    setSaving(true);
    try {
      if (transacao) {
        await updateTransacao(transacao.id, payload);
        toast.success("Transação atualizada com sucesso.");
      } else {
        await addTransacao(payload);
        if (isVenda && produtoSelecionado) {
          try {
            await ajustarEstoque(produtoSelecionado.id, -quantidadeNum);
            toast.success(
              `Venda registrada. Estoque de ${produtoSelecionado.nome}: ${produtoSelecionado.quantidadeEstoque - quantidadeNum} ${produtoSelecionado.unidadeMedida}.`,
            );
          } catch {
            toast.warning("Venda registrada, mas não foi possível dar baixa no estoque.");
          }
        } else {
          toast.success(`${payload.tipo} registrada com sucesso.`);
        }
      }
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar a transação. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Transação" : venda ? "Nova Venda de Produto" : "Nova Transação"}
          </DialogTitle>
          <DialogDescription>
            {venda && !isEditing
              ? "A venda será registrada no financeiro e a quantidade será deduzida automaticamente do estoque."
              : "Registre uma receita ou despesa da clínica."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={form.tipo === "Receita" ? "default" : "outline"}
              className={form.tipo === "Receita" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              onClick={() => handleTipo("Receita")}>
              Receita
            </Button>
            <Button type="button" variant={form.tipo === "Despesa" ? "default" : "outline"}
              className={form.tipo === "Despesa" ? "bg-red-600 hover:bg-red-700" : ""}
              onClick={() => handleTipo("Despesa")}>
              Despesa
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tr-desc">Descrição</Label>
            <Input id="tr-desc" placeholder="Ex.: Consulta - Rex / Compra de ração"
              value={form.descricao} onChange={(e) => setField("descricao", e.target.value)} />
            {errors.descricao && <p className="text-xs text-destructive">{errors.descricao}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={handleCategoria}>
                <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.categoria && <p className="text-xs text-destructive">{errors.categoria}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tr-valor">Valor (R$)</Label>
              <Input id="tr-valor" placeholder="0,00" value={form.valor}
                onChange={(e) => setField("valor", e.target.value)} />
              {errors.valor && <p className="text-xs text-destructive">{errors.valor}</p>}
            </div>
          </div>

          {isVenda && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-sm font-medium">Produto do estoque</p>
              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <div className="space-y-2">
                  <Label>Produto vendido</Label>
                  <Select value={form.produtoId} onValueChange={handleProduto}>
                    <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                    <SelectContent>
                      {produtosDisponiveis.map((p) => (
                        <SelectItem key={p.id} value={p.id} disabled={p.quantidadeEstoque <= 0}>
                          {p.nome} — {formatCurrency(p.precoVenda)} ({p.quantidadeEstoque} {p.unidadeMedida})
                        </SelectItem>
                      ))}
                      {produtosDisponiveis.length === 0 && (
                        <SelectItem value="__none" disabled>Nenhum produto ativo</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.produtoId && <p className="text-xs text-destructive">{errors.produtoId}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tr-qtd">Quantidade</Label>
                  <Input id="tr-qtd" type="number" min={1} value={form.quantidade}
                    onChange={(e) => handleQuantidade(e.target.value)} />
                </div>
              </div>
              {errors.quantidade && <p className="text-xs text-destructive">{errors.quantidade}</p>}
              {produtoSelecionado && !Number.isNaN(quantidadeNum) && quantidadeNum > 0 && (
                <p className="text-xs text-muted-foreground">
                  Total {formatCurrency(produtoSelecionado.precoVenda * quantidadeNum)} · estoque após a venda:{" "}
                  {Math.max(0, produtoSelecionado.quantidadeEstoque - quantidadeNum)} {produtoSelecionado.unidadeMedida}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tr-venc">Data de vencimento</Label>
              <Input id="tr-venc" type="date" value={form.dataVencimento}
                onChange={(e) => setField("dataVencimento", e.target.value)} />
              {errors.dataVencimento && <p className="text-xs text-destructive">{errors.dataVencimento}</p>}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => handleStatus(v as StatusTransacao)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_TRANSACAO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={form.formaPagamento} onValueChange={(v) => setField("formaPagamento", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.status === "Pago" && (
              <div className="space-y-2">
                <Label htmlFor="tr-pag">Data de pagamento</Label>
                <Input id="tr-pag" type="date" value={form.dataPagamento}
                  onChange={(e) => setField("dataPagamento", e.target.value)} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tutor vinculado (opcional)</Label>
            <Select value={form.tutorId} onValueChange={(v) => setField("tutorId", v)}>
              <SelectTrigger><SelectValue placeholder="Sem tutor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_TUTOR}>Sem tutor vinculado</SelectItem>
                {tutors.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tr-obs">Observações</Label>
            <Textarea id="tr-obs" rows={2} value={form.observacoes}
              onChange={(e) => setField("observacoes", e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : isEditing ? "Salvar alterações" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
