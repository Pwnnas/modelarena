Here's your Harbor settings app, a single self-contained HTML file with inline CSS and JavaScript, styled in the Ocean Depths theme and built to follow your three skills.
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Harbor · Profile — Northwind</title>
<meta name="description" content="Harbor settings for the Northwind workspace." />
<style>
  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --navy: #1a2332;
    --navy-2: #121a26;
    --teal: #2d8b8b;
    --teal-deep: #1f6f6f;
    --teal-ink: #1a6b6b;
    --seafoam: #a8dadc;
    --cream: #f1faee;
    --muted: #47586b;
    --line: #5a6b7a;
    --danger: #b3261e;
    --danger-deep: #8c1d17;
    --success: #1d6b4f;
    --card-line: #cfdcd5;
    --font: "DejaVu Sans", "Bitstream Vera Sans", Verdana, Geneva, Tahoma, sans-serif;
  }

  html { -webkit-text-size-adjust: 100%; }

  body {
    margin: 0;
    min-height: 100vh;
    font-family: var(--font);
    font-size: 16px;
    line-height: 1.55;
    color: var(--cream);
    background-color: var(--navy);
    background-image:
      radial-gradient(1100px 720px at 10% -14%, #27374f 0%, rgba(39, 55, 79, 0) 62%),
      radial-gradient(900px 620px at 112% 112%, #1d3a44 0%, rgba(29, 58, 68, 0) 60%);
    background-attachment: fixed;
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3, h4, p, ul, li { margin: 0; }
  ul { padding: 0; }

  [hidden] { display: none !important; }

  a:focus-visible,
  button:focus-visible,
  input:focus-visible,
  [tabindex]:focus-visible {
    outline: 3px solid var(--teal-ink);
    outline-offset: 2px;
    border-radius: 8px;
  }
  .sidebar a:focus-visible,
  .sidebar button:focus-visible,
  .backdrop button:focus-visible,
  .backdrop [tabindex]:focus-visible {
    outline-color: var(--seafoam);
  }

  .skip-link {
    position: absolute;
    left: 16px;
    top: -80px;
    z-index: 120;
    padding: 12px 18px;
    border-radius: 10px;
    background: var(--seafoam);
    color: var(--navy);
    font-weight: 700;
    text-decoration: none;
    transition: top .15s ease;
  }
  .skip-link:focus { top: 16px; }

  /* ---------- Layout ---------- */

  .app { display: flex; min-height: 100vh; align-items: stretch; }

  .sidebar {
    flex: 0 0 268px;
    width: 268px;
    padding: 26px 18px 22px;
    display: flex;
    flex-direction: column;
    gap: 26px;
    border-right: 1px solid rgba(168, 218, 220, .16);
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }

  .brand { display: flex; align-items: center; gap: 12px; padding: 0 6px; }

  .brand-mark {
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    border-radius: 13px;
    display: grid;
    place-items: center;
    background: linear-gradient(150deg, #2d8b8b 0%, #1f6f6f 100%);
    color: var(--cream);
  }

  .brand-name { font-size: 17px; font-weight: 700; letter-spacing: .01em; color: var(--cream); }
  .brand-workspace { font-size: 13px; color: rgba(241, 250, 238, .78); }

  .nav-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }

  .nav-item {
    width: 100%;
    min-height: 46px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 12px;
    border: 1.5px solid transparent;
    border-radius: 10px;
    background: transparent;
    color: rgba(241, 250, 238, .88);
    font: inherit;
    font-size: 15px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    transition: background .15s ease, color .15s ease;
  }
  .nav-item:hover { background: rgba(168, 218, 220, .14); color: var(--cream); }
  .nav-item.is-active {
    background: var(--seafoam);
    color: var(--navy);
    font-weight: 700;
  }
  .nav-item.is-active:hover { background: var(--seafoam); }
  .nav-icon { width: 20px; height: 20px; flex: 0 0 auto; }

  .sidebar-foot {
    margin-top: auto;
    padding: 16px 12px 4px;
    border-top: 1px solid rgba(168, 218, 220, .16);
    font-size: 13px;
    color: rgba(241, 250, 238, .8);
  }
  .sidebar-foot strong { color: var(--cream); font-weight: 700; overflow-wrap: anywhere; }
  .sidebar-plan { margin-top: 4px; color: rgba(241, 250, 238, .78); }

  .main {
    flex: 1 1 auto;
    min-width: 0;
    padding: 40px 44px 72px;
    display: flex;
    justify-content: center;
  }

  .panel {
    width: 100%;
    max-width: 780px;
    align-self: flex-start;
    background: var(--cream);
    color: var(--navy);
    border-radius: 18px;
    padding: 34px 36px 36px;
    box-shadow: 0 24px 60px rgba(6, 12, 20, .42);
  }

  .panel-head { margin-bottom: 22px; }

  .panel-eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .11em;
    text-transform: uppercase;
    color: var(--teal-ink);
    margin-bottom: 8px;
  }

  .panel h2 {
    font-size: 26px;
    line-height: 1.25;
    font-weight: 700;
    letter-spacing: -.01em;
    color: var(--navy);
  }
  .panel h2:focus { outline: none; }

  .panel-lede { margin-top: 8px; color: var(--muted); font-size: 15px; max-width: 58ch; }

  .subsection-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--navy);
    letter-spacing: .01em;
  }

  /* ---------- Messages ---------- */

  .messages { margin-bottom: 20px; }
  .messages:empty { display: none; }

  .msg {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 11px;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.45;
    border: 1.5px solid transparent;
  }
  .msg-icon { flex: 0 0 auto; margin-top: 1px; }
  .msg-text { font-weight: 600; }

  .msg--error {
    background: #fbeae8;
    border-color: var(--danger);
    color: #8c1d17;
  }
  .msg--success {
    background: #e7f4ec;
    border-color: var(--success);
    color: #14523c;
  }

  /* ---------- Forms ---------- */

  .form { display: flex; flex-direction: column; gap: 20px; }

  .field { display: flex; flex-direction: column; gap: 6px; }

  .field label { font-size: 14px; font-weight: 700; color: var(--navy); }

  .field input {
    width: 100%;
    min-height: 46px;
    padding: 11px 13px;
    font: inherit;
    font-size: 15px;
    color: var(--navy);
    background: #ffffff;
    border: 1.5px solid var(--line);
    border-radius: 10px;
  }
  .field input:hover { border-color: var(--navy); }
  .field input::placeholder { color: #5a6b7a; opacity: 1; }
  .field input[aria-invalid="true"] { border-color: var(--danger); border-width: 2px; }

  .hint { font-size: 13px; color: var(--muted); }

  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  .form-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }

  /* ---------- Buttons ---------- */

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    padding: 0 20px;
    border: 2px solid transparent;
    border-radius: 10px;
    font: inherit;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    text-align: center;
    transition: background .15s ease, color .15s ease, border-color .15s ease;
  }

  .btn--primary { background: var(--teal-deep); color: var(--cream); }
  .btn--primary:hover { background: #175a5a; }

  .btn--secondary { background: transparent; color: var(--teal-ink); border-color: var(--teal-ink); }
  .btn--secondary:hover { background: #dff0ef; }

  .btn--danger { background: var(--danger); color: #ffffff; }
  .btn--danger:hover { background: var(--danger-deep); }

  .btn--ghost { background: transparent; color: var(--cream); border-color: rgba(241, 250, 238, .6); }
  .btn--ghost:hover { background: rgba(168, 218, 220, .16); border-color: var(--cream); }

  .btn--quiet-danger {
    background: transparent;
    color: var(--danger);
    border-color: transparent;
    padding: 0 14px;
    min-height: 44px;
  }
  .btn--quiet-danger:hover { background: #fbeae8; border-color: var(--danger); }

  /* ---------- Switches ---------- */

  .switch-list { display: flex; flex-direction: column; margin-bottom: 24px; }

  .switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 15px 0;
    border-bottom: 1px solid rgba(26, 35, 50, .16);
  }
  .switch-row:last-child { border-bottom: none; }

  .switch-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .switch-label { font-size: 15px; font-weight: 700; color: var(--navy); }
  .switch-desc { font-size: 14px; color: var(--muted); }

  .switch {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    min-width: 44px;
    padding: 6px 4px;
    background: transparent;
    border: none;
    border-radius: 10px;
    font: inherit;
    cursor: pointer;
    flex: 0 0 auto;
  }

  .switch-state { font-size: 13px; font-weight: 700; color: var(--muted); min-width: 26px; text-align: right; }
  .switch[aria-checked="true"] .switch-state { color: var(--teal-ink); }

  .switch-track {
    position: relative;
    display: block;
    width: 52px;
    height: 30px;
    border-radius: 999px;
    background: #8a99a4;
    border: 2px solid var(--line);
    transition: background .18s ease, border-color .18s ease;
  }

  .switch-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(6, 12, 20, .35);
    transition: transform .18s ease;
  }

  .switch[aria-checked="true"] .switch-track { background: var(--teal-deep); border-color: var(--teal-deep); }
  .switch[aria-checked="true"] .switch-knob { transform: translateX(22px); }

  /* ---------- Team ---------- */

  .member-list { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 26px; }

  .member {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 13px 14px 13px 16px;
    background: #ffffff;
    border: 1px solid var(--card-line);
    border-radius: 12px;
  }

  .avatar {
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--seafoam);
    color: var(--navy);
    font-size: 14px;
    font-weight: 700;
  }

  .member-body { flex: 1 1 auto; min-width: 0; }
  .member-name { font-size: 15px; font-weight: 700; color: var(--navy); }
  .member-email { font-size: 13px; color: var(--muted); overflow-wrap: anywhere; }

  .role-badge {
    flex: 0 0 auto;
    padding: 4px 10px;
    border-radius: 999px;
    background: #dff0ef;
    color: var(--teal-ink);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
  }

  .member--empty {
    display: block;
    color: var(--muted);
    font-size: 14px;
    background: #f8fdf6;
    border-style: dashed;
  }

  .invite { border-top: 1px solid rgba(26, 35, 50, .16); padding-top: 24px; }

  /* ---------- Projects ---------- */

  .empty {
    text-align: center;
    padding: 40px 26px 34px;
    border: 2px dashed #b8c8c2;
    border-radius: 14px;
    background: #f8fdf6;
  }

  .empty-icon {
    width: 58px;
    height: 58px;
    margin: 0 auto 16px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    background: #dff0ef;
    color: var(--teal-ink);
  }

  .empty-title { font-size: 18px; font-weight: 700; color: var(--navy); margin-bottom: 8px; }

  .empty-text {
    max-width: 46ch;
    margin: 0 auto 22px;
    color: var(--muted);
    font-size: 15px;
  }

  .list-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
  }

  .project-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }

  .project {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: #ffffff;
    border: 1px solid var(--card-line);
    border-radius: 12px;
  }

  .project-mark {
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: var(--navy);
    color: var(--seafoam);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: .04em;
  }

  .project-body { flex: 1 1 auto; min-width: 0; }
  .project-name { font-size: 15px; font-weight: 700; color: var(--navy); }
  .project-meta { font-size: 13px; color: var(--muted); }

  .badge {
    flex: 0 0 auto;
    padding: 4px 10px;
    border-radius: 999px;
    background: #e7f4ec;
    color: #14523c;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
  }

  /* ---------- Billing ---------- */

  .plan-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 18px 20px;
    margin-bottom: 26px;
    background: #ffffff;
    border: 1px solid var(--card-line);
    border-radius: 14px;
  }

  .plan-name { font-size: 16px; font-weight: 700; color: var(--navy); }
  .plan-price { font-size: 14px; color: var(--muted); margin-top: 2px; }
  .plan-meta { font-size: 14px; color: var(--muted); margin-top: 8px; }

  .plan-badge {
    flex: 0 0 auto;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--seafoam);
    color: var(--navy);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
  }

  /* ---------- Danger ---------- */

  .danger-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    padding: 20px 22px;
    border: 2px solid var(--danger);
    border-radius: 14px;
    background: #fdf4f3;
  }

  .danger-card h3 { font-size: 16px; font-weight: 700; color: var(--navy); margin-bottom: 4px; }
  .danger-card p { font-size: 14px; color: var(--muted); max-width: 48ch; }

  /* ---------- Modal ---------- */

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(9, 14, 22, .76);
  }

  .modal {
    width: 100%;
    max-width: 480px;
    padding: 28px 28px 24px;
    border-radius: 16px;
    background: var(--navy);
    color: var(--cream);
    border: 1px solid rgba(168, 218, 220, .3);
    box-shadow: 0 30px 80px rgba(0, 0, 0, .6);
  }
  .modal:focus { outline: none; }

  .modal-title { font-size: 21px; font-weight: 700; color: var(--cream); margin-bottom: 10px; }
  .modal-desc { font-size: 15px; color: rgba(241, 250, 238, .88); margin-bottom: 24px; }

  .modal-actions { display: flex; flex-direction: row-reverse; justify-content: flex-start; gap: 12px; flex-wrap: wrap; }

  /* ---------- Responsive ---------- */

  @media (max-width: 900px) {
    .app { flex-direction: column; }
    .sidebar {
      position: static;
      width: 100%;
      flex: none;
      height: auto;
      border-right: none;
      border-bottom: 1px solid rgba(168, 218, 220, .16);
    }
    .nav-list { flex-direction: row; flex-wrap: wrap; }
    .nav-item { width: auto; }
    .main { padding: 24px 16px 56px; }
    .panel { padding: 26px 20px 28px; }
    .field-row { grid-template-columns: 1fr; }
  }

  @media (prefers-reduced-motion: reduce) {
    * { transition-duration: .001ms !important; animation-duration: .001ms !important; }
  }
