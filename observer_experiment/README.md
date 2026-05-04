# Observer Experiment — PostgreSQL хувилбар

**Observer** нэг зэрэг хоёр зүйл: (1) хөгжүүлэгчийн сайт руу суулгах **collect snippet**, (2) судалгааны **өгөгдөл цуглуулах** хэрэгсэл. Энэ README нь төслийг асаахад хангалттай; бүрэн лавлах, талбар бүрийн эх үүсвэр, methodology-г **Docusaurus** (`documentation/`) болон доорх лавлах файлуудаас уншина.

FastAPI + asyncpg + PostgreSQL

---

## 1. PostgreSQL database үүсгэх

```sql
createdb observer_experiment
-- эсвэл
psql -U postgres -c "CREATE DATABASE observer_experiment;"
```

---

## 2. .env файл тохируулах

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/observer_experiment
```

**Сонголттой — Redis fan-out (`/track` PostgreSQL-д хадгалсны дараа):** `REDIS_URL` заавал биш. Заасан бөгөөд Redis холбогдох бол Observer бүр `LPUSH` хийнэ:

- `ca:events:{visitor_id}` — бүх event-ийн жижиг JSON (`session_id`, `event_type`, `tier`, `visitor_id`), TTL 24 цаг
- `ca:diagnosis:queue` — зөвхөн `event_type === session_end` үед (Main Service `BRPOP`-оор авах)

Redis алдаа / URL байхгүй бол push алгасна; ingest алдагдахгүй.

```
REDIS_URL=redis://localhost:6379/0
```

**Сонголттой — Session Service рүү HTTP fan-out:** Observer нь Kafka-с гадна event-ийг шууд session service endpoint рүү илгээж чадна (алдаа гарсан ч ingest тасалдахгүй).

```
# Full endpoint (service дээрээ өөрийн route-оо тавина)
SESSION_SERVICE_URL=http://localhost:8002/ingest/raw-event

# Optional
SESSION_SERVICE_TIMEOUT_MS=1500
SESSION_SERVICE_API_KEY=your_session_service_key
```

Docker: төслийн `docker-compose.redis.yml` — `docker compose -f docker-compose.redis.yml up -d` (Docker Desktop асаалттай байх ёстой).

Main Service (:8000) холбох consumer + `processed_sessions` DDL: [`integration/README.md`](integration/README.md)

**Бүтэн түлхүүрийг хязгаарлах (сонголттой):** `.env` дээр жагсаалт заавал болгоно — зөвхөн эдгээр **яг** түлхүүр `/track` болон validate-д нэвтрэнэ (угтраас зөв ч суффикс өөр бол **татгалзана**; `tk_basic_` → `tk_smart_` болгож өөрчилбөл ч мөн адил).

```
# Таслалаар тусгаарласан, зай авахгүй эсвэл бага зайтай
OBSERVER_API_KEYS=tk_basic_a1b2c3...,tk_smart_x9y8z7...,tk_full_m4n5o6...
```

- **Заагаагүй** (анхдагч): зөвхөн угтрыг шалгана — `tk_basic_` + дурын суффикс бүгд “зөв”.
- **Заасан:** бүтэн мөрийг **тааруулна** — Viewer-ийн **🔑 API key** tab нь `GET /api/keys/status`-аар allowlist асаалт эсэхийг харуулна.
- Шинэ түлхүүр үүсгэсний дараа түүнийг энэ жагсаалтад нэмж **сервер дахин асаана**.

---

## 2.1 API түлхүүр, tier (T3 / T2 / T1)

Илгээлт: **`POST /track`** ( **`POST /collect`** нь ижил handler). Хүчинтэй түлхүүр заавал.

| Угтас | Tier | Утга (товч) |
|--------|------|-------------|
| `tk_basic_` | T3 | Хамгийн суурь payload (жижиг listener-үүд идэвхгүй). |
| `tk_smart_` | T2 | T3 + URL/heuristic, rage/outbound/js_error гэх мэт нэмэлт. |
| `tk_full_`  | T1 | T2 + `data-ca-*` товч, `window._ca_user`-ийн зөвшөөрөгдсөн нэрүүд. |

Түлхүүрийг дамжуулах: **`X-API-Key`**, эсвэл **`Authorization: Bearer …`**, эсвэл JSON **`api_key`** (production-д log багасгах). Raw түлхүүр DB-д **орохгүй**; зөвхөн **`tier`** багана + **`payload`** JSONB сервер [`filter_payload_for_tier`](observer/models/event.py)-ээр шүүгдэнэ. **`OBSERVER_API_KEYS`** — сонголттой allowlist (§2).

**CORE багана** (tier-ээс үл хамааран): `visitor_id`, `session_id`, `event_type`, `url`, `referrer`, `timestamp`, `ip`, `user_agent`. JSONB-д зөвхөн allowlist-д байгаа түлхүүр орно.

**Бүх зөвшөөрөгдөх талбарын жагсаалт, tier, судалгааны бүлэг, эх үүсвэр (MN тайлбар):** ажиллаж байх үед **`GET /api/field-catalog`** (Viewer болон баримт бичигт ашиглана). Эх код: [`observer/models/event.py`](observer/models/event.py), [`observer/models/field_catalog.py`](observer/models/field_catalog.py).

**Alias:** `likely_logged_in`→`is_logged_in`, `js_error_count`→`js_error`, `outbound_click_count`→`outbound_click`, `rage_click_bursts`→`rage_click`, `query`→`search_query`, `ca_user_customer_type`→`customer_type`, `ca_user_is_logged_in`→`is_logged_in`. Бусад `ca_user_*` хадгалагдахгүй.

**E-commerce (T2 талбар бүр, T1 `data-ca-*`):** [`docs/ECOMMERCE_T2_T1_FIELDS.md`](docs/ECOMMERCE_T2_T1_FIELDS.md) — Docusaurus руу шилжүүлэхдээ `documentation/reference`-тай нэгтгэнэ.

## 2.2 Session Service (localhost:8002) холболтын setup

Observer-с session service рүү event дамжуулах 2 арга:

1. **Kafka (recommended):** Observer -> Kafka `raw_events` -> Session service consumer  
2. **HTTP fan-out (optional):** Observer -> `SESSION_SERVICE_URL` (шууд POST)

### A) Kafka-р холбох

Observer `.env`:

```
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

