```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Harbor · Northwind Settings</title>
<style>
  :root {
    --navy: #1a2332;
    --navy-deep: #131a26;
    --navy-raised: #232f42;
    --teal: #2d8b8b;
    --teal-strong: #1f6b6b;
    --teal-deep: #155353;
    --seafoam: #a8dadc;
    --cream: #f1faee;
    --muted: #9fc6c6;
    --error: #f2a9a2;
    --danger: #a14b47;
    --font-body: "DejaVu Sans", "Liberation Sans", "Segoe UI", Roboto, Arial, sans-serif;
    --font-header: "DejaVu Sans Bold", "DejaVu Sans", "Liberation Sans", sans-serif;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--navy);
    color: var(--cream);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.55;
  }
  [hidden] { display: none !important; }
  a.skip-link {
    position: absolute;
    left: -9999px;
    top: 0;
    background: var(--teal-strong);
    color: var(--cream);
    padding: 10px 16px;
    z-index: 100;
    border-radius: 0 0 10px 0;
    font-weight: 600;
  }
  a.skip-link:focus { left: 0; }
  :focus-visible { outline: 3px solid var(--seafoam); outline-offset: 2px; }
  h1, h2, h3 { font-family: var(--font-header); }

  .app { display: flex; min-height: 100vh; }

  .sidebar {
    width: 272px;
    flex: 0 0 272px;
    background: var(--navy-deep);
    border-right: 1px solid rgba(168, 218, 220, 0.14);
    padding: 28px 18px;
    display: flex;
    flex-direction: column;
    gap: 26px;
    position: sticky;
    top: 0;
    height: 100vh;
  }
  .brand { display: flex; align-items: center; gap: 12px; padding: 0 8px; }
  .brand-mark {
    width: 38px; height: 38px;
    border-radius: 12px;
    background: var(--teal-strong);
    color: var(--cream);
    display: flex; align-items: center; justify-content: center;
    flex: 0 0 auto;
  }
  .brand-name { font-family: var(--font-header); font-size: 22px; font-weight: 700; color: var(--cream); }
  .brand-workspace { margin: -14px 0 0; padding: 0 8px; color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700; }
  .nav { display: flex; flex-direction: column; gap: 6px; }
  .nav-item {
    display: flex; align-items: center; gap: 12px;
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--seafoam);
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 15px;
    text-align: left;
    cursor: pointer;
  }
  .nav-item:hover { background: rgba(45, 139, 139, 0.16); color: var(--cream); }
  .nav-item[aria-current="page"] { background: var(--teal-strong); color: var(--cream); }
  .nav-icon { flex: 0 0 auto; opacity: 0.9; }

  .content { flex: 1; min-width: 0; padding: 44px 56px 90px; }
  .panel-header h1 { font-size: 32px; font-weight: 700; color: var(--cream); margin: 0 0 8px; }
  .panel-lede { color: var(--muted); margin: 0 0 28px; max-width: 60ch; }

  .card {
    background: var(--navy-raised);
    border: 1px solid rgba(168, 218, 220, 0.16);
    border-radius: 16px;
    padding: 28px;
  }
  .card + .card { margin-top: 22px; }
  .card-title { font-size: 20px; font-weight: 700; color: var(--cream); margin: 0 0 6px; }
  .card-sub { color: var(--muted); margin: 0 0 22px; }

  .field { margin-bottom: 18px; }
  .field:last-child { margin-bottom: 0; }
  .field-label { display: block; font-weight: 600; color: var(--seafoam); margin-bottom: 8px; font-size: 14px; }
  .field-input {
    width: 100%;
    background: var(--navy);
    border: 1px solid rgba(168, 218, 220, 0.28);
    color: var(--cream);
    border-radius: 10px;
    padding: 12px 14px;
    font-family: var(--font-body);
    font-size: 16px;
  }
  .field-input::placeholder { color: rgba(168, 218, 220, 0.55); }
  .field-input:focus { outline: none; border-color: var(--teal); box-shadow: 0 0 0 3px rgba(45, 139, 139, 0.35); }
  .field-error { color: var(--error); font-size: 14px; margin: 8px 0 0; }
  .field-row { display: flex; gap: 16px; }
  .field-row .field { flex: 1; }

  .btn {
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 15px;
    border-radius: 10px;
    padding: 12px 18px;
    border: 1px solid transparent;
    cursor: pointer;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn-primary { background: var(--teal-strong); color: var(--cream); }
  .btn-primary:hover { background: var(--teal-deep); }
  .btn-ghost { background: transparent; border-color: rgba(168, 218, 220, 0.4); color: var(--seafoam); }
  .btn-ghost:hover { background: rgba(45, 139, 139, 0.18); }
  .btn-danger { background: var(--danger); color: var(--cream); }
  .btn-danger:hover { background: #863d39; }
  .btn-small { min-height: 38px; padding: 8px 12px; font-size: 14px; }

  .form-actions { display: flex; gap: 12px; margin-top: 8px; }

  .status {
    margin-top: 22px;
    padding: 14px 16px;
    border-radius: 12px;
    background: rgba(45, 139, 139, 0.16);
    border: 1px solid rgba(45, 139, 139, 0.45);
    color: var(--seafoam);
  }

  /* switches */
  .switch-row { padding: 6px 0; }
  .switch {
    display: flex; align-items: center; gap: 14px;
    width: 100%;
    background: none; border: none; padding: 10px 0;
    cursor: pointer; text-align: left;
    color: inherit; font: inherit;
  }
  .switch-track {
    width: 48px; height: 28px; border-radius: 999px;
    background: rgba(168, 218, 220, 0.25);
    position: relative; flex: 0 0 auto;
    transition: background 0.2s ease;
  }
  .switch-thumb {
    position: absolute; top: 3px; left: 3px;
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--cream);
    transition: left 0.2s ease;
  }
  .switch[aria-checked="true"] .switch-track { background: var(--teal); }
  .switch[aria-checked="true"] .switch-thumb { left: 23px; }
  .switch:focus-visible { outline: none; }
  .switch:focus-visible .switch-track { box-shadow: 0 0 0 3px rgba(168, 218, 220, 0.6); }
  .switch-text { display: flex; flex-direction: column; }
  .switch-name { font-weight: 700; color: var(--cream); }
  .switch-hint { color: var(--muted); font-size: 13px; }

  /* team */
  .member-list { list-style: none; margin: 0 0 30px; padding: 0; display: flex; flex-direction: column; gap: 12px; }
  .member { display: flex; align-items: center; gap: 16px; background: var(--navy-raised); border: 1px solid rgba(168, 218, 220, 0.16); border-radius: 14px; padding: 16px 20px; }
  .member-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--teal-strong); color: var(--cream); display: flex; align-items: center; justify-content: center; font-weight: 700; flex: 0 0 auto; }
  .member-main { flex: 1; min-width: 0; }
  .member-name { margin: 0; font-weight: 700; color: var(--cream); }
  .member-email { margin: 2px 0 0; color: var(--muted); font-size: 14px; }
  .member-side { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
  .member-role { margin: 0; font-size: 13px; color: var(--seafoam); font-weight: 700; }

  /* projects */
  .empty-state { text-align: left; }
  .empty-title { font-size: 22px; font-weight: 700; color: var(--cream); margin: 0 0 8px; }
  .empty-copy { color: var(--muted); margin: 0 0 22px; max-width: 52ch; }
  .project-list { display: flex; flex-direction: column; gap: 12px; }
  .project { display: flex; align-items: center; justify-content: space-between; gap: 16px; background: var(--navy-raised); border: 1px solid rgba(168, 218, 220, 0.16); border-radius: 14px; padding: 18px 20px; }
  .project-name { margin: 0; font-size: 18px; font-weight: 700; color: var(--cream); }
  .project-meta { margin: 4px 0 0; color: var(--muted); font-size: 14px; }
  .project-status { background: rgba(45, 139, 139, 0.2); color: var(--seafoam); padding: 6px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; white-space: nowrap; }

  /* billing */
  .plan-card { margin-bottom: 22px; }
  .plan-label { text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px; font-weight: 700; color: var(--muted); margin: 0 0 8px; }
  .plan-name { font-size: 30px; font-weight: 700; color: var(--cream); margin: 0; }
  .plan-price { font-size: 20px; color: var(--seafoam); margin: 8px 0 10px; font-weight: 700; }
  .plan-note { color: var(--muted); margin: 0; }
  .payment-error { margin-top: 16px; }

  /* danger */
  .danger-card { border-color: rgba(242, 169, 162, 0.35); }
  .danger-card .btn { margin-top: 8px; }

  /* dialog */
  .dialog-layer { position: fixed; inset: 0; background: rgba(10, 15, 22, 0.7); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 50; }
  .dialog { background: var(--navy-raised); border: 1px solid rgba(168, 218, 220, 0.22); border-radius: 18px; max-width: 460px; width: 100%; padding: 30px; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5); }
  .dialog[hidden] { display: none !important; }
  .dialog-title { font-size: 24px; font-weight: 700; color: var(--cream); margin: 0 0 10px; }
  .dialog-message { color: var(--muted); margin: 0 0 24px; }
  .dialog-actions { display: flex; justify-content: flex-end; gap: 12px; }
  .dialog-close { position: absolute; top: 14px; right: 14px; background: none; border: none; color: var(--muted); font-size: 24px; cursor: pointer; padding: 8px; border-radius: 8px; line-height: 1; }
  .dialog-close:hover { color: var(--cream); }

  @media (max-width: 920px) {
    .app { flex-direction: column; }
    .sidebar { width: 100%; flex: none; height: auto; position: static; flex-direction: row; align-items: center; flex-wrap: wrap; gap: 14px; border-right: none; border-bottom: 1px solid rgba(168, 218, 220, 0.14); }
    .nav { flex-direction: row; flex-wrap: wrap; }
    .content { padding: 28px 22px 60px; }
  }
</style>
</head>
<body>
<a class="skip-link" href="#main-content">Skip to settings</a>

<div class="app">
  <aside class="sidebar" aria-label="Harbor workspace">
    <div class="brand">
      <span class="brand-mark">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 12c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/></svg>
      </span>
      <span class="brand-name">Harbor</span>
    </div>
    <p class="brand-workspace">Northwind</p>
    <nav class="nav" aria-label="Workspace panels">
      <button type="button" class="nav-item" data-nav="profile" aria-current="page">
        <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Profile</span>
      </button>
      <button type="button" class="nav-item" data-nav="notifications">
        <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
        <span>Notifications</span>
      </button>
      <button type="button" class="nav-item" data-nav="team">
        <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Team</span>
      </button>
      <button type="button" class="nav-item" data-nav="projects">
        <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <span>Projects</span>
      </button>
      <button type="button" class="nav-item" data-nav="billing">
        <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        <span>Billing</span>
      </button>
      <button type="button" class="nav-item" data-nav="danger">
        <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        <span>Danger zone</span>
      </button>
    </nav>
  </aside>

  <main class="content" id="main-content">
    <section class="panel" id="panel-profile" data-panel="profile">
      <header class="panel-header">
        <h1>Profile</h1>
        <p class="panel-lede">This is how your teammates see you across Northwind.</p>
      </header>
      <form class="card" id="profile-form" novalidate>
        <div class="field">
          <label class="field-label" for="name">Full name</label>
          <input class="field-input" type="text" id="name" name="name" data-field="name" autocomplete="name" placeholder="Ada Lovelace" value="Ada Lovelace">
          <p class="field-error" id="error-name" data-error="name-required" hidden></p>
        </div>
        <div class="field">
          <label class="field-label" for="email">Email</label>
          <input class="field-input" type="email" id="email" name="email" data-field="email" autocomplete="email" placeholder="ada@northwind.io" value="ada@northwind.io">
          <p class="field-error" id="error-email" data-error="email-invalid" hidden></p>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" data-action="save-profile">Save changes</button>
        </div>
      </form>
      <div class="status" id="status-profile" role="status" hidden></div>
    </section>

    <section class="panel" id="panel-notifications" data-panel="notifications" hidden>
      <header class="panel-header">
        <h1>Notifications</h1>
        <p class="panel-lede">Choose what we ping you about. Change your mind whenever.</p>
      </header>
      <div class="card">
        <div class="switch-row">
          <button type="button" class="switch" role="switch" aria-checked="true" data-switch="product-updates" id="switch-product-updates">
            <span class="switch-track"><span class="switch-thumb"></span></span>
            <span class="switch-text"><span class="switch-name">Product updates</span><span class="switch-hint">New features and release notes</span></span>
          </button>
        </div>
        <div class="switch-row">
          <button type="button" class="switch" role="switch" aria-checked="true" data-switch="comments" id="switch-comments">
            <span class="switch-track"><span class="switch-thumb"></span></span>
            <span class="switch-text"><span class="switch-name">Comments</span><span class="switch-hint">Replies to your comments</span></span>
          </button>
        </div>
        <div class="switch-row">
          <button type="button" class="switch" role="switch" aria-checked="false" data-switch="mentions" id="switch-mentions">
            <span class="switch-track"><span class="switch-thumb"></span></span>
            <span class="switch-text"><span class="switch-name">Mentions</span><span class="switch-hint">When someone mentions you</span></span>
          </button>
        </div>
        <div class="switch-row">
          <button type="button" class="switch" role="switch" aria-checked="true" data-switch="weekly-digest" id="switch-weekly-digest">
            <span class="switch-track"><span class="switch-thumb"></span></span>
            <span class="switch-text"><span class="switch-name">Weekly digest</span><span class="switch-hint">A calm Sunday summary of Northwind</span></span>
          </button>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-primary" data-action="save-notifications" id="save-notifications">Save preferences</button>
      </div>
      <div class="status" id="status-notifications" role="status" hidden></div>
    </section>

    <section class="panel" id="panel-team" data-panel="team" hidden>
      <header class="panel-header">
        <h1>Team</h1>
        <p class="panel-lede">People who have access to Northwind.</p>
      </header>
      <ul class="member-list">
        <li class="member" data-member="member-1">
          <span class="member-avatar" aria-hidden="true">MC</span>
          <div class="member-main">
            <p class="member-name">Maya Chen</p>
            <p class="member-email">maya@northwind.io</p>
          </div>
          <div class="member-side">
            <p class="member-role">Product Designer</p>
            <button type="button" class="btn btn-small btn-ghost" data-action="remove-member">Remove</button>
          </div>
        </li>
        <li class="member" data-member="member-2">
          <span class="member-avatar" aria-hidden="true">JW</span>
          <div class="member-main">
            <p class="member-name">Jonas Weber</p>
            <p class="member-email">jonas@northwind.io</p>
          </div>
          <div class="member-side">
            <p class="member-role">Engineer</p>
            <button type="button" class="btn btn-small btn-ghost" data-action="remove-member">Remove</button>
          </div>
        </li>
        <li class="member" data-member="member-3">
          <span class="member-avatar" aria-hidden="true">PN</span>
          <div class="member-main">
            <p class="member-name">Priya Nair</p>
            <p class="member-email">priya@northwind.io</p>
          </div>
          <div class="member-side">
            <p class="member-role">Product Manager</p>
            <button type="button" class="btn btn-small btn-ghost" data-action="remove-member">Remove</button>
          </div>
        </li>
      </ul>
      <form class="card" id="invite-form" novalidate>
        <h2 class="card-title">Invite teammate</h2>
        <p class="card-sub">They'll get an email with a link to join.</p>
        <div class="field">
          <label class="field-label" for="invite-email">Work email</label>
          <input class="field-input" type="email" id="invite-email" data-field="invite-email" placeholder="name@company.com">
          <p class="field-error" id="error-invite-email" data-error="invite-email-invalid" hidden></p>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" data-action="invite">Send invite</button>
        </div>
      </form>
      <div class="status" id="status-invite" role="status" hidden></div>
    </section>

    <section class="panel" id="panel-projects" data-panel="projects" hidden>
      <header class="panel-header">
        <h1>Projects</h1>
        <p class="panel-lede">Everything the team is building in Northwind.</p>
      </header>
      <div class="card">
        <div class="empty-state" data-empty>
          <h2 class="empty-title">No projects yet</h2>
          <p class="empty-copy">Create your first project to start planning work with your team.</p>
          <form id="create-form" novalidate>
            <div class="field">
              <label class="field-label" for="project-name">Project name</label>
              <input class="field-input" type="text" id="project-name" placeholder="Harbor Redesign">
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" data-action="create-project">Create project</button>
            </div>
          </form>
        </div>
        <div class="project-list" id="project-list" hidden>
          <div class="project" data-project="project-1">
            <div>
              <h3 class="project-name">Harbor Redesign</h3>
              <p class="project-meta">Planning · 3 members</p>
            </div>
            <span class="project-status">Planning</span>
          </div>
        </div>
      </div>
      <div class="status" id="status-project" role="status" hidden></div>
    </section>

    <section class="panel" id="panel-billing" data-panel="billing" hidden>
      <header class="panel-header">
        <h1>Billing</h1>
        <p class="panel-lede">Your plan and payment details.</p>
      </header>
      <div class="card plan-card">
        <p class="plan-label">Current plan</p>
        <p class="plan-name">Team</p>
        <p class="plan-price">$24.00 / month</p>
        <p class="plan-note">Unlimited projects, priority support, and a dedicated success manager.</p>
      </div>
      <form class="card" id="payment-form" novalidate>
        <h2 class="card-title">Payment details</h2>
        <p class="card-sub">Charged monthly. Cancel anytime.</p>
        <div class="field">
          <label class="field-label" for="card-number">Card number</label>
          <input class="field-input" type="text" inputmode="numeric" id="card-number" data-field="card-number" placeholder="4242 4242 4242 4242" autocomplete="cc-number">
          <p class="field-error" id="error-card-number" data-error="card-number-invalid" hidden></p>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="card-expiry">Expiry</label>
            <input class="field-input" type="text" id="card-expiry" data-field="card-expiry" placeholder="MM/YY" autocomplete="cc-exp">
          </div>
          <div class="field">
            <label class="field-label" for="card-cvc">Security code</label>
            <input class="field-input" type="text" inputmode="numeric" id="card-cvc" data-field="card-cvc" placeholder="CVC" autocomplete="cc-csc">
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" data-action="pay" id="pay">Pay $24.00</button>
        </div>
      </form>
      <div class="field-error payment-error" id="error-payment" data-error="card-declined" hidden></div>
      <div class="status" id="status-payment" role="status" hidden></div>
    </section>

    <section class="panel" id="panel-danger" data-panel="danger" hidden>
      <header class="panel-header">
        <h1>Danger zone</h1>
        <p class="panel-lede">Irreversible actions live here. Tread carefully.</p>
      </header>
      <div class="card danger-card">
        <h2 class="card-title">Delete this workspace</h2>
        <p class="card-sub">Deleting Northwind removes every project, member and setting. There is no undo.</p>
        <button type="button" class="btn btn-danger" data-action="delete-workspace" id="delete-workspace">Delete workspace</button>
      </div>
    </section>
  </main>
</div>

<div class="dialog-layer">
  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" id="confirm-dialog" tabindex="-1" hidden>
    <button type="button" class="dialog-close" data-dialog-close aria-label="Close dialog">&times;</button>
    <h2 class="dialog-title" id="dialog-title">Confirm action</h2>
    <p class="dialog-message" id="dialog-message"></p>
    <div class="dialog-actions">
      <button type="button" class="btn btn-ghost" data-dialog-close>Cancel</button>
      <button type="button" class="btn btn-danger" id="dialog-confirm">Confirm</button>
    </div>
  </div>
</div>

<script>
(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var DECLINED = '4000000000000002';

  var state = {
    profile: { name: 'Ada Lovelace', email: 'ada@northwind.io' },
    switches: {
      'product-updates': true,
      'comments': true,
      'mentions': false,
      'weekly-digest': true
    },
    members: [
      { id: 'member-1', name: 'Maya Chen', email: 'maya@northwind.io', role: 'Product Designer' },
      { id: 'member-2', name: 'Jonas Weber', email: 'jonas@northwind.io', role: 'Engineer' },
      { id: 'member-3', name: 'Priya Nair', email: 'priya@northwind.io', role: 'Product Manager' }
    ],
    projects: []
  };

  function $(id) { return document.getElementById(id); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  var panelIds = ['profile', 'notifications', 'team', 'projects', 'billing', 'danger'];
  var panels = {};
  panelIds.forEach(function (id) { panels[id] = document.getElementById('panel-' + id); });

  function showPanel(id) {
    panelIds.forEach(function (pid) {
      var el = panels[pid];
      if (pid === id) { el.removeAttribute('hidden'); } else { el.setAttribute('hidden', 'hidden'); }
    });
    $$('[data-nav]').forEach(function (btn) {
      if (btn.getAttribute('data-nav') === id) { btn.setAttribute('aria-current', 'page'); }
      else { btn.removeAttribute('aria-current'); }
    });
  }

  document.querySelectorAll('[data-nav]').forEach(function (btn) {
    btn.addEventListener('click', function () { showPanel(btn.getAttribute('data-nav')); });
  });

  // Switches
  $$('[data-switch]').forEach(function (sw) {
    sw.addEventListener('click', function () {
      var next = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', next ? 'true' : 'false');
      state.switches[sw.getAttribute('data-switch')] = next;
    });
  });

  // Helpers for messages
  function showError(el, msg) { el.hidden = false; el.textContent = msg; }
  function hideError(el) { el.hidden = true; el.textContent = ''; }
  function showStatus(el, msg) { el.hidden = false; el.textContent = msg; }
  function hideStatus(el) { el.hidden = true; el.textContent = ''; }

  // Profile
  $('#profile-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var nameEl = $('#name');
    var emailEl = $('#email');
    var errName = $('#error-name');
    var errEmail = $('#error-email');
    var status = $('#status-profile');
    hideError(errName); hideError(errEmail); hideStatus(status);
    var name = nameEl.value.trim();
    var email = emailEl.value.trim();
    if (!name) {
      showError(errName, 'Your name is required. Add your full name to save your profile.');
      errName.focus();
      return;
    }
    if (email && !EMAIL_RE.test(email)) {
      showError(errEmail, 'That email does not look right. Add an address like ada@northwind.io.');
      errEmail.focus();
      return;
    }
    state.profile = { name: name, email: email };
    try { localStorage.setItem('harbor:profile', JSON.stringify(state.profile)); } catch (err) {}
    showStatus(status, 'Profile saved. Your changes are live.');
  });

  // Notifications save
  $('#save-notifications').addEventListener('click', function () {
    var status = $('#status-notifications');
    hideStatus(status);
    try { localStorage.setItem('harbor:prefs', JSON.stringify(state.switches)); } catch (err) {}
    showStatus(status, 'Notification preferences saved. We will keep you posted.');
  });

  // Members
  function initials(name) {
    var parts = name.trim().split(/\s+/);
    var a = parts[0] ? parts[0].charAt(0).toUpperCase() : '';
    var b = parts.length > 1 ? parts[1].charAt(0).toUpperCase() : '';
    return (a + b) || '?';
  }

  function renderMembers() {
    var list = document.querySelector('.member-list');
    list.innerHTML = '';
    state.members.forEach(function (m) {
      var li = document.createElement('li');
      li.className = 'member';
      li.setAttribute('data-member', m.id);
      li.innerHTML =
        '<span class="member-avatar" aria-hidden="true">' + initials(m.name) + '</span>' +
        '<div class="member-main"><p class="member-name">' + m.name + '</p><p class="member-email">' + m.email + '</p></div>' +
        '<div class="member-side"><p class="member-role">' + m.role + '</p><button type="button" class="btn btn-small btn-ghost" data-action="remove-member">Remove</button></div>';
      list.appendChild(li);
    });
  }

  // Invite
  $('#invite-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('#invite-email');
    var err = $('#error-invite-email');
    var status = $('#status-invite');
    hideError(err); hideStatus(status);
    var email = input.value.trim();
    if (!EMAIL_RE.test(email)) {
      showError(err, 'That email does not look right. Add a valid address like name@company.com.');
      input.focus();
      return;
    }
    var name = email.split('@')[0].split(/[._-]/).map(function (p) { return p.charAt(0).toUpperCase() + p.slice(1); }).join(' ');
    state.members.push({ id: 'member-' + Date.now(), name: name, email: email, role: 'Contributor' });
    renderMembers();
    input.value = '';
    showStatus(status, 'Invite sent to ' + email + '. They will get an email to join.');
  });

  // Projects
  var emptyState = document.querySelector('[data-empty]');
  var projectList = $('#project-list');
  var statusProject = $('#status-project');

  function renderProjects() {
    projectList.innerHTML = '';
    state.projects.forEach(function (p) {
      var div = document.createElement('div');
      div.className = 'project';
      div.setAttribute('data-project', p.id);
      div.innerHTML = '<div><h3 class="project-name">' + p.name + '</h3><p class="project-meta">Planning · ' + state.members.length + ' members</p></div><span class="project-status">' + p.status + '</span>';
      projectList.appendChild(div);
    });
  }

  $('#create-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('#project-name');
    var name = input.value.trim() || 'Untitled project';
    state.projects.push({ id: 'project-' + Date.now(), name: name, status: 'Planning' });
    if (emptyState) { emptyState.hidden = true; }
    projectList.hidden = false;
    renderProjects();
    showStatus(statusProject, 'Project created: ' + name + '.');
  });

  // Billing / payment
  $('#payment-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var cardEl = $('#card-number');
    var errNum = $('#error-card-number');
    var errPay = $('#error-payment');
    var status = $('#status-payment');
    hideError(errNum); hideError(errPay); hideStatus(status);
    var card = cardEl.value.replace(/\D/g, '');
    if (card.length !== 16) {
      showError(errNum, 'Enter a valid card number to continue.');
      cardEl.focus();
      return;
    }
    if (card === DECLINED) {
      showError(errPay, 'Payment declined. Your card was declined by your bank. Try a different card or contact your bank.');
      errPay.focus();
      return;
    }
    showStatus(status, 'Payment successful. Your Team plan was charged.');
  });

  // Dialog
  var dialog = $('#confirm-dialog');
  var dialogTitle = $('#dialog-title');
  var dialogMessage = $('#dialog-message');
  var dialogConfirm = $('#dialog-confirm');
  var dialogContext = null;
  var lastFocused = null;

  function openDialog(opts) {
    dialogContext = opts;
    dialogTitle.textContent = opts.title;
    dialogMessage.textContent = opts.message;
    dialogConfirm.textContent = opts.confirmLabel;
    dialog.hidden = false;
    lastFocused = document.activeElement;
    dialog.focus();
  }

  function closeDialog() {
    dialog.hidden = true;
    dialogContext = null;
    if (lastFocused && typeof lastFocused.focus === 'function') { lastFocused.focus(); }
  }

  function openRemoveDialog(id) {
    var member = null;
    state.members.forEach(function (m) { if (m.id === id) { member = m; } });
    if (!member) { return; }
    lastFocused = document.activeElement;
    dialogTitle.textContent = 'Remove ' + member.name + '?';
    dialogMessage.textContent = member.name + ' will no longer have access to the Northwind workspace. This cannot be undone.';
    dialogConfirm.textContent = 'Remove ' + member.name;
    dialogContext = { type: 'remove', memberId: id };
    dialog.hidden = false;
    dialog.focus();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && dialog && !dialog.hidden) { closeDialog(); }
  });

  dialog.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      var focusables = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      var list = Array.prototype.slice.call(focusables).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
      if (list.length === 0) { e.preventDefault(); return; }
      var first = list[0];
      var last = list[list.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !dialog.contains(document.activeElement)) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last || !dialog.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    }
  });

  dialogConfirm.addEventListener('click', function () {
    if (dialogContext && dialogContext.type === 'remove') {
      var id = dialogContext.memberId;
      var idx = -1;
      for (var i = 0; i < state.members.length; i++) { if (state.members[i].id === id) { idx = i; break; } }
      if (idx > -1) { state.members.splice(idx, 1); }
      var el = document.querySelector('[data-member="' + id + '"]');
      if (el && el.parentNode) { el.parentNode.removeChild(el); }
      closeDialog();
    } else if (dialogContext && dialogContext.type === 'delete') {
      try { localStorage.removeItem('harbor:workspace'); } catch (err) {}
      closeDialog();
    }
  });

  // Global click handling for actions + dialog close
  document.addEventListener('click', function (e) {
    var target = e.target;
    var btn = null;
    if (target && typeof target.closest === 'function') { btn = target.closest('[data-action]'); }
    if (btn) {
      var action = btn.getAttribute('data-action');
      if (action === 'save-notifications') {
        var status = $('#status-notifications');
        hideStatus(status);
        try { localStorage.setItem('harbor:prefs', JSON.stringify(state.switches)); } catch (err) {}
        showStatus(status, 'Notification preferences saved. We will keep you posted.');
      } else if (action === 'remove-member') {
        var memberEl = btn.closest('[data-member]');
        if (memberEl) { openRemoveDialog(memberEl.getAttribute('data-member')); }
      } else if (action === 'delete-workspace') {
        openDialog({
          type: 'delete',
          title: 'Delete Northwind?',
          message: "Deleting the Northwind workspace removes every project and member. This can't be undone.",
          confirmLabel: 'Delete workspace'
        });
      }
      return;
    }
    var closeBtn = null;
    if (target && typeof target.closest === 'function') { closeBtn = target.closest('[data-dialog-close]'); }
    if (closeBtn) { closeDialog(); }
  });

  // Init
  showPanel('profile');
})();
</script>
</body>
</html>
```