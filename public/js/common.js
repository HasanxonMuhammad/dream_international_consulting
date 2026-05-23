// Umumiy yordamchilar: API chaqiruvlari, sidebar/header, autentifikatsiya

const NAV = [
  { href: '/dashboard.html', icon: 'dashboard', label: 'Boshqaruv paneli' },
  { href: '/portal.html', icon: 'translate', label: 'Tarjima portali' },
  { href: '/archive.html', icon: 'inventory_2', label: 'Hujjatlar arxivi' },
  { href: '/reports.html', icon: 'bar_chart', label: 'Hisobotlar' },
];

// --- API yordamchisi ---
export async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {},
    ...opts,
  });
  if (res.status === 401) {
    location.href = '/login.html';
    throw new Error('Avtorizatsiya kerak');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Xatolik yuz berdi');
  return data;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function formatBytes(n) {
  if (!n) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}

export function formatDate(s) {
  if (!s) return '—';
  const d = new Date(s.replace(' ', 'T') + 'Z');
  return d.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const STATUS_BADGE = {
  done: { label: 'TAYYOR', cls: 'bg-secondary-container text-on-secondary-container' },
  processing: { label: 'JARAYONDA', cls: 'bg-surface-container text-secondary' },
  pending: { label: 'NAVBATDA', cls: 'bg-surface-container text-on-surface-variant' },
  error: { label: 'XATOLIK', cls: 'bg-error-container text-on-error-container' },
};

// --- Layout (sidebar + header) ---
export async function renderLayout(activeHref, pageTitle) {
  let user;
  try {
    ({ user } = await api('/api/auth/me'));
  } catch {
    return;
  }

  const navHtml = NAV.map((n) => {
    const active = n.href === activeHref;
    const cls = active
      ? 'text-secondary font-bold border-r-2 border-secondary bg-surface-container-high'
      : 'text-on-surface-variant hover:bg-surface-container-high';
    return `<a href="${n.href}" class="flex items-center gap-3 px-4 py-3 rounded transition-colors ${cls}">
      <span class="material-symbols-outlined">${n.icon}</span>
      <span class="font-label-caps text-label-caps">${n.label}</span>
    </a>`;
  }).join('');

  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.innerHTML = `
      <div class="mb-stack-lg">
        <h1 class="font-headline-md text-headline-md font-bold text-on-surface">Dream International</h1>
        <p class="font-label-caps text-label-caps text-on-surface-variant opacity-70">Consulting Portal</p>
      </div>
      <a href="/portal.html" class="w-full bg-primary text-on-primary font-label-caps text-label-caps py-3 rounded mb-stack-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
        <span class="material-symbols-outlined">upload</span> Hujjat yuklash
      </a>
      <nav class="flex-1 space-y-1">${navHtml}</nav>
      <div class="mt-auto border-t border-outline-variant pt-4 space-y-1">
        <a href="/settings.html" class="flex items-center gap-3 px-4 py-2 rounded hover:bg-surface-container-high text-on-surface-variant">
          <span class="material-symbols-outlined">settings</span>
          <span class="font-label-caps text-label-caps">Sozlamalar</span>
        </a>
      </div>`;
  }

  const header = document.getElementById('header');
  if (header) {
    const initials = (user.fullName || user.username).split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
    header.innerHTML = `
      <div class="flex items-center gap-stack-lg">
        <h2 class="font-headline-sm text-headline-sm font-bold text-on-surface">${escapeHtml(pageTitle)}</h2>
      </div>
      <div class="flex items-center gap-stack-md">
        <span class="font-body-md text-on-surface-variant hidden sm:block">${escapeHtml(user.fullName)}</span>
        <div class="h-9 w-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-caps text-label-caps">${initials}</div>
        <button id="logoutBtn" class="p-2 text-on-surface-variant hover:text-error transition-all" title="Chiqish">
          <span class="material-symbols-outlined">logout</span>
        </button>
      </div>`;
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await api('/api/auth/logout', { method: 'POST' });
      location.href = '/login.html';
    });
  }
  return user;
}