Session service config (жишээ):

```
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_RAW_EVENTS=raw_events
KAFKA_CONSUMER_GROUP=session-service-v1
```

Session service нь `raw_events` topic-оос JSON payload уншаад өөрийн session aggregation pipeline руу оруулна.

### B) HTTP-р шууд холбох

Observer `.env`:

```
SESSION_SERVICE_URL=http://localhost:8002/ingest/raw-event
SESSION_SERVICE_TIMEOUT_MS=1500
SESSION_SERVICE_API_KEY=optional_key
```

Session service endpoint шаардлага:

- `POST /ingest/raw-event`
- `Content-Type: application/json`
- Observer-с илгээх JSON талбарууд: шүүгдсэн payload + `event_id`, `tier`
- Хариу: `2xx` (амжилт)

Хэрэв 4xx/5xx эсвэл timeout гарвал Observer warning log бичээд ingest-ээ үргэлжлүүлнэ.

---

## 3. Суулгаж ажиллуулах

```bash
cd observer_experiment
pip install -r requirements.txt
python main.py
# эсвэл
uvicorn observer.main:app --host 0.0.0.0 --port 8001
```

Эхлэхэд хүснэгт болон index-үүд автоматаар үүснэ. App entry: **`observer.main:app`** (эсвэл `python main.py`).

---

## 4. Хандах хаягууд

```
http://localhost:8001/viewer      ← Бүх өгөгдөл харагдах UI
http://localhost:8001/snippet-test ← Next.js-гүйгээр track.js турших (?key=… allowlist үед)
http://localhost:8001/docs        ← FastAPI Swagger
http://localhost:8001/stats       ← JSON статистик
http://localhost:8001/fields      ← Field analysis
http://localhost:8001/events      ← Event жагсаалт
http://localhost:8001/session/ID  ← Нэг session
http://localhost:8001/visitor/ID  ← Нэг visitor
http://localhost:8001/query       ← Custom SQL (POST)
http://localhost:8001/api/keys/validate  ← GET ?key=… эсвэл POST JSON { "key": "…" }
http://localhost:8001/api/keys/generate    ← POST JSON { "tier": "T3"|"T2"|"T1" } — санамсаргүй суффикс
http://localhost:8001/api/keys/status      ← allowlist асаалт эсэх, түлхүүрийн тоо (нууцгүй)
http://localhost:8001/api/field-catalog    ← Талбаруудын лавлах JSON (tier + сектор + MN)
```

Viewer дээр **🔑 API key** tab: түлхүүр үүсгэх + шалгах (идэвхтэй сервертэй ижил дүрмээр).

