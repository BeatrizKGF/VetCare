import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownCircle, ArrowUpCircle, CheckCircle2, Clock, Loader2,
  Pencil, Plus, Search, ShoppingCart, Trash2, Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { TransacaoDialog } from "@/components/transacao-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  formatCurrency, formatDateOnly, isThisMonthDateOnly, isVencida,
  normalizeSearch, STATUS_TRANSACAO_CORES,
  type StatusTransacao, type TipoTransacao, type TransacaoFinanceira,
} from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — VetCare" },
      { name: "description", content: "Contas a pagar e receber, fluxo de caixa e relatórios da clínica." },
      { property: "og:title", content: "Financeiro — VetCare" },
      { property: "og:description", content: "Gestão financeira da clínica veterinária." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FinanceiroPage,
});

type FiltroTipo = "Todos" | TipoTransacao;
type FiltroStatus = "Todos" | StatusTransacao;

function FinanceiroPage() {
  const { transacoes, deleteTransacao, marcarComoPago, loading } = usePetCare();
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("Todos");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vendaOpen, setVendaOpen] = useState(false);
  const [editing, setEditing] = useState<TransacaoFinanceira | null>(null);
  const [deleting, setDeleting] = useState<TransacaoFinanceira | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    let receitasMes = 0;
    let despesasMes = 0;
    let aReceber = 0;
    let aPagar = 0;
    for (const t of transacoes) {
      const pagoNoMes = t.status === "Pago" && isThisMonthDateOnly(t.dataPagamento || t.dataVencimento);
      if (pagoNoMes && t.tipo === "Receita") receitasMes += t.valor;
      if (pagoNoMes && t.tipo === "Despesa") despesasMes += t.valor;
      if (t.status === "Pendente" || t.status === "Atrasado") {
        if (t.tipo === "Receita") aReceber += t.valor;
        else aPagar += t.valor;
      }
    }
    return { receitasMes, despesasMes, saldo: receitasMes - despesasMes, aReceber, aPagar };
  }, [transacoes]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(search.trim());
    return transacoes.filter((t) => {
      if (filtroTipo !== "Todos" && t.tipo !== filtroTipo) return false;
      if (filtroStatus !== "Todos" && t.status !== filtroStatus) return false;
      if (!q) return true;
      return (
        normalizeSearch(t.descricao).includes(q) ||
        normalizeSearch(t.categoria).includes(q) ||
        normalizeSearch(t.tutorNome ?? "").includes(q)
      );
    });
  }, [transacoes, search, filtroTipo, filtroStatus]);

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteTransacao(deleting.id);
      toast.success("Transação excluída com sucesso.");
      setDeleting(null);
    } catch {
      toast.error("Não foi possível excluir a transação.");
    }
  };

  const handleBaixa = async (t: TransacaoFinanceira) => {
    setPayingId(t.id);
    try {
      await marcarComoPago(t.id);
      toast.success(`"${t.descricao}" marcada como paga.`);
    } catch {
      toast.error("Não foi possível dar baixa na transação.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Financeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contas a pagar e receber — {transacoes.length} lançamento(s).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setVendaOpen(true)}>
            <ShoppingCart className="size-4" /> Nova Venda
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="size-4" /> Nova Transação
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Receitas (mês)" value={formatCurrency(metrics.receitasMes)}
          icon={ArrowUpCircle} tone="emerald" />
        <MetricCard label="Despesas (mês)" value={formatCurrency(metrics.despesasMes)}
          icon={ArrowDownCircle} tone="red" />
        <MetricCard label="Saldo líquido (mês)" value={formatCurrency(metrics.saldo)}
          icon={Wallet} tone={metrics.saldo >= 0 ? "emerald" : "red"} />
        <MetricCard label="A receber (pendente)" value={formatCurrency(metrics.aReceber)}
          hint={`${formatCurrency(metrics.aPagar)} a pagar`} icon={Clock} tone="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por descrição, categoria ou tutor..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1">
          {(["Todos", "Receita", "Despesa"] as FiltroTipo[]).map((t) => (
            <Button key={t} size="sm" variant={filtroTipo === t ? "default" : "outline"}
              onClick={() => setFiltroTipo(t)}>
              {t}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {(["Todos", "Pago", "Pendente"] as FiltroStatus[]).map((s) => (
            <Button key={s} size="sm" variant={filtroStatus === s ? "default" : "outline"}
              onClick={() => setFiltroStatus(s)}>
              {s}
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <Card className="shadow-soft">
          <CardContent className="space-y-3 p-6">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />)}
          </CardContent>
        </Card>
      )}

      {!loading && filtered.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <Wallet className="size-7 text-muted-foreground" />
            </span>
            <p className="text-lg font-bold">Nenhuma transação encontrada</p>
            <p className="text-sm text-muted-foreground">
              Registre receitas e despesas em &quot;Nova Transação&quot;.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <Card className="shadow-soft">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => {
                  const atrasada = isVencida(t);
                  const statusLabel: StatusTransacao = atrasada ? "Atrasado" : t.status;
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{t.descricao}</span>
                          {t.tutorNome && (
                            <span className="text-xs text-muted-foreground">Tutor: {t.tutorNome}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={t.tipo === "Receita"
                          ? "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"}>
                          {t.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.categoria}</TableCell>
                      <TableCell className={`text-right font-bold ${t.tipo === "Receita" ? "text-emerald-600" : "text-red-600"}`}>
                        {t.tipo === "Receita" ? "+" : "−"} {formatCurrency(t.valor)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateOnly(t.dataVencimento)}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_TRANSACAO_CORES[statusLabel]}>{statusLabel}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.formaPagamento || "—"}
                        {t.dataPagamento && (
                          <span className="block text-xs">em {formatDateOnly(t.dataPagamento)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {t.status !== "Pago" && t.status !== "Cancelado" && (
                            <Button variant="outline" size="sm" disabled={payingId === t.id}
                              onClick={() => handleBaixa(t)}>
                              {payingId === t.id
                                ? <Loader2 className="size-3.5 animate-spin" />
                                : <CheckCircle2 className="size-3.5" />}
                              Dar baixa
                            </Button>
                          )}
                          <Button variant="outline" size="sm"
                            onClick={() => { setEditing(t); setDialogOpen(true); }}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="outline" size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleting(t)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <TransacaoDialog open={dialogOpen} onOpenChange={setDialogOpen} transacao={editing} />
      <TransacaoDialog open={vendaOpen} onOpenChange={setVendaOpen} venda={{}} />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir transação?"
        description={`"${deleting?.descricao ?? ""}" será removida permanentemente do financeiro.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

const TONES: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

function MetricCard({
  label, value, hint, icon: Icon, tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  tone: keyof typeof TONES;
}) {
  return (
    <Card className="shadow-soft">
      <CardContent className="flex items-center gap-4 p-5">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-extrabold">{value}</p>
          {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
