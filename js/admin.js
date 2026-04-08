/* =============================================
   ADMIN.JS - CôtePARC Admin Panel
   ============================================= */

'use strict';

/* =============================================
   EMAILJS CONFIGURATION
   ============================================= */
/* =============================================
   EMAILJS CONFIGURATION
   ============================================= */
const EMAILJS_PUBLIC_KEY  = 'zop-P62P1Isfv_-Cq';
const EMAILJS_SERVICE_ID  = 'service_coterparc';
const EMAILJS_TEMPLATE_ID = 'template_ts3clrf';
const EMAILJS_CONFIGURED  = EMAILJS_PUBLIC_KEY !== '';

if (EMAILJS_CONFIGURED && typeof emailjs !== 'undefined') {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

/* =============================================
   SUPABASE CONFIGURATION
   ============================================= */
const SUPABASE_URL = 'https://tgijjuubscchbfnhjyre.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_9yjHAfVEuRFGRzr73abVFg_BiFaG-GT'; 

let supabase = null;
if (SUPABASE_URL && typeof supabasejs !== 'undefined') {
  supabase = supabasejs.createClient(SUPABASE_URL, SUPABASE_KEY);
} else if (typeof _supabase !== 'undefined') {
  supabase = _supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

const ADMIN_CREDENTIALS = { email: 'coterparc@gmail.com', password: 'CotePARC2026' };
const SESSION_KEY       = 'cw_admin_session';
const RESERVATIONS_KEY  = 'cw_reservations';
const EMAILS_KEY        = 'cw_emails';

const SERVICE_LABELS = {
  exterieur: { name: 'Lavage Extérieur',    icon: 'bi-droplet-fill', price: '10€' },
  interieur: { name: 'Nettoyage Intérieur', icon: 'bi-stars',        price: '40€' },
};

const STATUS_LABELS = {
  pending:   'En attente',
  confirmed: 'Confirmée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

let currentFilter   = 'all';
let currentSearch   = '';
let currentDetailId = null;

// =============================================
// SESSION MANAGEMENT
// =============================================

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === 'authenticated';
}

function login(email, password) {
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    sessionStorage.setItem(SESSION_KEY, 'authenticated');
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  showLoginPage();
}

// =============================================
// PAGE ROUTING
// =============================================

function showLoginPage() {
  document.getElementById('loginPage').style.display  = 'flex';
  document.getElementById('adminApp').style.display   = 'none';
}

function showAdminApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminApp').style.display  = 'flex';
  initAdminApp();
}

// =============================================
// LOGIN FORM
// =============================================

const loginForm  = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email    = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const btn      = document.getElementById('loginBtn');

  btn.disabled   = true;
  btn.textContent = 'Connexion…';

  setTimeout(() => {
    if (login(email, password)) {
      showAdminApp();
    } else {
      loginError.classList.add('visible');
      loginError.textContent = 'Email ou mot de passe incorrect.';
      setTimeout(() => loginError.classList.remove('visible'), 3500);
    }
    btn.disabled    = false;
    btn.innerHTML   = 'Se connecter <i class="bi bi-arrow-right"></i>';
  }, 600);
});

// =============================================
// ADMIN APP INIT
// =============================================

async function initAdminApp() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('reservations').select('*');
      if (!error && data) {
        // Sync local with remote
        localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(data));
      }
    } catch(e) { console.error('Sync error:', e); }
  }
  updateStats();
  renderDashboardTable();
  renderReservations();
  renderEmails();
  startClock();
  updatePendingBadge();
}

// =============================================
// LIVE CLOCK
// =============================================

function startClock() {
  const clockEl = document.getElementById('adminClock');
  function tick() {
    clockEl.textContent = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
  tick();
  setInterval(tick, 1000);
}

// =============================================
// DATA HELPERS
// =============================================

function getReservations() {
  try { return JSON.parse(localStorage.getItem(RESERVATIONS_KEY)) || []; }
  catch { return []; }
}

function saveReservations(list) {
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(list));
}

function getEmails() {
  try { return JSON.parse(localStorage.getItem(EMAILS_KEY)) || []; }
  catch { return []; }
}

function saveEmails(list) {
  localStorage.setItem(EMAILS_KEY, JSON.stringify(list));
}

// =============================================
// STATS
// =============================================

