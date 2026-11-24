'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import type { LinkValue, NavItem, ResolvedMediaRef } from '@/lib/types';
import { cn } from '@/lib/utils';

export function Wordmark({ name, light = true }: { name: string; light?: boolean }) {
  const [first, ...rest] = name.replace(/salon suites/i, '').trim().split(' ');
  return (
    <span className="flex flex-col leading-none">
      <span className={cn('font-display text-[26px] font-medium tracking-tight', light ? 'text-sc-ivory' : 'text-sc-black')}>
        {first} <em className="text-sc-gold">{rest.join(' ')}</em>
      </span>
      <span className={cn('mt-1 text-[9px] font-semibold tracking-[0.5em] uppercase', light ? 'text-sc-ivory/60' : 'text-sc-charcoal/60')}>Salon Suites</span>
    </span>
  );
}

function Logo({ name, logo, logoLight, solid }: { name: string; logo: ResolvedMediaRef | null; logoLight: ResolvedMediaRef | null; solid: boolean }) {
  const img = solid ? logo ?? logoLight : logoLight ?? logo;
  if (img?.media) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={img.media.url} alt={img.alt || name} className="h-10 w-auto md:h-12" />;
  }
  return <Wordmark name={name} light={!solid} />;
}

/** Reveals `.reveal` elements as they scroll into view. */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.is-visible)');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}

export function SiteHeader({
  name,
  logo,
  logoLight,
  nav,
  cta,
  overlay,
}: {
  name: string;
  logo: ResolvedMediaRef | null;
  logoLight: ResolvedMediaRef | null;
  nav: NavItem[];
  cta: LinkValue;
  /** True when the page opens with a dark hero the header floats over. */
  overlay: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // The menu remembers the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const solid = scrolled || !overlay;
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href.split('#')[0]));

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-500',
        overlay && !scrolled ? '-mb-22 bg-transparent' : 'bg-sc-black/95 shadow-[0_1px_0_rgba(198,161,91,0.25)] backdrop-blur',
      )}
    >
      <div className={cn('mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 transition-all sm:px-8', solid ? 'h-18' : 'h-22')}>
        <Link href="/" aria-label={`${name} home`} className="shrink-0">
          <Logo name={name} logo={logo} logoLight={logoLight} solid={false} />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                'relative text-[12px] font-semibold tracking-[0.2em] text-sc-ivory/80 uppercase transition-colors hover:text-sc-gold',
                isActive(item.href) && 'text-sc-gold after:absolute after:inset-x-0 after:-bottom-2 after:h-px after:bg-sc-gold',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href={cta.href}
            className="hidden min-h-11 items-center gap-2 rounded-full bg-sc-gold px-6 text-[12px] font-semibold tracking-[0.16em] text-sc-black uppercase transition-colors hover:bg-sc-gold-light sm:inline-flex"
          >
            {cta.label}
          </Link>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-full border border-sc-ivory/25 text-sc-ivory lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          'fixed inset-0 z-50 flex flex-col bg-sc-black text-sc-ivory transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!open}
      >
        <div className="flex h-18 items-center justify-between px-5">
          <Wordmark name={name} />
          <button type="button" aria-label="Close menu" className="flex size-11 items-center justify-center rounded-full border border-sc-ivory/25" onClick={() => setOpen(false)}>
            <X className="size-5" />
          </button>
        </div>
        <div className="gold-rule mx-5" />
        <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center gap-2 px-6">
          {nav.map((item, i) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              tabIndex={open ? 0 : -1}
              className={cn('flex items-baseline gap-4 py-2 font-display text-4xl transition-colors hover:text-sc-gold', isActive(item.href) && 'text-sc-gold')}
            >
              <span className="font-sans text-xs text-sc-gold/70">0{i + 1}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-5">
          <Link href={cta.href} tabIndex={open ? 0 : -1} className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-sc-gold text-sm font-semibold tracking-[0.16em] text-sc-black uppercase">
            {cta.label} <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Mobile sticky CTA. Most visitors arrive from Instagram on a phone. */
export function StickyCta({ cta }: { cta: LinkValue }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY > document.body.scrollHeight - 320;
      setVisible(window.scrollY > 360 && !nearBottom);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-500 md:hidden',
        visible ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <Link
        href={cta.href}
        className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-sc-gold text-sm font-semibold tracking-[0.16em] text-sc-black uppercase shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
      >
        {cta.label} <ArrowUpRight className="size-4" />
      </Link>
    </div>
  );
}
