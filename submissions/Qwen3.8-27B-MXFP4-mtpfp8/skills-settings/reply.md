

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Harbor — Settings</title>
<style>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --deep-navy: #1a2332;
  --teal: #2d8b8b;
  --teal-dark: #227777;
  --seafoam: #a8dadc;
  --cream: #f1faee;
  --surface: #222d3f;
  --surface-light: #2a3649;
  --error: #e8746a;
  --success: #6abf6a;
}

html, body {
  height: 100%;
  font-family: 'DejaVu Sans', 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: var(--deep-navy);
  color: var(--cream);
  font-size: 16px;
  line-height: 1.6;
}

body {
  display: flex;
  overflow: hidden;
}

.app {
  display: flex;
  width: 100%;
  height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 240px;
  min-width: 240px;
  background: var(--surface);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-right: 1px solid var(--teal);
  overflow-y: auto;
}

.sidebar-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--seafoam);
  margin-bottom: 24px;
  padding: 0 8px;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--seafoam);
  font-size: 15px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s, color 0.2s;
}

.nav-btn:hover {
  background: var(--surface-light);
}

.nav-btn:focus-visible {
  outline: 2px solid var(--teal);
  outline-offset: 2px;
}

.nav-btn[aria-current="page"] {
  background: var(--teal-dark);
  color: var(--cream);
  font-weight: bold;
}

.nav-btn .nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Main content */
.main {
  flex: 1;
  padding: 32px 40px;
  overflow-y: auto;
  max-width: 800px;
}

.panel {
  display: none;
}

.panel.active {
  display: block;
}

.panel h1 {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--cream);
}

.panel .panel-desc {
  color: var(--seafoam);
  margin-bottom: 32px;
  font-size: 15px;
}

/* Form elements */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: bold;
  color: var(--seafoam);
  margin-bottom: 6px;
}

.form-group input,
.form-group select {
  width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  background: var(--surface);
  border: 2px solid var(--surface-light);
  border-radius: 8px;
  color: var(--cream);
  font-size: 15px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--teal);
}

.form-group input::placeholder {
  color: var(--seafoam);
  opacity: 0.6;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: bold;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.btn:focus-visible {
  outline: 2px solid var(--teal);
  outline-offset: 2px;
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background: var(--teal-dark);
  color: var(--cream);
}

.btn-primary:hover {
  background: var(--teal);
}

.btn-danger {
  background: #8b3a3a;
  color: var(--cream);
}

.btn-danger:hover {
  background: #a04444;
}

.btn-secondary {
  background: var(--surface-light);
  color: var(--seafoam);
}

.btn-secondary:hover {
  background: var(--surface);
}

/* Messages */
.msg {
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 14px;
  display: none;
}

.msg.error {
  background: rgba(232, 116, 106, 0.15);
  border: 1px solid var(--error);
  color: var(--error);
}

.msg.success {
  background: rgba(106, 191, 106, 0.15);
  border: 1px solid var(--success);
  color: var(--success);
}

.msg.visible {
  display: block;
}

/* Toggle switches */
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--surface-light);
}

.switch-row:last-child {
  border-bottom: none;
}

.switch-label {
  font-size: 15px;
  color: var(--cream);
}

.switch-desc {
  font-size: 13px;
  color: var(--seafoam);
  margin-top: 2px;
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 28px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px 0;
}

.toggle-switch:focus-visible {
  outline: 2px solid var(--teal);
  outline-offset: 2px;
  border-radius: 8px;
}

.toggle-track {
  width: 48px;
  height: 28px;
  border-radius: 14px;
  background: var(--surface-light);
  position: relative;
  transition: background 0.2s;
}

.toggle-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--seafoam);
  transition: transform 0.2s, background 0.2s;
}

.toggle-switch[aria-checked="true"] .toggle-track {
  background: var(--teal-dark);
}

.toggle-switch[aria-checked="true"] .toggle-track::after {
  transform: translateX(20px);
  background: var(--cream);
}

/* Team members */
.member-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--surface);
  border-radius: 8px;
  margin-bottom: 12px;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name {
  font-weight: bold;
  font-size: 15px;
  color: var(--cream);
}

.member-email {
  font-size: 13px;
  color: var(--seafoam);
}

