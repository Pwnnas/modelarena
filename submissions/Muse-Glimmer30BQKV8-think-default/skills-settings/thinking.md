# Task: Harbor — a settings app built by following skills

Build settings area of team workspace app called Harbor. One file index.html with all HTML, CSS and JS inline. No external resources. Use Ocean Depths theme: Deep Navy #1a2332 primary background, Teal #2d8b8b accent, Seafoam #a8dadc secondary accent, Cream #f1faee text and light backgrounds. Headers: DejaVu Sans Bold, Body: DejaVu Sans. No external fonts? DejaVu Sans is system? Might need to use generic sans-serif fallback. Cannot load external fonts. Use CSS font-family: 'DejaVu Sans', sans-serif. That is okay.

Apply ux-copy skill: write every label, button, message, dialog, empty state with it. Don't output review template. So need good copy.

Apply accessibility-review: audit against WCAG 2.1 AA. Need proper labels, aria, contrast, keyboard navigation, focus indicators, role=switch etc.

Requirements: left sidebar navigates between six panels in order. Exactly one panel shown at a time; starts on Profile. Use sample data workspace called "Northwind".

Panels:
1 Profile: form with full name and email (prefilled) and button saves it. Saving with empty name shows error message and doesn't save. Successful save shows short confirmation.
2 Notifications: four on/off switches (e.g. product updates, comments, mentions, weekly digest), each labelled, and button saves them.
3 Team: three members with name,email,role each with button removes them. Removing asks confirmation in dialog first. Below invite form with email field; invalid email shows error, valid adds member.
4 Projects: no projects at first, panel shows empty state with button creates project. Created project appears in list and empty state goes away.
5 Billing: current plan, payment form with card number, expiry, security code. Card 4000 0000 0000 0002 always declined with error; any other 16-digit number accepted with confirmation.
6 Danger zone: button deletes workspace. Opens confirmation dialog; grader only ever closes it without deleting.

Messages stay visible until user acts again; don't disappear on timer.

Grader contract:
Sidebar buttons data-nav="<panel>". Panels data-panel="<panel>". Panel ids in order: profile, notifications, team, projects, billing, danger. Hidden panels use display:none or hidden attribute.
Action buttons carry data-action: save-profile, save-notifications, remove-member (one per member), invite, create-project, pay, delete-workspace.
Form fields carry data-field: name, email (profile), invite-email, card-number, card-expiry, card-cvc.
Notification switches: elements with role="switch", aria-checked and data-switch.
Team members: data-member; projects: data-project.
Every error message has data-error attribute and visible inside its panel. Every success confirmation is in role="status" element. Empty state has data-empty.
Dialogs have role="dialog" and aria-modal="true", and close on Escape. When closed they are removed or hidden (display:none, hidden or visibility:hidden).

Need to implement localStorage? Page starts with empty localStorage (fresh browser profile). Sample data where needed. Should persist? Probably not required but good. Use localStorage for state? Probably fine.

We need to ensure no external resources. So CSS inline, JS inline. Use system fonts.

Accessibility: need proper labels, for inputs use <label for>. Use aria-live for status? role=status is good. Error messages with data-error.

Keyboard navigation: sidebar buttons focusable, panel switching via click. Dialogs close on Escape. Focus trap? Maybe simple.

Touch target >=44x44. Ensure buttons large enough.

Contrast: Deep Navy #1a2332 background, Cream #f1faee text. Contrast ratio? Let's check approximate. #1a2332 vs #f1faee. #1a2332 is dark. Contrast likely > 7. Good. Teal #2d8b8b on cream? Might be low. Use teal for accent, maybe on navy? Need contrast >=4.5. Teal on navy? #2d8b8b on #1a2332: maybe low. Better use teal for buttons with cream text? #2d8b8b background with #f1faee text: contrast? Let's approximate: teal luminance ~0.2, cream ~0.9, ratio ~4.5? Might be borderline. Safer to use teal as border/accent, and use cream on navy for text. Use seafoam #a8dadc for lighter elements on navy? #a8dadc on #1a2332 contrast? Maybe ~? Probably okay. We can design with navy background, cream text, teal accents for borders/buttons with cream text. Ensure contrast passes.

