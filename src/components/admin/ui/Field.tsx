"use client";

import { useId, type ReactNode } from "react";
import { isBrokenUrl, normalizeUrl } from "@/lib/url";

/**
 * Form primitives shared by every admin screen. Every content column in the
 * schema exists twice (`*_ko` / `*_en`), so `BilingualField` is the workhorse
 * here — it is what keeps each editor form short.
 */

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`field ${className ?? ""}`}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <p className="text-2xs text-fg-subtle">{hint}</p>}
    </div>
  );
}

export function TextInput({
  label,
  hint,
  error,
  value,
  onChange,
  ...rest
}: {
  label?: string;
  hint?: string;
  /** Replaces the hint and marks the field invalid to assistive tech. */
  error?: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const id = useId();
  return (
    <div className="field">
      {label && (
        <label className="label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        className="input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error ? (
        <p className="text-2xs text-danger">{error}</p>
      ) : (
        hint && <p className="text-2xs text-fg-subtle">{hint}</p>
      )}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  rows = 4,
  ...rest
}: {
  label?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange"
>) {
  const id = useId();
  return (
    <div className="field">
      {label && (
        <label className="label" htmlFor={id}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        className="input"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...rest}
      />
      {hint && <p className="text-2xs text-fg-subtle">{hint}</p>}
    </div>
  );
}

/**
 * Korean and English variants of one field.
 *
 * Single-line fields sit side by side, where seeing both at once is useful and
 * the halved width costs nothing. Multi-line fields stack instead: a body
 * paragraph squeezed into half a column — itself half the editor, next to the
 * preview — wraps every few words and is miserable to write in.
 */
export function BilingualField({
  label,
  hint,
  ko,
  en,
  onChangeKo,
  onChangeEn,
  multiline = false,
  rows = 3,
  placeholderKo,
  placeholderEn,
}: {
  label: string;
  hint?: string;
  ko: string;
  en: string;
  onChangeKo: (value: string) => void;
  onChangeEn: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholderKo?: string;
  placeholderEn?: string;
}) {
  const Control = multiline ? TextArea : TextInput;

  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className={multiline ? "flex flex-col gap-3" : "grid gap-2 sm:grid-cols-2"}>
        <Control
          // Stacked textareas lose the visual pairing, so each is named.
          label={multiline ? "한국어" : undefined}
          value={ko}
          onChange={onChangeKo}
          rows={rows}
          placeholder={placeholderKo ?? "한국어"}
          aria-label={multiline ? undefined : `${label} (한국어)`}
        />
        <Control
          label={multiline ? "English" : undefined}
          value={en}
          onChange={onChangeEn}
          rows={rows}
          placeholder={placeholderEn ?? "English"}
          aria-label={multiline ? undefined : `${label} (English)`}
        />
      </div>
      <p className="text-2xs text-fg-subtle">
        {hint ?? "한쪽만 채우면 다른 언어에서도 채운 쪽이 표시됩니다."}
      </p>
    </div>
  );
}

/**
 * URL field that repairs itself on blur and says so when it cannot.
 *
 * Pasting a markdown link into one of these produced a stored value of
 * `https://site](https://site`, which the browser refused to navigate to — the
 * live-demo button silently landed on `about:blank`. Cleaning the value where
 * it is entered stops that at the source; `safeExternalUrl` on the public side
 * is the second line of defence.
 */
export function UrlInput({
  label,
  hint,
  value,
  onChange,
  placeholder = "https://",
}: {
  label?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      label={label}
      type="url"
      inputMode="url"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={() => {
        const cleaned = normalizeUrl(value);
        if (cleaned !== value) onChange(cleaned);
      }}
      hint={hint}
      error={
        isBrokenUrl(value)
          ? "이 주소로는 이동할 수 없습니다. https:// 로 시작하는지 확인하세요."
          : undefined
      }
    />
  );
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint && <p className="text-2xs text-fg-subtle">{hint}</p>}
      </div>
    </div>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <div className="field">
      {label && (
        <label className="label" htmlFor={id}>
          {label}
        </label>
      )}
      <select
        id={id}
        className="input"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
