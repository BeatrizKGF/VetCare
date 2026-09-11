import bcrypt from "bcryptjs";
import { Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

interface UsuarioRow {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
}

const PERFIS = ["admin", "veterinario", "recepcionista"] as const;

export function UsuariosSection() {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", perfil: "recepcionista", senha: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, email, perfil, ativo")
      .eq("ativo", true)
      .order("nome");
    if (error) toast.error(`Erro ao carregar usuários: ${error.message}`);
    setUsuarios((data as UsuarioRow[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.email.trim() || form.senha.length < 4) {
      toast.error("Preencha nome, e-mail e uma senha com pelo menos 4 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const senha_hash = await bcrypt.hash(form.senha, 10);
      const { error } = await supabase.from("usuarios").insert({
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        perfil: form.perfil,
        senha_hash,
        ativo: true,
      });
      if (error) throw new Error(error.message);
      toast.success("Usuário cadastrado com sucesso.");
      setOpen(false);
      setForm({ nome: "", email: "", perfil: "recepcionista", senha: "" });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível cadastrar o usuário.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-extrabold">
            <ShieldCheck className="size-4 text-primary" /> Gerenciar usuários
          </CardTitle>
          <CardDescription>Usuários ativos com acesso ao sistema VetCare.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <UserPlus className="size-4" /> Novo usuário
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando usuários…
          </div>
        ) : usuarios.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">Nenhum usuário ativo encontrado.</p>
        ) : (
          usuarios.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{u.nome}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold capitalize text-primary">
                {u.perfil}
              </span>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>
              Cadastre um novo acesso ao sistema. Todos os perfis têm acesso completo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-nome">Nome</Label>
              <Input
                id="u-nome"
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-email">E-mail</Label>
              <Input
                id="u-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-perfil">Perfil</Label>
              <Select
                value={form.perfil}
                onValueChange={(v) => setForm((p) => ({ ...p, perfil: v }))}
              >
                <SelectTrigger id="u-perfil">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PERFIS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-senha">Senha</Label>
              <Input
                id="u-senha"
                type="password"
                value={form.senha}
                onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null} Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
