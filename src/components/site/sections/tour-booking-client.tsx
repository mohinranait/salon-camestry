'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, Loader2 } from 'lucide-react';
import { addDays, formatDate, formatTime, weekday } from '@/lib/booking';
import { cn } from '@/lib/utils';
import { SelectField, TextAreaField, TextField } from '../form-fields';

type Window = { min: string; max: string };

export function TourBookingClient({
  specialties,
  durationMinutes,
  successTitle,
  successMessage,
}: {
  specialties: string[];
  durationMinutes: number;
  successTitle: string;
  successMessage: string;
}) {
  const [window, setWindow] = useState<Window | null>(null);
  const [closed, setClosed] = useState<number[]>([]);
  const [blackout, setBlackout] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[] | null>(null);
  const [time, setTime] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/bookings/availability')
      .then((r) => r.json())
      .then((d) => {
        setWindow(d.window);
        setClosed(d.closedWeekdays ?? []);
        setBlackout(d.blackoutDates ?? []);
      })
      .catch(() => setError('Could not load availability. Please refresh.'));
  }, []);

  const days = useMemo(() => {
    if (!window) return [];
    const list: string[] = [];
    for (let d = window.min; d <= window.max; d = addDays(d, 1)) {
      if (!closed.includes(weekday(d)) && !blackout.includes(d)) list.push(d);
    }
    return list;
  }, [window, closed, blackout]);

  function chooseDate(d: string) {
    setDate(d);
    setSlots(null);
    setTime('');
    fetch(`/api/bookings/availability?date=${d}`)
      .then((r) => r.json())
      .then((res) => setSlots(res.slots ?? []))
      .catch(() => setSlots([]));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!date || !time) {
      setError('Choose a date and time first.');
      return;
    }
    setError('');
    setState('sending');
    const payload = { ...Object.fromEntries(new FormData(e.currentTarget).entries()), date, time };
    try {
      const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Something went wrong.');
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setState('idle');
      // The chosen slot may have just been taken; reload what is still open.
      fetch(`/api/bookings/availability?date=${date}`)
        .then((r) => r.json())
        .then((d) => setSlots(d.slots ?? []))
        .catch(() => undefined);
    }
  }

  if (state === 'done') {
    return (
      <div className="flex min-h-80 flex-col items-start justify-center gap-5" role="status">
        <span className="flex size-14 items-center justify-center rounded-full bg-sc-gold text-sc-black"><Check className="size-6" /></span>
        <h3 className="font-display text-4xl">{successTitle || 'Your tour is requested.'}</h3>
        <p className="opacity-75">{formatDate(date)} at {formatTime(time)}</p>
        <p className="max-w-md leading-relaxed opacity-75">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold tracking-[0.25em] uppercase opacity-60">1 · Choose a day</p>
        {!window ? (
          <Loader2 className="size-5 animate-spin opacity-60" />
        ) : days.length === 0 ? (
          <p className="text-sm opacity-70">No tour days are open right now. Please check back soon.</p>
        ) : (
          <div className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
            {days.map((d) => {
              const dt = new Date(`${d}T12:00:00Z`);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => chooseDate(d)}
                  aria-pressed={date === d}
                  className={cn(
                    'flex w-16 shrink-0 flex-col items-center rounded-2xl border py-3 transition-colors',
                    date === d ? 'border-sc-gold bg-sc-gold text-sc-black' : 'border-current/20 hover:border-sc-gold',
                  )}
                >
                  <span className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-70">{dt.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}</span>
                  <span className="font-display text-2xl">{dt.getUTCDate()}</span>
                  <span className="text-[10px] uppercase opacity-70">{dt.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {date && (
        <div>
          <p className="mb-3 text-[10px] font-semibold tracking-[0.25em] uppercase opacity-60">2 · Choose a time · {durationMinutes} min tour</p>
          {slots === null ? (
            <Loader2 className="size-5 animate-spin opacity-60" />
          ) : slots.length === 0 ? (
            <p className="text-sm opacity-70">This day is fully booked. Try another day.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  aria-pressed={time === t}
                  className={cn('rounded-full border py-2.5 text-sm transition-colors', time === t ? 'border-sc-gold bg-sc-gold text-sc-black' : 'border-current/20 hover:border-sc-gold')}
                >
                  {formatTime(t)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {time && (
        <div className="space-y-7">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase opacity-60">3 · Your details</p>
          <div className="grid gap-7 sm:grid-cols-2">
            <TextField label="Full name" name="name" autoComplete="name" required className="sm:col-span-2" />
            <TextField label="Email" name="email" type="email" autoComplete="email" required />
            <TextField label="Phone" name="phone" type="tel" autoComplete="tel" required />
          </div>
          <SelectField label="Specialty" name="specialty" options={specialties} />
          <TextAreaField label="Anything we should prepare? (optional)" name="notes" rows={3} />
          <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        </div>
      )}

      {error && <p className="border-l-2 border-red-400 pl-3 text-sm text-red-400" role="alert">{error}</p>}

      {time && (
        <button
          type="submit"
          disabled={state === 'sending'}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-sc-gold px-8 text-[13px] font-semibold tracking-[0.16em] text-sc-black uppercase transition-colors hover:bg-sc-gold-light disabled:opacity-70 sm:w-auto"
        >
          {state === 'sending' && <Loader2 className="size-4 animate-spin" />}
          Request {formatTime(time)} on {new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
          {state !== 'sending' && <ArrowUpRight className="size-4" />}
        </button>
      )}
    </form>
  );
}
