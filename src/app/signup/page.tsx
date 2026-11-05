"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { AuthWall } from "@/components/auth-wall";
import { Logo } from "@/components/logo";
import { getAuth, signUp } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-white/[0.03] pl-11 pr-4 text-[13px] text-fg outline-none transition-colors placeholder:text-dim focus:border-ember/60";
const iconClass =
  "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dim";
const primaryButton =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-fg text-[13px] font-semibold text-bg transition-colors hover:bg-white disabled:opacity-60";
const secondaryButton =
  "inline-flex h-11 w-full items-center justify-center rounded-xl border border-line text-[13px] font-medium text-fg transition-colors hover:bg-white/5";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getAuth());
    const onAuth = () => setUser(getAuth());
    window.addEventListener("aevon-auth", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("aevon-auth", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError("Fill in your name, email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("That email address doesn't look right.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const result = await signUp(name, email, password);
      if (!result.ok) {
        setError(result.error ?? "Could not create the account.");
        return;
      }
      setUser(result.user ?? getAuth());
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <AuthWall>
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-panel-2">
            <Check className="h-7 w-7 text-primary-3" />
          </div>
          <h1 className="font-heading text-[30px] leading-tight text-fg">
            You&apos;re all set
          </h1>
          <p className="mt-2 text-sm text-sub">
            {user.name} <span className="text-dim">· {user.email}</span>
          </p>
          <p className="mt-4 text-sm text-sub">
            Everything you saved before signing up moved with you.
          </p>
          <div className="mt-8 flex flex-col gap-2.5">
            <Link href="/" className={primaryButton}>
              Start listening
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/account" className={secondaryButton}>
              Manage account
            </Link>
          </div>
        </div>
      </AuthWall>
    );
  }

  return (
    <AuthWall>
      <div className="mb-8">
        <Logo className="mb-7 [&>span]:text-base" />
        <h1 className="font-heading text-[30px] leading-tight text-fg">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-sub">
          Keep your favourites, playlists and downloads together — and pick up
          right where you left off.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="relative">
          <label htmlFor="signup-name" className="sr-only">
            Name
          </label>
          <User className={iconClass} />
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            className={inputClass}
          />
        </div>

        <div className="relative">
          <label htmlFor="signup-email" className="sr-only">
            Email
          </label>
          <Mail className={iconClass} />
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className={inputClass}
          />
        </div>

        <div className="relative">
          <label htmlFor="signup-password" className="sr-only">
            Password
          </label>
          <Lock className={iconClass} />
          <input
            id="signup-password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (min. 6 characters)"
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPw((value) => !value)}
            aria-label={showPw ? "Hide password" : "Show password"}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dim transition-colors hover:text-sub"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && (
          <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={primaryButton}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-sub">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-fg underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
      <p className="mt-5 text-center font-mono text-[9px] uppercase tracking-[0.24em] text-dim">
        Your account stays on this device
      </p>
    </AuthWall>
  );
}
