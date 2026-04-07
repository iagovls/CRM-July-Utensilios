# Especificação do Projeto: CRM July Utensílios

## 1. Visão Geral
Este sistema é um CRM (Customer Relationship Management) desenvolvido em Django e PostgreSQL, focado no gerenciamento de clientes, produtos, vendas e controle financeiro.

## 2. Tecnologias
- **Backend:** Django 5.x + Django REST Framework (DRF)
- **Banco de Dados:** PostgreSQL
- **Frontend:** Next.js (App Router) + Tailwind CSS + Lucide React (Ícones)
- **Autenticação:** JWT (JSON Web Tokens) via `djangorestframework-simplejwt`
- **Infraestrutura:** Docker & Docker Compose
- **Segurança:** Senhas criptografadas (hashing) no banco de dados utilizando os padrões do Django (PBKDF2 por padrão)
- **Ambiente:** Variáveis de ambiente (`.env`) para chaves e credenciais

## 3. Módulos e Funcionalidades

### 3.1. Gestão de Usuários e Permissões
- **Papéis (Roles):**
  - **Admin:** Acesso total ao sistema (cadastros, vendas, dashboard financeiro, gestão de usuários).
  - **User:** Acesso restrito (cadastros de clientes, produtos e realização de vendas, sem acesso a dados financeiros sensíveis ou exclusão de registros).
- **Autenticação:** Login (JWT), Logout e alteração de senha.
- **Audit Log:** Registro de "quem fez o quê" (ex: "Usuário X alterou o preço do produto Y").

### 3.2. Cadastro de Clientes
- Campos: Nome, CPF/CNPJ, E-mail, Telefone, Endereço completo.
- **Observação:** Todos os campos, exceto o ID, podem ser nulos no banco de dados.
- **Política de Exclusão:** Soft Delete (campo `is_active` ou `deleted_at`) para preservar histórico de vendas.
- Histórico de compras por cliente.

### 3.3. Cadastro de Produtos
- Campos: Nome, Descrição, Preço de Compra, Quantidade em Estoque, Categoria (Sugerido).
- **Observação:** Todos os campos, exceto o ID, podem ser nulos no banco de dados.
- **Fotos:** Possibilidade de adicionar múltiplas fotos para cada produto.
- **Política de Exclusão:** Soft Delete para preservar dados de vendas passadas.
- **Estoque Automático:**
  - **Baixa Automática:** Redução imediata ao realizar uma venda.
  - **Estorno:** Retorno ao estoque caso uma venda seja cancelada.
- **Movimentação de Estoque:** Registro de entradas e saídas.

### 3.4. Vendas e Parcelamento
- Seleção de Cliente e Produto.
- **Preço de Venda:** Definido no momento da venda.
- **Parcelamento:**
  - Número de parcelas e data da primeira parcela.
  - **Botão de Baixa:** Modal rápido para marcar parcelas como "Paga".
  - **Método de Pagamento:** Registrar se foi Dinheiro, Cartão, Pix, etc.
- Status da Venda: Pendente, Paga, Cancelada.

### 3.5. Dashboard Financeiro
- **Filtros:** Busca por período.
- **Visão Mensal:** Histórico de entradas e saídas.
- **Lucro Real:** Cálculo de `Preço de Venda - Preço de Compra`.
- **Inadimplência:** Clientes com qualquer parcela vencida e não paga.
- **Gráficos:** Visualização de lucros e faturamento.

### 3.6. Interface (UI/UX)
- **Máscaras de Input:** CPF/CNPJ, Telefone e Moeda (R$).
- **Validação Real-time:** Alertas imediatos (ex: CPF inválido) antes da submissão.

## 4. Definição da API RESTful

### 4.1. Endpoints Principais
| Recurso | Método | Endpoint | Descrição |
| :--- | :--- | :--- | :--- |
| **Autenticação** | POST | `/api/auth/login/` | Realiza login e retorna token/sessão |
| | POST | `/api/auth/logout/` | Encerra a sessão |
| **Clientes** | GET | `/api/clients/` | Lista todos os clientes |
| | POST | `/api/clients/` | Cria um novo cliente |
| | GET | `/api/clients/{id}/` | Detalhes de um cliente |
| | PUT/PATCH | `/api/clients/{id}/` | Atualiza um cliente |
| | DELETE | `/api/clients/{id}/` | Remove um cliente |
| **Produtos** | GET | `/api/products/` | Lista todos os produtos |
| | POST | `/api/products/` | Cria um novo produto |
| | GET | `/api/products/{id}/` | Detalhes de um produto |
| | PUT/PATCH | `/api/products/{id}/` | Atualiza um produto |
| | DELETE | `/api/products/{id}/` | Remove um produto |
| **Vendas** | GET | `/api/sales/` | Lista todas as vendas |
| | POST | `/api/sales/` | Registra uma nova venda e gera parcelas |
| **Financeiro** | GET | `/api/dashboard/summary/` | Dados resumidos para o dashboard |
| | GET | `/api/dashboard/overdue/` | Lista de parcelas inadimplentes |

### 4.2. Códigos de Status HTTP (RESTful)
- **200 OK:** Requisição bem-sucedida.
- **201 Created:** Recurso criado com sucesso (ex: novo cliente/venda).
- **204 No Content:** Recurso removido com sucesso.
- **400 Bad Request:** Erro na requisição (dados inválidos).
- **401 Unauthorized:** Usuário não autenticado.
- **403 Forbidden:** Usuário sem permissão (ex: User tentando acessar Admin).
- **404 Not Found:** Recurso não encontrado.
- **500 Internal Server Error:** Erro inesperado no servidor.

## 4. Requisitos Não Funcionais
- Design responsivo para uso em dispositivos móveis.
- Validação de CPF/CNPJ.
- Logs de atividades críticas (ex: exclusão de vendas).

## 5. Sugestões de Melhorias (Para discussão)
- **Notificações de Vencimento:** Alerta visual no dashboard para parcelas que vencem hoje ou amanhã.
- **Busca Global:** Barra de busca no topo para encontrar clientes ou produtos rapidamente.
- **Log de Auditoria:** Registrar quem realizou cada venda ou alteração no sistema.
- **Backup:** Rotina de backup do banco de dados PostgreSQL.
