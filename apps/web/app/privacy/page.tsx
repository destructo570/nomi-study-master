import type { Metadata } from "next"

import { LegalPage } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How nomi collects, uses, and protects information about your account and the study material you upload.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy · nomi",
    description:
      "How nomi collects, uses, and protects information about your account and the study material you upload.",
    url: "/privacy",
    type: "article",
  },
  robots: { index: true, follow: true },
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effectiveDate="April 27, 2026"
      lastUpdated="April 27, 2026"
    >
      <p>
        nomi is an AI-assisted study notebook designed to help users learn
        from their own materials. We take privacy seriously because the things
        you upload - lecture transcripts, course PDFs, notes, recordings, and
        study sessions - can contain highly personal academic information.
      </p>
      <p>
        This Privacy Policy explains what we collect, why we collect it, how
        it is processed, and the controls you have over your information.
      </p>
      <p>
        If anything here is unclear, contact us at{" "}
        <a href="mailto:getnomi@proton.me">getnomi@proton.me</a>.
      </p>

      <h2>Who we are</h2>
      <p>nomi is operated as an independent software product.</p>
      <p>
        We do not run advertising networks, sell user data, or monetize your
        content through third-party marketing partnerships. The product exists
        to help users study and learn more effectively.
      </p>

      <h2>What we collect</h2>
      <h3>Account information</h3>
      <p>
        When you create an account, we store limited account information,
        including:
      </p>
      <ul>
        <li>Email address</li>
        <li>Authentication credentials</li>
        <li>Account credit balance</li>
        <li>Subscription or billing status</li>
      </ul>
      <p>
        We do not require your real name, phone number, postal address, or
        demographic information unless you voluntarily provide it.
      </p>

      <h3>Study material you upload or create</h3>
      <p>
        Anything you place inside nomi is stored so you can access and
        manage it later.
      </p>
      <p>This may include:</p>
      <ul>
        <li>PDFs</li>
        <li>Text documents</li>
        <li>Audio recordings</li>
        <li>YouTube links</li>
        <li>Notes</li>
        <li>Flashcards</li>
        <li>Quizzes</li>
        <li>Mindmaps</li>
        <li>Summaries</li>
        <li>AI tutor conversations</li>
        <li>Other generated study content</li>
      </ul>
      <p>Your content remains yours.</p>
      <p>
        We do not use your content for advertising, resale, or AI model
        training. Access to user content is limited to what is necessary for
        operating, securing, maintaining, and supporting the service.
      </p>

      <h3>Usage and operational data</h3>
      <p>
        To operate the product reliably, we collect limited operational and
        usage data, including:
      </p>
      <ul>
        <li>Feature usage events</li>
        <li>Credit consumption</li>
        <li>Failed requests and error logs</li>
        <li>Processing duration</li>
        <li>Subscription and billing activity</li>
      </ul>
      <p>
        This information helps us maintain the service, investigate bugs,
        prevent abuse, and reconcile billing.
      </p>
      <p>
        We do not use this data for advertising profiling or third-party
        marketing.
      </p>

      <h3>Technical information</h3>
      <p>
        Like most online services, we automatically receive limited technical
        information when you use nomi, including:
      </p>
      <ul>
        <li>IP address</li>
        <li>Browser type</li>
        <li>Device information</li>
        <li>Operating system</li>
        <li>Session identifiers</li>
        <li>Request logs</li>
      </ul>
      <p>
        This information is used for security, fraud prevention, debugging,
        abuse detection, and operational monitoring.
      </p>

      <h2>How AI processing works</h2>
      <p>
        When you generate summaries, flashcards, quizzes, mindmaps, notes, or
        AI tutor responses, nomi sends the relevant portion of your uploaded
        content to third-party AI providers so the request can be processed.
      </p>
      <p>Today, our primary AI provider is OpenAI.</p>
      <p>
        Content processed through these APIs is governed by the provider's
        API and enterprise data policies. At the time of writing, API content
        submitted through these services is not used to train public AI
        models.
      </p>
      <p>
        If we add or change AI providers in the future, this Privacy Policy
        will be updated accordingly.
      </p>

      <h2>Cookies and similar technologies</h2>
      <p>
        nomi does not use third-party advertising trackers, cross-site
        advertising identifiers, or behavioral advertising systems.
      </p>
      <p>
        We use only limited cookies and local storage technologies necessary
        to operate the product.
      </p>
      <p>These include:</p>

      <h3>Essential cookies</h3>
      <p>Used to:</p>
      <ul>
        <li>Keep you signed in</li>
        <li>Maintain session security</li>
        <li>Remember interface preferences</li>
        <li>Prevent fraudulent requests</li>
      </ul>

      <h3>Operational cookies</h3>
      <p>Used to:</p>
      <ul>
        <li>Detect application errors</li>
        <li>Maintain platform stability</li>
        <li>Improve reliability and performance</li>
      </ul>
      <p>
        Disabling cookies may prevent parts of nomi from functioning
        properly.
      </p>

      <h2>Service providers we rely on</h2>
      <p>
        nomi uses a small number of trusted infrastructure providers to
        operate the service.
      </p>
      <p>
        These providers process data only as necessary to provide their
        services to us.
      </p>
      <p>Current providers include:</p>
      <ul>
        <li>
          <strong>Supabase</strong> - database, authentication, and storage
          infrastructure
        </li>
        <li>
          <strong>OpenAI</strong> - AI processing for summaries, quizzes,
          flashcards, notes, and tutor interactions
        </li>
        <li>
          <strong>Dodo</strong> - payment processing and subscription billing
        </li>
      </ul>
      <p>
        We do not sell personal data or user content to advertisers, data
        brokers, or third parties.
      </p>
      <p>
        We may change infrastructure providers as the product evolves.
        Material changes will be reflected in this policy.
      </p>

      <h2>Payments</h2>
      <p>
        Payments are processed securely by third-party payment processors such
        as Dodo.
      </p>
      <p>
        We do not store or directly process your full credit-card information
        on our servers.
      </p>

      <h2>Data retention</h2>
      <p>
        We retain your account data and notebooks for as long as your account
        remains active.
      </p>
      <p>
        If you delete content, it is removed from our active systems and later
        removed from backups within a limited retention window.
      </p>
      <p>
        If you delete your account, we remove your personal information and
        study content within 30 days unless we are legally required to retain
        certain records, such as transaction or tax records.
      </p>

      <h2>Your rights</h2>
      <p>You may:</p>
      <ul>
        <li>Access your information</li>
        <li>Export your content</li>
        <li>Edit or correct your information</li>
        <li>Delete notebooks, chats, and uploaded files</li>
        <li>Request account deletion</li>
      </ul>
      <p>
        To request deletion of your account or personal data, contact{" "}
        <a href="mailto:getnomi@proton.me">getnomi@proton.me</a>.
      </p>

      <h2>Security</h2>
      <p>
        We use reasonable technical and organizational safeguards to protect
        user data against unauthorized access, disclosure, misuse, or loss.
      </p>
      <p>
        However, no online platform or internet transmission can be guaranteed
        to be completely secure.
      </p>
      <p>
        You are responsible for maintaining the confidentiality of your
        account credentials.
      </p>

      <h2>Children</h2>
      <p>nomi is intended for users aged 16 and older.</p>
      <p>
        We do not knowingly collect personal information from children under
        16. If you believe a minor has created an account, contact us and we
        will remove the account and associated data.
      </p>

      <h2>International transfers</h2>
      <p>
        nomi currently operates infrastructure primarily located in the
        United States.
      </p>
      <p>
        By using the service, you understand that your information may be
        processed in countries where privacy laws may differ from those in
        your jurisdiction.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy as the product evolves or legal
        requirements change.
      </p>
      <p>
        When significant changes are made, we will update the "Last updated"
        date and may notify users through the app or by email.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy questions, deletion requests, or other concerns related to
        this policy, contact{" "}
        <a href="mailto:getnomi@proton.me">getnomi@proton.me</a>.
      </p>
    </LegalPage>
  )
}
