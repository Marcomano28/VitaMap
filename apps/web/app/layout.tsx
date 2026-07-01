import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { Disclaimer } from "@/components/disclaimer";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import { ThemeProvider } from "@/components/theme-provider";

// El encabezado consulta la sesión y la suscripción en cada petición.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: {
      default: "VitaMap",
      template: "%s · VitaMap",
    },
    description: localize(locale, {
      es: "Memoria personal de salud con asistente reflexivo. Herramienta educativa, no dispositivo médico.",
      de: "Persönlicher Gesundheitsspeicher mit reflektierendem Assistenten. Pädagogisches Werkzeug, kein Medizinprodukt.",
    }),
    robots: { index: false, follow: false },
  };
}

const themeScript = `
  (function () {
    try {
      const theme = localStorage.getItem("vitamap-theme") || "warm-dark";
      const resolved =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme === "warm-light"
            ? "light"
            : theme === "warm-dark"
              ? "dark"
              : theme;
      const palette =
        theme === "warm-light" || theme === "warm-dark" ? "warm" : "cool";
      document.documentElement.setAttribute("data-theme", resolved);
      document.documentElement.setAttribute("data-palette", palette);
      document.documentElement.setAttribute("data-theme-mode", palette + "-" + resolved);
      document.documentElement.classList.add(resolved);
    } catch (e) {}
  })();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col antialiased vitamap-recinto">
        <ThemeProvider>
          <SiteHeader />
          <main className="vitamap-main flex-1 mx-auto w-full max-w-4xl px-4 py-5 sm:py-8">
            <div className="vitamap-lienzo">{children}</div>
          </main>
          <Disclaimer locale={locale} />
        </ThemeProvider>
      </body>
    </html>
  );
}
