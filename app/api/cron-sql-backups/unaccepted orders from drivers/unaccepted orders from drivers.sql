-- Send reminders for orders that have not been accepted within 5 minutes of creation
-- This file contains the SQL snippet to be used in a Supabase scheduled function

-- Log execution start
INSERT INTO public.cron_job_logs (job_name, executed_at, result)
VALUES ('unaccepted_orders_reminder_sql', NOW(), 'Started execution');

-- Find orders that haven't been accepted within 5 minutes
WITH unaccepted_orders AS (
  SELECT 
    orders.id, 
    orders.driverid, 
    orders.drivername,
    orders.customername,
    orders.destination,
    orders.created_at
  FROM public.orders
  WHERE 
    orders.accepted_time IS NULL
    AND orders.status IN ('confirmed') -- Only check orders that are confirmed but not yet accepted
    AND orders.created_at < (NOW() - INTERVAL '5 minutes')
    AND orders.created_at > (NOW() - INTERVAL '30 minutes') -- Only consider relatively recent orders (last 30 min)
    AND NOT EXISTS (
      -- Exclude orders that already have a reminder notification
      SELECT 1 FROM public.notifications 
      WHERE 
        notifications.order_id = orders.id 
        AND notifications.type = 'order'
        AND notifications.message LIKE '%Please accept the order%'
    )
)
-- Insert notifications for drivers about unaccepted orders
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
  'Order Acceptance Reminder',
  CONCAT('You have a pending order #', id, ' to ', customername, ' at ', destination, '. Please accept the order or contact manager.'),
  'order',
  id,
  false,
  NOW()
FROM unaccepted_orders
WHERE driverid IS NOT NULL;

-- Log how many reminder notifications were sent
WITH sent_count AS (
  SELECT COUNT(*) AS count FROM public.notifications
  WHERE 
    created_at > NOW() - INTERVAL '1 minute'
    AND title = 'Order Acceptance Reminder'
)
INSERT INTO public.cron_job_logs (job_name, executed_at, result)
VALUES (
  'unaccepted_orders_reminder_sql',
  NOW(),
  CONCAT('Sent ', (SELECT count FROM sent_count), ' reminder notifications for unaccepted orders')
);