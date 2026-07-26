INSERT INTO public.booking_settings (
  id,
  min_advance_hours,
  buffer_minutes,
  allow_same_day_booking,
  max_days_ahead,
  timezone
)
VALUES (
  1,
  3,
  30,
  true,
  30,
  'Europe/Moscow'
)
ON CONFLICT (id) DO UPDATE
SET
  min_advance_hours = EXCLUDED.min_advance_hours,
  buffer_minutes = EXCLUDED.buffer_minutes,
  allow_same_day_booking = EXCLUDED.allow_same_day_booking,
  max_days_ahead = EXCLUDED.max_days_ahead,
  timezone = EXCLUDED.timezone,
  updated_at = now();

INSERT INTO public.schedule_rules (
  weekday,
  is_enabled,
  start_time,
  end_time
)
VALUES
  (1, false, '10:00', '19:00'),
  (2, false, '10:00', '19:00'),
  (3, false, '10:00', '19:00'),
  (4, false, '10:00', '19:00'),
  (5, false, '10:00', '19:00'),
  (6, false, '10:00', '19:00'),
  (7, false, '10:00', '19:00')
ON CONFLICT (weekday) DO UPDATE
SET
  is_enabled = EXCLUDED.is_enabled,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time;