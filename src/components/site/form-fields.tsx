'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const base =
  'peer w-full rounded-none border-0 border-b border-current/25 bg-transparent px-0 pt-6 pb-2.5 text-base outline-none transition-colors placeholder:text-transparent focus:border-sc-gold focus:ring-0';

const labelCls =
  'pointer-events-none absolute top-1 left-0 text-[10px] font-semibold tracking-[0.25em] uppercase opacity-60 transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-1 peer-focus:text-[10px] peer-focus:tracking-[0.25em] peer-focus:uppercase peer-focus:text-sc-gold peer-focus:opacity-100';

export function TextField({ label, className, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn('relative block', className)}>
      <input {...props} placeholder={label} className={base} />
      <span className={labelCls}>
        {label}
        {props.required && ' *'}
      </span>
    </label>
  );
}

export function TextAreaField({ label, className, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={cn('relative block', className)}>
      <textarea {...props} placeholder={label} className={cn(base, 'min-h-24 resize-y')} />
      <span className={labelCls}>{label}</span>
    </label>
  );
}

export function SelectField({ label, options, className, ...props }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={cn('relative block', className)}>
      <span className="absolute top-1 left-0 text-[10px] font-semibold tracking-[0.25em] uppercase opacity-60">
        {label}
        {props.required && ' *'}
      </span>
      <select {...props} className={cn(base, 'cursor-pointer appearance-none pr-8 [&>option]:text-black')}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 bottom-3 size-4 opacity-60" />
    </label>
  );
}

/** Pill radio group, easier to tap on phones than a dropdown. */
export function ChoiceField({ label, name, options, value, onChange }: { label: string; name: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-3 text-[10px] font-semibold tracking-[0.25em] uppercase opacity-60">{label} *</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o}
            className={cn(
              'cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sc-gold',
              value === o ? 'border-sc-gold bg-sc-gold text-sc-black' : 'border-current/25 hover:border-sc-gold',
            )}
          >
            <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} className="sr-only" required />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
