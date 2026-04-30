"use client";

type Props = {
  action: (formData: FormData) => Promise<void>;
};

const field =
  "rounded-lg border border-rule-2 bg-canvas-3 px-3 py-2.5 text-ink outline-none transition-colors focus:border-ink";

export function OnboardingForm({ action }: Props) {
  return (
    <form action={action} className="mt-8 flex flex-col gap-6">
      <label className="flex flex-col gap-2 text-[13px] text-mute">
        Starting level (CEFR)
        <select name="startingCefr" defaultValue="B1" className={field}>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="C1">C1</option>
        </select>
      </label>

      <label className="flex flex-col gap-2 text-[13px] text-mute">
        Voice
        <select name="voiceId" defaultValue="camille" className={field}>
          <option value="camille">Camille — Paris</option>
          <option value="leo">Léo — Lyon</option>
          <option value="nour">Nour — Marseille</option>
        </select>
      </label>

      <label className="flex flex-col gap-2 text-[13px] text-mute">
        Daily target (minutes)
        <input
          type="number"
          name="dailyTargetMinutes"
          min={10}
          max={120}
          step={5}
          defaultValue={30}
          className={field}
        />
      </label>

      <label className="flex flex-col gap-2 text-[13px] text-mute">
        Timezone (optional, IANA)
        <input
          type="text"
          name="timezone"
          placeholder="e.g. Europe/Paris"
          className={`${field} placeholder:text-mute-2`}
        />
      </label>

      <label className="flex items-center gap-3 text-sm text-ink-2">
        <input
          type="checkbox"
          name="remindersEnabled"
          value="on"
          className="size-4 rounded border-rule-2 bg-canvas-3 text-wine focus:ring-wine"
        />
        Email me a quiet reminder if I skip a day
      </label>

      <label className="flex items-center gap-3 text-sm text-ink-2">
        <input
          type="checkbox"
          name="transcriptRetention"
          value="on"
          defaultChecked
          className="size-4 rounded border-rule-2 bg-canvas-3 text-wine focus:ring-wine"
        />
        Keep transcripts on my account
      </label>

      <button
        type="submit"
        className="mt-2 inline-flex items-center justify-center bg-ink px-6 py-3 text-sm font-medium text-canvas transition-colors hover:bg-ink-2"
      >
        Continue to dashboard
      </button>
    </form>
  );
}
