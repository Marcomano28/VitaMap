import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { Disclaimer } from "@/components/disclaimer";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased vitamap-recinto">
        <SiteHeader />
        <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
          <div className="vitamap-lienzo">{children}</div>
        </main>
        <Disclaimer locale={locale} />
      </body>
    </html>
  );
}
