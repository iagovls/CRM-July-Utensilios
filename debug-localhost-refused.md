# Debug Session: localhost-refused

Status: OPEN

## Sintoma
- O browser mostra: "localhost recusou estabelecer ligação".

## Hipóteses iniciais
- O frontend em `localhost:3000` não arrancou, por isso o browser não encontra nenhum servidor HTTP.
- O backend em `localhost:8000` falha no arranque por erro de dependências Python.
- O backend falha no arranque porque o PostgreSQL local não está disponível em `localhost:5432`.
- O utilizador está a abrir `localhost` sem porta, mas a aplicação corre noutra porta.
- O ambiente de terminal/sandbox não chegou a executar os comandos de arranque, apesar de aparentarem ter saído com sucesso.

## Evidência recolhida
- `backend/backend/settings.py` suporta PostgreSQL via `.env`.
- `.env` foi criado na raiz com `DB_ENGINE=postgres`.
- O browser integrado falha em `http://localhost:3000` e devolve `chrome-error://chromewebdata/`.
- O browser integrado falha em `http://localhost:8000` e devolve `chrome-error://chromewebdata/`.
- O browser integrado falha em `http://localhost` sem porta e devolve `chrome-error://chromewebdata/`.
- A pasta `my-app/node_modules` não existe, o que indica que o frontend ainda não teve dependências instaladas neste workspace.
- Ainda não existe evidência de backend Django efetivamente arrancado.

## Próximos passos
- Confirmar se o utilizador quer ajuda a arrancar manualmente os serviços ou a continuar a depuração automatizada.
- Instalar dependências do frontend e backend.
- Arrancar backend em `8000` e frontend em `3000`.
