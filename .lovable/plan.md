

# Plan: Fix Daily Swipe Limits & Add Reset Swipe History Option

## Problem Summary
1. **Daily swipe limits not enforced** - The `useDailySwipes` hook exists but is never used
2. **Wrong limit values** - Constants show 5/10 but you want 3/5
3. **Missing Reset Swipe History** - The "Caught Up" state needs the database-level reset option

---

## Part 1: Update Swipe Limit Constants

### File: `src/lib/membership-constants.ts`

Update the values to match your requirements:

| User Type | Current Basic | New Basic | Current Pro | New Pro |
|-----------|---------------|-----------|-------------|---------|
| Investor  | 5             | **3**     | 10          | **5**   |
| Founder   | 3             | 3 (same)  | 10          | **5**   |

```typescript
export const BASIC_INVESTOR_DAILY_SWIPES = 3;  // was 5
export const PRO_INVESTOR_DAILY_SWIPES = 5;    // was 10
export const BASIC_FOUNDER_DAILY_SWIPES = 3;   // unchanged
export const PRO_FOUNDER_DAILY_SWIPES = 5;     // was 10
```

---

## Part 2: Integrate Daily Swipe Limits in Dashboard.tsx

### Changes:

1. **Import the hook:**
   ```typescript
   import { useDailySwipes } from '@/hooks/useDailySwipes';
   ```

2. **Initialize the hook:**
   ```typescript
   const {
     canSwipe,
     remainingSwipes,
     shouldShowUpgradePrompt,
     incrementSwipe,
     dailyLimit,
     swipesToday
   } = useDailySwipes(currentUser?.id, isPro, currentUser?.user_type);
   ```

3. **Block swipes when limit reached in `handleSwipe`:**
   ```typescript
   const handleSwipe = async (direction) => {
     if (!currentItem) return;
     if (swipeCooldown) return;
     
     // NEW: Check daily limit
     if (!canSwipe) {
       setShowUpgradePrompt(true);  // Trigger SwipeLimitReachedFlow
       return;
     }
     
     // ... existing swipe logic ...
     
     // NEW: Increment counter after successful swipe
     incrementSwipe();
     advanceQueue();
   };
   ```

4. **Show SwipeLimitReachedFlow when limit hit:**
   ```typescript
   {shouldShowUpgradePrompt && (
     <SwipeLimitReachedFlow
       adProfile={null}
       userId={currentUser?.id}
       userType={currentUser?.user_type}
       onClose={() => setShowUpgradePrompt(false)}
     />
   )}
   ```

5. **Display remaining swipes in UI** (optional but recommended):
   - Add a badge/counter showing "{remainingSwipes} swipes left today"

---

## Part 3: Integrate Daily Swipe Limits in DesktopLayout.tsx

Apply the same changes as Dashboard.tsx:

1. Import `useDailySwipes` hook
2. Initialize with user data
3. Add `canSwipe` check in `handleSwipe`
4. Call `incrementSwipe()` after successful swipes
5. Show `SwipeLimitReachedFlow` when limit reached

---

## Part 4: Add "Reset Swipe History" to CaughtUpState

### File: `src/components/CaughtUpState.tsx`

Add a new prop and button for resetting swipe history (the database-level reset):

```typescript
interface CaughtUpStateProps {
  // ... existing props ...
  onResetHistory?: () => void;  // NEW: database-level reset
}

// In the Actions section, add a new button:
{onResetHistory && (
  <Button 
    onClick={onResetHistory} 
    variant="secondary" 
    className="w-full"
  >
    <History className="w-4 h-4 mr-2" />
    Reset Swipe History
  </Button>
)}
```

### Update Dashboard.tsx and DesktopLayout.tsx

Pass the `resetSwipeHistory` function from `useSwipeHistory` hook:

```typescript
const { resetSwipeHistory } = useSwipeHistory(currentUser?.id);

<CaughtUpState
  // ... existing props ...
  onResetHistory={async () => {
    await resetSwipeHistory();
    // Refetch profiles after reset
    refetchHistory();
  }}
/>
```

---

## Part 5: Add Visual Feedback for Limits

### Remaining Swipes Counter

Add a small indicator near the swipe buttons showing remaining swipes:

```typescript
<div className="text-xs text-muted-foreground text-center mb-2">
  {remainingSwipes} swipe{remainingSwipes !== 1 ? 's' : ''} remaining today
</div>
```

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/lib/membership-constants.ts` | Update limit values (3/5) |
| `src/pages/Dashboard.tsx` | Import + integrate `useDailySwipes`, block swipes, show limit UI |
| `src/components/desktop/DesktopLayout.tsx` | Same as Dashboard.tsx |
| `src/components/CaughtUpState.tsx` | Add `onResetHistory` prop and button |

---

## Testing Checklist

After implementation:
- [ ] Non-pro founder can only swipe 3 times, then sees limit modal
- [ ] Pro founder can swipe 5 times, then sees limit modal
- [ ] Non-pro investor can swipe 3 times, then sees limit modal  
- [ ] Pro investor can swipe 5 times, then sees limit modal
- [ ] Limit resets at midnight (check database query uses start of day)
- [ ] "Reset Swipe History" button appears in Caught Up state
- [ ] Clicking "Reset Swipe History" makes previously swiped profiles reappear
- [ ] "Expand Filters" navigates to filter preferences page

