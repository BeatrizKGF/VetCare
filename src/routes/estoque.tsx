import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Boxes, Package, Pencil, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AjusteEstoqueDialog } from "@/components/ajuste-estoque-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { ProdutoDialog } from "@/components/produto-dialog";
import { TransacaoDialog } from "@/components/transacao-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  estoqueBaixo, estoqueZerado, formatCurrency, formatDateOnly,
  normalizeSearch, validadeProxima, type Produto,
} from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque e Produtos — VetCare" },
      { name: "description", content: "Controle o inventário da clínica com alertas de estoque baixo e validade." },
      { property: "og:title", content: "Estoque e Produtos — VetCare" },
      { property: "og:description", content: "Inventário de produtos da clínica veterinária." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProdutosPage,
});

function ProdutosPage() {
  const { produtos, deleteProduto, loading } = usePetCare();
  const [search, setSearch] = useState("");
  const [apenasAlerta, setApenasAlerta] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [ajustando, setAjustando] = useState<Produto | null>(null);
  const [vendendo, setVendendo] = useState<Produto | null>(null);
  const [deleting, setDeleting] = useState<Produto | null>(null);

  const filtered = useMemo(() => {
    const q = normalizeSearch(search.trim());
    return produtos.filter((p) => {
      if (apenasAlerta && !estoqueBaixo(p)) return false;
      if (!q) return true;
      return normalizeSearch(p.nome).includes(q) || normalizeSearch(p.categoria).includes(q);
    });
  }, [produtos, search, apenasAlerta]);

  const emAlerta = useMemo(() => produtos.filter(estoqueBaixo).length, [produtos]);
  const valorEstoque = useMemo(
    () => produtos.reduce((acc, p) => acc + p.precoCusto * p.quantidadeEstoque, 0),
    [produtos],
  );

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProduto(deleting.id);
      toast.success(`Produto "${deleting.nome}" excluído com sucesso.`);
      setDeleting(null);
    } catch {
      toast.error("Não foi possível excluir o produto.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Estoque / Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {produtos.length} produto(s) cadastrado(s).
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="size-4" /> Novo Produto
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Produtos ativos" value={String(produtos.filter((p) => p.ativo).length)} icon={Package} />
        <MetricCard label="Itens em alerta" value={String(emAlerta)} icon={AlertTriangle} alerta={emAlerta > 0} />
        <MetricCard label="Valor em estoque (custo)" value={formatCurrency(valorEstoque)} icon={Boxes} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome ou categoria..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant={apenasAlerta ? "default" : "outline"} onClick={() => setApenasAlerta((v) => !v)}>
          <AlertTriangle className="size-4" /> Somente estoque baixo
        </Button>
      </div>

      {loading && (
        <Card className="shadow-soft">
          <CardContent className="space-y-3 p-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
            ))}
          </CardContent>
        </Card>
      )}

      {!loading && filtered.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <Package className="size-7 text-muted-foreground" />
            </span>
            <p className="text-lg font-bold">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground">
              {search || apenasAlerta ? "Tente ajustar os filtros." : "Clique em \"Novo Produto\" para começar o inventário."}
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
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Venda</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className={estoqueBaixo(p) ? "bg-amber-50/60 dark:bg-amber-950/20" : undefined}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{p.nome}</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {!p.ativo && <Badge variant="secondary">Inativo</Badge>}
                          {estoqueZerado(p) ? (
                            <Badge className="border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                              Sem estoque
                            </Badge>
                          ) : estoqueBaixo(p) ? (
                            <Badge className="border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Estoque baixo
                            </Badge>
                          ) : null}
                          {validadeProxima(p.dataValidade) && (
                            <Badge className="border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300">
                              Validade próxima
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.categoria}</TableCell>
                    <TableCell className="text-right font-bold">
                      {p.quantidadeEstoque} <span className="text-xs font-normal text-muted-foreground">{p.unidadeMedida}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{p.estoqueMinimo}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(p.precoCusto)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{formatCurrency(p.precoVenda)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateOnly(p.dataValidade)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" disabled={p.quantidadeEstoque <= 0}
                          className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-300"
                          title="Registrar venda com baixa automática no estoque"
                          onClick={() => setVendendo(p)}>
                          <ShoppingCart className="size-3.5" /> Vender
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setAjustando(p)}>
                          Ajustar estoque
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setEditing(p); setDialogOpen(true); }}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="outline" size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleting(p)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ProdutoDialog open={dialogOpen} onOpenChange={setDialogOpen} produto={editing} />
      <AjusteEstoqueDialog open={Boolean(ajustando)}
        onOpenChange={(open) => !open && setAjustando(null)} produto={ajustando} />
      <TransacaoDialog open={Boolean(vendendo)}
        onOpenChange={(open) => !open && setVendendo(null)}
        venda={vendendo ? { produtoId: vendendo.id } : null} />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir ${deleting?.nome ?? "produto"}?`}
        description="Esta ação não pode ser desfeita. O produto será removido do inventário."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function MetricCard({
  label, value, icon: Icon, alerta,
}: { label: string; value: string; icon: React.ElementType; alerta?: boolean }) {
  return (
    <Card className="shadow-soft">
      <CardContent className="flex items-center gap-4 p-5">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${alerta ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "bg-primary/10 text-primary"}`}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-extrabold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