function updateStats() {
  const all       = getReservations();
  const pending   = all.filter(r => r.status === 'pending').length;
  const confirmed = all.filter(r => r.status === 'confirmed').length;
  const completed = all.filter(r => r.status === 'completed').length;
  const cancelled = all.filter(r => r.status === 'cancelled').length;

  animateCount('statTotal',     all.length);
  animateCount('statPending',   pending);
  animateCount('statConfirmed', confirmed);
  animateCount('statCompleted', completed);
  animateCount('statCancelled', cancelled);

  setEl('qs_total',     all.length);
  setEl('qs_pending',   pending);
  setEl('qs_confirmed', confirmed);
  setEl('qs_completed', completed);
  setEl('qs_emails',    getEmails().length);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const duration = 600;
  const startTime = performance.now();
  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    el.textContent = Math.round(start + (target - start) * easeOut(progress));
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

// =============================================
// PENDING BADGE
// =============================================

function updatePendingBadge() {
  const pending = getReservations().filter(r => r.status === 'pending').length;
  const badge   = document.getElementById('pendingBadge');
  if (badge) {
    badge.textContent   = pending;
    badge.style.display = pending > 0 ? 'inline-block' : 'none';
  }
}

// =============================================
// RESERVATIONS TABLE
// =============================================

function getFilteredReservations() {
  let list = getReservations().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (currentFilter !== 'all') list = list.filter(r => r.status === currentFilter);
  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase();
    list = list.filter(r =>
      r.firstName?.toLowerCase().includes(q) ||
      r.lastName?.toLowerCase().includes(q)  ||
      r.email?.toLowerCase().includes(q)     ||
      r.ref?.toLowerCase().includes(q)       ||
      r.serviceName?.toLowerCase().includes(q)
    );
  }
  return list;
}

function buildTableRow(res) {
  const isPending   = res.status === 'pending';
  const isConfirmed = res.status === 'confirmed';
  return `
    <tr data-id="${escHtml(res.id)}">
      <td>
        <div class="client-name">${escHtml(res.firstName)} ${escHtml(res.lastName)}</div>
        <div class="client-email">${escHtml(res.email)}</div>
      </td>
      <td>${escHtml(res.ref)}</td>
      <td>
        <div>${escHtml(res.serviceName || res.service)}</div>
        <div style="font-size:0.75rem;color:var(--text-500)">${escHtml(res.vehicleLabel || res.vehicle)}</div>
      </td>
      <td>
        <div>${formatDate(res.date)}</div>
        <div style="font-size:0.78rem;color:var(--text-500)">${escHtml(res.time || '')}</div>
      </td>
      <td>${statusBadge(res.status)}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn action-btn-view" title="Voir détails" onclick="openDetail('${res.id}')">
            <i class="bi bi-eye"></i>
          </button>
          ${isPending ? `
            <button class="action-btn action-btn-confirm" title="Confirmer" onclick="confirmReservation('${res.id}')">
              <i class="bi bi-check-circle"></i>
            </button>
            <button class="action-btn action-btn-cancel" title="Annuler" onclick="cancelReservation('${res.id}')">
              <i class="bi bi-x-circle"></i>
            </button>` : ''}
          ${isConfirmed ? `
            <button class="action-btn action-btn-complete" title="Lavage terminé" onclick="completeReservation('${res.id}')">
              <i class="bi bi-check2-all"></i>
            </button>` : ''}
        </div>
      </td>
    </tr>`;
}

function renderDashboardTable() {
  const tbody    = document.getElementById('dashboardBody');
  const emptyDiv = document.getElementById('dashboardEmpty');
  if (!tbody) return;
  const list = getReservations().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  tbody.innerHTML = '';
  if (list.length === 0) { if (emptyDiv) emptyDiv.style.display = 'block'; return; }
  if (emptyDiv) emptyDiv.style.display = 'none';
  list.forEach(res => tbody.insertAdjacentHTML('beforeend', buildTableRow(res)));
}

function renderReservations() {
  const tbody    = document.getElementById('reservationsBody');
  const emptyDiv = document.getElementById('reservationsEmpty');
  if (!tbody) return;
  const list = getFilteredReservations();
  tbody.innerHTML = '';
  if (list.length === 0) { if (emptyDiv) emptyDiv.style.display = 'block'; return; }
  if (emptyDiv) emptyDiv.style.display = 'none';
  list.forEach(res => tbody.insertAdjacentHTML('beforeend', buildTableRow(res)));
}

function statusBadge(status) {
  const cls = { pending: 'badge-pending', confirmed: 'badge-confirmed', completed: 'badge-completed', cancelled: 'badge-cancelled' };
  return `<span class="badge ${cls[status] || ''}">${STATUS_LABELS[status] || status}</span>`;
}

