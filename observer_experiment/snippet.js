/**
 * Observer Experiment Snippet
 * Браузераас авч болох БҮХИЙ ЛЭ өгөгдлийг цуглуулна.
 * Туршилтын зорилготой — дараа нь хэрэгтэй зүйлсийг л үлдээнэ.
 *
 * Суулгах: </body>-с өмнө нэмэх
 * <script src="http://localhost:8001/static/snippet.js"></script>
 *
 * LAN / өөр төхөөрөмөөс туршихад script src-д өөрийн PC-ийн LAN IP ашиглана
 * (жишээ нь http://192.168.1.5:8001/static/snippet.js) — өгөгдөл /collect руу явна.
 *
 * Талбарууд, e-commerce heuristics: README §9–§10.
 */

(function () {
  'use strict';

  function getObserverBase() {
    var s = document.currentScript;
    if (s && s.src) {
      try {
        return new URL(s.src).origin;
      } catch (e) { /* fall through */ }
    }
    // next/script зэрэг async inject хийхэд currentScript ихэвчлэн null
    var nodes = document.querySelectorAll('script[src*="snippet.js"]');
    var tag = nodes[nodes.length - 1];
    if (tag && tag.src) {
      try {
        return new URL(tag.src).origin;
      } catch (e) { /* fall through */ }
    }
    return 'http://localhost:8001';
  }

  var OBSERVER_BASE = getObserverBase();
  // /track ихэнх adblock/privacy шүүлтүүрт тусгайлан блоклогддог тул /collect ашиглана
  var OBSERVER_URL = OBSERVER_BASE + '/collect';

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
      visitor.days_since_first = Math.floor(
        (Date.now() - new Date(visitor.first_visit).getTime()) / 86400000
      );
    } catch (e) {
      visitor = null;
    }
  }
  if (!visitor) {
    visitor = {
      id:          generateId('v'),
      visit_count: 1,
      first_visit: new Date().toISOString(),
      last_visit:  new Date().toISOString(),
      days_since_first: 0,
      purchased_before: false,
      cart_abandoned_count: 0,
    };
  }
  setCookie('_ca_visitor', JSON.stringify(visitor), 365);

  // Session (localStorage — tab хаагдах хүртэл)
  var sessionId = sessionStorage.getItem('_ca_session');
  if (!sessionId) {
    sessionId = generateId('s');
    sessionStorage.setItem('_ca_session', sessionId);
  }

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

  var CA_USER_SKIP = /email|password|token|secret|ssn|passwd|credential|creditcard|cardnumber|authorization/i;

  function mergeCaUserPrimitives() {
    var u = window._ca_user;
    var out = {};
    if (!u || typeof u !== 'object') return out;
    var n = 0;
    for (var k in u) {
      if (!Object.prototype.hasOwnProperty.call(u, k)) continue;
      if (CA_USER_SKIP.test(k)) continue;
      var v = u[k];
      var tp = typeof v;
      if (tp !== 'string' && tp !== 'number' && tp !== 'boolean') continue;
      if (tp === 'string' && v.length > 500) v = v.slice(0, 500);
      out['ca_user_' + k] = v;
      n++;
      if (n >= 24) break;
    }
    return out;
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

  // Outbound link (capture — data-ca-аас өмнө)
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('a[href]');
    if (!t || !t.href) return;
    try {
      var u = new URL(t.href, window.location.href);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
      if (u.hostname === window.location.hostname) return;
      state.outbound_click_count++;
      var pathPrefix = (u.pathname || '/').split('/').slice(0, 3).join('/') || '/';
      sendEvent('outbound_click', {
        outbound_host:        u.hostname.slice(0, 120),
        outbound_path_prefix: pathPrefix.slice(0, 120),
      });
    } catch (err) { /* skip */ }
  }, true);

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
    if (state.rage_streak >= 3 && now > state.rage_quiet_until) {
      state.rage_click_bursts++;
      state.rage_quiet_until = now + 2000;
      sendEvent('rage_click', {
        rage_target_hint:   fp.slice(0, 200),
        rage_click_streak:  state.rage_streak,
      });
    }

    // data-ca атрибутаар cart event илрүүлэх
    var el = e.target.closest('[data-ca]');
    if (el) {
      var action = el.getAttribute('data-ca');
      if (action === 'cart_add')    state.cart_add_count++;
      if (action === 'cart_remove') state.cart_remove_count++;
      var cartVal = parseFloat(el.getAttribute('data-ca-value'));
      if (!isNaN(cartVal)) state.last_cart_value = cartVal;

      sendEvent(action, {
        product_id:       el.getAttribute('data-ca-id'),
        product_category: el.getAttribute('data-ca-cat'),
        product_price:    parseFloat(el.getAttribute('data-ca-price')) || null,
        cart_value:       cartVal || null,
        cart_step:        el.getAttribute('data-ca-step'),
        element_text:     el.innerText ? el.innerText.slice(0, 50) : null,
        click_x:          e.clientX,
        click_y:          e.clientY,
      });
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
    sendEvent('copy', {
      copied_text_length: sel.length,
      // Агуулгыг илгээхгүй — хувийн мэдээлэл байж болно
    });
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
      sendEvent('tab_visible', {
        hidden_duration_ms: state.tab_hidden_ms,
      });
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
        query:        input.value.slice(0, 100),
        query_length: input.value.length,
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
        sendEvent('idle_start', { idle_after_ms: idle });
      }
      state.idle_time_ms += 1000;
    } else {
      if (state.is_idle) {
        state.is_idle = false;
        sendEvent('idle_end', { idle_duration_ms: state.idle_time_ms });
      }
      state.active_time_ms += 1000;
    }
  }, 1000);

  // ============================================================
  // 6. SEND EVENT FUNCTION
  // ============================================================

  function buildBasePayload(eventType) {
    var now      = Date.now();
    var pageInfo = getPageInfo();
    var navMs    = getNavigationTimingMs();
    var plMs     = (navMs != null && navMs > 0) ? navMs : pageInfo.page_load_time;
    if (plMs != null && plMs <= 0) plMs = null;

    var base = {
      // Identity
      event_type:       eventType,
      visitor_id:       visitor.id,
      session_id:       sessionId,
      timestamp:        new Date().toISOString(),

      // Visitor history
      visit_count:      visitor.visit_count,
      first_visit:      visitor.first_visit,
      last_visit:       visitor.last_visit,
      days_since_first: visitor.days_since_first,
      purchased_before: visitor.purchased_before,
      cart_abandoned_count: visitor.cart_abandoned_count,

      // Page
      url:              pageInfo.url,
      path:             pageInfo.path,
      referrer:         pageInfo.referrer,
      title:            pageInfo.title,
      query_string:     pageInfo.query_string,
      page_load_ms:     plMs,

      // Device
      device_type:        deviceInfo.device_type,
      screen_width:       deviceInfo.screen_width,
      screen_height:      deviceInfo.screen_height,
      viewport_width:     deviceInfo.viewport_width,
      viewport_height:    deviceInfo.viewport_height,
      pixel_ratio:        deviceInfo.device_pixel_ratio,
      color_depth:        deviceInfo.color_depth,
      orientation:        deviceInfo.orientation,
      language:           deviceInfo.browser_language,
      browser_languages:  deviceInfo.browser_languages,
      timezone:           deviceInfo.timezone,
      do_not_track:       deviceInfo.do_not_track,
      cookies_enabled:    deviceInfo.cookies_enabled,
      online:             deviceInfo.online,
      connection_type:    deviceInfo.connection_type,
      connection_speed:   deviceInfo.connection_downlink,
      connection_rtt:     deviceInfo.connection_rtt,
      save_data:          deviceInfo.save_data,
      is_ios:             deviceInfo.is_ios,
      is_android:         deviceInfo.is_android,
      is_chrome:          deviceInfo.is_chrome,
      is_firefox:         deviceInfo.is_firefox,
      is_safari:          deviceInfo.is_safari,
      is_edge:            deviceInfo.is_edge,

      // URL / e-commerce heuristics (README §10)
      likely_logged_in: likelyLoggedInFromDom(),

      // Session state
      time_on_page_ms:      now - sessionStart,
      time_on_page_sec:     Math.round((now - sessionStart) / 1000),
      max_scroll_pct:       state.max_scroll_pct,
      max_scroll_px:        state.max_scroll_px,
      scroll_events:        state.scroll_events,
      scroll_up_count:      state.scroll_up_count,
      scroll_down_count:    state.scroll_down_count,
      scroll_velocity_px_per_s:     state.scroll_velocity_px_per_s,
      max_scroll_velocity_px_per_s: state.max_scroll_velocity_px_per_s,
      click_count:          state.click_count,
      right_click_count:    state.right_click_count,
      key_press_count:      state.key_press_count,
      last_mouse_x:         state.last_mouse_x,
      last_mouse_y:         state.last_mouse_y,
      idle_time_ms:         state.idle_time_ms,
      active_time_ms:       state.active_time_ms,
      tab_hidden_count:     state.tab_hidden_count,
      tab_hidden_ms:        state.tab_hidden_ms,
      copy_count:           state.copy_count,
      paste_count:          state.paste_count,
      copied_text_len:      state.copied_text_len,
      form_fields_count:    state.form_fields_touched.size,
      form_fields_touched:  Array.from(state.form_fields_touched).join(','),

      // Cart state
      cart_add_count:       state.cart_add_count,
      cart_remove_count:    state.cart_remove_count,
      last_cart_value:      state.last_cart_value,

      rage_click_bursts:    state.rage_click_bursts,
      js_error_count:       state.js_error_count,
      outbound_click_count: state.outbound_click_count,

      product_impressions_distinct: state.product_impressions_distinct,
      popup_open_count:             state.popup_open_count,
    };

    Object.assign(base, inferPageContext());
    Object.assign(base, getJsonLdProductHints());
    Object.assign(base, mergeCaUserPrimitives());
    return base;
  }

  function sendEvent(eventType, extra, opts) {
    opts = opts || {};
    var payload = Object.assign(buildBasePayload(eventType), extra || {});
    var body = JSON.stringify(payload);
    // sendBeacon + application/json олон хөтөч (ялангуяа гар утас) дээр зөвхөн
    // sendBeacon: зарим хөтөч дээр POST огт очдоггүй. fetch + CORS нь найдвартай.
    // beforeunload: keepalive: true (хязгаар ~64KB)
    fetch(OBSERVER_URL, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      body:        body,
      mode:        'cors',
      credentials: 'omit',
      keepalive:   !!opts.keepalive,
    }).catch(function () {});
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

  window.addEventListener('error', function (ev) {
    if (!canSendJsError()) return;
    state.js_error_count++;
    recordJsErrorSend();
    var msg = (ev && ev.message) ? String(ev.message).slice(0, 500) : 'error';
    var src = (ev && ev.filename) ? String(ev.filename).slice(0, 300) : '';
    sendEvent('js_error', {
      js_message: msg,
      js_source:  src,
      js_lineno:  ev && ev.lineno != null ? ev.lineno : null,
      js_colno:   ev && ev.colno != null ? ev.colno : null,
    });
  });

  window.addEventListener('unhandledrejection', function (ev) {
    if (!canSendJsError()) return;
    state.js_error_count++;
    recordJsErrorSend();
    var reason = ev && ev.reason;
    var msg = reason && reason.message ? String(reason.message) : String(reason || 'rejection');
    sendEvent('js_error', {
      js_message: msg.slice(0, 500),
      js_source:  'unhandledrejection',
      js_lineno:  null,
      js_colno:   null,
    });
  });

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
          product_visible_hint:             String(hint || '').slice(0, 120),
          products_visible_distinct_session: state.product_impressions_distinct,
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
      sendEvent('popup_open', {
        popup_hint: fp.slice(0, 120),
      });
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

    var extra = {
      purchase_source: 'url_order_success',
      purchase_path:   window.location.pathname.slice(0, 200),
    };
    var jprice = null;
    try {
      jsonLdHintsCache = null;
      var hints = getJsonLdProductHints();
      if (hints && hints.jsonld_product_price != null) jprice = hints.jsonld_product_price;
    } catch (e) { /* skip */ }
    if (jprice != null) extra.purchase_value_hint = jprice;

    sendEvent('purchase', extra);
  }

  function bootDomObservers() {
    try {
      setupProductImpressionObserver();
    } catch (e) { /* skip */ }
    try {
      setupPopupMutationObserver();
    } catch (e) { /* skip */ }
    // JSON-LD / DOM бүрэн ачаалахыг хүлээн захиалгын хуудас илрүүлнэ
    setTimeout(function () {
      try {
        maybeFirePurchaseHeuristic();
      } catch (e2) { /* skip */ }
    }, 800);
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
    // Cart abandoned шалгах
    if (state.cart_add_count > 0 && state.last_cart_value > 0) {
      visitor.cart_abandoned_count = (visitor.cart_abandoned_count || 0) + 1;
      setCookie('_ca_visitor', JSON.stringify(visitor), 365);
    }

    sendEvent(
      'session_end',
      {
        session_duration_ms:  Date.now() - sessionStart,
        session_duration_sec: Math.round((Date.now() - sessionStart) / 1000),
        total_active_sec:     Math.round(state.active_time_ms / 1000),
        total_idle_sec:       Math.round(state.idle_time_ms / 1000),
        bounce:               state.click_count === 0 && state.scroll_events < 3,
      },
      { keepalive: true }
    );
  });

  // Periodic heartbeat — 30 секунд тутам
  setInterval(function () {
    sendEvent('heartbeat', {
      heartbeat_interval_sec: 30,
    });
  }, 30000);

  // ============================================================
  // 8. EXPOSE GLOBALLY — console-оос туршихад
  // ============================================================
  window._ca = {
    sendEvent: sendEvent,
    state:     state,
    visitor:   visitor,
    sessionId: sessionId,
    /** Гараар conversion: sendPurchase({ order_id: '…', value: 99 }) */
    sendPurchase: function (extra) {
      visitor.purchased_before = true;
      setCookie('_ca_visitor', JSON.stringify(visitor), 365);
      sendEvent('purchase', Object.assign({ purchase_source: 'manual_api' }, extra || {}));
    },
  };

  console.log('[Observer] Started. POST →', OBSERVER_URL, '| Session:', sessionId, '| Visit #', visitor.visit_count);
})();