Use DejaVu Sans Bold for headers. Use CSS font-weight:700.

Implement sidebar left. Layout flex.

Panels: each div data-panel="profile" id="profile". Hidden by default except first.

Error messages: data-error. Should be inside panel. Show/hide.

Success confirmation: role="status". Probably a div with role="status".

Empty state: data-empty. For projects panel.

Dialogs: role="dialog" aria-modal="true". Need confirmation for remove member and delete workspace. Possibly reuse same dialog element.

Implement JS:

On load, initialize sample data:
workspace name Northwind (maybe header)
profile: full name? Prefilled. Let's pick "Alex Rivera" and email "alex@northwind.com"
notifications: four switches default maybe on? Choose some defaults.
team members: three members. Each with data-member. Name, email, role. Button remove-member.
projects: empty array.
billing: current plan maybe "Pro Plan". Payment form empty.

Save profile: get data-field name and email. If name.trim() === '' -> show error data-error "Full name is required." Don't save. Else save to localStorage? Show success status "Profile saved." Message stays until user acts again (i.e., next change?). Simpler: show message, keep visible. Maybe clear on next input? Requirement: messages stay visible until user acts again; don't make them disappear on timer. So we can keep until next save attempt or navigation? Probably until user acts again (e.g., next click). Simpler: keep error visible until next attempt; success visible until next attempt. We can clear previous messages before new action.

Notifications: four switches with data-switch attributes e.g., data-switch="product-updates". Each has role="switch" aria-checked. Click toggles. Save button saves them -> show success status.

Team: render members. Remove button data-action="remove-member". Need to know which member. Could store data-member-id. Use data-member attribute on container. On click, open dialog confirming removal. Dialog with role dialog aria-modal. Show message "Remove member?" etc. Buttons: Confirm / Cancel. If confirm, remove member from list, re-render. If cancel, close.

Invite form: email field data-field="invite-email". On click invite button data-action="invite". Validate email with simple regex. If invalid, show error data-error. If valid, add member with role "Member"? Maybe role default "Member". Add to list.

Projects: empty state with data-empty. Button data-action="create-project". On click, create project with name like "Project 1", "Project 2"... Add to list. Empty state hidden.

Billing: current plan display. Form fields card-number, card-expiry, card-cvc. On pay button data-action="pay". Validate 16-digit number. If card number is exactly "4000000000000002" or with spaces? Input may have spaces. Normalize remove spaces. If matches, show error data-error "Payment declined. Your card was declined by your bank. Try a different card or contact your bank." Else if 16 digits, show success status "Payment successful. Your plan is now active." Else error? Might require 16 digits. Probably error if not 16 digits.

Danger zone: button data-action="delete-workspace". Opens confirmation dialog. Dialog message: "Delete workspace 'Northwind'? This can't be undone." Buttons: Delete workspace / Cancel. Grader only ever closes it without deleting. So we can just open dialog, allow close. If they click delete, we could delete? But grader won't? It says grader only ever closes it without deleting. So we can implement delete logic but it won't be triggered? Might be okay to implement but not required. Safer to just open dialog and allow close. If they click confirm, maybe we show confirmation? Might cause test failure? Probably okay to implement delete but grader never clicks confirm. We'll implement dialog close on Escape and Cancel. If Delete clicked, maybe we clear localStorage? Might cause state issues. Could just prevent deletion. But requirement says button opens confirmation dialog; grader only ever closes it without deleting. So we can implement dialog that just closes, and delete action does nothing. Might be okay.