function escHtml(str) {
  if (!str && str !== 0) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(isoDate) {
  if (!isoDate) return '-';
  try {
    const [y, m, d] = isoDate.split('-');
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
  } catch { return isoDate; }
}

function formatDateTime(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch { return iso; }
}

// =============================================
// FILTER TABS & SEARCH
// =============================================

document.querySelectorAll('.filter-tab[data-filter]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab[data-filter]').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    currentFilter = tab.dataset.filter;
    renderReservations();
  });
});

document.getElementById('searchInput')?.addEventListener('input', (e) => {
  currentSearch = e.target.value;
  renderReservations();
});

// =============================================
// CONFIRM / CANCEL / COMPLETE RESERVATION
// =============================================

async function confirmReservation(id, closeModalAfter = false) {
  const reservations = getReservations();
  const idx = reservations.findIndex(r => r.id === id || r.ref === id);
  if (idx === -1) return;
  
  const target = reservations[idx];
  target.status = 'confirmed';
  saveReservations(reservations);

  if (supabase) {
    await supabase.from('reservations').update({ status: 'confirmed' }).eq('ref', target.ref);
  }

  sendStatusEmail(target, 'confirmed');
  showToast('success', 'Réservation confirmée !', `Email envoyé à ${target.email}`);
  refreshAll();
  if (closeModalAfter) closeDetailModal();
}

async function cancelReservation(id, closeModalAfter = false) {
  const reservations = getReservations();
  const idx = reservations.findIndex(r => r.id === id || r.ref === id);
  if (idx === -1) return;

  const target = reservations[idx];
  target.status = 'cancelled';
  saveReservations(reservations);

  if (supabase) {
    await supabase.from('reservations').update({ status: 'cancelled' }).eq('ref', target.ref);
  }

  sendStatusEmail(target, 'cancelled');
  showToast('warning', 'Réservation annulée', `Email envoyé à ${target.email}`);
  refreshAll();
  if (closeModalAfter) closeDetailModal();
}

async function completeReservation(id, closeModalAfter = false) {
  const reservations = getReservations();
  const idx = reservations.findIndex(r => r.id === id || r.ref === id);
  if (idx === -1) return;

  const target = reservations[idx];
  target.status = 'completed';
  saveReservations(reservations);

  if (supabase) {
    await supabase.from('reservations').update({ status: 'completed' }).eq('ref', target.ref);
  }

  sendStatusEmail(target, 'completed');
  showToast('success', 'Lavage terminé !', `Notification envoyée à ${target.email}`);
  refreshAll();
  if (closeModalAfter) closeDetailModal();
}

function refreshAll() {
  updateStats();
  renderDashboardTable();
  renderReservations();
  renderEmails();
  updatePendingBadge();
}

// =============================================
// EMAIL SENDING (EmailJS + Mailto fallback)
// =============================================

const EMAIL_TEMPLATES = {
  confirmed: (r) => ({
    subject: `✅ Votre réservation est confirmée — ${r.ref}`,
    body: `Bonjour ${r.firstName},\n\nVotre réservation chez CôtePARC est confirmée !\n\n` +
          `Détails :\n- Formule : ${r.serviceName}\n- Date : ${formatDate(r.date)} à ${r.time}\n` +
          `- Véhicule : ${r.vehicleLabel || r.vehicle}\n- Référence : ${r.ref}\n\n` +
          `Nous vous attendons à l'heure convenue. Merci de votre confiance !\n\n` +
          `L'équipe CôtePARC — Mayotte\ncoterparc@gmail.com`,
  }),
  completed: (r) => ({
    subject: `🚗 Votre véhicule est prêt — ${r.ref}`,
    body: `Bonjour ${r.firstName},\n\nBonne nouvelle ! Votre ${r.serviceName} est terminé.\n\n` +
          `Votre véhicule est prêt et vous attend. Référence : ${r.ref}\n\n` +
          `Merci de votre confiance !\n\nL'équipe CôtePARC — Mayotte\ncoterparc@gmail.com`,
  }),
  cancelled: (r) => ({
    subject: `❌ Votre réservation a été annulée — ${r.ref}`,
    body: `Bonjour ${r.firstName},\n\nNous sommes désolés, votre réservation du ${formatDate(r.date)} ` +
          `(réf. ${r.ref}) a dû être annulée.\n\nN'hésitez pas à reprendre rendez-vous sur notre site.\n\n` +
          `L'équipe CôtePARC — Mayotte\ncoterparc@gmail.com`,
  }),
};

