# July Utensílios — CRM

Sistema de Gestão de Relacionamento com o Cliente (CRM) desenvolvido para a **July Utensílios**, com foco em automação de vendas, controle financeiro, gestão de produtos e clientes.

---

## Stack Tecnológica

| Camada          | Tecnologia                                                                 |
| --------------- | -------------------------------------------------------------------------- |
| Framework       | **Next.js 16** (App Router + Turbopack)                                    |
| UI              | **React 19** + **TypeScript 5** + **Tailwind CSS 4**                       |
| Ícones          | `lucide-react`                                                             |
| Backend / DB    | **Supabase** (Postgres + Auth + RLS) via `@supabase/ssr` + `@supabase/supabase-js` |
| Lint            | ESLint 9 + `eslint-config-next`                                            |
| Deploy          | Vercel (config via `vercel.json`)                                          |

---

## Funcionalidades Principais

O CRM possui os seguintes módulos organizados dentro do **Dashboard** (`app/(dashboard)`):

- **Clientes** — Cadastro, edição e listagem de clientes
- **Produtos** — Gestão completa do catálogo de produtos
- **Categorias** — Categorização do catálogo
- **Vendas** — Registro e acompanhamento de pedidos/vendas
- **Financeiro** — Controle de contas a pagar/receber, fluxo de caixa
- **Perfil** — Gestão do perfil do usuário autenticado e alteração de senha

### Autenticação & Multi-tenant

- Autenticação via **Supabase Auth** (e-mail/senha)
- Arquitetura **multi-tenant** com isolamento por `project_id` (validado via RLS)
- Slug padrão do projeto: `july-utensilios` (via `NEXT_PUBLIC_PROJECT_SLUG`)
- Validação de vínculo do usuário com o projeto através de RPCs (`is_project_member`, `get_project_role`)
- Roles suportados: `admin`, `user`, `viewer`

---

## Estrutura de Pastas

```
crm-july-utensilios/
├── app/
│   ├── (dashboard)/            # Rotas protegidas do dashboard
│   │   ├── categorias/
│   │   ├── clientes/
│   │   ├── financeiro/
│   │   ├── perfil/
│   │   ├── produtos/
│   │   ├── vendas/
│   │   ├── layout.tsx          # AppShell (Sidebar + TopBar + conteúdo)
│   │   └── page.tsx            # Página inicial do dashboard
│   ├── login/                  # Página de autenticação
│   ├── layout.tsx              # Root layout + Providers
│   ├── providers.tsx           # AuthContext wrapper
│   └── globals.css             # Estilos globais + Tailwind
├── components/                 # Componentes reutilizáveis
│   ├── Sidebar.tsx
│   ├── TopBar.tsx
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── KPICard.tsx
│   ├── Modal.tsx / ClientModal.tsx
│   ├── ClientesPage.tsx
│   ├── ProdutosPage.tsx
│   ├── VendasPage.tsx
│   ├── FinanceiroPage.tsx
│   └── PerfilPage.tsx
├── contexts/
│   └── AuthContext.tsx         # Contexto global de autenticação
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Client Supabase (Browser / Client Components)
│   │   └── server.ts           # Client Supabase (Server Components / Actions)
│   ├── auth.ts                 # SSOT: authService + helpers de identidade
│   ├── services.ts
│   └── utils.ts
├── types/
│   ├── index.ts                # Tipos de domínio (User, etc.)
│   └── supabase.ts             # Tipos gerados do schema Supabase
└── public/                     # Assets estáticos
```

---

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Supabase — obrigatórias
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-anon-key-aqui

# Slug do projeto (multi-tenant) — opcional, padrão: "july-utensilios"
NEXT_PUBLIC_PROJECT_SLUG=july-utensilios
```

> ⚠️ Nunca commite o arquivo `.env.local`. Ele já está listado no `.gitignore`.

---

## Instalação e Execução

### Pré-requisitos

- Node.js 20+
- npm (ou compatível)

### Passo a passo

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente** (vide seção anterior).

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000).

4. **Build para produção:**
   ```bash
   npm run build
   npm start
   ```

5. **Lint:**
   ```bash
   npm run lint
   ```

---

## Scripts Disponíveis

| Script           | Descrição                                              |
| ---------------- | ------------------------------------------------------ |
| `npm run dev`    | Inicia o ambiente de desenvolvimento (Turbopack)       |
| `npm run build`  | Gera o build de produção otimizado                     |
| `npm start`      | Sobe o servidor em modo produção (após build)          |
| `npm run lint`   | Executa ESLint em todos os arquivos do projeto         |

---

## Padrões e Convenções do Projeto

### Camada de Autenticação (`lib/auth.ts`)

- O `authService` é a **fonte única de verdade (SSOT)** para:
  - `login()` / `logout()`
  - `getMe()` (retorna o usuário normalizado com papel no projeto)
  - `subscribeAuthChanges()` (listener em tempo real)
  - `changePassword()` (verifica senha atual antes de alterar)
- O usuário é normalizado com `first_name`, `last_name`, `username`, `role`, `is_admin_role`, etc.

### Clientes Supabase

| Arquivo                | Onde usar                                      |
| ---------------------- | ---------------------------------------------- |
| `lib/supabase/client.ts` | **Client Components** (`'use client'`)         |
| `lib/supabase/server.ts` | **Server Components**, Route Handlers, Server Actions |

> ⚠️ Nunca armazene o cliente do Supabase em variáveis globais. Instancie sempre por requisição para evitar vazamento de sessão entre usuários.

### Regras de UI/UX

- Botões usam `rounded-xl` e cor primária `#FFDAD8` (tema premium SaaS)
- Layout do dashboard é gerenciado pelo `AppShell` em `(dashboard)/layout.tsx`
- Sidebar e TopBar só são renderizados quando o usuário está autenticado (`claims?.sub`)
- Mobile: `overflow-x-hidden` no html/body + `min-w-0` em containers flex para evitar scroll horizontal

### Navegação & Cache

- Após `signOut()`, sempre chame `router.refresh()` (para invalidar cache de Server Components) + `router.replace()` para redirecionamento
- Navegações client-side (`router.push`) **não** re-executam lógica de autenticação em Server Components

---

## Banco de Dados (Supabase)

A aplicação assume a existência das seguintes estruturas no schema `public`:

- Tabela `projects` (colunas: `id` UUID PK, `slug` TEXT único)
- Tabelas de negócio (`products`, `categories`, `clients`, `sales`, `financial_transactions`, etc.) com coluna `project_id` (UUID)
- **RLS (Row Level Security)** habilitado e validando `project_id` em todas as tabelas de negócio
- RPCs: `is_project_member(pid UUID)` e `get_project_role(pid UUID)`

> Os tipos TypeScript do schema ficam em `types/supabase.ts` (gerados via `supabase gen types typescript`).

---

## Deploy

### Vercel

O projeto já inclui `vercel.json`. Basta conectar o repositório na plataforma Vercel e configurar as mesmas variáveis de ambiente do `.env.local`.

---

## Licença

Projeto privado — July Utensílios © 2026
