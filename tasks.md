# Lista de Tarefas: CRM July Utensílios

## Fase 1: Configuração Inicial
- [ ] Configurar ambiente com Docker e Docker Compose (Backend, Frontend, PostgreSQL).
- [ ] Inicializar o projeto Django e configurar variáveis de ambiente (`.env`).
- [ ] Configurar Django REST Framework (DRF) e CORS.
- [ ] Instalar e configurar `djangorestframework-simplejwt` para autenticação JWT.
- [ ] Configurar o sistema de Audit Log (ex: `django-simple-history` ou similar).
- [ ] Inicializar o projeto Next.js com Tailwind CSS.
- [ ] Implementar fluxo de Login no Next.js com armazenamento de tokens JWT.
- [ ] Configurar interceptores no Frontend para o cabeçalho `Authorization`.

## Fase 2: Gestão de Cadastros (API & Frontend)
- [ ] Implementar Soft Delete para Clientes e Produtos.
- [ ] Criar Endpoints e Telas para o CRUD de Clientes com Máscaras e Validação Real-time.
- [ ] Criar Endpoints e Telas para o CRUD de Produtos com suporte a fotos.
- [ ] Implementar o modelo de Movimentação de Estoque com lógica de Baixa Automática e Estorno.
- [ ] Adicionar validações de CPF/CNPJ (Backend e Frontend).

## Fase 3: Vendas e Parcelamento (API & Frontend)
- [ ] Criar Endpoints e Telas para registro de Venda.
- [ ] Implementar o registro do Método de Pagamento nas parcelas.
- [ ] Desenvolver Modal de Baixa Rápida de parcelas no Frontend.
- [ ] Implementar a lógica de geração automática de parcelas e redução de estoque no Backend.

## Fase 4: Dashboard Financeiro (API & Frontend)
- [ ] Implementar endpoints para cálculo de Lucro Real e histórico mensal.
- [ ] Criar telas de Dashboard no Next.js com gráficos de faturamento e lucro.
- [ ] Implementar seção de Inadimplência com filtros.

## Fase 5: Finalização e Polimento
- [ ] Testar as permissões de Admin vs User.
- [ ] Revisar o design responsivo.
- [ ] Garantir que o upload de imagens funcione corretamente no PostgreSQL (caminho no banco).