---

## 5. Shoe shop-д snippet суулгах

### 5.1 Tiered `track.js` (шинэ)

`</body>`-с өмнө — script URL дээр **заавал** `?key=`:

```html
<script src="http://localhost:8001/static/snippet/track.js?key=tk_basic_YOUR_TOKEN"></script>
```

**API key хаанаас гарч ирэх вэ?** Энэ төсөлд **түлхүүр үүсгэх endpoint эсвэл админ DB байхгүй**. Та (эсвэл таны e-commerce платформ) **өөрөө** түлхүүр зохионо — сервер зөвхөн **угтрыг** шалгана (`tk_basic_` → T3, `tk_smart_` → T2, `tk_full_` → T1). Угтрын дараа ямар ч тэмдэгт мөр (жишээ нь санамсаргүй ID) зөвшөөрөгдөнө.

Жишээ (нэг дэлгүүр / нэг орчин):

- `tk_basic_shop_a_7f3k9q` — basic tier  
- `tk_smart_shop_a_m2n8xp` — smart tier  
- `tk_full_shop_a_p4r1st` — full tier  

Үйлдвэрлэлд: түлхүүрийг **хадгалах газар** (env, secrets manager, таны backend-ийн DB) ашиглаж, HTML-д зөвхөн тухайн дэлгүүрийн түлхүүрийг оруулна. Хэрэглэгчид script-ийн URL-аас түлхүүр харагдана тул **public client id** маягийн зүйл — **OBSERVER_API_KEYS** allowlist-аар бүртгэгдсэн бүтэн түлхүүр л ажиллуулж болно (§2).

Логик: [`tier_from_key_prefix`](observer/models/event.py) зөвхөн `startswith` шалгана — түлхүүр “авах” газар бол **таны өөрийн бизнес процесс** (гар авах эсвэл ирээдүйд `/admin/keys` гэх мэт нэмэх).

- `track.js` нь **`POST /track`** руу **`X-API-Key`** header-тэй илгээнэ.
- Tier (T3/T2/T1) нь түлхүүрийн угтраас (`tk_basic_` / `tk_smart_` / `tk_full_`) — илүү ачаалал багатай T3 дээр зарим listener (outbound, rage, js_error, impression, popup, purchase heuristic) **идэвхгүй**.

### 5.2 Legacy `snippet.js` (түлхүүргүй)

Төслийн үндсэн `snippet.js` хуучин хэвээр **`POST /collect`** ашиглана, **API key шаарддаггүй**. Одоогийн сервер (`observer.main`) нь **`/collect`-д мөн API key шаарддаг** тул legacy snippet-ийг ашиглах бол:

- Эсвэл зөвхөн туршилтад тусдаа branch/endpoint нэмэх,
- Эсвэл бүх сайтыг `track.js` + түлхүр руу шилжүүлэх.

**Шилжилт:** `snippet.js` → `static/snippet/track.js?key=tk_*`, endpoint `/collect` → `/track` (эсвэл `/collect` хэвээр — хоёул alias).

**LAN:** script `src` дээр **LAN IP** ашиглана (жишээ `http://192.168.1.5:8001/static/snippet/track.js?key=...`). Observer `host="0.0.0.0"`. Next.js: `next dev -H 0.0.0.0`.

**Next.js App Router:** идэвхгүй болох нийтлэг шалтгаан (хоосон `NEXT_PUBLIC_OBSERVER_URL`, CSP, `<head>`-ийн буруу script): [`docs/NEXTJS_OBSERVER.md`](docs/NEXTJS_OBSERVER.md)

**Adblock:** зарим шүүлтүүр `/track`-ийг блоклож магадгүй — ижил handler **`POST /collect`** ашиглаж болно (`track.js` дотор `OBSERVER_URL`-ийг `/collect` болгож өөрчлөх эсвэл nginx reverse proxy ашиглах).

**Зөвхөн `OPTIONS`:** `fetch` + JSON илгээлт ашиглаж байна.

---

## 6. Cart товч дээр data-ca атрибут нэмэх (T1 Only)

`data-ca` click listener нь **зөвхөн T1** (`tk_full_`) tier-д ажиллана. T3, T2 түлхүүрээр `[data-ca]` товч дарахад event илгээхгүй.

