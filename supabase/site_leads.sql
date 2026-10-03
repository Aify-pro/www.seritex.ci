-- ════════════════════════════════════════════════════════════════════
-- PROPOSITION — NON APPLIQUÉE. À relire et valider avant tout `db push`.
-- À placer dans le dépôt de l'application (Aify-pro/Seritex) sous
-- supabase/migrations/00XX_site_leads.sql, au prochain numéro libre.
--
-- Pourquoi une table à part et pas `requests` ?
--   `requests.company_id` est obligatoire et `companies` est alimentée
--   par Sage (lecture seule). Un prospect du site n'a pas encore de fiche
--   client : il atterrit ici, puis un commercial le convertit en demande
--   (requests) une fois le client créé dans Sage.
-- ════════════════════════════════════════════════════════════════════

create table if not exists site_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  contact_name text not null check (length(contact_name) between 2 and 120),
  company_name text,
  email text not null,
  phone text not null,

  product_family text not null,   -- t-shirts | polos | corporate | ...
  technique text not null default 'conseil',
  quantity int not null check (quantity > 0),
  wanted_date date,
  message text,

  source text not null default 'site',
  user_agent text,

  -- Suivi côté application
  status text not null default 'nouveau'
    check (status in ('nouveau', 'contacte', 'converti', 'sans_suite')),
  assigned_commercial_id uuid references app_users(id),
  request_id uuid references requests(id),   -- renseigné à la conversion
  handled_at timestamptz
);

create index if not exists idx_site_leads_status on site_leads(status, created_at desc);

alter table site_leads enable row level security;

-- Le site insère avec la clé service role (qui contourne RLS) :
-- aucune politique INSERT pour anon/authenticated → personne d'autre ne peut écrire.

-- Lecture et suivi réservés aux commerciaux et au-dessus (fonctions de 0002_rls.sql).
create policy site_leads_select on site_leads for select
  using (is_commercial_or_above());

create policy site_leads_update on site_leads for update
  using (is_commercial_or_above())
  with check (is_commercial_or_above());
