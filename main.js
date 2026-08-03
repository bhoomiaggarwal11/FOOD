// === NAV: brighten border on scroll ===
window.onscroll = function() {
  var nav = document.getElementById('nav');
  if (window.pageYOffset > 40) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
};


// === EMBER PARTICLES ===
function runEmbers(canvasId, count, delay) {
  setTimeout(function() {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var W, H;
    var particles = [];

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      W = rect.width;
      H = rect.height;
    }

    function makeParticle() {
      return {
        x: Math.random() * W * 0.85 + W * 0.05,
        y: H + Math.random() * 40,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.25,
        drift: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.55 + 0.2,
        decay: Math.random() * 0.003 + 0.001
      };
    }

    resize();
    window.onresize = resize;

    // Fill particles
    for (var i = 0; i < count; i++) {
      var p = makeParticle();
      p.y = Math.random() * H;
      particles.push(p);
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y -= p.speed;
        p.x += p.drift;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y < -20) {
          particles[i] = makeParticle();
          continue;
        }

        // Glow
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        g.addColorStop(0, 'rgba(217,102,44,' + p.alpha + ')');
        g.addColorStop(0.5, 'rgba(217,102,44,' + (p.alpha * 0.4) + ')');
        g.addColorStop(1, 'rgba(217,102,44,0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,200,130,' + (p.alpha * 0.9) + ')';
        ctx.fill();
      }

      requestAnimationFrame(tick);
    }
    tick();
  }, delay);
}

// Start hero embers
runEmbers('heroCanvas', 20, 900);

// Start offer embers when visible
var offerStarted = false;
window.addEventListener('scroll', function checkOffer() {
  var offer = document.querySelector('.offer');
  if (!offer || offerStarted) return;

  var rect = offer.getBoundingClientRect();
  if (rect.top < window.innerHeight * 0.75) {
    offerStarted = true;
    runEmbers('offerCanvas', 36, 200);
  }
});


// === SCROLL REVEAL ===
var revealElements = document.querySelectorAll('.cat-card, .dish-card, .rest-card, .why-item, .offer-content');

for (var i = 0; i < revealElements.length; i++) {
  revealElements[i].style.opacity = '0';
  revealElements[i].style.transform = 'translateY(24px)';
  revealElements[i].style.transition = 'opacity 600ms ease, transform 600ms ease';
}

window.addEventListener('scroll', function revealOnScroll() {
  for (var i = 0; i < revealElements.length; i++) {
    var el = revealElements[i];
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }
  }
});


// === VEG / NON-VEG TOGGLE ===
var isVeg = false;

function toggleVeg() {
  isVeg = !isVeg;

  var toggle = document.getElementById('vegToggle');
  if (isVeg) {
    toggle.classList.remove('nonveg');
  } else {
    toggle.classList.add('nonveg');
  }

  var cards = document.getElementsByClassName('dish-card');
  for (var i = 0; i < cards.length; i++) {
    var dot = cards[i].getElementsByClassName('dish-dot')[0];
    if (dot && dot.classList.contains('nonveg')) {
      if (isVeg) {
        cards[i].style.opacity = '0.2';
        cards[i].style.pointerEvents = 'none';
      } else {
        cards[i].style.opacity = '1';
        cards[i].style.pointerEvents = 'auto';
      }
    }
  }
}
