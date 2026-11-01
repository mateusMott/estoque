import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magazine | Controle de estoque",
  description: "Organize a entrada, a localização e a movimentação dos produtos da sua loja.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
