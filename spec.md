# Especificacao do Projeto: CRM July Utensilios

## 1. Visao Geral
Este sistema e um CRM (Customer Relationship Management) full-stack baseado em Next.js e Supabase, focado no gerenciamento de clientes, produtos, vendas e controle financeiro. Deploy na Vercel com banco de dados PostgreSQL gerenciado pelo Supabase.

## 2. Tecnologias
- **Frontend & Backend (Full-stack):** Next.js 16+ (App Router) + React 19 + TypeScript
- **Banco de Dados:** PostgreSQL via Supabase (com RLS habilitado em todas as tabelas do CRM)
- **Autenticacao:** Supabase Auth (email/senha, OAuth, magic links - gerenciaveis via dashboard Supabase)
- **Estilizacao:** Tailwind CSS 4
- **Icones:** lucide-react
- **ORM/Cliente DB:** @supabase/supabase-js + @supabase/ssr (App Router Server Components)
- **Gerenciamento de Sessao:** Cookies HTTP (via middleware Next.js, SSR seguro)
- **Deploy:** Vercel (Next.js otimizado para edge + serverless)
- **Armazenamento de Arquivos:** Supabase Storage (futuro: imagens de produtos)
- **Seguranca:** Row Level Security (RLS) em todas as tabelas; politicas por role (admin/user)
- **Ambiente:** Variaveis de ambiente (`.env.local` / Vercel env vars)

## 3. Modulos e Funcionalidades

### 3.1. Gestao de Usuarios e Permissoes
- **Usuarios:** Gerenciados via `auth.users` do Supabase. Perfil estendido em `public.user_profiles` (1:1)
- **Papeis (Roles):** Enum `user_role` = `admin` | `user`
  - **Admin:** Acesso total ao sistema (cadastros, vendas, dashboard financeiro, gestao de usuarios, exclusao via soft delete, auditoria).
  - **User:** Acesso restrito (cadastros de clientes, produtos e realizacao de vendas, baixa de parcelas; SEM acesso a dados financeiros sensiveis ou exclusao de registros).
- **Atribuicao de role:** Definida via `auth.users.raw_app_meta_data->>'role'` no momento da criacao (Supabase dashboard / API administrativa). Trigger `on_auth_user_created` replica automaticamente para `public.user_profiles.role`.
- **Autenticacao:** Login, Logout e sessao persistida via cookies (middleware `updateSession`).
- **Audit Log:** Tabela `public.audit_logs` com triggers automáticos em INSERT/UPDATE/DELETE nas tabelas criticas (`clients`, `categories`, `products`, `sales`, `sale_items`, `installments`). Apenas ADMIN le.

### 3.2. Cadastro de Clientes
- Tabela: `public.clients` (Soft Delete: `is_active` + `deleted_at`)
- Campos: `name`, `document` (CPF/CNPJ), `email`, `phone`, `address`
- **Politica:** Todos os campos, exceto `id`, sao nulos no banco de dados (compatibilidade com especificacao original).
- **Ordenacao default:** `name ASC, id ASC`
- Historico de compras por cliente: obtido via FK `sales.customer_id -> clients.id`

### 3.3. Cadastro de Produtos
- Tabelas: `public.products` + `public.categories` + `public.product_images` (Soft Delete em products e categories)
- **Produto:** `name`, `description`, `purchase_price` (numeric 10,2), `stock_quantity`, `category_id` FK -> categories, `category` (text livre, duplicado para facilitar queries sem join)
- **Categorias:** `name` UNIQUE (apenas ativos)
- **Fotos:** `product_images.product_id` FK + `image_url` (usa Supabase Storage no futuro)
- **Estoque Automatico (a implementar via Server Actions / funcoes Postgres):**
  - **Baixa Automatica:** Ao criar uma venda aprovada
  - **Estorno:** Retorno ao estoque caso uma venda seja cancelada
- **Movimentacao de Estoque:** `public.stock_movements` com FK para `products`, tipo `stock_movement_type` (entry | sale | reversal), `actor_id` (quem fez) e `created_at` DESC

