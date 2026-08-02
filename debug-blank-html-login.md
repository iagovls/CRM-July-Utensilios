# Debug Session: blank-html-login
- **Status**: [OPEN]
- **Issue**: A rota de login/HTML fica em branco e o DevTools mostra request redirecionada sem conteúdo.
- **Debug Server**: http://127.0.0.1:7777/event
- **Log File**: .dbg/trae-debug-log-blank-html-login.ndjson

## Reproduction Steps
1. Abrir a aplicação local.
2. Navegar para a rota de login ou fluxo que termina em tela em branco.
3. Observar se a URL troca entre `/login`, `/` ou `/dashboard`.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | Loop de redirect entre middleware e rotas legadas | High | Low | Pending |
| B | Navegação client-side imediata após render do login | High | Low | Pending |
| C | Estado do AuthContext deixa a UI em `null` | Medium | Low | Pending |
| D | Falha em auth/project lookup aborta o render | Medium | Medium | Pending |
| E | Erro de runtime no componente de login impede renderização | Medium | Medium | Pending |

## Log Evidence
Instrumentation active in:
- `my-app/middleware.ts`
- `my-app/contexts/AuthContext.tsx`
- `my-app/app/login/page.tsx`
- `my-app/app/page.tsx`

## Verification Conclusion
Pending
