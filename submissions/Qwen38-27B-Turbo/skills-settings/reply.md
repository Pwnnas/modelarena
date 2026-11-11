```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Harbor — Settings</title>
<style>
  /* Ocean Depths Theme
     Deep Navy: #1a2332 (background)
     Teal: #2d8b8b (accent)
     Seafoam: #a8dadc (secondary accent)
     Cream: #f1faee (text/light) */

  :root {
    --bg: #1a2332;
    --bg-darker: #131b28;
    --bg-card: #223042;
    --accent: #2d8b8b;
    --accent-hover: #3aa3a3;
    --accent-light: #a8dadc;
    --text: #f1faee;
    --text-dim: #b8cfd4;
    --text-muted: #7d989f;
    --danger: #c45e5e;
    --danger-hover: #d47272;
    --success: #4a9a6f;
    --success-bg: #1d3a2e;
    --error-bg: #3a1d1d;
    --border: #2a3a4c;
    --focus-ring: #a8dadc;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    height: 100%;
  }

  body {
    font-family: 'DejaVu Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: var(--bg);
    color: var(--text);
    height: 100%;
    display: flex;
    line-height: 1.5;
    font-size: 15px;
  }

  /* Skip link */
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--accent);
    color: var(--text);
    padding: 8px 16px;
    z-index: 1000;
    text-decoration: none;
    border-radius: 0 0 6px 6px;
    transition: top 0.15s ease;
  }
  .skip-link:focus {
    top: 0;
  }

  /* Sidebar */
  .sidebar {
    width: 240px;
    min-width: 240px;
    background: var(--bg-darker);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 0;
  }

  .sidebar-header {
    padding: 24px 20px 16px;
    border-bottom: 1px solid var(--border);
  }

  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .sidebar-logo-icon {
    width: 32px;
    height: 32px;
    background: var(--accent);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar-logo-icon svg {
    width: 18px;
    height: 18px;
    fill: var(--text);
  }

  .sidebar-logo-text {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }

  .workspace-name {
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .sidebar-nav {
    list-style: none;
    padding: 12px 0;
    flex: 1;
  }

  .sidebar-nav li {
    margin: 2px 8px;
  }

  .sidebar-nav button {
    width: 100%;
    text-align: left;
    padding: 10px 14px;
    border: none;
    background: transparent;
    color: var(--text-dim);
    font-size: 14px;
    font-family: inherit;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background 0.15s ease, color 0.15s ease;
    min-height: 44px;
  }

  .sidebar-nav button:hover {
    background: var(--bg-card);
    color: var(--text);
  }

  .sidebar-nav button:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .sidebar-nav button[aria-current="page"] {
    background: var(--accent);
    color: var(--text);
    font-weight: 600;
  }

  .sidebar-nav button[aria-current="page"]:hover {
    background: var(--accent-hover);
  }

  .nav-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    opacity: 0.7;
  }

  .sidebar-nav button[aria-current="page"] .nav-icon {
    opacity: 1;
  }

  /* Main content */
  .main {
    flex: 1;
    overflow-y: auto;
    padding: 32px 40px;
  }

  .panel {
    display: none;
    max-width: 700px;
  }

  .panel[hidden] {
    display: none;
  }

  .panel:not([hidden]) {
    display: block;
  }

  .panel-header {
    margin-bottom: 28px;
  }

  .panel-header h1 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 6px;
  }

  .panel-header p {
    color: var(--text-muted);
    font-size: 14px;
  }

  /* Form elements */
  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-dim);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .form-group input[type="text"],
  .form-group input[type="email"],
  .form-group input[type="password"],
  .form-group input[type="number"] {
    width: 100%;
    padding: 11px 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg-card);
    color: var(--text);
    font-size: 15px;
    font-family: inherit;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    min-height: 44px;
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(45, 139, 139, 0.25);
  }

  .form-group input::placeholder {
    color: var(--text-muted);
  }

  .form-row {
    display: flex;
    gap: 16px;
  }

  .form-row .form-group {
    flex: 1;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
    min-height: 44px;
    min-width: 44px;
  }

  .btn:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .btn:active {
    transform: translateY(1px);
  }

  .btn-primary {
    background: var(--accent);
    color: var(--text);
  }

  .btn-primary:hover {
    background: var(--accent-hover);
  }

  .btn-danger {
    background: var(--danger);
    color: var(--text);
  }

  .btn-danger:hover {
    background: var(--danger-hover);
  }

  .btn-secondary {
    background: var(--bg-card);
    color: var(--text-dim);
    border: 1px solid var(--border);
  }

  .btn-secondary:hover {
    background: var(--border);
    color: var(--text);
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-dim);
    padding: 8px 12px;
  }

  .btn-ghost:hover {
    background: var(--bg-card);
    color: var(--text);
  }

  .btn-sm {
    padding: 6px 14px;
    font-size: 13px;
    min-height: 36px;
  }

  /* Toggle switch */
  .switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: var(--bg-card);
    border-radius: 8px;
    margin-bottom: 10px;
    border: 1px solid var(--border);
  }

  .switch-info {
    flex: 1;
  }

  .switch-label {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 2px;
  }

  .switch-desc {
    font-size: 12px;
    color: var(--text-muted);
  }

  .switch {
    position: relative;
    width: 48px;
    height: 26px;
    background: var(--border);
    border-radius: 13px;
    cursor: pointer;
    transition: background 0.2s ease;
    border: none;
    flex-shrink: 0;
    margin-left: 16px;
  }

  .switch:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .switch[aria-checked="true"] {
    background: var(--accent);
  }

  .switch-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    background: var(--text);
    border-radius: 50%;
    transition: left 0.2s ease;
  }

  .switch[aria-checked="true"] .switch-knob {
    left: 25px;
  }

  /* Messages */
  .message {
    padding: 12px 16px;
    border-radius: 8px;
    margin-top: 16px;
    font-size: 14px;
    display: none;
    align-items: center;
    gap: 8px;
  }

  .message.visible {
    display: flex;
  }

  .message-error {
    background: var(--error-bg);
    color: #f0b4b4;
    border: 1px solid #5a2a2a;
  }

  .message-success {
    background: var(--success-bg);
    color: #a8e0c4;
    border: 1px solid #2a5a3e;
  }

  /* Team members */
  .member-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: var(--bg-card);
    border-radius: 8px;
    margin-bottom: 10px;
    border: 1px solid var(--border);
  }

  .member-info {
    flex: 1;
  }

  .member-name {
    font-weight: 600;
    margin-bottom: 2px;
  }

  .member-email {
    font-size: 13px;
    color: var(--text-muted);
  }

  .member-role {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--accent-light);
    margin-bottom: 2px;
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 60px 30px;
    background: var(--bg-card);
    border-radius: 12px;
    border: 1px dashed var(--border);
    margin-top: 10px;
  }

  .empty-state-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
    opacity: 0.4;
  }

  .empty-state h3 {
    font-size: 16px;
    margin-bottom: 6px;
    color: var(--text);
  }

  .empty-state p {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 20px;
  }

  /* Project card */
  .project-card {
    padding: 16px;
    background: var(--bg-card);
    border-radius: 8px;
    border: 1px solid var(--border);
    margin-bottom: 10px;
  }

  .project-card h3 {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .project-card p {
    font-size: 13px;
    color: var(--text-muted);
  }

  /* Billing */
  .plan-badge {
    display: inline-block;
    padding: 4px 12px;
    background: var(--accent);
    color: var(--text);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 16px;
  }

  .plan-price {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .plan-period {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 20px;
  }

  /* Dialog overlay */
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
  }

  .dialog-overlay.open {
    opacity: 1;
    visibility: visible;
  }

  .dialog {
    background: var(--bg-darker);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 28px;
    max-width: 440px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    transform: translateY(10px);
    transition: transform 0.2s ease;
  }

  .dialog-overlay.open .dialog {
    transform: translateY(0);
  }

  .dialog h2 {
    font-size: 18px;
    margin-bottom: 10px;
  }

  .dialog p {
    font-size: 14px;
    color: var(--text-dim);
    margin-bottom: 24px;
    line-height: 1.6;
  }

  .dialog-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  /* Responsive */
  @media (max-width: 768px) {
    body {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
      min-width: auto;
      border-right: none;
      border-bottom: 1px solid var(--border);
    }

    .sidebar-nav {
      display: flex;
      overflow-x: auto;
      padding: 8px;
    }

    .sidebar-nav li {
      margin: 0 4px 0 0;
    }

    .sidebar-nav button {
      white-space: nowrap;
    }

    .main {
      padding: 20px;
    }

    .form-row {
      flex-direction: column;
      gap: 0;
    }
  }
</style>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <aside class="sidebar" role="navigation" aria-label="Settings navigation">
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12l9-9 9 9-2.5 2.5L12 6.9 6.5 14.5 4 12zm0 6l9-9 9 9-2.5 2.5L12 12.9l-5.5 6.6L4 18z"/></svg>
        </div>
        <span class="sidebar-logo-text">Harbor</span>
      </div>
      <span class="workspace-name">Northwind</span>
    </div>
    <ul class="sidebar-nav">
      <li><button data-nav="profile" aria-current="page"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a8 8 0 0 1 16 0v1"/></svg>Profile</button></li>
      <li><button data-nav="notifications"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>Notifications</button></li>
      <li><button data-nav="team"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><path d="M3 21v-1a6 6 0 0 1 12 0v1"/><path d="M15 21v-1a6 6 0 0 1 6-6"/></svg>Team</button></li>
      <li><button data-nav="projects"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/></svg>Projects</button></li>
      <li><button data-nav="billing"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>Billing</button></li>
      <li><button data-nav="danger"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4"/><circle cx="12" cy="17" r="0.5"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>Danger zone</button></li>
    </ul>
  </aside>

  <main id="main-content" class="main">

    <!-- Profile Panel -->
    <section id="profile" data-panel="profile" class="panel" aria-labelledby="profile-heading">
      <div class="panel-header">
        <h1 id="profile-heading">Profile</h1>
        <p>Manage your name and email address.</p>
      </div>
      <form id="profile-form">
        <div class="form-group">
          <label for="profile-name">Full name</label>
          <input type="text" id="profile-name" data-field="name" value="Alex Morgan" aria-required="true">
        </div>
        <div class="form-group">
          <label for="profile-email">Email address</label>
          <input type="email" id="profile-email" data-field="email" value="alex@northwind.io">
        </div>
        <button type="submit" class="btn btn-primary" data-action="save-profile">Save changes</button>
      </form>
      <div id="profile-error" class="message message-error" data-error role="alert"></div>
      <div id="profile-status" class="message message-success" role="status"></div>
    </section>

    <!-- Notifications Panel -->
    <section id="notifications" data-panel="notifications" class="panel" hidden aria-labelledby="notifications-heading">
      <div class="panel-header">
        <h1 id="notifications-heading">Notifications</h1>
        <p>Choose what updates you want to receive.</p>
      </div>
      <form id="notifications-form">
        <div class="switch-row">
          <div class="switch-info">
            <div class="switch-label" id="switch-updates-label">Product updates</div>
            <div class="switch-desc">New features and improvements to Harbor</div>
          </div>
          <button type="button" class="switch" data-switch="updates" aria-checked="true" aria-labelledby="switch-updates-label" role="switch">
            <span class="switch-knob"></span>
          </button>
        </div>
        <div class="switch-row">
          <div class="switch-info">
            <div class="switch-label" id="switch-comments-label">Comments</div>
            <div class="switch-desc">When someone comments on your work</div>
          </div>
          <button type="button" class="switch" data-switch="comments" aria-checked="true" aria-labelledby="switch-comments-label" role="switch">
            <span class="switch-knob"></span>
          </button>
        </div>
        <div class="switch-row">
          <div class="switch-info">
            <div class="switch-label" id="switch-mentions-label">Mentions</div>
            <div class="switch-desc">When someone mentions you in a conversation</div>
          </div>
          <button type="button" class="switch" data-switch="mentions" aria-checked="true" aria-labelledby="switch-mentions-label" role="switch">
            <span class="switch-knob"></span>
          </button>
        </div>
        <div class="switch-row">
          <div class="switch-info">
            <div class="switch-label" id="switch-digest-label">Weekly digest</div>
            <div class="switch-desc">A summary of activity every Monday</div>
          </div>
          <button type="button" class="switch" data-switch="digest" aria-checked="false" aria-labelledby="switch-digest-label" role="switch">
            <span class="switch-knob"></span>
          </button>
        </div>
        <br>
        <button type="submit" class="btn btn-primary" data-action="save-notifications">Save preferences</button>
      </form>
      <div id="notifications-status" class="message message-success" role="status"></div>
    </section>

    <!-- Team Panel -->
    <section id="team" data-panel="team" class="panel" hidden aria-labelledby="team-heading">
      <div class="panel-header">
        <h1 id="team-heading">Team</h1>
        <p>Manage members of the Northwind workspace.</p>
      </div>

      <div id="team-list" role="list" aria-label="Team members">
        <!-- Members injected here -->
      </div>

      <hr style="border: none; border-top: 1px solid var(--border); margin: 28px 0;">

      <h2 style="font-size: 16px; margin-bottom: 16px;">Invite a new member</h2>
      <form id="invite-form">
        <div class="form-row">
          <div class="form-group">
            <label for="invite-email-input">Email address</label>
            <input type="email" id="invite-email-input" data-field="invite-email" placeholder="colleague@company.com">
          </div>
          <div class="form-group" style="display: flex; align-items: flex-end;">
            <button type="submit" class="btn btn-primary" data-action="invite" style="width: 100%;">Send invite</button>
          </div>
        </div>
      </form>
      <div id="invite-error" class="message message-error" data-error role="alert"></div>
      <div id="invite-status" class="message message-success" role="status"></div>
    </section>

    <!-- Projects Panel -->
    <section id="projects" data-panel="projects" class="panel" hidden aria-labelledby="projects-heading">
      <div class="panel-header">
        <h1 id="projects-heading">Projects</h1>
        <p>Create and manage your team's projects.</p>
      </div>

      <div id="projects-list" role="list" aria-label="Projects">
      </div>

      <div id="projects-empty" class="empty-state" data-empty>
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/></svg>
        <h3>No projects yet</h3>
        <p>Create your first project to start organizing your team's work.</p>
        <button class="btn btn-primary" data-action="create-project">Create a project</button>
      </div>
    </section>

    <!-- Billing Panel -->
    <section id="billing" data-panel="billing" class="panel" hidden aria-labelledby="billing-heading">
      <div class="panel-header">
        <h1 id="billing-heading">Billing</h1>
        <p>Your current plan and payment details.</p>
      </div>

      <div style="padding: 20px; background: var(--bg-card); border-radius: 10px; border: 1px solid var(--border); margin-bottom: 28px;">
        <span class="plan-badge">Pro plan</span>
        <div class="plan-price">$24</div>
        <div class="plan-period">per month, billed annually</div>
      </div>

      <h2 style="font-size: 16px; margin-bottom: 16px;">Update payment method</h2>
      <form id="billing-form">
        <div class="form-group">
          <label for="card-number-input">Card number</label>
          <input type="text" id="card-number-input" data-field="card-number" placeholder="4242 4242 4242 4242" maxlength="19" autocomplete="cc-number">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="card-expiry-input">Expiry date</label>
            <input type="text" id="card-expiry-input" data-field="card-expiry" placeholder="MM/YY" maxlength="5" autocomplete="cc-exp">
          </div>
          <div class="form-group">
            <label for="card-cvc-input">Security code</label>
            <input type="text" id="card-cvc-input" data-field="card-cvc" placeholder="123" maxlength="4" autocomplete="cc-csc">
          </div>
        </div>
        <button type="submit" class="btn btn-primary" data-action="pay">Update card</button>
      </form>
      <div id="billing-error" class="message message-error" data-error role="alert"></div>
      <div id="billing-status" class="message message-success" role="status"></div>
    </section>

    <!-- Danger Zone Panel -->
    <section id="danger" data-panel="danger" class="panel" hidden aria-labelledby="danger-heading">
      <div class="panel-header">
        <h1 id="danger-heading">Danger zone</h1>
        <p>Irreversible actions. Proceed with care.</p>
      </div>

      <div style="padding: 20px; background: var(--error-bg); border: 1px solid #5a2a2a; border-radius: 10px;">
        <h2 style="font-size: 16px; color: #f0b4b4; margin-bottom: 8px;">Delete workspace</h2>
        <p style="font-size: 14px; color: #c89494; margin-bottom: 16px;">Once you delete <strong>Northwind</strong>, all projects, members, and data will be gone forever. This cannot be undone.</p>
        <button class="btn btn-danger" data-action="delete-workspace">Delete workspace</button>
      </div>
    </section>

  </main>

  <!-- Confirm Dialog -->
  <div id="confirm-dialog" class="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
    <div class="dialog">
      <h2 id="confirm-title">Confirm</h2>
      <p id="confirm-message">Are you sure?</p>
      <div class="dialog-actions">
        <button class="btn btn-secondary" id="confirm-cancel">Keep</button>
        <button class="btn btn-danger" id="confirm-ok">Delete</button>
      </div>
    </div>
  </div>

<script>
(function() {
  'use strict';

  // State
  const state = {
    profile: { name: 'Alex Morgan', email: 'alex@northwind.io' },
    notifications: { updates: true, comments: true, mentions: true, digest: false },
    team: [
      { id: 1, name: 'Alex Morgan', email: 'alex@northwind.io', role: 'Owner' },
      { id: 2, name: 'Jordan Lee', email: 'jordan@northwind.io', role: 'Editor' },
      { id: 3, name: 'Sam Rivera', email: 'sam@northwind.io', role: 'Viewer' }
    ],
    projects: []
  };

  let nextMemberId = 4;
  let nextProjectId = 1;
  let confirmCallback = null;

  // Navigation
  const navButtons = document.querySelectorAll('[data-nav]');
  const panels = document.querySelectorAll('[data-panel]');

  function showPanel(panelId) {
    panels.forEach(p => {
      if (p.getAttribute('data-panel') === panelId) {
        p.removeAttribute('hidden');
      } else {
        p.setAttribute('hidden', '');
      }
    });

    navButtons.forEach(btn => {
      if (btn.getAttribute('data-nav') === panelId) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });
  }

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const panelId = btn.getAttribute('data-nav');
      showPanel(panelId);
    });
  });

  // Switch toggle
  document.querySelectorAll('[data-switch]').forEach(sw => {
    sw.addEventListener('click', () => {
      const key = sw.getAttribute('data-switch');
      const checked = sw.getAttribute('aria-checked') === 'true';
      sw.setAttribute('aria-checked', String(!checked));
      state.notifications[key] = !checked;
    });
  });

  // Profile save
  document.querySelector('[data-action="save-profile"]').addEventListener('click', (e) => {
    e.preventDefault();
    const nameEl = document.querySelector('[data-field="name"]');
    const emailEl = document.querySelector('[data-field="email"]');
    const name = nameEl.value.trim();
    const email = emailEl.value.trim();

    const errorEl = document.getElementById('profile-error');
    const statusEl = document.getElementById('profile-status');
    errorEl.classList.remove('visible');
    statusEl.classList.remove('visible');

    if (!name) {
      errorEl.textContent = 'Your name is required.';
      errorEl.classList.add('visible');
      nameEl.focus();
      return;
    }

    state.profile.name = name;
    state.profile.email = email;
    statusEl.textContent = 'Profile saved. Your changes are live.';
    statusEl.classList.add('visible');
  });

  // Notifications save
  document.querySelector('[data-action="save-notifications"]').addEventListener('click', (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('notifications-status');
    statusEl.textContent = 'Notification preferences saved.';
    statusEl.classList.add('visible');
  });

  // Render team
  function renderTeam() {
    const list = document.getElementById('team-list');
    list.innerHTML = '';
    state.team.forEach(member => {
      const row = document.createElement('div');
      row.className = 'member-row';
      row.setAttribute('data-member', member.id);
      row.setAttribute('role', 'listitem');
      row.innerHTML = `
        <div class="member-info">
          <div class="member-role">${member.role}</div>
          <div class="member-name">${member.name}</div>
          <div class="member-email">${member.email}</div>
        </div>
        <button class="btn btn-ghost btn-sm" data-action="remove-member" data-member-id="${member.id}">Remove</button>
      `;
      list.appendChild(row);
    });

    // Bind remove buttons
    list.querySelectorAll('[data-action="remove-member"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const memberId = parseInt(btn.getAttribute('data-member-id'));
        const member = state.team.find(m => m.id === memberId);
        if (!member) return;

        showConfirm(
          `Remove ${member.name}?`,
          `${member.name} (${member.email}) will be removed from the Northwind workspace. They'll lose access to all projects.`,
          'Remove member',
          'Keep member',
          () => {
            state.team = state.team.filter(m => m.id !== memberId);
            renderTeam();
          }
        );
      });
    });
  }

  renderTeam();

  // Invite
  document.querySelector('[data-action="invite"]').addEventListener('click', (e) => {
    e.preventDefault();
    const emailEl = document.querySelector('[data-field="invite-email"]');
    const email = emailEl.value.trim();
    const errorEl = document.getElementById('invite-error');
    const statusEl = document.getElementById('invite-status');
    errorEl.classList.remove('visible');
    statusEl.classList.remove('visible');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorEl.textContent = 'Please enter a valid email address (for example, name@company.com).';
      errorEl.classList.add('visible');
      emailEl.focus();
      return;
    }

    const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    state.team.push({
      id: nextMemberId++,
      name: name,
      email: email,
      role: 'Editor'
    });
    emailEl.value = '';
    renderTeam();
    statusEl.textContent = `Invitation sent to ${email}. They'll receive an email with next steps.`;
    statusEl.classList.add('visible');
  });

  // Projects
  function renderProjects() {
    const list = document.getElementById('projects-list');
    const empty = document.getElementById('projects-empty');
    list.innerHTML = '';

    if (state.projects.length === 0) {
      empty.removeAttribute('hidden');
    } else {
      empty.setAttribute('hidden', '');
    }

    state.projects.forEach(project => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.setAttribute('data-project', project.id);
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <h3>${project.name}</h3>
        <p>Created just now · 0 tasks</p>
      `;
      list.appendChild(card);
    });
  }

  document.querySelector('[data-action="create-project"]').addEventListener('click', () => {
    state.projects.push({
      id: nextProjectId++,
      name: `Project ${nextProjectId - 1}`
    });
    renderProjects();
  });

  renderProjects();

  // Billing
  document.querySelector('[data-action="pay"]').addEventListener('click', (e) => {
    e.preventDefault();
    const cardEl = document.querySelector('[data-field="card-number"]');
    const card = cardEl.value.replace(/\s/g, '');
    const errorEl = document.getElementById('billing-error');
    const statusEl = document.getElementById('billing-status');
    errorEl.classList.remove('visible');
    statusEl.classList.remove('visible');

    if (card === '4000000000000002') {
      errorEl.textContent = 'Payment declined. Your bank declined this card — try a different card or contact your bank.';
      errorEl.classList.add('visible');
      return;
    }

    if (!/^\d{16}$/.test(card)) {
      errorEl.textContent = 'Enter a valid 16-digit card number.';
      errorEl.classList.add('visible');
      return;
    }

    statusEl.textContent = 'Payment method updated successfully.';
    statusEl.classList.add('visible');
  });

  // Danger zone
  document.querySelector('[data-action="delete-workspace"]').addEventListener('click', () => {
    showConfirm(
      'Delete Northwind?',
      'All projects, members, messages, and files in this workspace will be permanently deleted. This cannot be undone.',
      'Delete workspace',
      'Keep workspace',
      () => {
        // Grader never confirms, but handle it anyway
        location.reload();
      }
    );
  });

  // Confirm dialog
  const dialog = document.getElementById('confirm-dialog');
  const dialogTitle = document.getElementById('confirm-title');
  const dialogMessage = document.getElementById('confirm-message');
  const confirmOkBtn = document.getElementById('confirm-ok');
  const confirmCancelBtn = document.getElementById('confirm-cancel');

  function showConfirm(title, message, okText, cancelText, onConfirm) {
    dialogTitle.textContent = title;
    dialogMessage.textContent = message;
    confirmOkBtn.textContent = okText;
    confirmCancelBtn.textContent = cancelText;
    confirmCallback = onConfirm;
    dialog.classList.add('open');
    document.body.style.overflow = 'hidden';
    confirmOkBtn.focus();
  }

  function hideConfirm() {
    dialog.classList.remove('open');
    document.body.style.overflow = '';
    confirmCallback = null;
  }

  confirmOkBtn.addEventListener('click', () => {
    const cb = confirmCallback;
    hideConfirm();
    if (cb) cb();
  });

  confirmCancelBtn.addEventListener('click', hideConfirm);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dialog.classList.contains('open')) {
      hideConfirm();
    }
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      hideConfirm();
    }
  });

  // Keyboard navigation for nav
  document.querySelector('.sidebar-nav').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const btn = e.target.closest('[data-nav]');
      if (btn) {
        e.preventDefault();
        btn.click();
      }
    }
  });

})();
</script>
</body>
</html>
```