-- Insert 2 sessions: 1 converted, 1 abandoned
INSERT INTO sessions.sessions 
  (session_id, visitor_id, tenant_id, started_at, ended_at, 
   event_count, state, is_completed_purchase, 
   device_type, session_duration_sec, raw_session_payload)
VALUES
-- Converted session (happy path)
(gen_random_uuid(), gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid,
 NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour',
 25, 'CONVERTED', true, 'desktop', 3600,
 '{"session_duration_sec":3600,"page_view_count":5,"cart_item_count":2,"event_count":25,"device_type":1,"is_logged_in":1,"checkout_step_detected":1,"cart_churn_count":0,"is_mobile":0,"rage_click":0,"max_scroll_pct":85.5,"active_time_ms":3000000,"mouse_distance":45000,"time_on_page_sec":720}'::jsonb),

-- Abandoned session (user drops off)
(gen_random_uuid(), gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid,
 NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes',
 8, 'ABANDONED', false, 'mobile', 1800,
 '{"session_duration_sec":1800,"page_view_count":2,"cart_item_count":1,"event_count":8,"device_type":0,"is_logged_in":0,"checkout_step_detected":0,"cart_churn_count":1,"is_mobile":1,"rage_click":3,"max_scroll_pct":30.0,"active_time_ms":800000,"mouse_distance":5000,"time_on_page_sec":300}'::jsonb);
