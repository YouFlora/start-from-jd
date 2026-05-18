import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Start From JD — 反向 SOP 简历助手",
  description:
    "从你自己开始而不是从 JD 开始。AI 帮你整理经历、对比 JD、生成 ATS 友好的单页简历。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
