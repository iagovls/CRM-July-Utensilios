# Checklist de Validação: CRM July Utensílios

## Cadastro de Usuários e Roles (Next.js & API)
- [ ] As senhas dos usuários estão salvas como hashes criptografados?
- [ ] O Login via JWT funciona e os tokens são anexados corretamente?
- [ ] O **Audit Log** registra ações de alteração e deleção por usuário?
- [ ] O controle de permissões Admin vs User está funcional na API?

## Cadastro de Clientes e Produtos (Next.js & API)
- [ ] O **Soft Delete** funciona (registro fica inativo, mas permanece no DB)?
- [ ] Máscaras de CPF/CNPJ, Telefone e Moeda estão ativas no Frontend?
- [ ] O Frontend avisa em tempo real sobre CPFs inválidos?
- [ ] A API permite campos nulos (exceto ID) conforme solicitado?

## Vendas, Parcelamento e Estoque
- [ ] O **Estoque reduz automaticamente** ao realizar uma venda?
- [ ] O **Estorno de estoque** ocorre ao cancelar uma venda?
- [ ] É possível registrar o **Método de Pagamento** em cada parcela?
- [ ] O **Modal de Baixa Rápida** permite quitar parcelas com um clique?

## Dashboard Financeiro e Inadimplência
- [ ] O Dashboard exibe o **Lucro Real** (`Venda - Compra`)?
- [ ] O gráfico de faturamento e lucro reflete os dados reais da API?
- [ ] A seção de inadimplência lista corretamente os atrasos?

## Requisitos Técnicos e Infra
- [ ] O projeto roda via **Docker Compose** (Frontend + Backend + DB)?
- [ ] As variáveis sensíveis estão isoladas no arquivo **.env**?
- [ ] O design é responsivo em dispositivos móveis?
