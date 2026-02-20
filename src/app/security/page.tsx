import { ThemeToggle } from "@/components/theme-toggle";
import { Brain, Shield, Lock, Server, Key, Eye, FileCheck, RefreshCw, AlertTriangle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Security - Emailligence",
  description: "Emailligence security practices. Learn how we protect your data and maintain platform security.",
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/10">
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold font-mono tracking-wider">EMAILLIGENCE</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/#features" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Features</Link>
            <Link href="/#how-it-works" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">How it works</Link>
            <Link href="/pricing" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200" asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12">
            <p className="text-zinc-500 text-sm uppercase tracking-wide mb-4">Security</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Security Practices</h1>
            <p className="text-zinc-500">Last updated: February 20, 2026</p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {[
              { icon: Lock, title: "Encryption at Rest", desc: "AES-256-GCM for all stored tokens" },
              { icon: Globe, title: "Encryption in Transit", desc: "HTTPS with HSTS preloading" },
              { icon: Shield, title: "CSRF Protection", desc: "Origin-based request validation" },
              { icon: Key, title: "OAuth Security", desc: "Nonce-verified authorization flows" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-zinc-200 dark:border-white/10 p-5 bg-zinc-50 dark:bg-white/5">
                <Icon className="h-5 w-5 text-zinc-400 mb-3" />
                <h3 className="font-medium mb-1">{title}</h3>
                <p className="text-sm text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>

          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-5 w-5 text-zinc-400 shrink-0" />
                <h2 className="text-2xl font-semibold">1. Token Encryption at Rest</h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                All Gmail OAuth tokens (access tokens and refresh tokens) are encrypted before storage
                using <strong className="text-zinc-900 dark:text-white">AES-256-GCM</strong>, an
                authenticated encryption algorithm that provides both confidentiality and integrity
                verification.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400 mt-3">
                <li>256-bit encryption key stored as an environment variable, never in source code</li>
                <li>Unique initialization vector (IV) generated per encryption operation</li>
                <li>GCM authentication tags verify data integrity on every decryption</li>
                <li>Tokens are decrypted only in-memory at the moment of use and never written back in plaintext</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Key className="h-5 w-5 text-zinc-400 shrink-0" />
                <h2 className="text-2xl font-semibold">2. OAuth Flow Security</h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                The Gmail OAuth authorization flow is protected against replay and CSRF attacks through
                multiple layers of validation:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400 mt-3">
                <li>
                  <strong className="text-zinc-900 dark:text-white">Cryptographic nonce</strong> &mdash;
                  A random nonce is generated at the start of each OAuth flow, stored in an HttpOnly,
                  Secure cookie, and embedded in the OAuth state parameter. The callback verifies the
                  nonce matches before accepting tokens.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">State expiry</strong> &mdash;
                  OAuth state parameters expire after 5 minutes, preventing stale authorization attempts.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">User binding</strong> &mdash;
                  The authenticated user ID is embedded in the OAuth state and verified on callback,
                  ensuring tokens are associated with the correct account.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">Single-use nonce</strong> &mdash;
                  The nonce cookie is deleted immediately after successful verification, preventing replay.
                </li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-zinc-400 shrink-0" />
                <h2 className="text-2xl font-semibold">3. CSRF Protection</h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                All state-changing HTTP methods (POST, PATCH, PUT, DELETE) are protected by
                Origin header validation in the application middleware. Cross-origin requests
                that do not match the application&apos;s host are rejected with a 403 status.
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3">
                External webhook endpoints (such as Stripe webhooks) are exempted and instead
                validate requests using their own signature-based verification.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-5 w-5 text-zinc-400 shrink-0" />
                <h2 className="text-2xl font-semibold">4. HTTP Security Headers</h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                Every response includes the following security headers:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-white/10">
                      <th className="text-left py-2 pr-4 font-medium">Header</th>
                      <th className="text-left py-2 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-600 dark:text-zinc-400">
                    <tr className="border-b border-zinc-100 dark:border-white/5">
                      <td className="py-2 pr-4 font-mono text-xs">Strict-Transport-Security</td>
                      <td className="py-2 font-mono text-xs">max-age=63072000; includeSubDomains; preload</td>
                    </tr>
                    <tr className="border-b border-zinc-100 dark:border-white/5">
                      <td className="py-2 pr-4 font-mono text-xs">X-Content-Type-Options</td>
                      <td className="py-2 font-mono text-xs">nosniff</td>
                    </tr>
                    <tr className="border-b border-zinc-100 dark:border-white/5">
                      <td className="py-2 pr-4 font-mono text-xs">X-Frame-Options</td>
                      <td className="py-2 font-mono text-xs">DENY</td>
                    </tr>
                    <tr className="border-b border-zinc-100 dark:border-white/5">
                      <td className="py-2 pr-4 font-mono text-xs">Referrer-Policy</td>
                      <td className="py-2 font-mono text-xs">strict-origin-when-cross-origin</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">Permissions-Policy</td>
                      <td className="py-2 font-mono text-xs">camera=(), microphone=(), geolocation=()</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-5 w-5 text-zinc-400 shrink-0" />
                <h2 className="text-2xl font-semibold">5. Error Handling</h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                All API error responses return generic user-facing messages. Internal error details,
                stack traces, and database error messages are never exposed to the client. Errors are
                logged server-side with sanitized output that strips sensitive data such as tokens and
                credentials.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <FileCheck className="h-5 w-5 text-zinc-400 shrink-0" />
                <h2 className="text-2xl font-semibold">6. Input Validation</h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                User-supplied inputs are validated before use. Email addresses are validated with
                a strict regex before being passed to Gmail API queries to prevent query injection.
                API endpoints enforce field allow-lists so only expected fields can be updated.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-zinc-400 shrink-0" />
                <h2 className="text-2xl font-semibold">7. Destructive Action Safeguards</h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Destructive operations such as permanent email deletion require explicit confirmation
                parameters. The permanent delete function will throw an error if not called with an
                explicit confirmation flag, preventing accidental data loss.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Server className="h-5 w-5 text-zinc-400 shrink-0" />
                <h2 className="text-2xl font-semibold">8. Infrastructure</h2>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400">
                <li>
                  <strong className="text-zinc-900 dark:text-white">Hosting</strong> &mdash;
                  Deployed on Vercel&apos;s serverless infrastructure with automatic TLS termination
                  and DDoS protection.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">Database</strong> &mdash;
                  Supabase-managed PostgreSQL with Row Level Security (RLS) policies ensuring users
                  can only access their own data. All database connections use TLS.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">Authentication</strong> &mdash;
                  Supabase Auth handles user authentication with secure session management.
                  Passwords are never stored by our application.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">Secrets management</strong> &mdash;
                  All secrets (API keys, encryption keys, webhook secrets) are stored as environment
                  variables on the hosting platform and never committed to source control.
                </li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw className="h-5 w-5 text-zinc-400 shrink-0" />
                <h2 className="text-2xl font-semibold">9. Cron &amp; Webhook Security</h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Scheduled cron endpoints are protected by a shared secret (CRON_SECRET) that must
                be included in the Authorization header. Stripe webhook endpoints verify the request
                signature using the Stripe webhook secret to ensure authenticity.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Reporting Security Issues</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                If you discover a security vulnerability, please report it responsibly by emailing
                us at:
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3">
                <strong className="text-zinc-900 dark:text-white">Email:</strong> security@emailligence.ai
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3">
                We take all reports seriously and will respond promptly.
              </p>
            </section>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-200 dark:border-white/10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/10">
                <Brain className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold font-mono tracking-wider">EMAILLIGENCE</span>
            </Link>
            <div className="flex items-center gap-8 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</Link>
              <Link href="/security" className="hover:text-zinc-900 dark:hover:text-white transition-colors font-medium text-zinc-900 dark:text-white">Security</Link>
              <a href="mailto:support@emailligence.ai" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-sm text-zinc-400 dark:text-zinc-600">
              &copy; 2026 Emailligence. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
