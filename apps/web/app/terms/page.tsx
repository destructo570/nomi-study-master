import type { Metadata } from "next"

import { LegalPage } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The rules that govern your use of nomi, including content, licensing, subscriptions, and refunds.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Use · nomi",
    description:
      "The rules that govern your use of nomi, including content, licensing, subscriptions, and refunds.",
    url: "/terms",
    type: "article",
  },
  robots: { index: true, follow: true },
}

export default function TermsOfUsePage() {
  return (
    <LegalPage
      title="Terms of Use"
      effectiveDate="April 27, 2026"
      lastUpdated="April 27, 2026"
    >
      <p>
        These terms describe what you can do with nomi, what you can't, and
        how the service is run. They form a binding agreement between you and
        nomi. By creating an account or otherwise using the product, you
        agree to them. If you don't, please don't use nomi.
      </p>

      <h2>Eligibility</h2>
      <p>
        nomi is intended for users aged 16 and over. By creating an account
        you confirm you are at least 16 years old and have the legal capacity
        to enter into this agreement. If you are using nomi on behalf of an
        organisation, you confirm you are authorised to bind that
        organisation to these terms.
      </p>

      <h2>Content and recording policy</h2>
      <p>
        nomi is a study tool. The content you upload - lectures, course
        notes, PDFs, transcripts, audio recordings, links, and other materials
        - must be content you have the legal right to use.
      </p>
      <p>Three guidelines apply:</p>

      <h3>Follow the rules of your school or workplace</h3>
      <p>
        Many universities, employers, and instructors have policies about
        recording or redistributing course material. Before uploading content
        created by someone else, make sure doing so is permitted under those
        rules.
      </p>
      <p>
        If your professor or employer has prohibited recording or
        redistribution, nomi is not a workaround.
      </p>

      <h3>Respect copyright</h3>
      <p>
        Do not upload copyrighted material - including textbook chapters, paid
        course videos, paywalled articles, or proprietary training content -
        unless you own the rights or otherwise have permission or a legal
        right to use that material.
      </p>
      <p>
        Personal study notes you created yourself and content you own are
        generally acceptable. Pirated or unauthorized material is not.
      </p>

      <h3>Respect privacy and confidentiality</h3>
      <p>
        Do not upload conversations, recordings, or documents containing
        legally protected, confidential, or private information without proper
        authorization.
      </p>
      <p>This includes:</p>
      <ul>
        <li>private conversations recorded without consent</li>
        <li>confidential business information</li>
        <li>medical or legal records belonging to another person</li>
        <li>protected educational records</li>
        <li>any content whose disclosure would violate applicable law</li>
      </ul>
      <p>
        nomi cannot verify the legality of every upload. You are solely
        responsible for the content you upload and agree to indemnify nomi
        against claims arising from material you did not have the legal right
        to use.
      </p>

      <h2>Ownership of your content</h2>
      <p>You retain ownership of the content you upload to nomi.</p>
      <p>
        By uploading content, you grant nomi a limited, non-exclusive
        license to store, process, and transmit that content only as necessary
        to operate and provide the service to you.
      </p>
      <p>We do not claim ownership over your uploads or generated outputs.</p>

      <h2>Data processing and AI providers</h2>
      <p>
        nomi uses third-party AI providers to process uploaded content and
        generate summaries, flashcards, quizzes, mindmaps, and other outputs.
      </p>
      <p>By using the service, you understand and agree that:</p>
      <ul>
        <li>
          uploaded content may be securely transmitted to third-party model
          providers solely for generation purposes
        </li>
        <li>
          we may temporarily store uploads and generated outputs to operate
          the service, improve reliability, prevent abuse, and provide account
          history features
        </li>
        <li>we do not sell your uploaded content</li>
        <li>
          unless explicitly stated otherwise, your uploads are not used to
          train proprietary AI models operated by nomi
        </li>
      </ul>
      <p>
        You should avoid uploading highly sensitive personal, medical,
        financial, legal, or confidential information.
      </p>

      <h2>Your license to use nomi</h2>
      <p>
        Subject to these terms, nomi grants you a limited, personal,
        non-exclusive, revocable, and non-transferable license to access and
        use the product and any content provided through it.
      </p>
      <p>
        Your account is for your personal use only. Please do not share login
        credentials.
      </p>
      <p>
        We may apply reasonable rate limits, storage limits, or device limits
        to prevent abuse and maintain service quality.
      </p>
      <p>You agree not to:</p>
      <ul>
        <li>
          scrape, mirror, or access nomi using automated systems at scale
          without written permission
        </li>
        <li>
          reverse-engineer the product, prompts, workflows, or model
          configurations
        </li>
        <li>
          interfere with the infrastructure or systems used to operate the
          service
        </li>
        <li>
          use nomi to create illegal, deceptive, harassing, defamatory, or
          fraudulent content
        </li>
        <li>
          use nomi to build or operate a competing AI service based
          primarily on our product, outputs, or infrastructure
        </li>
      </ul>

      <h2>AI-generated output</h2>
      <p>
        nomi uses AI systems that can produce inaccurate, incomplete,
        outdated, or misleading information.
      </p>
      <p>
        Generated summaries, notes, flashcards, quizzes, and chat responses
        should be reviewed before relying on them for exams, assignments,
        work, research, or professional decisions.
      </p>
      <p>You are responsible for verifying important information.</p>
      <p>
        nomi is not responsible for consequences resulting from reliance on
        AI-generated output.
      </p>

      <h2>Subscriptions, credits, and billing</h2>
      <p>
        nomi is offered through a free tier and a recurring paid
        subscription. New accounts receive a one-time allocation of starter
        credits to try the AI features; once those are used, continued use of
        paid features requires a subscription.
      </p>
      <p>
        Subscriptions renew automatically at the end of each billing cycle
        unless cancelled before renewal.
      </p>
      <p>
        You may cancel your subscription at any time through your account
        settings or by contacting us. Cancellation takes effect at the end of
        the current billing period.
      </p>
      <p>
        Prices may change over time. If pricing changes affect your
        subscription, the updated pricing will apply to future renewals only,
        and we will provide advance notice where required.
      </p>

      <h2>Affiliate program</h2>
      <p>
        nomi offers a referral program through which existing users can
        share a personal referral link and earn a recurring commission on
        paid subscriptions of customers referred through that link. Current
        commission terms and payout details are published on the in-app
        affiliate page and may be adjusted from time to time.
      </p>
      <p>By participating in the affiliate program, you agree that:</p>
      <ul>
        <li>
          You will not self-refer, refer accounts you control, or otherwise
          generate referrals through fraudulent or incentivised traffic.
        </li>
        <li>
          You will not bid on nomi brand keywords (for example "nomi")
          in paid search, run misleading advertising, or impersonate nomi.
        </li>
        <li>
          You are responsible for any taxes payable on commissions you
          receive and for providing accurate payout details.
        </li>
        <li>
          Commissions are calculated on amounts actually received and
          retained by nomi. Refunds, chargebacks, and cancellations within
          the refund window reverse the associated commission.
        </li>
        <li>
          nomi may withhold, reverse, or forfeit commissions, and suspend
          or remove participants from the program, if it reasonably
          determines that these terms or the affiliate guidelines have been
          violated.
        </li>
      </ul>
      <p>
        nomi may modify or discontinue the affiliate program at any time.
        Material changes will be reflected on the affiliate page or
        communicated by email.
      </p>

      <h2>Copyright complaints</h2>
      <p>
        nomi respects the intellectual property rights of others and
        responds to clear notices of alleged copyright infringement.
      </p>
      <p>
        If you believe content uploaded to nomi infringes a copyright you
        own or control, send a notice to{" "}
        <a href="mailto:getnomi@proton.me">getnomi@proton.me</a> that includes:
      </p>
      <ul>
        <li>
          your name, postal address, telephone number, and email address
        </li>
        <li>
          a description of the copyrighted work you believe has been
          infringed
        </li>
        <li>
          the URL or other location within nomi where the allegedly
          infringing content can be found
        </li>
        <li>
          a statement that you have a good-faith belief that the use of the
          material is not authorised by the rights holder, its agent, or the
          law
        </li>
        <li>
          a statement, under penalty of perjury, that the information in
          your notice is accurate and that you are the rights holder or
          authorised to act on the rights holder's behalf
        </li>
        <li>your physical or electronic signature</li>
      </ul>
      <p>
        We will review valid notices and may remove or disable access to the
        reported content. Accounts that repeatedly upload infringing material
        may be suspended or terminated.
      </p>

      <h2>Refund policy</h2>
      <p>
        nomi is a digital product that incurs infrastructure and AI
        processing costs immediately after a generation request is made.
      </p>
      <p>
        As a result, refunds are generally not provided once credits,
        generations, or subscription benefits have been used.
      </p>
      <p>
        We may, at our discretion, issue refunds in limited cases such as:
      </p>
      <ul>
        <li>
          confirmed technical failures that prevented normal use of the
          service for an extended period
        </li>
        <li>duplicate charges</li>
        <li>unauthorized payments</li>
      </ul>
      <p>
        Refund requests must be submitted within 14 days of the charge by
        emailing <a href="mailto:getnomi@proton.me">getnomi@proton.me</a> with:
      </p>
      <ul>
        <li>the email associated with your account</li>
        <li>the date and amount charged</li>
        <li>a description of the issue</li>
      </ul>
      <p>Refund requests are typically reviewed within 5–7 business days.</p>
      <p>Refunds are generally not available for:</p>
      <ul>
        <li>used credits or completed generations</li>
        <li>forgotten subscription renewals</li>
        <li>
          promotional or discounted purchases unless required by law
        </li>
        <li>accounts suspended for violating these terms</li>
        <li>charges older than 14 days</li>
      </ul>
      <p>
        Nothing in this policy limits any mandatory consumer rights provided
        under applicable law.
      </p>

      <h2>Suspension and termination</h2>
      <p>We may suspend or terminate accounts that:</p>
      <ul>
        <li>repeatedly upload unauthorized or pirated material</li>
        <li>abuse the platform</li>
        <li>attempt large-scale extraction or scraping</li>
        <li>interfere with service operation</li>
        <li>engage in fraudulent or harmful activity</li>
      </ul>
      <p>
        We may also discontinue the service entirely. If that happens, we
        will provide reasonable notice where practical and may refund unused
        prepaid subscription time.
      </p>
      <p>
        You may close your account at any time by emailing{" "}
        <a href="mailto:getnomi@proton.me">getnomi@proton.me</a> from the
        address associated with the account.
      </p>
      <p>
        Sections relating to ownership, disclaimers, liability limitations,
        and indemnification survive termination.
      </p>

      <h2>Disclaimers</h2>
      <p>nomi is provided on an "as is" and "as available" basis.</p>
      <p>We do not guarantee:</p>
      <ul>
        <li>uninterrupted availability</li>
        <li>error-free operation</li>
        <li>perfect AI accuracy</li>
        <li>compatibility with every device or workflow</li>
        <li>suitability for any particular purpose</li>
      </ul>
      <p>
        AI features depend partly on third-party providers that may experience
        outages, delays, or changes outside our control.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, nomi will not be liable for
        indirect, incidental, consequential, special, exemplary, or punitive
        damages arising from:
      </p>
      <ul>
        <li>use of the service</li>
        <li>inability to access the service</li>
        <li>reliance on AI-generated output</li>
        <li>lost data</li>
        <li>missed deadlines</li>
        <li>academic or professional outcomes</li>
      </ul>
      <p>
        Our total liability for any claim relating to the service is limited
        to the amount you paid nomi during the 12 months preceding the
        event giving rise to the claim.
      </p>

      <h2>Indemnification</h2>
      <p>
        You agree to indemnify and hold nomi harmless from claims, damages,
        liabilities, losses, and expenses arising from:
      </p>
      <ul>
        <li>content you uploaded without proper rights or authorization</li>
        <li>your misuse of the service</li>
        <li>your violation of these terms</li>
        <li>your violation of another person's rights or applicable laws</li>
      </ul>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India.</p>
      <p>
        Any disputes arising from these terms or use of the service will be
        subject to the exclusive jurisdiction of the courts located in Delhi,
        India.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time as the product evolves.
      </p>
      <p>
        If we make material changes, we may notify users through the app,
        email, or other reasonable means before the changes take effect.
      </p>
      <p>
        Continued use of nomi after updated terms become effective
        constitutes acceptance of the revised terms.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about these terms, refunds, account closure, or legal
        concerns, contact{" "}
        <a href="mailto:getnomi@proton.me">getnomi@proton.me</a>.
      </p>
    </LegalPage>
  )
}
