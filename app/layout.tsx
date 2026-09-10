import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Poliglota",
  description: "Gestão de estudos de idiomas",
};

/**
 * Pinta o tema e posiciona a sidebar antes do primeiro frame. Sem isto a tela
 * pisca branca antes de o React assumir — e piscar branco no escuro é pior que
 * não ter tema escuro. A sidebar tem o mesmo problema: abriria larga e
 * encolheria na frente dela.
 */
const SCRIPT_INICIAL = `(function(){try{
  var t = localStorage.getItem('poliglota-tema') || 'sistema';
  var escuro = t === 'escuro' || (t === 'sistema' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', escuro);
  if (localStorage.getItem('poliglota-sidebar') === 'fechada') {
    document.documentElement.setAttribute('data-sidebar', 'fechada');
  }
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_INICIAL }} />
      </head>
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
