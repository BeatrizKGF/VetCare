-- ============================================================
-- VetCare — Script de configuração do banco de dados
-- Execute no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard → seu projeto → SQL Editor → New query
-- (é seguro rodar mais de uma vez)
-- ============================================================

-- Tabela de tutores
CREATE TABLE IF NOT EXISTS public.tutores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(100) NOT NULL,
  cpf varchar(14) UNIQUE NOT NULL,
  email varchar(100) UNIQUE NOT NULL,
  telefone varchar(20) NOT NULL,
  endereco text,
  criado_em timestamp NOT NULL DEFAULT now(),
  atualizado_em timestamp NOT NULL DEFAULT now()
);

-- Tabela de pets (vinculada ao tutor; exclui em cascata)
CREATE TABLE IF NOT EXISTS public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES public.tutores(id) ON DELETE CASCADE,
  nome varchar(50) NOT NULL,
  especie varchar(30) NOT NULL,
  raca varchar(50),
  porte varchar(20) CHECK (porte IN ('Pequeno', 'Médio', 'Grande')),
  data_nascimento date,
  sexo char(1) CHECK (sexo IN ('M', 'F')),
  observacoes_medicas text,
  criado_em timestamp NOT NULL DEFAULT now(),
  atualizado_em timestamp NOT NULL DEFAULT now()
);

-- Tabela de veterinários
CREATE TABLE IF NOT EXISTS public.veterinarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(100) NOT NULL,
  crmv varchar(20) UNIQUE NOT NULL,
  especialidade varchar(50) NOT NULL,
  telefone varchar(20) NOT NULL,
  email varchar(100) UNIQUE NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamp NOT NULL DEFAULT now(),
  atualizado_em timestamp NOT NULL DEFAULT now()
);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS public.servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(100) NOT NULL,
  descricao text,
  preco decimal(10,2) NOT NULL,
  duracao_minutos int NOT NULL DEFAULT 30,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamp NOT NULL DEFAULT now(),
  atualizado_em timestamp NOT NULL DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  veterinario_id uuid REFERENCES public.veterinarios(id) ON DELETE SET NULL,
  servico_id uuid NOT NULL REFERENCES public.servicos(id),
  data_hora timestamp with time zone NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'Agendado' CHECK (status IN ('Agendado', 'Em Atendimento', 'Concluído', 'Cancelado')),
  observacoes text,
  criado_em timestamp NOT NULL DEFAULT now(),
  atualizado_em timestamp NOT NULL DEFAULT now()
);

-- Trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tutores_atualizado_em ON public.tutores;
CREATE TRIGGER trg_tutores_atualizado_em
  BEFORE UPDATE ON public.tutores
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

DROP TRIGGER IF EXISTS trg_pets_atualizado_em ON public.pets;
CREATE TRIGGER trg_pets_atualizado_em
  BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

DROP TRIGGER IF EXISTS trg_veterinarios_atualizado_em ON public.veterinarios;
CREATE TRIGGER trg_veterinarios_atualizado_em
  BEFORE UPDATE ON public.veterinarios
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

DROP TRIGGER IF EXISTS trg_servicos_atualizado_em ON public.servicos;
CREATE TRIGGER trg_servicos_atualizado_em
  BEFORE UPDATE ON public.servicos
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

DROP TRIGGER IF EXISTS trg_agendamentos_atualizado_em ON public.agendamentos;
CREATE TRIGGER trg_agendamentos_atualizado_em
  BEFORE UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- Permissões da Data API
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.veterinarios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO anon;
GRANT ALL ON public.tutores TO service_role;
GRANT ALL ON public.pets TO service_role;
GRANT ALL ON public.veterinarios TO service_role;
GRANT ALL ON public.servicos TO service_role;
GRANT ALL ON public.agendamentos TO service_role;

-- Row Level Security
ALTER TABLE public.tutores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veterinarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total a tutores (sem auth)" ON public.tutores;
CREATE POLICY "Acesso total a tutores (sem auth)"
  ON public.tutores FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total a pets (sem auth)" ON public.pets;
CREATE POLICY "Acesso total a pets (sem auth)"
  ON public.pets FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total a veterinarios (sem auth)" ON public.veterinarios;
CREATE POLICY "Acesso total a veterinarios (sem auth)"
  ON public.veterinarios FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total a servicos (sem auth)" ON public.servicos;
CREATE POLICY "Acesso total a servicos (sem auth)"
  ON public.servicos FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total a agendamentos (sem auth)" ON public.agendamentos;
CREATE POLICY "Acesso total a agendamentos (sem auth)"
  ON public.agendamentos FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- Prontuário eletrônico, carteira de vacinas e prescrições
-- ============================================================

