# Event төрлүүд

## Зорилго

Observer service нь ecommerce үйлдлийг raw event болгон авч PostgreSQL `raw_events` болон Kafka `raw_events` topic руу дамжуулна.

## Дэмжигдсэн event төрлүүд

| Event | Утга |
|---|---|
| `page_view` | Хуудас нээгдсэн. |
| `product_view` | Барааны detail харсан. |
| `add_to_cart` | Сагсанд нэмсэн. |
| `remove_from_cart` | Сагсаас хассан. |
| `cart_view` | Сагс харсан. |
| `checkout_start` | Checkout эхэлсэн. |
| `checkout_error` | Checkout үед алдаа гарсан. |
| `abandon_checkout` | Checkout/сагс орхисон. |
| `purchase_success` | Амжилттай худалдан авалт. |
| `order_success` | `purchase_success`-ийн compatible alias. |

## Validation дүрэм

- `session_id`, `visitor_id`, `tenant_id`, `event_type` downstream pipeline-д шаардлагатай.
- Demo full key `tk_full_*` нь commerce evidence талбаруудыг хадгална.
- `api_key`, `authorization`, `password`, `token`, `secret` payload-д хадгалагдахгүй.

## UC жишээ

UC2 нь `purchase_success` илгээдэг тул Session service `CONVERTED`, Main service `business_outcome=converted` гэж хадгална.
