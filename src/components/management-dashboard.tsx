import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarCheck,
  CloudOff,
  Package,
  Receipt,
  Stethoscope,
  Syringe,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  estoqueBaixo,
  formatCurrency,
  formatDateOnly,
} from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";
import {
  fetchProntuariosRecentes,
  fetchVacinasProximas,
  type Prontuario,
  type VacinaProxima,
} from "@/lib/prontuario";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function monthKey(value: string): string {
  return (value ?? "").slice(0, 7);
}

function monthKeyOffset(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [, m] = key.split("-");
  return MESES[Number(m) - 1] ?? key;
}

function Delta({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs font-semibold text-muted-foreground">sem base anterior</span>;
  }
  const positivo = value >= 0;
  const Icon = positivo ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold ${
        positivo ? "text-primary" : "text-destructive"
      }`}
    >
      <Icon className="size-3.5" />
      {positivo ? "+" : ""}
      {value.toFixed(1)}% vs. mês anterior
    </span>
  );
}

export function ManagementDashboard() {
  const { pets, agendamentos, produtos, transacoes, loading, error } = usePetCare();
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([]);
  const [vacinas, setVacinas] = useState<VacinaProxima[]>([]);

  useEffect(() => {
    let ativo = true;
    void (async () => {
      try {
        const [p, v] = await Promise.all([fetchProntuariosRecentes(500), fetchVacinasProximas(30)]);
        if (!ativo) return;
        setProntuarios(p);
        setVacinas(v);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const mesAtual = monthKeyOffset(0);
  const mesAnterior = monthKeyOffset(-1);

  const receitaPorMes = useMemo(() => {
    const map = new Map<string, { receita: number; despesa: number }>();
    for (const t of transacoes) {
      if (t.status === "Cancelado") continue;
      const key = monthKey(t.dataPagamento || t.dataVencimento);
      const atual = map.get(key) ?? { receita: 0, despesa: 0 };
      if (t.tipo === "Receita") atual.receita += t.valor;
      else atual.despesa += t.valor;
      map.set(key, atual);
    }
    return map;
  }, [transacoes]);

  const faturamentoMes = useMemo(
    () =>
      transacoes
        .filter(
          (t) =>
            t.tipo === "Receita" &&
            t.status === "Pago" &&
            monthKey(t.dataPagamento || t.dataVencimento) === mesAtual,
        )
        .reduce((s, t) => s + t.valor, 0),
    [transacoes, mesAtual],
  );

  const faturamentoAnterior = useMemo(
    () =>
      transacoes
        .filter(
          (t) =>
            t.tipo === "Receita" &&
            t.status === "Pago" &&
            monthKey(t.dataPagamento || t.dataVencimento) === mesAnterior,
        )
        .reduce((s, t) => s + t.valor, 0),
    [transacoes, mesAnterior],
  );

  const crescimento =
    faturamentoAnterior > 0
      ? ((faturamentoMes - faturamentoAnterior) / faturamentoAnterior) * 100
      : null;

  const atendimentosMes = prontuarios.filter(
    (p) => monthKey(p.dataAtendimento) === mesAtual,
  ).length;
  const atendimentosAnterior = prontuarios.filter(
    (p) => monthKey(p.dataAtendimento) === mesAnterior,
  ).length;
  const crescimentoAtend =
    atendimentosAnterior > 0
      ? ((atendimentosMes - atendimentosAnterior) / atendimentosAnterior) * 100
      : null;

  const ticketMedio = atendimentosMes > 0 ? faturamentoMes / atendimentosMes : 0;

  const concluidos = agendamentos.filter((a) => a.status === "Concluído").length;
  const cancelados = agendamentos.filter((a) => a.status === "Cancelado").length;
  const ocupacao = concluidos + cancelados > 0 ? (concluidos / (concluidos + cancelados)) * 100 : 0;

  const evolucao = useMemo(
    () =>
      [-5, -4, -3, -2, -1, 0].map((off) => {
        const key = monthKeyOffset(off);
        const v = receitaPorMes.get(key) ?? { receita: 0, despesa: 0 };
        return { mes: monthLabel(key), Receitas: v.receita, Despesas: v.despesa };
      }),
    [receitaPorMes],
  );

  const topServicos = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of agendamentos) {
      const nome = a.servicoNome ?? "—";
      map.set(nome, (map.get(nome) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, total]) => ({ nome, total }));
  }, [agendamentos]);

  const fauna = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of pets) {
      const chave = p.especie === "Cão" || p.especie === "Gato" ? p.especie : "Outros";
      map.set(chave, (map.get(chave) ?? 0) + 1);
    }
    return [...map.entries()].map(([nome, total]) => ({ nome, total }));
  }, [pets]);

  const estoqueCritico = produtos.filter((p) => p.ativo && estoqueBaixo(p));

  const kpis = [
    {
      title: "Faturamento do mês",
      value: formatCurrency(faturamentoMes),
      icon: Wallet,
      delta: crescimento,
    },
    {
      title: "Atendimentos realizados",
      value: String(atendimentosMes),
      icon: Stethoscope,
      delta: crescimentoAtend,
    },
    {
      title: "Ticket médio por consulta",
      value: formatCurrency(ticketMedio),
      icon: Receipt,
      delta: null,
    },
    {
      title: "Taxa de ocupação da agenda",
      value: `${ocupacao.toFixed(0)}%`,
      icon: CalendarCheck,
      delta: null,
      hint: `${concluidos} concluídos · ${cancelados} cancelados`,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Central de inteligência e análise de dados da clínica.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5 shadow-soft">
          <CardContent className="flex items-start gap-3 p-4">
            <CloudOff className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-bold text-destructive">Falha ao conectar ao banco de dados</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.title} className="rounded-2xl shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground">{k.title}</CardTitle>
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <k.icon className="size-5" />
              </span>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-2xl font-extrabold tracking-tight">{loading ? "…" : k.value}</p>
              {k.hint ? (
                <span className="text-xs font-semibold text-muted-foreground">{k.hint}</span>
              ) : (
                <Delta value={k.delta} />
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <CardTitle className="text-base font-extrabold">Evolução financeira</CardTitle>
          <CardDescription>Entradas x saídas nos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolucao} margin={{ left: 4, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={70}
                tickFormatter={(v: number) => formatCurrency(v)}
              />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="Receitas"
                stroke="var(--chart-1)"
                fill="url(#gradReceita)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Despesas"
                stroke="var(--chart-4)"
                fill="url(#gradDespesa)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Serviços mais procurados</CardTitle>
            <CardDescription>Top 5 por volume de agendamentos</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {topServicos.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Sem agendamentos registrados.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServicos} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    width={110}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="total" name="Agendamentos" fill="var(--chart-1)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Distribuição da fauna</CardTitle>
            <CardDescription>Espécies dos pacientes cadastrados</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {fauna.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhum pet cadastrado ainda.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fauna}
                    dataKey="total"
                    nameKey="nome"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {fauna.map((entry, i) => (
                      <Cell key={entry.nome} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold">
                <Syringe className="size-4 text-primary" />
                Vacinas a vencer (30 dias)
              </CardTitle>
              <CardDescription>Busca ativa de clientes</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/pets">Ver pets</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {vacinas.map((v) => (
              <div
                key={v.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border bg-background p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {v.petNome}{" "}
                    <span className="font-normal text-muted-foreground">• {v.nomeVacina}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">Tutor: {v.tutorNome}</p>
                </div>
                <Badge className="border-0 bg-amber-100 text-[11px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  {formatDateOnly(v.dataProximaDose)}
                </Badge>
              </div>
            ))}
            {vacinas.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma vacina vencendo nos próximos 30 dias.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold">
                <AlertTriangle className="size-4 text-amber-600" />
                Estoque crítico
              </CardTitle>
              <CardDescription>Produtos que precisam de reposição</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/estoque">Ver estoque</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {estoqueCritico.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border bg-background p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <Package className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{p.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.categoria} • mínimo {p.estoqueMinimo} {p.unidadeMedida}
                  </p>
                </div>
                <Badge className="border-0 bg-destructive/10 text-[11px] font-bold text-destructive">
                  {p.quantidadeEstoque} {p.unidadeMedida}
                </Badge>
              </div>
            ))}
            {estoqueCritico.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Todos os produtos estão com estoque saudável.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
