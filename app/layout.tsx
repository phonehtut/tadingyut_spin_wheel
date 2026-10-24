import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "🏮 သီတင်းကျွတ် ကံစမ်းမဲ | Thadingyut Lucky Spin",
  description:
    "သီတင်းကျွတ်ပွဲတော် ကံစမ်းဘီးလှည့်ပြီး ဆုမဲရယူပါ! Spin the wheel and win exciting prizes this Thadingyut Festival!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="my">
      <body className="antialiased">{children}</body>
    </html>
  );
}