</style>
</head>
<body>
<a class="skip-link" href="#main">Skip to settings</a>

<div class="app">
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" focusable="false" aria-hidden="true">
          <path d="M12 3.2 17.6 14H6.4L12 3.2Z" fill="currentColor"/>
          <path d="M4 17.4h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </span>
      <div>
        <p class="brand-name">Harbor</p>
        <p class="brand-workspace">Northwind workspace</p>
      </div>
    </div>

    <nav aria-label="Settings">
      <ul class="nav-list">
        <li>
          <button type="button" class="nav-item is-active" data-nav="profile" aria-current="page">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
              <circle cx="10" cy="7" r="3.2" stroke="currentColor" stroke-width="1.7"/>
              <path d="M4 16.4c0-2.6 2.7-4.3 6-4.3s6 1.7 6 4.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            </svg>
            Profile
          </button>
        </li>
        <li>
          <button type="button" class="nav-item" data-nav="notifications">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
              <path d="M6 8.6a4 4 0 0 1 8 0c0 2.9.8 4.1 1.5 4.9H4.5c.7-.8 1.5-2 1.5-4.9Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
              <path d="M8.3 16.1a1.9 1.9 0 0 0 3.4 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            </svg>
            Notifications
          </button>
        </li>
        <li>
          <button type="button" class="nav-item" data-nav="team">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
              <circle cx="7.6" cy="7.4" r="2.7" stroke="currentColor" stroke-width="1.7"/>
              <path d="M2.8 16c0-2.3 2.1-3.7 4.8-3.7s4.8 1.4 4.8 3.7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <path d="M13.2 5.3a2.7 2.7 0 0 1 0 5.1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <path d="M14.1 12.6c1.9.3 3.1 1.6 3.1 3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            </svg>
            Team
          </button>
        </li>
        <li>
          <button type="button" class="nav-item" data-nav="projects">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
              <path d="M3 6.4A1.4 1.4 0 0 1 4.4 5h3.1l1.6 2h6.5A1.4 1.4 0 0 1 17 8.4v6.2a1.4 1.4 0 0 1-1.4 1.4H4.4A1.4 1.4 0 0 1 3 14.6V6.4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
            </svg>
            Projects
          </button>
        </li>
        <li>
          <button type="button" class="nav-item" data-nav="billing">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
              <rect x="2.6" y="5" width="14.8" height="10" rx="2" stroke="currentColor" stroke-width="1.7"/>
              <path d="M2.6 8.6h14.8" stroke="currentColor" stroke-width="1.7"/>
            </svg>
            Billing
          </button>
        </li>
        <li>
          <button type="button" class="nav-item" data-nav="danger">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
              <path d="M10 3.1 17.5 16.2H2.5L10 3.1Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
              <path d="M10 8v3.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <circle cx="10" cy="13.9" r=".95" fill="currentColor"/>
            </svg>
            Danger zone
          </button>
        </li>
      </ul>
    </nav>

    <div class="sidebar-foot">
      <p>Signed in as <strong id="sidebar-email">ada@northwind.co</strong></p>
      <p class="sidebar-plan">Team plan · 6 members</p>
    </div>
  </aside>

  <main class="main" id="main" tabindex="-1">

    <!-- ============ PROFILE ============ -->
    <section class="panel" data-panel="profile" id="profile" aria-labelledby="profile-heading">
      <div class="panel-head">
        <p class="panel-eyebrow">Account</p>
        <h2 id="profile-heading" tabindex="-1">Profile</h2>
        <p class="panel-lede">Your name and email appear on your Northwind profile, where teammates find you.</p>
      </div>

      <div class="messages" data-messages></div>

      <form class="form" id="profile-form" novalidate>
        <div class="field">
          <label for="profile-name">Full name</label>
          <input type="text" id="profile-name" data-field="name" name="name" autocomplete="name" value="Ada Whitfield" required />
        </div>
        <div class="field">
          <label for="profile-email">Email address</label>
          <input type="email" id="profile-email" data-field="email" name="email" autocomplete="email" value="ada@northwind.co" aria-describedby="profile-email-hint" />
          <p class="hint" id="profile-email-hint">We use this for sign-in and for notifications about Northwind.</p>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary" data-action="save-profile">Save profile</button>
        </div>
      </form>
    </section>

    <!-- ============ NOTIFICATIONS ============ -->
    <section class="panel" data-panel="notifications" id="notifications" aria-labelledby="notifications-heading" hidden>
      <div class="panel-head">
        <p class="panel-eyebrow">Account</p>
        <h2 id="notifications-heading" tabindex="-1">Notifications</h2>
        <p class="panel-lede">Choose what Harbor emails you about. You can change these any time.</p>
      </div>

      <div class="messages" data-messages></div>

      <div class="switch-list">
        <div class="switch-row">
          <div class="switch-copy">
            <span class="switch-label" id="sw-label-product-updates">Product updates</span>
            <span class="switch-desc" id="sw-desc-product-updates">News about new Harbor features, about once a month.</span>
          </div>
          <button type="button" class="switch" role="switch" aria-checked="true" data-switch="product-updates"
                  aria-labelledby="sw-label-product-updates" aria-describedby="sw-desc-product-updates">
            <span class="switch-state" aria-hidden="true">On</span>
            <span class="switch-track" aria-hidden="true"><span class="switch-knob"></span></span>
          </button>
        </div>

        <div class="switch-row">
          <div class="switch-copy">
            <span class="switch-label" id="sw-label-comments">Comments</span>
            <span class="switch-desc" id="sw-desc-comments">When someone replies to a comment you're part of.</span>
          </div>
          <button type="button" class="switch" role="switch" aria-checked="true" data-switch="comments"
                  aria-labelledby="sw-label-comments" aria-describedby="sw-desc-comments">
            <span class="switch-state" aria-hidden="true">On</span>
            <span class="switch-track" aria-hidden="true"><span class="switch-knob"></span></span>
          </button>
        </div>

        <div class="switch-row">
          <div class="switch-copy">
            <span class="switch-label" id="sw-label-mentions">Mentions</span>
            <span class="switch-desc" id="sw-desc-mentions">When a teammate @mentions you in a project or thread.</span>
          </div>
          <button type="button" class="switch" role="switch" aria-checked="true" data-switch="mentions"
                  aria-labelledby="sw-label-mentions" aria-describedby="sw-desc-mentions">
            <span class="switch-state" aria-hidden="true">On</span>
            <span class="switch-track" aria-hidden="true"><span class="switch-knob"></span></span>
          </button>
        </div>

        <div class="switch-row">
          <div class="switch-copy">
            <span class="switch-label" id="sw-label-weekly-digest">Weekly digest</span>
            <span class="switch-desc" id="sw-desc-weekly-digest">A Monday summary of what changed in Northwind.</span>
          </div>
          <button type="button" class="switch" role="switch" aria-checked="false" data-switch="weekly-digest"
                  aria-labelledby="sw-label-weekly-digest" aria-describedby="sw-desc-weekly-digest">
            <span class="switch-state" aria-hidden="true">Off</span>
            <span class="switch-track" aria-hidden="true"><span class="switch-knob"></span></span>
          </button>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn--primary" data-action="save-notifications">Save notification settings</button>
      </div>
    </section>

    <!-- ============ TEAM ============ -->
    <section class="panel" data-panel="team" id="team" aria-labelledby="team-heading" hidden>
      <div class="panel-head">
        <p class="panel-eyebrow">Workspace</p>
        <h2 id="team-heading" tabindex="-1">Team</h2>
        <p class="panel-lede">Everyone with access to Northwind. Removing a member ends their access right away.</p>
      </div>

      <div class="messages" data-messages></div>

      <ul class="member-list" id="member-list"></ul>

      <form class="form invite" id="invite-form" novalidate>
        <h3 class="subsection-title">Invite a teammate</h3>
        <div class="field">
          <label for="invite-email">Email address</label>
          <input type="email" id="invite-email" data-field="invite-email" name="invite-email" autocomplete="email"
                 placeholder="teammate@northwind.co" aria-describedby="invite-email-hint" />
          <p class="hint" id="invite-email-hint">They join Northwind as a member. You can change their role after they accept.</p>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary" data-action="invite">Send invite</button>
        </div>
      </form>
    </section>

    <!-- ============ PROJECTS ============ -->
    <section class="panel" data-panel="projects" id="projects" aria-labelledby="projects-heading" hidden>
      <div class="panel-head">
        <p class="panel-eyebrow">Workspace</p>
        <h2 id="projects-heading" tabindex="-1">Projects</h2>
        <p class="panel-lede">Projects keep related briefs, files, and updates together in one place.</p>
      </div>

      <div class="messages" data-messages></div>

      <div id="projects-body"></div>
    </section>

    <!-- ============ BILLING ============ -->
    <section class="panel" data-panel="billing" id="billing" aria-labelledby="billing-heading" hidden>
      <div class="panel-head">
        <p class="panel-eyebrow">Workspace</p>
        <h2 id="billing-heading" tabindex="-1">Billing</h2>
        <p class="panel-lede">Your plan, your next invoice, and the card we charge each month.</p>
      </div>

      <div class="messages" data-messages></div>

      <div class="plan-card">
        <div>
          <p class="plan-name">Team plan</p>
          <p class="plan-price">$12 per member, billed monthly · 6 members</p>
          <p class="plan-meta">Next invoice: $72.00 on 1 March.</p>
        </div>
        <span class="plan-badge">Current plan</span>
      </div>

      <form class="form" id="payment-form" novalidate>
        <h3 class="subsection-title">Payment method</h3>
        <div class="field">
          <label for="card-number">Card number</label>
          <input type="text" id="card-number" data-field="card-number" name="card-number" inputmode="numeric"
                 autocomplete="cc-number" placeholder="1234 5678 9012 3456" aria-describedby="card-number-hint" />
          <p class="hint" id="card-number-hint">Visa, Mastercard, or American Express.</p>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="card-expiry">Expiry date</label>
            <input type="text" id="card-expiry" data-field="card-expiry" name="card-expiry" inputmode="numeric"
                   autocomplete="cc-exp" placeholder="MM / YY" />
          </div>
          <div class="field">
            <label for="card-cvc">Security code</label>
            <input type="text" id="card-cvc" data-field="card-cvc" name="card-cvc" inputmode="numeric"
                   autocomplete="cc-csc" placeholder="123" aria-describedby="card-cvc-hint" />
            <p class="hint" id="card-cvc-hint">3 digits on the back of the card.</p>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary" data-action="pay">Save payment method</button>
        </div>
      </form>
    </section>

    <!-- ============ DANGER ============ -->
    <section class="panel" data-panel="danger" id="danger" aria-labelledby="danger-heading" hidden>
      <div class="panel-head">
        <p class="panel-eyebrow">Workspace</p>
        <h2 id="danger-heading" tabindex="-1">Danger zone</h2>
        <p class="panel-lede">Actions here affect everyone in Northwind. Take a moment before you go further.</p>
      </div>

      <div class="messages" data-messages></div>

      <div class="danger-card">
        <div>
          <h3>Delete Northwind</h3>
          <p>This removes every member, project, and setting in Northwind. You can't undo it.</p>
        </div>
        <button type="button" class="btn btn--danger" data-action="delete-workspace">Delete workspace</button>
      </div>
    </section>

  </main>
