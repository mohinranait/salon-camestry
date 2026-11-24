'use client';

import { useState } from 'react';
import { ArrowUpRight, Check, Loader2 } from 'lucide-react';
import { ChoiceField, SelectField, TextAreaField, TextField } from '../form-fields';

type Options = { specialties: string[]; suiteSizes: string[]; suiteTypes: string[]; moveInOptions: string[] };

export function WaitlistForm({ options, submitLabel, successTitle, successMessage }: { options: Options; submitLabel: string; successTitle: string; successMessage: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const [suiteSize, setSuiteSize] = useState('');
  const [suiteType, setSuiteType] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    setState('sending');
    try {
      const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div className="flex min-h-80 flex-col items-start justify-center gap-5" role="status">
        <span className="flex size-14 items-center justify-center rounded-full bg-sc-gold text-sc-black">
          <Check className="size-6" />
        </span>
        <h3 className="font-display text-4xl">{successTitle || "You're on the list."}</h3>
        <p className="max-w-md leading-relaxed opacity-75">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-7" noValidate={false}>
      <div className="grid gap-7 sm:grid-cols-2">
        <TextField label="Full name" name="name" autoComplete="name" required minLength={2} className="sm:col-span-2" />
        <TextField label="Phone" name="phone" type="tel" autoComplete="tel" required minLength={7} />
        <TextField label="Email" name="email" type="email" autoComplete="email" required />
      </div>
      <SelectField label="Specialty / license type" name="specialty" options={options.specialties} required />
      <div className="grid gap-7 sm:grid-cols-2">
        <ChoiceField label="Preferred suite size" name="suiteSize" options={options.suiteSizes} value={suiteSize} onChange={setSuiteSize} />
        <ChoiceField label="Wet or dry" name="suiteType" options={options.suiteTypes} value={suiteType} onChange={setSuiteType} />
      </div>
      <SelectField label="Target move-in" name="moveIn" options={options.moveInOptions} required />
      <TextAreaField label="Anything we should know? (optional)" name="message" rows={3} />
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error && <p className="border-l-2 border-red-400 pl-3 text-sm text-red-400" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={state === 'sending'}
        className="group inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-sc-gold px-8 text-[13px] font-semibold tracking-[0.16em] text-sc-black uppercase transition-colors hover:bg-sc-gold-light disabled:opacity-70 sm:w-auto"
      >
        {state === 'sending' ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitLabel || 'Join the Founding Member List'}
        {state !== 'sending' && <ArrowUpRight className="size-4" />}
      </button>
      <p className="text-xs opacity-50">We&apos;ll only use your details to share Shear Chemistry leasing news. No spam, ever.</p>
    </form>
  );
}
