-- Auto-cancel orders that have not been delivered within 2 hours of being accepted
-- This file contains the SQL snippet to be used in a Supabase scheduled function

-- Log execution start
INSERT INTO public.cron_job_logs (job_name, executed_at, result)
VALUES ('auto_cancel_orders_sql', NOW(), 'Started execution');

-- Find orders to cancel using a WITH clause instead of temp table
WITH orders_to_cancel AS (
  SELECT id, driverid, customername
  FROM public.orders
  WHERE 
    accepted_time IS NOT NULL 
    AND status NOT IN ('delivered', 'cancelled')
    AND accepted_time < (NOW() - INTERVAL '2 hours')
)
-- First insert notifications for drivers
INSERT INTO public.notifications (
  recipient_id,
  recipient_type,
  title,
  message,
  type,
  order_id,
  delivery_attempted,
  created_at
)
SELECT 
  driverid,
  'driver',
  'Order Auto-Cancelled',
  CONCAT('Order #', id, ' to ', customername, ' was auto-cancelled due to delay (2+ hours).'),
  'order',
  id,
  false,
  NOW()
FROM orders_to_cancel
WHERE driverid IS NOT NULL;

-- Then update orders using another WITH clause
WITH orders_to_cancel AS (
  SELECT id
  FROM public.orders
  WHERE 
    accepted_time IS NOT NULL 
    AND status NOT IN ('delivered', 'cancelled')
    AND accepted_time < (NOW() - INTERVAL '2 hours')
)
UPDATE public.orders
SET 
  status = 'cancelled',
  updated_at = NOW(),
  completiontime = NOW(),
  managerremark = 'Auto-cancelled after 2 hours without delivery'
WHERE id IN (SELECT id FROM orders_to_cancel);

-- Log the count of orders that were cancelled
WITH cancelled_count AS (
  SELECT COUNT(*) AS count
  FROM public.orders
  WHERE 
    status = 'cancelled' 
    AND managerremark = 'Auto-cancelled after 2 hours without delivery'
    AND updated_at > NOW() - INTERVAL '1 minute'
)
INSERT INTO public.cron_job_logs (job_name, executed_at, result)
VALUES (
  'auto_cancel_orders_sql',
  NOW(),
  CONCAT('Successfully cancelled ', (SELECT count FROM cancelled_count), ' orders')
);