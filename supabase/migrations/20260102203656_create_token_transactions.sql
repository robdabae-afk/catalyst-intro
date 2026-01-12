-- Create transaction_type enum
CREATE TYPE token_transaction_type AS ENUM ('purchase', 'grant', 'spend', 'refund');

-- Create token_transactions table
CREATE TABLE public.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type token_transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  product_type TEXT, -- 'concierge_match', 'spotlight_boost', 'token_package', 'pro_grant'
  stripe_payment_intent_id TEXT,
  related_id UUID, -- For linking to manual_matches or other records
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX idx_token_transactions_created_at ON public.token_transactions(created_at);
CREATE INDEX idx_token_transactions_type ON public.token_transactions(transaction_type);

-- Enable RLS
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own token transactions"
ON public.token_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own token transactions"
ON public.token_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all token transactions"
ON public.token_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert token transactions"
ON public.token_transactions FOR INSERT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to update token balance when transaction is created
CREATE OR REPLACE FUNCTION public.update_token_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type IN ('purchase', 'grant', 'refund') THEN
    -- Add tokens
    UPDATE public.profiles
    SET tokens = tokens + NEW.amount
    WHERE id = NEW.user_id;
  ELSIF NEW.transaction_type = 'spend' THEN
    -- Deduct tokens
    UPDATE public.profiles
    SET tokens = tokens - ABS(NEW.amount)
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update balance
CREATE TRIGGER update_token_balance_trigger
AFTER INSERT ON public.token_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_token_balance();