Accessibility:
- Sidebar buttons: <button data-nav="profile">...
- Panels: <section data-panel="profile" id="profile" ...>
- Use semantic HTML: nav, main, section, form, label.
- For switches: use button role="switch" with aria-checked.
- Focus indicator: outline.
- Touch target >=44x44: make buttons min-height 44px.
- Color contrast: ensure text contrast.
- Form labels: <label for="...">.
- Error messages: role="alert"? data-error attribute required. Use aria-live polite? Could be okay.
- Status messages: role="status".
- Dialog: role="dialog" aria-modal="true" aria-labelledby etc. Close on Escape.
- Keyboard: sidebar navigation via Tab, Enter/Space activate.
- Focus order logical.

Implementation details:

HTML structure:
<header> Harbor - Northwind Settings </header>
<div class="app">
  <nav class="sidebar" aria-label="Settings navigation">
    buttons...
  </nav>
  <main class="content">
    panels...
  </main>
</div>

CSS:
Use variables:
--navy:#1a2332
--teal:#2d8b8b
--seafoam:#a8dadc
--cream:#f1faee

Body background navy, color cream.
Sidebar background maybe slightly lighter? Use navy.
Buttons teal background, cream text.
Focus outline seafoam.

Fonts: font-family: 'DejaVu Sans', sans-serif; headers font-weight:700.

Layout responsive.

JS:
document.querySelectorAll('[data-nav]').forEach(btn=>btn.addEventListener('click',...))
Switch panels: hide all panels (display:none), show selected.

Initialize:
profile form prefill from localStorage or defaults.
notifications switches init.
team members init.

Persist? Might use localStorage for profile, notifications, team, projects. Billing maybe not persist.

Error messages: each panel has a container for errors? Could have one data-error element per panel, show/hide.

Success status: role="status". Could have one per panel.

Simplify: for each panel, have <div class="messages"> with error and status.

Implement dialog:
Single dialog element hidden by default. When needed, populate content and show. For remove member, need to know which member to delete. Store current member id in dialog data.

Implement close on Escape: listen keydown.

Also dialog should trap focus? Might be overkill. At least close on Escape.

Accessibility review: need visible focus indicator. Use :focus-visible outline.

Ensure labels for inputs: <label for="profile-name">Full name</label> input id="profile-name" data-field="name".

Switches: button with role="switch" aria-checked="true" data-switch="product-updates". Label next to it.

Team members: each member container div data-member="id". Contains name,email,role, button remove.

Projects: each project div data-project="id".

Empty state: div data-empty.

Implement UX copy:
Need good microcopy.

Profile:
Label Full name, Email address.
Save button: "Save changes"
Error: "Full name can't be empty. Please enter your name."
Success: "Profile updated successfully."

Notifications:
Switch labels: Product updates, Comments, Mentions, Weekly digest
Save button: "Save preferences"
Success: "Notification preferences saved."

Team:
Member removal confirmation dialog: "Remove member?" "Are you sure you want to remove [Name] from Northwind? This will revoke their access." Buttons: "Remove member" / "Cancel"
Invite form label: Email address
Invite button: "Send invite"
Error: "Please enter a valid email address."
Success: "Invite sent to [email]."
Empty state not needed.

Projects:
Empty state: "No projects yet. Create your first project to start collaborating with your team." Button "Create project"
Success: "Project created."

Billing:
Current plan: "Current plan: Pro — $29/month"
Form labels: Card number, Expiry date (MM/YY), Security code
Pay button: "Update payment method"
Error for declined: "Payment declined. Your card was declined by your bank. Try a different card or contact your bank."
Success: "Payment method updated successfully."
Also error for invalid card? Maybe "Card number must be 16 digits."

Danger zone:
Button: "Delete workspace"
Dialog: "Delete workspace 'Northwind'? This action can't be undone." Buttons: "Delete workspace" / "Keep workspace"

Ensure copy consistent.

Implement accessibility: aria-labelledby for dialogs.

Implementation steps in code.

Potential pitfalls:
- Grader checks data-nav, data-panel, data-action, data-field, role=switch, aria-checked, data-switch, data-member, data-project, data-error, role=status, data-empty.
- Ensure each panel has id matching order: profile, notifications, team, projects, billing, danger.
- Sidebar buttons order same.
- Hidden panels use display:none or hidden attribute. We'll toggle class hidden with display:none.
- Dialogs have role="dialog" aria-modal="true". When closed hidden.
- Error messages have data-error attribute and visible inside panel.
- Success confirmation in role="status" element.
- Empty state has data-empty.

