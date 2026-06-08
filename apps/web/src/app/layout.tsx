import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "HRMS - Hệ thống Quản lý Nhân sự",
  description: "Demo HRMS môn Kiểm thử và Kiểm soát chất lượng phần mềm",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
