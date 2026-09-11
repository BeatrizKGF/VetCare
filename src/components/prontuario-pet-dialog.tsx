import {
  Activity, CalendarDays, HeartPulse, Pill, Plus, Stethoscope, Syringe, Thermometer, Weight,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ProntuarioDialog } from "@/components/prontuario-dialog";
import { VacinaDialog } from "@/components/vacina-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatDateTime, type Pet } from "@/lib/petcare";
import { fetchProntuarios, fetchVacinas, type Prontuario, type Vacina } from "@/lib/prontuario";

interface ProntuarioPetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet: Pet | null;
}

export function ProntuarioPetDialog({ open, onOpenChange, pet }: ProntuarioPetDialogProps) {
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([]);
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [novoAtendimento, setNovoAtendimento] = useState(false);
  const [novaVacina, setNovaVacina] = useState(false);

  const load = useCallback(async (petId: string) => {
    setLoading(true);
    setErro(null);
    try {
      const [p, v] = await Promise.all([fetchProntuarios(petId), fetchVacinas(petId)]);
      setProntuarios(p);
      setVacinas(v);
    } catch {
      setErro(
        "Não foi possível carregar o histórico médico. Confira se as tabelas prontuarios, vacinas e prescricoes existem no banco (supabase-setup.sql).",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && pet) void load(pet.id);
  }, [open, pet, load]);

  const reload = () => { if (pet) void load(pet.id); };

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="size-5 text-primary" />
              Prontuário de {pet?.nome ?? "—"}
            </DialogTitle>
            <DialogDescription>
              {pet ? `${pet.especie} • ${pet.raca || "SRD"} • Tutor: ${pet.tutorNome ?? "—"}` : ""}
            </DialogDescription>
          </DialogHeader>

          {erro && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p>
          )}

          <Tabs defaultValue="atendimentos">
            <TabsList className="w-full">
              <TabsTrigger value="atendimentos" className="flex-1">Atendimentos</TabsTrigger>
              <TabsTrigger value="vacinas" className="flex-1">Carteira de Vacinas</TabsTrigger>
              <TabsTrigger value="prescricoes" className="flex-1">Prescrições</TabsTrigger>
            </TabsList>

            {/* ---------------- Atendimentos ---------------- */}
            <TabsContent value="atendimentos" className="space-y-3 pt-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setNovoAtendimento(true)}>
                  <Plus className="size-4" /> Novo Atendimento
                </Button>
              </div>

              {loading && <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>}

              {!loading && prontuarios.length === 0 && !erro && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum atendimento registrado para este pet.
                </p>
              )}

              {!loading && prontuarios.map((p) => (
                <Card key={p.id} className="shadow-soft">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-bold">
                        <CalendarDays className="size-4 text-primary" />
                        {formatDateTime(p.dataAtendimento)}
                      </span>
                      <Badge variant="secondary" className="text-[11px] font-bold">
                        {p.veterinarioNome}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1">
                        <Weight className="size-3.5" /> {p.pesoKg !== null ? `${p.pesoKg} kg` : "—"}
                      </span>
                      <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1">
                        <Thermometer className="size-3.5" /> {p.temperaturaC !== null ? `${p.temperaturaC} °C` : "—"}
                      </span>
                      <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1">
                        <HeartPulse className="size-3.5" /> {p.frequenciaCardiaca ?? "—"} bpm
                      </span>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <p><span className="font-bold">Queixa:</span> {p.queixaPrincipal}</p>
                      {p.exameFisico && <p><span className="font-bold">Exame físico:</span> {p.exameFisico}</p>}
                      {p.diagnostico && <p><span className="font-bold">Diagnóstico:</span> {p.diagnostico}</p>}
                      {p.tratamentoRecomendado && (
                        <p><span className="font-bold">Tratamento:</span> {p.tratamentoRecomendado}</p>
                      )}
                    </div>

                    {p.prescricoes.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <Pill className="size-3.5" /> Prescrições
                          </p>
                          {p.prescricoes.map((m) => (
                            <p key={m.id} className="text-sm">
                              <span className="font-bold">{m.medicamento}</span> — {m.dosagem}, {m.frequencia}, por {m.duracaoDias} dia(s)
                              {m.instrucoesUso && <span className="text-muted-foreground"> ({m.instrucoesUso})</span>}
                            </p>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* ---------------- Vacinas ---------------- */}
            <TabsContent value="vacinas" className="space-y-3 pt-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setNovaVacina(true)}>
                  <Syringe className="size-4" /> Registrar Vacina
                </Button>
              </div>

              {loading && <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>}

              {!loading && vacinas.length === 0 && !erro && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma vacina registrada para este pet.
                </p>
              )}

              {!loading && vacinas.length > 0 && (
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vacina</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Aplicação</TableHead>
                        <TableHead>Próxima dose</TableHead>
                        <TableHead>Veterinário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vacinas.map((v) => {
                        const atrasada = Boolean(v.dataProximaDose) && v.dataProximaDose < hoje;
                        return (
                          <TableRow key={v.id}>
                            <TableCell className="font-bold">{v.nomeVacina}</TableCell>
                            <TableCell className="text-muted-foreground">{v.lote || "—"}</TableCell>
                            <TableCell>{formatDate(v.dataAplicacao + "T00:00:00")}</TableCell>
                            <TableCell>
                              {v.dataProximaDose ? (
                                <Badge variant={atrasada ? "destructive" : "secondary"} className="text-[11px] font-bold">
                                  {formatDate(v.dataProximaDose + "T00:00:00")}
                                </Badge>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{v.veterinarioNome}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* ---------------- Prescrições ---------------- */}
            <TabsContent value="prescricoes" className="space-y-3 pt-4">
              {loading && <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>}

              {!loading && prontuarios.every((p) => p.prescricoes.length === 0) && !erro && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma prescrição emitida para este pet.
                </p>
              )}

              {!loading && prontuarios
                .filter((p) => p.prescricoes.length > 0)
                .map((p) => (
                  <Card key={p.id} className="shadow-soft">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm font-bold">
                          <Activity className="size-4 text-primary" />
                          {formatDateTime(p.dataAtendimento)}
                        </span>
                        <Badge variant="secondary" className="text-[11px] font-bold">{p.veterinarioNome}</Badge>
                      </div>
                      {p.diagnostico && (
                        <p className="text-xs text-muted-foreground">Diagnóstico: {p.diagnostico}</p>
                      )}
                      <div className="space-y-2">
                        {p.prescricoes.map((m) => (
                          <div key={m.id} className="rounded-lg border p-3 text-sm">
                            <p className="font-bold">{m.medicamento} — {m.dosagem}</p>
                            <p className="text-muted-foreground">
                              {m.frequencia} • {m.duracaoDias} dia(s)
                            </p>
                            {m.instrucoesUso && (
                              <p className="mt-1 text-xs italic text-muted-foreground">{m.instrucoesUso}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ProntuarioDialog
        open={novoAtendimento}
        onOpenChange={setNovoAtendimento}
        defaultPetId={pet?.id}
        lockPet
        onSaved={reload}
      />
      <VacinaDialog
        open={novaVacina}
        onOpenChange={setNovaVacina}
        defaultPetId={pet?.id}
        lockPet
        onSaved={reload}
      />
    </>
  );
}
