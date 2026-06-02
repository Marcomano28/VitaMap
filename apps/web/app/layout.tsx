import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { Disclaimer } from "@/components/disclaimer";
import { getLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: {
    default: "VitaMap",
    template: "%s · VitaMap",
  },
  description:
    "Memoria personal de salud con asistente reflexivo. Herramienta educativa, no dispositivo médico.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        <SiteHeader />
        <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
          {children}
        </main>
        <Disclaimer locale={locale} />
      </body>
    </html>
  );
}
