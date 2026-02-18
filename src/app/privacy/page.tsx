import { ThemeToggle } from "@/components/theme-toggle";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Emailligence",
  description: "Emailligence privacy policy. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
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
            <p className="text-zinc-500 text-sm uppercase tracking-wide mb-4">Legal</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-zinc-500">Last updated: February 12, 2026</p>
          </div>

          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Emailligence (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) provides an AI-powered email management
                platform. This Privacy Policy explains how we collect, use, store, and protect your personal
                information when you use our service at emailligence.ai (the &quot;Service&quot;).
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3">
                By using Emailligence, you agree to the collection and use of information as described in
                this policy. If you do not agree, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

              <h3 className="text-lg font-medium mb-2 mt-6">2.1 Account Information</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                When you create an account, we collect your email address and authentication credentials
                managed through our authentication provider (Supabase Auth). We do not store passwords
                directly.
              </p>

              <h3 className="text-lg font-medium mb-2 mt-6">2.2 Gmail Connection Data</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                When you connect your Gmail account, we store OAuth access tokens and refresh tokens
                to maintain your connection. These tokens allow Emailligence to read, draft, send, and
                manage emails on your behalf. We store your connected Gmail address for identification
                purposes.
              </p>

              <h3 className="text-lg font-medium mb-2 mt-6">2.3 Email Data</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Emailligence accesses your email content in real time to perform actions you request
                (searching, reading, drafting, labeling, archiving, etc.). We do not permanently store
                the content of your emails on our servers. Email data is processed transiently to fulfill
                your requests and is not retained after the request is complete.
              </p>

              <h3 className="text-lg font-medium mb-2 mt-6">2.4 Usage Data</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We may collect anonymous usage data such as feature usage frequency, error rates, and
                performance metrics to improve the Service. This data does not include email content
                or personal identifiers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400">
                <li>To provide, operate, and maintain the Service</li>
                <li>To authenticate your identity and manage your account</li>
                <li>To connect to and interact with your Gmail account on your behalf</li>
                <li>To generate AI-powered email drafts, summaries, and analysis</li>
                <li>To display contact and analytics information derived from your inbox</li>
                <li>To improve and optimize the Service</li>
                <li>To communicate with you about service updates or issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                Emailligence relies on the following third-party services to operate:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-zinc-600 dark:text-zinc-400">
                <li>
                  <strong className="text-zinc-900 dark:text-white">Google (Gmail API)</strong> &mdash; We
                  use Google&apos;s Gmail API to access and manage your email. Your use of Gmail through
                  Emailligence is also subject to{" "}
                  <a href="https://policies.google.com/privacy" className="underline hover:text-zinc-900 dark:hover:text-white" target="_blank" rel="noopener noreferrer">
                    Google&apos;s Privacy Policy
                  </a>.
                  Emailligence&apos;s use of information received from Google APIs adheres to the{" "}
                  <a href="https://developers.google.com/terms/api-services-user-data-policy" className="underline hover:text-zinc-900 dark:hover:text-white" target="_blank" rel="noopener noreferrer">
                    Google API Services User Data Policy
                  </a>, including the Limited Use requirements.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">Supabase</strong> &mdash; We use
                  Supabase for authentication and database storage. Account data and OAuth tokens are
                  stored in Supabase&apos;s hosted database infrastructure.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">Vercel</strong> &mdash; Our application
                  is hosted on Vercel. Request processing occurs on Vercel&apos;s serverless infrastructure.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">Google Gemini (AI)</strong> &mdash; We
                  use Google&apos;s Gemini AI model to power the AI agent. Conversation messages (including
                  email content you ask the agent to process) are sent to the AI model for processing.
                  These interactions are subject to{" "}
                  <a href="https://ai.google.dev/terms" className="underline hover:text-zinc-900 dark:hover:text-white" target="_blank" rel="noopener noreferrer">
                    Google&apos;s AI terms
                  </a>.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Storage and Security</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We store OAuth tokens required to maintain your Gmail connection in our database. We
                implement reasonable security measures to protect your data, including HTTPS encryption
                in transit and access controls on our database. However, no method of electronic storage
                is 100% secure, and we cannot guarantee absolute security.
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3">
                We do not sell, rent, or share your personal data or email content with third parties
                for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We retain your account information and Gmail connection tokens for as long as your
                account is active. Email content is processed transiently and not stored permanently.
                When you disconnect your Gmail account or delete your Emailligence account, we delete
                your stored OAuth tokens and connection data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                You have the following rights regarding your data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400">
                <li>
                  <strong className="text-zinc-900 dark:text-white">Access</strong> &mdash; You can
                  request a copy of the personal data we hold about you.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">Correction</strong> &mdash; You can
                  update your account information at any time through the dashboard.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">Deletion</strong> &mdash; You can
                  request deletion of your account and all associated data by contacting us or
                  disconnecting your Gmail and deleting your account.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">Revocation</strong> &mdash; You can
                  revoke Emailligence&apos;s access to your Gmail at any time through your{" "}
                  <a href="https://myaccount.google.com/permissions" className="underline hover:text-zinc-900 dark:hover:text-white" target="_blank" rel="noopener noreferrer">
                    Google Account permissions
                  </a>{" "}
                  or by disconnecting Gmail in the Emailligence dashboard.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">Portability</strong> &mdash; You can
                  request an export of your data in a machine-readable format.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cookies</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Emailligence uses essential cookies for authentication and session management. We do
                not use third-party tracking cookies or advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Children&apos;s Privacy</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Emailligence is not intended for use by individuals under the age of 16. We do not
                knowingly collect personal information from children. If we become aware that we have
                collected data from a child under 16, we will take steps to delete that information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material
                changes by posting the updated policy on this page and updating the &quot;Last
                updated&quot; date. Your continued use of the Service after changes are posted
                constitutes your acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                If you have questions about this Privacy Policy or wish to exercise your data rights,
                please contact us at:
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3">
                <strong className="text-zinc-900 dark:text-white">Email:</strong> privacy@emailligence.ai
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
