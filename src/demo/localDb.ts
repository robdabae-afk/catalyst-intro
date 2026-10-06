// Local-only backend adapter. Never imports Supabase or uses fetch.
const KEY = 'catalyst-demo-db-v1';
export const DEMO_UID = 'demo-member';
type Row = Record<string, any>;
function load(): Record<string, Row[]> { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; } }
const tables = load();
function persist() { try { localStorage.setItem(KEY, JSON.stringify(tables)); } catch { /* private browsing */ } }
class Query implements PromiseLike<any> {
  private filters: ((r: Row) => boolean)[] = [];
  private action = 'select';
  private payload: Row[] = [];
  private conflict: string[] = [];
  private one = false;
  private maximum = Infinity;
  private sortKey = '';
  private ascending = true;
  private count = false;
  constructor(private table: string) {}
  select(_columns?: string, options?: { count?: string; head?: boolean }) { this.count = !!options?.count; return this; }
  eq(key: string, value: unknown) { this.filters.push(r => r[key] === value); return this; }
  neq(key: string, value: unknown) { this.filters.push(r => r[key] !== value); return this; }
  in(key: string, values: unknown[]) { this.filters.push(r => values.includes(r[key])); return this; }
  order(key: string, options?: { ascending?: boolean }) { this.sortKey = key; this.ascending = options?.ascending !== false; return this; }
  limit(n: number) { this.maximum = n; return this; }
  maybeSingle() { this.one = true; return this; }
  single() { this.one = true; return this; }
  insert(rows: Row | Row[]) { this.action = 'insert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this; }
  upsert(rows: Row | Row[], options?: { onConflict?: string }) { this.action = 'upsert'; this.payload = Array.isArray(rows) ? rows : [rows]; this.conflict = (options?.onConflict ?? 'id').split(','); return this; }
  update(row: Row) { this.action = 'update'; this.payload = [row]; return this; }
  delete() { this.action = 'delete'; return this; }
  then<TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve().then(() => {
      const all = tables[this.table] ??= [];
      const matches = (r: Row) => this.filters.every(f => f(r));
      if (this.action === 'insert' || this.action === 'upsert') for (const row of this.payload) {
        const existing = this.action === 'upsert' ? all.find(r => this.conflict.every(k => r[k] === row[k])) : undefined;
        if (existing) Object.assign(existing, row);
        else all.push({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row });
      }
      if (this.action === 'update') all.filter(matches).forEach(r => Object.assign(r, this.payload[0]));
      if (this.action === 'delete') tables[this.table] = all.filter(r => !matches(r));
      if (this.action !== 'select') persist();
      let data = (tables[this.table] ?? []).filter(matches);
      if (this.sortKey) data = [...data].sort((a, b) => String(a[this.sortKey] ?? '').localeCompare(String(b[this.sortKey] ?? '')) * (this.ascending ? 1 : -1));
      const count = data.length;
      data = data.slice(0, this.maximum);
      return { data: this.one ? data[0] ?? null : data, error: null, count: this.count ? count : null };
    }).then(onfulfilled, onrejected);
  }
}
export const demoDb = { from: (table: string) => new Query(table), rpc: async () => ({ data: false, error: null }) };
