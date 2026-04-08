/* =============================================
   APP.JS - CôtePARC Car Wash Reservation Site
   ============================================= */

'use strict';

/* =============================================
   EMAILJS CONFIGURATION
   ============================================= */
const EMAILJS_PUBLIC_KEY   = 'zop-P62P1Isfv_-Cq'; 
const EMAILJS_SERVICE_ID   = 'service_coterparc';
const EMAILJS_TEMPLATE_ID  = 'template_949nyvq';

const EMAILJS_CONFIGURED   = EMAILJS_PUBLIC_KEY !== '';

if (EMAILJS_CONFIGURED && typeof emailjs !== 'undefined') {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

/* =============================================
   SUPABASE CONFIGURATION
   ============================================= */
const SUPABASE_URL = 'https://tgijjuubscchbfnhjyre.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_9yjHAfVEuRFGRzr73abVFg_BiFaG-GT'; 

let sb = null;
if (typeof supabase !== 'undefined') {
  sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// =============================================
// DYNAMIC PRICING LOGIC
// =============================================

const SERVICE_BASE_PRICES = {
  express: 15,
  complet: 35,
  detailing: 80
};

const VEHICLE_SURCHARGES = {
  citadine: 0,
  berline: 10,
  suv: 20,
  utilitaire: 40
};

function calculateTotal() {
  const service = serviceHiddenInput.value;
  const vehicle = document.getElementById('formVehicle').value;
  
  if (!service || !vehicle) return null;
  
  const base = SERVICE_BASE_PRICES[service] || 0;
  const surcharge = VEHICLE_SURCHARGES[vehicle] || 0;
  return base + surcharge;
}

function updatePriceDisplay() {
  const total = calculateTotal();
  const display = document.getElementById('priceDisplay');
  if (display) {
    if (total !== null) {
      display.innerHTML = `Total estimé : <span class="price-amount">${total}€</span>`;
      display.classList.add('visible');
    } else {
      display.classList.remove('visible');
    }
  }
}

// Update listeners
document.getElementById('formVehicle')?.addEventListener('change', updatePriceDisplay);

// GSAP Animations
window.addEventListener('load', () => {
  if (typeof gsap !== 'undefined') {
    gsap.from(".hero-title", { duration: 1, y: 50, opacity: 0, ease: "power4.out" });
    gsap.from(".hero-description", { duration: 1, y: 30, opacity: 0, delay: 0.2, ease: "power4.out" });
    gsap.from(".hero-actions", { duration: 1, y: 20, opacity: 0, delay: 0.4, ease: "power4.out" });
    gsap.from(".service-card", { 
      duration: 0.8, 
      y: 50, 
      opacity: 0, 
      stagger: 0.2, 
      scrollTrigger: {
        trigger: ".services-grid",
        start: "top 80%"
      }
    });
  }
});

// =============================================
// NAVBAR SCROLL EFFECT
// =============================================

const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 40);
});

// =============================================
// HAMBURGER MENU
// =============================================

const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger?.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', navLinks.classList.contains('open'));
});

navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// =============================================
// SCROLL REVEAL ANIMATION
// =============================================

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// =============================================
// SERVICE SELECTOR
// =============================================

const serviceOptions     = document.querySelectorAll('.service-option');
const serviceHiddenInput = document.getElementById('formService');

serviceOptions.forEach(option => {
  option.addEventListener('click', () => {
    serviceOptions.forEach(o => { o.classList.remove('selected'); o.setAttribute('aria-checked', 'false'); });
    option.classList.add('selected');
    option.setAttribute('aria-checked', 'true');
    serviceHiddenInput.value = option.dataset.service;
    serviceHiddenInput.dispatchEvent(new Event('change'));
  });
  option.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); option.click(); }
  });
});

// =============================================
// FORM VALIDATION & SUBMISSION
// =============================================

const reservationForm = document.getElementById('reservationForm');
const submitBtn       = document.getElementById('submitBtn');
const confirmModal    = document.getElementById('confirmModal');

