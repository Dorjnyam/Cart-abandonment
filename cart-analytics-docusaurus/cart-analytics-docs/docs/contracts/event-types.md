---
title: Event төрлүүд
---

# Event contract

| Event | Тайлбар |
|---|---|
| `page_view` | Хуудас нээгдсэн. |
| `product_view` | Бараа харсан. |
| `add_to_cart` | Сагсанд нэмсэн. |
| `remove_from_cart` | Сагсаас хассан. |
| `cart_view` | Сагс харсан. |
| `checkout_start` | Checkout эхэлсэн. |
| `checkout_error` | Checkout алдаа. |
| `abandon_checkout` | Сагс/checkout орхисон. |
| `purchase_success` | Амжилттай худалдан авалт. |

UC2 дээр `purchase_success` ирэхэд Session service `CONVERTED`, Main service `business_outcome=converted` гэж хамгаална.