.member-role {
  font-size: 12px;
  color: var(--teal);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-remove {
  min-height: 44px;
  min-width: 44px;
  padding: 8px 16px;
  background: transparent;
  border: 2px solid var(--error);
  border-radius: 8px;
  color: var(--error);
  font-size: 13px;
  font-weight: bold;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-remove:hover {
  background: rgba(232, 116, 106, 0.15);
}

.btn-remove:focus-visible {
  outline: 2px solid var(--error);
  outline-offset: 2px;
}

/* Projects */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  background: var(--surface);
  border-radius: 12px;
  margin-top: 16px;
}

.empty-state h3 {
  font-size: 18px;
  color: var(--cream);
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  color: var(--seafoam);
  margin-bottom: 24px;
}

.project-card {
  padding: 16px;
  background: var(--surface);
  border-radius: 8px;
  margin-bottom: 12px;
  border-left: 3px solid var(--teal);
}

.project-name {
  font-weight: bold;
  font-size: 15px;
  color: var(--cream);
}

.project-date {
  font-size: 13px;
  color: var(--seafoam);
  margin-top: 4px;
}

/* Billing */
.plan-card {
  padding: 20px;
  background: var(--surface);
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid var(--teal);
}

.plan-name {
  font-size: 20px;
  font-weight: bold;
  color: var(--cream);
}

.plan-price {
  font-size: 14px;
  color: var(--seafoam);
  margin-top: 4px;
}

.card-row {
  display: flex;
  gap: 12px;
}

.card-row .form-group {
  flex: 1;
}

/* Danger zone */
.danger-card {
  padding: 24px;
  background: rgba(232, 116, 106, 0.08);
  border: 1px solid var(--error);
  border-radius: 12px;
}

.danger-card h2 {
  font-size: 18px;
  color: var(--error);
  margin-bottom: 8px;
}

.danger-card p {
  font-size: 14px;
  color: var(--seafoam);
  margin-bottom: 20px;
}

/* Dialog */
.dialog-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  align-items: center;
  justify-content: center;
}

.dialog-overlay.open {
  display: flex;
}

