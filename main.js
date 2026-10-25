'use strict';

;(function () {
  if (localStorage.getItem('ember-theme') === 'light') {
    document.documentElement.setAttribute('data-theme-preload', 'light');
  }
}());

;(function () {
  var s = document.createElement('style');
  s.textContent =
    '[data-theme-preload="light"] { filter: none; }' +
    '[data-theme-preload="light"] body,' +
    '[data-theme-preload="light"] :root {' +
    '  --bg:#FAF7F4;--text:#1A1512;--muted:#6B5F54;--card:#FFFFFF;' +
    '  --border:#E5DDD5;--nav-bg:#FFFFFF;--surface:#F5EFE9;' +
    '  --input-bg:#FFFFFF;--toggle-bg:rgba(0,0,0,0.05);' +
    '  --shadow-color:rgba(0,0,0,0.08);' +
    '}';
  document.head.appendChild(s);
}());

document.addEventListener('DOMContentLoaded', function () {

  var themeCheck = document.getElementById('themeCheck') || document.querySelector('.theme-check');
  if (themeCheck) {
    if (localStorage.getItem('ember-theme') === 'light') {
      themeCheck.checked = true;
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    themeCheck.addEventListener('change', function () {
      var isLight = this.checked;
      localStorage.setItem('ember-theme', isLight ? 'light' : 'dark');
      document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
    });
    document.documentElement.removeAttribute('data-theme-preload');
  }

  var CART_KEY = 'ember-cart';
  var COUPON_KEY = 'ember-applied-coupon';
  var ORDERS_KEY = 'ember-orders';
  var ACTIVE_ORDER_KEY = 'ember-active-order';
  var REVIEWS_KEY = 'ember-user-reviews';

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveCart(c) {
    localStorage.setItem(CART_KEY, JSON.stringify(c));
  }

  function getAppliedCoupon() {
    try { return JSON.parse(localStorage.getItem(COUPON_KEY)) || null; }
    catch (e) { return null; }
  }
  function setAppliedCoupon(c) {
    if (!c) localStorage.removeItem(COUPON_KEY);
    else localStorage.setItem(COUPON_KEY, JSON.stringify(c));
  }

  function getOrders() {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveOrders(o) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(o));
  }

  function getActiveOrder() {
    try { return JSON.parse(localStorage.getItem(ACTIVE_ORDER_KEY)) || null; }
    catch (e) { return null; }
  }
  function setActiveOrder(ao) {
    if (!ao) localStorage.removeItem(ACTIVE_ORDER_KEY);
    else localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(ao));
  }

  function getUserReviews() {
    try { return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveUserReviews(r) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(r));
  }

  function makeId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function playOrderChime() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      var ctx = new AudioCtx();
      var freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach(function (f, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        var start = ctx.currentTime + (i * 0.1);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch (e) { }
  }

  function addToCart(name, price, img, customNote) {
    var cart = getCart();
    var id = makeId(name + (customNote ? '-' + customNote : ''));
    var item = cart.find(function (i) { return i.id === id; });
    if (item) {
      item.qty += 1;
    } else {
      cart.push({ id: id, name: name + (customNote ? ' (' + customNote + ')' : ''), price: price, qty: 1, img: img || '' });
    }
    saveCart(cart);
    refreshCartUI();
    syncCardSteppers();
    renderDrawer();
    toast('🛒 Added to order: ' + name, '#D9662C');
  }

  function changeQty(id, delta) {
    var cart = getCart();
    var item = cart.find(function (i) { return i.id === id; });
    if (!item) return;
    item.qty = Math.max(0, item.qty + delta);
    if (item.qty === 0) {
      cart = cart.filter(function (i) { return i.id !== id; });
    }
    saveCart(cart);
    refreshCartUI();
    syncCardSteppers();
    renderDrawer();
  }

  window.emberCart = {
    changeQty: changeQty,
    addToCart: addToCart,
    openCart: openCart,
    closeCart: closeCart,
    applyCouponCode: applyCouponCode,
    removeCoupon: removeCoupon,
    openCheckout: openCheckout,
    closeCheckout: closeCheckout,
    submitOrder: submitOrder,
    reorder: reorder,
    openLiveTracking: openLiveTracking,
    closeLiveTracking: closeLiveTracking,
    openDishDetails: openDishDetails,
    closeDishDetails: closeDishDetails,
    openInvoice: openInvoice,
    closeInvoice: closeInvoice,
    openRatingModal: openRatingModal,
    closeRatingModal: closeRatingModal,
    submitRating: submitRating,
    detectLocation: detectLocation,
    clearActiveOrder: clearActiveOrder,
    updateLiveTrackerUI: updateLiveTrackerUI
  };

  function refreshCartUI() {
    var cart  = getCart();
    var count = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    var total = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);

    document.querySelectorAll('.cart-count').forEach(function (el) {
      el.textContent = count === 0 ? 'Cart is empty' : count + ' Item' + (count !== 1 ? 's' : '') + ' Added';
    });
    document.querySelectorAll('.cart-price').forEach(function (el) {
      el.textContent = '₹' + total;
    });
    document.querySelectorAll('.floating-cart').forEach(function (el) {
      el.style.display = count === 0 ? 'none' : 'flex';
    });
  }

  function syncCardSteppers() {
    var cart = getCart();
    document.querySelectorAll('.dish-card').forEach(function (card) {
      var nameEl = card.querySelector('.dish-name');
      if (!nameEl) return;
      var rawName = nameEl.textContent.trim().replace(/^[^\w\u0900-\u097F]+/, '').trim();
      var id = makeId(rawName);
      var cartItem = cart.find(function (i) { return i.id === id; });
      var metaRow = card.querySelector('.meta-row');
      if (!metaRow) return;

      var existingStepper = metaRow.querySelector('.dish-stepper');
      var existingBtn = metaRow.querySelector('.add-btn');

      if (cartItem && cartItem.qty > 0) {
        if (existingBtn) existingBtn.style.display = 'none';
        if (!existingStepper) {
          existingStepper = document.createElement('div');
          existingStepper.className = 'dish-stepper';
          metaRow.appendChild(existingStepper);
        }
        existingStepper.innerHTML =
          '<button onclick="window.emberCart.changeQty(\'' + escHtml(id) + '\', -1)" aria-label="Decrease">−</button>' +
          '<span class="stepper-qty">' + cartItem.qty + '</span>' +
          '<button onclick="window.emberCart.changeQty(\'' + escHtml(id) + '\', 1)" aria-label="Increase">+</button>';
      } else {
        if (existingStepper) existingStepper.remove();
        if (existingBtn) existingBtn.style.display = '';
      }
    });
  }

  function buildCartShell() {
    document.querySelectorAll('.cart-drawer-box, .cart-backdrop-overlay, #cartDrawer, #cartBackdrop').forEach(function (el) {
      el.remove();
    });

    var backdrop = document.createElement('div');
    backdrop.id = 'cartBackdrop';
    backdrop.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);' +
      'z-index:9998;opacity:0;pointer-events:none;transition:opacity 0.3s ease;';
    document.body.appendChild(backdrop);

    var drawer = document.createElement('div');
    drawer.id = 'cartDrawer';
    drawer.style.cssText =
      'position:fixed;top:0;right:-480px;width:100%;max-width:440px;height:100vh;' +
      'background:var(--card,#1A1512);border-left:1px solid var(--border,#2A241F);' +
      'z-index:9999;display:flex;flex-direction:column;padding:24px;' +
      'transition:right 0.35s cubic-bezier(0.4,0,0.2,1);' +
      'box-shadow:-10px 0 35px rgba(0,0,0,0.6);color:var(--text,#F4EDE4);';
    document.body.appendChild(drawer);

    backdrop.addEventListener('click', closeCart);

    document.querySelectorAll('.floating-cart').forEach(function (el) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', openCart);
    });

    buildCheckoutModal();
    buildLiveTrackingModal();
    buildDishDetailsModal();
    buildInvoiceModal();
    buildRatingModal();
    renderDrawer();
  }

  function openCart() {
    var drawer   = document.getElementById('cartDrawer');
    var backdrop = document.getElementById('cartBackdrop');
    if (!drawer) return;
    drawer.style.right = '0';
    backdrop.style.opacity = '1';
    backdrop.style.pointerEvents = 'auto';
    document.body.style.overflow = 'hidden';
    renderDrawer();
  }

  function closeCart() {
    var drawer   = document.getElementById('cartDrawer');
    var backdrop = document.getElementById('cartBackdrop');
    if (!drawer) return;
    drawer.style.right = '-480px';
    backdrop.style.opacity = '0';
    backdrop.style.pointerEvents = 'none';
    document.body.style.overflow = '';
  }

  function applyCouponCode(code) {
    code = (code || '').toUpperCase().trim();
    if (!code) {
      toast('Please enter a coupon code', '#e74c3c');
      return;
    }
    var discountPercent = 0;
    var maxDiscount = 9999;
    var label = '';

    if (code === 'EMBER40') {
      discountPercent = 40;
      maxDiscount = 200;
      label = '40% OFF up to ₹200';
    } else if (code === 'MIDNIGHT') {
      discountPercent = 25;
      maxDiscount = 150;
      label = '25% OFF Midnight Deal';
    } else if (code === 'SWEETFEAST') {
      discountPercent = 15;
      maxDiscount = 100;
      label = '15% OFF + Free Dessert';
    } else {
      toast('Invalid coupon code. Try EMBER40 or MIDNIGHT', '#e74c3c');
      return;
    }

    setAppliedCoupon({ code: code, percent: discountPercent, max: maxDiscount, label: label });
    toast('🎉 Coupon ' + code + ' Applied! ' + label, '#4caf50');
    renderDrawer();
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    toast('Coupon removed', '#8C8175');
    renderDrawer();
  }

  function renderDrawer() {
    var drawer = document.getElementById('cartDrawer');
    if (!drawer) return;

    var cart    = getCart();
    var count   = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    var itemTotal = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);

    var coupon = getAppliedCoupon();
    var discount = 0;
    if (coupon && itemTotal > 0) {
      discount = Math.min(coupon.max, Math.round((itemTotal * coupon.percent) / 100));
    }

    var taxes = itemTotal > 0 ? 35 : 0;
    var delivery = itemTotal >= 199 || itemTotal === 0 ? 0 : 30;
    var grandTotal = Math.max(0, itemTotal - discount + taxes + delivery);

    drawer.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;' +
          'border-bottom:1px solid var(--border,#2A241F);padding-bottom:16px;flex-shrink:0;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<span style="font-size:22px;">🛒</span>' +
          '<h3 style="font-family:\'Fraunces\',serif;font-size:20px;font-weight:700;' +
              'margin:0;color:var(--text,#F4EDE4);">Your Order</h3>' +
          '<span style="background:rgba(217,102,44,0.15);border:1px solid #D9662C;color:#D9662C;' +
              'font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;">' +
            count + ' Item' + (count !== 1 ? 's' : '') +
          '</span>' +
        '</div>' +
        '<button onclick="window.emberCart.closeCart()" ' +
            'style="background:var(--input-bg,#0E0C0B);border:1px solid var(--border,#2A241F);' +
            'color:var(--muted,#8C8175);font-size:18px;width:32px;height:32px;border-radius:50%;' +
            'cursor:pointer;display:flex;align-items:center;justify-content:center;" ' +
            'aria-label="Close cart">✕</button>' +
      '</div>' +

      '<div style="flex:1;overflow-y:auto;padding:14px 0 8px;">' +
        (cart.length === 0
          ? '<div style="text-align:center;padding:30px 0 16px;color:var(--muted,#8C8175);">' +
              '<div style="font-size:48px;margin-bottom:8px;">🛒</div>' +
              '<p style="font-size:16px;font-weight:700;color:var(--text,#F4EDE4);margin:0;">Your cart is empty</p>' +
              '<p style="font-size:12px;margin:4px 0 16px;">Good food is always cooking! Add customer favorites:</p>' +
              '<div class="cart-empty-suggestions">' +
                '<div style="font-size:11px;font-weight:700;color:#D9662C;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🔥 Chef Recommended</div>' +
                '<div class="empty-pick-card">' +
                  '<img src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=120&q=80" alt="Biryani" />' +
                  '<div style="flex:1;"><div style="font-size:13px;font-weight:700;">Chicken Dum Biryani</div><div style="font-size:12px;color:#D9662C;">₹349</div></div>' +
                  '<button onclick="window.emberCart.addToCart(\'Chicken Dum Biryani\', 349, \'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=700&q=85&auto=format&fit=crop\')" style="background:#D9662C;color:#fff;border:none;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;">+ Add</button>' +
                '</div>' +
                '<div class="empty-pick-card">' +
                  '<img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=120&q=80" alt="Pizza" />' +
                  '<div style="flex:1;"><div style="font-size:13px;font-weight:700;">Wood-fired Margherita</div><div style="font-size:12px;color:#D9662C;">₹399</div></div>' +
                  '<button onclick="window.emberCart.addToCart(\'Wood-fired Margherita\', 399, \'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80&auto=format&fit=crop\')" style="background:#D9662C;color:#fff;border:none;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;">+ Add</button>' +
                '</div>' +
              '</div>' +
            '</div>'
          : cart.map(function (item) {
              var imgTag = item.img
                ? '<img src="' + escHtml(item.img) + '" alt="' + escHtml(item.name) + '" ' +
                  'style="width:54px;height:54px;border-radius:8px;object-fit:cover;flex-shrink:0;" />'
                : '<div style="width:54px;height:54px;border-radius:8px;flex-shrink:0;' +
                  'background:var(--input-bg,#0E0C0B);display:flex;align-items:center;' +
                  'justify-content:center;font-size:22px;">🍽️</div>';
              return (
                '<div style="display:flex;gap:12px;align-items:center;' +
                    'background:var(--surface,#14100E);border:1px solid var(--border,#2A241F);' +
                    'border-radius:10px;padding:12px 14px;margin-bottom:10px;">' +
                  imgTag +
                  '<div style="flex:1;min-width:0;">' +
                    '<p style="font-size:13px;font-weight:600;margin:0 0 4px;color:var(--text,#F4EDE4);' +
                        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
                      escHtml(item.name) +
                    '</p>' +
                    '<span style="font-size:13px;font-weight:700;color:#D9662C;">₹' + (item.price * item.qty) + '</span>' +
                    (item.qty > 1
                      ? '<span style="font-size:11px;color:var(--muted,#8C8175);margin-left:6px;">(₹' + item.price + ' each)</span>'
                      : '') +
                  '</div>' +
                  '<div style="display:flex;align-items:center;background:var(--card,#1A1512);' +
                      'border:1px solid var(--border,#2A241F);border-radius:20px;overflow:hidden;">' +
                    '<button onclick="window.emberCart.changeQty(\'' + escHtml(item.id) + '\',-1)" ' +
                        'style="background:none;border:none;color:var(--text,#F4EDE4);font-size:16px;' +
                        'font-weight:700;cursor:pointer;padding:4px 10px;line-height:1;" ' +
                        'aria-label="Decrease">−</button>' +
                    '<span style="font-size:13px;font-weight:700;color:var(--text,#F4EDE4);' +
                        'min-width:18px;text-align:center;">' + item.qty + '</span>' +
                    '<button onclick="window.emberCart.changeQty(\'' + escHtml(item.id) + '\',1)" ' +
                        'style="background:none;border:none;color:var(--text,#F4EDE4);font-size:16px;' +
                        'font-weight:700;cursor:pointer;padding:4px 10px;line-height:1;" ' +
                        'aria-label="Increase">+</button>' +
                  '</div>' +
                '</div>'
              );
            }).join('') +

            '<div style="margin-top:14px;padding:12px;background:var(--surface,#14100E);border:1px dashed var(--border,#2A241F);border-radius:10px;">' +
              '<div style="font-size:12px;font-weight:700;color:var(--text,#F4EDE4);margin-bottom:6px;">🎟️ Apply Promo Code</div>' +
              (coupon
                ? '<div class="coupon-tag-applied">' +
                    '<span>✓ ' + escHtml(coupon.code) + ' (' + escHtml(coupon.label) + ')</span>' +
                    '<button onclick="window.emberCart.removeCoupon()" style="background:none;border:none;color:#e74c3c;font-weight:700;cursor:pointer;">✕</button>' +
                  '</div>'
                : '<div class="coupon-apply-wrap">' +
                    '<input type="text" id="cartCouponInput" class="coupon-input" placeholder="Enter code (e.g. EMBER40)" />' +
                    '<button class="coupon-btn" onclick="window.emberCart.applyCouponCode(document.getElementById(\'cartCouponInput\').value)">Apply</button>' +
                  '</div>' +
                  '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">' +
                    '<span onclick="window.emberCart.applyCouponCode(\'EMBER40\')" style="font-size:10px;font-weight:700;background:rgba(217,102,44,0.12);border:1px solid #D9662C;color:#D9662C;padding:2px 8px;border-radius:4px;cursor:pointer;">EMBER40 (40% OFF)</span>' +
                    '<span onclick="window.emberCart.applyCouponCode(\'MIDNIGHT\')" style="font-size:10px;font-weight:700;background:rgba(217,102,44,0.12);border:1px solid #D9662C;color:#D9662C;padding:2px 8px;border-radius:4px;cursor:pointer;">MIDNIGHT (25% OFF)</span>' +
                  '</div>'
              ) +
            '</div>' +

            '<div style="margin-top:10px;">' +
              '<input type="text" id="cookingNotes" placeholder="📝 Cooking note (e.g. Extra spicy, less oil)" ' +
                     'style="width:100%;background:var(--surface,#14100E);border:1px solid var(--border,#2A241F);color:var(--text,#F4EDE4);padding:10px 12px;border-radius:8px;font-size:12px;outline:none;" />' +
            '</div>'
        ) +
      '</div>' +

      '<div style="border-top:1px solid var(--border,#2A241F);padding-top:14px;flex-shrink:0;">' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;' +
            'color:var(--muted,#8C8175);margin-bottom:6px;">' +
          '<span>Item Total</span><span>₹' + itemTotal + '</span>' +
        '</div>' +
        (discount > 0
          ? '<div style="display:flex;justify-content:space-between;font-size:13px;' +
                'color:#4caf50;font-weight:600;margin-bottom:6px;">' +
              '<span>Coupon Discount (' + (coupon ? coupon.code : '') + ')</span><span>- ₹' + discount + '</span>' +
            '</div>'
          : ''
        ) +
        '<div style="display:flex;justify-content:space-between;font-size:13px;' +
            'color:var(--muted,#8C8175);margin-bottom:6px;">' +
          '<span>Delivery Partner Fee</span>' +
          (delivery === 0
            ? '<span style="color:#4caf50;font-weight:700;">FREE 🎉</span>'
            : '<span>₹' + delivery + '</span>') +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;' +
            'color:var(--muted,#8C8175);margin-bottom:12px;">' +
          '<span>Govt. Taxes & Packaging</span><span>₹' + taxes + '</span>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:19px;font-weight:900;' +
            'font-family:\'Fraunces\',serif;color:var(--text,#F4EDE4);' +
            'border-top:1px solid var(--border,#2A241F);padding-top:10px;margin-bottom:14px;">' +
          '<span>To Pay</span><span style="color:#D9662C;">₹' + grandTotal + '</span>' +
        '</div>' +
        (cart.length > 0
          ? '<button onclick="window.emberCart.openCheckout()" ' +
              'style="width:100%;border:none;cursor:pointer;display:block;text-align:center;background:#D9662C;color:#fff;' +
              'font-weight:700;padding:14px 20px;border-radius:8px;font-size:14px;box-shadow:0 6px 20px rgba(217,102,44,0.4);">' +
              'Proceed to Checkout (₹' + grandTotal + ') →' +
            '</button>'
          : '<a href="explore.html" ' +
              'style="display:block;text-align:center;background:var(--input-bg,#0E0C0B);' +
              'color:var(--text,#F4EDE4);border:1px solid var(--border,#2A241F);' +
              'font-weight:700;padding:14px 20px;border-radius:8px;text-decoration:none;font-size:14px;">' +
              'Browse Menu →' +
            '</a>'
        ) +
      '</div>';
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function verifyInventoryPromise(cart) {
    return new Promise(function (resolve, reject) {
      if (!cart || !cart.length) {
        reject(new Error('Cart is empty. Please add items first.'));
        return;
      }
      delay(600).then(function () {
        resolve({ verified: true, count: cart.length });
      });
    });
  }

  function processPaymentPromise(method, amount) {
    return new Promise(function (resolve, reject) {
      delay(950).then(function () {
        var txnId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
        resolve({ status: 'SUCCESS', txnId: txnId, method: method, amount: amount });
      });
    });
  }

  function notifyKitchenPromise(orderId) {
    return new Promise(function (resolve) {
      delay(750).then(function () {
        resolve({ status: 'ACCEPTED', orderId: orderId, kitchen: 'EMBER Fire Pit & Handi' });
      });
    });
  }

  function assignRiderPromise() {
    return new Promise(function (resolve) {
      delay(800).then(function () {
        resolve({ rider: 'Ramesh Verma', rating: '4.9★', vehicle: 'Hero Splendor (DL 3S AB 4210)' });
      });
    });
  }

  function getCurrentLocationPromise() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function (position) {
          var lat = position.coords.latitude.toFixed(4);
          var lng = position.coords.longitude.toFixed(4);
          resolve('📍 GPS Pinpoint: ' + lat + '° N, ' + lng + '° E (Live Current Location)');
        },
        function (error) {
          reject(new Error('Location access denied or unavailable.'));
        },
        { timeout: 8000 }
      );
    });
  }

  window.emberPromises = {
    delay: delay,
    verifyInventory: verifyInventoryPromise,
    processPayment: processPaymentPromise,
    notifyKitchen: notifyKitchenPromise,
    assignRider: assignRiderPromise,
    getCurrentLocation: getCurrentLocationPromise
  };

  function buildCheckoutModal() {
    var old = document.getElementById('checkoutOverlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'checkoutOverlay';
    overlay.className = 'checkout-modal-overlay';
    overlay.innerHTML =
      '<div class="checkout-modal-card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border,#2A241F);padding-bottom:14px;margin-bottom:18px;">' +
          '<h3 style="font-family:\'Fraunces\',serif;font-size:22px;margin:0;color:var(--text,#F4EDE4);">Complete Your Order</h3>' +
          '<button onclick="window.emberCart.closeCheckout()" style="background:none;border:none;color:var(--muted,#8C8175);font-size:20px;cursor:pointer;">✕</button>' +
        '</div>' +

        '<div class="checkout-step-title">📍 1. Delivery Address</div>' +
        '<div id="addressOptions">' +
          '<label class="checkout-option-box selected">' +
            '<input type="radio" name="deliveryAddress" value="Home" checked />' +
            '<div>' +
              '<div style="font-size:14px;font-weight:700;">🏠 Home</div>' +
              '<div style="font-size:12px;color:var(--muted,#8C8175);">Flat B-402, Royal Palms, Green Park Main, South Delhi</div>' +
            '</div>' +
          '</label>' +
          '<label class="checkout-option-box">' +
            '<input type="radio" name="deliveryAddress" value="Work" />' +
            '<div>' +
              '<div style="font-size:14px;font-weight:700;">🏢 Work / Office</div>' +
              '<div style="font-size:12px;color:var(--muted,#8C8175);">Tower 5, DLF Cyber City, Phase 2, Gurugram</div>' +
            '</div>' +
          '</label>' +
          '<label class="checkout-option-box" id="customAddressBox" style="display:none;">' +
            '<input type="radio" name="deliveryAddress" value="GPS Live Location" />' +
            '<div>' +
              '<div style="font-size:14px;font-weight:700;">📍 GPS Pinpoint Location</div>' +
              '<div class="addr-text" style="font-size:12px;color:#4caf50;">Detecting…</div>' +
            '</div>' +
          '</label>' +
        '</div>' +
        '<button type="button" id="btnDetectLocation" onclick="window.emberCart.detectLocation()" ' +
                'style="background:rgba(217,102,44,0.12);border:1px dashed #D9662C;color:#D9662C;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;margin-top:4px;display:inline-flex;align-items:center;gap:6px;">' +
          '📍 Detect My Current Location (Promise)' +
        '</button>' +

        '<div class="checkout-step-title" style="margin-top:20px;">💳 2. Payment Method</div>' +
        '<div id="paymentOptions">' +
          '<label class="checkout-option-box selected">' +
            '<input type="radio" name="payMethod" value="UPI (Google Pay / PhonePe)" checked />' +
            '<div>' +
              '<div style="font-size:14px;font-weight:700;">⚡ Instant UPI (Google Pay / PhonePe / Paytm)</div>' +
              '<div style="font-size:12px;color:#4caf50;font-weight:600;">Fastest Checkout • Assured Cashback</div>' +
            '</div>' +
          '</label>' +
          '<label class="checkout-option-box">' +
            '<input type="radio" name="payMethod" value="Cash on Delivery" />' +
            '<div>' +
              '<div style="font-size:14px;font-weight:700;">💵 Cash on Delivery (COD)</div>' +
              '<div style="font-size:12px;color:var(--muted,#8C8175);">Pay cash or scan QR when delivery rider arrives</div>' +
            '</div>' +
          '</label>' +
          '<label class="checkout-option-box">' +
            '<input type="radio" name="payMethod" value="Credit / Debit Card" />' +
            '<div>' +
              '<div style="font-size:14px;font-weight:700;">💳 Credit / Debit Cards</div>' +
              '<div style="font-size:12px;color:var(--muted,#8C8175);">Visa, Mastercard, RuPay & Amex accepted</div>' +
            '</div>' +
          '</label>' +
        '</div>' +

        '<div id="checkoutSummaryBox" style="background:var(--surface,#14100E);border:1px solid var(--border,#2A241F);border-radius:10px;padding:14px;margin-top:20px;"></div>' +

        '<button id="btnPlaceOrder" onclick="window.emberCart.submitOrder()" ' +
                'style="width:100%;margin-top:18px;background:#D9662C;color:#FFFFFF;border:none;padding:15px;font-size:15px;font-weight:700;border-radius:8px;cursor:pointer;box-shadow:0 8px 24px rgba(217,102,44,0.4);">' +
          'Place Order 🔥' +
        '</button>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.querySelectorAll('.checkout-option-box input').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var group = this.closest('#addressOptions') || this.closest('#paymentOptions');
        if (group) {
          group.querySelectorAll('.checkout-option-box').forEach(function (box) {
            box.classList.remove('selected');
          });
          this.closest('.checkout-option-box').classList.add('selected');
        }
      });
    });

    buildProcessingModal();
  }

  function detectLocation() {
    var btn = document.getElementById('btnDetectLocation');
    if (btn) btn.textContent = '⏳ Resolving Geolocation Promise…';

    getCurrentLocationPromise()
      .then(function (locString) {
        if (btn) btn.textContent = '✓ ' + locString;
        toast('✓ Location resolved via Promise!', '#4caf50');
        var customBox = document.getElementById('customAddressBox');
        if (customBox) {
          customBox.style.display = 'flex';
          var radio = customBox.querySelector('input');
          if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
          }
          var textEl = customBox.querySelector('.addr-text');
          if (textEl) textEl.textContent = locString;
        }
      })
      .catch(function (err) {
        if (btn) btn.textContent = '📍 Detect My Current Location (Promise)';
        toast('⚠️ Geolocation Promise rejected: ' + err.message, '#e74c3c');
      });
  }

  function buildProcessingModal() {
    var old = document.getElementById('processingOverlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'processingOverlay';
    overlay.className = 'processing-modal-overlay';
    overlay.innerHTML =
      '<div class="processing-modal-card">' +
        '<div style="font-size:40px;margin-bottom:8px;">🔥</div>' +
        '<h3 style="font-family:\'Fraunces\',serif;font-size:22px;margin:0 0 6px;">Processing Your Order</h3>' +
        '<p style="font-size:12px;color:var(--muted,#8C8175);margin:0 0 16px;">Executed via JavaScript Promise Chaining Pipeline</p>' +
        '<div class="processing-steps-list">' +
          '<div class="p-step-item" id="pStep1"><span>1️⃣</span> <span class="step-text">Verifying stock with kitchen…</span></div>' +
          '<div class="p-step-item" id="pStep2"><span>2️⃣</span> <span class="step-text">Processing payment gateway transaction…</span></div>' +
          '<div class="p-step-item" id="pStep3"><span>3️⃣</span> <span class="step-text">Transmitting KOT ticket to Chef…</span></div>' +
          '<div class="p-step-item" id="pStep4"><span>4️⃣</span> <span class="step-text">Assigning nearest delivery partner…</span></div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
  }

  function setStepUI(stepNum, state, message) {
    var el = document.getElementById('pStep' + stepNum);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (state === 'active') {
      el.classList.add('active');
    } else if (state === 'done') {
      el.classList.add('done');
      if (message) {
        var t = el.querySelector('.step-text');
        if (t) t.textContent = message;
      }
    }
  }

  function openCheckout() {
    var cart = getCart();
    if (!cart.length) {
      toast('Your cart is empty!', '#e74c3c');
      return;
    }
    closeCart();
    var overlay = document.getElementById('checkoutOverlay');
    if (!overlay) return;

    var itemTotal = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var coupon = getAppliedCoupon();
    var discount = coupon ? Math.min(coupon.max, Math.round((itemTotal * coupon.percent) / 100)) : 0;
    var taxes = 35;
    var delivery = itemTotal >= 199 ? 0 : 30;
    var grandTotal = Math.max(0, itemTotal - discount + taxes + delivery);

    var summaryBox = document.getElementById('checkoutSummaryBox');
    if (summaryBox) {
      summaryBox.innerHTML =
        '<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted,#8C8175);margin-bottom:4px;">' +
          '<span>Order Items (' + cart.length + ')</span><span>₹' + itemTotal + '</span>' +
        '</div>' +
        (discount > 0
          ? '<div style="display:flex;justify-content:space-between;font-size:13px;color:#4caf50;font-weight:600;margin-bottom:4px;">' +
              '<span>Discount (' + coupon.code + ')</span><span>- ₹' + discount + '</span>' +
            '</div>'
          : '') +
        '<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted,#8C8175);margin-bottom:8px;">' +
          '<span>Delivery & Taxes</span><span>₹' + (delivery + taxes) + '</span>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:var(--text,#F4EDE4);border-top:1px dashed var(--border,#2A241F);padding-top:8px;">' +
          '<span>Final Payable</span><span style="color:#D9662C;">₹' + grandTotal + '</span>' +
        '</div>';
    }

    var btn = document.getElementById('btnPlaceOrder');
    if (btn) btn.textContent = 'Pay ₹' + grandTotal + ' & Confirm Order 🔥';

    overlay.classList.add('open');
  }

  function closeCheckout() {
    var overlay = document.getElementById('checkoutOverlay');
    if (overlay) overlay.classList.remove('open');
  }

  function submitOrder() {
    var cart = getCart();
    if (!cart.length) return;

    var btn = document.getElementById('btnPlaceOrder');
    if (btn) btn.disabled = true;

    var orderNum = Math.floor(1000 + Math.random() * 9000);
    var orderId = '#EMB-' + orderNum;

    var addrRadio = document.querySelector('input[name="deliveryAddress"]:checked');
    var payRadio  = document.querySelector('input[name="payMethod"]:checked');

    var itemTotal = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var coupon = getAppliedCoupon();
    var discount = coupon ? Math.min(coupon.max, Math.round((itemTotal * coupon.percent) / 100)) : 0;
    var grandTotal = Math.max(0, itemTotal - discount + 35 + (itemTotal >= 199 ? 0 : 30));

    var chosenAddress = addrRadio ? addrRadio.value : 'Home';
    var chosenPayment = payRadio ? payRadio.value : 'UPI';

    var procOverlay = document.getElementById('processingOverlay');
    if (procOverlay) procOverlay.classList.add('open');

    setStepUI(1, 'active');
    setStepUI(2, '');
    setStepUI(3, '');
    setStepUI(4, '');

    verifyInventoryPromise(cart)
      .then(function (invResult) {
        setStepUI(1, 'done', '✓ Stock confirmed: ' + invResult.count + ' items available');
        setStepUI(2, 'active');
        return processPaymentPromise(chosenPayment, grandTotal);
      })
      .then(function (payResult) {
        setStepUI(2, 'done', '✓ Payment Approved: ' + payResult.txnId + ' via ' + payResult.method);
        setStepUI(3, 'active');
        return notifyKitchenPromise(orderId);
      })
      .then(function (kitchenResult) {
        setStepUI(3, 'done', '✓ Chef accepted order ticket for ' + kitchenResult.kitchen);
        setStepUI(4, 'active');
        return assignRiderPromise();
      })
      .then(function (riderResult) {
        setStepUI(4, 'done', '✓ Partner ' + riderResult.rider + ' (' + riderResult.rating + ') on route');
        return delay(600);
      })
      .then(function () {
        var newOrder = {
          id: orderId,
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
                new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          items: cart,
          itemTotal: itemTotal,
          discount: discount,
          total: grandTotal,
          address: chosenAddress,
          payment: chosenPayment,
          status: 'Order Placed',
          placedAt: Date.now()
        };

        var orders = getOrders();
        orders.unshift(newOrder);
        saveOrders(orders);

        setActiveOrder({
          id: orderId,
          placedAt: Date.now(),
          etaMinutes: 24,
          itemsCount: cart.length,
          total: grandTotal,
          address: chosenAddress
        });

        saveCart([]);
        setAppliedCoupon(null);
        refreshCartUI();
        syncCardSteppers();

        if (procOverlay) procOverlay.classList.remove('open');
        closeCheckout();

        playOrderChime();
        toast('🎉 Order Confirmed! ' + orderId + ' is being cooked!', '#4caf50');
        updateLiveTrackerUI();
        renderProfileOrders();

        setTimeout(function () {
          openLiveTracking(orderId);
        }, 800);
      })
      .catch(function (error) {
        if (procOverlay) procOverlay.classList.remove('open');
        if (btn) btn.disabled = false;
        toast('❌ Order Failed: ' + error.message, '#e74c3c');
      });
  }

  function reorder(orderId) {
    var orders = getOrders();
    var order = orders.find(function (o) { return o.id === orderId; });
    if (!order || !order.items) return;
    saveCart(order.items);
    refreshCartUI();
    syncCardSteppers();
    openCart();
    toast('🔄 Reorder items added to your cart!', '#4caf50');
  }

  var liveTrackInterval = null;

  function buildLiveTrackingModal() {
    var old = document.getElementById('trackOverlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'trackOverlay';
    overlay.className = 'track-modal-overlay';
    overlay.innerHTML =
      '<div class="track-modal-card">' +
        '<div class="track-map-box">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<span class="track-timer-badge"><span id="trackStatusBadge"><span style="display:inline-block;transform:scaleX(-1);">🛵</span> Out for Delivery</span> • <span id="trackLiveCountdown">18:40</span></span>' +
            '<button onclick="window.emberCart.closeLiveTracking()" style="background:none;border:none;color:var(--muted,#8C8175);font-size:20px;cursor:pointer;">✕</button>' +
          '</div>' +
          '<div class="track-map-route">' +
            '<div class="track-route-line"></div>' +
            '<div class="track-route-progress" id="trackProgressLine" style="width:55%;"></div>' +
            '<div class="track-scooter-rider" id="trackRiderScooter" style="left:55%;">🛵</div>' +
            '<div class="track-pin active" title="Ember Fire Kitchen">🔥</div>' +
            '<div class="track-pin" id="trackHomePin" title="Your Delivery Address">🏡</div>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--muted,#8C8175);margin-top:6px;">' +
            '<span>EMBER KITCHEN</span>' +
            '<span>DESTINATION</span>' +
          '</div>' +
        '</div>' +

        '<div style="padding:16px 24px;border-bottom:1px solid var(--border,#2A241F);display:flex;justify-content:space-between;align-items:center;background:var(--surface,#14100E);">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="width:40px;height:40px;border-radius:50%;background:#D9662C;color:#0E0C0B;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;">RV</div>' +
            '<div>' +
              '<div style="font-size:14px;font-weight:700;">Ramesh Verma <span style="font-size:12px;color:#D9662C;">⭐ 4.9</span></div>' +
              '<div style="font-size:11px;color:var(--muted,#8C8175);">Hero Splendor (DL 3S AB 4210) • Covid Vaccinated</div>' +
            '</div>' +
          '</div>' +
          '<a href="tel:+919876543210" style="background:#D9662C;color:#fff;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:700;text-decoration:none;">Call Partner 📞</a>' +
        '</div>' +

        '<div class="track-timeline">' +
          '<div class="track-milestone done">' +
            '<div class="m-dot">✓</div>' +
            '<div class="m-content"><h4>Order Received & Confirmed</h4><p>Kitchen accepted your order and fired up the handi.</p></div>' +
          '</div>' +
          '<div class="track-milestone done">' +
            '<div class="m-dot">✓</div>' +
            '<div class="m-content"><h4>Food Preparation in Progress</h4><p>Slow dum-cooking over live wood charcoal.</p></div>' +
          '</div>' +
          '<div class="track-milestone current" id="trackMile3">' +
            '<div class="m-dot"><span style="display:inline-block;transform:scaleX(-1);">🛵</span></div>' +
            '<div class="m-content"><h4>Delivery Partner on the Way</h4><p>Ramesh is carrying your meal in an insulated thermal hot bag.</p></div>' +
          '</div>' +
          '<div class="track-milestone" id="trackMile4">' +
            '<div class="m-dot">🏡</div>' +
            '<div class="m-content"><h4>Arrival & Contactless Delivery</h4><p>Arriving at your doorstep soon.</p></div>' +
          '</div>' +
        '</div>' +

        '<div style="padding:14px 24px;border-top:1px solid var(--border,#2A241F);display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="font-size:12px;color:var(--muted,#8C8175);" id="trackActiveOrderId">Tracking Order #EMB-9842</span>' +
          '<button onclick="window.emberCart.closeLiveTracking()" style="background:var(--input-bg,#0E0C0B);border:1px solid var(--border,#2A241F);color:var(--text,#F4EDE4);padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer;">Close Tracker</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
  }

  function openLiveTracking(orderId) {
    var overlay = document.getElementById('trackOverlay');
    if (!overlay) buildLiveTrackingModal();
    overlay = document.getElementById('trackOverlay');

    var active = getActiveOrder();
    var displayId = orderId || (active ? active.id : '#EMB-9842');

    var orderIdEl = document.getElementById('trackActiveOrderId');
    if (orderIdEl) orderIdEl.textContent = 'Tracking Order ' + displayId;

    overlay.classList.add('open');

    if (liveTrackInterval) clearInterval(liveTrackInterval);

    var secondsLeft = active ? (active.etaMinutes * 60) - Math.floor((Date.now() - active.placedAt) / 1000) : 1080;
    if (secondsLeft < 120) secondsLeft = 120;

    function tick() {
      var m = Math.floor(secondsLeft / 60);
      var s = secondsLeft % 60;
      var cd = document.getElementById('trackLiveCountdown');
      if (cd) cd.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;

      var totalSec = 1440;
      var progress = Math.min(95, Math.max(15, Math.floor(((totalSec - secondsLeft) / totalSec) * 100)));

      var line = document.getElementById('trackProgressLine');
      var rider = document.getElementById('trackRiderScooter');
      if (line) line.style.width = progress + '%';
      if (rider) rider.style.left = progress + '%';

      var badge = document.getElementById('trackStatusBadge');
      if (progress < 30) {
        if (badge) badge.textContent = '🔥 Cooking in Kitchen';
      } else if (progress < 90) {
        if (badge) badge.innerHTML = '<span style="display:inline-block;transform:scaleX(-1);">🛵</span> Out for Delivery';
      } else {
        if (badge) badge.textContent = '🏡 Arrived at Location';
      }

      secondsLeft = Math.max(0, secondsLeft - 1);
    }

    tick();
    liveTrackInterval = setInterval(tick, 1000);
  }

  function closeLiveTracking() {
    var overlay = document.getElementById('trackOverlay');
    if (overlay) overlay.classList.remove('open');
    if (liveTrackInterval) clearInterval(liveTrackInterval);
  }

  var currentCustomDish = null;

  function buildDishDetailsModal() {
    var old = document.getElementById('dishModalOverlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'dishModalOverlay';
    overlay.className = 'dish-modal-overlay';
    overlay.innerHTML =
      '<div class="dish-modal-card">' +
        '<div class="dish-modal-header">' +
          '<img id="dmImage" src="" alt="Dish Image" />' +
          '<button class="dish-modal-close" onclick="window.emberCart.closeDishDetails()">✕</button>' +
        '</div>' +
        '<div class="dish-modal-body">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">' +
            '<h2 id="dmTitle" style="font-family:\'Fraunces\',serif;font-size:22px;margin:0;">Dish Title</h2>' +
            '<span id="dmPrice" style="font-size:20px;font-weight:700;color:#D9662C;">₹349</span>' +
          '</div>' +
          '<p id="dmDesc" style="font-size:13px;color:var(--muted,#8C8175);line-height:1.5;margin-bottom:16px;">Description</p>' +

          '<div style="font-size:13px;font-weight:700;margin-bottom:8px;">🌶️ Choose Spice Level</div>' +
          '<div class="dish-spice-picker">' +
            '<div class="spice-pill" data-spice="Mild" onclick="selectSpice(this)">Mild 🌿</div>' +
            '<div class="spice-pill selected" data-spice="Medium" onclick="selectSpice(this)">Medium 🌶️</div>' +
            '<div class="spice-pill" data-spice="Extra Fiery" onclick="selectSpice(this)">Fiery 🌶️🔥</div>' +
          '</div>' +

          '<div style="font-size:13px;font-weight:700;margin-bottom:8px;">➕ Add Extra Accompaniments</div>' +
          '<label class="addon-row">' +
            '<span>Garlic Butter Naan (+₹40)</span>' +
            '<input type="checkbox" value="Extra Naan" data-price="40" onchange="updateCustomTotal()" />' +
          '</label>' +
          '<label class="addon-row">' +
            '<span>Spiced Boondi Raita (+₹30)</span>' +
            '<input type="checkbox" value="Boondi Raita" data-price="30" onchange="updateCustomTotal()" />' +
          '</label>' +
          '<label class="addon-row">' +
            '<span>Extra Smoked Cheese (+₹50)</span>' +
            '<input type="checkbox" value="Extra Cheese" data-price="50" onchange="updateCustomTotal()" />' +
          '</label>' +

          '<button id="dmAddBtn" onclick="addCustomDishToCart()" style="width:100%;margin-top:20px;background:#D9662C;color:#fff;border:none;padding:14px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(217,102,44,0.4);">' +
            'Add to Cart →' +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
  }

  window.selectSpice = function (el) {
    document.querySelectorAll('.spice-pill').forEach(function (p) { p.classList.remove('selected'); });
    el.classList.add('selected');
  };

  window.updateCustomTotal = function () {
    if (!currentCustomDish) return;
    var base = currentCustomDish.price;
    var extra = 0;
    document.querySelectorAll('.addon-row input:checked').forEach(function (inp) {
      extra += parseInt(inp.dataset.price || '0', 10);
    });
    var btn = document.getElementById('dmAddBtn');
    if (btn) btn.textContent = 'Add to Cart (₹' + (base + extra) + ') →';
  };

  window.addCustomDishToCart = function () {
    if (!currentCustomDish) return;
    var spiceEl = document.querySelector('.spice-pill.selected');
    var spice = spiceEl ? spiceEl.dataset.spice : 'Medium';
    var addons = [];
    var extraPrice = 0;
    document.querySelectorAll('.addon-row input:checked').forEach(function (inp) {
      addons.push(inp.value);
      extraPrice += parseInt(inp.dataset.price || '0', 10);
    });

    var note = spice + (addons.length ? ', ' + addons.join(' + ') : '');
    addToCart(currentCustomDish.name, currentCustomDish.price + extraPrice, currentCustomDish.img, note);
    closeDishDetails();
  };

  function openDishDetails(dish) {
    currentCustomDish = dish;
    var overlay = document.getElementById('dishModalOverlay');
    if (!overlay) buildDishDetailsModal();
    overlay = document.getElementById('dishModalOverlay');

    document.getElementById('dmTitle').textContent = dish.name;
    document.getElementById('dmPrice').textContent = '₹' + dish.price;
    document.getElementById('dmDesc').textContent = dish.desc || 'Prepared authentic flame-roasted recipe with fresh ground herbs.';
    var imgEl = document.getElementById('dmImage');
    if (imgEl) imgEl.src = dish.img;

    document.querySelectorAll('.addon-row input').forEach(function (inp) { inp.checked = false; });
    document.querySelectorAll('.spice-pill').forEach(function (p) { p.classList.remove('selected'); });
    var mid = document.querySelector('.spice-pill[data-spice="Medium"]');
    if (mid) mid.classList.add('selected');

    updateCustomTotal();
    overlay.classList.add('open');
  }

  function closeDishDetails() {
    var overlay = document.getElementById('dishModalOverlay');
    if (overlay) overlay.classList.remove('open');
  }

  function buildInvoiceModal() {
    var old = document.getElementById('invoiceOverlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'invoiceOverlay';
    overlay.className = 'invoice-modal-overlay';
    overlay.innerHTML =
      '<div class="invoice-modal-card" style="background:#fff;color:#1A1512;max-width:560px;">' +
        '<div style="display:flex;justify-content:flex-end;padding:12px 16px 0;" class="no-print">' +
          '<button onclick="window.emberCart.closeInvoice()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#8C8175;">✕</button>' +
        '</div>' +
        '<div id="invoiceContent" class="invoice-paper"></div>' +
        '<div style="padding:16px 24px;border-top:1px solid #E5DDD5;display:flex;justify-content:space-between;align-items:center;" class="no-print">' +
          '<button onclick="window.print()" style="background:#D9662C;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer;">Print / Save as PDF 🖨️</button>' +
          '<button onclick="window.emberCart.closeInvoice()" style="background:#F5EFE9;color:#1A1512;border:none;padding:10px 18px;border-radius:6px;font-weight:600;font-size:13px;cursor:pointer;">Close</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
  }

  function openInvoice(orderId) {
    var overlay = document.getElementById('invoiceOverlay');
    if (!overlay) buildInvoiceModal();
    overlay = document.getElementById('invoiceOverlay');

    var orders = getOrders();
    var order = orders.find(function (o) { return o.id === orderId; });
    if (!order) {
      toast('Order details not found', '#e74c3c');
      return;
    }

    var content = document.getElementById('invoiceContent');
    if (content) {
      var itemRows = order.items.map(function (it) {
        return (
          '<tr>' +
            '<td style="padding:8px 0;border-bottom:1px solid #E5DDD5;">' + escHtml(it.name) + '</td>' +
            '<td style="padding:8px 0;text-align:center;border-bottom:1px solid #E5DDD5;">' + it.qty + '</td>' +
            '<td style="padding:8px 0;text-align:right;border-bottom:1px solid #E5DDD5;">₹' + it.price + '</td>' +
            '<td style="padding:8px 0;text-align:right;border-bottom:1px solid #E5DDD5;">₹' + (it.price * it.qty) + '</td>' +
          '</tr>'
        );
      }).join('');

      content.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #D9662C;padding-bottom:14px;margin-bottom:16px;">' +
          '<div>' +
            '<h2 style="margin:0;color:#D9662C;letter-spacing:-0.5px;">EMBER FIRE KITCHEN</h2>' +
            '<p style="font-size:11px;color:#6B5F54;margin:2px 0 0;">Connaught Place, New Delhi - 110001<br />GSTIN: 07AAAAE1234F1Z5</p>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-size:12px;font-weight:700;color:#D9662C;text-transform:uppercase;">Tax Invoice</div>' +
            '<div style="font-size:14px;font-weight:700;">' + escHtml(order.id) + '</div>' +
            '<div style="font-size:11px;color:#6B5F54;">' + escHtml(order.date) + '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:16px;color:#6B5F54;">' +
          '<div><strong>Billed To:</strong><br />' + (localStorage.getItem('ember-user-name') || 'Customer') + '<br />Address: ' + escHtml(order.address) + '</div>' +
          '<div style="text-align:right;"><strong>Payment Method:</strong><br />' + escHtml(order.payment) + '<br /><span style="color:#4caf50;font-weight:700;">PAID (Verified)</span></div>' +
        '</div>' +

        '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px;">' +
          '<thead>' +
            '<tr style="border-bottom:1px solid #1A1512;font-weight:700;">' +
              '<th style="text-align:left;padding-bottom:6px;">Item</th>' +
              '<th style="text-align:center;padding-bottom:6px;">Qty</th>' +
              '<th style="text-align:right;padding-bottom:6px;">Rate</th>' +
              '<th style="text-align:right;padding-bottom:6px;">Amount</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + itemRows + '</tbody>' +
        '</table>' +

        '<div style="width:220px;margin-left:auto;font-size:12px;display:flex;flex-direction:column;gap:4px;">' +
          '<div style="display:flex;justify-content:space-between;"><span>Item Total:</span><span>₹' + order.itemTotal + '</span></div>' +
          (order.discount > 0 ? '<div style="display:flex;justify-content:space-between;color:#4caf50;"><span>Promo Discount:</span><span>-₹' + order.discount + '</span></div>' : '') +
          '<div style="display:flex;justify-content:space-between;"><span>Taxes & Packaging:</span><span>₹35</span></div>' +
          '<div style="display:flex;justify-content:space-between;font-size:15px;font-weight:900;border-top:1px solid #1A1512;padding-top:6px;margin-top:4px;"><span>Grand Total:</span><span style="color:#D9662C;">₹' + order.total + '</span></div>' +
        '</div>' +

        '<div style="margin-top:24px;border-top:1px dashed #E5DDD5;padding-top:12px;text-align:center;font-size:11px;color:#8C8175;">' +
          'This is an authentic computer generated invoice. No signature required. Thank you for dining with EMBER!' +
        '</div>';
    }

    overlay.classList.add('open');
  }

  function closeInvoice() {
    var overlay = document.getElementById('invoiceOverlay');
    if (overlay) overlay.classList.remove('open');
  }

  var currentRatingOrderId = null;

  function buildRatingModal() {
    var old = document.getElementById('ratingOverlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'ratingOverlay';
    overlay.className = 'rating-modal-overlay';
    overlay.innerHTML =
      '<div class="rating-modal-card" style="padding:28px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border,#2A241F);padding-bottom:12px;margin-bottom:16px;">' +
          '<h3 style="font-family:\'Fraunces\',serif;font-size:20px;margin:0;">Rate Your EMBER Order</h3>' +
          '<button onclick="window.emberCart.closeRatingModal()" style="background:none;border:none;color:var(--muted,#8C8175);font-size:18px;cursor:pointer;">✕</button>' +
        '</div>' +
        '<p style="font-size:13px;color:var(--muted,#8C8175);margin:0 0 10px;text-align:center;">How was your food and delivery experience?</p>' +

        '<div class="star-rating-box" id="starRatingBox">' +
          '<span class="star-item active" data-v="1" onclick="setStarRating(1)">★</span>' +
          '<span class="star-item active" data-v="2" onclick="setStarRating(2)">★</span>' +
          '<span class="star-item active" data-v="3" onclick="setStarRating(3)">★</span>' +
          '<span class="star-item active" data-v="4" onclick="setStarRating(4)">★</span>' +
          '<span class="star-item active" data-v="5" onclick="setStarRating(5)">★</span>' +
        '</div>' +

        '<textarea id="ratingFeedback" placeholder="Share your experience (e.g. food was piping hot, flavors were exquisite!)" ' +
                  'style="width:100%;height:80px;background:var(--surface,#14100E);border:1px solid var(--border,#2A241F);color:var(--text,#F4EDE4);border-radius:8px;padding:10px;font-size:12px;outline:none;resize:none;margin-bottom:16px;"></textarea>' +

        '<button onclick="window.emberCart.submitRating()" style="width:100%;background:#D9662C;color:#fff;border:none;padding:12px;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer;">' +
          'Submit Review ⭐' +
        '</button>' +
      '</div>';

    document.body.appendChild(overlay);
  }

  var selectedStarCount = 5;

  window.setStarRating = function (v) {
    selectedStarCount = v;
    document.querySelectorAll('.star-item').forEach(function (s) {
      var val = parseInt(s.dataset.v || '0', 10);
      s.classList.toggle('active', val <= v);
    });
  };

  function openRatingModal(orderId) {
    currentRatingOrderId = orderId;
    var overlay = document.getElementById('ratingOverlay');
    if (!overlay) buildRatingModal();
    overlay = document.getElementById('ratingOverlay');
    overlay.classList.add('open');
  }

  function closeRatingModal() {
    var overlay = document.getElementById('ratingOverlay');
    if (overlay) overlay.classList.remove('open');
  }

  function submitRating() {
    var fb = document.getElementById('ratingFeedback');
    var text = fb ? fb.value.trim() : '';
    var reviewer = localStorage.getItem('ember-user-name') || 'Verified Diner';

    var reviews = getUserReviews();
    reviews.unshift({
      id: currentRatingOrderId || '#EMB-ORD',
      stars: selectedStarCount,
      text: text || 'Authentic charcoal smoked flavors and prompt delivery!',
      author: reviewer,
      date: 'Just now'
    });
    saveUserReviews(reviews);

    closeRatingModal();
    toast('⭐ Thank you! Rated ' + selectedStarCount + ' Stars. Review submitted!', '#4caf50');
  }

  function wireDishClicks() {
    document.querySelectorAll('.dish-card').forEach(function (card) {
      var img = card.querySelector('img');
      var nameEl = card.querySelector('.dish-name');
      var priceEl = card.querySelector('.price');
      var descEl = card.querySelector('.dish-desc');

      var openHandler = function (e) {
        if (e.target.closest('.add-btn') || e.target.closest('.dish-stepper')) return;
        var rawName = nameEl ? nameEl.textContent.trim().replace(/^[^\w\u0900-\u097F]+/, '').trim() : '';
        var price = priceEl ? parseInt(priceEl.textContent.replace(/[^\d]/g, ''), 10) : 0;
        var imgSrc = img ? img.src : '';
        var desc = descEl ? descEl.textContent.trim() : '';

        if (rawName && price) {
          openDishDetails({ name: rawName, price: price, img: imgSrc, desc: desc });
        }
      };

      if (img) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', openHandler);
      }
      if (nameEl) {
        nameEl.style.cursor = 'pointer';
        nameEl.addEventListener('click', openHandler);
      }
    });
  }

  function wireTrackLiveButtons() {
    document.querySelectorAll('a[href*="#orders"], a[href="profile.html#orders"]').forEach(function (a) {
      if (a.textContent.indexOf('Track Live') !== -1) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          var active = getActiveOrder();
          openLiveTracking(active ? active.id : null);
        });
      }
    });
  }

  function wireAddBtns() {
    document.querySelectorAll('.add-btn').forEach(function (btn) {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var card = btn.closest('.dish-card');
        if (!card) return;

        var nameEl  = card.querySelector('.dish-name');
        var priceEl = card.querySelector('.price');
        var imgEl   = card.querySelector('img');

        var rawName = nameEl ? nameEl.textContent.trim() : '';
        var name    = rawName.replace(/^[^\w\u0900-\u097F]+/, '').trim();
        var price   = priceEl ? parseInt(priceEl.textContent.replace(/[^\d]/g, ''), 10) : 0;
        var img     = imgEl   ? imgEl.src : '';

        if (!name || !price) return;
        addToCart(name, price, img);
      });
    });
  }

  function updateLiveTrackerUI() {
    var trackerWrap = document.querySelector('.live-tracker-wrap');
    if (!trackerWrap) return;

    var active = getActiveOrder();
    if (!active) {
      trackerWrap.style.display = 'none';
      return;
    }

    trackerWrap.style.display = 'block';

    var orderIdEl = trackerWrap.querySelector('.tracker-order-id') || trackerWrap.querySelector('div[style*="letter-spacing: 1.5px"], div[style*="letter-spacing:1.5px"]');
    if (orderIdEl) {
      orderIdEl.textContent = 'LIVE ORDER STATUS • ' + active.id;
    }

    var elapsedMinutes = Math.floor((Date.now() - active.placedAt) / (1000 * 60));
    var eta = Math.max(2, (active.etaMinutes || 25) - elapsedMinutes);

    var etaEl = trackerWrap.querySelector('.tracker-eta-val') || trackerWrap.querySelector('span[style*="color: #4caf50"], span[style*="color:#4caf50"]');
    if (etaEl) {
      etaEl.textContent = 'ETA: ' + eta + ' Mins';
    }

    var statusTitle = trackerWrap.querySelector('.tracker-status-title') || trackerWrap.querySelector('h3');
    var progressLine = trackerWrap.querySelector('.tracker-progress-bar') || trackerWrap.querySelector('div[style*="background: #D9662C"], div[style*="background:#D9662C"]');
    var riderName = trackerWrap.querySelector('.tracker-rider-name');
    if (riderName && active.rider && active.rider.name) {
      riderName.innerHTML = escHtml(active.rider.name) + ' <span style="font-size:11px;color:#D9662C;">⭐ ' + (active.rider.rating || '4.9') + '</span>';
    }

    if (elapsedMinutes < 3) {
      if (statusTitle) statusTitle.textContent = 'Order received & confirmed by restaurant';
      if (progressLine) progressLine.style.width = '20%';
    } else if (elapsedMinutes < 10) {
      if (statusTitle) statusTitle.textContent = 'Cooking over live wood fire & coal';
      if (progressLine) progressLine.style.width = '45%';
    } else if (elapsedMinutes < 22) {
      if (statusTitle) statusTitle.textContent = 'Delivery Partner on the way to your location';
      if (progressLine) progressLine.style.width = '75%';
    } else {
      if (statusTitle) statusTitle.textContent = 'Order Delivered! Enjoy your hot meal 🔥';
      if (progressLine) progressLine.style.width = '100%';
    }
  }

  function clearActiveOrder() {
    localStorage.removeItem(ACTIVE_ORDER_KEY);
    updateLiveTrackerUI();
    toast('Order dismissed from live tracker');
  }

  function renderProfileOrders() {
    var container = document.querySelector('.orders-history-list');
    if (!container) return;

    var orders = getOrders();
    if (!orders || !orders.length) return;

    var newHtml = orders.map(function (o) {
      var itemsDesc = o.items.map(function (i) {
        return '• ' + i.qty + 'x ' + escHtml(i.name);
      }).join('<br />');

      return (
        '<div class="order-history-card" style="border-left: 3px solid #D9662C;">' +
          '<div class="order-card-top">' +
            '<div>' +
              '<h3 class="order-rest-name">EMBER Fire Kitchen</h3>' +
              '<div class="order-id-date">Order ' + escHtml(o.id) + ' • ' + escHtml(o.date) + '</div>' +
            '</div>' +
            '<span class="order-status-badge" style="background:rgba(76,175,80,0.15);color:#4caf50;border:1px solid #4caf50;">' +
              '✔ Confirmed' +
            '</span>' +
          '</div>' +
          '<div class="order-items-summary">' + itemsDesc + '</div>' +
          '<div class="order-card-bottom">' +
            '<div class="order-total-price">₹' + o.total + ' ' +
              '<span style="font-size:12px;color:#8C8175;font-family:\'Inter Tight\';">via ' + escHtml(o.payment) + ' (' + escHtml(o.address) + ')</span>' +
            '</div>' +
            '<div class="order-actions" style="display:flex;gap:6px;flex-wrap:wrap;">' +
              '<button onclick="window.emberCart.openLiveTracking(\'' + escHtml(o.id) + '\')" class="btn btn-primary btn-sm" style="cursor:pointer;background:#D9662C;border-color:#D9662C;">Track 📍</button>' +
              '<button onclick="window.emberCart.reorder(\'' + escHtml(o.id) + '\')" class="btn btn-primary btn-sm" style="cursor:pointer;">Reorder 🔄</button>' +
              '<button onclick="window.emberCart.openInvoice(\'' + escHtml(o.id) + '\')" class="btn btn-ghost btn-sm" style="cursor:pointer;">Invoice 📄</button>' +
              '<button onclick="window.emberCart.openRatingModal(\'' + escHtml(o.id) + '\')" class="btn btn-ghost btn-sm" style="cursor:pointer;">Rate ⭐</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    var defaultCards = container.querySelectorAll('.order-history-card:not([data-dynamic])');
    var existingDynamic = container.querySelectorAll('.order-history-card[data-dynamic]');
    existingDynamic.forEach(function (c) { c.remove(); });

    var temp = document.createElement('div');
    temp.innerHTML = newHtml;
    Array.from(temp.children).forEach(function (node) {
      node.dataset.dynamic = 'true';
      container.insertBefore(node, container.firstChild);
    });
  }

  function handleRestaurantFilter() {
    var params = new URLSearchParams(window.location.search);
    var rParam = params.get('restaurant');
    var qParam = params.get('q');

    if (rParam && document.querySelector('.menu-grid')) {
      var rDecoded = decodeURIComponent(rParam);
      var hero = document.querySelector('.page-hero');
      if (hero) {
        var oldBanner = document.querySelector('.restaurant-active-banner');
        if (oldBanner) oldBanner.remove();

        var banner = document.createElement('div');
        banner.className = 'restaurant-active-banner';
        banner.innerHTML =
          '<div>' +
            '<h3>🔥 ' + escHtml(rDecoded) + ' Menu</h3>' +
            '<p>Handcrafted selection cooked fresh upon order</p>' +
          '</div>' +
          '<button class="clear-filter-btn" onclick="window.location.href=\'explore.html\'">Show All Dishes ✕</button>';
        hero.parentNode.insertBefore(banner, hero.nextSibling);
      }

      var matchKeywords = [];
      if (rDecoded.indexOf('Pukht') !== -1) matchKeywords = ['biryani', 'mutton', 'handi', 'chicken'];
      else if (rDecoded.indexOf('Burger') !== -1) matchKeywords = ['burger', 'smash', 'chicken', 'portobello', 'crunch'];
      else if (rDecoded.indexOf('Pizza') !== -1) matchKeywords = ['pizza', 'margherita', 'pasta', 'pepperoni', 'fettuccine'];
      else if (rDecoded.indexOf('Wok') !== -1 || rDecoded.indexOf('Hearth') !== -1) matchKeywords = ['tikka', 'seekh', 'dal', 'butter'];
      else if (rDecoded.indexOf('Dolce') !== -1) matchKeywords = ['cheesecake', 'shake', 'shahi', 'brownie', 'dessert'];

      if (matchKeywords.length) {
        document.querySelectorAll('.dish-card').forEach(function (card) {
          var text = card.textContent.toLowerCase();
          var matched = matchKeywords.some(function (kw) { return text.indexOf(kw) !== -1; });
          card.style.display = matched ? '' : 'none';
        });
        document.querySelectorAll('.section[id]').forEach(function (sec) {
          var any = Array.from(sec.querySelectorAll('.dish-card')).some(function (c) {
            return c.style.display !== 'none';
          });
          sec.style.display = any ? '' : 'none';
        });
      }
    }

    if (qParam && document.querySelector('.menu-grid')) {
      var searchBox = document.querySelector('.nav-search-box input');
      if (searchBox) {
        searchBox.value = qParam;
        searchBox.dispatchEvent(new Event('input'));
      }
    }
  }

  function wireRestaurantCards() {
    document.querySelectorAll('.rest-card').forEach(function (card) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        var nameEl = card.querySelector('.rest-name');
        if (nameEl) {
          var rName = encodeURIComponent(nameEl.textContent.trim());
          window.location.href = 'explore.html?restaurant=' + rName;
        }
      });
    });
  }

  var searchInput = document.querySelector('.nav-search-box input');
  var hasMenuGrid = !!document.querySelector('.menu-grid');

  if (searchInput) {
    if (hasMenuGrid) {
      searchInput.addEventListener('input', function () {
        var q = this.value.toLowerCase().trim();
        document.querySelectorAll('.dish-card').forEach(function (card) {
          var match = !q || card.textContent.toLowerCase().includes(q);
          card.style.display = match ? '' : 'none';
        });
        document.querySelectorAll('.section[id]').forEach(function (sec) {
          var any = Array.from(sec.querySelectorAll('.dish-card'))
            .some(function (c) { return c.style.display !== 'none'; });
          sec.style.display = any ? '' : 'none';
        });
        document.querySelectorAll('.filter-pill').forEach(function (p) {
          p.classList.toggle('active', !q);
        });
      });

      document.querySelectorAll('.filter-pill').forEach(function (pill) {
        pill.addEventListener('click', function (e) {
          var href = this.getAttribute('href');
          if (href && href.startsWith('#')) {
            e.preventDefault();
            var targetId = href.substring(1);
            var targetSec = document.getElementById(targetId);
            if (targetSec) {
              targetSec.scrollIntoView({ behavior: 'smooth' });
            }
          }
          searchInput.value = '';
          document.querySelectorAll('.dish-card,.section[id]').forEach(function (el) {
            el.style.display = '';
          });
          document.querySelectorAll('.filter-pill').forEach(function (p) {
            p.classList.remove('active');
          });
          this.classList.add('active');
        });
      });
    } else {
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var q = this.value.trim();
          if (q) window.location.href = 'explore.html?q=' + encodeURIComponent(q);
        }
      });
    }
  }