### 3.4. Vendas e Parcelamento
- Tabelas: `public.sales` + `public.sale_items` + `public.installments`
- **Venda (Sale):**
  - `customer_id` FK -> clients (nullable SET NULL)
  - `status` enum: pending | paid | canceled (default pending)
  - `installments_count` (default 1)
  - `first_due_date` (date, obrigatorio)
  - `total_amount` / `total_cost` (numeric 12,2)
  - `created_by_id` FK -> user_profiles (autor da venda)
- **Item de Venda (SaleItem):**
  - `sale_id` FK, `product_id` FK PROTECT (nao deleta produto com venda), `quantity`, `sale_price`, `purchase_price`
- **Parcelas (Installments):**
  - UNIQUE `(sale_id, number)`
  - `due_date`, `amount`, `paid_amount` (default 0), `status` (pending|paid), `payment_method` (cash|card|pix|transfer|other), `paid_at` timestamptz
  - **Botao de Baixa:** Atualiza `status='paid'`, `paid_amount=amount`, `paid_at=now()`, `payment_method`

### 3.5. Dashboard Financeiro
- Obtido via queries agregadas em `sales` + `installments`
- **Filtros:** Busca por periodo (`created_at`, `due_date`)
- **Visao Mensal:** Historico de entradas e saidas
- **Lucro Real:** `SUM(sale_items.sale_price - sale_items.purchase_price)` por periodo
- **Inadimplencia:** `installments` com `due_date < today` AND `status = 'pending'`
- **Gráficos:** Recomendacao: Recharts (frontend) sobre dados agregados via Supabase RPC ou query agregada no Server Component

### 3.6. Interface (UI/UX)
- **Mascaras de Input:** CPF/CNPJ, Telefone e Moeda (R$). (Ja existentes parcialmente no frontend via componentes; manter)
- **Validacao Real-time:** Alertas imediatos (ex: CPF invalido) antes da submissao.

## 4. Modelo de Dados (Esquema Logico)
```
auth.users (Supabase built-in)
   |--1:1--> public.user_profiles (id FK uuid, role enum)
                    |
                    |--<FK----> audit_logs.actor_id
                    |--<FK----> stock_movements.actor_id
                    |--<FK----> sales.created_by_id

public.clients (Soft Delete)
   |--<FK----> sales.customer_id

public.categories (Soft Delete)
   |--<FK----> products.category_id

public.products (Soft Delete)
   |--<FK----> product_images.product_id (CASCADE)
   |--<FK----> stock_movements.product_id (CASCADE)
   |--<PROTECT>- sale_items.product_id
   |--<FK----> (indireto via sale_items -> sales) clients

public.sales
   |--<FK----> sale_items.sale_id (CASCADE)
   |--<FK----> installments.sale_id (CASCADE)

public.installments UNIQUE(sale_id, number)

public.audit_logs (INSERT triggerada automaticamente)
```

Todas as tabelas publicas do CRM possuem `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Politicas separadas para Admin (ALL) e User (restrito: read+insert+update de ativos, sem DELETE fisico). Soft delete controlado via `is_active` e `deleted_at` em clients/categories/products.

## 5. Infraestrutura e Deploy

### 5.1. Vercel (Frontend + Serverless Functions)
- Repositorio: Raiz `/my-app` (Next.js)
- Variaveis de ambiente a configurar no painel da Vercel (iguais a `.env.example`):
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://hfpraktybxnafyixbmqa.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<anon key>` (publicavel)
- Build command: `next build` (output otimizado serverless + edge)
- Middleware `middleware.ts` intercepta requests:
  - Rotas `/dashboard/*` exigem sessao valida -> redirect para `/login`
  - Rota `/login` com sessao valida -> redirect `/dashboard`
  - Atualiza cookies de sessao Supabase (refresh token transparente)