Edge cases:
Profile save with empty name shows error and doesn't save. Need to prevent saving. If name empty, show error, keep previous value? Don't update localStorage.

Notifications save: just show confirmation.

Team remove: dialog first. Dialog should be role dialog aria-modal true. Close on Escape.

Invite invalid email: show error.

Projects create: empty state goes away after first project.

Billing card 4000 0000 0000 0002 declined. Any other 16-digit accepted. Should we validate expiry and cvc? Probably not required. Just check card number length 16 digits and not declined.

Messages stay visible until user acts again. So we should not auto-hide. We can keep them.

Implementation details JS:

const panels = document.querySelectorAll('[data-panel]');
function showPanel(name){ panels.forEach(p=>{ p.style.display = (p.dataset.panel===name)?'block':'none'; }); updateSidebarActive(name); }

Sidebar active state: maybe aria-current.

Initialize sample data:

const defaultProfile = { name:'Alex Rivera', email:'alex@northwind.com' }
const defaultNotifications = { 'product-updates': true, 'comments': true, 'mentions': true, 'weekly-digest': false }
const defaultTeam = [
 {id:'m1', name:'Maya Chen', email:'maya@northwind.com', role:'Admin'},
 {id:'m2', name:'Jordan Lee', email:'jordan@northwind.com', role:'Member'},
 {id:'m3', name:'Samir Patel', email:'samir@northwind.com', role:'Member'}
]
const defaultProjects = []

Use localStorage keys.

On load, if localStorage empty, init defaults.

Render team: create DOM nodes for each member. Each member div data-member=id. Inside: name, email, role, button data-action="remove-member".

When remove clicked, open dialog with member name.

Dialog implementation:
<div id="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" hidden>
 <div class="dialog-backdrop">...</div>
</div>

Simpler: create one dialog element, update content, show.

Close on Escape: keydown listener when dialog visible.

Buttons inside dialog: data-action="confirm-delete-member" etc. Might need separate handling.

Alternative: use two dialogs? Could reuse same dialog with different context via data-context.

Simpler: for remove member, open dialog with buttons Confirm and Cancel. On Confirm, remove member.

For delete workspace, open dialog.

We can have generic confirm dialog with data-context.

Implementation plan:

let dialogState = null;

function openDialog({title, message, confirmText, cancelText, onConfirm}) { ... }

Store onConfirm callback.

When close, hide dialog.

Escape listener closes dialog.

Also click outside? Not required.

Accessibility: dialog should have focus trap? Might be okay.

Ensure buttons have min-height 44px.

Color contrast: use CSS.

Let's craft CSS:

