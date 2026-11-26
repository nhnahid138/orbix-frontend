"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { errorMessage } from "../../../lib/api";
import { useSession } from "../../providers";
import loginBanner from "../../../images/login.png";

export default function LoginPage() {
  const { login } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await login(email, password);
      const destination = params.get("next");
      router.replace(destination?.startsWith("/admin")
        ? (user.role === "admin" ? destination : "/account")
        : destination ?? (user.role === "admin" ? "/admin" : "/account"));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  const next = params.get("next");
  const registerHref = next ? "/register?next=" + encodeURIComponent(next) : "/register";

  return <main className="store-page auth-page login-page">
    <section className="auth-aside login-aside" aria-label="Orbix login banner">
      <Image className="login-aside-image" src={loginBanner} alt="Orbix, your trusted gadget shop" fill sizes="(max-width: 700px) 100vw, 520px" priority />
    </section>

    <section className="auth-panel login-panel" aria-labelledby="login-heading">
      <div className="login-heading"><span>WELCOME BACK</span><h1 id="login-heading">Sign in to Orbix</h1><p>Enter your details to continue shopping.</p></div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      <form className="stack-form login-form" onSubmit={submit}>
        <label>Email address<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label>Password<div className="login-password-field"><input type={showPassword ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? "Hide" : "Show"}</button></div></label>
        <button className="primary-button" disabled={busy}>{busy ? "Signing you in…" : "Sign in"}<span aria-hidden="true">→</span></button>
      </form>
      <p className="auth-switch">New to Orbix? <Link href={registerHref}>Create an account</Link></p>
      <p className="auth-guest"><Link href="/products">Continue browsing without an account <span aria-hidden="true">↗</span></Link></p>
    </section>
  </main>;
}
