import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg/34CdSnXe';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

const features = [
  {
    icon: '🎯',
    title: 'Personalization',
    description: 'Set context in your personalization window to get the best accurate answers for your interview.',
  },
  {
    icon: '🤖',
    title: 'AI-powered feedback',
    description: 'Get instant, constructive insights on answers so you can know what to say.',
  },
  {
    icon: '📋',
    title: 'Question banks',
    description: 'Prepare for curated behavioral and technical questions used by top companies.',
  },
  {
    icon: '⏱️',
    title: 'Coding assesments',
    description: 'Get through live coding assessments under realistic time pressure.',
  },
  {
    icon: '📊',
    title: 'Live Transcription',
    description: 'Transcribes your interview in real time and answers any questions you may receive.',
  },
  {
    icon: '🔒',
    title: 'Private & ethical',
    description: 'Your data stays yours. Built for getting past interviews and live coding assessments.',
  },
];

const steps = [
  { step: 1, title: 'Join our Discord', description: 'Get access to the community and purchase options.' },
  { step: 2, title: 'Choose your plan', description: 'Pick Basic or Pro and complete purchase in Discord.' },
  { step: 3, title: 'Start practicing', description: 'Download the app or use the web flow and prep with confidence.' },
];

const faqs = [
  {
    q: 'What is Interview Assistant?',
    a: 'Interview Assistant is an ethical career-prep tool that helps you practice for interviews with AI-powered feedback, structured question banks, and time-boxed sessions. It’s designed for candidates who want to improve honestly.',
  },
  {
    q: 'How does the purchase process work?',
    a: 'Click “Join our Discord to Purchase” and you’ll be taken to our Discord server. There you can choose your plan (Basic or Pro), complete payment, and get instant access to downloads and setup instructions.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes. You can cancel anytime through your account or by contacting us in Discord. Access continues until the end of your current billing period.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. We treat your data with care and don’t sell it. Practice sessions and progress are stored securely and used only to improve your experience.',
  },
];

export default function Home() {
  return (
    <>
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-card-border bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold">
            Interview Assistant
          </Link>
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Button asChild size="sm">
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                Join Discord
              </a>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-24 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-6">
              Ethical career tool
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Nail your next interview
            </h1>
            <p className="mt-6 text-lg text-muted max-w-2xl mx-auto">
              Practice with AI-powered feedback, real-time coaching, and structured guides. Built for candidates who prep the right way.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg">
                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                  Join Discord to Get Started
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#how-it-works">How it works</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-4 sm:px-6 border-t border-card-border">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-4">Features</h2>
            <p className="text-muted text-center max-w-2xl mx-auto mb-12">
              Everything you need to prepare confidently and ethically.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Card key={f.title}>
                  <CardHeader>
                    <span className="text-2xl mb-2">{f.icon}</span>
                    <CardTitle>{f.title}</CardTitle>
                    <CardDescription>{f.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24 px-4 sm:px-6 border-t border-card-border">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
            <p className="text-muted text-center mb-12">
              Three steps to start practicing.
            </p>
            <div className="grid gap-8 sm:grid-cols-3">
              {steps.map((s) => (
                <div key={s.step} className="relative text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent text-accent font-semibold">
                    {s.step}
                  </div>
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted">{s.description}</p>
                  {s.step < 3 && (
                    <div className="hidden sm:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-card-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 px-4 sm:px-6 border-t border-card-border">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
            <p className="text-muted text-center mb-12">
              Two plans. Join Discord to purchase.
            </p>
            <div className="grid gap-8 md:grid-cols-2">
              {/* Basic — Interview Assistant (coming soon) */}
              <Card className="relative opacity-90" data-plan="basic-coming-soon">
                <CardHeader>
                  <CardTitle>Basic</CardTitle>
                  <CardDescription>Interview Assistant itself — for getting started and regular practice.</CardDescription>
                  <div className="mt-4">
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                      Coming soon
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted">
                  <p>• Structured mock interviews</p>
                  <p>• AI feedback on answers</p>
                  <p>• Core question banks</p>
                  <p>• Time-boxed practice</p>
                  <p>• Progress tracking</p>
                  <p>• Regular updates</p>
                </CardContent>
                <CardFooter>
                  <Button disabled className="w-full" size="lg" variant="secondary">
                    Coming soon
                  </Button>
                </CardFooter>
              </Card>

              {/* Pro */}
              <Card className="relative border-accent/50">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>Most Popular</Badge>
                </div>
                <CardHeader>
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>For serious prep and advanced features.</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$69</span>
                    <span className="text-muted">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted">
                  <p>• Everything in Basic</p>
                  <p>• Advanced question sets</p>
                  <p>• Priority support in Discord</p>
                  <p>• Early access to new features</p>
                  <p>• Extended session limits</p>
                  <p>• Custom practice tracks</p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" size="lg">
                    <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                      Join our Discord to Purchase
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 px-4 sm:px-6 border-t border-card-border">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold text-center mb-4">Frequently asked questions</h2>
            <p className="text-muted text-center mb-12">
              Common questions about Interview Assistant.
            </p>
            <Accordion type="single" defaultValue="faq-0">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger value={`faq-${i}`}>{faq.q}</AccordionTrigger>
                  <AccordionContent value={`faq-${i}`}>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-card-border py-12 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted">
              © {new Date().getFullYear()} Interview Assistant. Ethical career prep.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#features" className="text-sm text-muted hover:text-foreground">
                Features
              </Link>
              <Link href="#pricing" className="text-sm text-muted hover:text-foreground">
                Pricing
              </Link>
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted hover:text-foreground"
              >
                Discord
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
