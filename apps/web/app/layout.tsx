import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multi-Tenant SaaS Starter",
  description:
    "Production-oriented SaaS starter with tenant isolation, RBAC and audit logs.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="container topbar-inner">
              <Link className="brand" href="/">
                <span className="mark">MT</span>
                <span>Multi-Tenant SaaS Starter</span>
              </Link>
              <nav className="nav-actions" aria-label="Primary navigation">
                <Link className="button" href="/dashboard">
                  Console
                </Link>
                <Link className="button" href="/login">
                  Login
                </Link>
                <Link className="button primary" href="/register">
                  Create account
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
