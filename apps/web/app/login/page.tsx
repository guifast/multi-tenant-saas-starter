import Link from "next/link";
import { AuthForm } from "../../components/auth-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <div className="container">
        <AuthForm mode="login" />
        <p style={{ textAlign: "center" }}>
          No account yet? <Link href="/register">Create one</Link>
        </p>
      </div>
    </main>
  );
}
