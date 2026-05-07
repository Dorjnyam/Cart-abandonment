# Function And Class Inventory

| Service | File | Function/Class | Responsibility | Called by | Calls | Tested? | Risk |
|---------|------|----------------|----------------|-----------|-------|---------|------|
| Feature service | `feature/feature_svc/config.py:7` | `function _load_local_env` | function | static AST | Path, exists, read_text, setdefault, split, splitlines, startswith, strip | False |  |
| Feature service | `feature/feature_svc/features/__init__.py:63` | `function _coerce_value_for_field` | function | static AST | bool, float, int, isinf, isnan, str | False | ML |
| Feature service | `feature/feature_svc/features/__init__.py:85` | `function _sanitize_payload` | function | static AST | isinf, isinstance, isnan, items | False | ML |
| Feature service | `feature/feature_svc/features/__init__.py:92` | `class FeatureComputer` | class | static AST |  | True |  |
| Feature service | `feature/feature_svc/features/__init__.py:93` | `method FeatureComputer.__init__` | method | static AST | upper | True | ML |
| Feature service | `feature/feature_svc/features/__init__.py:97` | `method FeatureComputer._fetch_graph_features` | method | static AST | close, connect, fetchrow, get, warning | True | ML |
| Feature service | `feature/feature_svc/features/__init__.py:125` | `method FeatureComputer._filter_by_variant` | method | static AST | get | True | ML |
| Feature service | `feature/feature_svc/features/__init__.py:132` | `method FeatureComputer._compute_sync` | method | static AST | append, avg_price_in_session, bool, commitment_depth, compute_mouse_features, dist_product_count, extract_raw, frustration_index | True | ML |
| Feature service | `feature/feature_svc/features/__init__.py:189` | `method FeatureComputer.compute` | method | static AST | FeatureSet, FeatureVector, ValueError, _coerce_value_for_field, _fetch_graph_features, _filter_by_variant, _sanitize_payload, len | True | ML |
| Feature service | `feature/feature_svc/features/commitment.py:4` | `function commitment_depth` | function | static AST | get, int, min | True |  |
| Feature service | `feature/feature_svc/features/frustration.py:6` | `function frustration_index` | function | static AST | float, get, min | True |  |
| Feature service | `feature/feature_svc/features/hedonic.py:13` | `function safe_ratio` | function | static AST |  | False |  |
| Feature service | `feature/feature_svc/features/hedonic.py:19` | `function hedonic_ratio` | function | static AST | Series, dropna, float, get, isin, len, lower, replace | False |  |
| Feature service | `feature/feature_svc/features/mouse.py:7` | `function compute_mouse_features` | function | static AST | acos, append, degrees, float, get, hypot, len, max | False |  |
| Feature service | `feature/feature_svc/features/price.py:10` | `function _cart_value_quartile` | function | static AST | float, get | False |  |
| Feature service | `feature/feature_svc/features/price.py:21` | `function price_hesitation_score` | function | static AST | _cart_value_quartile, get | True |  |
| Feature service | `feature/feature_svc/features/price.py:32` | `function avg_price_in_session` | function | static AST | Series, float, get, mean | True |  |
| Feature service | `feature/feature_svc/features/products.py:6` | `function dist_product_count` | function | static AST | get, len | True |  |
| Feature service | `feature/feature_svc/features/raw_passthrough.py:6` | `function extract_raw` | function | static AST | dict | False |  |
| Feature service | `feature/feature_svc/features/temporal.py:9` | `function _parse_iso_ts` | function | static AST | fromisoformat, replace | False |  |
| Feature service | `feature/feature_svc/features/temporal.py:13` | `function temporal_features` | function | static AST | _parse_iso_ts, cos, get, max, sin, str, total_seconds, weekday | True |  |
| Feature service | `feature/feature_svc/features/temporal.py:32` | `function sequence_behavior_features` | function | static AST | Series, contains, float, get, lower, mean, std, str | False |  |
| Feature service | `feature/feature_svc/features/trust.py:6` | `function mongolian_trust_barrier` | function | static AST | bool, float, get, int, lower, str | True |  |
| Feature service | `feature/feature_svc/kafka_consumer.py:12` | `async function run_consumer` | async function | static AST | AIOKafkaConsumer, decode, loads, on_message, start, stop | False | Kafka path |
| Feature service | `feature/feature_svc/kafka_producer.py:18` | `function _json_default` | function | static AST | TypeError, isinf, isinstance, isnan, type | False | Kafka path, ML |
| Feature service | `feature/feature_svc/kafka_producer.py:25` | `async function get_producer` | async function | static AST | AIOKafkaProducer, dumps, encode, start | False | Kafka path, ML |
| Feature service | `feature/feature_svc/kafka_producer.py:38` | `async function emit_feature_vector` | async function | static AST | RuntimeError, encode, get_producer, items, model_dump, range, send_and_wait, sleep | False | Kafka path, ML |
| Feature service | `feature/feature_svc/kafka_producer.py:66` | `async function close_producer` | async function | static AST | stop | False | Kafka path, ML |
| Feature service | `feature/feature_svc/main.py:76` | `function _required_env_status` | function | static AST | bool, get, upper | False | Kafka path |
| Feature service | `feature/feature_svc/main.py:89` | `async function _tcp_check` | async function | static AST | close, open_connection, wait_closed, wait_for | False | Kafka path |
| Feature service | `feature/feature_svc/main.py:101` | `function _kafka_targets` | function | static AST | append, int, rsplit, split, strip | False | Kafka path |
| Feature service | `feature/feature_svc/main.py:115` | `function _db_target` | function | static AST | get, urlparse | False | Kafka path |
| Feature service | `feature/feature_svc/main.py:126` | `async function lifespan` | async function | static AST | add_done_callback, cancel, close_producer, consume_loop, create_task, suppress | False | Kafka path |
| Feature service | `feature/feature_svc/main.py:140` | `function _log_consumer_task_failure` | function | static AST | cancelled, exception, type | False | Kafka path |
| Feature service | `feature/feature_svc/main.py:154` | `async function consume_loop` | async function | static AST | FeatureComputer, SessionEnriched, commit, compute, dec, emit_feature_vector, error, exception | False | Kafka path |
| Feature service | `feature/feature_svc/main.py:212` | `async function health` | @app.get('/health') | static AST | JSONResponse, _kafka_targets, _tcp_check, bool, done, get | True | API route, Kafka path |
| Feature service | `feature/feature_svc/main.py:234` | `async function ready` | @app.get('/ready') | static AST | JSONResponse, done, get | True | API route, Kafka path |
| Feature service | `feature/feature_svc/main.py:244` | `async function viewer` | @app.get('/viewer') | static AST | FileResponse, Path, get, with_name | False | API route, Kafka path |
| Feature service | `feature/feature_svc/main.py:249` | `async function viewer_status` | @app.get('/viewer/status') | static AST | _db_target, _kafka_targets, _required_env_status, _tcp_check, append, bool, cancelled, done | False | API route, Kafka path |
| Feature service | `feature/feature_svc/models.py:10` | `class SessionEvent` | class | static AST |  | False | DB model contract |
| Feature service | `feature/feature_svc/models.py:30` | `class AggregatedFields` | class | static AST |  | True | DB model contract |
| Feature service | `feature/feature_svc/models.py:97` | `method AggregatedFields.convert_nulls_to_defaults` | method | static AST | dict, float, get, int, isinstance, items, lower, model_validator | True | ML |
| Feature service | `feature/feature_svc/models.py:121` | `class SessionEnriched` | class | static AST |  | True | DB model contract |
| Feature service | `feature/feature_svc/models.py:137` | `class FeatureSet` | class | static AST |  | False | DB model contract |
| Feature service | `feature/feature_svc/models.py:221` | `class FeatureVector` | class | static AST |  | True | DB model contract |
| Feature service | `feature/feature_svc/tests/test_commitment.py:4` | `function test_normal` | function | static AST | commitment_depth | True |  |
| Feature service | `feature/feature_svc/tests/test_commitment.py:10` | `function test_zero_inputs` | function | static AST | commitment_depth | True |  |
| Feature service | `feature/feature_svc/tests/test_commitment.py:14` | `function test_partial_session_case` | function | static AST | commitment_depth | True |  |
| Feature service | `feature/feature_svc/tests/test_frustration.py:4` | `function test_normal` | function | static AST | frustration_index | True |  |
| Feature service | `feature/feature_svc/tests/test_frustration.py:10` | `function test_zero_inputs` | function | static AST | frustration_index | True |  |
| Feature service | `feature/feature_svc/tests/test_frustration.py:14` | `function test_capped_at_one` | function | static AST | frustration_index | True |  |
| Feature service | `feature/feature_svc/tests/test_integration.py:13` | `function test_aggregated_null_values_use_defaults` | function | static AST | AggregatedFields | True | ML |
| Feature service | `feature/feature_svc/tests/test_integration.py:29` | `function test_aggregated_numeric_strings_are_coerced` | function | static AST | AggregatedFields, approx | True | ML |
| Feature service | `feature/feature_svc/tests/test_integration.py:41` | `function test_feature_vector_model_dump_json_is_serializable` | function | static AST | FeatureComputer, SessionEnriched, compute, datetime, dumps, model_dump, run, uuid4 | True | ML |
| Feature service | `feature/feature_svc/tests/test_integration.py:56` | `function test_full_feature_vector` | function | static AST | FeatureComputer, SessionEnriched, approx, compute, cos, datetime, run, sin | True | ML |
| Feature service | `feature/feature_svc/tests/test_temporal.py:6` | `function test_temporal_features_normal` | function | static AST | datetime, temporal_features | True |  |
| Feature service | `feature/feature_svc/tests/test_temporal.py:13` | `function test_temporal_features_zero_input` | function | static AST | datetime, temporal_features | True |  |
| Feature service | `feature/feature_svc/tests/test_temporal.py:19` | `function test_temporal_features_partial_window` | function | static AST | datetime, temporal_features | True |  |
| Main service | `main_service/apps/accounts/admin.py:18` | `class CustomUserAdmin` | class | static AST |  | False |  |
| Main service | `main_service/apps/accounts/admin.py:44` | `method CustomUserAdmin.full_name_display` | method | static AST | display, format_html, strip | False | ML |
| Main service | `main_service/apps/accounts/admin.py:49` | `method CustomUserAdmin.is_active_badge` | method | static AST | display, format_html | False | ML |
| Main service | `main_service/apps/accounts/admin.py:63` | `method CustomUserAdmin.make_active` | method | static AST | action, message_user, update | False | ML |
| Main service | `main_service/apps/accounts/admin.py:68` | `method CustomUserAdmin.make_inactive` | method | static AST | action, message_user, update | False | ML |
| Main service | `main_service/apps/accounts/admin.py:73` | `method CustomUserAdmin.make_staff` | method | static AST | action, message_user, update | False | ML |
| Main service | `main_service/apps/accounts/admin.py:78` | `method CustomUserAdmin.remove_staff` | method | static AST | action, message_user, update | False | ML |
| Main service | `main_service/apps/accounts/apps.py:4` | `class AccountsConfig` | class | static AST |  | False |  |
| Main service | `main_service/apps/accounts/permissions.py:6` | `class HasTenantRole` | class | static AST |  | False |  |
| Main service | `main_service/apps/accounts/permissions.py:14` | `method HasTenantRole.has_permission` | method | static AST | exists, filter, get, getattr, list | False | ML |
| Main service | `main_service/apps/accounts/views.py:26` | `class CustomTokenObtainPairSerializer` | class | static AST |  | False |  |
| Main service | `main_service/apps/accounts/views.py:30` | `method CustomTokenObtainPairSerializer.__init__` | method | static AST | __init__, super | False | ML |
| Main service | `main_service/apps/accounts/views.py:35` | `method CustomTokenObtainPairSerializer.validate` | method | static AST | ValidationError, filter, first, get, get_user_model, pop, select_related, super | False | ML |
| Main service | `main_service/apps/accounts/views.py:79` | `class LoginView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/accounts/views.py:83` | `class LogoutView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/accounts/views.py:86` | `method LogoutView.post` | method | static AST | RefreshToken, Response, blacklist, get | True | ML |
| Main service | `main_service/apps/accounts/views.py:102` | `function _unique_username` | function | static AST | exists, filter, get_user_model | False | ML |
| Main service | `main_service/apps/accounts/views.py:111` | `function _unique_domain` | function | static AST | exists, filter | False | ML |
| Main service | `main_service/apps/accounts/views.py:120` | `class RegisterView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/accounts/views.py:123` | `method RegisterView.post` | method | static AST | Response, _unique_domain, _unique_username, atomic, create, create_user, exists, filter | True | ML |
| Main service | `main_service/apps/accounts/views.py:168` | `class PasswordResetRequestView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/accounts/views.py:171` | `method PasswordResetRequestView.post` | method | static AST | Response, force_bytes, get, get_user_model, getattr, lower, make_token, rstrip | True | ML |
| Main service | `main_service/apps/accounts/views.py:202` | `class PasswordResetConfirmView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/accounts/views.py:205` | `method PasswordResetConfirmView.post` | method | static AST | Response, SetPasswordForm, check_token, decode, get, get_user_model, is_valid, save | True | ML |
| Main service | `main_service/apps/accounts/views.py:236` | `function _profile_data` | function | static AST | exists, filter, first, select_related, strip | False | ML |
| Main service | `main_service/apps/accounts/views.py:261` | `class ProfileView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/accounts/views.py:264` | `method ProfileView.get` | method | static AST | Response, _profile_data | True | ML |
| Main service | `main_service/apps/accounts/views.py:267` | `method ProfileView.patch` | method | static AST | Response, _profile_data, get, len, save, split, strip | True | ML |
| Main service | `main_service/apps/accounts/views.py:281` | `class PasswordChangeView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/accounts/views.py:284` | `method PasswordChangeView.post` | method | static AST | Response, SetPasswordForm, check_password, for_user, get, is_valid, save, str | True | ML |
| Main service | `main_service/apps/analytics/admin.py:15` | `function _risk_badge` | function | static AST | format_html | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:31` | `class PredictionResultInline` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/admin.py:45` | `method PredictionResultInline.shap_preview` | method | static AST | abs, display, float, format_html, isinstance, items, join, sorted | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:62` | `class VisitorOutcomeInline` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/admin.py:74` | `class SessionAdmin` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/admin.py:99` | `method SessionAdmin.session_id_short` | method | static AST | display, format_html, len | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:106` | `method SessionAdmin.visitor_id_short` | method | static AST | display, len | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:110` | `method SessionAdmin.device_badge` | method | static AST | display, format_html, get, lower | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:117` | `method SessionAdmin.has_prediction` | method | static AST | display, hasattr | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:120` | `method SessionAdmin.get_queryset` | method | static AST | get_queryset, prefetch_related, select_related, super | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:127` | `class PredictionResultAdmin` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/admin.py:159` | `method PredictionResultAdmin.session_id_link` | method | static AST | display, format_html, len | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:165` | `method PredictionResultAdmin.model_variant_badge` | method | static AST | display, format_html, get | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:174` | `method PredictionResultAdmin.predicted_class_badge` | method | static AST | display, format_html | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:184` | `method PredictionResultAdmin.confidence_bar` | method | static AST | display, format_html, int, min, round | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:199` | `method PredictionResultAdmin.shap_table` | method | static AST | abs, display, float, format_html, isinstance, items, join, sorted | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:219` | `method PredictionResultAdmin.get_queryset` | method | static AST | get_queryset, select_related, super | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:226` | `class DiagnosisAdmin` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/admin.py:263` | `method DiagnosisAdmin.session_id_short` | method | static AST | display, format_html, len | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:268` | `method DiagnosisAdmin.visitor_id_short` | method | static AST | display, len | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:273` | `method DiagnosisAdmin.tier_badge` | method | static AST | display, format_html, get | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:284` | `method DiagnosisAdmin.risk_display` | method | static AST | _risk_badge, display, float, getattr, max, range | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:289` | `method DiagnosisAdmin.dominant_label` | method | static AST | display, float, format_html, get, getattr, max, range | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:300` | `method DiagnosisAdmin.status_badge` | method | static AST | display, format_html | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:309` | `method DiagnosisAdmin.scores_visual` | method | static AST | display, float, format_html, get, getattr, int, range, round | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:336` | `class RecommendationAdmin` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/admin.py:359` | `method RecommendationAdmin.diagnosis_link` | method | static AST | display, format_html | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:366` | `method RecommendationAdmin.severity_badge` | method | static AST | display, float, format_html | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:382` | `method RecommendationAdmin.status_badge` | method | static AST | display, format_html, get | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:397` | `method RecommendationAdmin.mark_implemented` | method | static AST | action, exclude, mark_implemented, message_user | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:409` | `class ProcessedSessionAdmin` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/admin.py:419` | `method ProcessedSessionAdmin.observer_session_id_short` | method | static AST | display, format_html, len | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:425` | `method ProcessedSessionAdmin.visitor_id_short` | method | static AST | display, len | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:430` | `method ProcessedSessionAdmin.tier_badge` | method | static AST | display, format_html, get | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:443` | `class VisitorOutcomeAdmin` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/admin.py:453` | `method VisitorOutcomeAdmin.session_link` | method | static AST | display, format_html, len | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/admin.py:461` | `method VisitorOutcomeAdmin.outcome_badge` | method | static AST | display, format_html | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/apps.py:4` | `class AnalyticsConfig` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/db_router.py:1` | `class ObserverMigrationGuardRouter` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/db_router.py:2` | `method ObserverMigrationGuardRouter.allow_migrate` | method | static AST |  | False |  |
| Main service | `main_service/apps/analytics/duckdb_client.py:17` | `function writer_connection` | function | static AST | RuntimeError, acquire, close, commit, connect, from_url, lock, release | False |  |
| Main service | `main_service/apps/analytics/duckdb_client.py:44` | `function migrate_existing_schema` | function | static AST | execute | False |  |
| Main service | `main_service/apps/analytics/duckdb_client.py:61` | `function ensure_analytics_schema` | function | static AST | execute, migrate_existing_schema | True |  |
| Main service | `main_service/apps/analytics/duckdb_client.py:104` | `function _run_read_query` | function | static AST | close, connect, execute, fetchall | False |  |
| Main service | `main_service/apps/analytics/duckdb_client.py:113` | `function run_read_query` | function | static AST | result, submit | False |  |
| Main service | `main_service/apps/analytics/duckdb_client.py:119` | `function get_duckdb_daily_trend` | function | static AST | int, run_read_query, str, timedelta, today, warning | False |  |
| Main service | `main_service/apps/analytics/gemini_client.py:17` | `function generate_recommendation` | function | static AST | Client, error, generate_content, get, getattr, str, strip | False | diagnosis/S1-S7, recommendation |
| Main service | `main_service/apps/analytics/gemini_client.py:42` | `function fallback_structured_recommendation` | function | static AST | append, get, len, lower | False | diagnosis/S1-S7, recommendation |
| Main service | `main_service/apps/analytics/gemini_client.py:83` | `function generate_structured_recommendation` | function | static AST | Client, error, fallback_structured_recommendation, generate_content, getattr, isinstance, loads, setdefault | False | diagnosis/S1-S7, recommendation |
| Main service | `main_service/apps/analytics/management/commands/consume_prediction_done.py:17` | `function _handle_sigterm` | function | static AST |  | False | Kafka path, ML |
| Main service | `main_service/apps/analytics/management/commands/consume_prediction_done.py:22` | `function _send_to_dlq` | function | static AST | encode, error, flush, send | False | Kafka path, ML |
| Main service | `main_service/apps/analytics/management/commands/consume_prediction_done.py:33` | `class Command` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/management/commands/consume_prediction_done.py:36` | `method Command.handle` | method | static AST | CommandError, KafkaConsumer, KafkaProducer, SUCCESS, _send_to_dlq, close, commit, decode | False | Kafka path, ML |
| Main service | `main_service/apps/analytics/management/commands/export_training_dataset.py:6` | `class Command` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/management/commands/export_training_dataset.py:9` | `method Command.add_arguments` | method | static AST | add_argument | False |  |
| Main service | `main_service/apps/analytics/management/commands/export_training_dataset.py:18` | `method Command.handle` | method | static AST | CommandError, SUCCESS, append, len, read_sql, to_parquet, write | False |  |
| Main service | `main_service/apps/analytics/migrations/0001_initial.py:8` | `class Migration` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/migrations/0002_session_predictionresult.py:5` | `class Migration` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/migrations/0003_prediction_ablation_fields.py:5` | `class Migration` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/migrations/0004_session_event_fields.py:4` | `class Migration` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/migrations/0005_rename_analytics_p_tenant__3ae95e_idx_analytics_p_tenant__ca658b_idx_and_more.py:6` | `class Migration` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/migrations/0006_diagnosis_vg_service_fields.py:6` | `class Migration` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/migrations/0007_diagnosis_prediction_contract_fields.py:4` | `class Migration` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/minio_client.py:9` | `function _client` | function | static AST | client | True | auth/security |
| Main service | `main_service/apps/analytics/minio_client.py:18` | `function export_bytes` | function | static AST | BytesIO, _client, isoformat, put_object, today | False | auth/security |
| Main service | `main_service/apps/analytics/models.py:8` | `class Session` | class | static AST |  | True | DB model contract |
| Main service | `main_service/apps/analytics/models.py:33` | `method Session.__str__` | method | static AST |  | True | ML |
| Main service | `main_service/apps/analytics/models.py:37` | `class PredictionResult` | class | static AST |  | True | DB model contract |
| Main service | `main_service/apps/analytics/models.py:64` | `method PredictionResult.__str__` | method | static AST |  | True | ML |
| Main service | `main_service/apps/analytics/models.py:68` | `class VisitorOutcome` | class | static AST |  | False | DB model contract |
| Main service | `main_service/apps/analytics/models.py:82` | `class Diagnosis` | class | static AST |  | True | DB model contract |
| Main service | `main_service/apps/analytics/models.py:124` | `method Diagnosis.__str__` | method | static AST |  | True | ML |
| Main service | `main_service/apps/analytics/models.py:128` | `class Recommendation` | class | static AST |  | True | DB model contract |
| Main service | `main_service/apps/analytics/models.py:155` | `method Recommendation.mark_viewed` | method | static AST | save | True | ML |
| Main service | `main_service/apps/analytics/models.py:160` | `method Recommendation.mark_implemented` | method | static AST | now, save | True | ML |
| Main service | `main_service/apps/analytics/models.py:166` | `method Recommendation.__str__` | method | static AST |  | True | ML |
| Main service | `main_service/apps/analytics/models.py:170` | `class ProcessedSession` | class | static AST |  | True | DB model contract |
| Main service | `main_service/apps/analytics/models.py:183` | `method ProcessedSession.__str__` | method | static AST |  | True | ML |
| Main service | `main_service/apps/analytics/observer_db.py:14` | `function fetch_unprocessed_sessions` | function | static AST | cursor, dict, execute, fetchall, set, values_list, warning, zip | False | ML |
| Main service | `main_service/apps/analytics/observer_db.py:51` | `function fetch_session_events` | function | static AST | append, cursor, execute, fetchall, hasattr, isinstance, isoformat, str | False | ML |
| Main service | `main_service/apps/analytics/observer_db.py:82` | `function resolve_tenant_for_session` | function | static AST | filter, first, get, select_related, warning | False | ML |
| Main service | `main_service/apps/analytics/prediction_pipeline.py:18` | `function _parse_datetime` | function | static AST | fromisoformat, now, replace | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/prediction_pipeline.py:27` | `function _resolve_tenant` | function | static AST | DoesNotExist, UUID, get, int, str | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/prediction_pipeline.py:44` | `function _top_features_to_shap` | function | static AST | float, get, items, str | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/prediction_pipeline.py:56` | `function _decimal` | function | static AST | Decimal, float, round, str | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/prediction_pipeline.py:60` | `function _recommendation_text` | function | static AST | dumps, float, generate_structured_recommendation, range, setdefault | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/prediction_pipeline.py:71` | `function handle_prediction_payload` | function | static AST | _decimal, _parse_datetime, _recommendation_text, _resolve_tenant, _top_features_to_shap, atomic, calculate_s1_s7, float | True | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/s1_s7.py:8` | `class ReasonInfo` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/s1_s7.py:45` | `function _num` | function | static AST | float, get, isinstance | False | diagnosis/S1-S7 |
| Main service | `main_service/apps/analytics/s1_s7.py:57` | `function _text` | function | static AST | get, lower, str, strip | False | diagnosis/S1-S7 |
| Main service | `main_service/apps/analytics/s1_s7.py:62` | `function _flag` | function | static AST | bool, get, isinstance, lower, strip | False | diagnosis/S1-S7 |
| Main service | `main_service/apps/analytics/s1_s7.py:69` | `function _scale` | function | static AST | max, min | False | diagnosis/S1-S7 |
| Main service | `main_service/apps/analytics/s1_s7.py:75` | `function _clamp` | function | static AST | max, min, round | False | diagnosis/S1-S7 |
| Main service | `main_service/apps/analytics/s1_s7.py:79` | `function _weighted` | function | static AST | _clamp, sum | False | diagnosis/S1-S7 |
| Main service | `main_service/apps/analytics/s1_s7.py:83` | `function calculate_s1_s7` | function | static AST | _clamp, _flag, _num, _scale, _text, _weighted, any, bool | True | diagnosis/S1-S7 |
| Main service | `main_service/apps/analytics/scoring.py:6` | `function _merge_events` | function | static AST | any, bool, get, isinstance, setdefault, startswith, str, update | False | diagnosis/S1-S7 |
| Main service | `main_service/apps/analytics/scoring.py:28` | `function compute_all_scores` | function | static AST | _merge_events, calculate_s1_s7, lower | False | diagnosis/S1-S7 |
| Main service | `main_service/apps/analytics/serializers.py:6` | `class PredictionNestedSerializer` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/serializers.py:19` | `class SessionSerializer` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/serializers.py:36` | `class SessionDetailSerializer` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/serializers.py:42` | `method SessionDetailSerializer.get_shap_values` | method | static AST | getattr | False | recommendation, ML |
| Main service | `main_service/apps/analytics/serializers.py:49` | `class PredictionResultSerializer` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/serializers.py:69` | `class AblationVariantSerializer` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/serializers.py:77` | `class ExportTriggerSerializer` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/serializers.py:82` | `class StoreSettingsSerializer` | class | static AST |  | False |  |
| Main service | `main_service/apps/analytics/tasks.py:33` | `function _backoff_kwargs` | function | static AST | max | False | recommendation |
| Main service | `main_service/apps/analytics/tasks.py:37` | `function aggregate_session_to_duckdb` | function | static AST | dumps, ensure_analytics_schema, execute, now, writer_connection | True | recommendation |
| Main service | `main_service/apps/analytics/tasks.py:83` | `function consume_ca_diagnosis_queue_once` | function | static AST | atomic, compute_all_scores, error, exists, fetch_session_events, filter, first, from_url | False | diagnosis/S1-S7, recommendation |
| Main service | `main_service/apps/analytics/tasks.py:186` | `function process_prediction` | function | static AST | _backoff_kwargs, aggregate_session_to_duckdb, error, get, handle_prediction_payload, retry, shared_task | True | recommendation, ML |
| Main service | `main_service/apps/analytics/tasks.py:261` | `function export_to_minio` | function | static AST | BytesIO, NamedTemporaryFile, _backoff_kwargs, client, close, connect, exception, execute | False | recommendation |
| Main service | `main_service/apps/analytics/test_s1_s7.py:4` | `function test_scores_are_normalized_and_missing_features_do_not_crash` | function | static AST | calculate_s1_s7 | True | diagnosis/S1-S7 |
| Main service | `main_service/apps/analytics/test_s1_s7.py:11` | `function test_each_score_can_become_dominant` | function | static AST | calculate_s1_s7, items | True | diagnosis/S1-S7 |
| Main service | `main_service/apps/analytics/test_s1_s7.py:25` | `function test_known_synthetic_session_has_price_sensitivity_dominant` | function | static AST | calculate_s1_s7 | True | diagnosis/S1-S7 |
| Main service | `main_service/apps/analytics/tests.py:18` | `function auth_client` | function | static AST | credentials, for_user | True | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/tests.py:23` | `class AnalyticsSmokeTests` | class | static AST |  | True |  |
| Main service | `main_service/apps/analytics/tests.py:24` | `method AnalyticsSmokeTests.setUp` | method | static AST | Decimal, create, create_user, get_user_model | True | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/tests.py:80` | `method AnalyticsSmokeTests.test_recommendation_viewed_transition` | method | static AST | APIClient, assertEqual, auth_client, get, refresh_from_db | True | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/tests.py:91` | `method AnalyticsSmokeTests.test_cross_tenant_isolation` | method | static AST | APIClient, assertEqual, auth_client, get, refresh_from_db | True | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/tests.py:103` | `method AnalyticsSmokeTests.test_processed_session_idempotency_unique` | method | static AST | assertRaises, create | True | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/tests.py:121` | `method AnalyticsSmokeTests.test_ensure_schema_idempotent` | method | static AST | assertEqual, close, connect, ensure_analytics_schema, execute, fetchone | True | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/tests.py:133` | `method AnalyticsSmokeTests.test_duplicate_prediction_not_doubled` | method | static AST | assertEqual, count, filter, patch, process_prediction | True | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/tests.py:158` | `method AnalyticsSmokeTests.test_prediction_payload_with_external_tenant_uuid_creates_diagnosis` | method | static AST | UUID, assertEqual, get, handle_prediction_payload, save | True | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/tests.py:190` | `method AnalyticsSmokeTests.test_dashboard_overview_returns_business_contract` | method | static AST | APIClient, assertEqual, assertIn, auth_client, create, get, len, now | True | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/tests.py:226` | `method AnalyticsSmokeTests.test_dashboard_session_detail_returns_prediction_diagnosis_recommendation` | method | static AST | APIClient, assertEqual, assertIn, auth_client, create, get, now | True | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/tests.py:261` | `method AnalyticsSmokeTests.test_dashboard_recommendation_status_patch` | method | static AST | APIClient, assertEqual, auth_client, patch, refresh_from_db | True | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/tests.py:293` | `method AnalyticsSmokeTests.test_dashboard_integration_uses_real_observer_snippet_path` | method | static AST | APIClient, assertEqual, assertIn, auth_client, dict, get | True | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/analytics/utils.py:6` | `function get_tenant` | function | static AST | PermissionDenied, count, filter, first, get, select_related | False | ML |
| Main service | `main_service/apps/analytics/views.py:27` | `function resolve_tenant_for_user` | function | static AST | filter, get, len, list, select_related | False | ML |
| Main service | `main_service/apps/analytics/views.py:42` | `function _std_paginator` | function | static AST | PageNumberPagination, get, int | False | ML |
| Main service | `main_service/apps/analytics/views.py:52` | `function _risk` | function | static AST |  | False | ML |
| Main service | `main_service/apps/analytics/views.py:64` | `class AnalyticsOverviewView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:67` | `method AnalyticsOverviewView.get` | method | static AST | Avg, Response, aggregate, append, count, enumerate, filter, float | True | ML |
| Main service | `main_service/apps/analytics/views.py:158` | `class AnalyticsScoresView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:161` | `method AnalyticsScoresView.get` | method | static AST | Response, _score, _trend, filter, float, get, getattr, len | True | ML |
| Main service | `main_service/apps/analytics/views.py:201` | `class AnalyticsHistoryView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:204` | `method AnalyticsHistoryView.get` | method | static AST | Greatest, Response, _risk, _std_paginator, annotate, date, filter, float | True | ML |
| Main service | `main_service/apps/analytics/views.py:263` | `function _severity_from_score` | function | static AST |  | False | ML |
| Main service | `main_service/apps/analytics/views.py:273` | `function _status_map` | function | static AST | get | False | ML |
| Main service | `main_service/apps/analytics/views.py:281` | `function _dominant_score_ids` | function | static AST | float, getattr, items, max, range, values | False | diagnosis/S1-S7, ML |
| Main service | `main_service/apps/analytics/views.py:295` | `function _score_dict` | function | static AST | float, getattr, range | False | ML |
| Main service | `main_service/apps/analytics/views.py:299` | `function _reason_label` | function | static AST |  | False | ML |
| Main service | `main_service/apps/analytics/views.py:305` | `function _severity` | function | static AST |  | False | ML |
| Main service | `main_service/apps/analytics/views.py:313` | `function _api_status` | function | static AST | get | False | ML |
| Main service | `main_service/apps/analytics/views.py:323` | `function _model_status` | function | static AST | get | False | ML |
| Main service | `main_service/apps/analytics/views.py:332` | `function _fallback_recommendation_payload` | function | static AST | _reason_label, _score_dict, getattr, max, values | False | recommendation, ML |
| Main service | `main_service/apps/analytics/views.py:359` | `function _recommendation_payload` | function | static AST | _api_status, _fallback_recommendation_payload, _reason_label, get, getattr, isinstance, loads, setdefault | False | recommendation, ML |
| Main service | `main_service/apps/analytics/views.py:401` | `function _prediction_contract` | function | static AST | float, max, round | False | ML |
| Main service | `main_service/apps/analytics/views.py:419` | `function _diagnosis_contract` | function | static AST | _reason_label, _score_dict, _severity, get, max | False | diagnosis/S1-S7, ML |
| Main service | `main_service/apps/analytics/views.py:434` | `function _top_features_from` | function | static AST | abs, float, getattr, isinstance, items, round, sorted | False | ML |
| Main service | `main_service/apps/analytics/views.py:446` | `function _event_timeline` | function | static AST | append, enumerate, fetch_session_events, get, str | False | ML |
| Main service | `main_service/apps/analytics/views.py:458` | `function _dashboard_session_row` | function | static AST | _diagnosis_contract, _prediction_contract, _recommendation_payload, getattr | False | ML |
| Main service | `main_service/apps/analytics/views.py:478` | `function _diagnosis_queryset` | function | static AST | filter, select_related | False | diagnosis/S1-S7, ML |
| Main service | `main_service/apps/analytics/views.py:482` | `function _daily_trend` | function | static AST | append, count, filter, isoformat, localdate, max, range, round | False | ML |
| Main service | `main_service/apps/analytics/views.py:500` | `function _reason_summary` | function | static AST | _diagnosis_queryset, _fallback_recommendation_payload, _score_dict, _severity, append, float, getattr, len | False | ML |
| Main service | `main_service/apps/analytics/views.py:528` | `function _funnel` | function | static AST | count, enumerate, filter, round | False | ML |
| Main service | `main_service/apps/analytics/views.py:553` | `class DashboardOverviewView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:556` | `method DashboardOverviewView.get` | method | static AST | Avg, Response, _daily_trend, _dashboard_session_row, _diagnosis_queryset, _funnel, _reason_summary, _recommendation_payload | True | ML |
| Main service | `main_service/apps/analytics/views.py:621` | `class DashboardTrendsView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:624` | `method DashboardTrendsView.get` | method | static AST | Response, _daily_trend, get, resolve_tenant_for_user | True | ML |
| Main service | `main_service/apps/analytics/views.py:633` | `class DashboardReasonsView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:636` | `method DashboardReasonsView.get` | method | static AST | Response, _reason_summary, resolve_tenant_for_user | True | ML |
| Main service | `main_service/apps/analytics/views.py:648` | `class DashboardSessionsView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:651` | `method DashboardSessionsView.get` | method | static AST | Q, Response, _dashboard_session_row, _diagnosis_queryset, _std_paginator, filter, get, get_paginated_response | True | ML |
| Main service | `main_service/apps/analytics/views.py:685` | `class DashboardSessionDetailView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:688` | `method DashboardSessionDetailView.get` | method | static AST | Response, _dashboard_session_row, _diagnosis_contract, _diagnosis_queryset, _event_timeline, _prediction_contract, _recommendation_payload, _top_features_from | True | ML |
| Main service | `main_service/apps/analytics/views.py:725` | `class DashboardRecommendationsView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:728` | `method DashboardRecommendationsView.get` | method | static AST | Response, _recommendation_payload, filter, len, order_by, resolve_tenant_for_user, select_related, sum | True | ML |
| Main service | `main_service/apps/analytics/views.py:748` | `class DashboardRecommendationStatusView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:751` | `method DashboardRecommendationStatusView.patch` | method | static AST | Response, _model_status, _recommendation_payload, filter, first, get, now, resolve_tenant_for_user | True | ML |
| Main service | `main_service/apps/analytics/views.py:773` | `function _last_observer_events` | function | static AST | cursor, execute, fetchall, hasattr, isoformat, str | False | ML |
| Main service | `main_service/apps/analytics/views.py:798` | `class DashboardIntegrationView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:801` | `method DashboardIntegrationView.get` | method | static AST | Response, _last_observer_events, getenv, resolve_tenant_for_user | True | ML |
| Main service | `main_service/apps/analytics/views.py:828` | `class AnalyticsRecommendationView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:831` | `method AnalyticsRecommendationView.get` | method | static AST | Response, _dominant_score_ids, _severity_from_score, _status_map, append, filter, float, getattr | True | ML |
| Main service | `main_service/apps/analytics/views.py:863` | `class AnalyticsRecommendationImplementView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:866` | `method AnalyticsRecommendationImplementView.patch` | method | static AST | Response, exists, filter, first, mark_implemented, resolve_tenant_for_user, select_related | True | ML |
| Main service | `main_service/apps/analytics/views.py:897` | `function _prediction_block` | function | static AST |  | False | ML |
| Main service | `main_service/apps/analytics/views.py:909` | `function _diagnosis_block` | function | static AST | float, getattr, max, range | False | diagnosis/S1-S7, ML |
| Main service | `main_service/apps/analytics/views.py:923` | `class SessionsListView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:926` | `method SessionsListView.get` | method | static AST | Response, _diagnosis_block, _prediction_block, _std_paginator, filter, get, get_paginated_response, getattr | True | ML |
| Main service | `main_service/apps/analytics/views.py:965` | `class SessionDetailView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:968` | `method SessionDetailView.get` | method | static AST | Response, _diagnosis_block, _prediction_block, filter, first, getattr, resolve_tenant_for_user, select_related | True | ML |
| Main service | `main_service/apps/analytics/views.py:1005` | `class AbandonmentRateView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1008` | `method AbandonmentRateView.get` | method | static AST | Response, count, filter, resolve_tenant_for_user, round | True | ML |
| Main service | `main_service/apps/analytics/views.py:1030` | `class FeatureImportanceView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1033` | `method FeatureImportanceView.get` | method | static AST | Response, abs, append, filter, float, get, int, isinstance | True | ML |
| Main service | `main_service/apps/analytics/views.py:1070` | `class PredictionsListView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1073` | `method PredictionsListView.get` | method | static AST | Response, _std_paginator, filter, get, get_paginated_response, order_by, paginate_queryset, resolve_tenant_for_user | True | ML |
| Main service | `main_service/apps/analytics/views.py:1122` | `class HealthView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1125` | `method HealthView.get` | method | static AST | Response, client, close, connect, cursor, execute, exists, fetchone | True | ML |
| Main service | `main_service/apps/analytics/views.py:1186` | `class AblationSummaryView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1189` | `method AblationSummaryView.get` | method | static AST | Avg, Response, aggregate, append, count, filter, float, get | True | ML |
| Main service | `main_service/apps/analytics/views.py:1237` | `class ExportTriggerView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1240` | `method ExportTriggerView.post` | method | static AST | ExportTriggerSerializer, Response, delay, get, is_valid, resolve_tenant_for_user | True | ML |
| Main service | `main_service/apps/analytics/views.py:1262` | `function _diagnosis_row` | function | static AST | _risk, float, get, getattr, max, range, round | False | diagnosis/S1-S7, ML |
| Main service | `main_service/apps/analytics/views.py:1291` | `class DiagnosisListView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1294` | `method DiagnosisListView.get` | method | static AST | Greatest, Q, Response, _diagnosis_row, _std_paginator, annotate, count, filter | True | ML |
| Main service | `main_service/apps/analytics/views.py:1354` | `class DiagnosisDetailView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1357` | `method DiagnosisDetailView.get` | method | static AST | Greatest, Response, _diagnosis_row, annotate, filter, first, resolve_tenant_for_user, select_related | True | ML |
| Main service | `main_service/apps/analytics/views.py:1385` | `function _owner_email` | function | static AST | filter, first, select_related | False | ML |
| Main service | `main_service/apps/analytics/views.py:1394` | `class TenantListView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1397` | `method TenantListView.get` | method | static AST | Count, Q, Response, _row, _std_paginator, all, annotate, count | True | ML |
| Main service | `main_service/apps/analytics/views.py:1459` | `class TenantDetailView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1462` | `method TenantDetailView.get` | method | static AST | Response, _owner_email, count, filter, first, order_by, round | True | ML |
| Main service | `main_service/apps/analytics/views.py:1505` | `class ApiKeyListCreateView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1508` | `method ApiKeyListCreateView.get` | method | static AST | Response, filter, order_by, resolve_tenant_for_user | True | ML |
| Main service | `main_service/apps/analytics/views.py:1526` | `method ApiKeyListCreateView.post` | method | static AST | Response, _prefix_for_tier, create, generate_raw_key, get, getenv, now, resolve_tenant_for_user | True | ML |
| Main service | `main_service/apps/analytics/views.py:1568` | `class ApiKeyDeleteView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1571` | `method ApiKeyDeleteView.delete` | method | static AST | Response, filter, first, resolve_tenant_for_user, save | False | ML |
| Main service | `main_service/apps/analytics/views.py:1589` | `class StoreSettingsView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1592` | `method StoreSettingsView._serialize` | method | static AST |  | False | ML |
| Main service | `main_service/apps/analytics/views.py:1602` | `method StoreSettingsView.get` | method | static AST | Response, _serialize, resolve_tenant_for_user | True | ML |
| Main service | `main_service/apps/analytics/views.py:1608` | `method StoreSettingsView.patch` | method | static AST | Response, StoreSettingsSerializer, _serialize, append, exists, filter, is_valid, resolve_tenant_for_user | True | ML |
| Main service | `main_service/apps/analytics/views.py:1638` | `class SettingsTeamListView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1641` | `method SettingsTeamListView.get` | method | static AST | Response, filter, order_by, resolve_tenant_for_user, select_related, strip | True | ML |
| Main service | `main_service/apps/analytics/views.py:1664` | `class SettingsTeamInviteView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1667` | `method SettingsTeamInviteView.post` | method | static AST | Response, create, exists, filter, first, get, get_or_create, get_user_model | True | ML |
| Main service | `main_service/apps/analytics/views.py:1711` | `class SettingsTeamDeleteView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/analytics/views.py:1714` | `method SettingsTeamDeleteView.delete` | method | static AST | Response, count, delete, exists, filter, first, resolve_tenant_for_user | False | ML |
| Main service | `main_service/apps/diagnosis/apps.py:4` | `class DiagnosisConfig` | class | static AST |  | False |  |
| Main service | `main_service/apps/diagnosis/feature.py:7` | `function _parse_payload` | function | static AST | isinstance, loads | False | diagnosis/S1-S7 |
| Main service | `main_service/apps/diagnosis/feature.py:22` | `function _safe_float` | function | static AST | float | False | diagnosis/S1-S7 |
| Main service | `main_service/apps/diagnosis/feature.py:29` | `function extract_features_for_session` | function | static AST | _parse_payload, _safe_float, append, cursor, execute, fetchall, get, int | False | diagnosis/S1-S7 |
| Main service | `main_service/apps/diagnosis/gemini.py:6` | `function generate_recommendation_mn` | function | static AST | Client, generate_content, get, getattr, str, strip, upper | True | diagnosis/S1-S7, recommendation |
| Main service | `main_service/apps/diagnosis/observer_views.py:16` | `class TrackEventView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/diagnosis/observer_views.py:30` | `method TrackEventView.post` | method | static AST | Response, cursor, dumps, encode, execute, filter, first, from_url | True | diagnosis/S1-S7, ML |
| Main service | `main_service/apps/diagnosis/scoring.py:6` | `function score_s1_s7` | function | static AST | calculate_s1_s7, lower | False | diagnosis/S1-S7 |
| Main service | `main_service/apps/diagnosis/tasks.py:16` | `function process_session` | function | static AST | create, cursor, execute, exists, extract_features_for_session, fetchone, filter, generate_recommendation_mn | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/diagnosis/tasks.py:103` | `function poll_unprocessed_sessions` | function | static AST | delay, error, fetch_unprocessed_sessions, get, get_or_create, now, resolve_tenant_for_session, save | False | diagnosis/S1-S7, recommendation, ML |
| Main service | `main_service/apps/diagnosis/tests.py:10` | `class GeminiFallbackTests` | class | static AST |  | True |  |
| Main service | `main_service/apps/diagnosis/tests.py:11` | `method GeminiFallbackTests.test_gemini_fallback_when_no_api_key` | method | static AST | Decimal, assertIn, assertTrue, create, generate_recommendation_mn, len | True | diagnosis/S1-S7, recommendation, auth/security, ML |
| Main service | `main_service/apps/tenants/admin.py:8` | `class APIKeyInline` | class | static AST |  | False |  |
| Main service | `main_service/apps/tenants/admin.py:19` | `method APIKeyInline.key_hash_short` | method | static AST | display, format_html | False | ML |
| Main service | `main_service/apps/tenants/admin.py:28` | `class TeamMemberInline` | class | static AST |  | False |  |
| Main service | `main_service/apps/tenants/admin.py:41` | `class TenantAdmin` | class | static AST |  | False |  |
| Main service | `main_service/apps/tenants/admin.py:68` | `method TenantAdmin.tier_badge` | method | static AST | display, format_html, get | False | ML |
| Main service | `main_service/apps/tenants/admin.py:78` | `method TenantAdmin.status_badge` | method | static AST | display, format_html | False | ML |
| Main service | `main_service/apps/tenants/admin.py:89` | `method TenantAdmin.member_count` | method | static AST | count, display | False | ML |
| Main service | `main_service/apps/tenants/admin.py:95` | `method TenantAdmin.activate_tenants` | method | static AST | action, message_user, update | False | ML |
| Main service | `main_service/apps/tenants/admin.py:100` | `method TenantAdmin.deactivate_tenants` | method | static AST | action, message_user, update | False | ML |
| Main service | `main_service/apps/tenants/admin.py:108` | `class APIKeyAdmin` | class | static AST |  | False |  |
| Main service | `main_service/apps/tenants/admin.py:131` | `method APIKeyAdmin.tier_badge` | method | static AST | display, format_html, get | False | ML |
| Main service | `main_service/apps/tenants/admin.py:140` | `method APIKeyAdmin.is_active_badge` | method | static AST | display, format_html | False | ML |
| Main service | `main_service/apps/tenants/admin.py:149` | `method APIKeyAdmin.key_hash_short` | method | static AST | display, format_html | False | ML |
| Main service | `main_service/apps/tenants/admin.py:158` | `method APIKeyAdmin.deactivate_keys` | method | static AST | action, message_user, update | False | ML |
| Main service | `main_service/apps/tenants/admin.py:166` | `class TeamMemberAdmin` | class | static AST |  | False |  |
| Main service | `main_service/apps/tenants/admin.py:189` | `method TeamMemberAdmin.user_email` | method | static AST | display | False | ML |
| Main service | `main_service/apps/tenants/admin.py:193` | `method TeamMemberAdmin.role_badge` | method | static AST | display, format_html, get | False | ML |
| Main service | `main_service/apps/tenants/apps.py:4` | `class TenantsConfig` | class | static AST |  | False |  |
| Main service | `main_service/apps/tenants/management/commands/seed_demo_tenant.py:11` | `class Command` | class | static AST |  | False |  |
| Main service | `main_service/apps/tenants/management/commands/seed_demo_tenant.py:14` | `method Command.handle` | method | static AST | SUCCESS, UUID, _prefix_for_tier, check_password, encode, get_or_create, get_user_model, getenv | False | ML |
| Main service | `main_service/apps/tenants/migrations/0001_initial.py:8` | `class Migration` | class | static AST |  | False |  |
| Main service | `main_service/apps/tenants/migrations/0002_apikey_name_tenant_timezone.py:4` | `class Migration` | class | static AST |  | False |  |
| Main service | `main_service/apps/tenants/migrations/0003_tenant_external_id.py:6` | `function backfill_external_id` | function | static AST | filter, get_model, save, uuid4 | False | ML |
| Main service | `main_service/apps/tenants/migrations/0003_tenant_external_id.py:13` | `class Migration` | class | static AST |  | False |  |
| Main service | `main_service/apps/tenants/models.py:9` | `class Tenant` | class | static AST |  | True | DB model contract |
| Main service | `main_service/apps/tenants/models.py:27` | `method Tenant.__str__` | method | static AST |  | True | auth/security, ML |
| Main service | `main_service/apps/tenants/models.py:31` | `class APIKey` | class | static AST |  | True | DB model contract |
| Main service | `main_service/apps/tenants/models.py:55` | `method APIKey._prefix_for_tier` | method | static AST | Tier | True | auth/security, ML |
| Main service | `main_service/apps/tenants/models.py:64` | `method APIKey.generate_raw_key` | method | static AST | _prefix_for_tier, encode, hexdigest, sha256, token_hex | True | auth/security, ML |
| Main service | `main_service/apps/tenants/models.py:78` | `method APIKey.__str__` | method | static AST |  | True | auth/security, ML |
| Main service | `main_service/apps/tenants/models.py:82` | `class TeamMember` | class | static AST |  | True | DB model contract |
| Main service | `main_service/apps/tenants/models.py:99` | `method TeamMember.__str__` | method | static AST |  | True | auth/security, ML |
| Main service | `main_service/apps/tenants/serializers.py:6` | `class TenantCreateSerializer` | class | static AST |  | False |  |
| Main service | `main_service/apps/tenants/serializers.py:12` | `class APIKeyGenerateSerializer` | class | static AST |  | False |  |
| Main service | `main_service/apps/tenants/serializers.py:19` | `class TeamInviteSerializer` | class | static AST |  | False |  |
| Main service | `main_service/apps/tenants/tests.py:9` | `class APIKeyHashingTests` | class | static AST |  | True |  |
| Main service | `main_service/apps/tenants/tests.py:10` | `method APIKeyHashingTests.test_raw_key_not_persisted_only_hash` | method | static AST | _prefix_for_tier, assertEqual, assertNotEqual, assertTrue, create, generate_raw_key, len, startswith | True | ML |
| Main service | `main_service/apps/tenants/tests.py:30` | `method APIKeyHashingTests.test_generate_api_key_returns_observer_track_script` | method | static AST | APIClient, assertEqual, assertIn, assertTrue, create, create_user, dict, force_authenticate | True | auth/security, ML |
| Main service | `main_service/apps/tenants/views.py:14` | `class AdminTenantCreateView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/tenants/views.py:21` | `method AdminTenantCreateView.post` | method | static AST | Response, TenantCreateSerializer, create, is_valid | True | ML |
| Main service | `main_service/apps/tenants/views.py:55` | `class TenantAPIKeyGenerateView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/tenants/views.py:63` | `method TenantAPIKeyGenerateView._resolve_tenant` | method | static AST | ValueError, count, filter, first, get, select_related | False | ML |
| Main service | `main_service/apps/tenants/views.py:81` | `method TenantAPIKeyGenerateView.post` | method | static AST | APIKeyGenerateSerializer, Response, _prefix_for_tier, _resolve_tenant, create, filter, generate_raw_key, get | True | ML |
| Main service | `main_service/apps/tenants/views.py:126` | `class TeamListView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/tenants/views.py:133` | `method TeamListView.get` | method | static AST | Response, count, filter, first, get, getattr, order_by, select_related | True | ML |
| Main service | `main_service/apps/tenants/views.py:165` | `class TeamInviteView` | class | static AST |  | False | API endpoint contract |
| Main service | `main_service/apps/tenants/views.py:172` | `method TeamInviteView._resolve_owner_tenant` | method | static AST | count, filter, first, get, select_related | False | ML |
| Main service | `main_service/apps/tenants/views.py:185` | `method TeamInviteView.post` | method | static AST | Response, TeamInviteSerializer, _resolve_owner_tenant, create, filter, first, get_or_create, get_user_model | True | ML |
| Main service | `main_service/main_service/exceptions.py:6` | `function custom_exception_handler` | function | static AST | Response, exception_handler, isinstance | False |  |
| Main service | `main_service/main_service/settings.py:119` | `function _postgres_db_config` | function | static AST | getenv, int, strip | False |  |
| Main service | `main_service/main_service/settings.py:134` | `function _database_from_url` | function | static AST | getenv, parse, strip | False |  |
| Main service | `main_service/manage.py:7` | `function main` | function | static AST | ImportError, execute_from_command_line, setdefault | True |  |
| Main service | `main_service/verify_vg_setup.py:10` | `function test_entropy_module` | function | static AST | compute_entropy_and_motifs, print, sum, values | True |  |
| Main service | `main_service/verify_vg_setup.py:30` | `function test_scoring_with_vg` | function | static AST | get, print, print_exc, score_s1_s7 | True |  |
| Main service | `main_service/verify_vg_setup.py:73` | `function test_vg_service_api` | function | static AST | json, post, print | True |  |
| Main service | `main_service/verify_vg_setup.py:110` | `function test_diagnosis_model` | function | static AST | get_fields, print | True | diagnosis/S1-S7, ML |
| Main service | `main_service/verify_vg_setup.py:138` | `function main` | function | static AST | append, len, print, sum, test_diagnosis_model, test_entropy_module, test_scoring_with_vg, test_vg_service_api | True |  |
| Main service | `main_service/vg_service/entropy.py:9` | `function horizontal_visibility_graph` | function | static AST | append, len, min, range | True |  |
| Main service | `main_service/vg_service/entropy.py:42` | `function count_motifs` | function | static AST | len | True |  |
| Main service | `main_service/vg_service/entropy.py:73` | `function compute_entropy` | function | static AST | count_motifs, horizontal_visibility_graph, len, log2, max, min, sum, values | True |  |
| Main service | `main_service/vg_service/entropy.py:103` | `function compute_entropy_and_motifs` | function | static AST | compute_entropy, count_motifs, horizontal_visibility_graph, len | True |  |
| Main service | `main_service/vg_service/server.py:16` | `function compute_entropy_endpoint` | @app.route('/compute-entropy') | static AST | compute_entropy_and_motifs, exception, float, get, get_json, info, isinstance, jsonify | False | API route |
| Main service | `main_service/vg_service/server.py:80` | `function health_check` | @app.route('/health') | static AST | jsonify, route | False | API route |
| Main service | `main_service/vg_service/tests.py:14` | `class TestHVG` | class | static AST |  | True |  |
| Main service | `main_service/vg_service/tests.py:15` | `method TestHVG.test_empty_series` | method | static AST | horizontal_visibility_graph | True |  |
| Main service | `main_service/vg_service/tests.py:20` | `method TestHVG.test_single_point` | method | static AST | horizontal_visibility_graph, len | True |  |
| Main service | `main_service/vg_service/tests.py:25` | `method TestHVG.test_two_points` | method | static AST | horizontal_visibility_graph, len | True |  |
| Main service | `main_service/vg_service/tests.py:32` | `method TestHVG.test_blocked_visibility` | method | static AST | horizontal_visibility_graph | True |  |
| Main service | `main_service/vg_service/tests.py:41` | `class TestMotifs` | class | static AST |  | True |  |
| Main service | `main_service/vg_service/tests.py:42` | `method TestMotifs.test_motif_counting` | method | static AST | count_motifs | True |  |
| Main service | `main_service/vg_service/tests.py:57` | `method TestMotifs.test_empty_graph` | method | static AST | count_motifs | True |  |
| Main service | `main_service/vg_service/tests.py:63` | `class TestEntropy` | class | static AST |  | True |  |
| Main service | `main_service/vg_service/tests.py:64` | `method TestEntropy.test_entropy_bounds` | method | static AST | compute_entropy, list, range | True |  |
| Main service | `main_service/vg_service/tests.py:76` | `method TestEntropy.test_entropy_low_for_ordered` | method | static AST | compute_entropy | True |  |
| Main service | `main_service/vg_service/tests.py:81` | `method TestEntropy.test_entropy_and_motifs_returns_tuple` | method | static AST | compute_entropy_and_motifs, isinstance | True |  |
| Main service | `main_service/vg_service/tests.py:90` | `class TestIntegration` | class | static AST |  | True |  |
| Main service | `main_service/vg_service/tests.py:91` | `method TestIntegration.test_mouse_speed_example` | method | static AST | compute_entropy_and_motifs, isinstance, sum, values | True |  |
| Main service | `main_service/vg_service/tests.py:103` | `method TestIntegration.test_high_entropy_random_like` | method | static AST | compute_entropy, cos, list, range, sin | True |  |
| ML service | `ml/app/config.py:13` | `class Settings` | class | static AST |  | False |  |
| ML service | `ml/app/config.py:30` | `method Settings.pg_dsn_asyncpg` | method | static AST | replace | False |  |
| ML service | `ml/app/consumer.py:33` | `async function start_consumer` | async function | static AST | AIOKafkaConsumer, _consume_loop, create_task, decode, info, loads, start | True | Kafka path, ML |
| ML service | `ml/app/consumer.py:48` | `async function _publish_dlq` | async function | static AST | dumps, encode, error, exception, get_producer, info, send_and_wait | False | Kafka path, ML |
| ML service | `ml/app/consumer.py:64` | `async function _consume_loop` | async function | static AST | FeatureVector, RuntimeError, _publish_dlq, commit, dec, decrement_active_inference, error, exception | False | Kafka path, ML |
| ML service | `ml/app/consumer.py:128` | `async function stop_consumer` | async function | static AST | cancel, stop, wait, warning | False | Kafka path, ML |
| ML service | `ml/app/consumer.py:143` | `function get_consumer_task` | function | static AST |  | False | Kafka path, ML |
| ML service | `ml/app/db.py:15` | `async function init_pool` | async function | static AST | _create_schema, create_pool, info, min, range, sleep, warning | False | ML |
| ML service | `ml/app/db.py:36` | `async function _create_schema` | async function | static AST | RuntimeError, acquire, execute | False | ML |
| ML service | `ml/app/db.py:66` | `async function write_prediction` | async function | static AST | RuntimeError, acquire, dumps, execute | False | ML |
| ML service | `ml/app/db.py:91` | `async function close_pool` | async function | static AST | close | False | ML |
| ML service | `ml/app/lstm_model.py:12` | `class LSTMClassifier` | class | static AST |  | False |  |
| ML service | `ml/app/lstm_model.py:13` | `method LSTMClassifier.__init__` | method | static AST | LSTM, Linear, __init__, super | False | ML |
| ML service | `ml/app/lstm_model.py:22` | `method LSTMClassifier.forward` | method | static AST | head, lstm | False | ML |
| ML service | `ml/app/lstm_model.py:28` | `class LSTMModel` | class | static AST |  | True |  |
| ML service | `ml/app/lstm_model.py:29` | `method LSTMModel.__init__` | method | static AST |  | True | ML |
| ML service | `ml/app/lstm_model.py:34` | `method LSTMModel.load` | method | static AST | LSTMClassifier, Path, eval, info, load, load_state_dict | True | ML |
| ML service | `ml/app/lstm_model.py:43` | `method LSTMModel.unload` | method | static AST |  | True | ML |
| ML service | `ml/app/lstm_model.py:46` | `method LSTMModel.predict_score` | method | static AST | RuntimeError, float, item, len, model, no_grad, sigmoid, tensor | True | ML |
| ML service | `ml/app/main.py:36` | `function _push_event` | function | static AST | record_event | False | Kafka path |
| ML service | `ml/app/main.py:42` | `async function lifespan` | async function | static AST | ThreadPoolExecutor, _push_event, add_done_callback, close_pool, get_consumer_task, get_running_loop, info, init_pool | False | Kafka path |
| ML service | `ml/app/main.py:84` | `function _consumer_task_done_callback` | function | static AST | _push_event, cancelled, exception, getpid, kill | False | Kafka path |
| ML service | `ml/app/main.py:104` | `async function _check_producer` | async function | static AST | get_producer | False | Kafka path |
| ML service | `ml/app/main.py:111` | `function _resolve_model_path` | function | static AST | Path, cwd, is_absolute | False | Kafka path, ML |
| ML service | `ml/app/main.py:118` | `function _read_json` | function | static AST | loads, read_text, str | False | Kafka path |
| ML service | `ml/app/main.py:129` | `function _artifact_info` | function | static AST | exists, fromtimestamp, isoformat, stat, str | False | Kafka path |
| ML service | `ml/app/main.py:144` | `function _load_model_artifacts` | function | static AST | _artifact_info, _read_json, _resolve_model_path, all, get, isinstance, len, str | False | Kafka path, ML |
| ML service | `ml/app/main.py:197` | `function _kafka_targets` | function | static AST | append, int, rsplit, split, strip | False | Kafka path |
| ML service | `ml/app/main.py:211` | `async function _tcp_check` | async function | static AST | close, open_connection, wait_closed, wait_for | False | Kafka path |
| ML service | `ml/app/main.py:221` | `async function _postgres_query_ok` | async function | static AST | acquire, fetchval | False | Kafka path |
| ML service | `ml/app/main.py:232` | `function _pg_details` | function | static AST | lstrip, urlparse | False | Kafka path |
| ML service | `ml/app/main.py:239` | `function _status_entry` | function | static AST |  | False | Kafka path |
| ML service | `ml/app/main.py:248` | `async function health` | @app.get('/health') | static AST | JSONResponse, _check_producer, done, get, get_consumer_task, len | True | API route, Kafka path |
| ML service | `ml/app/main.py:269` | `async function predict_single` | @app.post('/predict') | static AST | FeatureVector, model_dump, post, predict | False | API route, Kafka path, ML |
| ML service | `ml/app/main.py:277` | `async function model_info` | @app.get('/model/info') | static AST | get, len | False | API route, Kafka path, ML |
| ML service | `ml/app/main.py:292` | `async function reload_model` | @app.post('/model/reload') | static AST | HTTPException, labels, post, set, str, to_thread | False | API route, Kafka path, ML |
| ML service | `ml/app/main.py:302` | `async function viewer` | @app.get('/viewer') | static AST | HTMLResponse, dirname, get, join, open, read | False | API route, Kafka path |
| ML service | `ml/app/main.py:319` | `async function internal_status` | @app.get('/internal/status') | static AST | JSONResponse, _kafka_targets, _load_model_artifacts, _pg_details, _postgres_query_ok, _status_entry, _tcp_check, any | False | API route, Kafka path |
| ML service | `ml/app/pipeline.py:15` | `function _maybe_download_models` | function | static AST | Minio, Path, exists, fget_object, info, mkdir, str | False | ML |
| ML service | `ml/app/pipeline.py:35` | `class PredictionPipeline` | class | static AST |  | True |  |
| ML service | `ml/app/pipeline.py:36` | `method PredictionPipeline.__init__` | method | static AST | Lock, Semaphore, XGBoostModel | True | ML |
| ML service | `ml/app/pipeline.py:41` | `method PredictionPipeline.load_models` | method | static AST | _maybe_download_models, info, load | True | ML |
| ML service | `ml/app/pipeline.py:46` | `method PredictionPipeline.unload_models` | method | static AST | unload | True | ML |
| ML service | `ml/app/pipeline.py:50` | `method PredictionPipeline.model_loaded` | method | static AST |  | True | ML |
| ML service | `ml/app/pipeline.py:54` | `method PredictionPipeline.lstm_loaded` | method | static AST |  | True | ML |
| ML service | `ml/app/pipeline.py:57` | `method PredictionPipeline._thread_safe_predict` | method | static AST | predict_with_shap | True | ML |
| ML service | `ml/app/pipeline.py:61` | `method PredictionPipeline._run_xgb` | method | static AST | inc, labels, observe, perf_counter, to_thread | True | ML |
| ML service | `ml/app/pipeline.py:73` | `method PredictionPipeline.predict` | method | static AST | PredictionOut, PredictionResult, TopFeature, _run_xgb, float, get, items, labels | True | ML |
| ML service | `ml/app/producer.py:14` | `async function start_producer` | async function | static AST | AIOKafkaProducer, dumps, encode, info, start | False | Kafka path, ML |
| ML service | `ml/app/producer.py:28` | `function get_producer` | function | static AST |  | False | Kafka path, ML |
| ML service | `ml/app/producer.py:32` | `async function publish_prediction` | async function | static AST | RuntimeError, encode, error, inc, isinstance, isoformat, items, model_dump | True | Kafka path, ML |
| ML service | `ml/app/producer.py:99` | `async function publish_prediction_v2` | async function | static AST | RuntimeError, abs, encode, error, inc, isoformat, model_dump, range | False | Kafka path, ML |
| ML service | `ml/app/producer.py:157` | `async function stop_producer` | async function | static AST | stop | False | Kafka path, ML |
| ML service | `ml/app/runtime_state.py:30` | `function _utc_now` | function | static AST | isoformat, now | False | ML |
| ML service | `ml/app/runtime_state.py:34` | `function _json_safe` | function | static AST | _json_safe, hasattr, isinstance, isoformat, items, str | False | ML |
| ML service | `ml/app/runtime_state.py:48` | `function _feature_sample` | function | static AST | _json_safe, items, list | False | ML |
| ML service | `ml/app/runtime_state.py:55` | `function record_event` | function | static AST | _utc_now, appendleft | False | ML |
| ML service | `ml/app/runtime_state.py:59` | `function record_message_received` | function | static AST | record_event | False | ML |
| ML service | `ml/app/runtime_state.py:64` | `function record_feature_vector` | function | static AST | _feature_sample, _json_safe, _utc_now, dict, getattr, len, record_event, str | False | ML |
| ML service | `ml/app/runtime_state.py:86` | `function increment_active_inference` | function | static AST |  | False | ML |
| ML service | `ml/app/runtime_state.py:90` | `function decrement_active_inference` | function | static AST | max | False | ML |
| ML service | `ml/app/runtime_state.py:94` | `function record_prediction_success` | function | static AST | _json_safe, append, appendleft, dict, float, getattr, list, record_event | False | ML |
| ML service | `ml/app/runtime_state.py:133` | `function record_prediction_failure` | function | static AST | _utc_now, record_event | False | ML |
| ML service | `ml/app/runtime_state.py:147` | `function record_dlq` | function | static AST | record_event | False | ML |
| ML service | `ml/app/runtime_state.py:152` | `function snapshot` | function | static AST | dict, list | False | ML |
| ML service | `ml/app/schemas.py:9` | `class FeatureVector` | class | static AST |  | True |  |
| ML service | `ml/app/schemas.py:22` | `class PredictionOut` | class | static AST |  | True |  |
| ML service | `ml/app/schemas.py:37` | `class PredictedClass` | class | static AST |  | True |  |
| ML service | `ml/app/schemas.py:42` | `class TopFeature` | class | static AST |  | True |  |
| ML service | `ml/app/schemas.py:50` | `class PredictionResult` | class | static AST |  | True |  |
| ML service | `ml/app/schemas.py:75` | `method PredictionResult.timestamp` | method | static AST |  | True | ML |
| ML service | `ml/app/xgboost_model.py:24` | `class XGBoostModel` | class | static AST |  | True |  |
| ML service | `ml/app/xgboost_model.py:25` | `method XGBoostModel.__init__` | method | static AST |  | True | ML |
| ML service | `ml/app/xgboost_model.py:33` | `method XGBoostModel.load` | method | static AST | Path, RuntimeError, TreeExplainer, TypeError, ValueError, float, get, getattr | True | ML |
| ML service | `ml/app/xgboost_model.py:76` | `method XGBoostModel.unload` | method | static AST |  | True | ML |
| ML service | `ml/app/xgboost_model.py:83` | `method XGBoostModel._feature_array` | method | static AST | array, dict, float, get, hash, isinstance, items, len | True | ML |
| ML service | `ml/app/xgboost_model.py:104` | `method XGBoostModel.predict_with_shap` | method | static AST | RuntimeError, _feature_array, abs, dict, float, isinstance, items, len | True | ML |
| ML service | `ml/scripts/generate_synthetic_sessions.py:53` | `function _clip` | function | static AST | maximum, minimum | False |  |
| ML service | `ml/scripts/generate_synthetic_sessions.py:60` | `function _sessions` | function | static AST | DataFrame, _clip, binomial, floor, integers, maximum, normal, poisson | False |  |
| ML service | `ml/scripts/generate_synthetic_sessions.py:107` | `function generate` | function | static AST | _sessions, concat, default_rng, insert, int, len, mkdir, range | True |  |
| ML service | `ml/scripts/generate_synthetic_sessions.py:134` | `function main` | function | static AST | ArgumentParser, Path, add_argument, generate, len, parse_args, print | True |  |
| ML service | `ml/scripts/train.py:35` | `function _metric_dict` | function | static AST | accuracy_score, astype, average_precision_score, f1_score, float, int, precision_score, recall_score | False | ML |
| ML service | `ml/scripts/train.py:50` | `function _tune_threshold` | function | static AST | astype, f1_score, float, linspace | False | ML |
| ML service | `ml/scripts/train.py:61` | `function _feature_columns` | function | static AST |  | False | ML |
| ML service | `ml/scripts/train.py:65` | `function _as_numeric_features` | function | static AST | astype, copy, fillna, to_numeric | False | ML |
| ML service | `ml/scripts/train.py:72` | `function train` | function | static AST | DummyClassifier, LogisticRegression, StandardScaler, SystemExit, XGBClassifier, _as_numeric_features, _feature_columns, _metric_dict | False | ML |
| ML service | `ml/scripts/train.py:184` | `function main` | function | static AST | ArgumentParser, add_argument, dumps, parse_args, print, train | True | ML |
| ML service | `ml/tests/conftest.py:12` | `function make_fv` | function | static AST | FeatureVector, dict, now, update, uuid4 | True | ML |
| ML service | `ml/tests/conftest.py:33` | `function feature_vector` | function | static AST | make_fv | True | ML |
| ML service | `ml/tests/conftest.py:38` | `function mock_xgb_predict` | function | static AST | patch | True | ML |
| ML service | `ml/tests/conftest.py:48` | `function mock_lstm_predict` | function | static AST | patch | True | ML |
| ML service | `ml/tests/conftest.py:58` | `function mock_kafka_producer` | function | static AST | AsyncMock, MagicMock, patch | True | Kafka path, ML |
| ML service | `ml/tests/test_pipeline.py:11` | `function run` | function | static AST | run | True | ML |
| ML service | `ml/tests/test_pipeline.py:15` | `function _armed_pipeline` | function | static AST | PredictionPipeline | True | ML |
| ML service | `ml/tests/test_pipeline.py:26` | `function test_xgboost_only_prediction_contract` | function | static AST | _armed_pipeline, approx, isinstance, make_fv, predict, run | True | ML |
| ML service | `ml/tests/test_pipeline.py:47` | `function test_predicted_class_converted_below_threshold` | function | static AST | _armed_pipeline, make_fv, predict, run | True | ML |
| ML service | `ml/tests/test_pipeline.py:54` | `function test_score_is_clamped_to_valid_probability` | function | static AST | _armed_pipeline, approx, make_fv, predict, run | True | ML |
| ML service | `ml/tests/test_pipeline.py:60` | `function test_feature_order_missing_values_are_safe` | function | static AST | __new__, get | True | ML |
| ML service | `ml/tests/test_producer.py:12` | `function run` | function | static AST | run | True | Kafka path, ML |
| ML service | `ml/tests/test_producer.py:16` | `function _make_legacy` | function | static AST | PredictionOut, now, uuid4 | True | Kafka path, ML |
| ML service | `ml/tests/test_producer.py:30` | `function _make_result` | function | static AST | PredictionResult, TopFeature, now, uuid4 | True | Kafka path, ML |
| ML service | `ml/tests/test_producer.py:53` | `function test_publish_prediction_raises_after_3_failures` | function | static AST | AsyncMock, Exception, MagicMock, _make_result, patch, publish_prediction, raises, run | True | Kafka path, ML |
| ML service | `ml/tests/test_producer.py:64` | `function test_publish_prediction_sends_canonical_payload` | function | static AST | AsyncMock, MagicMock, _make_result, append, approx, dumps, patch, publish_prediction | True | Kafka path, ML |
| ML service | `ml/tests/test_producer.py:92` | `function test_publish_uses_session_id_as_kafka_key` | function | static AST | AsyncMock, MagicMock, _make_legacy, encode, patch, publish_prediction, run, str | True | Kafka path, ML |
| Observer service | `observer_experiment/integration/diagnosis_consumer.py:40` | `function _main_dsn` | function | static AST | getenv, strip | False | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/integration/diagnosis_consumer.py:47` | `class DiagnosisConsumer` | class | static AST |  | False | Kafka/runtime contract |
| Observer service | `observer_experiment/integration/diagnosis_consumer.py:48` | `method DiagnosisConsumer.__init__` | method | static AST | _main_dsn, getenv, strip | False | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/integration/diagnosis_consumer.py:55` | `method DiagnosisConsumer._ensure_pools` | method | static AST | RuntimeError, create_pool | False | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/integration/diagnosis_consumer.py:69` | `method DiagnosisConsumer.close` | method | static AST | close | True | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/integration/diagnosis_consumer.py:77` | `method DiagnosisConsumer._redis_client` | method | static AST | from_url, ping, warning | False | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/integration/diagnosis_consumer.py:90` | `method DiagnosisConsumer.is_processed` | method | static AST | acquire, fetchval | False | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/integration/diagnosis_consumer.py:99` | `method DiagnosisConsumer.mark_processed` | method | static AST | acquire, execute | False | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/integration/diagnosis_consumer.py:115` | `method DiagnosisConsumer._process_session` | method | static AST | _ensure_pools, acquire, debug, execute, fetch_session_events, info, is_processed, len | False | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/integration/diagnosis_consumer.py:158` | `method DiagnosisConsumer._run_redis_mode` | method | static AST | _process_session, aclose, brpop, exception, get, info, loads, warning | False | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/integration/diagnosis_consumer.py:183` | `method DiagnosisConsumer._run_db_mode` | method | static AST | _ensure_pools, _process_session, exception, get, info, is_processed, list_sessions_with_session_end, sleep | False | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/integration/diagnosis_consumer.py:208` | `method DiagnosisConsumer.run` | method | static AST | _ensure_pools, _redis_client, _run_db_mode, _run_redis_mode | True | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/integration/diagnosis_consumer.py:217` | `async function _amain` | async function | static AST | DiagnosisConsumer, basicConfig, close, run | False | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/integration/diagnosis_consumer.py:229` | `function main` | function | static AST | _amain, run | True | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/integration/observer_db.py:15` | `async function fetch_session_events` | async function | static AST | _row_to_dict, acquire, fetch | False |  |
| Observer service | `observer_experiment/integration/observer_db.py:33` | `function _row_to_dict` | function | static AST | dict, get, hasattr, isinstance, isoformat, loads | False |  |
| Observer service | `observer_experiment/integration/observer_db.py:46` | `async function list_sessions_with_session_end` | async function | static AST | acquire, dict, fetch | False |  |
| Observer service | `observer_experiment/observer/api_key_allowlist.py:15` | `function _parsed_allowlist` | function | static AST | frozenset, getenv, lru_cache, split, strip | False | auth/security |
| Observer service | `observer_experiment/observer/api_key_allowlist.py:23` | `function allowlist_enabled` | function | static AST | _parsed_allowlist | False | auth/security |
| Observer service | `observer_experiment/observer/api_key_allowlist.py:27` | `function allowed_keys_count` | function | static AST | _parsed_allowlist, len | False | auth/security |
| Observer service | `observer_experiment/observer/api_key_allowlist.py:32` | `function is_key_in_allowlist` | function | static AST | _parsed_allowlist, strip | False | auth/security |
| Observer service | `observer_experiment/observer/api_key_allowlist.py:40` | `function reload_allowlist_cache` | function | static AST | cache_clear | True | auth/security |
| Observer service | `observer_experiment/observer/api_keys.py:13` | `function validate_key_string` | function | static AST | allowlist_enabled, is_key_in_allowlist, isinstance, strip, tier_from_key_prefix | False | auth/security, ML |
| Observer service | `observer_experiment/observer/api_keys.py:57` | `function normalize_tier` | function | static AST | isinstance, strip, upper | False | auth/security, ML |
| Observer service | `observer_experiment/observer/api_keys.py:70` | `function generate_key` | function | static AST | ValueError, normalize_tier, token_hex | False | auth/security, ML |
| Observer service | `observer_experiment/observer/config.py:14` | `class Settings` | class | static AST |  | False |  |
| Observer service | `observer_experiment/observer/database.py:20` | `function _get_pool_lock` | function | static AST | Lock | False |  |
| Observer service | `observer_experiment/observer/database.py:27` | `async function get_pool` | async function | static AST | _get_pool_lock, create_pool, range, sleep, warning | True |  |
| Observer service | `observer_experiment/observer/database.py:55` | `async function init_db` | async function | static AST | acquire, execute, get_pool, info | True |  |
| Observer service | `observer_experiment/observer/database.py:110` | `async function save_event` | async function | static AST | acquire, dumps, fetchrow, get, get_pool, isoformat, items, now | True |  |
| Observer service | `observer_experiment/observer/database.py:153` | `async function get_events` | async function | static AST | acquire, append, dict, fetch, get, get_pool, isinstance, isoformat | True |  |
| Observer service | `observer_experiment/observer/database.py:188` | `async function get_stats` | async function | static AST | acquire, fetch, fetchval, get_pool, isoformat | False |  |
| Observer service | `observer_experiment/observer/database.py:228` | `async function get_session_detail` | async function | static AST | acquire, append, dict, fetch, get, get_pool, isinstance, isoformat | False |  |
| Observer service | `observer_experiment/observer/database.py:254` | `async function get_field_analysis` | async function | static AST | acquire, fetch, fetchval, float, get_pool, len | False |  |
| Observer service | `observer_experiment/observer/database.py:280` | `async function clear_events` | async function | static AST | acquire, execute, get_pool, int, split | False |  |
| Observer service | `observer_experiment/observer/kafka_producer.py:31` | `function _bootstrap_servers` | function | static AST | strip | False | Kafka path |
| Observer service | `observer_experiment/observer/kafka_producer.py:35` | `async function start_kafka` | async function | static AST | AIOKafkaProducer, _bootstrap_servers, dumps, encode, info, start, warning | False | Kafka path |
| Observer service | `observer_experiment/observer/kafka_producer.py:69` | `async function stop_kafka` | async function | static AST | info, stop, warning | False | Kafka path |
| Observer service | `observer_experiment/observer/kafka_producer.py:83` | `async function publish` | async function | static AST | encode, get, send, warning | True | Kafka path |
| Observer service | `observer_experiment/observer/kafka_producer.py:101` | `function kafka_enabled` | function | static AST |  | True | Kafka path |
| Observer service | `observer_experiment/observer/main.py:79` | `async function lifespan` | async function | static AST | allowed_keys_count, allowlist_enabled, bool, close, close_redis, getenv, info, init_db | False | auth/security |
| Observer service | `observer_experiment/observer/main.py:122` | `async function _global_exc_handler` | @app.exception_handler() | static AST | JSONResponse, error, exception_handler, type | False | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:140` | `class _MaxBodyMiddleware` | class | static AST |  | False |  |
| Observer service | `observer_experiment/observer/main.py:144` | `method _MaxBodyMiddleware.dispatch` | method | static AST | JSONResponse, call_next, get, int | False | auth/security |
| Observer service | `observer_experiment/observer/main.py:164` | `function _require_admin` | function | static AST | HTTPException, compare_digest, get, getenv, strip | False | auth/security |
| Observer service | `observer_experiment/observer/main.py:178` | `async function health` | @app.get('/health') | static AST | JSONResponse, acquire, fetchval, get, get_pool, kafka_enabled, redis_push_enabled, warning | True | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:211` | `async function ready` | @app.get('/ready') | static AST | JSONResponse, acquire, fetchval, get, get_pool, items, kafka_enabled, redis_push_enabled | True | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:238` | `async function _bg_kafka` | async function | static AST | kafka_publish, warning | False | Kafka path, auth/security |
| Observer service | `observer_experiment/observer/main.py:244` | `async function _bg_forward` | async function | static AST | session_forward_event, warning | False | auth/security |
| Observer service | `observer_experiment/observer/main.py:250` | `async function _ingest` | async function | static AST | EventPayload, HTTPException, _bg_forward, _bg_kafka, create_task, errors, extract_api_key, get | False | auth/security |
| Observer service | `observer_experiment/observer/main.py:309` | `async function ingest` | @app.post('/track'); @app.post('/events'); @app.post('/collect') | static AST | _ingest, post | True | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:315` | `async function api_validate_key_get` | @app.get('/api/keys/validate') | static AST | get, validate_key_string | False | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:321` | `async function api_validate_key_post` | @app.post('/api/keys/validate') | static AST | Body, get, isinstance, post, validate_key_string | False | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:331` | `async function api_generate_key` | @app.post('/api/keys/generate') | static AST | Body, HTTPException, allowlist_enabled, generate_key, get, isinstance, post, str | False | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:360` | `async function api_keys_status` | @app.get('/api/keys/status') | static AST | allowed_keys_count, allowlist_enabled, get | False | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:369` | `async function api_field_catalog` | @app.get('/api/field-catalog') | static AST | build_field_catalog, get | False | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:378` | `async function viewer` | @app.get('/viewer') | static AST | HTMLResponse, exists, get, to_thread | False | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:387` | `async function snippet_test` | @app.get('/snippet-test') | static AST | HTMLResponse, dumps, escape, get, quote, startswith, strip | False | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:431` | `async function events` | @app.get('/events') | static AST | Query, get, get_events, len | True | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:441` | `async function stats` | @app.get('/stats') | static AST | get, get_stats | False | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:446` | `async function session_detail` | @app.get('/session/{session_id}') | static AST | fromisoformat, get, get_session_detail, int, len, list, parse_dt, set | False | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:487` | `async function field_analysis` | @app.get('/fields') | static AST | get, get_field_analysis | False | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:492` | `async function visitor_history` | @app.get('/visitor/{visitor_id}') | static AST | acquire, fetch, get, get_pool, isoformat, len, list | False | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:539` | `async function raw_query` | @app.post('/query') | static AST | JSONResponse, _require_admin, acquire, append, dict, execute, fetch, get | False | API route, auth/security |
| Observer service | `observer_experiment/observer/main.py:566` | `async function clear` | @app.delete('/clear') | static AST | _require_admin, clear_events, delete | True | API route, auth/security |
| Observer service | `observer_experiment/observer/middleware/auth.py:23` | `function _header_bearer` | function | static AST | get, lower, startswith, strip | False | auth/security |
| Observer service | `observer_experiment/observer/middleware/auth.py:30` | `function header_api_key_only` | function | static AST | _header_bearer, get, strip | False | auth/security |
| Observer service | `observer_experiment/observer/middleware/auth.py:38` | `function extract_api_key` | function | static AST | get, header_api_key_only, isinstance, strip | False | auth/security |
| Observer service | `observer_experiment/observer/middleware/auth.py:48` | `function resolve_tier_for_key` | function | static AST | is_key_in_allowlist, isinstance, strip, tier_from_key_prefix | False | auth/security |
| Observer service | `observer_experiment/observer/middleware/auth.py:62` | `class APIKeyAuthMiddleware` | class | static AST |  | False |  |
| Observer service | `observer_experiment/observer/middleware/auth.py:69` | `method APIKeyAuthMiddleware.dispatch` | method | static AST | call_next, header_api_key_only, resolve_tier_for_key | False | auth/security |
| Observer service | `observer_experiment/observer/models/event.py:120` | `function tier_from_key_prefix` | function | static AST | isinstance, startswith | True | ML |
| Observer service | `observer_experiment/observer/models/event.py:132` | `function allowed_keys_for_tier` | function | static AST |  | False | ML |
| Observer service | `observer_experiment/observer/models/event.py:140` | `function normalize_incoming_keys` | function | static AST | get, items, startswith | True | ML |
| Observer service | `observer_experiment/observer/models/event.py:159` | `function filter_payload_for_tier` | function | static AST | allowed_keys_for_tier, items, normalize_incoming_keys | True | ML |
| Observer service | `observer_experiment/observer/models/field_catalog.py:366` | `function _tier_min` | function | static AST |  | False | ML |
| Observer service | `observer_experiment/observer/models/field_catalog.py:374` | `function build_field_catalog` | function | static AST | _tier_min, append, get, len, sorted | False | ML |
| Observer service | `observer_experiment/observer/models/field_catalog.py:423` | `function _self_check` | function | static AST | AssertionError, keys, set | False | ML |
| Observer service | `observer_experiment/observer/models/payload.py:38` | `class EventPayload` | class | static AST |  | True |  |
| Observer service | `observer_experiment/observer/models/payload.py:117` | `method EventPayload.normalise_and_filter` | method | static AST | filter_payload_for_tier, get, isinstance, model_validator, normalize_incoming_keys | True | ML |
| Observer service | `observer_experiment/observer/models/payload.py:136` | `method EventPayload.validate_session_id` | method | static AST | ValueError, field_validator, len, match, str, strip | True | ML |
| Observer service | `observer_experiment/observer/models/payload.py:150` | `method EventPayload.coerce_timestamp` | method | static AST | ValueError, field_validator, float, fromisoformat, fromtimestamp, isinstance, replace, strip | True | ML |
| Observer service | `observer_experiment/observer/models/payload.py:173` | `method EventPayload.to_ingest_dict` | method | static AST | isinstance, isoformat, items, model_dump | True | ML |
| Observer service | `observer_experiment/observer/redis_queue.py:26` | `async function get_redis` | async function | static AST | from_url, ping, strip | False | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/observer/redis_queue.py:44` | `async function close_redis` | async function | static AST | aclose, warning | False | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/observer/redis_queue.py:54` | `async function redis_push_enabled` | async function | static AST | get_redis | False | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/observer/redis_queue.py:59` | `async function push_to_redis` | async function | static AST | close_redis, dumps, encode, expire, get, get_redis, lpush | True | Kafka path, diagnosis/S1-S7 |
| Observer service | `observer_experiment/observer/session_service_forwarder.py:34` | `async function start_session_forwarder` | async function | static AST | AsyncClient, info, strip, warning | False | auth/security |
| Observer service | `observer_experiment/observer/session_service_forwarder.py:65` | `async function stop_session_forwarder` | async function | static AST | aclose, warning | False | auth/security |
| Observer service | `observer_experiment/observer/session_service_forwarder.py:77` | `function session_forwarder_enabled` | function | static AST | bool | False | auth/security |
| Observer service | `observer_experiment/observer/session_service_forwarder.py:85` | `async function forward_event` | async function | static AST | post, range, sleep, warning | False | auth/security |
| Observer service | `observer_experiment/tests/conftest.py:23` | `function clear_allowlist_cache` | function | static AST | fixture, reload_allowlist_cache | True | Kafka path, auth/security |
| Observer service | `observer_experiment/tests/conftest.py:32` | `function mock_db` | function | static AST | AsyncMock, MagicMock, fixture, setattr | True | Kafka path, auth/security |
| Observer service | `observer_experiment/tests/conftest.py:45` | `function mock_kafka` | function | static AST | fixture, setattr | True | Kafka path, auth/security |
| Observer service | `observer_experiment/tests/conftest.py:50` | `function mock_redis` | function | static AST | AsyncMock, fixture, setattr | True | Kafka path, auth/security |
| Observer service | `observer_experiment/tests/conftest.py:56` | `function mock_session_forwarder` | function | static AST | fixture, setattr | True | Kafka path, auth/security |
| Observer service | `observer_experiment/tests/conftest.py:62` | `async function client` | async function | static AST | ASGITransport, AsyncClient | True | Kafka path, auth/security |
| Observer service | `observer_experiment/tests/test_ingest.py:19` | `async function test_t3_event_returns_200` | async function | static AST | json, post | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:31` | `async function test_t2_event_returns_200` | async function | static AST | json, post | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:40` | `async function test_t1_event_returns_200` | async function | static AST | json, post | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:49` | `async function test_api_key_via_header` | async function | static AST | json, post | True | Kafka path, auth/security |
| Observer service | `observer_experiment/tests/test_ingest.py:59` | `async function test_collect_alias_works` | async function | static AST | post | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:67` | `async function test_events_alias_works` | async function | static AST | post | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:77` | `async function test_missing_api_key_returns_401` | async function | static AST | post | True | Kafka path, auth/security |
| Observer service | `observer_experiment/tests/test_ingest.py:82` | `async function test_invalid_prefix_returns_401` | async function | static AST | post | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:90` | `async function test_empty_api_key_returns_401` | async function | static AST | post | True | Kafka path, auth/security |
| Observer service | `observer_experiment/tests/test_ingest.py:101` | `async function test_invalid_json_returns_400` | async function | static AST | post | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:110` | `async function test_body_too_large_returns_413` | async function | static AST | dumps, encode, len, post, str | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:124` | `async function test_event_id_is_forwarded_to_save_event` | async function | static AST | get, post, setattr, update | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:153` | `async function test_t3_cannot_send_t1_only_field` | async function | static AST | post, setattr, update | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:174` | `async function test_forbidden_keys_are_stripped` | async function | static AST | post, setattr, update | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:201` | `async function test_kafka_disabled_still_returns_200` | async function | static AST | post, setattr | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:213` | `async function test_health_ok_when_postgres_ok` | async function | static AST | get, json | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:220` | `async function test_health_ok_when_kafka_is_off` | async function | static AST | get, json | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:228` | `async function test_health_503_when_postgres_down` | async function | static AST | AsyncMock, Exception, get, json, setattr | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:236` | `async function test_ready_endpoint_returns_status` | async function | static AST | get, json | True | Kafka path |
| Observer service | `observer_experiment/tests/test_ingest.py:246` | `async function test_get_events_rejects_overlimit` | async function | static AST | AsyncMock, get, setattr | True | Kafka path |
| Observer service | `observer_experiment/tests/test_models.py:21` | `function test_tier_prefix_t3` | function | static AST | tier_from_key_prefix | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:24` | `function test_tier_prefix_t2` | function | static AST | tier_from_key_prefix | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:27` | `function test_tier_prefix_t1` | function | static AST | tier_from_key_prefix | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:30` | `function test_tier_prefix_invalid` | function | static AST | tier_from_key_prefix | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:33` | `function test_tier_prefix_empty` | function | static AST | tier_from_key_prefix | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:36` | `function test_tier_prefix_none` | function | static AST | tier_from_key_prefix | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:42` | `function test_event_id_is_core_key` | function | static AST |  | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:48` | `function test_tenant_id_is_core_key` | function | static AST |  | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:56` | `function test_event_id_survives_t3_filter` | function | static AST | filter_payload_for_tier | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:67` | `function test_tenant_id_survives_t3_filter` | function | static AST | filter_payload_for_tier | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:79` | `function test_t1_field_stripped_in_t3` | function | static AST | filter_payload_for_tier | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:86` | `function test_t1_field_allowed_in_t1` | function | static AST | filter_payload_for_tier | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:92` | `function test_t2_extra_allowed_in_t2` | function | static AST | filter_payload_for_tier | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:99` | `function test_t2_extra_stripped_in_t3` | function | static AST | filter_payload_for_tier | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:105` | `function test_forbidden_keys_stripped_in_all_tiers` | function | static AST | filter_payload_for_tier | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:121` | `function test_alias_likely_logged_in` | function | static AST | get, normalize_incoming_keys | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:127` | `function test_alias_js_error_count` | function | static AST | get, normalize_incoming_keys | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:133` | `function test_ca_user_known_field_mapped` | function | static AST | get, normalize_incoming_keys | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:138` | `function test_ca_user_unknown_field_dropped` | function | static AST | normalize_incoming_keys | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:145` | `function test_basic_payload_creation` | function | static AST | EventPayload | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:160` | `function test_timestamp_coercion_iso_string` | function | static AST | EventPayload, isinstance | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:166` | `function test_timestamp_coercion_epoch_ms` | function | static AST | EventPayload, isinstance | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:171` | `function test_timestamp_coercion_epoch_s` | function | static AST | EventPayload, isinstance | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:176` | `function test_invalid_timestamp_raises` | function | static AST | EventPayload, raises | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:182` | `function test_session_id_too_short_raises` | function | static AST | EventPayload, raises | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:188` | `function test_session_id_8_chars_accepted` | function | static AST | EventPayload | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:193` | `function test_to_ingest_dict_excludes_none` | function | static AST | EventPayload, items, to_ingest_dict | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:206` | `function test_to_ingest_dict_serialises_datetime` | function | static AST | EventPayload, isinstance, to_ingest_dict | True | ML |
| Observer service | `observer_experiment/tests/test_models.py:213` | `function test_tier_field_filtered_payload` | function | static AST | EventPayload, to_ingest_dict | True | ML |
| Session service | `session/session/app/assembler.py:34` | `function _derive_page` | function | static AST | get, isinstance, strip | False | ML |
| Session service | `session/session/app/assembler.py:42` | `function _event_matches` | function | static AST | any, lower | False | ML |
| Session service | `session/session/app/assembler.py:47` | `async function accumulate_event` | async function | static AST | _decode_hash, _derive_page, _event_matches, _safe_float, _safe_int, append, dumps, endswith | True | ML |
| Session service | `session/session/app/assembler.py:156` | `async function pop_expired_sessions` | async function | static AST | append, decode, isinstance, str, time, zrangebyscore, zrem | False | ML |
| Session service | `session/session/app/assembler.py:171` | `async function flush_session` | async function | static AST | _decode_hash, delete, emit_session_enriched, execute, fromisoformat, get, hgetall, hset | True | ML |
| Session service | `session/session/app/consumer.py:35` | `function dedupe_key_from_observer_dict` | function | static AST | get | False | Kafka path |
| Session service | `session/session/app/consumer.py:44` | `async function skip_if_duplicate` | async function | static AST | record_event, set | False | Kafka path |
| Session service | `session/session/app/consumer.py:63` | `function normalize_kafka_value` | function | static AST | debug, get, isinstance, model_validate, observer_message_to_raw_event | True | Kafka path |
| Session service | `session/session/app/consumer.py:75` | `async function process_raw_event` | async function | static AST | accumulate_event, ensure_window_snapshot_tasks, flush_session, get, lower, model_dump, record_event, str | True | Kafka path |
| Session service | `session/session/app/consumer.py:111` | `async function start_consumer` | async function | static AST | AIOKafkaConsumer, commit, decode, dedupe_key_from_observer_dict, error, exception, get, getattr | True | Kafka path |
| Session service | `session/session/app/db.py:46` | `async function _ensure_schema` | async function | static AST | acquire, execute | False |  |
| Session service | `session/session/app/db.py:51` | `async function get_pool` | async function | static AST | _ensure_schema, create_pool | True |  |
| Session service | `session/session/app/db.py:66` | `async function close_pool` | async function | static AST | close | False |  |
| Session service | `session/session/app/db.py:73` | `async function write_session_to_pg` | async function | static AST | dumps, error, execute, fromisoformat, get, get_pool, inc, int | True |  |
| Session service | `session/session/app/emitter.py:30` | `async function get_producer` | async function | static AST | AIOKafkaProducer, dumps, encode, start | False | Kafka path, ML |
| Session service | `session/session/app/emitter.py:45` | `async function close_producer` | async function | static AST | stop | False | Kafka path, ML |
| Session service | `session/session/app/emitter.py:52` | `async function emit_session_enriched` | async function | static AST | AggregatedFields, SessionEnriched, encode, exception, get, get_producer, inc, items | True | Kafka path, ML |
| Session service | `session/session/app/logging_config.py:8` | `class JsonFormatter` | class | static AST |  | False |  |
| Session service | `session/session/app/logging_config.py:13` | `method JsonFormatter.format` | method | static AST | dumps, formatException, getMessage, getattr, hasattr, time | True |  |
| Session service | `session/session/app/logging_config.py:28` | `function configure_logging` | function | static AST | JsonFormatter, StreamHandler, getLogger, setFormatter, setLevel | False |  |
| Session service | `session/session/app/main.py:41` | `function _log_task_result` | function | static AST | cancelled, exception, get_name | False | Kafka path, auth/security |
| Session service | `session/session/app/main.py:49` | `async function _heartbeat_sweeper` | async function | static AST | flush_session, pop_expired_sessions, shield, sleep, suppress | False | Kafka path, auth/security |
| Session service | `session/session/app/main.py:69` | `async function lifespan` | async function | static AST | TaskGroup, _heartbeat_sweeper, aclose, add_done_callback, cancel, close_pool, close_producer, configure_logging | False | Kafka path, auth/security |
| Session service | `session/session/app/main.py:111` | `async function health` | @app.get('/health') | static AST | JSONResponse, _check_kafka, bool, get, ping | True | API route, Kafka path, auth/security |
| Session service | `session/session/app/main.py:136` | `async function ready` | @app.get('/ready') | static AST | JSONResponse, _check_kafka, _check_postgres, bool, get, ping | True | API route, Kafka path, auth/security |
| Session service | `session/session/app/main.py:163` | `async function ingest_raw_event` | @app.post('/ingest/raw-event') | static AST | Body, HTTPException, Header, dedupe_key_from_observer_dict, isinstance, model_dump, observer_message_to_raw_event, post | False | API route, Kafka path, auth/security |
| Session service | `session/session/app/main.py:209` | `async function ingest_flush_session` | @app.post('/ingest/flush-session') | static AST | Body, HTTPException, Header, flush_session, get, hgetall, isinstance, post | False | API route, Kafka path, auth/security |
| Session service | `session/session/app/main.py:245` | `async function viewer` | @app.get('/viewer') | static AST | FileResponse, get | False | API route, Kafka path, auth/security |
| Session service | `session/session/app/main.py:249` | `async function _check_kafka` | async function | static AST | close, int, open_connection, split, str, strip, wait_closed, wait_for | False | Kafka path, auth/security |
| Session service | `session/session/app/main.py:264` | `async function _check_redis` | async function | static AST | aclose, from_url, ping, str | False | Kafka path, auth/security |
| Session service | `session/session/app/main.py:278` | `async function _check_postgres` | async function | static AST | bool, fetchval, get_pool, str | False | Kafka path, auth/security |
| Session service | `session/session/app/main.py:288` | `async function viewer_status` | @app.get('/viewer/status') | static AST | _check_kafka, _check_postgres, _check_redis, get, get_snapshot | False | API route, Kafka path, auth/security |
| Session service | `session/session/app/main.py:312` | `async function viewer_events` | @app.get('/viewer/events') | static AST | get, get_events_since, get_snapshot | False | API route, Kafka path, auth/security |
| Session service | `session/session/app/metrics.py:50` | `function metrics_app` | function | static AST | make_asgi_app | False | Kafka path |
| Session service | `session/session/app/models.py:10` | `class SessionState` | class | static AST |  | True | DB model contract |
| Session service | `session/session/app/models.py:17` | `class RawEventPayload` | class | static AST |  | True | DB model contract |
| Session service | `session/session/app/models.py:82` | `class AggregatedFields` | class | static AST |  | True | DB model contract |
| Session service | `session/session/app/models.py:108` | `class RawEvent` | class | static AST |  | True | DB model contract |
| Session service | `session/session/app/models.py:122` | `class SessionEnriched` | class | static AST |  | True | DB model contract |
| Session service | `session/session/app/monitor.py:12` | `async function monitor_session_enriched` | async function | static AST | AIOKafkaConsumer, decode, get, loads, record_event, start, stop, uuid4 | False | Kafka path |
| Session service | `session/session/app/observer_adapter.py:34` | `function _coerce_uuid` | function | static AST | UUID, debug, isinstance, str, strip, uuid5 | False | Kafka path, ML |
| Session service | `session/session/app/observer_adapter.py:62` | `function resolve_session_id` | function | static AST | _coerce_uuid, str | False | Kafka path, ML |
| Session service | `session/session/app/observer_adapter.py:68` | `function _parse_timestamp` | function | static AST | astimezone, fromisoformat, isinstance, now, replace, str, strip, warning | False | Kafka path, ML |
| Session service | `session/session/app/observer_adapter.py:88` | `function _parse_bot_score` | function | static AST | float | False | Kafka path, ML |
| Session service | `session/session/app/observer_adapter.py:97` | `function _sanitize_observer_payload` | function | static AST | frozenset, isinstance, items, keys, strip | False | Kafka path, ML |
| Session service | `session/session/app/observer_adapter.py:114` | `function observer_message_to_raw_event` | function | static AST | RawEvent, _coerce_uuid, _parse_bot_score, _parse_timestamp, _sanitize_observer_payload, get, isinstance, items | False | Kafka path, ML |
| Session service | `session/session/app/scheduler.py:23` | `function _win_sched_key` | function | static AST |  | False | Kafka path |
| Session service | `session/session/app/scheduler.py:27` | `function _snapshot_done_field` | function | static AST |  | False | Kafka path |
| Session service | `session/session/app/scheduler.py:31` | `function _parse_started_at` | function | static AST | astimezone, fromisoformat, replace | False | Kafka path |
| Session service | `session/session/app/scheduler.py:42` | `function _snapshot_anchor` | function | static AST | info, isoformat, timedelta | False | Kafka path |
| Session service | `session/session/app/scheduler.py:58` | `function _build_enriched_message` | function | static AST | AggregatedFields, SessionEnriched, frozenset, get, items, loads, model_dump, startswith | False | Kafka path |
| Session service | `session/session/app/scheduler.py:88` | `async function ensure_window_snapshot_tasks` | async function | static AST | _decode_hash, _parse_started_at, _snapshot_anchor, _snapshot_done_field, _win_sched_key, append, apply_async, ceil | True | Kafka path |
| Session service | `session/session/app/scheduler.py:139` | `function emit_window_snapshot` | function | static AST | KafkaProducer, _build_enriched_message, _decode_hash, _snapshot_done_field, _win_sched_key, close, delete, dumps | False | Kafka path |
| Session service | `session/session/app/telemetry.py:25` | `function record_event` | function | static AST | append, get, time | False |  |
| Session service | `session/session/app/telemetry.py:39` | `function get_events_since` | function | static AST | int | False |  |
| Session service | `session/session/app/telemetry.py:43` | `function get_snapshot` | function | static AST | copy | False |  |
| Session service | `session/session/app/utils.py:6` | `function _decode_hash` | function | static AST | decode, isinstance, items, str | True |  |
| Session service | `session/session/app/utils.py:15` | `function _safe_int` | function | static AST | int | False |  |
| Session service | `session/session/app/utils.py:22` | `function _safe_float` | function | static AST | float | False |  |
| Session service | `session/session/tests/conftest.py:16` | `async function fake_redis` | async function | static AST | FakeRedis, aclose | True | ML |
| Session service | `session/session/tests/conftest.py:25` | `function make_event` | function | static AST | RawEvent, RawEventPayload, UUID, now, str, uuid4 | True | ML |
| Session service | `session/session/tests/conftest.py:45` | `function sample_event` | function | static AST | make_event | True | ML |
| Session service | `session/session/tests/conftest.py:52` | `function mock_emit` | function | static AST | AsyncMock, setattr | True | ML |
| Session service | `session/session/tests/conftest.py:62` | `function mock_write_pg` | function | static AST | AsyncMock, setattr | True | ML |
| Session service | `session/session/tests/test_assembler.py:28` | `async function test_accumulate_creates_session` | async function | static AST | _decode_hash, accumulate_event, hgetall, int, make_event, str | True | ML |
| Session service | `session/session/tests/test_assembler.py:42` | `async function test_accumulate_updates_event_count` | async function | static AST | _decode_hash, accumulate_event, hgetall, int, make_event | True | ML |
| Session service | `session/session/tests/test_assembler.py:52` | `async function test_accumulate_hincrby_counter_field` | async function | static AST | _decode_hash, accumulate_event, hgetall, int, make_event, str | True | ML |
| Session service | `session/session/tests/test_assembler.py:68` | `async function test_accumulate_cart_add_uses_hincrby` | async function | static AST | _decode_hash, accumulate_event, hgetall, int, make_event | True | ML |
| Session service | `session/session/tests/test_assembler.py:77` | `async function test_accumulate_ttl_refreshed` | async function | static AST | accumulate_event, make_event, ttl | True | ML |
| Session service | `session/session/tests/test_assembler.py:87` | `async function test_accumulate_deadline_zset_updated` | async function | static AST | accumulate_event, make_event, str, zscore | True | ML |
| Session service | `session/session/tests/test_assembler.py:98` | `async function test_flush_db_written_before_kafka` | async function | static AST | accumulate_event, append, flush_session, make_event, setattr, str | True | Kafka path, ML |
| Session service | `session/session/tests/test_assembler.py:118` | `async function test_flush_kafka_fail_db_not_written` | async function | static AST | RuntimeError, accumulate_event, append, flush_session, make_event, raises, setattr, str | True | Kafka path, ML |
| Session service | `session/session/tests/test_assembler.py:143` | `async function test_flush_db_fail_redis_key_not_deleted` | async function | static AST | RuntimeError, accumulate_event, exists, flush_session, make_event, raises, setattr, str | True | ML |
| Session service | `session/session/tests/test_assembler.py:166` | `async function test_flush_lock_prevents_double_kafka_emit` | async function | static AST | accumulate_event, flush_session, gather, make_event, setattr, str | True | Kafka path, ML |
| Session service | `session/session/tests/test_assembler.py:192` | `async function test_flush_redis_key_deleted_after_success` | async function | static AST | AsyncMock, accumulate_event, exists, flush_session, make_event, setattr, str | True | ML |
| Session service | `session/session/tests/test_assembler.py:207` | `async function test_bot_score_above_threshold_skips_accumulate` | async function | static AST | append, make_event, process_raw_event, setattr | True | ML |
| Session service | `session/session/tests/test_assembler.py:223` | `async function test_purchase_event_triggers_flush` | async function | static AST | AsyncMock, append, make_event, process_raw_event, setattr | True | ML |
| Session service | `session/session/tests/test_assembler.py:242` | `async function test_session_end_event_triggers_unload_flush` | async function | static AST | AsyncMock, append, make_event, process_raw_event, setattr | True | ML |
| Session service | `session/session/tests/test_assembler.py:261` | `async function test_payload_end_reason_triggers_flush` | async function | static AST | AsyncMock, append, make_event, process_raw_event, setattr | True | ML |
| Session service | `session/session/tests/test_consumer.py:24` | `function test_normalize_kafka_value_returns_none_for_garbage` | function | static AST | normalize_kafka_value | True | Kafka path |
| Session service | `session/session/tests/test_consumer.py:31` | `function test_normalize_kafka_value_accepts_native_raw_event` | function | static AST | make_event, model_dump, normalize_kafka_value, str | True | Kafka path |
| Session service | `session/session/tests/test_consumer.py:44` | `async function test_poison_pill_commit_called` | async function | static AST | AsyncMock, CancelledError, MagicMock, append, one_then_cancel, patch, start_consumer | True | Kafka path |
| Session service | `session/session/tests/test_consumer.py:80` | `async function test_process_raw_event_failure_does_not_crash_consumer` | async function | static AST | AsyncMock, CancelledError, MagicMock, RuntimeError, append, make_event, model_dump, one_then_cancel | True | Kafka path |
| Session service | `session/session/tests/test_consumer.py:114` | `async function test_redis_error_does_not_crash_consumer` | async function | static AST | AsyncMock, CancelledError, MagicMock, RedisError, assert_called_once, make_event, model_dump, object | True | Kafka path |
| Session service | `session/session/tests/test_consumer.py:150` | `async function test_backpressure_still_processes_message` | async function | static AST | AsyncMock, CancelledError, MagicMock, append, make_event, model_dump, object, one_then_cancel | True | Kafka path |

