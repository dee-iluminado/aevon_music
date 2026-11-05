"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Music2,
} from "lucide-react";
import { AuthWall } from "@/components/auth-wall";
import { Logo } from "@/components/logo";
import { UserAvatar } from "@/components/user-avatar";
import { clearAuth, getAuth, login } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-white/[0.03] pl-11 pr-4 text-[13px] text-fg outline-none transition-colors placeholder:text-dim focus:border-ember/60";
const iconClass =
  "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dim";
const primaryButton =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-fg text-[13px] font-semibold text-bg transition-colors hover:bg-white disabled:opacity-60";
const secondaryButton =
  "inline-flex h-11 w-full items-center justify-center rounded-xl border border-line text-[13px] font-medium text-fg transition-colors hover:bg-white/5";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /* localStorage is read after mount so the prerendered markup and the first
     client render agree. */
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
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const result = await login(email, password);
      if (!result.ok) {
        setError(result.error ?? "Could not sign in.");
        return;
      }
      router.push("/account");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <AuthWall>
        <div className="text-center">
          <UserAvatar
            name={user.name}
            avatar={user.avatar}
            className="mx-auto mb-6 h-16 w-16 text-xl"
            textClassName="text-xl"
          />
          <h1 className="font-heading text-[30px] leading-tight text-fg">
            You&apos;re signed in
          </h1>
          <p className="mt-2 text-sm text-sub">
            {user.name} <span className="text-dim">· {user.email}</span>
          </p>
          <div className="mt-8 flex flex-col gap-2.5">
            <Link href="/account" className={primaryButton}>
              Go to your account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => {
                clearAuth();
                setEmail("");
                setPassword("");
                setError(null);
              }}
              className={secondaryButton}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
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
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-sub">
          Sign in to keep your favourites, playlists and downloads together.
        </p>
      </div>

      <div className="rounded-2xl border border-line/80 bg-white/[0.03] p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember ring-1 ring-ember/20">
            <Music2 className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-ember">
              AEVON
            </p>
            <p className="mt-1 text-[13px] font-medium text-fg">
              Your library, on this device
            </p>
            <p className="mt-1 truncate font-mono text-[10px] tracking-wide text-dim">
              No servers · no tracking
            </p>
          </div>
        </div>
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">
          or
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="relative">
          <label htmlFor="login-email" className="sr-only">
            Email
          </label>
          <Mail className={iconClass} />
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className={inputClass}
          />
        </div>

        <div className="relative">
          <label htmlFor="login-password" className="sr-only">
            Password
          </label>
          <Lock className={iconClass} />
          <input
            id="login-password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
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
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-sub">
        New to AEVON?{" "}
        <Link
          href="/signup"
          className="font-medium text-fg underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
      <p className="mt-5 text-center font-mono text-[9px] uppercase tracking-[0.24em] text-dim">
        Your account stays on this device
      </p>
    </AuthWall>
  );
}
