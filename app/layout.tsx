import type { Metadata, Viewport } from "next";

import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { PwaSplash } from "@/components/pwa/pwa-splash";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "ÓRBITA — suas ideias, projetos e tarefas em um só lugar",
    template: "%s · ÓRBITA",
  },
  description:
    "Organize o que importa: um projeto principal, as tarefas do dia, cursos e arquivos. Sem jargão, sem ruído.",
  applicationName: "ÓRBITA",
  authors: [{ name: "ÓRBITA" }],
  robots: { index: false, follow: false },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icons/orbita.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "ÓRBITA",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#05030A" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <PwaSplash />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
