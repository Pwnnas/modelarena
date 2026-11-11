```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Harbor Settings - Northwind</title>
  <style>
    :root {
      --deep-navy: #1a2332;
      --navy-dark: #111a26;
      --navy-muted: #162433;
      --teal: #2d8b8b;
      --seafoam: #a8dadc;
      --cream: #f1faee;
      --input-bg: #fbfff8;
      --text: #152330;
      --muted: #48606c;
      --line: rgba(26, 35, 50, 0.12);
      --success-bg: #e1f1f2;
      --success-border: #2d8b8b;
      --success-text: #153d3d;
      --error-bg: #f7e3e3;
      --error-border: #a14343;
      --error-text: #5e1f1f;
      --danger: #8d3939;
      --danger-dark: #6b2c2c;
      --focus: #2d8b8b;
    }

    * {
      box-sizing: border-box;
    }

    html {
      height: 100%;
    }

    body {
      min-height: 100%;
      margin: 0;
      font-family: "DejaVu Sans", "DejaVu Sans Bold", "Segoe UI", Arial, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      color: var(--cream);
      background:
        radial-gradient(1200px 700px at 75% -10%, rgba(45, 139, 139, 0.18), transparent 60%),
        radial-gradient(900px 600px at -10% 110%, rgba(168, 218, 220, 0.08), transparent 55%),
        var(--deep-navy);
      background-attachment: fixed;
    }

    h1,
    h2,
    h3 {
      margin: 0;
      font-weight: 700;
      line-height: 1.25;
    }

    p {
      margin: 0;
    }

    button {
      font: inherit;
    }

    [hidden] {
      display: none !important;
    }

    .skip-link {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 100;
      transform: translateY(-200%);
      padding: 12px 16px;
      border-radius: 10px;
      background: var(--cream);
      color: var(--text);
      font-weight: 700;
      text-decoration: none;
    }

    .skip-link:focus {
      transform: none;
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }

    .app {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: 292px;
      flex: 0 0 292px;
      padding: 22px 18px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      background: linear-gradient(180deg, #152231, #101825);
      border-right: 1px solid rgba(168, 218, 220, 0.12);
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-mark {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      background: var(--seafoam);
      color: var(--deep-navy);
      border: 2px solid var(--teal);
      font-weight: 700;
    }

    .brand-name {
      color: var(--cream);
      font-weight: 700;
    }

    .brand-sub {
      color: #88a2ac;
      font-size: 14px;
    }

    .nav-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }

    .nav-btn {
      width: 100%;
      min-height: 48px;
      text-align: left;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--seafoam);
      font-weight: 700;
      cursor: pointer;
    }

    .nav-btn:hover {
      background: rgba(45, 139, 139, 0.18);
      color: var(--cream);
    }

    .nav-btn.active {
      background: rgba(45, 139, 139, 0.28);
      border-color: var(--teal);
      color: var(--cream);
      box-shadow: inset 4px 0 0 var(--seafoam);
    }

    .sidebar-note {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid rgba(168, 218, 220, 0.12);
      color: #88a2ac;
      font-size: 14px;
    }

    main {
      flex: 1 1 auto;
      min-width: 0;
      padding: 32px clamp(20px, 4vw, 48px);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .main-header,
    .panel-region {
      width: 100%;
      max-width: 900px;
    }

    .main-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      margin-bottom: 24px;
    }

    .main-header h1 {
      font-size: 28px;
      color: var(--cream);
    }

    .account {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .account-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--seafoam);
      color: var(--deep-navy);
      border: 2px solid var(--teal);
      font-weight: 700;
      flex: 0 0 auto;
    }

    .account-text {
      min-width: 0;
      max-width: 280px;
      overflow-wrap: anywhere;
    }

    #account-name {
      display: block;
      color: var(--cream);
      font-weight: 700;
    }

    #account-email {
      display: block;
      color: var(--seafoam);
      font-size: 14px;
    }

    .panel {
      width: 100%;
      max-width: 900px;
      background: var(--cream);
      color: var(--text);
      border: 1px solid rgba(45, 139, 139, 0.25);
      border-top: 4px solid var(--teal);
      border-radius: 18px;
      padding: 28px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.22);
    }

    .panel-header {
      border-bottom: 3px solid var(--teal);
      margin-bottom: 20px;
      padding-bottom: 14px;
    }

    .panel h2 {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .lede {
      color: var(--muted);
    }

    .form-grid {
      display: grid;
      gap: 18px;
      margin: 18px 0;
    }

    .form-grid.two {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .form-grid.three {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .span-2 {
      grid-column: span 2;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }

    label {
      color: var(--text);
      font-weight: 700;
    }

    input {
      width: 100%;
      min-height: 44px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid var(--teal);
      background: var(--input-bg);
      color: var(--text);
      font: inherit;
      overflow-wrap: anywhere;
    }

    input::placeholder {
      color: #5d7480;
    }

    button:focus,
    input:focus,
    a:focus {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }

    button:focus:not(:focus-visible),
    input:focus:not(:focus-visible),
    a:focus:not(:focus-visible) {
      outline: none;
    }

    .hint {
      color: var(--muted);
      font-size: 14px;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 18px 0;
    }

    .button {
      min-height: 44px;
      padding: 11px 18px;
      border-radius: 10px;
      border: 2px solid transparent;
      cursor: pointer;
      font-weight: 700;
    }

    .button.primary {
      background: var(--deep-navy);
      color: var(--cream);
      border-color: var(--deep-navy);
    }

    .button.primary:hover {
      background: #243448;
    }

    .button.secondary {
      background: transparent;
      color: var(--text);
      border-color: var(--teal);
    }

    .button.secondary:hover {
      background: rgba(45, 139, 139, 0.12);
    }

    .button.danger {
      background: var(--danger);
      color: var(--cream);
      border-color: var(--danger);
    }

    .button.danger:hover {
      background: var(--danger-dark);
    }

    .message {
      margin: 16px 0 0;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 15px;
      overflow-wrap: anywhere;
    }

    .message.error {
      background: var(--error-bg);
      color: var(--error-text);
      border: 1px solid var(--error-border);
      border-left: 4px solid var(--error-border);
    }

    .message.success {
      background: var(--success-bg);
      color: var(--success-text);
      border: 1px solid var(--success-border);
      border-left: 4px solid var(--success-border);
    }

    .switch-list {
      display: flex;
      flex-direction: column;
    }

    .switch-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid var(--line);
    }

    .switch-row:last-child {
      border-bottom: 0;
    }

    .switch-text {
      max-width: 600px;
      min-width: 0;
    }

    .switch-label {
      color: var(--text);
      font-weight: 700;
    }

    .switch-desc {
      color: var(--muted);
      font-size: 14px;
      margin-top: 2px;
    }

    .switch {
      width: 66px;
      height: 44px;
      min-width: 66px;
      border: 2px solid var(--teal);
      border-radius: 999px;
      background: var(--input-bg);
      position: relative;
      cursor: pointer;
    }

    .switch::before {
      content: "";
      position: absolute;
      top: 9px;
      left: 8px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--teal);
      transition: transform 0.15s ease-in-out, background-color 0.15s ease-in-out;
    }

    .switch[aria-checked="true"] {
      background: var(--teal);
    }

    .switch[aria-checked="true"]::before {
      background: var(--seafoam);
      transform: translateX(28px);
    }

    .member-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .member {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid var(--line);
    }

    .member:last-child {
      border-bottom: 0;
    }

    .member-info {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .member-name {
      font-weight: 700;
    }

    .member-email {
      color: var(--muted);
      font-size: 14px;
    }

    .member-side {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .role-badge {
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(45, 139, 139, 0.12);
      border: 1px solid rgba(45, 139, 139, 0.35);
      color: var(--success-text);
      font-size: 13px;
      font-weight: 700;
    }

    .invite-form {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--line);
    }

    .empty-state {
      border: 1px dashed rgba(45, 139, 139, 0.5);
      background: rgba(45, 139, 139, 0.05);
      border-radius: 14px;
      padding: 24px;
      margin-top: 18px;
    }

    .empty-title {
      color: var(--text);
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .empty-text {
      color: var(--muted);
    }

    .toolbar {
      display: flex;
      justify-content: flex-end;
      margin: 18px 0;
    }

    .project-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .project-card {
      border: 1px solid var(--line);
      border-left: 4px solid var(--teal);
      background: #f8fdf8;
      border-radius: 12px;
      padding: 16px;
      overflow-wrap: anywhere;
    }

    .project-name {
      font-weight: 700;
    }

    .project-meta {
      color: var(--muted);
      font-size: 14px;
      margin-top: 4px;
    }

    .plan-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 18px;
      background: #f8fdf8;
      margin: 18px 0;
      flex-wrap: wrap;
    }

    .plan-label {
      color: var(--muted);
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .plan-name {
      color: var(--text);
      font-size: 22px;
      font-weight: 700;
    }

    .plan-note {
      color: var(--muted);
      font-size: 14px;
    }

    .badge {
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(45, 139, 139, 0.12);
      border: 1px solid rgba(45, 139, 139, 0.35);
      color: var(--success-text);
      font-weight: 700;
    }

    .danger-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      border: 1px solid rgba(141, 57, 57, 0.35);
      background: rgba(141, 57, 57, 0.08);
      border-radius: 14px;
      padding: 20px;
      flex-wrap: wrap;
    }

    .danger-label {
      font-weight: 700;
      color: var(--text);
    }

    .muted {
      color: var(--muted);
    }

    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(8, 13, 20, 0.72);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 50;
    }

    .dialog-card {
      background: var(--cream);
      color: var(--text);
      width: 100%;
      max-width: 460px;
      border: 1px solid rgba(45, 139, 139, 0.25);
      border-top: 4px solid var(--teal);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
    }

    .dialog-title {
      font-size: 20px;
      margin-bottom: 10px;
    }

    .dialog-body {
      margin-bottom: 20px;
      overflow-wrap: anywhere;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      flex-wrap: wrap;
    }

    .dialog-open {
      overflow: hidden;
    }

    @media (max-width: 980px) {
      .app {
        flex-direction: column;
      }

      .sidebar {
        position: static;
        height: auto;
        width: 100%;
        flex: 0 0 auto;
        border-right: 0;
        border-bottom: 1px solid rgba(168, 218, 220, 0.12);
        overflow: visible;
      }

      .nav-list {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }
    }

    @media (max-width: 760px) {
      .form-grid.two,
      .form-grid.three {
        grid-template-columns: 1fr;
      }

      .span-2 {
        grid-column: auto;
      }

      .main-header,
      .account,
      .member,
      .plan-card,
      .danger-row,
      .switch-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .actions .button {
        width: 100%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        transition: none !important;
      }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to settings</a>

  <div class="app">
    <aside class="sidebar" aria-label="Settings">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">H</div>
        <div>
          <p class="brand-name">Northwind</p>
          <p class="brand-sub">Workspace settings</p>
        </div>
      </div>

      <nav aria-label="Settings sections">
        <ul class="nav-list">
          <li>
            <button type="button" class="nav-btn active" data-nav="profile" aria-current="page">
              Profile
            </button>
          </li>
          <li>
            <button type="button" class="nav-btn" data-nav="notifications">
              Notifications
            </button>
          </li>
          <li>
            <button type="button" class="nav-btn" data-nav="team">
              Team
            </button>
          </li>
          <li>
            <button type="button" class="nav-btn" data-nav="projects">
              Projects
            </button>
          </li>
          <li>
            <button type="button" class="nav-btn" data-nav="billing">
              Billing
            </button>
          </li>
          <li>
            <button type="button" class="nav-btn" data-nav="danger">
              Danger zone
            </button>
          </li>
        </ul>
      </nav>

      <div class="sidebar-note">
        You have full access to Northwind.
      </div>
    </aside>

    <main id="main" tabindex="-1" aria-labelledby="main-title">
      <header class="main-header">
        <h1 id="main-title">Northwind settings</h1>
        <div class="account">
          <span class="account-avatar" aria-hidden="true">AH</span>
          <span class="account-text">
            <strong id="account-name">Ada Hart</strong>
            <span id="account-email">ada@northwind.example</span>
          </span>
        </div>
      </header>

      <div class="panel-region">
        <section id="profile" class="panel" data-panel="profile" aria-labelledby="profile-title" tabindex="-1">
          <header class="panel-header">
            <h2 id="profile-title">Profile</h2>
            <p class="lede">Update your name and email as they appear to Northwind teammates.</p>
          </header>

          <form id="profile-form" novalidate>
            <div class="form-grid two">
              <div class="field">
                <label for="profile-name">Full name</label>
                <input
                  id="profile-name"
                  data-field="name"
                  name="name"
                  autocomplete="name"
                  value="Ada Hart"
                  aria-describedby="profile-name-hint"
                >
                <p id="profile-name-hint" class="hint">This name appears in comments and member lists.</p>
                <p id="profile-name-error" class="message error" data-error role="alert" hidden>
                  Enter your full name so teammates can recognize you.
                </p>
              </div>

              <div class="field">
                <label for="profile-email">Email</label>
                <input
                  id="profile-email"
                  data-field="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  value="ada@northwind.example"
                  aria-describedby="profile-email-hint"
                >
                <p id="profile-email-hint" class="hint">Northwind sends invitations, receipts, and workspace notices here.</p>
                <p id="profile-email-error" class="message error" data-error role="alert" hidden>
                  Enter a valid email address.
                </p>
              </div>
            </div>

            <div class="actions">
              <button type="button" class="button primary" data-action="save-profile">Save changes</button>
            </div>
          </form>

          <p id="profile-status" class="message success" role="status" aria-live="polite" hidden></p>
        </section>

        <section id="notifications" class="panel" data-panel="notifications" aria-labelledby="notifications-title" tabindex="-1" hidden>
          <header class="panel-header">
            <h2 id="notifications-title">Notifications</h2>
            <p class="lede">Choose what you hear about in Northwind.</p>
          </header>

          <div class="switch-list">
            <div class="switch-row">
              <div class="switch-text">
                <p id="switch-product-updates-label" class="switch-label">Product updates</p>
                <p id="switch-product-updates-description" class="switch-desc">News about new features and improvements.</p>
              </div>
              <button
                type="button"
                class="switch"
                role="switch"
                aria-checked="false"
                data-switch="product-updates"
                aria-labelledby="switch-product-updates-label"
                aria-describedby="switch-product-updates-description"
              ></button>
            </div>

            <div class="switch-row">
              <div class="switch-text">
                <p id="switch-comments-label" class="switch-label">Comments</p>
                <p id="switch-comments-description" class="switch-desc">Updates on comments in projects you follow.</p>
              </div>
              <button
                type="button"
                class="switch"
                role="switch"
                aria-checked="false"
                data-switch="comments"
                aria-labelledby="switch-comments-label"
                aria-describedby="switch-comments-description"
              ></button>
            </div>

            <div class="switch-row">
              <div class="switch-text">
                <p id="switch-mentions-label" class="switch-label">Mentions</p>
                <p id="switch-mentions-description" class="switch-desc">Notices when someone mentions you.</p>
              </div>
              <button
                type="button"
                class="switch"
                role="switch"
                aria-checked="true"
                data-switch="mentions"
                aria-labelledby="switch-mentions-label"
                aria-describedby="switch-mentions-description"
              ></button>
            </div>

            <div class="switch-row">
              <div class="switch-text">
                <p id="switch-weekly-digest-label" class="switch-label">Weekly digest</p>
                <p id="switch-weekly-digest-description" class="switch-desc">A summary of workspace activity every Monday.</p>
              </div>
              <button
                type="button"
                class="switch"
                role="switch"
                aria-checked="false"
                data-switch="weekly-digest"
                aria-labelledby="switch-weekly-digest-label"
                aria-describedby="switch-weekly-digest-description"
              ></button>
            </div>
          </div>

          <div class="actions">
            <button type="button" class="button primary" data-action="save-notifications">Save notification preferences</button>
          </div>

          <p id="notifications-status" class="message success" role="status" aria-live="polite" hidden></p>
        </section>

        <section id="team" class="panel" data-panel="team" aria-labelledby="team-title" tabindex="-1" hidden>
          <header class="panel-header">
            <h2 id="team-title">Team</h2>
            <p class="lede">Manage people who can access Northwind.</p>
          </header>

          <ul class="member-list" aria-label="Team members">
            <li class="member" data-member="member-ada-hart">
              <div class="member-info">
                <p class="member-name">Ada Hart</p>
                <p class="member-email">ada@northwind.example</p>
              </div>
              <div class="member-side">
                <span class="role-badge">Admin</span>
                <button type="button" class="button danger" data-action="remove-member" data-member-id="member-ada-hart" aria-label="Remove Ada Hart from Northwind">Remove</button>
              </div>
            </li>

            <li class="member" data-member="member-theo-lin">
              <div class="member-info">
                <p class="member-name">Theo Lin</p>
                <p class="member-email">theo@northwind.example</p>
              </div>
              <div class="member-side">
                <span class="role-badge">Designer</span>
                <button type="button" class="button danger" data-action="remove-member" data-member-id="member-theo-lin" aria-label="Remove Theo Lin from Northwind">Remove</button>
              </div>
            </li>

            <li class="member" data-member="member-marta-ives">
              <div class="member-info">
                <p class="member-name">Marta Ives</p>
                <p class="member-email">marta@northwind.example</p>
              </div>
              <div class="member-side">
                <span class="role-badge">Billing</span>
                <button type="button" class="button danger" data-action="remove-member" data-member-id="member-marta-ives" aria-label="Remove Marta Ives from Northwind">Remove</button>
              </div>
            </li>
          </ul>

          <form id="invite-form" class="invite-form" novalidate>
            <div class="field">
              <label for="invite-email">Invite a teammate</label>
              <input
                id="invite-email"
                data-field="invite-email"
                name="invite-email"
                type="email"
                autocomplete="off"
                placeholder="name@example.com"
                aria-describedby="invite-email-hint"
              >
              <p id="invite-email-hint" class="hint">Add someone by email. They will receive workspace access.</p>
              <p id="invite-email-error" class="message error" data-error role="alert" hidden>
                Enter a valid email address so we can invite them.
              </p>
            </div>

            <div class="actions">
              <button type="button" class="button primary" data-action="invite">Invite teammate</button>
            </div>
          </form>

          <p id="team-status" class="message success" role="status" aria-live="polite" hidden></p>
        </section>

        <section id="projects" class="panel" data-panel="projects" aria-labelledby="projects-title" tabindex="-1" hidden>
          <header class="panel-header">
            <h2 id="projects-title">Projects</h2>
            <p class="lede">Projects give your team a shared place to work.</p>
          </header>

          <div id="projects-empty" class="empty-state" data-empty>
            <p class="empty-title">No projects yet.</p>
            <p class="empty-text">Create your first project to start collaborating with your team.</p>
            <div class="actions">
              <button id="create-project-button" type="button" class="button primary" data-action="create-project">
                Create project
              </button>
            </div>
          </div>

          <div id="projects-toolbar" class="toolbar" hidden>
            <div class="actions" id="project-toolbar-slot"></div>
          </div>

          <ul id="projects-list" class="project-list" aria-label="Projects" hidden></ul>

          <p id="projects-status" class="message success" role="status" aria-live="polite" hidden></p>
        </section>

        <section id="billing" class="panel" data-panel="billing" aria-labelledby="billing-title" tabindex="-1" hidden>
          <header class="panel-header">
            <h2 id="billing-title">Billing</h2>
            <p class="lede">Manage your workspace plan and payment method.</p>
          </header>

          <div class="plan-card">
            <div>
              <p class="plan-label">Current plan</p>
              <p class="plan-name">Professional</p>
              <p class="plan-note">Renews on Jan 12, 2025</p>
            </div>
            <span class="badge">Active</span>
          </div>

          <form id="card-form" class="card-form" novalidate>
            <div class="form-grid three">
              <div class="field span-2">
                <label for="card-number">Card number</label>
                <input
                  id="card-number"
                  data-field="card-number"
                  name="card-number"
                  inputmode="numeric"
                  autocomplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  aria-describedby="card-number-hint"
                >
                <p id="card-number-hint" class="hint">Enter 16 digits. Spaces are ignored.</p>
                <p id="card-number-error" class="message error" data-error role="alert" hidden></p>
              </div>

              <div class="field">
                <label for="card-expiry">Expiry</label>
                <input
                  id="card-expiry"
                  data-field="card-expiry"
                  name="card-expiry"
                  inputmode="numeric"
                  autocomplete="cc-exp"
                  placeholder="12 / 30"
                  aria-describedby="card-expiry-hint"
                >
                <p id="card-expiry-hint" class="hint">MM / YY</p>
              </div>

              <div class="field">
                <label for="card-cvc">Security code</label>
                <input
                  id="card-cvc"
                  data-field="card-cvc"
                  name="card-cvc"
                  inputmode="numeric"
                  autocomplete="cc-csc"
                  placeholder="123"
                  aria-describedby="card-cvc-hint"
                >
                <p id="card-cvc-hint" class="hint">3 digits</p>
              </div>
            </div>

            <div class="actions">
              <button type="button" class="button primary" data-action="pay">Update payment method</button>
            </div>
          </form>

          <p id="billing-status" class="message success" role="status" aria-live="polite" hidden></p>
        </section>

        <section id="danger" class="panel" data-panel="danger" aria-labelledby="danger-title" tabindex="-1" hidden>
          <header class="panel-header">
            <h2 id="danger-title">Danger zone</h2>
            <p class="lede">Delete Northwind if you no longer need the workspace.</p>
          </header>

          <div class="danger-row">
            <div>
              <p class="danger-label">Workspace</p>
              <p class="muted">Deleting removes all projects, settings, and member access.</p>
            </div>
            <button type="button" class="button danger" data-action="delete-workspace">Delete workspace</button>
          </div>

          <p id="danger-status" class="message success" role="status" aria-live="polite" hidden></p>
        </section>
      </div>
    </main>
  </div>

  <div id="remove-dialog" class="dialog-overlay" hidden>
    <div class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="remove-dialog-title" aria-describedby="remove-dialog-description">
      <h2 id="remove-dialog-title" class="dialog-title">Remove member?</h2>
      <p id="remove-dialog-description" class="dialog-body">Remove this member from Northwind? This can't be undone. You can invite them again later.</p>
      <div class="dialog-actions">
        <button type="button" id="remove-dialog-cancel" class="button secondary">Keep member</button>
        <button type="button" id="remove-dialog-confirm" class="button danger">Remove member</button>
      </div>
    </div>
  </div>

  <div id="delete-dialog" class="dialog-overlay" hidden>
    <div class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description">
      <h2 id="delete-dialog-title" class="dialog-title">Delete Northwind?</h2>
      <p id="delete-dialog-description" class="dialog-body">This deletes all projects, settings, and member access. It can't be undone.</p>
      <div class="dialog-actions">
        <button type="button" id="delete-dialog-cancel" class="button secondary">Cancel</button>
        <button type="button" id="delete-dialog-confirm" class="button danger">Delete workspace</button>
      </div>
    </div>
  </div>

  <script>
    (function () {
      'use strict';

      const removeDialog = document.getElementById('remove-dialog');
      const deleteDialog = document.getElementById('delete-dialog');
      const memberList = document.querySelector('#team .member-list');
      const projectList = document.getElementById('projects-list');
      const projectsEmpty = document.getElementById('projects-empty');
      const projectsToolbar = document.getElementById('projects-toolbar');
      const createProjectButton = document.getElementById('create-project-button');

      let currentPanel = 'profile';
      let activeDialog = null;
      let lastFocused = null;
      let pendingMemberId = null;
      let memberCounter = 3;
      let projectCounter = 0;

      const projectNames = [
        'Onboarding docs',
        'Northwind launch',
        'Support portal',
        'Billing cleanup',
        'Customer research',
        'Documentation refresh'
      ];

      function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }

      function showPanel(name) {
        currentPanel = name;

        document.querySelectorAll('[data-panel]').forEach(function (panel) {
          panel.hidden = panel.getAttribute('data-panel') !== name;
        });

        document.querySelectorAll('[data-nav]').forEach(function (button) {
          if (button.getAttribute('data-nav') === name) {
            button.classList.add('active');
            button.setAttribute('aria-current', 'page');
          } else {
            button.classList.remove('active');
            button.removeAttribute('aria-current');
          }
        });
      }

      function initFieldAccessibility() {
        document.querySelectorAll('[data-field]').forEach(function (input) {
          const described = input.getAttribute('aria-describedby') || '';
          input.dataset.baseDescribed = described;
        });
      }

      function clearPanelMessages(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        panel.querySelectorAll('[data-error]').forEach(function (errorEl) {
          errorEl.hidden = true;
          errorEl.textContent = '';
        });

        panel.querySelectorAll('[data-field]').forEach(function (input) {
          input.removeAttribute('aria-invalid');
          const base = input.dataset.baseDescribed || '';
          if (base) {
            input.setAttribute('aria-describedby', base);
          } else {
            input.removeAttribute('aria-describedby');
          }
        });

        const status = panel.querySelector('[role="status"]');
        if (status) {
          status.hidden = true;
          status.textContent = '';
        }
      }

      function showError(input, errorEl, message) {
        if (!errorEl) return;

        errorEl.textContent = message;
        errorEl.hidden = false;

        if (input) {
          input.setAttribute('aria-invalid', 'true');
          const base = input.dataset.baseDescribed || '';
          const ids = base ? base.split(/\s+/).filter(Boolean) : [];

          if (errorEl.id && ids.indexOf(errorEl.id) === -1) {
            ids.push(errorEl.id);
          }

          if (ids.length) {
            input.setAttribute('aria-describedby', ids.join(' '));
          } else {
            input.removeAttribute('aria-describedby');
          }
        }
      }

      function showStatus(panelId, message) {
        clearPanelMessages(panelId);

        const panel = document.getElementById(panelId);
        if (!panel) return;

        const status = panel.querySelector('[role="status"]');
        if (!status) return;

        status.textContent = message;
        status.hidden = false;
      }

      function openDialog(dialog) {
        if (!dialog) return;
        if (activeDialog === dialog) return;

        if (activeDialog) {
          if (activeDialog === removeDialog) {
            pendingMemberId = null;
          }
          activeDialog.hidden = true;
          activeDialog = null;
        }

        lastFocused = document.activeElement;
        dialog.hidden = false;
        activeDialog = dialog;
        document.body.classList.add('dialog-open');

        const firstButton = dialog.querySelector('button');
        if (firstButton) {
          firstButton.focus();
        }
      }

      function closeDialog(dialog) {
        if (!dialog || dialog.hidden) return;

        if (dialog === removeDialog) {
          pendingMemberId = null;
        }

        dialog.hidden = true;

        if (activeDialog === dialog) {
          activeDialog = null;
        }

        if (lastFocused && document.contains(lastFocused)) {
          lastFocused.focus();
        } else {
          const panel = document.getElementById(currentPanel);
          if (panel) {
            panel.focus();
          }
        }

        lastFocused = null;

        if (!activeDialog) {
          document.body.classList.remove('dialog-open');
        }
      }

      document.addEventListener('keydown', function (event) {
        if (!activeDialog || activeDialog.hidden) return;

        if (event.key === 'Escape') {
          event.preventDefault();
          closeDialog(activeDialog);
          return;
        }

        if (event.key === 'Tab') {
          const buttons = Array.from(activeDialog.querySelectorAll('button')).filter(function (button) {
            return !button.disabled;
          });

          if (buttons.length === 0) return;

          const first = buttons[0];
          const last = buttons[buttons.length - 1];

          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      });

      function initialsFor(name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 0 || parts[0] === '') return 'User';
        return parts
          .slice(0, 2)
          .map(function (part) {
            return part.charAt(0).toUpperCase();
          })
          .join('');
      }

      function saveProfile() {
        clearPanelMessages('profile');

        const nameInput = document.getElementById('profile-name');
        const emailInput = document.getElementById('profile-email');
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        let valid = true;

        if (!name) {
          showError(nameInput, document.getElementById('profile-name-error'), 'Enter your full name so teammates can recognize you.');
          valid = false;
        }

        if (!isValidEmail(email)) {
          showError(emailInput, document.getElementById('profile-email-error'), 'Enter a valid email address.');
          valid = false;
        }

        if (!valid) return;

        document.getElementById('account-name').textContent = name;
        document.getElementById('account-email').textContent = email;
        document.querySelector('.account-avatar').textContent = initialsFor(name);

        showStatus('profile', 'Your profile is saved.');
      }

      function saveNotifications() {
        showStatus('notifications', 'Notification preferences saved.');
      }

      function openRemoveDialog(memberId) {
        const row = document.querySelector('[data-member="' + memberId + '"]');
        if (!row) return;

        const nameEl = row.querySelector('.member-name');
        const name = nameEl ? nameEl.textContent : 'member';

        pendingMemberId = memberId;
        document.getElementById('remove-dialog-title').textContent = 'Remove ' + name + ' from Northwind?';
        document.getElementById('remove-dialog-description').textContent = "This can't be undone. You can invite " + name + ' again later.';
        openDialog(removeDialog);
      }

      function generateMemberName(email) {
        const local = email.split('@')[0] || 'member';
        const parts = local.split(/[._-]+/).filter(Boolean);

        if (parts.length === 0) return 'New member';

        return parts
          .map(function (part) {
            return part.charAt(0).toUpperCase() + part.slice(1);
          })
          .join(' ');
      }

      function createMemberRow(id, name, email, role) {
        if (!memberList) return;

        const row = document.createElement('li');
        row.className = 'member';
        row.setAttribute('data-member', id);

        const info = document.createElement('div');
        info.className = 'member-info';

        const nameEl = document.createElement('p');
        nameEl.className = 'member-name';
        nameEl.textContent = name;

        const emailEl = document.createElement('p');
        emailEl.className = 'member-email';
        emailEl.textContent = email;

        info.appendChild(nameEl);
        info.appendChild(emailEl);

        const side = document.createElement('div');
        side.className = 'member-side';

        const badge = document.createElement('span');
        badge.className = 'role-badge';
        badge.textContent = role;

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'button danger';
        removeButton.dataset.action = 'remove-member';
        removeButton.dataset.memberId = id;
        removeButton.textContent = 'Remove';
        removeButton.setAttribute('aria-label', 'Remove ' + name + ' from Northwind');
        removeButton.addEventListener('click', function () {
          openRemoveDialog(id);
        });

        side.appendChild(badge);
        side.appendChild(removeButton);

        row.appendChild(info);
        row.appendChild(side);
        memberList.appendChild(row);
      }

      function inviteTeamMember() {
        clearPanelMessages('team');

        const input = document.getElementById('invite-email');
        const email = input.value.trim();

        if (!isValidEmail(email)) {
          showError(input, document.getElementById('invite-email-error'), 'Enter a valid email address so we can invite them.');
          return;
        }

        const name = generateMemberName(email);
        const id = 'member-invite-' + memberCounter;
        memberCounter += 1;

        createMemberRow(id, name, email, 'Member');
        input.value = '';

        showStatus('team', 'Added ' + name + ' to Northwind.');
      }

      function getProjectName(index) {
        const base = projectNames[index % projectNames.length];
        const repeat = Math.floor(index / projectNames.length) + 1;
        return repeat > 1 ? base + ' ' + repeat : base;
      }

      function createProjectItem(id, name) {
        const item = document.createElement('li');
        item.className = 'project-card';
        item.setAttribute('data-project', id);

        const nameEl = document.createElement('p');
        nameEl.className = 'project-name';
        nameEl.textContent = name;

        const metaEl = document.createElement('p');
        metaEl.className = 'project-meta';
        metaEl.textContent = 'Active';

        item.appendChild(nameEl);
        item.appendChild(metaEl);

        return item;
      }

      function createProject() {
        clearPanelMessages('projects');

        const index = projectCounter;
        const name = getProjectName(index);
        projectCounter += 1;

        if (projectList) {
          projectList.hidden = false;
          projectList.appendChild(createProjectItem('project-' + index, name));
        }

        if (createProjectButton && projectsEmpty && projectsEmpty.contains(createProjectButton)) {
          const slot = document.getElementById('project-toolbar-slot');
          if (slot) {
            slot.appendChild(createProjectButton);
          }
        }

        if (projectsEmpty) {
          projectsEmpty.hidden = true;
        }

        if (projectsToolbar) {
          projectsToolbar.hidden = false;
        }

        showStatus('projects', 'Created ' + name + '.');
      }

      function formatCardNumber(input) {
        const allDigits = input.value.replace(/\D/g, '');
        const digits = allDigits.slice(0, 16);
        input.dataset.overLength = allDigits.length > 16 ? 'true' : 'false';

        const groups = digits.match(/.{1,4}/g) || [];
        const formatted = groups.join(' ');

        if (input.value !== formatted) {
          input.value = formatted;
        }
      }

      function pay() {
        clearPanelMessages('billing');

        const input = document.getElementById('card-number');
        const digits = input.value.replace(/\D/g, '');

        if (input.dataset.overLength === 'true' || digits.length !== 16) {
          showError(input, document.getElementById('card-number-error'), 'Enter a 16-digit card number.');
          return;
        }

        if (digits === '4000000000000002') {
          showError(
            input,
            document.getElementById('card-number-error'),
            'Payment declined. Your card was declined by your bank. Try a different card or contact your bank.'
          );
          return;
        }

        showStatus('billing', 'Payment method updated.');
      }

      function openDeleteDialog() {
        openDialog(deleteDialog);
      }

      initFieldAccessibility();
      showPanel('profile');

      document.querySelectorAll('[data-nav]').forEach(function (button) {
        button.addEventListener('click', function () {
          showPanel(button.getAttribute('data-nav'));
        });
      });

      document.querySelectorAll('[data-switch]').forEach(function (button) {
        button.addEventListener('click', function () {
          const checked = button.getAttribute('aria-checked') === 'true';
          button.setAttribute('aria-checked', String(!checked));
        });
      });

      document.getElementById('profile-form').addEventListener('submit', function (event) {
        event.preventDefault();
        saveProfile();
      });

      document.querySelector('[data-action="save-profile"]').addEventListener('click', saveProfile);

      document.querySelector('[data-action="save-notifications"]').addEventListener('click', saveNotifications);

      document.querySelectorAll('[data-action="remove-member"]').forEach(function (button) {
        button.addEventListener('click', function () {
          openRemoveDialog(button.dataset.memberId);
        });
      });

      document.getElementById('remove-dialog-cancel').addEventListener('click', function () {
        closeDialog(removeDialog);
      });

      document.getElementById('remove-dialog-confirm').addEventListener('click', function () {
        if (pendingMemberId) {
          const row = document.querySelector('[data-member="' + pendingMemberId + '"]');
          if (row) {
            row.remove();
          }
          showStatus('team', 'Member removed.');
          pendingMemberId = null;
        }
        closeDialog(removeDialog);
      });

      document.getElementById('invite-form').addEventListener('submit', function (event) {
        event.preventDefault();
        inviteTeamMember();
      });

      document.querySelector('[data-action="invite"]').addEventListener('click', inviteTeamMember);

      if (createProjectButton) {
        createProjectButton.addEventListener('click', createProject);
      }

      document.getElementById('card-form').addEventListener('submit', function (event) {
        event.preventDefault();
        pay();
      });

      document.querySelector('[data-action="pay"]').addEventListener('click', pay);

      const cardNumberInput = document.getElementById('card-number');
      cardNumberInput.addEventListener('input', function () {
        formatCardNumber(cardNumberInput);
      });

      document.querySelector('[data-action="delete-workspace"]').addEventListener('click', openDeleteDialog);

      document.getElementById('delete-dialog-cancel').addEventListener('click', function () {
        closeDialog(deleteDialog);
      });

      document.getElementById('delete-dialog-confirm').addEventListener('click', function () {
        showStatus('danger', 'Northwind deleted.');
        closeDialog(deleteDialog);
      });
    })();
  </script>
</body>
</html>
```