const validationRules = {
  firstName: { required: true, minLength: 2 },
  lastName:  { required: true, minLength: 2 },
  email:     { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  phone:     { required: true, pattern: /^[+\d\s\-()]{6,}$/ },
  vehicle:   { required: true },
  service:   { required: true },
  date:      { required: true, future: true },
  time:      { required: true },
};

function validateField(name, value) {
  const rules = validationRules[name];
  if (!rules) return null;
  if (rules.required && !value.trim()) return 'Ce champ est obligatoire.';
  if (rules.minLength && value.trim().length < rules.minLength) return `Minimum ${rules.minLength} caractères.`;
  if (rules.pattern && !rules.pattern.test(value)) return name === 'email' ? 'Adresse email invalide.' : 'Format invalide.';
  if (rules.future) {
    const chosen = new Date(value), today = new Date();
    today.setHours(0,0,0,0);
    if (chosen < today) return 'Veuillez choisir une date future.';
  }
  return null;
}

function showFieldError(name, message) {
  const input = reservationForm.querySelector(`[name="${name}"]`) || document.getElementById(`form${capitalize(name)}`);
  const errEl = document.getElementById(`err_${name}`);
  if (input) input.classList.add('error');
  if (errEl) { errEl.textContent = message; errEl.classList.add('visible'); }
}

function clearFieldError(name) {
  const input = reservationForm.querySelector(`[name="${name}"]`) || document.getElementById(`form${capitalize(name)}`);
  const errEl = document.getElementById(`err_${name}`);
  if (input) input.classList.remove('error');
  if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
}

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

reservationForm?.querySelectorAll('input, select, textarea').forEach(el => {
  el.addEventListener('blur', () => {
    const name = el.name || el.id.replace('form','').toLowerCase();
    const err = validateField(name, el.value);
    if (err) showFieldError(name, err); else clearFieldError(name);
  });
  el.addEventListener('input', () => {
    const name = el.name || el.id.replace('form','').toLowerCase();
    clearFieldError(name);
  });
});

serviceHiddenInput?.addEventListener('change', () => clearFieldError('service'));

/**
 * Envoi des notifications (Client + Admin)
 */
async function sendNotificationEmails(reservation) {
  if (!EMAILJS_CONFIGURED) {
    console.warn('EmailJS non configuré. Notification ignorée.');
    return;
  }

  const params = {
    ref: reservation.ref,
    client_name: `${reservation.first_name} ${reservation.last_name}`,
    client_email: reservation.email,
    client_phone: reservation.phone,
    vehicle: reservation.vehicle_label || reservation.vehicle,
    service: reservation.service_name || reservation.service,
    date: formatDate(reservation.date),
    time: reservation.time,
    message: reservation.message || 'Aucun message'
  };

  try {
    // 1. Envoi au client
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      ...params,
      to_email: reservation.email,
      to_name: params.client_name,
      user_email: reservation.email,
      user_name: params.client_name,
      client_email: reservation.email,
      reply_to: 'coterparc@gmail.com',
      contact_email: reservation.email,
      subject: 'Confirmation de votre demande — CôtePARC'
    });

    // 2. Envoi à l'admin
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      ...params,
      to_email: 'coterparc@gmail.com',
      to_name: 'Admin CôtePARC',
      user_email: 'coterparc@gmail.com',
      reply_to: reservation.email,
      contact_email: 'coterparc@gmail.com',
      subject: '🔔 ALERTE : Nouvelle réservation reçue !'
    });

    showToast('success', 'Email envoyé', 'Un récapitulatif a été envoyé par mail.');
  } catch (err) {
    console.error('EmailJS Error:', err);
    showToast('error', 'Erreur email', `Détail : ${err.text || err.message || 'Erreur inconnue'}`);
  }
}
reservationForm?.addEventListener('submit', (e) => {
  e.preventDefault();

  let hasError = false;
  const formData = {};

  const fields = {
    firstName: reservationForm.querySelector('[name="firstName"]').value,
    lastName:  reservationForm.querySelector('[name="lastName"]').value,
    email:     reservationForm.querySelector('[name="email"]').value,
    phone:     reservationForm.querySelector('[name="phone"]').value,
    vehicle:   reservationForm.querySelector('[name="vehicle"]').value,
    service:   serviceHiddenInput.value,
    date:      reservationForm.querySelector('[name="date"]').value,
    time:      reservationForm.querySelector('[name="time"]').value,
  };

  Object.entries(fields).forEach(([name, value]) => {
    const err = validateField(name, value);
    if (err) {
      showFieldError(name, err);
      hasError = true;
    } else {
      formData[name] = value;
    }
  });

  if (hasError) {
    showToast('error', 'Formulaire incomplet', 'Veuillez corriger les erreurs.');
    return;
  }

  formData.message = reservationForm.querySelector('[name="message"]').value;

  // Save reservation
  saveReservation(formData).then(reservation => {
    // Show loading on button
    submitBtn.disabled = true;
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Envoi en cours...';

    // Send Emails
    sendNotificationEmails(reservation).finally(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
      
      // Show confirmation modal
      showConfirmModal(reservation);

      // Reset form
      reservationForm.reset();
      serviceOptions.forEach(o => { o.classList.remove('selected'); o.setAttribute('aria-checked', 'false'); });
      serviceHiddenInput.value = '';
      if (typeof updatePriceDisplay === 'function') updatePriceDisplay();
    });
  });
});



