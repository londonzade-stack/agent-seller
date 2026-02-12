import { ThemeToggle } from "@/components/theme-toggle";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service - AgentSeller",
  description: "AgentSeller terms of service. Read the terms governing your use of our platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/10">
              <Target className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">AgentSeller</span>
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-zinc-500">Last updated: February 12, 2026</p>
          </div>

          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                By accessing or using AgentSeller (&quot;the Service&quot;), you agree to be bound by these
                Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use
                the Service. These Terms constitute a legally binding agreement between you and
                AgentSeller.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                AgentSeller is an AI-powered email management platform that connects to your Gmail
                account to help you search, draft, organize, and analyze email. The Service includes
                an AI agent capable of performing email actions on your behalf, a contact pipeline,
                draft review queue, and inbox analytics dashboard.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                To use AgentSeller, you must create an account and provide accurate, complete
                information. You are responsible for maintaining the security of your account
                credentials and for all activity that occurs under your account. You must notify
                us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Gmail Connection and Authorization</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                AgentSeller requires you to connect your Gmail account via Google&apos;s OAuth
                authorization flow. By connecting your Gmail, you authorize AgentSeller to access,
                read, modify, draft, send, label, archive, and trash emails in your account as
                directed by you through the AI agent or dashboard interface.
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3">
                You may revoke this authorization at any time by disconnecting Gmail in the
                AgentSeller dashboard or through your{" "}
                <a href="https://myaccount.google.com/permissions" className="underline hover:text-zinc-900 dark:hover:text-white" target="_blank" rel="noopener noreferrer">
                  Google Account permissions
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. User Responsibilities</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                When using AgentSeller, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400">
                <li>Use the Service only for lawful purposes and in compliance with all applicable laws</li>
                <li>Not use the Service to send spam, phishing, or unsolicited bulk email</li>
                <li>Not use the Service to harass, threaten, or impersonate others</li>
                <li>Not attempt to circumvent any security measures or rate limits</li>
                <li>Not use the Service to violate any third party&apos;s rights, including intellectual property rights</li>
                <li>Review AI-generated email drafts before sending to ensure accuracy and appropriateness</li>
                <li>Maintain the confidentiality of your account credentials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Email Usage and CAN-SPAM Compliance</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                You are solely responsible for ensuring that any emails sent through AgentSeller
                comply with applicable laws, including the CAN-SPAM Act, GDPR, and any other relevant
                email regulations. This includes but is not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400 mt-3">
                <li>Not sending deceptive or misleading emails</li>
                <li>Including accurate sender information and subject lines</li>
                <li>Honoring opt-out and unsubscribe requests</li>
                <li>Not sending commercial email to recipients who have not consented to receive it</li>
              </ul>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3">
                AgentSeller provides AI-generated drafts as suggestions. You are responsible for
                reviewing all content before it is sent. We are not responsible for the content of
                emails you choose to send.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. AI Agent Limitations</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                The AI agent is a tool designed to assist with email management. It may occasionally
                produce inaccurate, incomplete, or inappropriate responses. You acknowledge that:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400 mt-3">
                <li>AI-generated content should be reviewed before use</li>
                <li>The AI agent may misinterpret instructions or context</li>
                <li>AgentSeller is not liable for actions taken based on AI-generated recommendations</li>
                <li>The AI agent requires explicit confirmation before sending emails</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Subscription and Payment</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                AgentSeller offers a 14-day free trial. After the trial period, continued use requires
                a paid subscription at $10 per user per month. Pricing is subject to change with 30
                days&apos; notice. Refunds are handled on a case-by-case basis.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                The Service, including its design, code, features, and branding, is owned by
                AgentSeller and protected by intellectual property laws. You retain ownership of
                your email content and data. You grant AgentSeller a limited license to process
                your data solely to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                To the maximum extent permitted by law, AgentSeller and its officers, directors,
                employees, and agents shall not be liable for any indirect, incidental, special,
                consequential, or punitive damages, including but not limited to loss of profits,
                data, or business opportunities, arising out of or in connection with your use of
                the Service.
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3">
                Our total liability for any claims arising under these Terms shall not exceed the
                amount you paid to AgentSeller in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Disclaimer of Warranties</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any
                kind, whether express or implied, including but not limited to implied warranties of
                merchantability, fitness for a particular purpose, and non-infringement. We do not
                warrant that the Service will be uninterrupted, error-free, or secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                You may terminate your account at any time by disconnecting your Gmail and deleting
                your account, or by contacting us. We may suspend or terminate your access to the
                Service at any time, with or without cause, including if we reasonably believe you
                have violated these Terms. Upon termination, your right to use the Service ceases
                immediately, and we will delete your stored data in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We may update these Terms from time to time. We will notify you of material changes
                by posting the updated Terms on this page and updating the &quot;Last updated&quot; date.
                Your continued use of the Service after changes are posted constitutes your acceptance
                of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the
                United States, without regard to conflict of law principles. Any disputes arising
                from these Terms or the Service shall be resolved in the courts of competent
                jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">15. Contact Us</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3">
                <strong className="text-zinc-900 dark:text-white">Email:</strong> legal@agentseller.com
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
                <Target className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold">AgentSeller</span>
            </Link>
            <div className="flex items-center gap-8 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</Link>
              <a href="mailto:support@agentseller.com" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-sm text-zinc-400 dark:text-zinc-600">
              &copy; 2026 AgentSeller. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
