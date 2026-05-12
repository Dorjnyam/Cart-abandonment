(function (window, document) {
  "use strict";

  var scriptTag =
    document.currentScript ||
    document.querySelector('script[src*="tracker.js"]');
  var params = new URLSearchParams((scriptTag && scriptTag.src.split("?")[1]) || "");
  var apiKey = params.get("key") || "";
  var endpoint = "https://your-main-service.com/ingest";
  var cookieName = "_ctrack";
  var cartKey = "sneaker_cart";

  function getOrCreateSession() {
    var existing = document.cookie
      .split(";")
      .map(function (c) { return c.trim(); })
      .find(function (c) { return c.indexOf(cookieName + "=") === 0; });

    if (existing) return existing.split("=")[1];

    var id = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    document.cookie = cookieName + "=" + id + "; max-age=2592000; path=/; SameSite=Lax";
    return id;
  }

  function readCart() {
    try {
      var raw = localStorage.getItem(cartKey);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && parsed.state && Array.isArray(parsed.state.items)) return parsed.state.items;
      return [];
    } catch {
      return [];
    }
  }

  var sessionId = getOrCreateSession();

  function send(eventType, payload) {
    var body = JSON.stringify({
      session_id: sessionId,
      event_type: eventType,
      payload: payload || {},
      url: window.location.href,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    });

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: body,
      keepalive: true
    }).catch(function () {});
  }

  window.CartTracker = {
    addToCart: function (product) { send("add_to_cart", product); },
    removeFromCart: function (productId, reason) {
      send("remove_from_cart", { product_id: productId, reason: reason || "user" });
    },
    viewCart: function (items, totalValue) { send("cart_view", { items: items, total_value: totalValue }); },
    startCheckout: function (items, totalValue) { send("checkout_start", { items: items, total_value: totalValue }); },
    abandonCheckout: function (step, items) { send("checkout_abandon", { step: step, items: items }); },
    completePurchase: function (orderId, items, totalValue, paymentMethod) {
      send("purchase_complete", {
        order_id: orderId,
        items: items,
        total_value: totalValue,
        payment_method: paymentMethod
      });
      localStorage.removeItem(cartKey);
    }
  };

  window.addEventListener("beforeunload", function () {
    var cart = readCart();
    if (cart.length > 0) {
      send("cart_abandon", {
        cart_items: cart,
        item_count: cart.length,
        total_value: cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0)
      });
    }
  });

  send("page_view", { path: window.location.pathname, referrer: document.referrer });
})(window, document);
