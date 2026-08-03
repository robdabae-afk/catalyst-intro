import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Database, Download, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";

// Minimum underlying-count per row before it is considered safe for export.
// Implements the plan's ~10-user minimum-aggregation rule.
const ANON_THRESHOLD = 10;

interface ViewDef {
  key: string;
  label: string;
  description: string;
  // Column holding the underlying sample count for anonymization checks.
  // null = single-row summary view (whole-platform aggregate, always safe).
  countColumn: string | null;
}

const VIEWS: ViewDef[] = [
  {
    key: "v_sector_demand",
    label: "Sector Demand",
    description: "Investor like/pass rates by founder sector",
    countColumn: "total_swipes",
  },
  {
    key: "v_pass_reasons",
    label: "Pass Reasons",
    description: "Distribution of one-tap pass reasons",
    countColumn: "count",
  },
  {
    key: "v_deal_terms",
    label: "Deal Terms",
    description: "SAFE cap/discount benchmark (platform-wide aggregate)",
    countColumn: null,
  },
  {
    key: "v_platform_funnel",
    label: "Platform Funnel",
    description: "Swipes → matches → messages → meetings → SAFEs",
    countColumn: null,
  },
  {
    key: "v_investor_responsiveness",
    label: "Investor Responsiveness",
    description: "Computed reply rates per investor — IDENTIFYING, internal only",
    countColumn: "total_threads",
  },
];

type RowsByView = Record<string, Record<string, unknown>[]>;

function toCsv(rows: Record<string, unknown>[], meta: { view: string; excluded: number; includeSmall: boolean }): string {
  const header = [
    `# Catalyst data export — ${meta.view}`,
    `# Exported: ${new Date().toISOString()}`,
    `# Rows: ${rows.length}${meta.excluded > 0 ? ` (${meta.excluded} rows under anonymization threshold ${meta.includeSmall ? "INCLUDED — do not distribute" : "excluded"})` : ""}`,
    `# Minimum-aggregation threshold: ${ANON_THRESHOLD}`,
  ].join("\n");

  if (rows.length === 0) return `${header}\n`;

  const cols = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = [cols.join(","), ...rows.map((r) => cols.map((c) => escape(r[c])).join(","))].join("\n");
  return `${header}\n${body}\n`;
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminDataExplorerPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rowsByView, setRowsByView] = useState<RowsByView>({});
  const [includeSmall, setIncludeSmall] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        VIEWS.map((v) => (supabase as any).from(v.key).select("*"))
      );
      const next: RowsByView = {};
      VIEWS.forEach((v, i) => {
        if (results[i].error) {
          next[v.key] = [];
        } else {
          next[v.key] = results[i].data ?? [];
        }
      });
      setRowsByView(next);
      const failed = VIEWS.filter((_, i) => results[i].error);
      if (failed.length) {
        toast({
          variant: "destructive",
          title: `${failed.length} view(s) failed to load`,
          description: `${failed.map((f) => f.key).join(", ")} — has the migration been run?`,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const isSmallRow = (view: ViewDef, row: Record<string, unknown>): boolean => {
    if (!view.countColumn) return false;
    const n = Number(row[view.countColumn]);
    return Number.isFinite(n) && n < ANON_THRESHOLD;
  };

  const exportView = (view: ViewDef) => {
    const all = rowsByView[view.key] ?? [];
    const small = all.filter((r) => isSmallRow(view, r));
    const rows = includeSmall ? all : all.filter((r) => !isSmallRow(view, r));
    const csv = toCsv(rows, { view: view.key, excluded: small.length, includeSmall });
    downloadCsv(`catalyst-${view.key}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast({
      title: `Exported ${view.label}`,
      description: `${rows.length} rows${small.length && !includeSmall ? ` — ${small.length} small cells excluded` : ""}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Loading data explorer…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            Data Explorer
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Aggregate views only — no raw user rows. CSV exports enforce the {ANON_THRESHOLD}-count
            anonymization floor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={includeSmall ? "destructive" : "outline"}
            size="sm"
            onClick={() => setIncludeSmall((v) => !v)}
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            {includeSmall ? "Small cells INCLUDED" : "Small cells excluded"}
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {includeSmall && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p>
            Exports now include cells under the {ANON_THRESHOLD}-count threshold. These are for
            <strong> internal analysis only</strong> and must never be distributed externally —
            small cells can be re-identifiable.
          </p>
        </div>
      )}

      {VIEWS.map((view) => {
        const rows = rowsByView[view.key] ?? [];
        const smallCount = rows.filter((r) => isSmallRow(view, r)).length;
        const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
        const identifying = view.key === "v_investor_responsiveness";

        return (
          <Card key={view.key} className={identifying ? "border-red-500/30" : undefined}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {view.label}
                  <Badge variant="outline" className="text-xs">{rows.length} rows</Badge>
                  {smallCount > 0 && (
                    <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/40">
                      {smallCount} under threshold
                    </Badge>
                  )}
                  {identifying ? (
                    <Badge variant="outline" className="text-xs text-red-500 border-red-500/40">
                      identifying — never external
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-green-500 border-green-500/40">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      aggregate
                    </Badge>
                  )}
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => exportView(view)} disabled={rows.length === 0}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  CSV
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{view.description}</p>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <div className="h-16 flex items-center justify-center text-sm text-muted-foreground">
                  No rows yet — data accumulating
                </div>
              ) : (
                <div className="overflow-x-auto max-h-72 overflow-y-auto rounded border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {cols.map((c) => (
                          <TableHead key={c} className="text-xs whitespace-nowrap">{c}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.slice(0, 50).map((row, i) => {
                        const small = isSmallRow(view, row);
                        return (
                          <TableRow key={i} className={small ? "opacity-60" : undefined}>
                            {cols.map((c) => (
                              <TableCell key={c} className="text-xs whitespace-nowrap">
                                {c === cols[0] && small && (
                                  <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-500" />
                                )}
                                {formatCell(row[c])}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {rows.length > 50 && (
                    <p className="text-xs text-muted-foreground p-2">
                      Showing first 50 of {rows.length} rows — export CSV for the full set.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "number") {
    return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2);
  }
  const n = Number(v);
  if (typeof v === "string" && v !== "" && Number.isFinite(n) && /^-?\d+(\.\d+)?$/.test(v)) {
    return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2);
  }
  return String(v);
}
