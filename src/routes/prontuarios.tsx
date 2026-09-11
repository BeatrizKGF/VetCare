import { createFileRoute } from "@tanstack/react-router";
import { FileText, Loader2, Pill, Plus, Search, Stethoscope } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PetAvatar } from "@/components/pet-avatar";
import { ProntuarioDialog } from "@/components/prontuario-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime, normalizeSearch } from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";
import { fetchProntuariosRecentes, type Prontuario } from "@/lib/prontuario";

export const Route = createFileRoute("/prontuarios")({
  head: () => ({
    meta: [
      { title: "Prontuários — VetCare" },
      {
        name: "description",
        content:
          "Histórico clínico dos pacientes: atendimentos, sinais vitais, diagnósticos e prescrições médicas.",
      },
      { property: "og:title", content: "Prontuários — VetCare" },
      {
        property: "og:description",
        content: "Registre e consulte os atendimentos clínicos da sua clínica veterinária.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProntuariosPage,
});

function ProntuariosPage() {
  const { pets, tutorById } = usePetCare();
  const [registros, setRegistros] = useState<Prontuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRegistros(await fetchProntuariosRecentes());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar prontuários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const petById = useCallback((id: string) => pets.find((p) => p.id === id), [pets]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(search.trim());
    if (!q) return registros;
    return registros.filter((r) => {
      const pet = petById(r.petId);
      const tutor = pet ? tutorById(pet.tutorId) : undefined;
      return (
        (pet ? normalizeSearch(pet.nome).includes(q) : false) ||
        (tutor ? normalizeSearch(tutor.nome).includes(q) : false) ||
        normalizeSearch(r.veterinarioNome).includes(q) ||
        normalizeSearch(r.diagnostico).includes(q)
      );
    });
  }, [registros, search, petById, tutorById]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Prontuários</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {registros.length} atendimento(s) registrado(s) na clínica.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={pets.length === 0}>
          <Plus className="size-4" /> Novo Atendimento
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por pet, tutor, veterinário ou diagnóstico..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <Card className="shadow-soft">
          <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando atendimentos...
          </CardContent>
        </Card>
      )}

      {!loading && filtered.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <Stethoscope className="size-7 text-muted-foreground" />
            </span>
            <p className="text-lg font-bold">Nenhum atendimento encontrado</p>
            <p className="text-sm text-muted-foreground">
              Clique em &quot;Novo Atendimento&quot; para registrar uma consulta.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {!loading &&
          filtered.map((r) => {
            const pet = petById(r.petId);
            const tutor = pet ? tutorById(pet.tutorId) : undefined;
            return (
              <Card key={r.id} className="shadow-soft">
                <CardContent className="flex flex-wrap items-start gap-4 p-4">
                  {pet ? (
                    <PetAvatar pet={pet} size="sm" />
                  ) : (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-muted">
                      <FileText className="size-4 text-muted-foreground" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-bold">
                      {pet?.nome ?? "Pet removido"}
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        • Tutor: {tutor?.nome ?? "—"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(r.dataAtendimento)} • {r.veterinarioNome}
                    </p>
                    {r.queixaPrincipal && (
                      <p className="text-sm">
                        <span className="font-semibold">Queixa:</span> {r.queixaPrincipal}
                      </p>
                    )}
                    {r.diagnostico && (
                      <p className="text-sm">
                        <span className="font-semibold">Diagnóstico:</span> {r.diagnostico}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {r.prescricoes.length > 0 && (
                      <Badge variant="secondary" className="text-[11px] font-bold">
                        <Pill className="mr-1 size-3" />
                        {r.prescricoes.length} prescrição(ões)
                      </Badge>
                    )}
                    {r.pesoKg !== null && (
                      <span className="text-xs text-muted-foreground">{r.pesoKg} kg</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      <ProntuarioDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => void load()}
      />
    </div>
  );
}
