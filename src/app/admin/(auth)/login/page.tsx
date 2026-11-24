import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in · Shear Chemistry Admin', robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-screen bg-[#0d0d0d] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(198,161,91,0.35),transparent_55%),radial-gradient(circle_at_80%_90%,rgba(198,161,91,0.18),transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-[#faf7f1]">
          <span className="text-xs tracking-[0.4em] text-[#c6a15b] uppercase">Salon Suites · Atlanta</span>
          <div>
            <p className="font-display text-6xl leading-none">Shear<br /><em className="text-[#c6a15b]">Chemistry</em></p>
            <p className="mt-6 max-w-sm text-sm text-white/60">Manage pages, the build-out journal, the founding member waitlist and every image on the site from one place.</p>
          </div>
          <span className="text-xs text-white/40">1341 Moreland Avenue, Suite 201</span>
        </div>
      </div>
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <span className="flex size-10 items-center justify-center rounded-lg bg-black text-[#c6a15b]">
              <Sparkles className="size-5" />
            </span>
            <h1 className="text-2xl font-semibold">Sign in to the admin panel</h1>
            <p className="text-sm text-muted-foreground">Use the email and password for your admin account.</p>
          </div>
          <LoginForm next={next ?? '/admin'} />
        </div>
      </div>
    </main>
  );
}
