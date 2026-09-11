-- ============================================================
-- VetCare — Exclusão de veterinários preservando o histórico
-- Execute este script uma única vez no SQL Editor do Supabase.
--
-- Regras:
--  * Prontuários e vacinas guardam o NOME do veterinário (snapshot),
--    então o histórico continua "no nome dele" mesmo após a exclusão.
--  * Agendamentos ficam SEM veterinário (null) e a interface mostra
--    um aviso de "agendamento sem veterinário".
-- ============================================================

-- 1) Colunas de snapshot do nome do veterinário
ALTER TABLE public.prontuarios ADD COLUMN IF NOT EXISTS veterinario_nome varchar(100);
ALTER TABLE public.vacinas      ADD COLUMN IF NOT EXISTS veterinario_nome varchar(100);

-- Preenche o snapshot para os registros já existentes
UPDATE public.prontuarios p
   SET veterinario_nome = v.nome
  FROM public.veterinarios v
 WHERE v.id = p.veterinario_id AND p.veterinario_nome IS NULL;

UPDATE public.vacinas va
   SET veterinario_nome = v.nome
  FROM public.veterinarios v
 WHERE v.id = va.veterinario_id AND va.veterinario_nome IS NULL;

-- 2) veterinario_id passa a ser opcional e a "soltar" na exclusão
ALTER TABLE public.prontuarios  ALTER COLUMN veterinario_id DROP NOT NULL;
ALTER TABLE public.vacinas      ALTER COLUMN veterinario_id DROP NOT NULL;
ALTER TABLE public.agendamentos ALTER COLUMN veterinario_id DROP NOT NULL;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conrelid::regclass AS tabela, conname
      FROM pg_constraint
     WHERE contype = 'f'
       AND confrelid = 'public.veterinarios'::regclass
       AND conrelid IN (
         'public.prontuarios'::regclass,
         'public.vacinas'::regclass,
         'public.agendamentos'::regclass
       )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tabela, r.conname);
  END LOOP;
END $$;

ALTER TABLE public.prontuarios
  ADD CONSTRAINT prontuarios_veterinario_id_fkey
  FOREIGN KEY (veterinario_id) REFERENCES public.veterinarios(id) ON DELETE SET NULL;

ALTER TABLE public.vacinas
  ADD CONSTRAINT vacinas_veterinario_id_fkey
  FOREIGN KEY (veterinario_id) REFERENCES public.veterinarios(id) ON DELETE SET NULL;

ALTER TABLE public.agendamentos
  ADD CONSTRAINT agendamentos_veterinario_id_fkey
  FOREIGN KEY (veterinario_id) REFERENCES public.veterinarios(id) ON DELETE SET NULL;

-- Validação: nenhuma FK para veterinarios deve permanecer sem ON DELETE SET NULL.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE contype = 'f'
       AND confrelid = 'public.veterinarios'::regclass
       AND conrelid IN (
         'public.prontuarios'::regclass,
         'public.vacinas'::regclass,
         'public.agendamentos'::regclass
       )
       AND confdeltype <> 'n'
  ) THEN
    RAISE EXCEPTION 'Ainda existe uma chave estrangeira de veterinários sem ON DELETE SET NULL';
  END IF;
END $$;
