

# Plan: Create concierge_inquiries Table

## Problem
The `concierge_inquiries` table is referenced in code but doesn't exist in the database, causing:
1. **Network 404 errors** - POST requests to `concierge_inquiries` fail with "Could not find the table"
2. **TypeScript build errors** - The Supabase types don't include this table, breaking `AdminConciergePanel.tsx` and `Concierge.tsx`
3. **White screen** - Build fails, preventing the app from loading

## Solution
Run a database migration to create the `concierge_inquiries` table with proper RLS policies.

---

## Migration SQL

```sql
-- Create the concierge_inquiries table
CREATE TABLE IF NOT EXISTS public.concierge_inquiries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    service_name text NOT NULL,
    product_name text NOT NULL,
    budget numeric NOT NULL,
    status text DEFAULT 'pending'
);

-- Enable Row Level Security
ALTER TABLE public.concierge_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit inquiries (public form)
CREATE POLICY "Anyone can submit inquiries"
    ON public.concierge_inquiries
    FOR INSERT
    WITH CHECK (true);

-- Only admins can view inquiries
CREATE POLICY "Admins can view inquiries"
    ON public.concierge_inquiries
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Only admins can update inquiry status
CREATE POLICY "Admins can update inquiries"
    ON public.concierge_inquiries
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );
```

---

## What This Fixes

| Issue | Resolution |
|-------|------------|
| Network 404 errors | Table will exist, POST/GET requests will work |
| TypeScript errors | Types will regenerate automatically after migration |
| White screen | Build will succeed once types are updated |
| Admin panel empty | Admins can view and manage inquiries |

---

## Security Notes

- **Public INSERT**: Anyone can submit inquiry forms (no auth required)
- **Admin-only SELECT/UPDATE**: Only users with `admin` role can view or update inquiries
- Uses existing `user_roles` table for authorization (follows your security pattern)