// =============================================
// RESERVATION STORAGE
// =============================================

const SERVICE_LABELS = {
  exterieur: { name: 'Lavage Extérieur',   icon: 'bi-droplet-fill', price: '10€' },
  interieur: { name: 'Nettoyage Intérieur', icon: 'bi-stars',        price: '40€' },
};

const VEHICLE_LABELS = {
  citadine:   'Citadine',
  berline:    'Berline / Coupé',
  suv:        'SUV / 4x4',
  utilitaire: 'Utilitaire / Van',
};

function generateRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'CP-';
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

async function saveReservation(data) {
  const svc = SERVICE_LABELS[data.service];
  const reservation = {
    ref:          generateRef(),
    status:       'pending',
    first_name:   data.firstName,
    last_name:    data.lastName,
    email:        data.email,
    phone:        data.phone,
    vehicle:      data.vehicle,
    vehicle_label: VEHICLE_LABELS[data.vehicle] || data.vehicle,
    service:      data.service,
    service_name: svc?.name  || data.service,
    service_price: svc?.price || '-',
    date:         data.date,
    time:         data.time,
    message:      data.message,
  };

  // 1. Sauvegarde locale (fallback)
  const localReservations = getReservations();
  localReservations.push({ ...reservation, id: Date.now().toString(), createdAt: new Date().toISOString() });
  localStorage.setItem('cw_reservations', JSON.stringify(localReservations));

  // 2. Sauvegarde Supabase (si configuré)
  if (sb) {
    try {
      const { data: dbData, error } = await sb
        .from('reservations')
        .insert([reservation])
        .select();
      
      if (error) throw error;
      console.log('Synchronisé avec Supabase !', dbData);
      return { ...reservation, ...dbData[0] };
    } catch (err) {
      console.error('Erreur Supabase:', err);
    }
  }

  return reservation;
}

function getReservations() {
  try { return JSON.parse(localStorage.getItem('cw_reservations')) || []; }
  catch { return []; }
}

// =============================================
// CONFIRMATION MODAL
// =============================================

