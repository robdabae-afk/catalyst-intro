import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { INDUSTRIES, FUNDING_STAGES } from "@/lib/constants";
import { X } from "lucide-react";
import type { DiscoverFilters as Filters } from "@/hooks/useDiscoverFeed";
import { useState } from "react";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  targetType: "founder" | "investor";
}

const MRR_BANDS = ["0", "1-10k", "10k-50k", "50k+"];
const CHECK_BANDS = ["0-100k", "100k-500k", "500k-2m", "2m+"];

export function DiscoverFilters({ filters, onChange, targetType }: Props) {
  const [locInput, setLocInput] = useState("");

  const toggleIn = (key: "industries" | "stages", val: string) => {
    const cur = filters[key] ?? [];
    const next = cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val];
    onChange({ ...filters, [key]: next });
  };

  const addLocation = () => {
    const v = locInput.trim();
    if (!v) return;
    const cur = filters.locations ?? [];
    if (!cur.includes(v)) onChange({ ...filters, locations: [...cur, v] });
    setLocInput("");
  };

  const removeLocation = (l: string) =>
    onChange({ ...filters, locations: (filters.locations ?? []).filter((x) => x !== l) });

  const clearAll = () =>
    onChange({ view: filters.view, search: filters.search });

  const industryLabel = targetType === "founder" ? "Industries" : "Sectors of Interest";
  const stageLabel = targetType === "founder" ? "Stage" : "Preferred Stage";

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-5 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">Filters</h2>
        <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
          Clear
        </Button>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">{stageLabel}</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FUNDING_STAGES.map((s) => {
            const active = (filters.stages ?? []).includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleIn("stages", s.value)}
                className={`px-2 py-1 rounded-md border text-xs transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          {industryLabel}
        </Label>
        <div className="mt-2 flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
          {INDUSTRIES.map((i) => {
            const active = (filters.industries ?? []).includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleIn("industries", i)}
                className={`px-2 py-1 rounded-md border text-xs transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {i}
              </button>
            );
          })}
        </div>
      </div>

      {targetType === "founder" ? (
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">MRR</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MRR_BANDS.map((b) => {
              const active = filters.mrrBand === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => onChange({ ...filters, mrrBand: active ? "" : (b as any) })}
                  className={`px-2 py-1 rounded-md border text-xs transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {b === "0" ? "Pre-revenue" : `$${b}`}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Check Size</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CHECK_BANDS.map((b) => {
              const active = filters.checkBand === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => onChange({ ...filters, checkBand: active ? "" : (b as any) })}
                  className={`px-2 py-1 rounded-md border text-xs transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  ${b}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Location</Label>
        <div className="mt-2 flex gap-1.5">
          <Input
            value={locInput}
            onChange={(e) => setLocInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLocation()}
            placeholder="City or region"
            className="h-8 text-xs"
          />
          <Button size="sm" variant="secondary" onClick={addLocation} className="h-8">
            Add
          </Button>
        </div>
        {(filters.locations ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {(filters.locations ?? []).map((l) => (
              <Badge key={l} variant="secondary" className="text-[10px] gap-1">
                {l}
                <button onClick={() => removeLocation(l)} aria-label={`Remove ${l}`}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <Label htmlFor="verified" className="text-xs">
          Verified only
        </Label>
        <Switch
          id="verified"
          checked={!!filters.verifiedOnly}
          onCheckedChange={(v) => onChange({ ...filters, verifiedOnly: !!v })}
        />
      </div>
    </aside>
  );
}
