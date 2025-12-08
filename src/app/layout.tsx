import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PrecioÁgil",
  description: "Gestión inteligente de precios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/* AQUI ESTA LA MAGIA PARA QUITAR EL ERROR ROJO */}
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}