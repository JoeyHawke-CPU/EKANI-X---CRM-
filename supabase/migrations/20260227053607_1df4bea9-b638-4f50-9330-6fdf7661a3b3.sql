
-- Invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  lead_id bigint REFERENCES public.leads(lead_id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_address text,
  description text NOT NULL DEFAULT '',
  amount_kd numeric NOT NULL DEFAULT 0,
  payment_terms text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Receipt vouchers table
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text NOT NULL UNIQUE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  lead_id bigint REFERENCES public.leads(lead_id) ON DELETE SET NULL,
  client_name text NOT NULL,
  amount_kd numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'Cash',
  cheque_reference text,
  bank_name text,
  description text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Sequence for invoice numbers
CREATE SEQUENCE public.invoice_seq START 1;
CREATE SEQUENCE public.receipt_seq START 1;

-- Function to auto-generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'EK-INV-' || LPAD(nextval('public.invoice_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Function to auto-generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := 'EK-RCV-' || LPAD(nextval('public.receipt_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Triggers
CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();

CREATE TRIGGER trg_receipt_number
  BEFORE INSERT ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.generate_receipt_number();

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- RLS: Reps see own, admins see all
CREATE POLICY invoices_select ON public.invoices FOR SELECT
  USING (created_by = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY invoices_insert ON public.invoices FOR INSERT
  WITH CHECK (created_by = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY invoices_delete ON public.invoices FOR DELETE
  USING (is_admin(auth.uid()));

CREATE POLICY receipts_select ON public.receipts FOR SELECT
  USING (created_by = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY receipts_insert ON public.receipts FOR INSERT
  WITH CHECK (created_by = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY receipts_delete ON public.receipts FOR DELETE
  USING (is_admin(auth.uid()));
