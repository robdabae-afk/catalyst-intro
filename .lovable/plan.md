
# Plan: Fix Stripe Links Not Working on Mobile

## Problem
Mobile users cannot purchase products on the site because Stripe links use `window.open(url, '_blank')` which gets blocked by mobile browsers and PWA popup blockers.

## Root Cause
Two files still use `window.open()` instead of `window.location.href` for Stripe-related URLs:

1. **`src/pages/Concierge.tsx` (line 190)** - All concierge service purchases (Investor Intros, Pitch Deck, Profile Optimization, Spotlights, etc.)
2. **`src/components/BankingSettings.tsx` (line 86)** - Stripe Connect "Manage Account" button

## Solution
Change `window.open(url, '_blank')` to `window.location.href = url` in both locations.

---

## File 1: `src/pages/Concierge.tsx`

### Current Code (Line 187-192):
```typescript
{selectedBudget?.action === 'stripe' ? (
  <Button
    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold"
    onClick={() => window.open(selectedBudget.stripeLink, '_blank')}
  >
    Purchase Now
  </Button>
```

### Fixed Code:
```typescript
{selectedBudget?.action === 'stripe' ? (
  <Button
    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold"
    onClick={() => {
      if (selectedBudget.stripeLink) {
        window.location.href = selectedBudget.stripeLink;
      }
    }}
  >
    Purchase Now
  </Button>
```

---

## File 2: `src/components/BankingSettings.tsx`

### Current Code (Line 85-87):
```typescript
if (data?.url) {
  window.open(data.url, '_blank');
}
```

### Fixed Code:
```typescript
if (data?.url) {
  window.location.href = data.url;
}
```

---

## Summary of Changes

| File | Line | Before | After |
|------|------|--------|-------|
| `src/pages/Concierge.tsx` | 190 | `window.open(selectedBudget.stripeLink, '_blank')` | `window.location.href = selectedBudget.stripeLink` |
| `src/components/BankingSettings.tsx` | 86 | `window.open(data.url, '_blank')` | `window.location.href = data.url` |

---

## Why This Fixes The Issue

Mobile browsers and PWAs block `window.open()` calls that aren't direct results of user clicks (or perceive them as popups). Using `window.location.href` navigates the current tab instead, which:
- Works reliably on all mobile browsers
- Works in PWA contexts
- Avoids popup blocker issues
- Maintains the user's session state

---

## Testing After Implementation

1. Open the app on a mobile device or in mobile emulation mode
2. Navigate to `/concierge` and attempt to purchase any service with a Stripe link
3. Verify the Stripe checkout page loads successfully
4. Navigate to Settings > Banking and click "Manage Account" (if connected)
5. Verify the Stripe dashboard opens correctly