### 5.2. Supabase (Banco + Auth + Storage)
- Provisionado via dashboard Supabase
- Migrations versionadas: `supabase/migrations/*.sql` (inicial: `20260802000000_init_crm_schema.sql`)
- Registro de migrations aplicaveis: `apply_migration` MCP ou `supabase db push` CLI
- Tipos TypeScript gerados automaticamente: `my-app/types/supabase.ts` (Database, Tables, Enums, etc.)
- Clients:
  - Browser: `lib/supabase/client.ts` (`createBrowserClient`)
  - Server Components/Route Handlers: `lib/supabase/server.ts` (`createServerClient` com cookies)

## 6. Seguranca: RLS + Roles
Funcoes auxiliares (imutaveis, STABLE, SECURITY DEFINER):
- `public.get_current_user_role()`: retorna `user_profiles.role` do auth.uid atual
- `public.is_admin()`: true se `role='admin'` OU `auth.users.raw_app_meta_data->>'role'='admin'`

Padrao de politicas (todas as tabelas CRM):
1. **SELECT admin** + **SELECT authenticated on is_active=true** (exceto user_profiles: so mesmo usuario ve o proprio)
2. **ALL para admin** (policy `*_admin_all` USING is_admin())
3. **INSERT/UPDATE para user autenticado** (sem DELETE - soft delete apenas para admin)

Auditoria: triggers `*_audit` em INSERT/UPDATE/DELETE gravam `public.audit_logs` (apenas admin visualiza via policy).

## 7. Definicao de API (substituicao do Django DRF)
Nao existe mais backend separado. Tudo e resolvido via:
- **Server Components** (App Router) que consultam Supabase diretamente (via `lib/supabase/server.ts`) e renderizam HTML seguro.
- **Route Handlers** (`app/api/**/route.ts`) - opcional quando logica de negocio complexa (RPC, baixa de parcela com atualizacao de estoque, etc).
- **Client-side Mutations** usando Server Actions (`'use server'`) ou `createClient()` browser com RLS garantindo permissoes.

Exemplos de operacoes / equivalencia a antiga API REST:

| Recurso | Como fazer na nova arquitetura |
| :--- | :--- |
| **Auth login** | `supabase.auth.signInWithPassword({email, password})` (client) |
| **Auth logout** | `supabase.auth.signOut()` + redirect |
| **Auth me** | Server Component: `(await supabase.auth.getUser())` + JOIN `user_profiles` |
| **Listar clientes ativos** | `supabase.from('clients').select().eq('is_active', true).order('name')` |
| **Criar cliente** | `supabase.from('clients').insert({...}).select()` (RLS garante auth) |
| **Editar cliente** | `supabase.from('clients').update({...}).eq('id', id)` |
| **Soft delete cliente (ADMIN)** | `update({is_active:false, deleted_at:'now()'}).eq('id', id)` (admin) |
| **Criar venda + parcelas** | Server Action / Route Handler: transacao em SQL ou multiplos inserts |
| **Dashboard resumo** | SQL agregado (GROUP BY month) via `.rpc(...)` ou query multi-select |
| **Inadimplentes** | `from('installments').select('*, sales(*)').lt('due_date', today).eq('status','pending')` |

Status HTTP / erros: tratados via Supabase `{ error }` de cada chamada e componentes de UI.

## 8. Requisitos Nao Funcionais
- Design responsivo para uso em dispositivos moveis.
- Validacao de CPF/CNPJ (frontend + opcionalmente banco).
- Logs de atividades criticas via `public.audit_logs` (triggers automaticos).
- Migracoes versionadas em `supabase/migrations/` - NUNCA alterar schema manualmente no dashboard sem migrar.

## 9. Sugestoes de Melhorias
- **Notificacoes de Vencimento:** Supabase Edge Functions + cron (pg_cron ja instalavel no dashboard) ou Supabase Realtime + toast no frontend.
- **Busca Global:** Supabase pg_trgm (extensao ja disponivel) + `text %> 'query'` em clients/products
- **Backup:** Supabase ja faz PITR automatico (em plano pago). Exportar dumps CSV periodicamente via dashboard.
- **Upload de imagens:** Criar bucket `product-images` no Supabase Storage e politica RLS associada.
