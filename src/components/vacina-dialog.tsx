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
import { Textarea } from "@/components/ui/textarea";
import { usePetCare } from "@/lib/petcare-store";
import { createVacina } from "@/lib/prontuario";

interface VacinaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPetId?: string | undefined;
  lockPet?: boolean;
  onSaved?: () => void;
}

export function VacinaDialog({ open, onOpenChange, defaultPetId, lockPet, onSaved }: VacinaDialogProps) {
  const { pets, veterinarios } = usePetCare();
  const [petId, setPetId] = useState("");
  const [veterinarioId, setVeterinarioId] = useState("");
  const [nomeVacina, setNomeVacina] = useState("");
  const [lote, setLote] = useState("");
  const [dataAplicacao, setDataAplicacao] = useState("");
  const [dataProximaDose, setDataProximaDose] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setPetId(defaultPetId ?? "");
    setVeterinarioId("");
    setNomeVacina(""); setLote(""); setObservacoes(""); setDataProximaDose("");
    setDataAplicacao(new Date().toISOString().slice(0, 10));
  }, [open, defaultPetId]);

  const vetsAtivos = veterinarios.filter((v) => v.ativo || v.id === veterinarioId);

  const handleSubmit = async () => {
    const next: Record<string, string> = {};
    if (!petId) next["petId"] = "Selecione o pet.";
    if (!veterinarioId) next["veterinarioId"] = "Selecione o veterinário.";
    if (!nomeVacina.trim()) next["nomeVacina"] = "Informe o nome da vacina.";
    if (!dataAplicacao) next["dataAplicacao"] = "Informe a data de aplicação.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await createVacina({
        petId, veterinarioId,
        nomeVacina: nomeVacina.trim(),
        lote: lote.trim(),
        dataAplicacao,
        dataProximaDose,
        observacoes: observacoes.trim(),
      });
      toast.success(`Vacina "${nomeVacina.trim()}" registrada com sucesso.`);
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível registrar a vacina.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Vacina</DialogTitle>
          <DialogDescription>Adicione uma dose à carteira de vacinação digital do pet.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pet</Label>
            <Select value={petId} onValueChange={setPetId} disabled={Boolean(lockPet)}>
              <SelectTrigger><SelectValue placeholder="Selecione o pet" /></SelectTrigger>
              <SelectContent>
                {pets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome} — {p.tutorNome ?? "sem tutor"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors["petId"] && <p className="text-xs text-destructive">{errors["petId"]}</p>}
          </div>

          <div className="space-y-2">
            <Label>Veterinário aplicador</Label>
            <Select value={veterinarioId} onValueChange={setVeterinarioId}>
              <SelectTrigger><SelectValue placeholder="Selecione o veterinário" /></SelectTrigger>
              <SelectContent>
                {vetsAtivos.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.nome} — {v.crmv}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors["veterinarioId"] && <p className="text-xs text-destructive">{errors["veterinarioId"]}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vac-nome">Nome da vacina</Label>
              <Input id="vac-nome" placeholder="Ex.: V10, Antirrábica, Giárdia"
                value={nomeVacina} onChange={(e) => setNomeVacina(e.target.value)} />
              {errors["nomeVacina"] && <p className="text-xs text-destructive">{errors["nomeVacina"]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vac-lote">Lote</Label>
              <Input id="vac-lote" placeholder="Ex.: LT-2026-08"
                value={lote} onChange={(e) => setLote(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vac-data">Data de aplicação</Label>
              <Input id="vac-data" type="date" value={dataAplicacao}
                onChange={(e) => setDataAplicacao(e.target.value)} />
              {errors["dataAplicacao"] && <p className="text-xs text-destructive">{errors["dataAplicacao"]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vac-prox">Próxima dose</Label>
              <Input id="vac-prox" type="date" value={dataProximaDose}
                onChange={(e) => setDataProximaDose(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vac-obs">Observações</Label>
            <Textarea id="vac-obs" rows={2} value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Registrar vacina"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