</div>

<script>
(function () {
  'use strict';

  /* ---------------------------------------------------------------- utils */

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  var ICON_ERROR = '<svg class="msg-icon" viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true" focusable="false">' +
    '<circle cx="10" cy="10" r="8.4" stroke="currentColor" stroke-width="1.7"/>' +
    '<path d="M10 5.6v5.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
    '<circle cx="10" cy="14" r="1" fill="currentColor"/></svg>';

  var ICON_SUCCESS = '<svg class="msg-icon" viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true" focusable="false">' +
    '<circle cx="10" cy="10" r="8.4" stroke="currentColor" stroke-width="1.7"/>' +
    '<path d="m6.3 10.3 2.5 2.5 5-5.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var ICON_FOLDER = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true" focusable="false">' +
    '<path d="M3.2 7.4A1.8 1.8 0 0 1 5 5.6h3.8l2 2.6h8A1.8 1.8 0 0 1 20.6 10v7.6a1.8 1.8 0 0 1-1.8 1.8H5a1.8 1.8 0 0 1-1.8-1.8V7.4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';

  /* ---------------------------------------------------------------- state */

  var state = {
    profile: { name: 'Ada Whitfield', email: 'ada@northwind.co' },
    notifications: {
      'product-updates': true,
      'comments': true,
      'mentions': true,
      'weekly-digest': false
    },
    members: [
      { id: 'm-ada', name: 'Ada Whitfield', email: 'ada@northwind.co', role: 'Owner' },
      { id: 'm-marcus', name: 'Marcus Lee', email: 'marcus@northwind.co', role: 'Admin' },
      { id: 'm-priya', name: 'Priya Raman', email: 'priya@northwind.co', role: 'Member' }
    ],
    projects: []
  };

  var PANEL_LABELS = {
    profile: 'Profile',
    notifications: 'Notifications',
    team: 'Team',
    projects: 'Projects',
    billing: 'Billing',
    danger: 'Danger zone'
  };

  /* ------------------------------------------------------------- messages */

  function clearMessage(panelName) {
    var host = document.getElementById(panelName);
    if (!host) { return; }
    var slot = $('[data-messages]', host);
    if (slot) { slot.textContent = ''; }
  }

  function setMessage(panelName, type, text) {
    var host = document.getElementById(panelName);
    if (!host) { return null; }
    var slot = $('[data-messages]', host);
    if (!slot) { return null; }

    slot.textContent = '';

    var el = document.createElement('p');
    el.className = 'msg msg--' + type;
    el.id = panelName + '-message';

    if (type === 'error') {
      el.setAttribute('data-error', '');
    } else {
      el.setAttribute('role', 'status');
    }

    el.innerHTML = (type === 'error' ? ICON_ERROR : ICON_SUCCESS) + '<span class="msg-text"></span>';
    $('.msg-text', el).textContent = text;

    slot.appendChild(el);
    return el;
  }

  function markInvalid(input, message) {
    if (!input) { return; }
    input.setAttribute('aria-invalid', 'true');
    if (message) {
      var base = input.getAttribute('data-base-describedby');
      input.setAttribute('aria-describedby', base ? message.id + ' ' + base : message.id);
    }
  }

  function clearInvalid(input) {
    if (!input) { return; }
    input.removeAttribute('aria-invalid');
    var base = input.getAttribute('data-base-describedby');
    if (base) {
      input.setAttribute('aria-describedby', base);
    } else {
      input.removeAttribute('aria-describedby');
    }
  }

  /* remember original aria-describedby so hints are restored later */
  ['profile-name', 'card-number', 'invite-email'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) { return; }
    var current = el.getAttribute('aria-describedby');
    if (current) { el.setAttribute('data-base-describedby', current); }
  });

  /* ------------------------------------------------------------ nav/panels */

  var navButtons = $$('[data-nav]');
  var panelEls = $$('[data-panel]');

  function activatePanel(name, moveFocus) {
    var target = document.getElementById(name);
    if (!target) { return; }

    panelEls.forEach(function (panel) {
      panel.hidden = panel !== target;
    });

    navButtons.forEach(function (button) {
      var isCurrent = button.getAttribute('data-nav') === name;
      button.classList.toggle('is-active', isCurrent);
      if (isCurrent) {
        button.setAttribute('aria-current', 'page');
      } else {
        button.removeAttribute('aria-current');
      }
    });

    document.title = 'Harbor · ' + (PANEL_LABELS[name] || 'Settings') + ' — Northwind';

    if (moveFocus) {
      var heading = target.querySelector('h2');
      if (heading) { heading.focus(); }
    }
  }

  navButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activatePanel(button.getAttribute('data-nav'), true);
    });
  });

  /* --------------------------------------------------------------- modals */

  var activeModal = null;
  var lastFocused = null;

  function closeModal(restoreFocus) {
    if (!activeModal) { return; }
    activeModal.parentNode.removeChild(activeModal);
    activeModal = null;
    if (restoreFocus !== false && lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  function openModal(options) {
    closeModal(false);

    lastFocused = document.activeElement;

    var backdrop = document.createElement('div');
    backdrop.className = 'backdrop';

    var dialog = document.createElement('div');
    dialog.className = 'modal';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'modal-title');
    dialog.setAttribute('aria-describedby', 'modal-desc');
    dialog.setAttribute('tabindex', '-1');

    var title = document.createElement('h2');
    title.className = 'modal-title';
    title.id = 'modal-title';
    title.textContent = options.title;

    var desc = document.createElement('p');
    desc.className = 'modal-desc';
    desc.id = 'modal-desc';
    desc.textContent = options.desc;

    var actions = document.createElement('div');
    actions.className = 'modal-actions';

    var confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.className = options.danger === false ? 'btn btn--primary' : 'btn btn--danger';
    confirm.textContent = options.confirmLabel;
    if (options.confirmAction) { confirm.setAttribute('data-action', options.confirmAction); }
    confirm.addEventListener('click', function () {
      closeModal();
      if (typeof options.onConfirm === 'function') { options.onConfirm(); }
    });

    var cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'btn btn--ghost';
    cancel.textContent = options.cancelLabel;
    cancel.addEventListener('click', function () { closeModal(); });

    actions.appendChild(confirm);
    actions.appendChild(cancel);

    dialog.appendChild(title);
    dialog.appendChild(desc);
    dialog.appendChild(actions);
    backdrop.appendChild(dialog);

    backdrop.addEventListener('mousedown', function (event) {
      if (event.target === backdrop) { closeModal(); }
    });

    document.body.appendChild(backdrop);
    activeModal = backdrop;
    dialog.focus();
  }

  document.addEventListener('keydown', function (event) {
    if (!activeModal) { return; }

    if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key === 'Tab') {
      var dialog = $('.modal', activeModal);
      if (!dialog) { return; }
      var focusables = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', dialog)
        .filter(function (el) { return !el.disabled && el.offsetParent !== null; });

      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      var active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || active === dialog || active === document.body) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || active === dialog || active === document.body) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* -------------------------------------------------------------- profile */

  var profileForm = document.getElementById('profile-form');
  var nameInput = $('[data-field="name"]');
  var emailInput = $('[data-field="email"]');

  profileForm.addEventListener('submit', function (event) {
    event.preventDefault();
    clearMessage('profile');
    clearInvalid(nameInput);

    var name = nameInput.value.trim();

    if (name === '') {
      var message = setMessage('profile', 'error', "Your profile wasn't saved. Add your full name, then try again.");
      markInvalid(nameInput, message);
      nameInput.focus();
      return;
    }

    state.profile.name = name;
    state.profile.email = emailInput.value.trim();

    var sidebarEmail = document.getElementById('sidebar-email');
    if (sidebarEmail && state.profile.email) { sidebarEmail.textContent = state.profile.email; }

    setMessage('profile', 'success', 'Profile saved. Teammates in Northwind will see your new details.');
  });

  /* -------------------------------------------------------- notifications */

  $$('[data-switch]').forEach(function (button) {
    var key = button.getAttribute('data-switch');
    var isOn = state.notifications[key] === true;
    button.setAttribute('aria-checked', isOn ? 'true' : 'false');
    $('.switch-state', button).textContent = isOn ? 'On' : 'Off';

    button.addEventListener('click', function () {
      var next = button.getAttribute('aria-checked') !== 'true';
      button.setAttribute('aria-checked', next ? 'true' : 'false');
      $('.switch-state', button).textContent = next ? 'On' : 'Off';
    });
  });

  $('[data-action="save-notifications"]').addEventListener('click', function () {
    clearMessage('notifications');

    var onCount = 0;
    $$('[data-switch]').forEach(function (button) {
      var key = button.getAttribute('data-switch');
      var isOn = button.getAttribute('aria-checked') === 'true';
      state.notifications[key] = isOn;
      if (isOn) { onCount += 1; }
    });

    var text = onCount === 0
      ? "Notification settings saved. You've turned off every email."
      : 'Notification settings saved. We only send what you turned on.';

    setMessage('notifications', 'success', text);
  });

  /* ----------------------------------------------------------------- team */

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2)
      .map(function (part) { return part.charAt(0).toUpperCase(); })
      .join('');
  }

  function nameFromEmail(email) {
    var local = email.split('@')[0] || '';
    var parts = local.split(/[._\-+]+/).filter(Boolean).slice(0, 2);
    var words = parts.map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    });
    return words.join(' ') || 'New teammate';
  }

  function renderMembers() {
    var list = document.getElementById('member-list');
    list.textContent = '';

    if (state.members.length === 0) {
      var emptyItem = document.createElement('li');
      emptyItem.className = 'member member--empty';
      emptyItem.textContent = 'Everyone has been removed. Invite a teammate below to bring them back.';
      list.appendChild(emptyItem);
      return;
    }

    state.members.forEach(function (member) {
      var item = document.createElement('li');
      item.className = 'member';
      item.setAttribute('data-member', '');
      item.setAttribute('data-member-id', member.id);

      var avatar = document.createElement('span');
      avatar.className = 'avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = initials(member.name);

      var body = document.createElement('div');
      body.className = 'member-body';

      var nameEl = document.createElement('p');
      nameEl.className = 'member-name';
      nameEl.textContent = member.name;

      var emailEl = document.createElement('p');
      emailEl.className = 'member-email';
      emailEl.textContent = member.email;

      body.appendChild(nameEl);
      body.appendChild(emailEl);

      var role = document.createElement('span');
      role.className = 'role-badge';
      role.textContent = member.role;

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn--quiet-danger';
      remove.setAttribute('data-action', 'remove-member');
      remove.setAttribute('aria-label', 'Remove ' + member.name + ' from Northwind');
      remove.textContent = 'Remove';
      remove.addEventListener('click', function () { confirmRemove(member); });

      item.appendChild(avatar);
      item.appendChild(body);
      item.appendChild(role);
      item.appendChild(remove);

      list.appendChild(item);
    });
  }

  function confirmRemove(member) {
    openModal({
      title: 'Remove ' + member.name + '?',
      desc: member.name + ' loses access to Northwind right away. The work they shared stays, and you can invite them again later.',
      confirmLabel: 'Remove member',
      cancelLabel: 'Keep member',
      confirmAction: 'confirm-remove-member',
      danger: true,
      onConfirm: function () {
        state.members = state.members.filter(function (person) { return person.id !== member.id; });
        renderMembers();
        setMessage('team', 'success', member.name + ' no longer has access to Northwind.');
        var heading = document.getElementById('team-heading');
        if (heading) { heading.focus(); }
      }
    });
  }

  var inviteForm = document.getElementById('invite-form');
  var inviteInput = $('[data-field="invite-email"]');
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  inviteForm.addEventListener('submit', function (event) {
    event.preventDefault();
    clearMessage('team');
    clearInvalid(inviteInput);

    var value = inviteInput.value.trim();

    if (!EMAIL_PATTERN.test(value)) {
      var message = setMessage('team', 'error', "That email address doesn't look right. Use the format name@company.com, then try again.");
      markInvalid(inviteInput, message);
      inviteInput.focus();
      return;
    }

    var alreadyMember = state.members.some(function (member) {
      return member.email.toLowerCase() === value.toLowerCase();
    });

    if (alreadyMember) {
      var duplicate = setMessage('team', 'error', value + ' is already on the team. Invite a different address instead.');
      markInvalid(inviteInput, duplicate);
      inviteInput.focus();
      return;
    }

    state.members.push({
      id: 'm-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: nameFromEmail(value),
      email: value,
      role: 'Member'
    });

    renderMembers();
    inviteInput.value = '';
    setMessage('team', 'success', 'Invite sent to ' + value + ". They'll join Northwind as a member.");
  });

  /* ------------------------------------------------------------- projects */

  var PROJECT_NAMES = ['Website relaunch', 'Mobile app refresh', 'Onboarding revamp', 'Customer research', 'Pricing page test'];

  function makeButton(className, action, label, handler) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.setAttribute('data-action', action);
    button.textContent = label;
    button.addEventListener('click', handler);
    return button;
  }

  function renderProjects() {
    var body = document.getElementById('projects-body');
    body.textContent = '';

    if (state.projects.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty';
      empty.setAttribute('data-empty', '');
      empty.innerHTML =
        '<div class="empty-icon" aria-hidden="true">' + ICON_FOLDER + '</div>' +
        '<h3 class="empty-title">No projects yet</h3>' +
        '<p class="empty-text">Projects keep briefs, files, and updates in one place. Create your first project to start collaborating in Northwind.</p>';
      empty.appendChild(makeButton('btn btn--primary', 'create-project', 'Create project', createProject));
      body.appendChild(empty);
      return;
    }

    var bar = document.createElement('div');
    bar.className = 'list-bar';

    var heading = document.createElement('h3');
    heading.className = 'subsection-title';
    heading.textContent = state.projects.length === 1 ? '1 project' : state.projects.length + ' projects';

    bar.appendChild(heading);
    bar.appendChild(makeButton('btn btn--secondary', 'create-project', 'New project', createProject));
    body.appendChild(bar);

    var list = document.createElement('ul');
    list.className = 'project-list';

    state.projects.forEach(function (project) {
      var item = document.createElement('li');
      item.className = 'project';
      item.setAttribute('data-project', '');
      item.setAttribute('data-project-id', project.id);

      var mark = document.createElement('span');
      mark.className = 'project-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = initials(project.name);

      var wrap = document.createElement('div');
      wrap.className = 'project-body';

      var nameEl = document.createElement('p');
      nameEl.className = 'project-name';
      nameEl.textContent = project.name;

      var metaEl = document.createElement('p');
      metaEl.className = 'project-meta';
      metaEl.textContent = project.meta;

      wrap.appendChild(nameEl);
      wrap.appendChild(metaEl);

      var badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'Active';

      item.appendChild(mark);
      item.appendChild(wrap);
      item.appendChild(badge);

      list.appendChild(item);
    });

    body.appendChild(list);
  }

  function createProject() {
    var index = state.projects.length;
    var base = PROJECT_NAMES[index % PROJECT_NAMES.length];
    var round = Math.floor(index / PROJECT_NAMES.length);
    var name = round > 0 ? base + ' ' + (round + 1) : base;

    state.projects.push({
      id: 'p-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: name,
      meta: 'Created just now · 1 member'
    });

    renderProjects();
    setMessage('projects', 'success', 'Project created. ' + name + ' is ready for your team.');
  }

  /* -------------------------------------------------------------- billing */

  var paymentForm = document.getElementById('payment-form');
  var cardNumberInput = $('[data-field="card-number"]');
  var DECLINED_CARD = '4000000000000002';

  cardNumberInput.addEventListener('input', function () {
    var digits = cardNumberInput.value.replace(/\D/g, '').slice(0, 19);
    var groups = digits.match(/.{1,4}/g);
    cardNumberInput.value = groups ? groups.join(' ') : '';
  });

  paymentForm.addEventListener('submit', function (event) {
    event.preventDefault();
    clearMessage('billing');
    clearInvalid(cardNumberInput);

    var digits = cardNumberInput.value.replace(/\D/g, '');

    if (digits.length !== 16) {
      var incomplete = setMessage('billing', 'error', "That card number isn't complete. Enter all 16 digits, then try again.");
      markInvalid(cardNumberInput, incomplete);
      cardNumberInput.focus();
      return;
    }

    if (digits === DECLINED_CARD) {
      var declined = setMessage('billing', 'error', 'Payment declined. Your bank turned down this card. Try a different card or contact your bank.');
      markInvalid(cardNumberInput, declined);
      cardNumberInput.focus();
      return;
    }

    setMessage('billing', 'success', "Payment method saved. We'll charge this card for your Team plan on the first of each month.");
  });

  /* --------------------------------------------------------------- danger */

  $('[data-action="delete-workspace"]').addEventListener('click', function () {
    openModal({
      title: 'Delete Northwind?',
      desc: 'This removes all members, projects, and settings for Northwind. You can\'t undo it.',
      confirmLabel: 'Delete workspace',
      cancelLabel: 'Keep workspace',
      confirmAction: 'confirm-delete-workspace',
      danger: true,
      onConfirm: function () {
        setMessage('danger', 'success', "Nothing was deleted. Workspace deletion is turned off in this sample of Harbor.");
      }
    });
  });

  /* ----------------------------------------------------------------- init */

  renderMembers();
  renderProjects();
  activatePanel('profile', false);
})();
</script>
</body>
</html>
```
### Navigating the Settings Hub

Here's how the six panels work together and where the key controls live.

- **Sidebar navigation:** six buttons switch between panels; the active one is highlighted and the others are hidden.
- **Profile form:** saving updates the profile and sidebar email; blank names show an error.
- **Notification switches:** toggle settings on or off, then save to show a success message.
- **Team management:** remove members asks for confirmation in a dialog; invite email validates before adding.
- **Projects empty state:** starts empty; create a project to populate the list.
- **Billing form:** card number is formatted and validated; the declined card shows a specific error.
- **Danger zone:** delete workspace opens a confirmation dialog but never actually deletes.
- **Accessibility:** all controls are keyboard-operable, labels are tied to fields, and errors/successes use ARIA live regions.
---

**Optimization Tip:** You can customize the sample data by editing the `state` object at the top of the script — for example, replace `marcus@northwind.co` or the plan price text to match your own workspace.