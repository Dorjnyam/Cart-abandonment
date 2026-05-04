/**
 * Observer Experiment — tiered track.js (T3 / T2 / T1)
 *
 * Requires API key on the script URL:
 *   <script src="http://localhost:8001/static/snippet/track.js?key=tk_basic_xxx"></script>
 *
 * Prefixes: tk_basic_ → T3, tk_smart_ → T2, tk_full_ → T1 (more fields stored server-side).
 * POST /track with header X-API-Key (same value). /collect is an alias on the server.
 *
 * Legacy: root snippet.js + /collect (no key) — see README migration.
 */

(function () {
  'use strict';

  function getCurrentScriptTag() {
    var s = document.currentScript;
    if (s && s.src) return s;
    // Prefer real Observer path (Next.js apps often use /tracker.js — do not match *track.js*)
    var nodes = document.querySelectorAll(
      'script[src*="snippet/track.js"],script[src*="/static/snippet/track.js"]'
    );
    if (nodes.length) return nodes[nodes.length - 1];
    nodes = document.querySelectorAll('script[src*="track.js"],script[src*="snippet.js"]');
    return nodes.length ? nodes[nodes.length - 1] : null;
  }

  function getObserverBase() {
    var tag = getCurrentScriptTag();
    if (tag && tag.src) {
      try {
        return new URL(tag.src).origin;
      } catch (e) { /* fall through */ }
    }
    return window.location.origin || '';
  }

  function getApiKeyFromScript() {
    var tag = getCurrentScriptTag();
    if (!tag || !tag.src) return '';
    try {
      var sp = new URL(tag.src).searchParams;
      return (sp.get('key') || '').trim();
    } catch (e) {
      return '';
    }
  }

  function parseTierFromKey(key) {
    if (!key) return null;
    if (key.indexOf('tk_full_') === 0) return 'T1';
    if (key.indexOf('tk_smart_') === 0) return 'T2';
    if (key.indexOf('tk_basic_') === 0) return 'T3';
    return null;
  }

  function tierRank(t) {
    if (t === 'T1') return 3;
    if (t === 'T2') return 2;
    return 1;
  }

  var OBSERVER_BASE = getObserverBase();
  var API_KEY = getApiKeyFromScript();
  // Next.js <Script> / bundlers: set before load — window.__OBSERVER_BASE__ + window.__OBSERVER_API_KEY__
  if (typeof window !== 'undefined') {
    if (window.__OBSERVER_BASE__) {
      var _b = String(window.__OBSERVER_BASE__).trim().replace(/\/$/, '');
      if (_b) OBSERVER_BASE = _b;
    }
    if (window.__OBSERVER_API_KEY__) {
      API_KEY = String(window.__OBSERVER_API_KEY__).trim();
    }
  }
  var OBSERVER_TIER = parseTierFromKey(API_KEY);
  var TR = tierRank(OBSERVER_TIER);

  if (!API_KEY || !OBSERVER_TIER) {
    console.error('[Observer] track.js requires ?key=tk_basic_|tk_smart_|tk_full_... in the script URL (or window.__OBSERVER_API_KEY__)');
    return;
  }

  var OBSERVER_URL = OBSERVER_BASE + '/track';

  // Strict tier field lists (must match observer/models/event.py)
  var KEYS_T3 = [
    'visitor_id', 'session_id', 'visit_count',
    'url', 'path', 'referrer', 'page_load_ms', 'device_type', 'language',
    'timezone', 'time_on_page_sec', 'max_scroll_pct', 'scroll_up_count',
    'click_count', 'active_time_ms', 'tab_hidden_count', 'tab_hidden_ms', 'copy_count',
    'form_fields_count', 'form_fields_touched', 'bounce', 'session_duration_sec',
    'is_logged_in', 'customer_type', 'event_type', 'timestamp',
  ];
  var KEYS_T2_EXTRA = [
    'action_detected', 'rage_click', 'outbound_click', 'detected_page_type',
    'product_slug', 'checkout_step_detected', 'search_query_from_url', 'is_order_success',
    'product_id', 'product_price', 'product_category', 'product_availability', 'selected_size',
    'selected_quantity', 'search_query', 'filter_name',
    'coupon_entered', 'js_error', 'page_view_count', 'back_navigation',
  ];
  var KEYS_T1_EXTRA = [
    'cart_value', 'cart_item_count', 'checkout_step', 'payment_method', 'shipping_method',
    'order_total', 'discount_code', 'is_sale', 'product_variant', 'product_stock',
  ];
  var KEYS_T2 = KEYS_T3.concat(KEYS_T2_EXTRA);
  var KEYS_T1 = KEYS_T2.concat(KEYS_T1_EXTRA);

  function keysForCurrentTier() {
    if (TR === 1) return KEYS_T3;
    if (TR === 2) return KEYS_T2;
    return KEYS_T1;
  }

  function pickKeys(obj, keys) {
    var o = {};
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      var v = obj[k];
      if (v === undefined || v === null) continue;
      o[k] = v;
    }
    return o;
  }

  function inferCheckoutStepDetected() {
    var path = (window.location.pathname || '').toLowerCase();
    if (!/\/checkout/.test(path)) return null;
    var m = path.match(/step[_-]?(\d+)/i);
    if (m) return 'step_' + m[1];
    if (/shipping/.test(path)) return 'shipping';
    if (/payment|billing/.test(path)) return 'payment';
    if (/review|confirm/.test(path)) return 'review';
    return 'checkout';
  }

  function inferFilterSortCoupon() {
    var p = new URLSearchParams(window.location.search || '');
    return {
      filter_name:    p.get('filter') || p.get('filters') || null,
      coupon_entered: p.get('coupon') || p.get('promo') || p.get('discount_code') || null,
    };
  }

  function mergeWindowCaUserFull() {
    var u = window._ca_user;
    if (!u || typeof u !== 'object') return {};
    var out = {};
    var allow = [
      'customer_type', 'cart_value', 'cart_item_count', 'checkout_step', 'payment_method',
      'shipping_method', 'order_total', 'discount_code', 'is_sale', 'product_variant',
      'product_stock', 'product_id', 'product_price', 'product_category', 'product_availability',
    ];
    for (var i = 0; i < allow.length; i++) {
      var k = allow[i];
      if (!Object.prototype.hasOwnProperty.call(u, k)) continue;
      var v = u[k];
      var tp = typeof v;
      if (tp !== 'string' && tp !== 'number' && tp !== 'boolean') continue;
      if (tp === 'string' && v.length > 300) v = v.slice(0, 300);
      out[k] = v;
    }
    if (u.is_logged_in != null) out.is_logged_in = !!u.is_logged_in;
    return out;
  }

  // ============================================================
  // 1. VISITOR — cookie-д хадгалагддаг (365 хоног)
  //    Буцаж ирэх бүрт visit_count нэмэгдэнэ
  // ============================================================

  function getCookie(name) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? decodeURIComponent(v[2]) : null;
  }

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + encodeURIComponent(value)
      + '; expires=' + d.toUTCString()
      + '; path=/; SameSite=Lax';
  }

  function generateId(prefix) {
    return (prefix || 'id') + '_' + Math.random().toString(36).substr(2, 12)
      + '_' + Date.now().toString(36);
  }

  // Visitor (cookie — удаан хугацаанд)
  var visitorRaw = getCookie('_ca_visitor');
  var visitor;
  if (visitorRaw) {
    try {
      visitor = JSON.parse(visitorRaw);
      visitor.visit_count = (visitor.visit_count || 0) + 1;
      visitor.last_visit  = new Date().toISOString();
    } catch (e) {
      visitor = null;
    }
  }
  if (!visitor) {
    visitor = {
      id:              generateId('v'),
      visit_count:     1,
      first_visit:     new Date().toISOString(),
      last_visit:      new Date().toISOString(),
      purchased_before: false,
    };
  }
  setCookie('_ca_visitor', JSON.stringify(visitor), 365);

  // Session (localStorage — tab хаагдах хүртэл)
  var sessionId = sessionStorage.getItem('_ca_session');
  if (!sessionId) {
    sessionId = generateId('s');
    sessionStorage.setItem('_ca_session', sessionId);
  }

  var _pageViewCountSession = parseInt(sessionStorage.getItem('_ca_pvc') || '0', 10) + 1;
  sessionStorage.setItem('_ca_pvc', String(_pageViewCountSession));

  var sessionStart = Date.now();

  // ============================================================
  // 2. DEVICE & BROWSER INFO — нэг удаа цуглуулна
  // ============================================================

  function getDeviceInfo() {
    var ua = navigator.userAgent;
    var isMobile  = /Mobile|Android|iPhone|iPad/.test(ua);
    var isTablet  = /iPad|Tablet/.test(ua) || (isMobile && window.innerWidth > 768);
    var deviceType = isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop');

    // Connection type
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    return {
      device_type:        deviceType,
      screen_width:       window.screen.width,
      screen_height:      window.screen.height,
      viewport_width:     window.innerWidth,
      viewport_height:    window.innerHeight,
      device_pixel_ratio: window.devicePixelRatio || 1,
      color_depth:        window.screen.colorDepth,
      orientation:        screen.orientation ? screen.orientation.type : 'unknown',

      // Browser
      browser_language:   navigator.language,
      browser_languages:  (navigator.languages || []).join(','),
      timezone:           Intl.DateTimeFormat().resolvedOptions().timeZone,
      do_not_track:       navigator.doNotTrack || 'unknown',
      cookies_enabled:    navigator.cookieEnabled,
      online:             navigator.onLine,

      // Connection
      connection_type:     conn ? (conn.effectiveType || conn.type || 'unknown') : 'unknown',
      connection_downlink: conn ? (conn.downlink || null) : null,
      connection_rtt:      conn ? (conn.rtt || null) : null,
      save_data:           conn ? (conn.saveData || false) : false,

      // OS / Browser detection (basic)
      is_ios:      /iPhone|iPad|iPod/.test(ua),
      is_android:  /Android/.test(ua),
      is_chrome:   /Chrome/.test(ua) && !/Edg/.test(ua),
      is_firefox:  /Firefox/.test(ua),
      is_safari:   /Safari/.test(ua) && !/Chrome/.test(ua),
      is_edge:     /Edg/.test(ua),
    };
  }

  var deviceInfo = getDeviceInfo();

  // ============================================================
  // 3. PAGE INFO
  // ============================================================

  function getPageInfo() {
    return {
      url:           window.location.href,
      path:          window.location.pathname,
      hostname:      window.location.hostname,
      referrer:      document.referrer,
      title:         document.title,
      query_string:  window.location.search,
      hash:          window.location.hash,
      page_load_time: performance.timing
        ? (performance.timing.loadEventEnd - performance.timing.navigationStart)
        : null,
    };
  }

  function getNavigationTimingMs() {
    try {
      var list = performance.getEntriesByType && performance.getEntriesByType('navigation');
      var nav = list && list[0];
      if (nav && nav.loadEventEnd > 0) {
        return Math.round(nav.loadEventEnd - nav.startTime);
      }
    } catch (e) { /* skip */ }
    if (performance.timing && performance.timing.loadEventEnd && performance.timing.navigationStart) {
      var v = performance.timing.loadEventEnd - performance.timing.navigationStart;
      return v > 0 ? v : null;
    }
    return null;
  }

  function inferPageContext() {
    var path = (window.location.pathname || '/').toLowerCase();
    var params = new URLSearchParams(window.location.search || '');
    var qKeys = ['q', 'query', 'search', 'keyword'];
    var searchQuery = '';
    for (var qi = 0; qi < qKeys.length; qi++) {
      var qv = params.get(qKeys[qi]);
      if (qv) {
        searchQuery = String(qv).slice(0, 200);
        break;
      }
    }
    var segments = path.split('/').filter(function (s) { return s.length > 0; });
    var lastSeg = segments.length ? segments[segments.length - 1] : '';

    var t = 'other';
    if (path === '/' || path === '/index.html' || /\/home\/?$/.test(path)) {
      t = 'home';
    } else if (/\/cart|\/basket|\/bag(\/|$)/.test(path)) {
      t = 'cart';
    } else if (/\/checkout/.test(path)) {
      t = 'checkout';
    } else if (/\/account|\/profile|\/my-account|\/login|\/signin/.test(path)) {
      t = 'account';
    } else if (/success|thank|confirmation|order-complete|order_success|order-received/.test(path)) {
      t = 'order_success';
    } else if (path.indexOf('/search') !== -1 || searchQuery) {
      t = 'search';
    } else if (/\/products?\/|\/product\/|\/p\//.test(path)) {
      t = 'product';
    } else if (/\/collection|\/category|\/categories\/|\/c\//.test(path)) {
      t = 'category';
    }

    return {
      detected_page_type:   t,
      search_query_from_url: searchQuery || null,
      product_slug:         (t === 'product' && lastSeg) ? lastSeg.slice(0, 200) : null,
      category_slug:        (t === 'category' && lastSeg) ? lastSeg.slice(0, 200) : null,
    };
  }

  function likelyLoggedInFromDom() {
    if (!document.body) return false;
    var c = ' ' + document.body.className + ' ';
    var markers = ['logged-in', 'customer-logged-in', 'user-logged-in', 'is-logged-in', 'account-logged-in', 'loggedin', 'user-logged'];
    for (var mi = 0; mi < markers.length; mi++) {
      if (c.indexOf(' ' + markers[mi] + ' ') !== -1) return true;
    }
    return false;
  }

  var jsonLdHintsCache = null;

  function truncateField(s, max) {
    if (s == null) return null;
    s = String(s);
    return s.length > max ? s.slice(0, max) : s;
  }

  function isProductLdType(t) {
    if (!t) return false;
    if (t === 'Product') return true;
    if (Object.prototype.toString.call(t) === '[object Array]') {
      for (var i = 0; i < t.length; i++) if (t[i] === 'Product') return true;
    }
    return false;
  }

  function extractJsonLdProduct(obj, out) {
    if (!obj || typeof obj !== 'object') return;
    if (isProductLdType(obj['@type'])) {
      if (obj.name) out.jsonld_product_name = truncateField(obj.name, 200);
      if (obj.sku != null) out.jsonld_product_sku = truncateField(String(obj.sku), 120);
      if (obj.productID != null) out.jsonld_product_id = truncateField(String(obj.productID), 120);
      var offers = obj.offers;
      if (offers) {
        var off = Object.prototype.toString.call(offers) === '[object Array]' ? offers[0] : offers;
        if (off && off.price != null) {
          var pr = typeof off.price === 'number' ? off.price : parseFloat(off.price);
          if (!isNaN(pr)) out.jsonld_product_price = pr;
        }
      }
      if (obj.brand && typeof obj.brand === 'object' && obj.brand.name) {
        out.jsonld_product_brand = truncateField(obj.brand.name, 100);
      }
    }
    var g = obj['@graph'];
    if (g && Object.prototype.toString.call(g) === '[object Array]') {
      for (var gi = 0; gi < g.length; gi++) extractJsonLdProduct(g[gi], out);
    }
  }

  function getJsonLdProductHints() {
    if (jsonLdHintsCache !== null) return jsonLdHintsCache;
    var out = {};
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    var maxScripts = 8;
    for (var si = 0; si < scripts.length && si < maxScripts; si++) {
      try {
        var txt = scripts[si].textContent || '';
        if (txt.length > 500000) continue;
        var data = JSON.parse(txt);
        extractJsonLdProduct(data, out);
        if (Object.keys(out).length) break;
      } catch (e) { /* invalid JSON */ }
    }
    jsonLdHintsCache = out;
    return out;
  }

  // ============================================================
  // 4. REAL-TIME TRACKING STATE
  // ============================================================

  var state = {
    // Scroll
    max_scroll_pct:    0,
    max_scroll_px:     0,
    scroll_events:     0,
    scroll_up_count:   0,
    scroll_down_count: 0,
    last_scroll_y:     0,
    last_scroll_ts:    0,
    last_scroll_y_vel: null,
    scroll_velocity_px_per_s: 0,
    max_scroll_velocity_px_per_s: 0,

    // Engagement
    click_count:       0,
    right_click_count: 0,
    mousemove_count:   0,
    last_mouse_x:      0,
    last_mouse_y:      0,
    key_press_count:   0,

    // Attention
    idle_time_ms:      0,
    active_time_ms:    0,
    last_active:       Date.now(),
    is_idle:           false,
    idle_threshold_ms: 5000,

    // Tab/Focus
    tab_hidden_count:  0,
    tab_hidden_ms:     0,
    tab_hidden_start:  null,
    focus_count:       0,
    blur_count:        0,

    // Copy/paste
    copy_count:        0,
    paste_count:       0,
    copied_text_len:   0,

    // Forms
    form_focus_count:  0,
    form_blur_count:   0,
    form_fields_touched: new Set(),

    // Cart (data-ca атрибутаар)
    cart_add_count:    0,
    cart_remove_count: 0,
    last_cart_value:   0,

    // Rage click
    rage_last_fp:      '',
    rage_last_ts:      0,
    rage_last_x:       0,
    rage_last_y:       0,
    rage_streak:       0,
    rage_click_bursts: 0,
    rage_quiet_until:  0,

    // Errors / outbound
    js_error_count:       0,
    js_error_window:      [],
    outbound_click_count: 0,

    // Intersection / popup / purchase (README §10)
    product_impressions_distinct: 0,
    popup_open_count:             0,

    // Session timing
    start_time:        Date.now(),
    back_navigation:   false,
  };

  var productImpressionKeys = Object.create(null);
  var popupModalKeys        = Object.create(null);
  var popupCheckTimer       = null;

  // ============================================================
  // 5. EVENT LISTENERS
  // ============================================================

  // Scroll
  window.addEventListener('scroll', function () {
    var scrollY = window.scrollY || window.pageYOffset;
    var pageH   = document.body.scrollHeight - window.innerHeight;
    var pct     = pageH > 0 ? Math.round(scrollY / pageH * 100) : 0;
    var now     = Date.now();

    if (scrollY > state.last_scroll_y) state.scroll_down_count++;
    else state.scroll_up_count++;

    if (state.last_scroll_ts && state.last_scroll_y_vel != null) {
      var dt = now - state.last_scroll_ts;
      if (dt > 0) {
        var dy = Math.abs(scrollY - state.last_scroll_y_vel);
        var v = Math.round((dy / dt) * 1000);
        state.scroll_velocity_px_per_s = v;
        if (v > state.max_scroll_velocity_px_per_s) state.max_scroll_velocity_px_per_s = v;
      }
    }
    state.last_scroll_ts = now;
    state.last_scroll_y_vel = scrollY;

    state.last_scroll_y    = scrollY;
    state.max_scroll_px    = Math.max(state.max_scroll_px, scrollY);
    state.max_scroll_pct   = Math.max(state.max_scroll_pct, pct);
    state.scroll_events++;
    state.last_active      = now;
  }, { passive: true });

  function clickTargetFingerprint(el) {
    if (!el || !el.tagName) return '';
    var tag = el.tagName.toLowerCase();
    var id = el.id ? '#' + el.id : '';
    var cls = el.className && typeof el.className === 'string'
      ? el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
    var ca = el.getAttribute && el.getAttribute('data-ca');
    return tag + id + (cls ? '.' + cls : '') + (ca ? '[ca=' + ca + ']' : '');
  }

  if (TR >= 2) {
    window.addEventListener('popstate', function () { state.back_navigation = true; });
  }

  // Outbound link (T2+)
  if (TR >= 2) {
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest && e.target.closest('a[href]');
      if (!t || !t.href) return;
      try {
        var u = new URL(t.href, window.location.href);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
        if (u.hostname === window.location.hostname) return;
        state.outbound_click_count++;
        sendEvent('outbound_click', {
          action_detected: 'outbound_click',
          outbound_click: state.outbound_click_count,
        });
      } catch (err) { /* skip */ }
    }, true);
  }

  // Click
  document.addEventListener('click', function (e) {
    state.click_count++;
    state.last_mouse_x = e.clientX;
    state.last_mouse_y = e.clientY;
    var now = Date.now();
    state.last_active = now;

    // Rage click (ижил target ойролцоо координат, 700ms дотор 3+)
    var tgt = e.target && e.target.nodeType === 1 ? e.target : document.body;
    var fp = clickTargetFingerprint(tgt.closest ? tgt.closest('a,button,[role=button],input') || tgt : tgt);
    if (!fp) fp = clickTargetFingerprint(tgt);
    var dist = Math.abs(e.clientX - state.rage_last_x) + Math.abs(e.clientY - state.rage_last_y);
    if (fp === state.rage_last_fp && (now - state.rage_last_ts) < 700 && dist < 50) {
      state.rage_streak++;
    } else {
      state.rage_streak = 1;
    }
    state.rage_last_fp = fp;
    state.rage_last_ts = now;
    state.rage_last_x = e.clientX;
    state.rage_last_y = e.clientY;
    if (TR >= 2 && state.rage_streak >= 3 && now > state.rage_quiet_until) {
      state.rage_click_bursts++;
      state.rage_quiet_until = now + 2000;
      sendEvent('rage_click', {
        action_detected: 'rage_click',
        rage_click: state.rage_click_bursts,
      });
    }

    // data-ca атрибутаар cart event илрүүлэх (T1 only)
    if (TR >= 3) {
      var el = e.target.closest('[data-ca]');
      if (el) {
        var action = el.getAttribute('data-ca');
        if (action === 'cart_add')    state.cart_add_count++;
        if (action === 'cart_remove') state.cart_remove_count++;
        var cartVal = parseFloat(el.getAttribute('data-ca-value'));
        if (!isNaN(cartVal)) state.last_cart_value = cartVal;

        var ex = {
          action_detected: action,
          product_id: el.getAttribute('data-ca-id'),
          product_category: el.getAttribute('data-ca-cat'),
          product_price: parseFloat(el.getAttribute('data-ca-price')) || null,
          selected_size: el.getAttribute('data-ca-size'),
          selected_quantity: parseFloat(el.getAttribute('data-ca-qty')) || null,
          product_availability: el.getAttribute('data-ca-availability'),
          checkout_step: el.getAttribute('data-ca-step'),
          payment_method: el.getAttribute('data-ca-payment'),
          shipping_method: el.getAttribute('data-ca-shipping'),
          order_total: parseFloat(el.getAttribute('data-ca-order-total')) || null,
          discount_code: el.getAttribute('data-ca-discount'),
          is_sale: el.getAttribute('data-ca-sale') === 'true' || el.getAttribute('data-ca-sale') === '1',
          product_variant: el.getAttribute('data-ca-variant'),
          product_stock: el.getAttribute('data-ca-stock'),
          cart_item_count: parseFloat(el.getAttribute('data-ca-cart-count')) || null,
        };
        if (!isNaN(cartVal)) ex.cart_value = cartVal;
        sendEvent(action, ex);
      }
    }
  });

  // Right click
  document.addEventListener('contextmenu', function () {
    state.right_click_count++;
  });

  // Mouse move (throttled)
  var lastMouseMove = 0;
  document.addEventListener('mousemove', function (e) {
    var now = Date.now();
    if (now - lastMouseMove > 500) {
      state.mousemove_count++;
      state.last_mouse_x = e.clientX;
      state.last_mouse_y = e.clientY;
      state.last_active  = now;
      lastMouseMove = now;
    }
  });

  // Keyboard
  document.addEventListener('keydown', function () {
    state.key_press_count++;
    state.last_active = Date.now();
  });

  // Copy
  document.addEventListener('copy', function () {
    state.copy_count++;
    var sel = window.getSelection ? window.getSelection().toString() : '';
    state.copied_text_len = sel.length;
    sendEvent('copy', {});
  });

  // Paste
  document.addEventListener('paste', function () {
    state.paste_count++;
    sendEvent('paste', {});
  });

  // Tab visibility
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      state.tab_hidden_count++;
      state.tab_hidden_start = Date.now();
      sendEvent('tab_hidden', {});
    } else {
      if (state.tab_hidden_start) {
        state.tab_hidden_ms += Date.now() - state.tab_hidden_start;
        state.tab_hidden_start = null;
      }
      state.focus_count++;
      sendEvent('tab_visible', {});
    }
  });

  // Window focus/blur
  window.addEventListener('blur',  function () { state.blur_count++;  });
  window.addEventListener('focus', function () { state.focus_count++; });

  // Form interaction
  document.addEventListener('focusin', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
      state.form_focus_count++;
      var name = e.target.name || e.target.id || e.target.type;
      if (name) state.form_fields_touched.add(name);
    }
  });
  document.addEventListener('focusout', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
      state.form_blur_count++;
    }
  });

  // Search
  document.addEventListener('submit', function (e) {
    var form  = e.target;
    var input = form.querySelector('input[type=search],input[name=q],input[name=search],input[name=keyword]');
    if (input && input.value) {
      sendEvent('search', {
        action_detected: 'search',
        search_query: input.value.slice(0, 200),
      });
    }
  });

  // Idle detection
  setInterval(function () {
    var now    = Date.now();
    var idle   = now - state.last_active;
    if (idle > state.idle_threshold_ms) {
      if (!state.is_idle) {
        state.is_idle = true;
        sendEvent('idle_start', {});
      }
      state.idle_time_ms += 1000;
    } else {
      if (state.is_idle) {
        state.is_idle = false;
        sendEvent('idle_end', {});
      }
      state.active_time_ms += 1000;
    }
  }, 1000);

  // ============================================================
  // 6. SEND EVENT FUNCTION
  // ============================================================

  function buildBasePayload(eventType) {
    var now = Date.now();
    var pageInfo = getPageInfo();
    var navMs = getNavigationTimingMs();
    var plMs = (navMs != null && navMs > 0) ? navMs : pageInfo.page_load_time;
    if (plMs != null && plMs <= 0) plMs = null;

    var ctx = inferPageContext();
    var fsc = inferFilterSortCoupon();

    var raw = {
      event_type: eventType,
      visitor_id: visitor.id,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      url: pageInfo.url,
      path: pageInfo.path,
      referrer: pageInfo.referrer,
      visit_count: visitor.visit_count,
      page_load_ms: plMs,
      device_type: deviceInfo.device_type,
      language: deviceInfo.browser_language,
      timezone: deviceInfo.timezone,
      time_on_page_sec: Math.round((now - sessionStart) / 1000),
      max_scroll_pct: state.max_scroll_pct,
      scroll_up_count: state.scroll_up_count,
      click_count: state.click_count,
      active_time_ms: state.active_time_ms,
      tab_hidden_count: state.tab_hidden_count,
      tab_hidden_ms: state.tab_hidden_ms,
      copy_count: state.copy_count,
      form_fields_count: state.form_fields_touched.size,
      form_fields_touched: Array.from(state.form_fields_touched).join(','),
      is_logged_in: likelyLoggedInFromDom(),
      page_view_count: _pageViewCountSession,
      rage_click: state.rage_click_bursts,
      outbound_click: state.outbound_click_count,
      js_error: state.js_error_count,
    };

    if (TR >= 2) {
      raw.detected_page_type = ctx.detected_page_type;
      raw.search_query_from_url = ctx.search_query_from_url || null;
      raw.product_slug = ctx.product_slug || null;
      raw.is_order_success = ctx.detected_page_type === 'order_success';
      raw.checkout_step_detected = inferCheckoutStepDetected();
      if (fsc.filter_name) raw.filter_name = fsc.filter_name;
      if (fsc.coupon_entered) raw.coupon_entered = fsc.coupon_entered;
      if (state.back_navigation) raw.back_navigation = true;
    }

    if (TR >= 3) {
      Object.assign(raw, mergeWindowCaUserFull());
    } else if (window._ca_user) {
      var u = window._ca_user;
      if (u.customer_type != null) raw.customer_type = u.customer_type;
      if (u.is_logged_in != null) raw.is_logged_in = !!u.is_logged_in;
    }

    return raw;
  }

  function sendEvent(eventType, extra, opts) {
    opts = opts || {};
    var merged = Object.assign(buildBasePayload(eventType), extra || {});
    var payload = pickKeys(merged, keysForCurrentTier());
    var body = JSON.stringify(payload);
    // sendBeacon + application/json олон хөтөч (ялангуяа гар утас) дээр зөвхөн
    // sendBeacon: зарим хөтөч дээр POST огт очдоггүй. fetch + CORS нь найдвартай.
    // beforeunload: keepalive: true (хязгаар ~64KB)
    fetch(OBSERVER_URL, {
      method:      'POST',
      headers:     {
        'Content-Type': 'application/json',
        'X-API-Key':    API_KEY,
      },
      body:        body,
      mode:        'cors',
      credentials: 'omit',
      keepalive:   !!opts.keepalive,
    }).catch(function (err) {
      if (typeof window !== 'undefined' && window.__OBSERVER_DEBUG__) {
        console.warn('[Observer] POST failed', OBSERVER_URL, err);
      }
    });
  }

  function canSendJsError() {
    var w = state.js_error_window;
    var cutoff = Date.now() - 60000;
    while (w.length && w[0] < cutoff) w.shift();
    return w.length < 5;
  }

  function recordJsErrorSend() {
    state.js_error_window.push(Date.now());
  }

  if (TR >= 2) {
    window.addEventListener('error', function (ev) {
      if (!canSendJsError()) return;
      state.js_error_count++;
      recordJsErrorSend();
      var msg = (ev && ev.message) ? String(ev.message).slice(0, 500) : 'error';
      var src = (ev && ev.filename) ? String(ev.filename).slice(0, 300) : '';
      sendEvent('js_error', {
        action_detected: 'js_error',
        js_error: state.js_error_count,
      });
    });

    window.addEventListener('unhandledrejection', function (ev) {
      if (!canSendJsError()) return;
      state.js_error_count++;
      recordJsErrorSend();
      var reason = ev && ev.reason;
      var msg = reason && reason.message ? String(reason.message) : String(reason || 'rejection');
      sendEvent('js_error', {
        action_detected: 'js_error',
        js_error: state.js_error_count,
      });
    });
  }

  // ============================================================
  // 6b. INTERSECTION — бараа viewport-д анх орох
  // ============================================================

  var MAX_PRODUCT_IO_NODES = 50;
  var MAX_PRODUCT_IMP_EVENTS = 30;

  function productVisibilityHint(el) {
    if (!el || el.nodeType !== 1) return '';
    var id = el.getAttribute('data-product-id') || el.getAttribute('data-ca-id')
      || el.getAttribute('data-product') || el.getAttribute('data-product-sku');
    if (id) return 'id:' + String(id).slice(0, 80);
    if (el.tagName === 'A' && el.href) {
      try {
        var pu = new URL(el.href, window.location.href);
        if (pu.hostname === window.location.hostname && /\/product/i.test(pu.pathname)) {
          return 'path:' + pu.pathname.slice(0, 80);
        }
      } catch (e) { /* skip */ }
    }
    var tid = el.id ? ('#' + el.id) : '';
    var cls = el.className && typeof el.className === 'string'
      ? el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
    return (el.tagName.toLowerCase() + tid + (cls ? '.' + cls : '')).slice(0, 100);
  }

  function setupProductImpressionObserver() {
    if (!window.IntersectionObserver) return;
    var custom = window.__CA_PRODUCT_SELECTOR;
    var sel = typeof custom === 'string' && custom.trim()
      ? custom.trim()
      : '[data-product-id],[data-ca-id],[data-product],[data-product-sku],.product-card,.product-item,.product-tile,.grid-product,[class*="product-card"],[class*="ProductCard"],article[class*="product"]';
    var nodes;
    try {
      nodes = document.querySelectorAll(sel);
    } catch (e) {
      return;
    }
    var n = Math.min(nodes.length, MAX_PRODUCT_IO_NODES);
    if (!n) return;

    var pvSeq = 0;
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var en = entries[i];
        if (!en.isIntersecting || en.intersectionRatio < 0.12) continue;
        var el = en.target;
        var hint = productVisibilityHint(el);
        var key = hint;
        if (!key) {
          if (!el._caUq) el._caUq = 'uq_' + (++pvSeq);
          key = el._caUq;
        }
        if (productImpressionKeys[key]) continue;
        if (state.product_impressions_distinct >= MAX_PRODUCT_IMP_EVENTS) continue;
        productImpressionKeys[key] = 1;
        state.product_impressions_distinct++;
        sendEvent('product_impression', {
          action_detected: 'product_impression',
          product_id: String(hint || '').slice(0, 120),
        });
      }
    }, { root: null, rootMargin: '0px 0px -8% 0px', threshold: [0.12, 0.35] });

    for (var j = 0; j < n; j++) {
      try {
        io.observe(nodes[j]);
      } catch (e2) { /* skip */ }
    }
  }

  // ============================================================
  // 6c. MUTATION — modal / popup харагдах
  // ============================================================

  function isElementVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return false;
    var st = window.getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return false;
    return true;
  }

  function modalFingerprint(el) {
    var rid = el.id ? String(el.id).slice(0, 80) : '';
    var rc = el.className && typeof el.className === 'string'
      ? el.className.split(/\s+/).filter(Boolean).slice(0, 3).join('.') : '';
    var role = el.getAttribute('role') || el.tagName.toLowerCase();
    return (role + '|' + rid + '|' + rc).slice(0, 150);
  }

  function scanVisibleModalsAndFire() {
    var custom = window.__CA_POPUP_SELECTOR;
    var sel = typeof custom === 'string' && custom.trim()
      ? custom.trim()
      : '[role="dialog"][aria-modal="true"],dialog[open],[aria-modal="true"],.modal.show,.modal.in,.modal.is-open,[class*="modal"][class*="open"]';
    var list;
    try {
      list = document.querySelectorAll(sel);
    } catch (e) {
      return;
    }
    for (var i = 0; i < list.length && i < 40; i++) {
      var m = list[i];
      if (!isElementVisible(m)) continue;
      if (m.getAttribute('aria-hidden') === 'true') continue;
      var fp = modalFingerprint(m);
      if (!fp || popupModalKeys[fp]) continue;
      popupModalKeys[fp] = 1;
      state.popup_open_count++;
      sendEvent('popup_open', { action_detected: 'popup_open' });
    }
  }

  function schedulePopupScan() {
    if (popupCheckTimer) return;
    popupCheckTimer = setTimeout(function () {
      popupCheckTimer = null;
      try {
        scanVisibleModalsAndFire();
      } catch (e) { /* skip */ }
    }, 250);
  }

  function setupPopupMutationObserver() {
    var root = document.body || document.documentElement;
    if (!root || !window.MutationObserver) return;
    var mo = new MutationObserver(function () {
      schedulePopupScan();
    });
    try {
      mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'open', 'aria-hidden', 'aria-modal'] });
    } catch (e) { /* skip */ }
    schedulePopupScan();
  }

  // ============================================================
  // 6d. PURCHASE — амжилттай захиалгын хуудас (URL heuristic)
  // ============================================================

  function maybeFirePurchaseHeuristic() {
    var ctx = inferPageContext();
    if (ctx.detected_page_type !== 'order_success') return;
    var pathKey = window.location.pathname + window.location.search;
    var flag = sessionStorage.getItem('_ca_purchase_path');
    if (flag === pathKey) return;
    sessionStorage.setItem('_ca_purchase_path', pathKey);

    visitor.purchased_before = true;
    setCookie('_ca_visitor', JSON.stringify(visitor), 365);

    var extra = { action_detected: 'purchase', is_order_success: true };
    if (TR >= 3) {
      try {
        jsonLdHintsCache = null;
        var hints = getJsonLdProductHints();
        if (hints && hints.jsonld_product_price != null) {
          extra.order_total = hints.jsonld_product_price;
        }
      } catch (e2) { /* skip */ }
    }
    sendEvent('purchase', extra);
  }

  function bootDomObservers() {
    if (TR >= 2) {
      try {
        setupProductImpressionObserver();
      } catch (e) { /* skip */ }
    }
    if (TR >= 2) {
      try {
        setupPopupMutationObserver();
      } catch (e) { /* skip */ }
    }
    if (TR >= 3) {
      setTimeout(function () {
        try {
          maybeFirePurchaseHeuristic();
        } catch (e2) { /* skip */ }
      }, 800);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootDomObservers);
  } else {
    setTimeout(bootDomObservers, 0);
  }

  // ============================================================
  // 7. AUTOMATIC EVENTS
  // ============================================================

  // Page view — хуудас нээгдэхэд
  sendEvent('page_view');

  // Session end — хуудас хаахад
  window.addEventListener('beforeunload', function () {
    sendEvent(
      'session_end',
      {
        session_duration_sec: Math.round((Date.now() - sessionStart) / 1000),
        bounce: state.click_count === 0 && state.scroll_events < 3,
      },
      { keepalive: true }
    );
  });

  // Periodic heartbeat — 30 секунд тутам
  setInterval(function () {
    sendEvent('heartbeat', {});
  }, 30000);

  // ============================================================
  // 8. EXPOSE GLOBALLY — console-оос туршихад
  // ============================================================
  window._ca = {
    sendEvent: sendEvent,
    get state() {
      var copy = {};
      for (var k in state) {
        if (Object.prototype.hasOwnProperty.call(state, k)) {
          copy[k] = state[k] instanceof Set ? Array.from(state[k]) : state[k];
        }
      }
      return copy;
    },
    visitor:   visitor,
    sessionId: sessionId,
    /** Гараар conversion: sendPurchase({ order_id: '…', value: 99 }) */
    sendPurchase: function (extra) {
      visitor.purchased_before = true;
      setCookie('_ca_visitor', JSON.stringify(visitor), 365);
      var ex = Object.assign({ action_detected: 'purchase', is_order_success: true }, extra || {});
      sendEvent('purchase', ex);
    },
  };

  console.log('[Observer]', OBSERVER_TIER, 'POST →', OBSERVER_URL, '| Session:', sessionId, '| Visit #', visitor.visit_count);
})();
