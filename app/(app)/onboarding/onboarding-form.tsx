"use client";

type Props = {
  action: (formData: FormData) => Promise<void>;
};

export function OnboardingForm({ action }: Props) {
  return (
    <form action={action} className="mt-8 flex flex-col gap-6">
      <label className="flex flex-col gap-2 text-sm">
        <span className="text-zinc-400">Starting level (CEFR)</span>
        <select
          name="startingCefr"
          defaultValue="B1"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
        >
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="C1">C1</option>
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-zinc-400">Voice</span>
        <select
          name="voiceId"
          defaultValue="camille"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
        >
          <option value="camille">Camille — Paris</option>
          <option value="leo">Léo — Lyon</option>
          <option value="nour">Nour — Marseille</option>
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-zinc-400">Daily target (minutes)</span>
        <input
          type="number"
          name="dailyTargetMinutes"
          min={10}
          max={120}
          step={5}
          defaultValue={30}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-zinc-400">Timezone (optional, IANA)</span>
        <input
          type="text"
          name="timezone"
          placeholder="e.g. Europe/Paris"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-600"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input type="checkbox" name="remindersEnabled" value="on" className="rounded border-zinc-600" />
        Email me a quiet reminder if I skip a day
      </label>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          name="transcriptRetention"
          value="on"
          defaultChecked
          className="rounded border-zinc-600"
        />
        Keep transcripts on my account
      </label>

      <button
        type="submit"
        className="rounded-full bg-zinc-100 py-3 text-sm font-medium text-zinc-950 hover:bg-white"
      >
        Continue to dashboard
      </button>
    </form>
  );
}
