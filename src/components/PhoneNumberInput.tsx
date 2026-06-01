import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Country labels paired with calling codes
const COUNTRIES: { code: string; label: string }[] = [
  { code: "1", label: "United States (+1)" },
  { code: "44", label: "United Kingdom (+44)" },
  { code: "33", label: "France (+33)" },
  { code: "49", label: "Germany (+49)" },
  { code: "61", label: "Australia (+61)" },
  { code: "91", label: "India (+91)" },
  { code: "86", label: "China (+86)" },
  { code: "81", label: "Japan (+81)" },
  { code: "52", label: "Mexico (+52)" },
  { code: "55", label: "Brazil (+55)" },
  { code: "82", label: "South Korea (+82)" },
  { code: "34", label: "Spain (+34)" },
  { code: "39", label: "Italy (+39)" },
  { code: "31", label: "Netherlands (+31)" },
  { code: "41", label: "Switzerland (+41)" },
  { code: "46", label: "Sweden (+46)" },
  { code: "47", label: "Norway (+47)" },
  { code: "45", label: "Denmark (+45)" },
  { code: "353", label: "Ireland (+353)" },
  { code: "971", label: "UAE (+971)" },
  { code: "972", label: "Israel (+972)" },
  { code: "27", label: "South Africa (+27)" },
  { code: "234", label: "Nigeria (+234)" },
  { code: "254", label: "Kenya (+254)" },
  { code: "65", label: "Singapore (+65)" },
  { code: "852", label: "Hong Kong (+852)" },
  { code: "64", label: "New Zealand (+64)" },
];

const COUNTRY_CODE_TO_LABEL = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c.label])
);

// National number grouping per country calling code.
// Total digits must equal the sum. Defaults to [3,3,4] (10 digits) when unknown.
const FORMATS: Record<string, number[]> = {
  "1": [3, 3, 4],          // US / CA
  "44": [4, 3, 3],         // UK
  "33": [1, 2, 2, 2, 2],   // France
  "49": [3, 3, 4],         // Germany
  "61": [1, 4, 4],         // Australia
  "91": [5, 5],            // India
  "86": [3, 4, 4],         // China
  "81": [2, 4, 4],         // Japan
  "52": [2, 4, 4],         // Mexico
  "55": [2, 5, 4],         // Brazil
  "82": [2, 4, 4],         // South Korea
  "34": [3, 3, 3],         // Spain
  "39": [3, 3, 4],         // Italy
  "31": [1, 4, 4],         // Netherlands
  "41": [2, 3, 2, 2],      // Switzerland
  "46": [2, 3, 2, 2],      // Sweden
  "47": [3, 2, 3],         // Norway
  "45": [2, 2, 2, 2],      // Denmark
  "353": [2, 3, 4],        // Ireland
  "971": [2, 3, 4],        // UAE
  "972": [2, 3, 4],        // Israel
  "27": [2, 3, 4],         // South Africa
  "234": [3, 3, 4],        // Nigeria
  "254": [3, 3, 3],        // Kenya
  "65": [4, 4],            // Singapore
  "852": [4, 4],           // Hong Kong
  "64": [2, 3, 4],         // New Zealand
};

const onlyDigits = (s: string) => s.replace(/\D+/g, "");

interface PhoneNumberInputProps {
  value: string; // E.164: "+15551234567"
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  id?: string;
}

