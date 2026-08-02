import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="pt-BR">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8F6F4",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          color: "#2A2933",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 460,
            background: "#ffffff",
            borderRadius: 28,
            padding: "40px 32px",
            boxShadow: "0 8px 30px rgba(42,41,51,0.06)",
            textAlign: "center",
          }}
        >
          <div
            aria-hidden
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background:
                "linear-gradient(135deg, #FFDAD8 0%, #FFE9E7 55%, #FFF4F2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 700,
              margin: "0 auto 16px",
            }}
          >
            404
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: "0 0 8px",
              letterSpacing: "-0.01em",
            }}
          >
            Página não encontrada
          </h1>
          <p style={{ color: "#616167", margin: "0 0 28px", lineHeight: 1.55 }}>
            A URL que você tentou acessar não existe ou foi movida. Volte para
            o painel e continue de onde parou.
          </p>
          <a
            href="/vendas"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 20px",
              borderRadius: 999,
              background: "#2A2933",
              color: "#ffffff",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 1px 2px rgba(42,41,51,0.1)",
            }}
          >
            Ir para Vendas
          </a>
          <div style={{ marginTop: 20 }}>
            <Link
              href="/"
              style={{
                color: "#616167",
                fontSize: 14,
                textDecoration: "underline",
              }}
            >
              Voltar para a página inicial
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