async function sendStatusEmail(reservation, type) {
  const tpl  = EMAIL_TEMPLATES[type]?.(reservation);
  if (!tpl) return;

  // Log in localStorage
  logEmail(reservation, type, tpl.subject, tpl.body);

  // Try EmailJS or fallback to mailto
  if (EMAILJS_CONFIGURED && typeof emailjs !== 'undefined') {
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: reservation.email,
        to_name:  `${reservation.firstName} ${reservation.lastName}`,
        subject:  tpl.subject,
        message:  tpl.body,
      });
      return;
    } catch (err) {
      console.warn('EmailJS error, fallback to mailto:', err);
    }
  }

  // Mailto fallback — opens the default email client pre-filled
  const mailto = `mailto:${encodeURIComponent(reservation.email)}` +
    `?subject=${encodeURIComponent(tpl.subject)}` +
    `&body=${encodeURIComponent(tpl.body)}`;
  window.open(mailto, '_blank');
}

function logEmail(reservation, type, subject, preview) {
  const emails = getEmails();
  emails.unshift({
    id:             Date.now().toString(),
    type,
    recipient:      `${reservation.firstName} ${reservation.lastName}`,
    recipientEmail: reservation.email,
    subject,
    preview:        preview.substring(0, 200) + '…',
    sentAt:         new Date().toISOString(),
    reservationRef: reservation.ref,
  });
  saveEmails(emails);
}

// =============================================
// EMAILS VIEW
// =============================================

function renderEmails() {
  const container  = document.getElementById('emailsList');
  const emptyEl    = document.getElementById('emptyEmails');
  const countEl    = document.getElementById('emailCount');
  if (!container) return;

  const emails = getEmails();
  container.innerHTML = '';
  if (countEl) countEl.textContent = emails.length > 0 ? `${emails.length} email${emails.length > 1 ? 's' : ''} envoyé${emails.length > 1 ? 's' : ''}` : '';

  if (emails.length === 0) { if (emptyEl) emptyEl.style.display = 'block'; return; }
  if (emptyEl) emptyEl.style.display = 'none';

  emails.forEach(email => {
    const iconMap = { confirmed: 'bi-check-circle-fill', completed: 'bi-check2-all', cancelled: 'bi-x-circle-fill' };
    const item = document.createElement('div');
    item.className = 'email-item';
    item.innerHTML = `
      <div class="email-icon ${email.type}"><i class="bi ${iconMap[email.type] || 'bi-envelope'}"></i></div>
      <div class="email-info">
        <div class="email-recipient">${escHtml(email.recipient)}</div>
        <div class="email-subject">${escHtml(email.subject)}</div>
        <div class="email-preview">${escHtml(email.preview)}</div>
      </div>
      <div class="email-meta">
        <div class="email-time">${formatDateTime(email.sentAt)}</div>
        <div class="email-type-badge ${email.type}">
          ${email.type === 'confirmed' ? 'Confirmé' : email.type === 'completed' ? 'Terminé' : 'Annulé'}
        </div>
      </div>`;
    container.appendChild(item);
  });
}

// =============================================
// DETAIL MODAL
// =============================================

function openDetail(id) {
  const res = getReservations().find(r => r.id === id);
  if (!res) return;
  currentDetailId = id;

  document.getElementById('detailName').textContent    = `${res.firstName} ${res.lastName}`;
  document.getElementById('detailEmail').textContent   = res.email;
  document.getElementById('detailPhone').textContent   = res.phone;
  document.getElementById('detailVehicle').textContent = res.vehicleLabel || res.vehicle;
  document.getElementById('detailService').textContent = `${res.serviceName || res.service} — ${res.servicePrice || ''}`;
  document.getElementById('detailDate').textContent    = `${formatDate(res.date)} à ${res.time}`;
  document.getElementById('detailRef').textContent     = res.ref;
  document.getElementById('detailStatus').innerHTML    = statusBadge(res.status);
  document.getElementById('detailCreated').textContent = formatDateTime(res.createdAt);
  document.getElementById('detailMessage').textContent = res.message || '—';

  const confirmBtn  = document.getElementById('modalConfirmBtn');
  const cancelBtn   = document.getElementById('modalCancelBtn');
  const completeBtn = document.getElementById('modalCompleteBtn');

  confirmBtn.style.display  = res.status === 'pending'   ? 'inline-flex' : 'none';
  cancelBtn.style.display   = res.status === 'pending'   ? 'inline-flex' : 'none';
  completeBtn.style.display = res.status === 'confirmed' ? 'inline-flex' : 'none';

  document.getElementById('detailModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  document.getElementById('detailModal').classList.remove('active');
  document.body.style.overflow = '';
  currentDetailId = null;
}

document.getElementById('closeDetailModal')?.addEventListener('click', closeDetailModal);
document.getElementById('modalCloseBtn')?.addEventListener('click', closeDetailModal);
document.getElementById('detailModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'detailModal') closeDetailModal();
});
document.getElementById('modalConfirmBtn')?.addEventListener('click', () => {
  if (currentDetailId) confirmReservation(currentDetailId, true);
});
document.getElementById('modalCancelBtn')?.addEventListener('click', () => {
  if (currentDetailId) cancelReservation(currentDetailId, true);
});
document.getElementById('modalCompleteBtn')?.addEventListener('click', () => {
  if (currentDetailId) completeReservation(currentDetailId, true);
});