```html
<!-- Сагсанд нэмэх -->
<button
  data-ca="cart_add"
  data-ca-id="shoe-123"
  data-ca-price="89000"
  data-ca-cat="shoes"
  data-ca-value="89000">
  Сагсанд нэмэх
</button>

<!-- Хасах -->
<button data-ca="cart_remove" data-ca-id="shoe-123">
  Хасах
</button>

<!-- Checkout эхлэх -->
<button data-ca="checkout_start">
  Захиалах
</button>
```

**Бүх `data-ca-*` атрибутууд (T1 only):** `data-ca-id` → `product_id`, `data-ca-price` → `product_price`, `data-ca-cat` → `product_category`, `data-ca-value` → `cart_value`, `data-ca-step` → `checkout_step`, `data-ca-payment` → `payment_method`, `data-ca-shipping` → `shipping_method`, `data-ca-order-total` → `order_total`, `data-ca-discount` → `discount_code`, `data-ca-sale` → `is_sale` (`true`/`1`), `data-ca-variant` → `product_variant`, `data-ca-stock` → `product_stock`, `data-ca-cart-count` → `cart_item_count`, `data-ca-size` → `selected_size`, `data-ca-qty` → `selected_quantity`, `data-ca-availability` → `product_availability`.

`_ca.sendPurchase({ order_total: 99, payment_method: 'card', … })` зэргээр зөвхөн **Tier 1** allowlist-д байгаа түлхүүрүүдийг илгээнэ.

---

## 7. Viewer-ийн tab-ууд

| Tab | Тайлбар |
|-----|---------|
| Events | Бүх event; ID дээр дарвал **Tier Inspect** руу |
| Fields | JSONB түлхүүрүүдийн давтамж + `/api/field-catalog`-ийн tier/сектор шошго |
| Tier Inspect | Сонгосон event дээр T3 / T2 / T1 баганаар талбар байгаа эсэх, судалгааны бүлэг |
| Sessions / Visitor | Session эсвэл visitor-ийн түүх |
| Event Types | `event_type` бүрийн тоо |
| SQL Query | Зөвхөн SELECT (туршилт) |
| API key | Түлхүүр үүсгэх / шалгах, allowlist төлөв |

---

## 8. Туршилтын SQL query-ууд

```sql
-- Visitor-ийн visit_count шинжилгээ
SELECT
    (payload->>'visit_count')::int as visit_n,
    COUNT(*) as visitors
FROM raw_events
WHERE event_type = 'session_end'
GROUP BY visit_n
ORDER BY visit_n;

-- Scroll depth хуваарь (ROUND(x,n) нь numeric шаарддаг)
SELECT
    ROUND((payload->>'max_scroll_pct')::numeric / 10, 0) * 10 as bucket,
    COUNT(*) as cnt
FROM raw_events
WHERE event_type = 'session_end'
GROUP BY bucket ORDER BY bucket;

-- cart_add event-тэй visitor-ууд (payload-д cart_add_count байхгүй ч event_type-оор)
SELECT visitor_id, COUNT(DISTINCT session_id) AS sessions
FROM raw_events
WHERE event_type = 'cart_add'
GROUP BY visitor_id
ORDER BY sessions DESC
LIMIT 20;
```

---

## 9. Бүрэн лавлах (Docusaurus)

Урт field жагсаалт, `event_type` тайлбар, API-г **Markdown лавлах** болон **`GET /api/field-catalog`** (жив JSON) дээр төвлөрүүлсэн.

| Файл | Агуулга |
|------|---------|
| [`documentation/reference/fields/overview.md`](documentation/reference/fields/overview.md) | Tier, CORE багана, JSONB, “missing”-ийн утга |
| [`documentation/reference/fields/tier3.md`](documentation/reference/fields/tier3.md) | T3 талбар |
| [`documentation/reference/fields/tier2.md`](documentation/reference/fields/tier2.md) | T2 нэмэлт талбар |
| [`documentation/reference/fields/tier1.md`](documentation/reference/fields/tier1.md) | T1 нэмэлт талбар |
| [`documentation/reference/events.md`](documentation/reference/events.md) | `event_type` лавлах |
| [`documentation/reference/api.md`](documentation/reference/api.md) | `/track`, түлхүүр, шүүлт |

**Docusaurus сайт:** [`website/`](website/) — `cd website`, `npm install`, `npm start` (баримт: `documentation/`, нэмэлт: `docs/` нь `/project-docs/` замд гарна).

**Судалгааны талбарын зураглал (шинэ PDF):** [`docs/research_field_map.md`](docs/research_field_map.md) — **62 → 47 зорилтот профайл**, Feature service руу шилжүүлэх талбарууд, Ablation бүлгүүд.