CREATE TABLE IF NOT EXISTS public.prontuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  veterinario_id uuid REFERENCES public.veterinarios(id) ON DELETE SET NULL,
  veterinario_nome varchar(100),
  agendamento_id uuid REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  data_atendimento timestamp with time zone NOT NULL DEFAULT now(),
  peso_kg decimal(5,2),
  temperatura_c decimal(4,1),
  frequencia_cardiaca int,
  queixa_principal text NOT NULL,
  exame_fisico text,
  diagnostico text,
  tratamento_recomendado text,
  criado_em timestamp NOT NULL DEFAULT now(),
  atualizado_em timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vacinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  veterinario_id uuid REFERENCES public.veterinarios(id) ON DELETE SET NULL,
  veterinario_nome varchar(100),
  nome_vacina varchar(100) NOT NULL,
  lote varchar(50),
  data_aplicacao date NOT NULL,
  data_proxima_dose date,
  observacoes text,
  criado_em timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prescricoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prontuario_id uuid NOT NULL REFERENCES public.prontuarios(id) ON DELETE CASCADE,
  medicamento varchar(100) NOT NULL,
  dosagem varchar(50) NOT NULL,
  frequencia varchar(100) NOT NULL,
  duracao_dias int NOT NULL,
  instrucoes_uso text,
  criado_em timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prontuarios_pet ON public.prontuarios(pet_id);
CREATE INDEX IF NOT EXISTS idx_vacinas_pet ON public.vacinas(pet_id);
CREATE INDEX IF NOT EXISTS idx_prescricoes_prontuario ON public.prescricoes(prontuario_id);

DROP TRIGGER IF EXISTS trg_prontuarios_atualizado_em ON public.prontuarios;
CREATE TRIGGER trg_prontuarios_atualizado_em
  BEFORE UPDATE ON public.prontuarios
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prontuarios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vacinas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescricoes TO anon;
GRANT ALL ON public.prontuarios TO service_role;
GRANT ALL ON public.vacinas TO service_role;
GRANT ALL ON public.prescricoes TO service_role;

ALTER TABLE public.prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescricoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total a prontuarios (sem auth)" ON public.prontuarios;
CREATE POLICY "Acesso total a prontuarios (sem auth)"
  ON public.prontuarios FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total a vacinas (sem auth)" ON public.vacinas;
CREATE POLICY "Acesso total a vacinas (sem auth)"
  ON public.vacinas FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total a prescricoes (sem auth)" ON public.prescricoes;
CREATE POLICY "Acesso total a prescricoes (sem auth)"
  ON public.prescricoes FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- Estoque / Produtos e Financeiro
-- ============================================================

CREATE TABLE IF NOT EXISTS public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(100) NOT NULL,
  categoria varchar(50) NOT NULL,
  preco_custo decimal(10,2) DEFAULT 0.00,
  preco_venda decimal(10,2) NOT NULL,
  quantidade_estoque int NOT NULL DEFAULT 0,
  estoque_minimo int NOT NULL DEFAULT 5,
  unidade_medida varchar(20) DEFAULT 'UN',
  data_validade date,
  ativo boolean DEFAULT true,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transacoes_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao varchar(150) NOT NULL,
  tipo varchar(10) NOT NULL CHECK (tipo IN ('Receita','Despesa')),
  categoria varchar(50) NOT NULL,
  valor decimal(10,2) NOT NULL,
  data_vencimento date NOT NULL,
  data_pagamento date,
  status varchar(20) NOT NULL DEFAULT 'Pendente'
    CHECK (status IN ('Pendente','Pago','Atrasado','Cancelado')),
  forma_pagamento varchar(30),
  tutor_id uuid REFERENCES public.tutores(id) ON DELETE SET NULL,
  agendamento_id uuid REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  observacoes text,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_transacoes_venc ON public.transacoes_financeiras(data_vencimento DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_tutor ON public.transacoes_financeiras(tutor_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transacoes_financeiras TO anon;
GRANT ALL ON public.produtos TO service_role;
GRANT ALL ON public.transacoes_financeiras TO service_role;

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total a produtos (sem auth)" ON public.produtos;
CREATE POLICY "Acesso total a produtos (sem auth)"
  ON public.produtos FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total a transacoes (sem auth)" ON public.transacoes_financeiras;
CREATE POLICY "Acesso total a transacoes (sem auth)"
  ON public.transacoes_financeiras FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============ USUÁRIOS (login do sistema) ============
create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome varchar(100) not null,
  email varchar(100) unique not null,
  senha_hash varchar(255) not null,
  perfil varchar(20) not null default 'recepcionista',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

grant select, insert, update on public.usuarios to anon, authenticated;
grant all on public.usuarios to service_role;

alter table public.usuarios enable row level security;

drop policy if exists "usuarios acesso publico" on public.usuarios;
create policy "usuarios acesso publico" on public.usuarios
  for all to anon, authenticated using (true) with check (true);
