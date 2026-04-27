import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone, Apple, Monitor, Download as DownloadIcon, ArrowRight,
  CheckCircle2, Globe, ShieldCheck, Zap, Server,
} from 'lucide-react';
import { Link } from 'wouter';

type Platform = 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'web';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua) || (platform === 'macintel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/win/.test(platform) || /windows/.test(ua)) return 'windows';
  if (/mac/.test(platform) || /mac os x/.test(ua)) return 'macos';
  if (/linux/.test(platform) || /linux/.test(ua)) return 'linux';
  return 'web';
}

interface DownloadOption {
  key: Platform;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  fileName: string;
  size: string;
  href: string;
  primaryHint: string;
  steps: string[];
  accent: string;
}

const OPTIONS: Record<Platform, DownloadOption> = {
  android: {
    key: 'android',
    title: 'Android',
    subtitle: 'Phones & tablets running Android 8 or newer',
    icon: Smartphone,
    fileName: 'va-manager.apk',
    size: '~18 MB',
    href: '/downloads/va-manager.apk',
    primaryHint: 'Tap Download, then open the APK to install.',
    steps: [
      'Tap the Download APK button below.',
      'When the file finishes, tap it from your notifications.',
      'If Android asks, allow installs from your browser this once.',
      'Open VA Manager from your home screen — sign in with Google.',
    ],
    accent: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
  },
  ios: {
    key: 'ios',
    title: 'iPhone & iPad',
    subtitle: 'iOS 15 or newer',
    icon: Apple,
    fileName: 'TestFlight invite',
    size: 'via App Store',
    href: 'https://testflight.apple.com/join/your-code',
    primaryHint: 'Open the TestFlight invite to install the beta.',
    steps: [
      'Install Apple TestFlight from the App Store (free).',
      'Tap Get TestFlight Invite below — it opens TestFlight.',
      'Tap Accept, then Install.',
      'Open VA Manager and sign in with Google.',
    ],
    accent: 'from-slate-500/20 to-slate-500/5 border-slate-500/30',
  },
  windows: {
    key: 'windows',
    title: 'Windows',
    subtitle: 'Windows 10 / 11 — 64-bit installer',
    icon: Monitor,
    fileName: 'VA-Manager-Setup.exe',
    size: '~75 MB',
    href: '/downloads/VA-Manager-Setup.exe',
    primaryHint: 'Run the installer and click through the prompts.',
    steps: [
      'Click Download for Windows below.',
      'Open the .exe file from your Downloads folder.',
      'If SmartScreen warns, click More info → Run anyway.',
      'Follow the installer, then launch VA Manager from Start menu.',
    ],
    accent: 'from-sky-500/20 to-sky-500/5 border-sky-500/30',
  },
  macos: {
    key: 'macos',
    title: 'Mac',
    subtitle: 'macOS 12 Monterey or newer (Apple Silicon & Intel)',
    icon: Apple,
    fileName: 'VA-Manager.dmg',
    size: '~80 MB',
    href: '/downloads/VA-Manager.dmg',
    primaryHint: 'Open the .dmg and drag VA Manager to Applications.',
    steps: [
      'Click Download for Mac below.',
      'Open the .dmg from Downloads.',
      'Drag the VA Manager icon to your Applications folder.',
      'First launch: right-click → Open → Open (Gatekeeper one-time prompt).',
    ],
    accent: 'from-zinc-500/20 to-zinc-500/5 border-zinc-500/30',
  },
  linux: {
    key: 'linux',
    title: 'Linux',
    subtitle: 'AppImage — works on Ubuntu, Fedora, Arch, and most distros',
    icon: Monitor,
    fileName: 'VA-Manager.AppImage',
    size: '~85 MB',
    href: '/downloads/VA-Manager.AppImage',
    primaryHint: 'Make it executable and double-click to launch.',
    steps: [
      'Click Download for Linux below.',
      'Open a terminal in the download folder.',
      'Run: chmod +x VA-Manager.AppImage',
      'Double-click the AppImage or run ./VA-Manager.AppImage',
    ],
    accent: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
  },
  web: {
    key: 'web',
    title: 'Web App',
    subtitle: 'Use VA Manager directly in your browser',
    icon: Globe,
    fileName: 'No download needed',
    size: 'Always up to date',
    href: '/',
    primaryHint: 'Just open the dashboard — no install required.',
    steps: [
      'Click Open Web App below.',
      'Sign in with your Google account.',
      'Add to Home Screen from your browser menu for a one-tap shortcut.',
    ],
    accent: 'from-primary/20 to-primary/5 border-primary/30',
  },
};