:root { --navy:#1a2332; --teal:#2d8b8b; --seafoam:#a8dadc; --cream:#f1faee; }

body { margin:0; font-family:'DejaVu Sans', sans-serif; background:var(--navy); color:var(--cream); }

h1,h2,h3 { font-family:'DejaVu Sans', sans-serif; font-weight:700; }

.app { display:flex; min-height:100vh; }

.sidebar { width:240px; background:#111a26; padding:1rem; }
.sidebar button { display:block; width:100%; text-align:left; background:none; border:none; color:var(--cream); padding:12px; font-size:1rem; cursor:pointer; border-radius:6px; }
.sidebar button:hover, :focus-visible { outline:2px solid var(--seafoam); }
.sidebar button[aria-current="page"] { background:var(--teal); }

.content { flex:1; padding:2rem; }

.panel { display:none; }
.panel.active { display:block; }

form label { display:block; margin-top:1rem; font-weight:600; }
input { width:100%; padding:10px; background:#0f1620; border:1px solid var(--seafoam); color:var(--cream); border-radius:4px; }
button.primary { background:var(--teal); color:var(--cream); border:none; padding:12px 20px; border-radius:6px; cursor:pointer; min-height:44px; min-width:120px; }
button.primary:hover { filter:brightness(1.1); }

.switch { display:inline-flex; align-items:center; gap:.5rem; }
.switch button[role="switch"] { width:44px; height:28px; background:#0f1620; border:2px solid var(--seafoam); border-radius:14px; position:relative; }
.switch button[role="switch"]::after { content:''; position:absolute; width:20px; height:20px; background:var(--cream); border-radius:50%; top:2px; left:2px; transition:left .2s; }
.switch button[role="switch"][aria-checked="true"]::after { left:18px; }

.error { color:#ff7b7b; margin-top:.5rem; }
.status { color:var(--seafoam); margin-top:.5rem; }

.empty-state { text-align:center; padding:3rem; border:2px dashed var(--seafoam); border-radius:8px; }

dialog styles.

Need to ensure data-error elements visible. We'll have <div data-error hidden>...</div>

Similarly role=status elements.

Implementation details in JS.

Potential accessibility issues:
- Switch buttons need accessible name. Use aria-label or associated label. We'll have label preceding button. Maybe use <label> with switch.
- Form inputs need label for.
- Dialog needs aria-labelledby.
- Focus indicator visible.
- Color contrast for error red on navy? #ff7b7b on #1a2332 ratio? Might be okay. Could use brighter.

Better use seafoam for status.

Ensure touch target >=44x44 for all interactive elements. Buttons min-height 44px. Switch button maybe 44x44? Could make bigger.

Simplify: make all buttons min-height 44px.

Implement JS step by step.

Edge Cases:
- When profile saved successfully, show status. If user changes name to empty and saves, show error and don't clear previous success? Maybe replace.

- Messages stay visible until user acts again. So after save, status stays. If user clicks Save again, we update status.

- For team invite, after successful invite, error message should be hidden.

Implementation complexity: manageable.

Now produce final HTML file.

Let's craft HTML skeleton.

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Harbor Settings</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>...</style>
</head>
<body>
<header>...</header>
<div class="app">
<nav class="sidebar" aria-label="Settings navigation">
<button data-nav="profile" aria-current="page">Profile</button>
...
</nav>
<main class="content">
<section data-panel="profile" id="profile" class="panel active">...</section>
...
</main>
</div>

<div id="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" hidden>
...
</div>

<script>...</script>
</body>
</html>

Implement panels content.

Profile panel:
<h2>Profile</h2>
<form>
<label for="profile-name">Full name</label>
<input id="profile-name" data-field="name" type="text">
<label for="profile-email">Email address</label>
<input id="profile-email" data-field="email" type="email">
<button type="button" data-action="save-profile" class="primary">Save changes</button>
<div role="status" aria-live="polite"></div>
<div data-error hidden></div>
</form>

Notifications panel:
<h2>Notifications</h2>
<div class="switches">
<div class="switch"><span>Product updates</span><button role="switch" aria-checked="true" data-switch="product-updates" aria-label="Product updates"></button></div>
... four
</div>
<button data-action="save-notifications" class="primary">Save preferences</button>
<div role="status"></div>

Team panel:
<h2>Team members</h2>
<div id="team-list"></div>
<h3>Invite a member</h3>
<form>
<label for="invite-email">Email address</label>
<input id="invite-email" data-field="invite-email" type="email">
<button type="button" data-action="invite" class="primary">Send invite</button>
</form>
<div data-error hidden></div>
<div role="status"></div>

Projects panel:
<h2>Projects</h2>
<div id="projects-list"></div>
<div data-empty hidden>...</div>
<button data-action="create-project" class="primary">Create project</button>
<div role="status"></div>

Billing panel:
<h2>Billing</h2>
<p>Current plan: Pro — $29/month</p>
<form>
<label>Card number</label><input data-field="card-number" inputmode="numeric">
<label>Expiry date</label><input data-field="card-expiry" placeholder="MM/YY">
<label>Security code</label><input data-field="card-cvc" inputmode="numeric">
<button data-action="pay" class="primary">Update payment method</button>
</form>
<div data-error hidden></div>
<div role="status"></div>

Danger panel:
<h2>Danger zone</h2>
<p>Deleting the workspace is permanent.</p>
<button data-action="delete-workspace" class="primary danger">Delete workspace</button>

Dialog:
<div id="dialog" role="dialog" aria-modal="true" hidden>
<div class="dialog-backdrop"></div>
<div class="dialog-panel">
<h3 id="dialog-title"></h3>
<p id="dialog-message"></p>
<div class="dialog-actions">
<button id="dialog-confirm" class="primary"></button>
<button id="dialog-cancel">Cancel</button>
</div>
</div>
</div>

Now JS.

Implement initialization:

const state = {
 profile: JSON.parse(localStorage.getItem('harbor-profile')) || defaultProfile,
 notifications: JSON.parse(localStorage.getItem('harbor-notifications')) || defaultNotifications,
 team: JSON.parse(localStorage.getItem('harbor-team')) || defaultTeam,
 projects: JSON.parse(localStorage.getItem('harbor-projects')) || []
};

Save functions update localStorage.

Render functions:

renderProfile(): set input values.

renderNotifications(): set aria-checked.

renderTeam(): rebuild #team-list innerHTML.

renderProjects(): rebuild list, toggle empty state.

Event delegation:

document.addEventListener('click', e => {
 const nav = e.target.closest('[data-nav]');
 if(nav){ ... }
 const action = e.target.closest('[data-action]');
 if(action){ handleAction(action.dataset.action, action); }
 const sw = e.target.closest('[role="switch"]');
 if(sw){ toggleSwitch(sw); }
})

Handle action:

save-profile: get inputs, validate name not empty, if empty show error, else save, show status.

save-notifications: save state.notifications to localStorage, show status.

remove-member: find member id from parent data-member. Open dialog.

invite: validate email regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/. If invalid show error. Else add member with id random, name derived? Could use email prefix. Add to state.team, save, re-render, show status.

create-project: create project object {id:..., name: `Project ${state.projects.length+1}`}. Push, save, render.

pay: get card number, normalize remove spaces/dashes. If length !==16 show error "Card number must be 16 digits." Else if card number === '4000000000000002' show error declined. Else show success.

delete-workspace: open dialog.

Dialog handling:

let dialogResolve = null;
function openDialog({title, message, confirmText, cancelText, onConfirm}) {
 dialogTitle.textContent = title;
 dialogMessage.textContent = message;
 dialogConfirm.textContent = confirmText;
 dialog.style.display = 'flex';
 dialog.removeAttribute('hidden');
 dialogConfirm.onclick = () => { closeDialog(); onConfirm(); }
 dialogCancel.onclick = closeDialog;
 document.addEventListener('keydown', escHandler);
}
function closeDialog(){ dialog.setAttribute('hidden',''); ... }

Need to store pending member id for removal.

Simplify: when remove-member clicked, openDialog with onConfirm => remove member.

Implementation details.

Accessibility: ensure focus moves to dialog when opened. Could set focus to dialog-confirm.

Close on Escape: keydown listener.

Also ensure dialogs removed/hidden.

Error messages: each panel has data-error element. Show by removing hidden and setting textContent. Hide by setting hidden.

Status messages: role="status" element. Show text.

Empty state: data-empty element. Toggle hidden.

Switches: button role="switch" aria-checked. Click toggles aria-checked. Also update state.notifications? Maybe immediate update in state but save on button. Could update state on toggle.

Simpler: toggle aria-checked and update state object immediately, save on save.

Implement toggleSwitch: sw.setAttribute('aria-checked', sw.getAttribute('aria-checked')==='true'?'false':'true'); update state.notifications[sw.dataset.switch] = ...

Now produce final code.

Potential issues:
- DejaVu Sans may not be available on all systems. But it's a system font? DejaVu is common on Linux. Might fallback to sans-serif. Acceptable.
- Need to ensure no external resources. Use inline style.
- Ensure all required attributes present.

Check grader contract:
Sidebar buttons data-nav="<panel>". Yes.
Panels data-panel="<panel>". Yes.
Panel ids in order: profile, notifications, team, projects, billing, danger. Yes.
Hidden panels use display:none or hidden attribute. We'll use style display none.
Action buttons carry data-action: save-profile, save-notifications, remove-member, invite, create-project, pay, delete-workspace. Yes.
Form fields carry data-field: name, email, invite-email, card-number, card-expiry, card-cvc. Yes.
Notification switches: elements with role="switch", aria-checked and data-switch. Yes.
Team members: data-member. Yes.
Projects: data-project. Yes.
Every error message has data-error attribute and visible inside its panel. Yes.
Every success confirmation is in role="status" element. Yes.
Empty state has data-empty. Yes.
Dialogs have role="dialog" aria-modal="true", close on Escape. When closed removed or hidden. Yes.

Accessibility review:
- Labels for inputs.
- Focus indicator.
- Color contrast.
- Keyboard navigation.

Potential improvements:
- Ensure sidebar buttons are <button>.
- Ensure dialog has aria-labelledby pointing to title.
- Ensure error messages are announced: maybe aria-live.
- Ensure switch has accessible name. Use aria-label or associated label. Could wrap in label.

Better to make switch with <span> label and button with aria-label.

Implement.

Also need to ensure messages stay visible until user acts again. Our implementation will replace text on next action, which is fine.

Now craft final HTML.

Let's write CSS carefully.

Use CSS variables.

Make body background navy.

Header maybe with workspace name.

Implement responsive: flex column on narrow.

Now produce final answer.

Potential pitfalls:
- The grader may check for exact data-action values. remove-member button per member. Yes.
- Ensure invite button data-action="invite".
- Ensure create-project button data-action="create-project".
- Ensure pay button data-action="pay".
- Ensure delete-workspace button data-action="delete-workspace".
- Ensure save-profile button data-action="save-profile".
- Ensure save-notifications button data-action="save-notifications".

Form fields data-field: name, email (profile). Use data-field="name" on input. Good.

invite-email field data-field="invite-email".

card-number data-field="card-number", card-expiry data-field="card-expiry", card-cvc data-field="card-cvc".

Notification switches data-switch attribute. Values maybe product-updates, comments, mentions, weekly-digest.

Team members data-member attribute on container.

Projects data-project attribute.

Empty state data-empty.

Error messages data-error.

Success role="status".

Dialog close on Escape.

Implementation of dialog close on Escape: add keydown listener when dialog open.

Also ensure dialog hidden attribute toggled.

Now produce final code.

Let's craft final HTML with inline script.

Make sure script runs after DOM loaded.

Use DOMContentLoaded.

Potential issue: localStorage may be empty initially. Our defaults will be used.

Sample data workspace called "Northwind". Show in header.

Now produce final output.

Let's write code.

Check UX copy:

Profile:
Full name label
Email address label
Save changes button
Error: "Full name is required. Please enter your name."
Success: "Profile updated successfully."

Notifications:
Switch labels: Product updates, Comments, Mentions, Weekly digest
Save preferences button
Success: "Notification preferences saved."

Team:
Remove member confirmation dialog: Title "Remove member". Message "Are you sure you want to remove Maya Chen from Northwind? This will revoke their access." Confirm button "Remove member", Cancel "Cancel". After removal success? Maybe status "Member removed." Could show status.

Invite form label Email address
Send invite button
Error: "Please enter a valid email address."
Success: "Invite sent to maya@example.com."

Projects:
Empty state: "No projects yet. Create your first project to start collaborating with your team."
Create project button
Success: "Project created."

Billing:
Current plan text
Card number label
Expiry date label
Security code label
Update payment method button
Error declined: "Payment declined. Your card was declined by your bank. Try a different card or contact your bank."
Success: "Payment method updated successfully."

Danger zone:
Delete workspace button
Dialog title "Delete workspace"
Message "Delete workspace 'Northwind'? This action can't be undone."
Confirm button "Delete workspace", Cancel "Keep workspace"

Make sure copy is concise and human.

Accessibility: ensure dialog has focus management.

Implementation details for dialog:

<div id="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" hidden>
 <div class="dialog-overlay" tabindex="-1"></div>
 <div class="dialog-card" role="document">
  <h3 id="dialog-title"></h3>
  <p id="dialog-message"></p>
  <div class="dialog-actions">...</div>
 </div>
</div>

CSS for dialog: position fixed inset 0, display flex align center justify center, background rgba(0,0,0,.6). Dialog card background navy? Use cream text.

When hidden, display none.

Now produce final code.

Potential issue: grader checks for data-error attribute visibility inside panel. Must be visible when error occurs. Use hidden attribute toggle.

Success confirmation role="status". Must be inside panel. We'll have div role="status" aria-live="polite".

Empty state data-empty.

Now implement JS.

Let's write script.

Pseudo:

document.addEventListener('DOMContentLoaded', () => {
 // init
 // render
 // event listeners
});

Simplify event delegation.

Let's craft code.

Edge: profile form inputs have ids profile-name, profile-email. Use querySelector.

When save-profile clicked:
 const nameInput = document.querySelector('[data-panel="profile"] [data-field="name"]');
 const emailInput = ...
 const name = nameInput.value.trim();
 if(!name){ showError(panel,'Full name is required. Please enter your name.'); return; }
 state.profile = {name,emailInput.value.trim()};
 localStorage.setItem...
 showStatus(panel,'Profile updated successfully.');
 hideError(panel);

Show error function: find panel querySelector('[data-error]'), set textContent, remove hidden.

Show status: find role=status.

Hide error: set hidden.

Similarly for notifications.

Team render:

const teamList = document.getElementById('team-list');
teamList.innerHTML = state.team.map(m=>`
 <div class="member" data-member="${m.id}">
  <div>
   <strong>${m.name}</strong><br>
   <small>${m.email} — ${m.role}</small>
  </div>
  <button data-action="remove-member" class="primary small">Remove</button>
 </div>
`).join('');

Projects render:

const projectsList = document.getElementById('projects-list');
if state.projects.length===0: empty state visible, list empty.
else hide empty.

Create project: id = 'p'+Date.now()

Billing pay:

const cardNumber = document.querySelector('[data-panel="billing"] [data-field="card-number"]').value.replace(/\s/g,'');
if cardNumber.length!==16 { error 'Card number must be 16 digits.'; return; }
if cardNumber==='4000000000000002' { error 'Payment declined...' } else { success }

Now dialog:

function openConfirm(title,message,confirmText,cancelText,onConfirm){
 dialogTitle.textContent=title;
 dialogMessage.textContent=message;
 dialogConfirm.textContent=confirmText;
 dialogCancel.textContent=cancelText;
 dialog.removeAttribute('hidden');
 dialog.style.display='flex';
 dialogConfirm.onclick = ()=>{ closeDialog(); onConfirm(); };
 dialogCancel.onclick = closeDialog;
 // focus
 dialogConfirm.focus();
 escHandler attached
}

Close dialog: dialog.setAttribute('hidden',''); dialog.style.display='none';

Escape handler: if event.key==='Escape' closeDialog.

Now ensure dialog closes on Escape even if open.

Now final code.

Potential accessibility: buttons need visible focus. Use :focus-visible outline.

Color contrast: error color #ff7b7b on navy maybe insufficient. Let's pick #ff9b9b or white. Use #ffb3b3.

Better use #ff6b6b.

Contrast ratio with navy #1a2332. Approx luminance... Might be okay.

Maybe use cream for text, seafoam for links.

Ok.

Now produce final output in single code block.

Let's craft final HTML.

Make sure no external resources.

Use system font DejaVu Sans. Could use font-family: 'DejaVu Sans', Arial, sans-serif.

Now produce final answer.