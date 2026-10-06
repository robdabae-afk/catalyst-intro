// Demo mode is decided ONCE at import from the URL path. /demo/* = sample data, zero backend writes.
export const DEMO_STORE_KEY = 'catalyst-demo-store-v1';
const path = typeof window !== 'undefined' ? window.location.pathname : '';
const DEMO = path === '/demo' || path.startsWith('/demo/');
export function isDemoMode(): boolean { return DEMO; }
export function demoPath(p: string): string {
  if (!DEMO) return p;
  if (p.startsWith('/demo')) return p;
  return '/demo' + (p.startsWith('/') ? p : '/' + p);
}
