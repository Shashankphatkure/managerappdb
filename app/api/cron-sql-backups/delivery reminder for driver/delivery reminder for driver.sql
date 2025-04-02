-- Send reminders for orders that are delayed beyond 5 minutes of expected completion time
-- This file contains the SQL snippet to be used in a Supabase scheduled function

-- Log execution start
INSERT INTO public.cron_job_logs (job_name, executed_at, result)
VALUES ('completion_reminder_sql', NOW(), 'Started execution');

-- Find orders that are in progress but delayed beyond expected completion time
WITH delayed_completion_orders AS (
  SELECT 
    orders.id, 
    orders.driverid, 
    orders.drivername,
    orders.customername,
    orders.destination,
    orders.accepted_time,
    orders.time, -- estimated delivery time
    orders.status
  FROM public.orders
  WHERE 
    -- Only consider orders that are in progress (not delivered/cancelled)
    orders.status IN ('accepted', 'picked_up', 'on_way')
    -- Order must have been accepted
    AND orders.accepted_time IS NOT NULL
    -- Only include orders where accepted_time + estimated delivery time + 5 min buffer < current time
    AND (
      -- Case 1: Time format like "X min" (e.g., "30 min")
      (orders.time ~ '^\d+\s*min' AND 
       orders.accepted_time < (NOW() - (INTERVAL '1 minute' * (NULLIF(regexp_replace(orders.time, '[^0-9]+', '', 'g'), '')::int + 5)))
      )
      -- Case 2: Time format like "X hour" or "X hours" (e.g., "1 hour", "2 hours")
      OR (orders.time ~ '\d+\s*hour' AND 
         orders.accepted_time < (NOW() - (INTERVAL '1 hour' * (NULLIF(regexp_replace(orders.time, 'hour.*', '', 'g'), '')::int) + INTERVAL '5 minutes'))
      )
      -- Case 3: Time format like "X hour(s) Y min" (e.g., "1 hour 30 min", "2 hours 15 min")
      OR (orders.time ~ '\d+\s*hour.*\d+\s*min' AND
         orders.accepted_time < (
           NOW() - (
             -- Extract hours part (convert to minutes)
             INTERVAL '1 hour' * (NULLIF(regexp_replace(orders.time, 'hour.*', '', 'g'), '')::int) +
             -- Extract minutes part
             INTERVAL '1 minute' * (NULLIF(regexp_replace(regexp_replace(orders.time, '.*hour.*?(\d+)\s*min.*', '\1', 'g'), '[^0-9]+', '', 'g'), '')::int) +
             -- Add buffer
             INTERVAL '5 minutes'
           )
         )
      )
      -- Default case - if time doesn't match any pattern or is null, use 30 min + 5 min buffer
      OR (orders.time IS NULL AND orders.accepted_time < (NOW() - INTERVAL '35 minutes'))
      OR (orders.time !~ '^\d+\s*min' AND orders.time !~ '\d+\s*hour' AND orders.accepted_time < (NOW() - INTERVAL '35 minutes'))
    )
    -- Only consider orders from last 4 hours to avoid processing very old orders
    AND orders.accepted_time > (NOW() - INTERVAL '4 hours')
    -- Exclude orders that already have a completion reminder notification in the last 15 minutes
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE 
        notifications.order_id = orders.id 
        AND notifications.type = 'order'
        AND notifications.message LIKE '%Please complete the delivery%'
        AND notifications.created_at > (NOW() - INTERVAL '15 minutes')
    )
)
-- Insert notifications for drivers about delayed completion
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
  'Delivery Completion Reminder',
  CONCAT('Order #', id, ' to ', customername, ' at ', destination, ' is delayed. Please complete the delivery or update the status.'),
  'order',
  id,
  false,
  NOW()
FROM delayed_completion_orders
WHERE driverid IS NOT NULL;

-- Log how many completion reminder notifications were sent
WITH sent_count AS (
  SELECT COUNT(*) AS count FROM public.notifications
  WHERE 
    created_at > NOW() - INTERVAL '1 minute'
    AND title = 'Delivery Completion Reminder'
)
INSERT INTO public.cron_job_logs (job_name, executed_at, result)
VALUES (
  'completion_reminder_sql',
  NOW(),
  CONCAT('Sent ', (SELECT count FROM sent_count), ' completion reminder notifications for delayed orders')
);