import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="flex flex-1 items-center bg-sc-black text-sc-ivory">
      <div className="mx-auto max-w-3xl px-5 py-40 text-center">
        <p className="text-[11px] font-semibold tracking-[0.4em] text-sc-gold uppercase">Error 404 · Element not found</p>
        <h1 className="mt-6 font-display text-6xl md:text-8xl">
          This formula <em className="text-gold-gradient">doesn&apos;t exist.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-md opacity-70">The page you were looking for has moved, or it isn&apos;t open yet.</p>
        <Link href="/" className="mt-10 inline-flex min-h-12 items-center rounded-full bg-sc-gold px-8 text-[13px] font-semibold tracking-[0.16em] text-sc-black uppercase">
          Back to home
        </Link>
      </div>
    </main>
  );
}