function showConfirmModal(reservation) {
  document.getElementById('modalRef').textContent     = reservation.ref;
  document.getElementById('modalName').textContent    = `${reservation.first_name || 'Cher client'} ${reservation.last_name || ''}`;
  document.getElementById('modalDate').textContent    = formatDate(reservation.date) + ' à ' + reservation.time;
  document.getElementById('modalService').textContent = reservation.service_name || reservation.service;
  confirmModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

document.getElementById('closeModal')?.addEventListener('click', () => {
  confirmModal.classList.remove('active');
  document.body.style.overflow = '';
});

confirmModal?.addEventListener('click', (e) => {
  if (e.target === confirmModal) { confirmModal.classList.remove('active'); document.body.style.overflow = ''; }
});

// =============================================
// SET DATE MIN TO TODAY
// =============================================

const dateInput = document.querySelector('[name="date"]');
if (dateInput) {
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const dd    = String(today.getDate()).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================

const toastContainer = document.getElementById('toastContainer');

function showToast(type, title, message, duration = 4000) {
  const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill', warning: 'bi-exclamation-triangle-fill' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon"><i class="bi ${icons[type] || 'bi-info-circle-fill'}"></i></span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

// =============================================
// SMOOTH SCROLL
// =============================================

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// =============================================
// HELPERS
// =============================================

function formatDate(isoDate) {
  if (!isoDate) return '-';
  const [y, m, d] = isoDate.split('-');
  const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}

/* =============================================
   REVIEWS SYSTEM
   ============================================= */
const reviewModal = document.getElementById('reviewModal');
const reviewForm  = document.getElementById('reviewForm');
const openReviewBtn = document.getElementById('openReviewBtn');
const closeReviewBtn = document.getElementById('closeReviewBtn');
const starBtns = document.querySelectorAll('.star-btn');
const revRatingInput = document.getElementById('revRating');

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
});

// Star rating logic
starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        revRatingInput.value = val;
        updateStars(val);
    });
});

function updateStars(rating) {
    starBtns.forEach(btn => {
        const val = btn.getAttribute('data-value');
        if (val <= rating) {
            btn.className = 'bi bi-star-fill star-btn active';
        } else {
            btn.className = 'bi bi-star star-btn';
        }
    });
}

// Modal Toggle
openReviewBtn?.addEventListener('click', () => {
    reviewModal.classList.add('active');
    updateStars(5);
});

closeReviewBtn?.addEventListener('click', () => {
    reviewModal.classList.remove('active');
});

// Submit Review
reviewForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = reviewForm.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    const reviewData = {
        client_name: document.getElementById('revName').value,
        rating: parseInt(revRatingInput.value),
        comment: document.getElementById('revComment').value,
        status: 'approved'
    };

    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Envoi...';

    if (sb) {
        const { error } = await sb.from('reviews').insert([reviewData]);
        if (error) {
            console.error('Erreur Supabase:', error);
            showToast('error', 'Erreur', "Impossible d'envoyer l'avis.");
        } else {
            showToast('success', 'Merci !', "Votre avis a été publié.");
            reviewModal.classList.remove('active');
            reviewForm.reset();
            loadReviews();
        }
    }
    
    btn.disabled = false;
    btn.innerHTML = originalText;
});

// Load Reviews from Supabase
async function loadReviews() {
    const grid = document.getElementById('testimonialsGrid');
    if (!grid) return;

    if (sb) {
        const { data, error } = await sb
            .from('reviews')
            .select('*')
            .eq('status', 'approved')
            .order('rating', { ascending: false })
            .limit(3);

        if (!error && data && data.length > 0) {
            grid.innerHTML = '';
            data.forEach(rev => {
                const stars = '<i class="bi bi-star-fill"></i>'.repeat(rev.rating) + 
                            '<i class="bi bi-star"></i>'.repeat(5 - rev.rating);
                
                grid.innerHTML += `
                    <article class="testimonial-card" style="opacity:1; transform:none;">
                        <div class="testimonial-stars" aria-label="${rev.rating} étoiles">
                            ${stars}
                        </div>
                        <blockquote class="testimonial-text">"${rev.comment}"</blockquote>
                        <div class="testimonial-author">
                            <div class="author-avatar">${rev.client_name.charAt(0)}</div>
                            <div class="author-info">
                                <div class="author-name">${rev.client_name}</div>
                                <div class="author-verified"><i class="bi bi-patch-check-fill"></i> Client vérifié</div>
                            </div>
                        </div>
                    </article>
                `;
            });
        }
    }
}
