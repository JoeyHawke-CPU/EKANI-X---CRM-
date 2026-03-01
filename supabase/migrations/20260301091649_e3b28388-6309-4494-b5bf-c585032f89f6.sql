
-- Make sales_exec_id nullable and update FK to SET NULL on delete
ALTER TABLE public.leads ALTER COLUMN sales_exec_id DROP NOT NULL;

ALTER TABLE public.leads DROP CONSTRAINT leads_sales_exec_id_fkey;

ALTER TABLE public.leads ADD CONSTRAINT leads_sales_exec_id_fkey
  FOREIGN KEY (sales_exec_id) REFERENCES public.sales_executives(user_id)
  ON DELETE SET NULL;
