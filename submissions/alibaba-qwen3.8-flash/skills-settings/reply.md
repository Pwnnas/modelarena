```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Harbor — Northwind settings</title>
  <style>
    :root {
      --deep-navy: #1a2332;
      --navy-2: #203043;
      --navy-3: #182333;
      --navy-4: #14202b;
      --teal: #2d8b8b;
      --seafoam: #a8dadc;
      --cream: #f1faee;
      --danger: #8b3948;
      --danger-soft: #ffc9d1;
      --font-body: "DejaVu Sans", "DejaVu Sans Condensed", "Liberation Sans", Arial, sans-serif;
      --font-heading: "DejaVu Sans", "DejaVu Sans Condensed", "Liberation Sans", Arial, sans-serif;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    html {
      height: 100%;
    }

    body {
      min-height: 100%;
      margin: 0;
      color: var(--cream);
      font-family: var(--font-body);
      font-size: 16px;
      line-height: 1.5;
      background:
        radial-gradient(1200px 700px at 8% -12%, rgba(45, 139, 139, 0.22), transparent 60%),
        radial-gradient(900px 520px at 92% 0%, rgba(168, 218, 220, 0.09), transparent 55%),
        var(--deep-navy);
    }

    [hidden] {
      display: none !important;
    }

    button,
    input {
      font-family: inherit;
      font-size: 1rem;
    }

    button:focus,
    input:focus,
    a:focus {
      outline: none;
    }

    button:focus-visible,
    input:focus-visible,
    a:focus-visible,
    .panel:focus-visible,
    .dialog:focus-visible {
      outline: 3px solid var(--seafoam);
      outline-offset: 2px;
    }

    .skip-link {
      position: fixed;
      left: 0.85rem;
      top: -4rem;
      z-index: 100;
      background: var(--cream);
      color: var(--deep-navy);
      padding: 0.6rem 0.9rem;
      border-radius: 10px;
      font-family: var(--font-heading);
      font-weight: 700;
      text-decoration: none;
    }

    .skip-link:focus {
      top: 0.85rem;
      outline: 3px solid var(--seafoam);
      outline-offset: 2px;
    }

    .app {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.8rem 1.25rem;
      background: rgba(20, 32, 43, 0.94);
      backdrop-filter: blur(6px);
      border-bottom: 1px solid rgba(45, 139, 139, 0.55);
    }

    .brand {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-family: var(--font-heading);
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--cream);
    }

    .brand-mark {
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      border-radius: 9px;
      background: var(--seafoam);
      color: var(--deep-navy);
      font-family: var(--font-heading);
      font-weight: 700;
    }

    .workspace-line {
      margin: 0 0 0 auto;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--seafoam);
    }

    .eyebrow {
      font-family: var(--font-heading);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--seafoam);
    }

    .workspace-name {
      font-family: var(--font-heading);
      font-weight: 700;
      color: var(--cream);
    }

    .shell {
      flex: 1;
      display: grid;
      grid-template-columns: 264px minmax(0, 1fr);
    }

    .sidebar {
      position: sticky;
      top: 4.5rem;
      align-self: start;
      max-height: calc(100vh - 4.5rem);
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.25rem 1rem;
      background: rgba(20, 32, 43, 0.7);
      border-right: 1px solid rgba(168, 218, 220, 0.18);
    }

    .sidebar ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.35rem;
    }

    .nav-btn {
      width: 100%;
      min-height: 48px;
      display: flex;
      align-items: center;
      padding: 0.75rem 0.9rem;
      border: 1px solid transparent;
      border-radius: 12px;
      background: transparent;
      color: var(--seafoam);
      font-family: var(--font-heading);
      font-weight: 700;
      text-align: left;
      cursor: pointer;
    }

    .nav-btn:hover {
      background: rgba(168, 218, 220, 0.1);
      color: var(--cream);
    }

    .nav-btn[aria-current="page"] {
      background: var(--seafoam);
      border-color: var(--seafoam);
      color: var(--deep-navy);
      box-shadow: inset 0 -3px 0 rgba(26, 35, 50, 0.2);
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid rgba(168, 218, 220, 0.18);
      display: grid;
      gap: 0.2rem;
    }

    .user-name {
      font-family: var(--font-heading);
      font-weight: 700;
      color: var(--cream);
    }

    .user-email {
      color: var(--seafoam);
      font-size: 0.9rem;
      overflow-wrap: anywhere;
    }

    .main {
      padding: 1.5rem;
      overflow-x: hidden;
    }

    .panel {
      display: grid;
      gap: 1rem;
      max-width: 760px;
      margin: 0 auto;
    }

    .panel-header {
      display: grid;
      gap: 0.25rem;
    }

    .panel-header h2 {
      margin: 0;
      font-family: var(--font-heading);
      font-size: 1.65rem;
      font-weight: 700;
      color: var(--cream);
    }

    .panel-header p {
      margin: 0;
      color: var(--seafoam);
    }

    .card {
      padding: 1.1rem;
      border: 1px solid rgba(168, 218, 220, 0.22);
      border-top: 4px solid var(--teal);
      border-radius: 16px;
      background: var(--navy-2);
      box-shadow: 0 12px 32px rgba(8, 15, 23, 0.32);
    }

    .form-card {
      display: grid;
      gap: 1rem;
    }

    .field {
      display: grid;
      gap: 0.45rem;
    }

    label {
      font-family: var(--font-heading);
      font-weight: 700;
      color: var(--cream);
    }

    input {
      width: 100%;
      min-height: 46px;
      padding: 0.7rem 0.8rem;
      border: 1px solid var(--teal);
      border-radius: 10px;
      background: var(--navy-4);
      color: var(--cream);
    }

    input::placeholder {
      color: #b7d8d9;
      opacity: 1;
    }

    input[aria-invalid="true"] {
      border-color: var(--danger-soft);
    }

    .hint {
      margin: 0;
      color: var(--seafoam);
      font-size: 0.9rem;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .field-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .btn {
      min-height: 44px;
      padding: 0.65rem 1rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border: 1px solid transparent;
      border-radius: 10px;
      background: transparent;
      color: var(--cream);
      font-family: var(--font-heading);
      font-weight: 700;
      cursor: pointer;
    }

    .btn.primary {
      background: var(--cream);
      color: var(--deep-navy);
    }

    .btn.primary:hover {
      background: var(--seafoam);
      color: var(--deep-navy);
    }

    .btn.secondary {
      border-color: var(--seafoam);
      background: rgba(168, 218, 220, 0.08);
      color: var(--seafoam);
    }

    .btn.secondary:hover {
      background: rgba(168, 218, 220, 0.16);
      color: var(--cream);
    }

    .btn.danger {
      background: var(--danger);
      border-color: #a65563;
      color: var(--cream);
    }

    .btn.danger:hover {
      background: #a44859;
    }

    .btn.danger-outline {
      background: rgba(255, 201, 209, 0.08);
      border-color: var(--danger-soft);
      color: var(--danger-soft);
    }

    .btn.danger-outline:hover {
      background: rgba(255, 201, 209, 0.16);
      color: #ffe3ea;
    }

    .setting {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.85rem;
      border: 1px solid rgba(168, 218, 220, 0.18);
      border-radius: 12px;
      background: rgba(20, 32, 43, 0.55);
    }

    .setting-copy {
      display: grid;
      gap: 0.15rem;
      min-width: 0;
    }

    .setting-title {
      font-family: var(--font-heading);
      font-weight: 700;
      color: var(--cream);
    }

    .setting-desc {
      color: var(--seafoam);
      font-size: 0.9rem;
    }

    .switch {
      min-height: 44px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
    }

    .switch-track {
      width: 44px;
      height: 24px;
      position: relative;
      border: 2px solid var(--seafoam);
      border-radius: 999px;
      background: rgba(168, 218, 220, 0.18);
      transition: background 0.15s ease;
    }

    .switch-thumb {
      position: absolute;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--cream);
      top: 1px;
      left: 1px;
      transition: left 0.15s ease;
    }

    .switch[aria-checked="true"] .switch-track {
      background: var(--teal);
    }

    .switch[aria-checked="true"] .switch-thumb {
      left: 21px;
    }

    .switch-state {
      min-width: 2.4rem;
      font-family: var(--font-heading);
      font-weight: 700;
      color: var(--cream);
    }

    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.7rem;
    }

    .member,
    .project {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.8rem;
      border: 1px solid rgba(168, 218, 220, 0.18);
      border-radius: 12px;
      background: rgba(20, 32, 43, 0.55);
    }

    .member-info {
      display: grid;
      gap: 0.15rem;
      min-width: 0;
    }

    .member-name,
    .project-name {
      font-family: var(--font-heading);
      font-weight: 700;
      color: var(--cream);
      overflow-wrap: anywhere;
    }

    .member-email,
    .project-meta {
      color: var(--seafoam);
      overflow-wrap: anywhere;
    }

    .member-role {
      border: 1px solid var(--seafoam);
      border-radius: 999px;
      color: var(--seafoam);
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      white-space: nowrap;
    }

    .subheading {
      margin: 0 0 0.8rem;
      font-family: var(--font-heading);
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--cream);
    }

    .panel-toolbar {
      display: flex;
      justify-content: flex-end;
    }

    .empty-state {
      display: grid;
      gap: 1rem;
      justify-items: center;
      text-align: center;
      padding: 2rem 1rem;
      border: 1px dashed var(--seafoam);
      border-radius: 16px;
      background: rgba(45, 139, 139, 0.12);
    }

    .empty-state h3 {
      margin: 0;
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--cream);
    }

    .empty-state p {
      margin: 0;
      max-width: 42rem;
      color: var(--seafoam);
    }

    .plan-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .plan-main {
      display: grid;
      gap: 0.25rem;
    }

    .plan-main h3 {
      margin: 0;
      font-family: var(--font-heading);
      color: var(--cream);
    }

    .plan-main p {
      margin: 0;
      color: var(--seafoam);
    }

    .pill {
      border: 1px solid var(--seafoam);
      border-radius: 999px;
      color: var(--seafoam);
      font-family: var(--font-heading);
      font-weight: 700;
      padding: 0.35rem 0.7rem;
      white-space: nowrap;
    }

    .danger-card {
      border: 1px solid var(--danger-soft);
      border-top: 4px solid var(--danger-soft);
      background: rgba(255, 201, 209, 0.05);
    }

    .danger-card p {
      margin: 0 0 1rem;
      color: var(--cream);
    }

    .messages {
      display: block;
      margin-top: 0.35rem;
    }

    .status-region {
      display: block;
    }

    .status-region:not(:empty) {
      margin: 0.5rem 0 0;
      padding: 0.8rem 0.9rem;
      border: 1px solid var(--seafoam);
      border-left: 5px solid var(--seafoam);
      border-radius: 12px;
      background: rgba(168, 218, 220, 0.09);
      color: #e6f7f8;
      font-family: var(--font-heading);
      font-weight: 700;
    }

    .error-region {
      display: block;
    }

    .message.error {
      margin: 0.5rem 0 0;
      padding: 0.8rem 0.9rem;
      border: 1px solid var(--danger-soft);
      border-left: 5px solid var(--danger-soft);
      border-radius: 12px;
      background: rgba(255, 201, 209, 0.08);
      color: #ffe7ec;
      font-family: var(--font-heading);
      font-weight: 700;
    }

    .overlay {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: rgba(15, 23, 34, 0.78);
    }

    .dialog {
      width: min(460px, 100%);
      padding: 1.25rem;
      border: 1px solid var(--seafoam);
      border-radius: 18px;
      background: var(--navy-2);
      color: var(--cream);
      box-shadow: 0 30px 80px rgba(8, 15, 23, 0.65);
    }

    .dialog h2 {
      margin: 0 0 0.5rem;
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 700;
    }

    .dialog p {
      margin: 0 0 1.1rem;
      color: var(--seafoam);
    }

    .dialog-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    body.has-dialog {
      overflow: hidden;
    }

    @media (max-width: 920px) {
      .shell {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
        max-height: none;
        border-right: 0;
        border-bottom: 1px solid rgba(168, 218, 220, 0.18);
      }

      .sidebar ul {
        grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
      }

      .sidebar-footer {
        margin-top: 0;
      }

      .main {
        padding: 1rem;
      }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to settings</a>

  <div class="app">
    <header class="topbar">
      <h1 class="brand">
        <span class="brand-mark" aria-hidden="true">H</span>
        Harbor
      </h1>
      <p class="workspace-line">
        <span class="eyebrow">Workspace</span>
        <span class="workspace-name" data-display="workspace">Northwind</span>
      </p>
    </header>

    <div class="shell">
      <nav class="sidebar" aria-label="Settings navigation">
        <ul>
          <li>
            <button type="button" class="nav-btn" data-nav="profile" aria-controls="profile" aria-current="page">
              Profile
            </button>
          </li>
          <li>
            <button type="button" class="nav-btn" data-nav="notifications" aria-controls="notifications">
              Notifications
            </button>
          </li>
          <li>
            <button type="button" class="nav-btn" data-nav="team" aria-controls="team">
              Team
            </button>
          </li>
          <li>
            <button type="button" class="nav-btn" data-nav="projects" aria-controls="projects">
              Projects
            </button>
          </li>
          <li>
            <button type="button" class="nav-btn" data-nav="billing" aria-controls="billing">
              Billing
            </button>
          </li>
          <li>
            <button type="button" class="nav-btn" data-nav="danger" aria-controls="danger">
              Danger zone
            </button>
          </li>
        </ul>

        <div class="sidebar-footer">
          <span class="eyebrow">Signed in as</span>
          <span class="user-name" data-display="profile-name">Ava Chen</span>
          <span class="user-email" data-display="profile-email">ava@northwind.app</span>
        </div>
      </nav>

      <main class="main" id="main">
        <section id="profile" data-panel="profile" class="panel" aria-labelledby="profile-heading" tabindex="-1">
          <header class="panel-header">
            <h2 id="profile-heading">Profile</h2>
            <p>Manage how you appear to your team in Northwind.</p>
          </header>

          <form class="card form-card" data-form="profile" novalidate>
            <div class="field">
              <label for="profile-name">Full name</label>
              <input id="profile-name" data-field="name" name="name" type="text" autocomplete="name" value="Ava Chen" />
            </div>

            <div class="field">
              <label for="profile-email">Email address</label>
              <input
                id="profile-email"
                data-field="email"
                name="email"
                type="email"
                autocomplete="email"
                value="ava@northwind.app"
                data-base-describedby="profile-email-hint"
                aria-describedby="profile-email-hint"
              />
              <p id="profile-email-hint" class="hint">Your team sees this on comments and mentions.</p>
            </div>

            <div class="field-actions">
              <button type="button" class="btn primary" data-action="save-profile">Save profile</button>
            </div>
          </form>

          <div class="messages">
            <div class="error-region" role="alert" aria-live="assertive"></div>
            <div class="status-region" role="status" aria-live="polite"></div>
          </div>
        </section>

        <section id="notifications" data-panel="notifications" class="panel" aria-labelledby="notifications-heading" tabindex="-1" hidden>
          <header class="panel-header">
            <h2 id="notifications-heading">Notifications</h2>
            <p>Choose what Northwind sends you.</p>
          </header>

          <div class="card">
            <div class="setting">
              <div class="setting-copy">
                <span id="switch-updates-label" class="setting-title">Product updates</span>
                <span class="setting-desc">Hear about new features and release notes.</span>
              </div>
              <button
                type="button"
                class="switch"
                role="switch"
                aria-checked="true"
                aria-labelledby="switch-updates-label"
                data-switch="updates"
              >
                <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
                <span class="switch-state" aria-hidden="true">On</span>
              </button>
            </div>

            <div class="setting">
              <div class="setting-copy">
                <span id="switch-comments-label" class="setting-title">Comments</span>
                <span class="setting-desc">Get a ping when someone replies in a thread you follow.</span>
              </div>
              <button
                type="button"
                class="switch"
                role="switch"
                aria-checked="true"
                aria-labelledby="switch-comments-label"
                data-switch="comments"
              >
                <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
                <span class="switch-state" aria-hidden="true">On</span>
              </button>
            </div>

            <div class="setting">
              <div class="setting-copy">
                <span id="switch-mentions-label" class="setting-title">Mentions</span>
                <span class="setting-desc">Get a ping when your @name is mentioned.</span>
              </div>
              <button
                type="button"
                class="switch"
                role="switch"
                aria-checked="true"
                aria-labelledby="switch-mentions-label"
                data-switch="mentions"
              >
                <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
                <span class="switch-state" aria-hidden="true">On</span>
              </button>
            </div>

            <div class="setting">
              <div class="setting-copy">
                <span id="switch-digest-label" class="setting-title">Weekly digest</span>
                <span class="setting-desc">Receive a Monday summary of team activity.</span>
              </div>
              <button
                type="button"
                class="switch"
                role="switch"
                aria-checked="false"
                aria-labelledby="switch-digest-label"
                data-switch="digest"
              >
                <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
                <span class="switch-state" aria-hidden="true">Off</span>
              </button>
            </div>
          </div>

          <div class="field-actions">
            <button type="button" class="btn primary" data-action="save-notifications">Save notification settings</button>
          </div>

          <div class="messages">
            <div class="error-region" role="alert" aria-live="assertive"></div>
            <div class="status-region" role="status" aria-live="polite"></div>
          </div>
        </section>

        <section id="team" data-panel="team" class="panel" aria-labelledby="team-heading" tabindex="-1" hidden>
          <header class="panel-header">
            <h2 id="team-heading">Team</h2>
            <p>See who has access to Northwind.</p>
          </header>

          <div class="card">
            <h3 class="subheading">Members</h3>

            <ul id="team-list" class="list" role="list" aria-label="Team members">
              <li class="member" data-member="mara-lindqvist">
                <div class="member-info">
                  <span class="member-name">Mara Lindqvist</span>
                  <span class="member-email">mara@northwind.app</span>
                </div>
                <span class="member-role">Owner</span>
                <button type="button" class="btn danger-outline" data-action="remove-member" aria-label="Remove Mara Lindqvist">
                  Remove
                </button>
              </li>

              <li class="member" data-member="priya-shah">
                <div class="member-info">
                  <span class="member-name">Priya Shah</span>
                  <span class="member-email">priya@northwind.app</span>
                </div>
                <span class="member-role">Admin</span>
                <button type="button" class="btn danger-outline" data-action="remove-member" aria-label="Remove Priya Shah">
                  Remove
                </button>
              </li>

              <li class="member" data-member="tomas-alvarez">
                <div class="member-info">
                  <span class="member-name">Tomás Alvarez</span>
                  <span class="member-email">tomas@northwind.app</span>
                </div>
                <span class="member-role">Member</span>
                <button type="button" class="btn danger-outline" data-action="remove-member" aria-label="Remove Tomás Alvarez">
                  Remove
                </button>
              </li>
            </ul>
          </div>

          <div class="card">
            <h3 class="subheading">Invite a teammate</h3>

            <form class="form-card" data-form="invite" novalidate>
              <div class="field">
                <label for="invite-email">Email address</label>
                <input
                  id="invite-email"
                  data-field="invite-email"
                  name="invite-email"
                  type="email"
                  autocomplete="email"
                  placeholder="teammate@northwind.app"
                  data-base-describedby="invite-email-hint"
                  aria-describedby="invite-email-hint"
                />
                <p id="invite-email-hint" class="hint">They’ll receive an invitation to join Northwind.</p>
              </div>

              <div class="field-actions">
                <button type="button" class="btn primary" data-action="invite">Send invite</button>
              </div>
            </form>
          </div>

          <div class="messages">
            <div class="error-region" role="alert" aria-live="assertive"></div>
            <div class="status-region" role="status" aria-live="polite"></div>
          </div>
        </section>

        <section id="projects" data-panel="projects" class="panel" aria-labelledby="projects-heading" tabindex="-1" hidden>
          <header class="panel-header">
            <h2 id="projects-heading">Projects</h2>
            <p>Keep work connected to the right place.</p>
          </header>

          <div id="projects-toolbar" class="panel-toolbar" hidden></div>

          <div id="projects-empty" data-empty class="empty-state">
            <h3>No projects yet</h3>
            <p>Projects in Northwind hold team tasks, files, and updates for a shared goal. There aren’t any projects yet. Create your first project to start organizing work.</p>
            <button type="button" id="create-project-btn" class="btn primary" data-action="create-project">Create project</button>
          </div>

          <ul id="project-list" class="list" role="list" aria-label="Projects"></ul>

          <div class="messages">
            <div class="error-region" role="alert" aria-live="assertive"></div>
            <div class="status-region" role="status" aria-live="polite"></div>
          </div>
        </section>

        <section id="billing" data-panel="billing" class="panel" aria-labelledby="billing-heading" tabindex="-1" hidden>
          <header class="panel-header">
            <h2 id="billing-heading">Billing</h2>
            <p>Manage Northwind’s plan and payment method.</p>
          </header>

          <div class="card plan-card">
            <div class="plan-main">
              <h3>Team plan</h3>
              <p>$12 per member / month · renews Feb 1</p>
            </div>
            <span class="pill">5 seats · Northwind</span>
          </div>

          <form class="card form-card" data-form="payment" novalidate>
            <h3 class="subheading">Payment method</h3>

            <div class="field">
              <label for="card-number">Card number</label>
              <input
                id="card-number"
                data-field="card-number"
                name="card-number"
                type="text"
                inputmode="numeric"
                autocomplete="cc-number"
                placeholder="4242 4242 4242 4242"
                data-base-describedby="card-number-hint"
                aria-describedby="card-number-hint"
              />
              <p id="card-number-hint" class="hint">Use 4000 0000 0000 0002 to see a declined response in this sample.</p>
            </div>

            <div class="grid-2">
              <div class="field">
                <label for="card-expiry">Expiry date</label>
                <input
                  id="card-expiry"
                  data-field="card-expiry"
                  name="card-expiry"
                  type="text"
                  inputmode="numeric"
                  autocomplete="cc-exp"
                  placeholder="MM/YY"
                />
              </div>

              <div class="field">
                <label for="card-cvc">Security code</label>
                <input
                  id="card-cvc"
                  data-field="card-cvc"
                  name="card-cvc"
                  type="text"
                  inputmode="numeric"
                  autocomplete="cc-csc"
                  placeholder="123"
                />
              </div>
            </div>

            <div class="field-actions">
              <button type="button" class="btn primary" data-action="pay">Update payment method</button>
            </div>
          </form>

          <div class="messages">
            <div class="error-region" role="alert" aria-live="assertive"></div>
            <div class="status-region" role="status" aria-live="polite"></div>
          </div>
        </section>

        <section id="danger" data-panel="danger" class="panel" aria-labelledby="danger-heading" tabindex="-1" hidden>
          <header class="panel-header">
            <h2 id="danger-heading">Danger zone</h2>
            <p>Actions here affect everyone in Northwind.</p>
          </header>

          <div class="card danger-card">
            <h3 class="subheading">Delete workspace</h3>
            <p>
              This permanently removes Northwind: projects, team members, comments, and billing settings.
              This can’t be undone.
            </p>
            <button type="button" class="btn danger" data-action="delete-workspace">Delete workspace</button>
          </div>

          <div class="messages">
            <div class="error-region" role="alert" aria-live="assertive"></div>
            <div class="status-region" role="status" aria-live="polite"></div>
          </div>
        </section>
      </main>
    </div>
  </div>

  <div id="overlay" class="overlay" hidden>
    <div
      id="confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      class="dialog"
      tabindex="-1"
      hidden
    >
      <h2 id="dialog-title">Confirm action</h2>
      <p id="dialog-description">This action needs your confirmation.</p>
      <div class="dialog-actions">
        <button type="button" id="dialog-cancel" class="btn secondary">Cancel</button>
        <button type="button" id="dialog-confirm" class="btn danger">Confirm</button>
      </div>
    </div>
  </div>

  <script>
    (function () {
      "use strict";

      const panelIds = ["profile", "notifications", "team", "projects", "billing", "danger"];
      const panelEls = {};
      panelIds.forEach((id) => {
        panelEls[id] = document.getElementById(id);
      });

      const navButtons = Array.from(document.querySelectorAll("[data-nav]"));
      let activePanelId = "profile";

      const profileName = document.getElementById("profile-name");
      const profileEmail = document.getElementById("profile-email");
      const inviteEmail = document.getElementById("invite-email");
      const cardNumber = document.getElementById("card-number");

      const teamList = document.getElementById("team-list");

      const projectsEmpty = document.getElementById("projects-empty");
      const projectsToolbar = document.getElementById("projects-toolbar");
      const projectList = document.getElementById("project-list");
      const createProjectButton = document.getElementById("create-project-btn");
      const projectNames = ["Client onboarding", "Q1 roadmap", "Customer portal"];
      let projectsCount = 0;

      const overlay = document.getElementById("overlay");
      const dialog = document.getElementById("confirm-dialog");
      const dialogTitle = document.getElementById("dialog-title");
      const dialogDescription = document.getElementById("dialog-description");
      const dialogConfirm = document.getElementById("dialog-confirm");
      const dialogCancel = document.getElementById("dialog-cancel");

      let lastFocused = null;
      let dialogHandler = null;

      function showPanel(id) {
        if (!panelEls[id]) return;

        panelIds.forEach((pid) => {
          const panel = panelEls[pid];
          if (!panel) return;
          if (pid === id) {
            panel.removeAttribute("hidden");
          } else {
            panel.setAttribute("hidden", "");
          }
        });

        navButtons.forEach((btn) => {
          if (btn.dataset.nav === id) {
            btn.setAttribute("aria-current", "page");
          } else {
            btn.removeAttribute("aria-current");
          }
        });

        activePanelId = id;
      }

      function clearMessages(panelId) {
        const panel = panelEls[panelId];
        if (!panel) return;

        panel.querySelectorAll("[data-field]").forEach((field) => {
          field.removeAttribute("aria-invalid");
          const base = field.getAttribute("data-base-describedby");
          if (base) {
            field.setAttribute("aria-describedby", base);
          } else {
            field.removeAttribute("aria-describedby");
          }
        });

        const errorRegion = panel.querySelector(".error-region");
        if (errorRegion) errorRegion.textContent = "";

        const statusRegion = panel.querySelector(".status-region");
        if (statusRegion) statusRegion.textContent = "";
      }

      function showError(panelId, text, field) {
        const panel = panelEls[panelId];
        if (!panel) return;

        clearMessages(panelId);

        const region = panel.querySelector(".error-region");
        if (!region) return;

        const message = document.createElement("p");
        const errorId = panelId + "-error";
        message.id = errorId;
        message.className = "message error";
        message.setAttribute("data-error", "true");
        message.textContent = text;
        region.appendChild(message);

        if (field) {
          field.setAttribute("aria-invalid", "true");
          const base = field.getAttribute("data-base-describedby");
          field.setAttribute("aria-describedby", (base ? base + " " : "") + errorId);
          field.focus();
        }
      }

      function showStatus(panelId, text) {
        clearMessages(panelId);

        const panel = panelEls[panelId];
        if (!panel) return;

        const region = panel.querySelector(".status-region");
        if (region) region.textContent = text;
      }

      function slug(value) {
        return String(value)
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "item";
      }

      function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      }

      function formatName(localPart) {
        const words = localPart
          .replace(/[._+-]+/g, " ")
          .trim()
          .split(/\s+/)
          .filter(Boolean);

        if (!words.length) return "New teammate";

        return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
      }

      function isDialogOpen() {
        return !overlay.hidden;
      }

      function openDialog(options) {
        if (isDialogOpen()) return;

        dialogTitle.textContent = options.title || "Confirm action";
        dialogDescription.textContent = options.description || "This action needs your confirmation.";
        dialogConfirm.textContent = options.confirmLabel || "Confirm";
        dialogCancel.textContent = options.cancelLabel || "Cancel";

        dialogConfirm.className = "btn " + (options.confirmButtonClass || "danger");
        dialogCancel.className = "btn secondary";

        dialogHandler = options.handler || null;
        lastFocused = options.opener || document.activeElement;

        overlay.hidden = false;
        dialog.hidden = false;
        document.body.classList.add("has-dialog");
        dialogCancel.focus();
      }

      function hideDialog() {
        overlay.hidden = true;
        dialog.hidden = true;
        document.body.classList.remove("has-dialog");
      }

      function restoreFocus() {
        if (lastFocused && lastFocused.isConnected) {
          lastFocused.focus();
        } else {
          const panel = panelEls[activePanelId];
          if (panel) panel.focus();
        }

        lastFocused = null;
        dialogHandler = null;
      }

      function closeDialog() {
        if (!isDialogOpen()) return;
        hideDialog();
        restoreFocus();
      }

      function saveProfile() {
        const name = profileName.value.trim();
        const email = profileEmail.value.trim();

        if (!name) {
          showError(
            "profile",
            "Full name is required. Enter your full name so your team can recognize you.",
            profileName
          );
          return;
        }

        if (!email) {
          showError(
            "profile",
            "Email address is required. Enter an email you can access.",
            profileEmail
          );
          return;
        }

        if (!isValidEmail(email)) {
          showError(
            "profile",
            "Email address isn’t valid. Check the address and try again, for example ava@northwind.app.",
            profileEmail
          );
          return;
        }

        document.querySelectorAll('[data-display="profile-name"]').forEach((el) => {
          el.textContent = name;
        });

        document.querySelectorAll('[data-display="profile-email"]').forEach((el) => {
          el.textContent = email;
        });

        showStatus("profile", "Profile saved. Your changes are live in Northwind.");
      }

      function saveNotifications() {
        showStatus("notifications", "Notification preferences saved.");
      }

      function addMember(id, name, email, role) {
        const item = document.createElement("li");
        item.className = "member";
        item.setAttribute("data-member", id);

        const info = document.createElement("div");
        info.className = "member-info";

        const nameEl = document.createElement("span");
        nameEl.className = "member-name";
        nameEl.textContent = name;

        const emailEl = document.createElement("span");
        emailEl.className = "member-email";
        emailEl.textContent = email;

        info.append(nameEl, emailEl);

        const roleEl = document.createElement("span");
        roleEl.className = "member-role";
        roleEl.textContent = role;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "btn danger-outline";
        removeButton.setAttribute("data-action", "remove-member");
        removeButton.setAttribute("aria-label", "Remove " + name);
        removeButton.textContent = "Remove";

        item.append(info, roleEl, removeButton);
        teamList.appendChild(item);
      }

      function handleInvite() {
        const email = inviteEmail.value.trim();

        if (!isValidEmail(email)) {
          showError(
            "team",
            "Email address isn’t valid. Check the address and try again, for example teammate@northwind.app.",
            inviteEmail
          );
          return;
        }

        const existing = Array.from(teamList.querySelectorAll(".member-email")).some((el) => {
          return el.textContent.trim().toLowerCase() === email.toLowerCase();
        });

        if (existing) {
          showError(
            "team",
            "That email already has access. Remove the member or invite a different teammate.",
            inviteEmail
          );
          return;
        }

        const id = "member-" + Date.now();
        const name = formatName(email.split("@")[0]);

        addMember(id, name, email, "Invited");
        inviteEmail.value = "";
        showStatus("team", "Invitation sent to " + email + ".");
      }

      function handleRemoveMember(button) {
        const memberEl = button.closest("[data-member]");
        if (!memberEl) return;

        const nameEl = memberEl.querySelector(".member-name");
        const emailEl = memberEl.querySelector(".member-email");
        const name = nameEl ? nameEl.textContent : "this member";
        const email = emailEl ? emailEl.textContent : "";

        openDialog({
          opener: button,
          title: "Remove " + name + "?",
          description:
            name + (email ? " (" + email + ")" : "") + " will lose access to Northwind. You can invite them again later.",
          confirmLabel: "Remove member",
          cancelLabel: "Keep member",
          confirmButtonClass: "danger",
          handler: () => {
            memberEl.remove();
            showStatus("team", name + " removed.");
          }
        });
      }

      function handleCreateProject() {
        const name = projectNames[projectsCount] || "Untitled project " + (projectsCount + 1);
        const id = slug(name) + "-" + (projectsCount + 1);

        const item = document.createElement("li");
        item.className = "project";
        item.setAttribute("data-project", id);

        const main = document.createElement("div");
        main.className = "project-main";

        const nameEl = document.createElement("span");
        nameEl.className = "project-name";
        nameEl.textContent = name;

        const metaEl = document.createElement("span");
        metaEl.className = "project-meta";
        metaEl.textContent = "Ready for your team";

        main.append(nameEl, metaEl);
        item.append(main);
        projectList.appendChild(item);

        projectsCount += 1;

        if (projectsEmpty && !projectsEmpty.hidden) {
          if (createProjectButton && createProjectButton.parentElement === projectsEmpty) {
            projectsToolbar.appendChild(createProjectButton);
            projectsToolbar.hidden = false;
          }
          projectsEmpty.hidden = true;
        }

        showStatus("projects", "“" + name + "” created.");
      }

      function handlePay() {
        const digits = cardNumber.value.replace(/\D/g, "");

        if (digits === "4000000000000002") {
          showError(
            "billing",
            "Payment declined. Your card was declined by your bank. Try a different card or contact your bank.",
            cardNumber
          );
          return;
        }

        if (digits.length === 16) {
          showStatus("billing", "Payment accepted. Your billing details are current for Northwind.");
          return;
        }

        showError(
          "billing",
          "Card number isn’t complete. Enter a 16-digit card number.",
          cardNumber
        );
      }

      function handleDeleteWorkspace(button) {
        openDialog({
          opener: button,
          title: "Delete Northwind?",
          description:
            "This permanently removes all projects, team members, comments, and billing settings for Northwind. This can’t be undone.",
          confirmLabel: "Delete workspace",
          cancelLabel: "Keep workspace",
          confirmButtonClass: "danger",
          handler: () => {
            document.querySelectorAll('[data-display="workspace"]').forEach((el) => {
              el.textContent = "Northwind (deleted)";
            });
            showStatus("danger", "Northwind was deleted.");
          }
        });
      }

      dialogCancel.addEventListener("click", closeDialog);

      dialogConfirm.addEventListener("click", () => {
        if (!isDialogOpen()) return;

        const handler = dialogHandler;
        dialogHandler = null;
        hideDialog();
        if (handler) handler();
        restoreFocus();
      });

      dialog.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;

        const focusable = Array.from(dialog.querySelectorAll("button:not([disabled])"));
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      });

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeDialog();
      });

      document.querySelectorAll(".switch").forEach((switchButton) => {
        switchButton.addEventListener("click", () => {
          const checked = switchButton.getAttribute("aria-checked") === "true";
          const next = !checked;
          switchButton.setAttribute("aria-checked", next ? "true" : "false");

          const state = switchButton.querySelector(".switch-state");
          if (state) state.textContent = next ? "On" : "Off";
        });
      });

      document.querySelectorAll("form").forEach((form) => {
        form.addEventListener("submit", (event) => {
          event.preventDefault();

          if (form.dataset.form === "profile") saveProfile();
          else if (form.dataset.form === "invite") handleInvite();
          else if (form.dataset.form === "payment") handlePay();
        });
      });

      document.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) return;

        const actionButton = event.target.closest("[data-action]");
        if (!actionButton) return;

        const action = actionButton.dataset.action;

        if (action === "save-profile") {
          saveProfile();
        } else if (action === "save-notifications") {
          saveNotifications();
        } else if (action === "remove-member") {
          handleRemoveMember(actionButton);
        } else if (action === "invite") {
          handleInvite();
        } else if (action === "create-project") {
          handleCreateProject();
        } else if (action === "pay") {
          handlePay();
        } else if (action === "delete-workspace") {
          handleDeleteWorkspace(actionButton);
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isDialogOpen()) {
          event.preventDefault();
          closeDialog();
          return;
        }

        if (event.key === "Enter" && !isDialogOpen() && event.target instanceof Element) {
          const field = event.target.closest("[data-field]");
          if (!field) return;

          const panel = field.closest("[data-panel]");
          if (!panel) return;

          if (panel.id === "profile") {
            event.preventDefault();
            saveProfile();
          } else if (panel.id === "team") {
            event.preventDefault();
            handleInvite();
          } else if (panel.id === "billing") {
            event.preventDefault();
            handlePay();
          }
        }
      });

      navButtons.forEach((button) => {
        button.addEventListener("click", () => {
          showPanel(button.dataset.nav);
        });
      });

      showPanel("profile");
    })();
  </script>
</body>
</html>
```