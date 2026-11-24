import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LinkValue, ResolvedMediaRef, SectionTheme } from '@/lib/types';
import type { SiteSettings } from '@/lib/settings';
import { primaryCta } from '@/lib/settings';

export const str = (v: unknown) => (typeof v === 'string' ? v : '');
export const arr = <T,>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
export const media = (v: unknown) => (v && typeof v === 'object' && 'mediaId' in v ? (v as ResolvedMediaRef) : null);

export function themeClasses(theme: SectionTheme) {
  if (theme === 'dark') return 'bg-sc-black text-sc-ivory';
  if (theme === 'ivory') return 'bg-sc-ivory text-sc-charcoal';
  return 'bg-white text-sc-charcoal';
}

export function SectionShell({
  theme,
  anchor,
  className,
  children,
  bleed = false,
}: {
  theme: SectionTheme;
  anchor?: string;
  className?: string;
  children: React.ReactNode;
  bleed?: boolean;
}) {
  return (
    <section id={anchor || undefined} data-theme={theme} className={cn('relative scroll-mt-24', themeClasses(theme), className)}>
      {bleed ? children : <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">{children}</div>}
    </section>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p className={cn('flex items-center gap-3 text-[11px] font-semibold tracking-[0.38em] text-sc-gold uppercase', className)}>
      <span className="h-px w-8 bg-sc-gold/70" aria-hidden />
      {children}
    </p>
  );
}

export function Heading({ children, as: As = 'h2', className }: { children: React.ReactNode; as?: 'h1' | 'h2' | 'h3'; className?: string }) {
  if (!children) return null;
  return <As className={cn('font-display text-4xl leading-[1.04] font-medium tracking-tight text-balance sm:text-5xl md:text-6xl', className)}>{children}</As>;
}

/** Sets the chosen highlight words in gold italic inside a heading. */
export function Highlighted({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !text.includes(highlight)) {
    return <>{text.split('\n').map((line, i, all) => <span key={i}>{line}{i < all.length - 1 && <br />}</span>)}</>;
  }
  const [before, after] = text.split(highlight);
  return (
    <>
      {before}
      <em className="text-gold-gradient pr-1 italic">{highlight}</em>
      {after}
    </>
  );
}

export function SectionIntro({
  eyebrow,
  heading,
  intro,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  heading?: string;
  intro?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  if (!eyebrow && !heading && !intro) return null;
  return (
    <div className={cn('reveal mb-12 max-w-3xl space-y-5 md:mb-16', align === 'center' && 'mx-auto text-center [&_p:first-child]:justify-center', className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading>{heading}</Heading>
      {intro && <div className="text-base leading-relaxed opacity-75 md:text-lg">{intro}</div>}
    </div>
  );
}

const isExternal = (href: string) => /^(https?:|mailto:|tel:)/.test(href);

export function SmartLink({ href, className, children, ...rest }: { href: string; className?: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  if (isExternal(href)) {
    return (
      <a href={href} className={className} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href || '/'} className={className} {...rest}>
      {children}
    </Link>
  );
}

export function ButtonLink({
  link,
  variant = 'gold',
  className,
}: {
  link: LinkValue | null | undefined;
  variant?: 'gold' | 'outline' | 'ghost' | 'dark';
  className?: string;
}) {
  if (!link?.label || !link.href) return null;
  const styles = {
    gold: 'bg-sc-gold text-sc-black hover:bg-sc-gold-light',
    dark: 'bg-sc-black text-sc-ivory hover:bg-sc-charcoal',
    outline: 'border border-current/30 hover:border-sc-gold hover:text-sc-gold',
    ghost: 'underline-offset-8 hover:underline px-0',
  };
  return (
    <SmartLink
      href={link.href}
      className={cn(
        'group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 text-[13px] font-semibold tracking-[0.14em] uppercase transition-colors duration-300',
        styles[variant],
        className,
      )}
    >
      {link.label}
      <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </SmartLink>
  );
}

/** The CTA a section shows: either the site-wide phase CTA or its own link. */
export function sectionCta(data: Record<string, unknown>, settings: SiteSettings): LinkValue | null {
  if (data.useSiteCta) return primaryCta(settings);
  const cta = data.cta as LinkValue | undefined;
  return cta?.label && cta.href ? cta : null;
}

export function SiteMedia({
  value,
  className,
  sizes = '100vw',
  priority = false,
  fill = true,
  background = false,
}: {
  value: ResolvedMediaRef | null | undefined;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  /** Background videos autoplay muted and loop. */
  background?: boolean;
}) {
  const m = value?.media;
  if (!m) return null;
  if (m.kind === 'video') {
    return (
      <video
        src={m.url}
        className={cn(fill && 'absolute inset-0 size-full', 'object-cover', className)}
        aria-label={value.alt || undefined}
        {...(background ? { autoPlay: true, muted: true, loop: true, playsInline: true } : { controls: true, playsInline: true, preload: 'metadata' })}
      />
    );
  }
  const unoptimized = m.mimeType === 'image/svg+xml' || m.mimeType === 'image/gif';
  const placeholder = m.blurDataUrl ? ('blur' as const) : ('empty' as const);
  if (fill || !m.width || !m.height) {
    return (
      <Image
        src={m.url}
        alt={value.alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
        placeholder={placeholder}
        blurDataURL={m.blurDataUrl ?? undefined}
        className={cn('object-cover', className)}
      />
    );
  }
  return (
    <Image
      src={m.url}
      alt={value.alt}
      width={m.width}
      height={m.height}
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
      placeholder={placeholder}
      blurDataURL={m.blurDataUrl ?? undefined}
      className={className}
    />
  );
}