.dialog {
  background: var(--surface);
  border: 1px solid var(--teal);
  border-radius: 12px;
  padding: 32px;
  max-width: 440px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.dialog h2 {
  font-size: 20px;
  color: var(--cream);
  margin-bottom: 12px;
}

.dialog p {
  font-size: 15px;
  color: var(--seafoam);
  margin-bottom: 24px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Section spacing */
.section-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--seafoam);
  margin: 32px 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Responsive */
@media (max-width: 768px) {
  .app {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    min-width: unset;
    flex-direction: row;
    overflow-x: auto;
    padding: 12px;
    border-right: none;
    border-bottom: 1px solid var(--teal);
  }
  .sidebar-title {
    margin-bottom: 0;
    margin-right: 16px;
  }
  .sidebar nav {
    flex-direction: row;
  }
  .main {
    padding: 24px;
  }
}
</style>
</head>
<body>
<div class="app">
  <aside class="sidebar" aria-label="Settings navigation">
    <div class="sidebar-title">Harbor</div>
    <nav>
      <button class="nav-btn" data-nav="profile" aria-current="page">
        <svg class="nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 17c0-3.5 3-5.5 7-5.5s7 2 7 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Profile
      </button>
      <button class="nav-btn" data-nav="notifications">
        <svg class="nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3a4 4 0 0 1 4 4v3l2 3H4l2-3V7a4 4 0 0 1 4-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 17a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.5"/></svg>
        Notifications
      </button>
      <button class="nav-btn" data-nav="team">
        <svg class="nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="2.5" stroke="currentColor" stroke-width="1.5"/><circle cx="13" cy="7" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M2 16c0-2.5 2-4 5-4s5 1.5 5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M11 16c0-2.5 2-4 5-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Team
      </button>
      <button class="nav-btn" data-nav="projects">
        <svg class="nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 8h14" stroke="currentColor" stroke-width="1.5"/></svg>
        Projects
      </button>
      <button class="nav-btn" data-nav="billing">
        <svg class="nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 9h16" stroke="currentColor" stroke-width="1.5"/><path d="M5 13h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Billing
      </button>
      <button class="nav-btn" data-nav="danger">
        <svg class="nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3L2 17h16L10 3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 9v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="15" r="1" fill="currentColor"/></svg>
        Danger Zone
      </button>
    </nav>
  </aside>

  <main class="main" role="main">
    <!-- Profile Panel -->
    <section class="panel active" data-panel="profile" id="profile">
      <h1>Profile</h1>
      <p class="panel-desc">Update your personal information for the Northwind workspace.</p>
      <form id="profile-form" novalidate>
        <div class="form-group">
          <label for="profile-name">Full name</label>
          <input type="text" id="profile-name" data-field="name" value="Jordan Reeves" autocomplete="name">
        </div>
        <div class="form-group">
          <label for="profile-email">Email</label>
          <input type="email" id="profile-email" data-field="email" value="jordan.reeves@northwind.io" autocomplete="email">
        </div>
        <button type="submit" class="btn btn-primary" data-action="save-profile">Save profile</button>
      </form>
      <div class="msg error" data-error id="profile-error" role="alert"></div>
      <div class="msg success" role="status" id="profile-success"></div>
    </section>

    <!-- Notifications Panel -->
    <section class="panel" data-panel="notifications" id="notifications" hidden>
      <h1>Notifications</h1>
      <p class="panel-desc">Choose which updates you'd like to receive from Northwind.</p>
      <div class="switch-row">
        <div>
          <div class="switch-label">Product updates</div>
          <div class="switch-desc">New features and improvements</div>
        </div>
        <button type="button" class="toggle-switch" role="switch" aria-checked="true" data-switch="product-updates" aria-label="Product updates">
          <span class="toggle-track"></span>
        </button>
      </div>
      <div class="switch-row">
        <div>
          <div class="switch-label">Comments</div>
          <div class="switch-desc">When someone comments on your work</div>
        </div>
        <button type="button" class="toggle-switch" role="switch" aria-checked="true" data-switch="comments" aria-label="Comments">
          <span class="toggle-track"></span>
        </button>
      </div>
      <div class="switch-row">
        <div>
          <div class="switch-label">Mentions</div>
          <div class="switch-desc">When someone mentions you by name</div>
        </div>
        <button type="button" class="toggle-switch" role="switch" aria-checked="true" data-switch="mentions" aria-label="Mentions">
          <span class="toggle-track"></span>
        </button>
      </div>
      <div class="switch-row">
        <div>
          <div class="switch-label">Weekly digest</div>
          <div class="switch-desc">A summary of activity every Monday</div>
        </div>
        <button type="button" class="toggle-switch" role="switch" aria-checked="false" data-switch="weekly-digest" aria-label="Weekly digest">
          <span class="toggle-track"></span>
        </button>
      </div>
      <div style="margin-top: 24px;">
        <button type="button" class="btn btn-primary" data-action="save-notifications">Save preferences</button>
      </div>
      <div class="msg success" role="status" id="notifications-success"></div>
    </section>

    <!-- Team Panel -->
    <section class="panel" data-panel="team" id="team" hidden>
      <h1>Team</h1>
      <p class="panel-desc">Manage members of the Northwind workspace.</p>
      <div id="team-list">
        <div class="member-card" data-member="1">
          <div class="member-info">
            <span class="member-name">Sarah Chen</span>
            <span class="member-email">sarah.chen@northwind.io</span>
            <span class="member-role">Admin</span>
          </div>
          <button class="btn-remove" data-action="remove-member" data-target="1" aria-label="Remove Sarah Chen">Remove</button>
        </div>
        <div class="member-card" data-member="2">
          <div class="member-info">
            <span class="member-name">Marcus Webb</span>
            <span class="member-email">marcus.webb@northwind.io</span>
            <span class="member-role">Editor</span>
          </div>
          <button class="btn-remove" data-action="remove-member" data-target="2" aria-label="Remove Marcus Webb">Remove</button>
        </div>
        <div class="member-card" data-member="3">
          <div class="member-info">
            <span class="member-name">Lina Okafor</span>
            <span class="member-email">lina.okafor@northwind.io</span>
            <span class="member-role">Viewer</span>
          </div>
          <button class="btn-remove" data-action="remove-member" data-target="3" aria-label="Remove Lina Okafor">Remove</button>
        </div>
      </div>
      <div class="msg success" role="status" id="team-success"></div>
      <h2 class="section-title">Invite a teammate</h2>
      <form id="invite-form" novalidate>
        <div class="form-group">
          <label for="invite-email">Email address</label>
          <input type="email" id="invite-email" data-field="invite-email" placeholder="teammate@company.com">
        </div>
        <button type="submit" class="btn btn-primary" data-action="invite">Send invite</button>
      </form>
      <div class="msg error" data-error id="invite-error" role="alert"></div>
      <div class="msg success" role="status" id="invite-success"></div>
    </section>

    <!-- Projects Panel -->
    <section class="panel" data-panel="projects" id="projects" hidden>
      <h1>Projects</h1>
      <p class="panel-desc">Organize your team's work into projects.</p>
      <div id="projects-empty" data-empty>
        <div class="empty-state">
          <h3>No projects yet</h3>
          <p>Create your first project to start organizing work with your team.</p>
          <button class="btn btn-primary" data-action="create-project">Create a project</button>
        </div>
      </div>
      <div id="projects-list"></div>
      <form id="project-form" style="margin-top: 20px;" novalidate>
        <div class="form-group">
          <label for="project-name">Project name</label>
          <input type="text" id="project-name" placeholder="e.g. Website redesign">
        </div>
        <button type="submit" class="btn btn-primary" data-action="create-project" id="project-create-btn" style="display:none;">Add project</button>
      </form>
      <div class="msg success" role="status" id="project-success"></div>
    </section>

    <!-- Billing Panel -->
    <section class="panel" data-panel="billing" id="billing" hidden>
      <h1>Billing</h1>
      <p class="panel-desc">Manage your subscription and payment details.</p>
      <div class="plan-card">
        <div class="plan-name">Northwind Pro</div>
        <div class="plan-price">$29/month · 5 seats</div>
      </div>
      <h2 class="section-title">Update payment method</h2>
      <form id="billing-form" novalidate>
        <div class="form-group">
          <label for="card-number">Card number</label>
          <input type="text" id="card-number" data-field="card-number" placeholder="1234 5678 9012 3456" inputmode="numeric" maxlength="19">
        </div>
        <div class="card-row">
          <div class="form-group">
            <label for="card-expiry">Expiry</label>
            <input type="text" id="card-expiry" data-field="card-expiry" placeholder="MM/YY" maxlength="5">
          </div>
          <div class="form-group">
            <label for="card-cvc">Security code</label>
            <input type="text" id="card-cvc" data-field="card-cvc" placeholder="CVC" maxlength="4" inputmode="numeric">
          </div>
        </div>
        <button type="submit" class="btn btn-primary" data-action="pay">Update card</button>
      </form>
      <div class="msg error" data-error id="billing-error" role="alert"></div>
      <div class="msg success" role="status" id="billing-success"></div>
    </section>

    <!-- Danger Zone Panel -->
    <section class="panel" data-panel="danger" id="danger" hidden>
      <h1>Danger Zone</h1>
      <p class="panel-desc">Irreversible actions for the Northwind workspace.</p>
      <div class="danger-card">
        <h2>Delete workspace</h2>
        <p>Permanently remove Northwind and all its data. This action cannot be undone.</p>
        <button class="btn btn-danger" data-action="delete-workspace">Delete workspace</button>
      </div>
    </section>
  </main>
</div>

<!-- Remove Member Dialog -->
<div class="dialog-overlay" id="dialog-remove" role="dialog" aria-modal="true" aria-labelledby="dialog-remove-title" hidden>
  <div class="dialog">
    <h2 id="dialog-remove-title">Remove this member?</h2>
    <p id="dialog-remove-desc">They'll lose access to Northwind immediately. This can't be undone.</p>
    <div class="dialog-actions">
      <button class="btn btn-secondary" id="dialog-remove-cancel">Keep member</button>
      <button class="btn btn-danger" id="dialog-remove-confirm">Remove member</button>
    </div>
  </div>
</div>

<!-- Delete Workspace Dialog -->
<div class="dialog-overlay" id="dialog-delete" role="dialog" aria-modal="true" aria-labelledby="dialog-delete-title" hidden>
  <div class="dialog">
    <h2 id="dialog-delete-title">Delete Northwind?</h2>
    <p>All projects, files, and team data will be permanently removed. This can't be undone.</p>
    <div class="dialog-actions">
      <button class="btn btn-secondary" id="dialog-delete-cancel">Keep workspace</button>
      <button class="btn btn-danger" id="dialog-delete-confirm">Delete workspace</button>
    </div>
  </div>
</div>

<script>
(function() {
  'use strict';

  // Navigation
  const navButtons = document.querySelectorAll('[data-nav]');
  const panels = document.querySelectorAll('[data-panel]');

  function showPanel(panelName) {
    panels.forEach(p => {
      if (p.dataset.panel === panelName) {
        p.classList.add('active');
        p.removeAttribute('hidden');
      } else {
        p.classList.remove('active');
        p.setAttribute('hidden', '');
      }
    });
    navButtons.forEach(btn => {
      if (btn.dataset.nav === panelName) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });
  }

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.nav));
  });

  // Message helpers
  function showError(el, message) {
    el.textContent = message;
    el.classList.add('visible');
  }

  function showSuccess(el, message) {
    el.textContent = message;
    el.classList.add('visible');
  }

  function clearMessages(container) {
    const errors = container.querySelectorAll('[data-error]');
    const successes = container.querySelectorAll('[role="status"]');
    errors.forEach(e => { e.classList.remove('visible'); e.textContent = ''; });
    successes.forEach(s => { s.classList.remove('visible'); s.textContent = ''; });
  }

  // Profile
  const profileForm = document.getElementById('profile-form');
  const profileError = document.getElementById('profile-error');
  const profileSuccess = document.getElementById('profile-success');

  profileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    clearMessages(document.getElementById('profile'));
    const name = document.getElementById('profile-name').value.trim();
    if (!name) {
      showError(profileError, 'Name is required. Enter your full name to save your profile.');
      return;
    }
    showSuccess(profileSuccess, 'Profile saved. Your changes are now live.');
  });

  // Notifications
  const switches = document.querySelectorAll('[role="switch"]');
  switches.forEach(sw => {
    sw.addEventListener('click', function() {
      const checked = this.getAttribute('aria-checked') === 'true';
      this.setAttribute('aria-checked', String(!checked));
    });
  });

  document.querySelector('[data-action="save-notifications"]').addEventListener('click', function() {
    clearMessages(document.getElementById('notifications'));
    showSuccess(document.getElementById('notifications-success'), 'Preferences saved. You\'ll receive notifications based on these settings.');
  });

  // Team - Remove member dialog
  let pendingRemoveTarget = null;
  const removeDialog = document.getElementById('dialog-remove');
  const removeCancel = document.getElementById('dialog-remove-cancel');
  const removeConfirm = document.getElementById('dialog-remove-confirm');

  function openDialog(dialog) {
    dialog.removeAttribute('hidden');
    dialog.classList.add('open');
    const firstBtn = dialog.querySelector('.dialog-actions button');
    if (firstBtn) firstBtn.focus();
  }

  function closeDialog(dialog) {
    dialog.setAttribute('hidden', '');
    dialog.classList.remove('open');
  }

  document.querySelectorAll('[data-action="remove-member"]').forEach(btn => {
    btn.addEventListener('click', function() {
      pendingRemoveTarget = this.dataset.target;
      const memberCard = document.querySelector('[data-member="' + pendingRemoveTarget + '"]');
      const name = memberCard ? memberCard.querySelector('.member-name').textContent : 'this member';
      document.getElementById('dialog-remove-desc').textContent = name + ' will lose access to Northwind immediately. This can\'t be undone.';
      openDialog(removeDialog);
    });
  });

  removeCancel.addEventListener('click', () => {
    closeDialog(removeDialog);
    pendingRemoveTarget = null;
  });

  removeConfirm.addEventListener('click', () => {
    if (pendingRemoveTarget) {
      const card = document.querySelector('[data-member="' + pendingRemoveTarget + '"]');
      if (card) card.remove();
      showSuccess(document.getElementById('team-success'), 'Member removed. They no longer have access to Northwind.');
    }
    closeDialog(removeDialog);
    pendingRemoveTarget = null;
  });

  // Team - Invite
  const inviteForm = document.getElementById('invite-form');
  const inviteError = document.getElementById('invite-error');
  const inviteSuccess = document.getElementById('invite-success');
  let memberCounter = 3;

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  inviteForm.addEventListener('submit', function(e) {
    e.preventDefault();
    clearMessages(document.getElementById('team'));
    const email = document.getElementById('invite-email').value.trim();
    if (!email || !isValidEmail(email)) {
      showError(inviteError, 'That doesn\'t look like a valid email. Check the format (e.g. name@company.com) and try again.');
      return;
    }
    memberCounter++;
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const newMember = document.createElement('div');
    newMember.className = 'member-card';
    newMember.setAttribute('data-member', String(memberCounter));
    newMember.innerHTML = '<div class="member-info"><span class="member-name">' + escapeHtml(name) + '</span><span class="member-email">' + escapeHtml(email) + '</span><span class="member-role">Invited</span></div><button class="btn-remove" data-action="remove-member" data-target="' + memberCounter + '" aria-label="Remove ' + escapeHtml(name) + '">Remove</button>';
    document.getElementById('team-list').appendChild(newMember);
    newMember.querySelector('.btn-remove').addEventListener('click', function() {
      pendingRemoveTarget = this.dataset.target;
      const card = document.querySelector('[data-member="' + pendingRemoveTarget + '"]');
      const mName = card ? card.querySelector('.member-name').textContent : 'this member';
      document.getElementById('dialog-remove-desc').textContent = mName + ' will lose access to Northwind immediately. This can\'t be undone.';
      openDialog(removeDialog);
    });
    document.getElementById('invite-email').value = '';
    showSuccess(inviteSuccess, 'Invite sent to ' + email + '. They\'ll get an email to join Northwind.');
  });

  // Projects
  const projectForm = document.getElementById('project-form');
  const projectSuccess = document.getElementById('project-success');
  let projectCount = 0;

  document.getElementById('projects-empty').querySelector('[data-action="create-project"]').addEventListener('click', function() {
    document.getElementById('projects-empty').style.display = 'none';
    document.getElementById('project-create-btn').style.display = '';
    document.getElementById('project-name').focus();
  });

  projectForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('project-name').value.trim();
    if (!name) return;
    projectCount++;
    const project = document.createElement('div');
    project.className = 'project-card';
    project.setAttribute('data-project', String(projectCount));
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    project.innerHTML = '<div class="project-name">' + escapeHtml(name) + '</div><div class="project-date">Created ' + date + '</div>';
    document.getElementById('projects-list').appendChild(project);
    document.getElementById('project-name').value = '';
    showSuccess(projectSuccess, 'Project "' + name + '" created. You can now add tasks and collaborators.');
  });

  // Billing
  const billingForm = document.getElementById('billing-form');
  const billingError = document.getElementById('billing-error');
  const billingSuccess = document.getElementById('billing-success');

  billingForm.addEventListener('submit', function(e) {
    e.preventDefault();
    clearMessages(document.getElementById('billing'));
    const cardNum = document.getElementById('card-number').value.replace(/\s/g, '');
    const expiry = document.getElementById('card-expiry').value.trim();
    const cvc = document.getElementById('card-cvc').value.trim();

    if (cardNum === '4000000000000002') {
      showError(billingError, 'Payment declined. Your card was declined by the bank. Try a different card or contact your bank for details.');
      return;
    }

    if (cardNum.length !== 16) {
      showError(billingError, 'Invalid card number. Enter the 16 digits printed on your card.');
      return;
    }

    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
      showError(billingError, 'Invalid expiry date. Use the MM/YY format from the front of your card.');
      return;
    }

    if (!cvc || cvc.length < 3) {
      showError(billingError, 'Invalid security code. Enter the 3-digit code on the back of your card.');
      return;
    }

    showSuccess(billingSuccess, 'Card updated. Your new payment method is now active for Northwind Pro.');
  });

  // Danger Zone
  const deleteDialog = document.getElementById('dialog-delete');
  const deleteCancel = document.getElementById('dialog-delete-cancel');
  const deleteConfirm = document.getElementById('dialog-delete-confirm');

  document.querySelector('[data-action="delete-workspace"]').addEventListener('click', function() {
    openDialog(deleteDialog);
  });

  deleteCancel.addEventListener('click', () => {
    closeDialog(deleteDialog);
  });

  deleteConfirm.addEventListener('click', () => {
    closeDialog(deleteDialog);
  });

  // Close dialogs on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (removeDialog.classList.contains('open')) {
        closeDialog(removeDialog);
        pendingRemoveTarget = null;
      }
      if (deleteDialog.classList.contains('open')) {
        closeDialog(deleteDialog);
      }
    }
  });

  // Close dialogs on overlay click
  [removeDialog, deleteDialog].forEach(dialog => {
    dialog.addEventListener('click', function(e) {
      if (e.target === dialog) {
        closeDialog(dialog);
        if (dialog === removeDialog) pendingRemoveTarget = null;
      }
    });
  });

  // Helper
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Initialize
  showPanel('profile');
})();
</script>
</body>
</html>
```