## Frontend Inventory
| Frontend | File | Component/Function | Responsibility | Data source | Mock? | Risk |
|----------|------|--------------------|----------------|-------------|-------|------|
| Analytics dashboard | `cart_analytic/src/app/admin/page.tsx:49` | `normalizeHealth` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/app/admin/page.tsx:62` | `StatusDot` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/app/admin/page.tsx:72` | `statusLabel` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/app/admin/page.tsx:78` | `PipelineHealthTab` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/app/admin/page.tsx:182` | `ModelMetricsTab` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/app/admin/page.tsx:239` | `ExportHistoryTab` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/app/admin/page.tsx:312` | `AdminContent` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/app/admin/page.tsx:368` | `AdminPage` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/app/analytics/AblationStudyPanel.tsx:27` | `deltaLabel` | static parse |  | True | mock/static data |
| Analytics dashboard | `cart_analytic/src/app/analytics/AblationStudyPanel.tsx:33` | `AblationStudyPanel` | static parse |  | True | mock/static data |
| Analytics dashboard | `cart_analytic/src/app/analytics/error.tsx:6` | `AnalyticsError` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/analytics/loading.tsx:4` | `AnalyticsLoading` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/analytics/page.tsx:26` | `StatSkeleton` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/analytics/page.tsx:36` | `ChartSkeleton` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/analytics/page.tsx:40` | `AnalyticsOverviewTab` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/analytics/page.tsx:201` | `AnalyticsPageContent` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/analytics/page.tsx:275` | `AnalyticsPage` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/dashboard/error.tsx:6` | `DashboardError` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/dashboard/loading.tsx:4` | `DashboardLoading` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/dashboard/page.tsx:41` | `clsx` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/dashboard/page.tsx:45` | `formatNumber` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/dashboard/page.tsx:50` | `formatRelativeTime` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/dashboard/page.tsx:61` | `HeroMetric` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/dashboard/page.tsx:137` | `CompactMetric` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/dashboard/page.tsx:159` | `SectionCard` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/dashboard/page.tsx:188` | `RiskChip` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/dashboard/page.tsx:202` | `ReasonScoreRow` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/dashboard/page.tsx:246` | `DashboardPage` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/dashboard/page.tsx:661` | `RecentSessionsTable` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/diagnosis/[id]/page.tsx:22` | `DiagnosisDetailPage` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/diagnosis/page.tsx:33` | `severityTone` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/diagnosis/page.tsx:39` | `SectionCard` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/diagnosis/page.tsx:70` | `DiagnosisPage` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/diagnostics/page.tsx:3` | `DiagnosticsAliasPage` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/forgot-password/page.tsx:8` | `ForgotPasswordPage` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/installation/page.tsx:25` | `StatusPill` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/installation/page.tsx:41` | `InstallationPage` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/layout.tsx:46` | `RootLayout` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/login/page.tsx:12` | `LoginForm` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/login/page.tsx:226` | `LoginPage` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/ml-insights/page.tsx:30` | `fmtPct` | static parse |  | True | mock/static data |
| Analytics dashboard | `cart_analytic/src/app/ml-insights/page.tsx:34` | `clsx` | static parse |  | True | mock/static data |
| Analytics dashboard | `cart_analytic/src/app/ml-insights/page.tsx:38` | `MetricBlock` | static parse |  | True | mock/static data |
| Analytics dashboard | `cart_analytic/src/app/ml-insights/page.tsx:69` | `SectionCard` | static parse |  | True | mock/static data |
| Analytics dashboard | `cart_analytic/src/app/ml-insights/page.tsx:98` | `ConfusionCell` | static parse |  | True | mock/static data |
| Analytics dashboard | `cart_analytic/src/app/ml-insights/page.tsx:136` | `DirectionGlyph` | static parse |  | True | mock/static data |
| Analytics dashboard | `cart_analytic/src/app/ml-insights/page.tsx:142` | `MLInsightsPage` | static parse |  | True | mock/static data |
| Analytics dashboard | `cart_analytic/src/app/ml-insights/page.tsx:410` | `Field` | static parse |  | True | mock/static data |
| Analytics dashboard | `cart_analytic/src/app/overview/page.tsx:3` | `OverviewAliasPage` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/page.tsx:3` | `Home` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/pipeline/page.tsx:53` | `StatusPill` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/pipeline/page.tsx:63` | `ServiceRow` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/pipeline/page.tsx:90` | `ServiceTable` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/pipeline/page.tsx:123` | `ThroughputCard` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/pipeline/page.tsx:141` | `fmt` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/pipeline/page.tsx:145` | `timeShort` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/pipeline/page.tsx:154` | `PipelinePage` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/profile/page.tsx:10` | `StatusMsg` | static parse | Main API | False | API mapping |
| Analytics dashboard | `cart_analytic/src/app/profile/page.tsx:21` | `ProfilePage` | static parse | Main API | False | API mapping |
| Analytics dashboard | `cart_analytic/src/app/recommendations/page.tsx:36` | `priorityTone` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/recommendations/page.tsx:42` | `MetricCell` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/recommendations/page.tsx:73` | `RecommendationsPage` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/reset-password/page.tsx:9` | `ResetPasswordForm` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/reset-password/page.tsx:119` | `ResetPasswordPage` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/sessions/SessionVariantFilter.tsx:6` | `SessionVariantFilter` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/sessions/SessionsRiskTabs.tsx:6` | `SessionsRiskTabs` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/sessions/[id]/error.tsx:6` | `SessionDetailError` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/sessions/[id]/loading.tsx:4` | `SessionDetailLoading` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/sessions/[id]/page.tsx:23` | `SectionCard` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/sessions/[id]/page.tsx:54` | `ProbabilityDial` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/sessions/[id]/page.tsx:116` | `ScoreBars` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/sessions/[id]/page.tsx:159` | `MetaField` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/sessions/[id]/page.tsx:172` | `SessionDetailPage` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/sessions/error.tsx:6` | `SessionsError` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/sessions/loading.tsx:4` | `SessionsLoading` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/sessions/page.tsx:28` | `RiskChip` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/sessions/page.tsx:47` | `StatusDot` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/sessions/page.tsx:64` | `DeviceGlyph` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/sessions/page.tsx:74` | `ReasonBadge` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/sessions/page.tsx:88` | `MetricCell` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/sessions/page.tsx:118` | `SessionsContent` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/sessions/page.tsx:432` | `SessionsPage` | static parse |  | False | S1-S7 mapping |
| Analytics dashboard | `cart_analytic/src/app/settings/page.tsx:86` | `fallbackCopy` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/settings/page.tsx:102` | `formatDate` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/settings/page.tsx:113` | `formatRelative` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/settings/page.tsx:124` | `StatusPill` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/settings/page.tsx:148` | `FieldShell` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/settings/page.tsx:170` | `inputClass` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/settings/page.tsx:178` | `SettingsInner` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/settings/page.tsx:555` | `ProfilePanel` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/settings/page.tsx:674` | `KeysPanel` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/settings/page.tsx:917` | `TeamPanel` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/settings/page.tsx:990` | `BillingPanel` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/settings/page.tsx:1030` | `DangerPanel` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/settings/page.tsx:1066` | `SettingsPage` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/setup/page.tsx:22` | `SetupPage` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/setup/page.tsx:32` | `SetupContent` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/signup/page.tsx:17` | `SignupPage` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/tenants/[id]/page.tsx:20` | `TenantDetailContent` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/tenants/[id]/page.tsx:128` | `TenantDetailPage` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/tenants/page.tsx:27` | `TenantsContent` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/app/tenants/page.tsx:205` | `TenantsPage` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/charts/AbandonmentTrendChart.tsx:10` | `AbandonmentTrendChart` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/charts/FeatureImportanceBarChart.tsx:6` | `FeatureImportanceBarChart` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/charts/PredictionHistogram.tsx:6` | `PredictionHistogram` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/charts/ShapWaterfallChart.tsx:5` | `contributionTone` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/charts/ShapWaterfallChart.tsx:10` | `ShapWaterfallChart` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/AuthContext.tsx:39` | `readStored` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/AuthContext.tsx:48` | `AuthProvider` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/AuthContext.tsx:132` | `useAuth` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/EditorialShell.tsx:26` | `defaultBreadcrumbs` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/EditorialShell.tsx:44` | `EditorialShell` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/RoleGuard.tsx:5` | `RoleGuard` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/Sidebar.tsx:60` | `NavItem` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/Sidebar.tsx:99` | `SectionLabel` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/Sidebar.tsx:107` | `Sidebar` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/ThemeToggle.tsx:8` | `applyTheme` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/ThemeToggle.tsx:16` | `ThemeToggle` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/TopAppBar.tsx:13` | `Breadcrumbs` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/TopAppBar.tsx:35` | `StatusIndicator` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/TopAppBar.tsx:59` | `CompanyChip` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/editorial/TopAppBar.tsx:89` | `TopAppBar` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/sessions/EventTimeline.tsx:3` | `isCartEvent` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/sessions/EventTimeline.tsx:12` | `EventTimeline` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/skeletons/ErrorStateCard.tsx:3` | `ErrorStateCard` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/skeletons/PageSkeleton.tsx:1` | `PageSkeleton` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/AblationBadge.tsx:14` | `AblationBadge` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/AlertBanner.tsx:4` | `AlertBanner` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/CodeBlockCard.tsx:6` | `CopyButton` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/CodeBlockCard.tsx:28` | `CodeBlockCard` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/ConnectionStatus.tsx:8` | `ConnectionStatus` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/ExportModal.tsx:12` | `ExportModal` | static parse | Main API | False | API mapping |
| Analytics dashboard | `cart_analytic/src/components/ui/Fab.tsx:4` | `Fab` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/Fab.tsx:17` | `EditorialNavyCard` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/FilterToolbar.tsx:3` | `FilterToolbar` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/FilterToolbar.tsx:12` | `FilterSelect` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/InsightQuote.tsx:3` | `InsightQuote` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/KanbanCard.tsx:3` | `KanbanCard` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/KanbanColumn.tsx:3` | `KanbanColumn` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/KpiStatCard.tsx:3` | `KpiStatCard` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/PageHeader.tsx:3` | `PageHeader` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/RiskBar.tsx:1` | `RiskBar` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/SegmentedToggle.tsx:5` | `SegmentedToggle` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/StatusPanel.tsx:3` | `StatusPanel` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/TableShell.tsx:3` | `TableShell` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/Toast.tsx:25` | `useToast` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/components/ui/Toast.tsx:31` | `ToastProvider` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/lib/api-client.ts:5` | `isMockFallback` | static parse | Main API | True | mock guarded, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/api-client.ts:9` | `ApiError` | static parse | Main API | True | mock guarded, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/api-client.ts:23` | `isTokenExpired` | static parse | Main API | True | mock guarded, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/api-client.ts:32` | `updateStoredToken` | static parse | Main API | True | mock guarded, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/api-client.ts:45` | `refreshAccessToken` | static parse | Main API | True | mock guarded, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/api-client.ts:64` | `logout` | static parse | Main API | True | mock guarded, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/api-client.ts:79` | `buildHeaders` | static parse | Main API | True | mock guarded, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/api-client.ts:93` | `fetchWithTimeout` | static parse | Main API | True | mock guarded, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/api-client.ts:106` | `apiRequest` | static parse | Main API | True | mock guarded, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/api-config.ts:75` | `parseAuthMode` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/lib/api-config.ts:82` | `getStoredToken` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/lib/api-config.ts:97` | `getApiConfig` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/lib/services/ablation.ts:34` | `fetchAblationSummary` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/analytics.ts:11` | `fetchFeatureImportance` | static parse | Main API | False | API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/analytics.ts:44` | `triggerExport` | static parse | Main API | False | API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/analytics.ts:63` | `getAnalyticsData` | static parse | Main API | False | API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/apiKeys.ts:57` | `normalizeCreateInput` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/apiKeys.ts:62` | `buildMockSnippet` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/apiKeys.ts:66` | `fetchApiKeys` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/apiKeys.ts:79` | `generateApiKey` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/apiKeys.ts:112` | `revokeApiKey` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/auth.ts:14` | `loginWithCredentials` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/lib/services/auth.ts:76` | `refreshAccessToken` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/lib/services/dashboard-mvp.ts:241` | `fetchDashboardOverview` | static parse | Main API | True | mock/static data, S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/dashboard-mvp.ts:246` | `fetchDashboardReasons` | static parse | Main API | True | mock/static data, S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/dashboard-mvp.ts:257` | `fetchDashboardSessions` | static parse | Main API | True | mock/static data, S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/dashboard-mvp.ts:263` | `fetchDashboardSessionDetail` | static parse | Main API | True | mock/static data, S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/dashboard-mvp.ts:268` | `fetchDashboardRecommendations` | static parse | Main API | True | mock/static data, S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/dashboard-mvp.ts:278` | `updateDashboardRecommendationStatus` | static parse | Main API | True | mock/static data, S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/dashboard-mvp.ts:288` | `fetchDashboardIntegration` | static parse | Main API | True | mock/static data, S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/dashboard-mvp.ts:292` | `formatPct` | static parse | Main API | True | mock/static data, S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/dashboard-mvp.ts:297` | `severityForProbability` | static parse | Main API | True | mock/static data, S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/dashboard.ts:41` | `mapOverviewResponse` | static parse | Main API | False | API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/dashboard.ts:68` | `fetchOverview` | static parse | Main API | False | API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/dashboard.ts:76` | `fetchScores` | static parse | Main API | False | API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/dashboard.ts:102` | `fetchAbandonmentRate` | static parse | Main API | False | API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/dashboard.ts:110` | `getDashboardData` | static parse | Main API | False | API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/diagnosis.ts:35` | `mapApiEntry` | static parse | Main API | True | mock/static data, S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/diagnosis.ts:47` | `dominantFromScores` | static parse | Main API | True | mock/static data, S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/diagnosis.ts:59` | `getDiagnoses` | static parse | Main API | True | mock/static data, S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/diagnosis.ts:90` | `getDiagnosisDetail` | static parse | Main API | True | mock/static data, S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/mlInsights.ts:97` | `fetchMLInsights` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/pipeline.ts:125` | `fetchPipelineMonitor` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/predictions.ts:60` | `fetchPredictions` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/predictions.ts:86` | `fetchPredictionDetail` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/recommendations.ts:39` | `mapStatus` | static parse | Main API | False | S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/recommendations.ts:45` | `mapSeverity` | static parse | Main API | False | S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/recommendations.ts:52` | `mapRecommendation` | static parse | Main API | False | S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/recommendations.ts:66` | `buildStats` | static parse | Main API | False | S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/recommendations.ts:75` | `getRecommendations` | static parse | Main API | False | S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/recommendations.ts:100` | `updateRecommendationStatus` | static parse | Main API | False | S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/sessions.ts:13` | `dominantFromDiagnosis` | static parse | Main API | False | S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/sessions.ts:21` | `mapApiSession` | static parse | Main API | False | S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/sessions.ts:48` | `normalizeShapValues` | static parse | Main API | False | S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/sessions.ts:59` | `mapApiSessionDetail` | static parse | Main API | False | S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/sessions.ts:81` | `getSessions` | static parse | Main API | False | S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/sessions.ts:106` | `getSessionDetail` | static parse | Main API | False | S1-S7 mapping, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/settings.ts:35` | `fetchStoreSettings` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/settings.ts:47` | `updateStoreSettings` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/settings.ts:59` | `fetchTeamMembers` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/settings.ts:72` | `inviteMember` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/settings.ts:84` | `removeMember` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/tenants.ts:29` | `fetchTenants` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/services/tenants.ts:49` | `fetchTenantDetail` | static parse | Main API | True | mock/static data, API mapping |
| Analytics dashboard | `cart_analytic/src/lib/utils.ts:3` | `getRiskColor` | static parse |  | False |  |
| Analytics dashboard | `cart_analytic/src/lib/utils.ts:9` | `getVariantColor` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/account/page.tsx:8` | `AccountPage` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/admin/analytics/page.tsx:5` | `AdminAnalyticsPage` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/admin/coupons/page.tsx:5` | `AdminCouponsPage` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/admin/layout.tsx:7` | `AdminLayout` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/admin/orders/page.tsx:5` | `AdminOrdersPage` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/admin/page.tsx:6` | `AdminPage` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/admin/products/AdminProductsTable.tsx:16` | `AdminProductsTable` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/admin/products/[id]/edit/page.tsx:5` | `AdminEditProductPage` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/admin/products/new/page.tsx:3` | `AdminNewProductPage` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/admin/products/page.tsx:8` | `AdminProductsPage` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/admin/taxonomy/TaxonomyClient.tsx:15` | `TaxonomyClient` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/admin/taxonomy/page.tsx:4` | `AdminTaxonomyPage` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/catalog-options/route.ts:5` | `GET` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/coupons/route.ts:5` | `GET` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/coupons/route.ts:12` | `POST` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/metrics/route.ts:5` | `GET` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/products/[id]/route.ts:33` | `PATCH` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/products/[id]/route.ts:139` | `DELETE` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/products/route.ts:31` | `POST` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/taxonomy/[resource]/[id]/route.ts:9` | `PATCH` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/taxonomy/[resource]/[id]/route.ts:94` | `DELETE` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/taxonomy/[resource]/route.ts:9` | `uniqueBrandSlug` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/taxonomy/[resource]/route.ts:19` | `uniqueCategorySlug` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/taxonomy/[resource]/route.ts:29` | `uniqueGenderSlug` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/taxonomy/[resource]/route.ts:39` | `uniqueColorSlug` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/taxonomy/[resource]/route.ts:49` | `POST` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/admin/upload/route.ts:9` | `POST` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/auth/password-reset/confirm/route.ts:5` | `POST` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/auth/password-reset/request/route.ts:5` | `POST` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/auth/verify-email/route.ts:4` | `POST` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/cart/route.ts:3` | `GET` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/orders/[id]/cancel/route.ts:6` | `POST` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/orders/[id]/refund/route.ts:6` | `POST` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/orders/[id]/status/route.ts:4` | `PATCH` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/orders/route.ts:6` | `POST` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/products/[id]/route.ts:4` | `GET` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/products/route.ts:4` | `GET` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/register/route.ts:7` | `POST` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/wishlist/route.ts:6` | `GET` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/api/wishlist/route.ts:16` | `POST` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/cart/page.tsx:9` | `CartPage` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/checkout/page.tsx:8` | `CheckoutPage` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/layout.tsx:29` | `RootLayout` | static parse | Observer tracker | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/login/page.tsx:6` | `LoginPage` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/order/[id]/OrderObserverPurchase.tsx:6` | `OrderObserverPurchase` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/order/[id]/page.tsx:6` | `OrderPage` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/page.tsx:8` | `HomePage` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/privacy/page.tsx:3` | `PrivacyPage` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/products/[id]/AddToCartClient.tsx:18` | `AddToCartClient` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/products/[id]/page.tsx:7` | `generateMetadata` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/products/[id]/page.tsx:24` | `ProductDetailPage` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/products/page.tsx:28` | `ProductsPage` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/register/page.tsx:6` | `RegisterPage` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/reset-password/page.tsx:5` | `ResetPasswordPage` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/returns/page.tsx:3` | `ReturnsPage` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/search/page.tsx:11` | `SearchPage` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/shipping/page.tsx:3` | `ShippingPage` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/app/terms/page.tsx:3` | `TermsPage` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/components/CaCommerceSync.tsx:8` | `CaCommerceSync` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/components/Providers.tsx:5` | `Providers` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/components/ThesisDemoPanel.tsx:17` | `newSessionId` | static parse | Observer API | False | event emission |
| Demo ecommerce/tracker | `sneaker-store/src/components/ThesisDemoPanel.tsx:21` | `buildEvent` | static parse | Observer API | False | event emission |
| Demo ecommerce/tracker | `sneaker-store/src/components/ThesisDemoPanel.tsx:52` | `eventSequence` | static parse | Observer API | False | event emission |
| Demo ecommerce/tracker | `sneaker-store/src/components/ThesisDemoPanel.tsx:78` | `ThesisDemoPanel` | static parse | Observer API | False | event emission |
| Demo ecommerce/tracker | `sneaker-store/src/components/admin/ProductFormClient.tsx:34` | `toggleInSet` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/components/admin/ProductFormClient.tsx:41` | `ProductFormClient` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/components/layout/CartBadge.tsx:5` | `CartBadge` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/components/layout/Footer.tsx:1` | `Footer` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/components/layout/Navbar.tsx:17` | `Navbar` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/lib/admin.ts:9` | `requireAdminUser` | static parse | Demo app state/DB | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/lib/commerce-attrs.ts:24` | `commerceAttrs` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/lib/env-admin.ts:6` | `isEnvAdminConfigured` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/lib/env-admin.ts:11` | `verifyEnvAdminCredentials` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/lib/product-stock.ts:2` | `totalProductStock` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/lib/rate-limit.ts:3` | `checkRateLimit` | static parse |  | False |  |
| Demo ecommerce/tracker | `sneaker-store/src/lib/slug.ts:1` | `slugify` | static parse |  | False |  |