// =============================================
// NAVIGATION (SIDEBAR VIEWS)
// =============================================

const navItems = document.querySelectorAll('.nav-item[data-view]');
const views    = document.querySelectorAll('.view');
const sidebar  = document.getElementById('adminSidebar');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    const viewId = item.dataset.view;
    views.forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
    const bc = document.getElementById('breadcrumbCurrent');
    if (bc) bc.textContent = item.querySelector('.nav-item-text')?.textContent || 'Dashboard';
    sidebar.classList.remove('open');
  });
});

document.getElementById('hamburgerAdmin')?.addEventListener('click', () => sidebar.classList.toggle('open'));
document.getElementById('logoutBtn')?.addEventListener('click', logout);
document.getElementById('logoutLink')?.addEventListener('click', logout);

// =============================================
// TOAST NOTIFICATIONS
// =============================================

const toastContainer = document.getElementById('toastContainer');

function showToast(type, title, message, duration = 4500) {
  const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill', warning: 'bi-exclamation-triangle-fill' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon"><i class="bi ${icons[type] || 'bi-info-circle-fill'}"></i></span>
    <div class="toast-content">
      <div class="toast-title">${escHtml(title)}</div>
      ${message ? `<div class="toast-message">${escHtml(message)}</div>` : ''}
    </div>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

// =============================================
// INIT
// =============================================

if (isLoggedIn()) {
  showAdminApp();
} else {
  showLoginPage();
}

// Seed demo data (only if empty)
(function seedDemoData() {
  if (getReservations().length > 0) return;
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; })();
  const dayAfter  = (() => { const d = new Date(); d.setDate(d.getDate()+2); return d.toISOString().split('T')[0]; })();
  const demos = [
    {
      id: '1001', ref: 'CP-DEMO0001', status: 'pending',
      createdAt: new Date(Date.now() - 2*3600000).toISOString(),
      firstName:'Sophie', lastName:'Martin', email:'sophie.martin@example.com', phone:'06 12 34 56 78',
      vehicle:'berline', vehicleLabel:'Berline / Coupé',
      service:'exterieur', serviceName:'Lavage Extérieur', serviceIcon:'bi-droplet-fill', servicePrice:'10€',
      date: tomorrow, time:'10:00', message:'Merci de faire attention aux jantes.',
    },
    {
      id: '1002', ref: 'CP-DEMO0002', status: 'confirmed',
      createdAt: new Date(Date.now() - 5*3600000).toISOString(),
      confirmedAt: new Date(Date.now() - 4*3600000).toISOString(),
      firstName:'Karim', lastName:'Benali', email:'karim.benali@example.com', phone:'07 98 76 54 32',
      vehicle:'suv', vehicleLabel:'SUV / 4x4',
      service:'interieur', serviceName:'Nettoyage Intérieur', serviceIcon:'bi-stars', servicePrice:'40€',
      date: tomorrow, time:'14:30', message:'',
    },
    {
      id: '1003', ref: 'CP-DEMO0003', status: 'completed',
      createdAt: new Date(Date.now() - 10*3600000).toISOString(),
      confirmedAt: new Date(Date.now() - 9*3600000).toISOString(),
      completedAt: new Date(Date.now() - 7*3600000).toISOString(),
      firstName:'MAMAN', lastName:'Djalasse', email:'maman.djalasse@example.com', phone:'06 39 00 00 00',
      vehicle:'citadine', vehicleLabel:'Citadine',
      service:'exterieur', serviceName:'Lavage Extérieur', serviceIcon:'bi-droplet-fill', servicePrice:'10€',
      date: tomorrow, time:'09:00', message:'',
    },
  ];
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(demos));
})();
