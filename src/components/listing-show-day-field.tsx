"use client";

import { useId } from "react";

type ShowDay = { isoDate: string; time: string; directionsNote?: string };

interface Props {
  value?: ShowDay;
  onChange: (value: ShowDay | undefined) => void;
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-white/10 dark:bg-surface-ink dark:text-white";

/**
 * Optional show day for a listing. Feeds the listing page's show-day section
 * (date, time, how to get there, Add to calendar, Directions). Without a date
 * nothing is advertised; the section also hides itself once the day is past.
 */
export default function ShowDayField({ value, onChange }: Props) {
  const dateId = useId();
  const fromId = useId();
  const toId = useId();
  const noteId = useId();

  const [from = "", to = ""] = (value?.time ?? "").split(" – ");
  const today = new Date().toISOString().slice(0, 10);

  function update(patch: { isoDate?: string; from?: string; to?: string; directionsNote?: string }) {
    const isoDate = patch.isoDate ?? value?.isoDate ?? "";
    const start = patch.from ?? from;
    const end = patch.to ?? to;
    const directionsNote = patch.directionsNote ?? value?.directionsNote ?? "";
    if (!isoDate) {
      onChange(undefined);
      return;
    }
    onChange({ isoDate, time: [start, end].filter(Boolean).join(" – "), directionsNote });
  }

  const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300";

  return (
    <fieldset className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
      <legend className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
        Show day <span className="normal-case tracking-normal font-normal">(optional)</span>
      </legend>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={dateId} className={labelClass}>Date</label>
          <input
            id={dateId}
            type="date"
            min={today}
            value={value?.isoDate ?? ""}
            onChange={(e) => update({ isoDate: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={fromId} className={labelClass}>From</label>
          <input id={fromId} type="time" value={from} onChange={(e) => update({ from: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label htmlFor={toId} className={labelClass}>Until</label>
          <input id={toId} type="time" value={to} onChange={(e) => update({ to: e.target.value })} className={inputClass} />
        </div>
      </div>
      <div className="mt-3">
        <label htmlFor={noteId} className={labelClass}>How to get there (optional)</label>
        <input
          id={noteId}
          type="text"
          maxLength={160}
          value={value?.directionsNote ?? ""}
          onChange={(e) => update({ directionsNote: e.target.value })}
          placeholder="e.g. Follow the show boards from Oxford Road"
          className={inputClass}
        />
      </div>
      {value?.isoDate && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="mt-3 text-xs font-semibold text-slate-600 underline cursor-pointer dark:text-slate-400"
        >
          Remove show day
        </button>
      )}
    </fieldset>
  );
}
