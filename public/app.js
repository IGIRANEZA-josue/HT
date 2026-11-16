const examples = [
  { id: 'example-1', title: 'The Nyarutarama House', district: 'Kigali', sector: 'Nyarutarama', property_type: 'House', bedrooms: 4, bathrooms: 3, monthly_rent: 1200000, image_url: '/images/home1.png', description: 'A light-filled home with room to settle in and a garden made for slower mornings.' },
  { id: 'example-2', title: 'The Kiyovu Apartment', district: 'Kigali', sector: 'Kiyovu', property_type: 'Apartment', bedrooms: 2, bathrooms: 2, monthly_rent: 850000, image_url: '/images/home2.png', description: 'A contemporary apartment surrounded by greenery, close to the heart of the city.' },
  { id: 'example-3', title: 'The Kimihurura Villa', district: 'Kigali', sector: 'Kimihurura', property_type: 'Villa', bedrooms: 3, bathrooms: 2, monthly_rent: 1500000, image_url: '/images/home3.png', description: 'A welcoming villa with a peaceful outdoor space and plenty of natural light.' }
];
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const money = value => `RWF ${Number(value || 0).toLocaleString('en-US')}`;
const safeImage = value => {
  try { const url = new URL(value, location.origin); return ['http:', 'https:'].includes(url.protocol) ? url.href : '/images/placeholder.svg'; } catch { return '/images/placeholder.svg'; }
};
const locationName = p => [p.sector, p.district].filter(Boolean).join(', ') || 'Rwanda';
let properties = [];
let isDemo = false;
let activeFilter = 'all';
let search = { location: '', type: '', price: '' };
let saved;
try { saved = JSON.parse(localStorage.getItem('htracker-saved') || '[]'); if (!Array.isArray(saved)) saved = []; } catch { saved = []; }
const savedKey = p => `${isDemo ? 'demo' : 'live'}:${p.id}`;
let token = sessionStorage.getItem('htracker-token');

