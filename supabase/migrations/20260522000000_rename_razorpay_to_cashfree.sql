-- Rename Razorpay-specific columns to provider-agnostic Cashfree names
ALTER TABLE public.subscriptions RENAME COLUMN razorpay_order_id   TO cf_order_id;
ALTER TABLE public.subscriptions RENAME COLUMN razorpay_payment_id TO cf_payment_id;
ALTER TABLE public.subscriptions RENAME COLUMN razorpay_signature  TO cf_payment_status;

-- Rebuild index on renamed column
DROP INDEX IF EXISTS idx_subscriptions_razorpay_order;
CREATE INDEX IF NOT EXISTS idx_subscriptions_cf_order ON public.subscriptions (cf_order_id);