const FEATURES = [
  { icon: ShieldCheck, title: 'Bank-grade security', desc: 'OAuth login, encrypted secrets, audit log on every write.' },
  { icon: Zap, title: 'Instant sync', desc: 'Live Google Sheets sync keeps your spreadsheets in lockstep.' },
  { icon: Server, title: 'Works offline', desc: 'Native apps cache the last view so you can browse without wifi.' },
];

export default function Download() {
  const [detected, setDetected] = React.useState<Platform>('web');

  React.useEffect(() => {
    setDetected(detectPlatform());
  }, []);

  const primary = OPTIONS[detected];
  const others = (Object.keys(OPTIONS) as Platform[])
    .filter((k) => k !== detected)
    .map((k) => OPTIONS[k]);

  const PrimaryIcon = primary.icon;

  return (
    <div className="min-h-screen bg-background dark text-foreground">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
              VA
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">Client Manager</span>
              <p className="text-xs text-muted-foreground leading-none">eBay VA Platform</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              Open Web App <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary">
            <CheckCircle2 className="w-3 h-3 mr-1.5" />
            Detected: {primary.title}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
            Download VA Manager for <span className="text-primary">{primary.title}</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            One sign-in across web, mobile, and desktop. Pick your preferred platform — your data lives in the cloud and stays in sync everywhere.
          </p>
        </div>

        {/* Primary card */}
        <Card className={`bg-gradient-to-br ${primary.accent} border max-w-3xl mx-auto`}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-background/60 backdrop-blur flex items-center justify-center">
                <PrimaryIcon className="w-7 h-7 text-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">{primary.title}</CardTitle>
                <CardDescription className="mt-1">{primary.subtitle}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <a href={primary.href} className="flex-1">
                <Button size="lg" className="w-full gap-2 h-12 text-base">
                  <DownloadIcon className="w-5 h-5" />
                  {primary.key === 'web'
                    ? 'Open Web App'
                    : primary.key === 'ios'
                    ? 'Get TestFlight Invite'
                    : `Download ${primary.fileName}`}
                </Button>
              </a>
              <div className="text-xs text-muted-foreground sm:text-right">
                <div className="font-medium text-foreground">{primary.fileName}</div>
                <div>{primary.size}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic">{primary.primaryHint}</p>

            <div className="border-t border-border/60 pt-4">
              <h4 className="text-sm font-semibold mb-2">Quick install steps</h4>
              <ol className="space-y-1.5 text-sm text-muted-foreground">
                {primary.steps.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary font-semibold">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Other platforms */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-center mb-6">All available platforms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.map((opt) => {
              const Icon = opt.icon;
              return (
                <Card key={opt.key} className="bg-card/60 hover:bg-card transition-colors border-border/60">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{opt.title}</CardTitle>
                        <CardDescription className="text-xs mt-0.5 line-clamp-2">{opt.subtitle}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <a href={opt.href}>
                      <Button variant="outline" size="sm" className="w-full gap-1.5">
                        <DownloadIcon className="w-3.5 h-3.5" />
                        Download
                      </Button>
                    </a>
                    <p className="text-[11px] text-muted-foreground mt-2 text-center">{opt.size}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="bg-card/40 rounded-xl border border-border/60 p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center text-xs text-muted-foreground">
          Need help? Open the <Link href="/manual" className="text-primary hover:underline">user manual</Link> or contact your admin.
        </div>
      </section>
    </div>
  );
}
