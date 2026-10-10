/**
 * CareerTwin AI - Dynamic Shared Sidebar & Topbar Component
 */

const Navbar = {
  adaptiveLinks: [
    { label: 'Adaptive Dashboard', url: '/dashboard.html', icon: '🎯' },
    { label: 'Diagnostic Room', url: '/diagnostic.html', icon: '🩺' },
    { label: 'Concept Graph', url: '/concept-graph.html', icon: '🕸️' },
    { label: 'Mastery & Uncertainty', url: '/mastery.html', icon: '📊' },
    { label: 'Learning History', url: '/learning-history.html', icon: '📜' },
  ],

  careerLinks: [
    { label: 'Career Twin', url: '/career-twin.html', icon: '🧬' },
    { label: 'Mock Interviews', url: '/interview.html', icon: '🎙️' },
    { label: 'Resume & CV Analyzer', url: '/resume.html', icon: '📄' },
    { label: 'GitHub Signals', url: '/github.html', icon: '🐙' },
    { label: 'Skill Matrix', url: '/skills.html', icon: '⚡' },
    { label: 'Career Roadmap', url: '/roadmap.html', icon: '🗺️' },
    { label: 'Career Goals', url: '/goals.html', icon: '🎯' },
    { label: 'Mentor AI', url: '/mentor.html', icon: '🤖' },
    { label: 'Privacy & Settings', url: '/settings.html', icon: '⚙️' },
  ],

  renderLink(link, currentPath) {
    const cleanUrl = link.url.replace('.html', '');
    const isCvAlias = link.url === '/resume.html' && (currentPath === '/cv.html' || currentPath === '/cv');
    const isActive =
      isCvAlias ||
      currentPath === link.url ||
      currentPath === cleanUrl ||
      currentPath.endsWith(link.url.replace(/^\//, '')) ||
      currentPath.endsWith(cleanUrl.replace(/^\//, ''));
    return `
      <a href="${link.url}" class="nav-link ${isActive ? 'active' : ''}">
        <span class="nav-icon">${link.icon}</span>
        <span>${link.label}</span>
      </a>
    `;
  },

  renderSidebar() {
    const currentPath = window.location.pathname;
    const sidebarEl = document.getElementById('sidebar-container');
    if (!sidebarEl) return;

    const adaptiveHtml = this.adaptiveLinks.map((l) => this.renderLink(l, currentPath)).join('');
    const careerHtml = this.careerLinks.map((l) => this.renderLink(l, currentPath)).join('');

    sidebarEl.innerHTML = `
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">CT</div>
          <div>
            <div class="sidebar-title gradient-text">CareerTwin AI</div>
            <div style="font-size: 0.72rem; color: var(--accent-secondary);">Adaptive Learning Core</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div style="font-size: 0.68rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.08em; padding: 0.5rem 0.85rem 0.25rem 0.85rem;">
            Adaptive Engine
          </div>
          ${adaptiveHtml}

          <div style="font-size: 0.68rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.08em; padding: 1rem 0.85rem 0.25rem 0.85rem;">
            Career Intelligence
          </div>
          ${careerHtml}
        </nav>


        <div class="sidebar-footer" style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
          <a href="/settings.html" style="display:flex; flex-direction:column; overflow:hidden; text-decoration:none; cursor:pointer;" title="View & Edit Profile Details">
            <span class="user-display-name" style="font-size:0.875rem; font-weight:600; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; color:var(--text-primary);">User</span>
            <span class="badge badge-cyan user-privacy-mode-badge" style="margin-top:0.25rem; font-size:0.65rem; width:fit-content;">🛡️ Privacy Mode</span>
          </a>
          <button class="btn btn-outline btn-sm logout-btn" onclick="API.logout()" title="Log out of CareerTwin" style="display:flex; align-items:center; gap:0.35rem; padding: 0.35rem 0.65rem; font-size: 0.78rem;">
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    `;
  },

  renderTopbar(pageTitle = 'CareerTwin AI') {
    const topbarEl = document.getElementById('topbar-container');
    if (!topbarEl) return;

    topbarEl.innerHTML = `
      <header class="topbar">
        <div class="topbar-left">
          <button class="btn btn-secondary btn-sm mobile-menu-btn" style="display:none;" onclick="Navbar.toggleMobileSidebar()">☰</button>
          <h2>${pageTitle}</h2>
        </div>

        <div class="topbar-right" style="display:flex; align-items:center; gap:0.75rem;">
          <a href="/settings.html" class="user-pill" style="display:flex; align-items:center; gap:0.65rem; background:var(--bg-tertiary); padding:0.4rem 0.95rem; border-radius:var(--radius-full); border:1px solid var(--border-color); cursor:pointer; text-decoration:none;" title="View & Edit Profile Details">
            <div style="width:28px; height:28px; border-radius:50%; background:var(--accent-primary); display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:700;">
              👤
            </div>
            <span class="user-display-name" style="font-size:0.875rem; font-weight:600; color:var(--text-primary);">User</span>
          </a>
          <button class="btn btn-outline btn-sm logout-btn" onclick="API.logout()" title="Log Out of Session" style="display:flex; align-items:center; gap:0.4rem; padding:0.42rem 0.85rem; font-size:0.82rem; border-radius:var(--radius-md); border-color: rgba(255,255,255,0.16); color: var(--text-secondary); transition: all 0.2s ease;">
            <span>🚪</span>
            <span style="font-weight: 600;">Log Out</span>
          </button>
        </div>
      </header>
    `;
  },

  toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  },

  init(pageTitle) {
    this.renderSidebar();
    this.renderTopbar(pageTitle);
  },
};

window.Navbar = Navbar;