function render() {
  const filtered = properties.filter(p => {
    if (activeFilter === 'saved' && !saved.includes(savedKey(p))) return false;
    if (!['all', 'saved'].includes(activeFilter) && p.property_type?.toLowerCase() !== activeFilter.toLowerCase()) return false;
    if (search.location && !`${locationName(p)} ${p.province || ''} ${p.title || ''}`.toLowerCase().includes(search.location)) return false;
    if (search.type && p.property_type?.toLowerCase() !== search.type.toLowerCase()) return false;
    if (search.price && Number(p.monthly_rent) > Number(search.price)) return false;
    return true;
  });
  $('#saved-count').textContent = saved.filter(key => key.startsWith(isDemo ? 'demo:' : 'live:')).length;
  $('#results').textContent = `${filtered.length} ${filtered.length === 1 ? 'home' : 'homes'} to explore`;
  $('#demo-notice').hidden = !isDemo;
  $('#empty-state').hidden = filtered.length > 0;
  $('#cards').innerHTML = filtered.map((p, i) => {
    const index = properties.indexOf(p);
    const isSaved = saved.includes(savedKey(p));
    return `<article class="card"><div class="card-image"><img src="${escapeHtml(safeImage(p.image_url || '/images/placeholder.svg'))}" alt="${escapeHtml(p.title || 'Property')}" loading="lazy"><span class="card-label">${isDemo ? 'Example home' : escapeHtml(p.status || 'Available')}</span><button class="favorite ${isSaved ? 'saved' : ''}" data-save="${index}" aria-label="${isSaved ? 'Remove from saved homes' : 'Save home'}" aria-pressed="${isSaved}">${isSaved ? '♥' : '♡'}</button></div><div class="card-body"><div class="card-location"><span>⌖</span> ${escapeHtml(locationName(p))}</div><h3>${escapeHtml(p.title || 'Untitled property')}</h3><div class="card-features"><span>⌂ &nbsp;${escapeHtml(p.bedrooms ?? 0)} beds</span><span>◫ &nbsp;${escapeHtml(p.bathrooms ?? 0)} baths</span><span>◇ &nbsp;${escapeHtml(p.property_type || 'Home')}</span></div><div class="card-bottom"><div class="price">${escapeHtml(money(p.monthly_rent))} <small>/ month</small></div><button class="details-button" data-detail="${index}">View details <span>↗</span></button></div></div></article>`;
  }).join('');
}
async function loadProperties() {
  try {
    const response = await fetch('/properties/getallproperties');
    if (!response.ok) throw new Error('Listings unavailable');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Unexpected response');
    properties = data;
    isDemo = false;
  } catch {
    properties = examples;
    isDemo = true;
  }
  render();
}
function notify(text) { const toast = $('#toast'); toast.textContent = text; toast.classList.add('show'); clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove('show'), 2500); }
$('#cards').addEventListener('click', event => {
  const save = event.target.closest('[data-save]');
  const detail = event.target.closest('[data-detail]');
  if (save) {
    const key = savedKey(properties[Number(save.dataset.save)]);
    saved = saved.includes(key) ? saved.filter(item => item !== key) : [...saved, key];
    localStorage.setItem('htracker-saved', JSON.stringify(saved));
    notify(saved.includes(key) ? 'Saved on this device' : 'Removed from saved homes');
    render();
  }
  if (detail) showDetails(properties[Number(detail.dataset.detail)]);
});
function showDetails(p) {
  $('#dialog-title').textContent = p.title || 'Property details';
  $('#dialog-content').innerHTML = `<img class="detail-image" src="${escapeHtml(safeImage(p.image_url || '/images/placeholder.svg'))}" alt="${escapeHtml(p.title)}"><p class="detail-meta">⌖ ${escapeHtml(locationName(p))} · ${escapeHtml(p.property_type || 'Home')} · ${escapeHtml(p.bedrooms ?? 0)} beds · ${escapeHtml(p.bathrooms ?? 0)} baths</p><p class="detail-price">${escapeHtml(money(p.monthly_rent))} <small>/ month</small></p><p class="detail-copy">${escapeHtml(p.description || 'No description has been provided for this home yet.')}</p><p class="detail-copy">${isDemo ? 'This is an example listing for demonstration purposes.' : 'Interested in this home? Contact and rental request features are coming soon.'}</p>`;
  $('#dialog').showModal();
}
$('.tabs').addEventListener('click', event => {
  const tab = event.target.closest('[data-filter]'); if (!tab) return;
  activeFilter = tab.dataset.filter;
  document.querySelectorAll('.tab').forEach(item => item.classList.toggle('active', item === tab));
  render();
});
$('#search-form').addEventListener('submit', event => {
  event.preventDefault();
  search = { location: $('#location').value.trim().toLowerCase(), type: $('#type').value, price: $('#price').value };
  activeFilter = 'all'; document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.filter === 'all'));
  render(); $('#listings').scrollIntoView({ behavior: 'smooth' });
});
function resetFilters() {
  $('#search-form').reset(); search = { location: '', type: '', price: '' }; activeFilter = 'all';
  document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.filter === 'all')); render();
}
$('#view-all').addEventListener('click', resetFilters);
$('#clear-filters').addEventListener('click', resetFilters);
$('.close-dialog').addEventListener('click', () => $('#dialog').close());
$('#dialog').addEventListener('click', event => { if (event.target === $('#dialog')) $('#dialog').close(); });
function authDialog(mode) {
  if (token && mode === 'login') {
    $('#dialog-title').textContent = 'Your account';
    $('#dialog-content').innerHTML = '<p class="detail-copy">You are signed in for this browser session.</p><button class="button button-dark" id="logout">Log out ↗</button>';
    $('#logout').onclick = () => { token = null; sessionStorage.removeItem('htracker-token'); updateAuth(); $('#dialog').close(); notify('You are logged out'); };
  } else {
    const register = mode === 'register';
    $('#dialog-title').textContent = register ? 'Let’s get you started.' : 'Welcome back.';
    $('#dialog-content').innerHTML = `<form class="dialog-form" id="auth-form">${register ? '<label>Full name<input name="name" required autocomplete="name"></label><label>Email<input name="email" type="email" required autocomplete="email"></label>' : ''}<label>Username<input name="username" required autocomplete="username"></label><label>Password<input name="password" type="password" required minlength="8" autocomplete="${register ? 'new-password' : 'current-password'}"></label>${register ? '<label>I am a<select name="role"><option value="seeker">Home seeker</option><option value="landlord">Landlord</option></select></label>' : ''}<div class="form-message" role="alert"></div><button class="button button-dark" type="submit">${register ? 'Create account' : 'Log in'} <span>↗</span></button></form><p class="dialog-switch">${register ? 'Already have an account?' : 'New to H-Tracker?'} <button id="switch-auth">${register ? 'Log in' : 'Create an account'}</button></p>`;
    $('#switch-auth').onclick = () => authDialog(register ? 'login' : 'register');
    $('#auth-form').onsubmit = async event => {
      event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button[type=submit]'); const message = form.querySelector('.form-message');
      button.disabled = true; message.textContent = '';
      try {
        const response = await fetch(register ? '/users/registeruser' : '/users/loginuser', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Something went wrong.');
        if (register) { authDialog('login'); notify('Account created. Please log in.'); }
        else { token = data.token; sessionStorage.setItem('htracker-token', token); updateAuth(); $('#dialog').close(); notify('Welcome back!'); }
      } catch (error) { message.textContent = error.message || 'Unable to connect. Please try again.'; }
      finally { button.disabled = false; }
    };
  }
  if (!$('#dialog').open) $('#dialog').showModal();
}
function updateAuth() { $('#signin').textContent = token ? 'My account' : 'Log in'; $('#mobile-login').textContent = token ? 'My account' : 'Log in'; }
$('#signin').onclick = $('#mobile-login').onclick = () => authDialog('login');
$('#signup').onclick = $('#mobile-signup').onclick = () => authDialog('register');
$('.menu-toggle').onclick = event => { const open = $('.mobile-nav').classList.toggle('open'); event.currentTarget.setAttribute('aria-expanded', String(open)); };
$('.mobile-nav').addEventListener('click', () => { $('.mobile-nav').classList.remove('open'); $('.menu-toggle').setAttribute('aria-expanded', 'false'); });
updateAuth(); loadProperties();