var sortBtns = document.querySelectorAll('.sort-btn');
  if (sortBtns.length) {
    var grids = document.querySelectorAll('.menu-grid');
    grids.forEach(function (grid) {
      var cards = Array.from(grid.querySelectorAll('.dish-card'));
      cards.forEach(function (card, idx) {
        if (!card.dataset.origIdx) {
          card.dataset.origIdx = idx;
        }
      });
    });

    sortBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sortType = btn.dataset.sort;
        sortBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        grids.forEach(function (grid) {
          var cards = Array.from(grid.querySelectorAll('.dish-card'));
          cards.sort(function (a, b) {
            var priceA = parseFloat(a.dataset.price) || (parseInt(((a.querySelector('.price') || {}).textContent || '').replace(/[^\d]/g, ''), 10) || 0);
            var priceB = parseFloat(b.dataset.price) || (parseInt(((b.querySelector('.price') || {}).textContent || '').replace(/[^\d]/g, ''), 10) || 0);
            var ratingA = parseFloat(a.dataset.rating) || (parseFloat(((a.querySelector('.rating') || {}).textContent || '').replace(/[^\d.]/g, '')) || 0);
            var ratingB = parseFloat(b.dataset.rating) || (parseFloat(((b.querySelector('.rating') || {}).textContent || '').replace(/[^\d.]/g, '')) || 0);
            var timeA = parseFloat(a.dataset.time) || (parseInt(((a.querySelector('.del-time') || {}).textContent || '').replace(/[^\d]/g, ''), 10) || 20);
            var timeB = parseFloat(b.dataset.time) || (parseInt(((b.querySelector('.del-time') || {}).textContent || '').replace(/[^\d]/g, ''), 10) || 20);
            var origA = parseInt(a.dataset.origIdx, 10) || 0;
            var origB = parseInt(b.dataset.origIdx, 10) || 0;

            if (sortType === 'price-asc') {
              return priceA - priceB;
            } else if (sortType === 'price-desc') {
              return priceB - priceA;
            } else if (sortType === 'rating') {
              return ratingB - ratingA;
            } else if (sortType === 'time') {
              return timeA - timeB;
            } else {
              return origA - origB;
            }
          });

          cards.forEach(function (card) {
            grid.appendChild(card);
          });
        });

        var labels = {
          'relevance': 'Relevance',
          'price-asc': 'Price: Low to High',
          'price-desc': 'Price: High to Low',
          'rating': 'Top Rated',
          'time': 'Fastest Delivery'
        };
        toast('⚡ Sorted by: ' + (labels[sortType] || sortType));
      });
    });
  }

    var vegCheck = document.getElementById('vegCheck');
  if (vegCheck) {
    var savedVeg = localStorage.getItem('ember-veg-filter');
    if (savedVeg === 'veg-only') {
      vegCheck.checked = false;
    } else {
      vegCheck.checked = true;
    }

    function applyVegFilter() {
      var vegOnly = !vegCheck.checked;
      localStorage.setItem('ember-veg-filter', vegOnly ? 'veg-only' : 'all');

      document.querySelectorAll('.dish-card.nonveg-card').forEach(function (card) {
        card.style.display = vegOnly ? 'none' : '';
      });

      document.querySelectorAll('.section').forEach(function (sec) {
        var cards = sec.querySelectorAll('.dish-card');
        if (!cards.length) return;
        var anyVisible = Array.from(cards).some(function (c) {
          return c.style.display !== 'none';
        });
        sec.style.display = anyVisible ? '' : 'none';
      });

      toast(vegOnly ? '🌱 Filtered: Pure Veg Only' : '🍖 Showing All Dishes', '#D9662C');
    }

    vegCheck.addEventListener('change', applyVegFilter);
    applyVegFilter();
  }

  var loggedIn   = localStorage.getItem('ember-logged-in') === 'true';
  var userName   = localStorage.getItem('ember-user-name') || '';

  var navAuthBtn = document.querySelector('.nav-auth-btn');
  if (navAuthBtn && loggedIn && userName) {
    var firstName = userName.split(' ')[0];
    navAuthBtn.textContent = '👤 ' + firstName;
    navAuthBtn.href        = 'profile.html';
    navAuthBtn.title       = 'My Profile';
  }

  document.querySelectorAll('.mobile-nav a[href="login.html"]').forEach(function (a) {
    if (loggedIn) {
      a.textContent = '👤 ' + (userName.split(' ')[0] || 'Profile');
      a.href        = 'profile.html';
    }
  });

  var mobileLogout = document.querySelector('.mobile-nav a[href="logout.html"]');
  if (mobileLogout) mobileLogout.style.display = loggedIn ? '' : 'none';

  document.querySelectorAll('.coupon-tag').forEach(function (tag) {
    tag.style.cursor = 'pointer';
    tag.setAttribute('title', 'Click to copy code');
    tag.addEventListener('click', function () {
      var code = tag.textContent.trim();
      copyText(code, function () {
        toast('✓ Copied: ' + code, '#4caf50');
      });
    });
  });

  document.querySelectorAll('.coupon-apply-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var card = btn.closest('.coupon-card');
      var tag  = card && card.querySelector('.coupon-tag');
      var code = tag ? tag.textContent.trim() : '';
      if (code) {
        applyCouponCode(code);
        toast('✓ Applied ' + code + '! Opening menu…', '#4caf50');
      }
      setTimeout(function () { window.location.href = 'explore.html'; }, 800);
    });
  });

  var pForm = document.querySelector('.profile-form-grid');
  if (pForm) {
    var pFields = Array.from(pForm.querySelectorAll('.p-input'));
    var pKeys   = [
      'ember-pf-name', 'ember-pf-email', 'ember-pf-phone',
      'ember-pf-diet', 'ember-pf-dob',   'ember-pf-city'
    ];

    pFields.forEach(function (inp, i) {
      var v = localStorage.getItem(pKeys[i]);
      if (v) inp.value = v;
    });

    pForm.addEventListener('submit', function (e) {
      e.preventDefault();
      pFields.forEach(function (inp, i) {
        localStorage.setItem(pKeys[i], inp.value.trim());
      });
      if (pFields[0] && pFields[0].value) {
        localStorage.setItem('ember-user-name', pFields[0].value.trim());
        updateProfileDisplay();
      }
      var saveBtn = pForm.querySelector('button[type="submit"]');
      saveBtn.textContent     = '✓  Saved!';
      saveBtn.style.background = '#4caf50';
      setTimeout(function () {
        saveBtn.textContent     = 'Save Changes';
        saveBtn.style.background = '';
      }, 2000);
    });
  }

  function updateProfileDisplay() {
    var n = localStorage.getItem('ember-pf-name')  || localStorage.getItem('ember-user-name')  || '';
    var e = localStorage.getItem('ember-pf-email') || localStorage.getItem('ember-user-email') || '';
    var p = localStorage.getItem('ember-pf-phone') || localStorage.getItem('ember-user-phone') || '';

    var h1 = document.querySelector('.profile-user-details h1');
    if (h1 && n) {
      var badge = h1.querySelector('.membership-badge');
      h1.textContent = n + ' ';
      if (badge) h1.appendChild(badge);
    }
    var spans = document.querySelectorAll('.profile-user-meta span');
    if (spans[0] && e) spans[0].textContent = '📧 ' + e;
    if (spans[1] && p) spans[1].textContent = '📱 ' + p;
  }

  updateProfileDisplay();

  var page = window.location.pathname.split('/').pop() || 'home.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'home.html')) {
      a.classList.add('active');
    }
  });

  if (page === 'logout.html') {
    localStorage.removeItem('ember-logged-in');
  }

  buildCartShell();
  wireAddBtns();
  wireDishClicks();
  wireTrackLiveButtons();
  syncCardSteppers();
  refreshCartUI();
  wireRestaurantCards();
  handleRestaurantFilter();
  updateLiveTrackerUI();
  renderProfileOrders();

  var signupForm = document.getElementById('signupForm') || (document.querySelector('.auth-page form') && document.getElementById('confirm') ? document.querySelector('.auth-page form') : null);
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearFormErrors(signupForm);

      var nameF  = document.getElementById('name');
      var emailF = document.getElementById('email');
      var phoneF = document.getElementById('phone');
      var passF  = document.getElementById('password');
      var confF  = document.getElementById('confirm');
      var ok     = true;

      if (!nameF || !nameF.value.trim()) {
        if (nameF) fieldError(nameF, 'Please enter your full name.');
        ok = false;
      }
      if (!emailF || !validEmail(emailF.value)) {
        if (emailF) fieldError(emailF, 'Please enter a valid email address.');
        ok = false;
      }
      if (!phoneF || phoneF.value.replace(/\D/g, '').length < 10) {
        if (phoneF) fieldError(phoneF, 'Phone must be at least 10 digits.');
        ok = false;
      }
      if (!passF || passF.value.length < 6) {
        if (passF) fieldError(passF, 'Password must be at least 6 characters.');
        ok = false;
      }
      if (!confF || confF.value !== (passF ? passF.value : '')) {
        if (confF) fieldError(confF, 'Passwords do not match.');
        ok = false;
      }

      if (ok) {
        var cleanName = nameF.value.trim();
        var cleanEmail = emailF.value.trim();
        var cleanPhone = phoneF.value.trim();

        localStorage.setItem('ember-user-name', cleanName);
        localStorage.setItem('ember-user-email', cleanEmail);
        localStorage.setItem('ember-user-phone', cleanPhone);
        localStorage.setItem('ember-pf-name', cleanName);
        localStorage.setItem('ember-pf-email', cleanEmail);
        localStorage.setItem('ember-pf-phone', cleanPhone);

        var btn = signupForm.querySelector('button[type="submit"]');
        if (btn) {
          btn.textContent = '✓ Account Created! Redirecting…';
          btn.disabled = true;
          btn.style.background = '#4caf50';
        }
        toast('✓ Account created successfully! Please sign in.', '#4caf50');
        setTimeout(function () { window.location.href = 'login.html'; }, 1100);
      }
    });
  }

  var loginForm = document.getElementById('loginForm') || (document.querySelector('.auth-page form') && !document.getElementById('confirm') ? document.querySelector('.auth-page form') : null);
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearFormErrors(loginForm);

      var emailF = document.getElementById('email');
      var passF  = document.getElementById('password');
      var ok     = true;

      if (!emailF || !validEmail(emailF.value)) {
        if (emailF) fieldError(emailF, 'Please enter a valid email address.');
        ok = false;
      }
      if (!passF || !passF.value.trim() || passF.value.length < 4) {
        if (passF) fieldError(passF, 'Please enter your password (min 4 characters).');
        ok = false;
      }

      if (ok) {
        var cleanEmail = emailF.value.trim();
        localStorage.setItem('ember-logged-in', 'true');
        localStorage.setItem('ember-user-email', cleanEmail);
        if (!localStorage.getItem('ember-user-name')) {
          var derived = cleanEmail.split('@')[0]
            .replace(/[._-]+/g, ' ')
            .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
          localStorage.setItem('ember-user-name', derived);
          localStorage.setItem('ember-pf-name', derived);
        }

        var btn = loginForm.querySelector('button[type="submit"]');
        if (btn) {
          btn.textContent = '✓ Signing you in…';
          btn.disabled = true;
          btn.style.background = '#4caf50';
        }
        toast('✓ Welcome back, ' + (localStorage.getItem('ember-user-name') || 'Member') + '!', '#4caf50');
        setTimeout(function () { window.location.href = 'profile.html'; }, 900);
      }
    });

    var forgotLink = document.querySelector('.auth-links a[href="#"]');
    if (forgotLink) {
      forgotLink.addEventListener('click', function (e) {
        e.preventDefault();
        var emailF = document.getElementById('email');
        if (!emailF || !validEmail(emailF.value)) {
          toast('Please enter your email address first.', '#D9662C');
        } else {
          toast('Password reset link sent to ' + emailF.value + ' (Demo)', '#4caf50');
        }
      });
    }
  }

  document.querySelectorAll('.p-nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        var target = document.getElementById(href.substring(1));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
        document.querySelectorAll('.p-nav-link').forEach(function (l) { l.classList.remove('active'); });
        this.classList.add('active');
      }
    });
  });

  function fieldError(input, msg) {
    input.style.borderColor = '#e74c3c';
    input.style.boxShadow   = '0 0 0 3px rgba(231,76,60,0.18)';
    var old = input.parentElement.querySelector('.em-err');
    if (old) old.remove();
    var p = document.createElement('p');
    p.className  = 'em-err';
    p.textContent = msg;
    p.style.cssText = 'color:#e74c3c;font-size:12px;margin:5px 0 0;font-weight:500;';
    input.parentElement.appendChild(p);
    input.addEventListener('input', function clear() {
      input.style.borderColor = '';
      input.style.boxShadow   = '';
      p.remove();
      input.removeEventListener('input', clear);
    });
  }

  function clearFormErrors(form) {
    form.querySelectorAll('.em-err').forEach(function (el) { el.remove(); });
    form.querySelectorAll('input').forEach(function (inp) {
      inp.style.borderColor = '';
      inp.style.boxShadow   = '';
    });
  }

  setInterval(updateLiveTrackerUI, 30000);

  function validEmail(v) {
    return v && v.trim().indexOf('@') > 0 && v.trim().indexOf('.') > 0;
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function copyText(text, cb) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(cb).catch(function () { legacyCopy(text); cb(); });
    } else {
      legacyCopy(text);
      cb();
    }
  }

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { }
    document.body.removeChild(ta);
  }

  function toast(msg, color) {
    var old = document.getElementById('ember-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.id = 'ember-toast';
    t.textContent = msg;
    t.style.cssText =
      'position:fixed;bottom:90px;left:50%;' +
      'transform:translateX(-50%) translateY(14px);' +
      'background:' + (color || '#D9662C') + ';color:#fff;' +
      'font-size:13px;font-weight:700;padding:10px 22px;' +
      'border-radius:50px;z-index:999999;white-space:nowrap;' +
      'box-shadow:0 4px 20px rgba(0,0,0,0.35);opacity:0;' +
      'transition:opacity .22s ease,transform .22s ease;' +
      'font-family:\'Inter Tight\',sans-serif;pointer-events:none;';
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        t.style.opacity   = '1';
        t.style.transform = 'translateX(-50%) translateY(0)';
      });
    });
    setTimeout(function () {
      t.style.opacity   = '0';
      t.style.transform = 'translateX(-50%) translateY(8px)';
      setTimeout(function () { if (t.parentNode) t.remove(); }, 280);
    }, 2300);
  }

});