export default function PhoneNumberInput({
  value,
  onChange,
  disabled,
  hasError,
  id,
}: PhoneNumberInputProps) {
  // Parse initial value
  const initial = useMemo(() => {
    const digits = onlyDigits(value || "");
    if (!digits) return { cc: "1", national: "" };
    // Try to match a known calling code (longest first)
    const codes = Object.keys(FORMATS).sort((a, b) => b.length - a.length);
    for (const c of codes) {
      if (digits.startsWith(c)) return { cc: c, national: digits.slice(c.length) };
    }
    // Fallback: assume 1-3 digit country code (default 1 digit)
    return { cc: digits.slice(0, 1), national: digits.slice(1) };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [cc, setCc] = useState(initial.cc);
  const [national, setNational] = useState(initial.national);

  const groups = FORMATS[cc] || [3, 3, 4];
  const totalLen = groups.reduce((a, b) => a + b, 0);

  // Emit combined E.164 value upward
  useEffect(() => {
    const combined = cc ? `+${cc}${national}` : "";
    if (combined !== value) onChange(combined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cc, national]);

  // Refs: [ccRef, ...groupRefs]
  const ccSelectRef = useRef<HTMLSelectElement>(null);
  const groupRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Split national digits into groups for display
  const groupValues: string[] = [];
  let cursor = 0;
  for (const len of groups) {
    groupValues.push(national.slice(cursor, cursor + len));
    cursor += len;
  }

  const focusGroup = (idx: number, atEnd = true) => {
    const el = groupRefs.current[idx];
    if (el) {
      el.focus();
      if (atEnd) {
        const v = el.value;
        try {
          el.setSelectionRange(v.length, v.length);
        } catch {}
      } else {
        try {
          el.setSelectionRange(0, 0);
        } catch {}
      }
    }
  };

  const handleCcChange = (newCc: string) => {
    setCc(newCc);
    // If new cc shrinks national capacity, trim it
    const newTotal = (FORMATS[newCc] || [3, 3, 4]).reduce((a, b) => a + b, 0);
    if (national.length > newTotal) setNational(national.slice(0, newTotal));
  };

  const handleGroupChange = (idx: number, raw: string) => {
    const d = onlyDigits(raw);
    // Reconstruct full national string by replacing this group's slice
    const start = groups.slice(0, idx).reduce((a, b) => a + b, 0);
    const before = national.slice(0, start);
    const after = national.slice(start + groups[idx]);
    // Allow overflow to spill into next groups
    let combined = (before + d + after).slice(0, totalLen);
    setNational(combined);

    // Auto-advance if this group is now full
    const thisGroupLen = groups[idx];
    const newGroupValue = combined.slice(start, start + thisGroupLen);
    if (newGroupValue.length >= thisGroupLen && idx < groups.length - 1) {
      requestAnimationFrame(() => focusGroup(idx + 1, false));
    }
  };

  const handleGroupKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const el = e.currentTarget;
    const selStart = el.selectionStart ?? 0;
    if (e.key === "Backspace" && selStart === 0 && !el.value) {
      e.preventDefault();
      if (idx > 0) focusGroup(idx - 1, true);
      else ccSelectRef.current?.focus();
    } else if (e.key === "ArrowLeft" && selStart === 0) {
      e.preventDefault();
      if (idx > 0) focusGroup(idx - 1, true);
      else ccSelectRef.current?.focus();
    } else if (e.key === "ArrowRight" && selStart === el.value.length) {
      e.preventDefault();
      if (idx < groups.length - 1) focusGroup(idx + 1, false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!/\d/.test(text)) return;
    e.preventDefault();
    const digits = onlyDigits(text);
    // If pasted starts with country code we know, split it off
    const codes = Object.keys(FORMATS).sort((a, b) => b.length - a.length);
    const leading = text.trim().startsWith("+") ? digits : null;
    if (leading) {
      for (const c of codes) {
        if (leading.startsWith(c)) {
          setCc(c);
          const cap = (FORMATS[c] || [3, 3, 4]).reduce((a, b) => a + b, 0);
          setNational(leading.slice(c.length).slice(0, cap));
          return;
        }
      }
    }
    setNational(digits.slice(0, totalLen));
  };

  const boxBase = cn(
    "h-11 rounded-md border bg-[#0A0A0A] text-[#FFFFFF] placeholder:text-[#444444]",
    "focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    hasError ? "border-red-500/50" : "border-[#2A2A2A]"
  );

  const selectBase = cn(
    boxBase,
    "appearance-none pl-2 pr-7 text-sm font-medium cursor-pointer"
  );

  return (
    <div className="flex items-center gap-1.5 flex-wrap" id={id}>
      {/* Country code dropdown */}
      <div className="flex items-center gap-1">
        <span className="text-[#FFFFFF] text-base font-medium select-none">+</span>
        <div className="relative">
          <select
            ref={ccSelectRef}
            aria-label="Country code"
            value={cc}
            disabled={disabled}
            onChange={(e) => {
              handleCcChange(e.target.value);
              requestAnimationFrame(() => focusGroup(0, false));
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "Tab") {
                e.preventDefault();
                focusGroup(0, false);
              }
            }}
            className={selectBase}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
          {/* Custom chevron */}
          <svg
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#888888]"
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
          >
            <path
              d="M1 1L5 5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Country label beside the dropdown */}
      <span className="text-[#999999] text-xs select-none mr-1 hidden sm:inline">
        {COUNTRY_CODE_TO_LABEL[cc] || ""}
      </span>

      {/* National digit groups separated by dashes */}
      {groups.map((len, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <input
            ref={(el) => (groupRefs.current[idx] = el)}
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            aria-label={`Phone digits group ${idx + 1}`}
            value={groupValues[idx]}
            disabled={disabled}
            maxLength={len}
            onChange={(e) => handleGroupChange(idx, e.target.value)}
            onKeyDown={(e) => handleGroupKeyDown(idx, e)}
            onPaste={handlePaste}
            className={cn(boxBase, "text-center px-1")}
            style={{ width: `${Math.max(2.25, len * 0.95)}rem` }}
            placeholder={"•".repeat(len)}
          />
          {idx < groups.length - 1 && (
            <span className="text-[#666666] select-none">–</span>
          )}
        </div>
      ))}
    </div>
  );
}
