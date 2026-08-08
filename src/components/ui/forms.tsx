export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-cream">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={`focus-ring w-full rounded-xl border border-line bg-ink px-3 py-2.5 text-sm text-cream placeholder:text-muted/60 outline-none transition hover:border-line focus:border-copper/60 ${props.className || ""}`}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={`focus-ring w-full rounded-xl border border-line bg-ink px-3 py-2.5 text-sm text-cream placeholder:text-muted/60 outline-none transition hover:border-line focus:border-copper/60 ${props.className || ""}`}
    />
  );
}

export function SelectInput(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  return (
    <select
      {...props}
      className={`focus-ring w-full rounded-xl border border-line bg-ink px-3 py-2.5 text-sm text-cream outline-none transition hover:border-line focus:border-copper/60 ${props.className || ""}`}
    />
  );
}

export function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      {...props}
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-copper px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-copper-bright disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ""}`}
    />
  );
}

export function GhostButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      {...props}
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-cream transition hover:border-copper/40 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ""}`}
    />
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`noise-overlay relative overflow-hidden rounded-2xl border border-line bg-surface ${className}`}
    >
      {children}
    </div>
  );
}
