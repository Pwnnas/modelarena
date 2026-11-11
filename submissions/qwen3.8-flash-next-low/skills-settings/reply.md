```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Harbor — Settings</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  body{font-family:'DejaVu Sans','Segoe UI',system-ui,sans-serif;font-size:15px;line-height:1.55;background:#1a2332;color:#f1faee}
  [hidden]{display:none!important}

  .app{display:flex;min-height:100vh}

  /* Sidebar */
  .sidebar{width:240px;min-width:240px;background:#1a2332;border-right:1px solid #2d4a5c;padding:24px 14px;display:flex;flex-direction:column}
  .sidebar-title{font-weight:bold;font-size:22px;letter-spacing:-.3px;color:#f1faee;margin-bottom:2px}
  .sidebar-workspace{font-size:13px;color:#a8dadc;margin-bottom:28px}
  .sidebar nav{display:flex;flex-direction:column;gap:2px}
  .nav-btn{display:block;width:100%;text-align:left;padding:10px 12px;border:1px solid transparent;background:none;color:#f1faee;font-family:inherit;font-size:14px;border-radius:6px;cursor:pointer;transition:background .12s}
  .nav-btn:hover{background:#243447}
  .nav-btn[aria-current="page"]{background:#2d8b8b;color:#f1faee;font-weight:bold}
  .nav-btn:focus-visible{outline:2px solid #a8dadc;outline-offset:2px}

  /* Main */
  main{flex:1;overflow-y:auto;padding:32px 40px 48px}
  .panel h2{font-weight:bold;font-size:22px;color:#f1faee;margin-bottom:4px}
  .panel-subtitle{color:#a8dadc;margin-bottom:24px;font-size:14px;max-width:520px}

  /* Forms */
  .form-group{margin-bottom:20px}
  .form-group label{display:block;font-size:14px;font-weight:bold;color:#f1faee;margin-bottom:6px}
  input[type="text"],input[type="email"]{width:100%;max-width:420px;padding:10px 12px;background:#243447;border:1px solid #2d4a5c;border-radius:6px;color:#f1faee;font-family:inherit;font-size:15px}
  input:focus-visible{outline:2px solid #a8dadc;outline-offset:2px;border-color:#2d8b8b}
  input[aria-invalid="true"]{border-color:#c0392b}

  /* Buttons */
  .btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 22px;border:none;border-radius:6px;font-family:inherit;font-size:15px;font-weight:bold;cursor:pointer;min-height:44px;min-width:44px;transition:background .12s}
  .btn-primary{background:#2d8b8b;color:#f1faee}
  .btn-primary:hover{background:#237878}
  .btn-primary:focus-visible{outline:2px solid #a8dadc;outline-offset:2px}
  .btn-danger{background:#c0392b;color:#f1faee}
  .btn-danger:hover{background:#a93226}
  .btn-danger:focus-visible{outline:2px solid #a8dadc;outline-offset:2px}
  .btn-secondary{background:transparent;border:1px solid #2d4a5c;color:#f1faee}
  .btn-secondary:hover{background:#243447}
  .btn-secondary:focus-visible{outline:2px solid #a8dadc;outline-offset:2px}

  /* Errors & Status */
  [data-error]{margin-top:10px;padding:10px 14px;background:#3a1a1a;border:1px solid #c0392b;border-radius:6px;color:#f1faee;font-size:14px;max-width:520px}
  [role="status"]{margin-top:14px;padding:10px 14px;background:#1a3a2a;border:1px solid #2d8b8b;border-radius:6px;color:#a8dadc;font-size:14px;max-width:520px}

  /* Switches */
  .switch-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;border:1px solid #2d4a5c;border-radius:8px;margin-bottom:8px;background:#243447}
  .switch-info{flex:1;min-width:0}
  .switch-name{font-size:15px;color:#f1faee;font-weight:bold;display:block}
  .switch-desc{font-size:13px;color:#a8dadc;margin-top:2px;display:block}
  .switch-toggle{width:52px;height:44px;border-radius:22px;border:2px solid #2d4a5c;background:#2d4a5c;cursor:pointer;position:relative;transition:background .18s,border-color .18s;padding:0;flex-shrink:0}
  .switch-toggle::after{content:'';position:absolute;width:24px;height:24px;border-radius:50%;background:#f1faee;top:8px;left:4px;transition:transform .18s}
  .switch-toggle[aria-checked="true"]{background:#2d8b8b;border-color:#2d8b8b}
  .switch-toggle[aria-checked="true"]::after{transform:translateX(18px)}
  .switch-toggle:focus-visible{outline:2px solid #a8dadc;outline-offset:2px}

  /* Team */
  .member-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border:1px solid #2d4a5c;border-radius:8px;margin-bottom:8px;background:#243447}
  .member-info{flex:1;min-width:0}
  .member-name{font-weight:bold;color:#f1faee}
  .member-role{font-size:12px;color:#a8dadc;background:#1a2332;padding:2px 8px;border-radius:4px;margin-left:8px}
  .member-email{font-size:13px;color:#a8dadc;margin-top:2px}
  .btn-remove{padding:8px 14px;min-height:44px;min-width:44px;background:transparent;border:1px solid #c0392b;color:#f1faee;border-radius:6px;font-family:inherit;font-size:13px;font-weight:bold;cursor:pointer;transition:background .12s}
  .btn-remove:hover{background:#3a1a1a}
  .btn-remove:focus-visible{outline:2px solid #a8dadc;outline-offset:2px}

  /* Empty state */
  .empty-state{text-align:center;padding:48px 24px;border:2px dashed #2d4a5c;border-radius:12px;background:#243447}
  .empty-state p{color:#a8dadc;margin-bottom:20px;font-size:15px;line-height:1.6}

  /* Project list */
  .project-list{list-style:none;margin-top:12px}
  .project-item{display:flex;align-items:center;gap:12px;padding:14px 16px;border:1px solid #2d4a5c;border-radius:8px;margin-bottom:8px;background:#243447}
  .project-name{font-weight:bold;color:#f1faee}
  .project-meta{font-size:13px;color:#a8dadc}

  /* Billing */
  .plan-info{padding:16px 18px;border:1px solid #2d4a5c;border-radius:8px;background:#243447;margin-bottom:24px}
  .plan-name{font-weight:bold;font-size:18px;color:#f1faee}
  .plan-price{color:#a8dadc;margin-top:4px;font-size:14px}
  .card-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px}
  .card-field{flex:1;min-width:160px}
  .card-field .form-group{margin-bottom:0}
  .card-field input{max-width:none}

  /* Danger zone */
  .danger-card{padding:24px;border:1px solid #c0392b;border-radius:12px;background:#2a1515}
  .danger-card h3{font-size:16px;font-weight:bold;margin-bottom:6px;color:#f1faee}
  .danger-card p{color:#a8dadc;font-size:14px;margin-bottom:18px;line-height:1.6}

  /* Section headings */
  .section-heading{font-size:16px;font-weight:bold;color:#f1faee;margin-bottom:12px;margin-top:8px}

  /* Divider */
  .divider{height:1px;background:#2d4a5c;margin:28px 0}

  /* Dialog */
  .dialog-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:1000;display:flex;align-items:center;justify-content:center}
  .dialog{background:#243447;border:1px solid #2d4a5c;border-radius:12px;padding:28px;max-width:460px;width:90%}
  .dialog h3{font-size:18px;font-weight:bold;margin-bottom:8px;color:#f1faee}
  .dialog .dialog-body{color:#a8dadc;margin-bottom:22px;font-size:14px;line-height:1.6}
  .dialog-actions{display:flex;gap:12px;justify-content:flex-end}

  /* Responsive */
  @media(max-width:768px){
    .app{flex-direction:column}
    .sidebar{width:100%;min-width:0;border-right:none;border-bottom:1px solid #2d4a5c;padding:16px}
    .sidebar nav{flex-direction:row;flex-wrap:wrap}
    main{padding:20px}
  }
</style>
</head>
<body>
<div class="app">
  <aside class="sidebar" aria-label="Settings navigation">
    <div class="sidebar-title">Harbor</div>
    <div class="sidebar-workspace">Northwind workspace</div>
    <nav aria-label="Settings panels">
      <button class="nav-btn" data-nav="profile" aria-current="page" type="button">Profile</button>
      <button class="nav-btn" data-nav="notifications" type="button">Notifications</button>
      <button class="nav-btn" data-nav="team" type="button">Team</button>
      <button class="nav-btn" data-nav="projects" type="button">Projects</button>
      <button class="nav-btn" data-nav="billing" type="button">Billing</button>
      <button class="nav-btn" data-nav="danger" type="button">Danger zone</button>
    </nav>
  </aside>

  <main>
    <!-- PROFILE -->
    <section id="profile" data-panel="profile" aria-labelledby="heading-profile">
      <h2 id="heading-profile">Profile</h2>
      <p class="panel-subtitle">Update your personal information used across Harbor.</p>
      <form id="form-profile" novalidate>
        <div class="form-group">
          <label for="field-name">Full name</label>
          <input type="text" id="field-name" data-field="name" value="Alex Morgan" autocomplete="name">
          <p data-error id="err-name" hidden aria-live="assertive">Enter your full name. This field is required.</p>
        </div>
        <div class="form-group">
          <label for="field-email">Email address</label>
          <input type="email" id="field-email" data-field="email" value="alex@northwind.io" autocomplete="email">
        </div>
        <button type="submit" class="btn btn-primary" data-action="save-profile">Save changes</button>
        <div role="status" id="ok-profile" hidden>Profile saved.</div>
      </form>
    </section>

    <!-- NOTIFICATIONS -->
    <section id="notifications" data-panel="notifications" hidden aria-labelledby="heading-notif">
      <h2 id="heading-notif">Notifications</h2>
      <p class="panel-subtitle">Choose which updates you receive from Harbor.</p>
      <div class="switch-row">
        <div class="switch-info">
          <span class="switch-name">Product updates</span>
          <span class="switch-desc">New features, improvements, and release notes</span>
        </div>
        <button role="switch" aria-checked="true" data-switch="product-updates" class="switch-toggle" aria-label="Product updates: on" type="button"></button>
      </div>
      <div class="switch-row">
        <div class="switch-info">
          <span class="switch-name">Comments</span>
          <span class="switch-desc">Replies to threads you participate in</span>
        </div>
        <button role="switch" aria-checked="true" data-switch="comments" class="switch-toggle" aria-label="Comments: on" type="button"></button>
      </div>
      <div class="switch-row">
        <div class="switch-info">
          <span class="switch-name">Mentions</span>
          <span class="switch-desc">When a teammate mentions you directly</span>
        </div>
        <button role="switch" aria-checked="false" data-switch="mentions" class="switch-toggle" aria-label="Mentions: off" type="button"></button>
      </div>
      <div class="switch-row">
        <div class="switch-info">
          <span class="switch-name">Weekly digest</span>
          <span class="switch-desc">A summary of workspace activity sent each Monday</span>
        </div>
        <button role="switch" aria-checked="false" data-switch="weekly-digest" class="switch-toggle" aria-label="Weekly digest: off" type="button"></button>
      </div>
      <div style="margin-top:20px">
        <button type="button" class="btn btn-primary" data-action="save-notifications">Save notification preferences</button>
      </div>
      <div role="status" id="ok-notif" hidden>Notification preferences saved.</div>
    </section>

    <!-- TEAM -->
    <section id="team" data-panel="team" hidden aria-labelledby="heading-team">
      <h2 id="heading-team">Team</h2>
      <p class="panel-subtitle">Manage who has access to the Northwind workspace.</p>
      <div id="team-list">
        <div class="member-row" data-member="m1">
          <div class="member-info">
            <span class="member-name">Jordan Lee</span><span class="member-role">Admin</span>
            <div class="member-email">jordan@northwind.io</div>
          </div>
          <button type="button" class="btn-remove" data-action="remove-member" data-member-id="m1" data-member-name="Jordan Lee">Remove</button>
        </div>
        <div class="member-row" data-member="m2">
          <div class="member-info">
            <span class="member-name">Sam Rivera</span><span class="member-role">Editor</span>
            <div class="member-email">sam@northwind.io</div>
          </div>
          <button type="button" class="btn-remove" data-action="remove-member" data-member-id="m2" data-member-name="Sam Rivera">Remove</button>
        </div>
        <div class="member-row" data-member="m3">
          <div class="member-info">
            <span class="member-name">Taylor Chen</span><span class="member-role">Viewer</span>
            <div class="member-email">taylor@northwind.io</div>
          </div>
          <button type="button" class="btn-remove" data-action="remove-member" data-member-id="m3" data-member-name="Taylor Chen">Remove</button>
        </div>
      </div>
      <div class="divider"></div>
      <p class="section-heading">Invite a teammate</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
        <div style="flex:1;min-width:240px">
          <div class="form-group" style="margin-bottom:0">
            <label for="field-invite">Email address</label>
            <input type="email" id="field-invite" data-field="invite-email" placeholder="name@example.com" autocomplete="email">
          </div>
        </div>
        <button type="button" class="btn btn-primary" data-action="invite" style="margin-bottom:0">Send invite</button>
      </div>
      <p data-error id="err-invite" hidden aria-live="assertive">Enter a valid email address to invite a teammate.</p>
      <div role="status" id="ok-invite" hidden></div>
    </section>

    <!-- PROJECTS -->
    <section id="projects" data-panel="projects" hidden aria-labelledby="heading-projects">
      <h2 id="heading-projects">Projects</h2>
      <p class="panel-subtitle">Shared workspaces where your team can collaborate.</p>
      <div id="project-empty" data-empty="true">
        <div class="empty-state">
          <p>No projects yet. Create your first project to start collaborating with your team.</p>
          <button type="button" class="btn btn-primary" data-action="create-project">Create your first project</button>
        </div>
      </div>
      <ul id="project-items" class="project-list" hidden aria-label="Projects"></ul>
    </section>

    <!-- BILLING -->
    <section id="billing" data-panel="billing" hidden aria-labelledby="heading-billing">
      <h2 id="heading-billing">Billing</h2>
      <p class="panel-subtitle">Manage your plan and payment method.</p>
      <div class="plan-info">
        <div class="plan-name">Pro Plan</div>
        <div class="plan-price">$49/month · Billed on the 1st</div>
      </div>
      <p class="section-heading">Update payment method</p>
      <div class="card-row">
        <div class="card-field">
          <div class="form-group">
            <label for="field-card-number">Card number</label>
            <input type="text" id="field-card-number" data-field="card-number" placeholder="1234 5678 9012 3456" inputmode="numeric" autocomplete="cc-number">
          </div>
        </div>
        <div class="card-field" style="max-width:120px">
          <div class="form-group">
            <label for="field-card-expiry">Expiry</label>
            <input type="text" id="field-card-expiry" data-field="card-expiry" placeholder="MM/YY" autocomplete="cc-exp">
          </div>
        </div>
        <div class="card-field" style="max-width:100px">
          <div class="form-group">
            <label for="field-card-cvc">CVC</label>
            <input type="text" id="field-card-cvc" data-field="card-cvc" placeholder="123" inputmode="numeric" autocomplete="cc-csc">
          </div>
        </div>
      </div>
      <p data-error id="err-card" hidden aria-live="assertive">Payment declined. Your card was declined by your bank. Try a different card or contact your bank for assistance.</p>
      <button type="button" class="btn btn-primary" data-action="pay">Pay $49.00</button>
      <div role="status" id="ok-billing" hidden>Payment accepted. Your card was updated successfully.</div>
    </section>

    <!-- DANGER -->
    <section id="danger" data-panel="danger" hidden aria-labelledby="heading-danger">
      <h2 id="heading-danger">Danger zone</h2>
      <p class="panel-subtitle">Permanent, irreversible actions for this workspace.</p>
      <div class="danger-card">
        <h3>Delete Northwind</h3>
        <p>This permanently removes the workspace, all members, all projects, and all data. This can't be undone.</p>
        <button type="button" class="btn btn-danger" data-action="delete-workspace">Delete workspace</button>
      </div>
    </section>
  </main>
</div>

<!-- Remove member dialog -->
<div class="dialog-overlay" id="dlg-remove" role="dialog" aria-modal="true" aria-labelledby="dlg-remove-title" hidden>
  <div class="dialog">
    <h3 id="dlg-remove-title">Remove team member?</h3>
    <p class="dialog-body" id="dlg-remove-body"></p>
    <div class="dialog-actions">
      <button type="button" class="btn btn-secondary" id="dlg-remove-cancel">Cancel</button>
      <button type="button" class="btn btn-danger" id="dlg-remove-confirm">Remove member</button>
    </div>
  </div>
</div>

<!-- Delete workspace dialog -->
<div class="dialog-overlay" id="dlg-delete" role="dialog" aria-modal="true" aria-labelledby="dlg-delete-title" hidden>
  <div class="dialog">
    <h3 id="dlg-delete-title">Delete Northwind?</h3>
    <p class="dialog-body">All members, projects, and data will be permanently removed. This can't be undone.</p>
    <div class="dialog-actions">
      <button type="button" class="btn btn-secondary" id="dlg-delete-cancel">Keep workspace</button>
      <button type="button" class="btn btn-danger" id="dlg-delete-confirm">Delete workspace</button>
    </div>
  </div>
</div>

<script>
(function(){
  'use strict';

  /* ── Navigation ── */
  var navBtns = document.querySelectorAll('.nav-btn');
  var panelEls = document.querySelectorAll('[data-panel]');

  function showPanel(id){
    panelEls.forEach(function(p){
      if(p.getAttribute('data-panel')===id){p.hidden=false;}
      else{p.hidden=true;}
    });
    navBtns.forEach(function(b){
      if(b.getAttribute('data-nav')===id){b.setAttribute('aria-current','page');}
      else{b.removeAttribute('aria-current');}
    });
  }
  navBtns.forEach(function(b){
    b.addEventListener('click',function(){showPanel(b.getAttribute('data-nav'));});
  });

  /* ── Helpers ── */
  function show(el){el.hidden=false;}
  function hide(el){el.hidden=true;}
  function esc(s){var d=document.createElement('div');d.appendChild(document.createTextNode(s));return d.innerHTML;}
  function validEmail(s){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}

  /* ── Profile ── */
  var profileForm=document.getElementById('form-profile');
  var nameInput=document.getElementById('field-name');
  var nameErr=document.getElementById('err-name');
  var profileOk=document.getElementById('ok-profile');

  profileForm.addEventListener('submit',function(e){
    e.preventDefault();
    hide(profileOk);hide(nameErr);
    nameInput.removeAttribute('aria-invalid');
    nameInput.removeAttribute('aria-describedby');
    if(!nameInput.value.trim()){
      show(nameErr);
      nameInput.setAttribute('aria-invalid','true');
      nameInput.setAttribute('aria-describedby','err-name');
      nameInput.focus();
      return;
    }
    show(profileOk);
  });
  nameInput.addEventListener('input',function(){
    hide(nameErr);
    nameInput.removeAttribute('aria-invalid');
    nameInput.removeAttribute('aria-describedby');
  });

  /* ── Notifications ── */
  document.querySelectorAll('[role="switch"]').forEach(function(sw){
    function toggle(){
      var on=sw.getAttribute('aria-checked')==='true';
      sw.setAttribute('aria-checked',on?'false':'true');
      var label=sw.getAttribute('aria-label')||'';
      var base=label.replace(/:\s*(on|off)$/,'');
      sw.setAttribute('aria-label',base+': '+(on?'off':'on'));
    }
    sw.addEventListener('click',toggle);
    sw.addEventListener('keydown',function(e){
      if(e.key===' '||e.key==='Enter'){e.preventDefault();toggle();}
    });
  });
  var notifOk=document.getElementById('ok-notif');
  document.querySelector('[data-action="save-notifications"]').addEventListener('click',function(){
    hide(notifOk);show(notifOk);
  });

  /* ── Team / Remove dialog ── */
  var pendingMemberId=null,pendingMemberName=null;
  var dlgRemove=document.getElementById('dlg-remove');
  var dlgRemoveBody=document.getElementById('dlg-remove-body');

  function bindRemoveBtn(btn){
    btn.addEventListener('click',function(){
      pendingMemberId=btn.getAttribute('data-member-id');
      pendingMemberName=btn.getAttribute('data-member-name');
      dlgRemoveBody.textContent=pendingMemberName+' will lose access to the Northwind workspace.';
      openDialog(dlgRemove);
    });
  }
  document.querySelectorAll('[data-action="remove-member"]').forEach(bindRemoveBtn);

  document.getElementById('dlg-remove-confirm').addEventListener('click',function(){
    if(pendingMemberId){
      var row=document.querySelector('[data-member="'+pendingMemberId+'"]');
      if(row)row.remove();
    }
    pendingMemberId=null;pendingMemberName=null;
    closeDialog(dlgRemove);
  });
  document.getElementById('dlg-remove-cancel').addEventListener('click',function(){closeDialog(dlgRemove);});

  /* Invite */
  var inviteInput=document.getElementById('field-invite');
  var inviteErr=document.getElementById('err-invite');
  var inviteOk=document.getElementById('ok-invite');
  var memberCounter=4;

  document.querySelector('[data-action="invite"]').addEventListener('click',function(){
    hide(inviteErr);hide(inviteOk);
    inviteInput.removeAttribute('aria-invalid');
    inviteInput.removeAttribute('aria-describedby');
    var email=inviteInput.value.trim();
    if(!validEmail(email)){
      show(inviteErr);
      inviteInput.setAttribute('aria-invalid','true');
      inviteInput.setAttribute('aria-describedby','err-invite');
      inviteInput.focus();
      return;
    }
    var id='m'+(memberCounter++);
    var displayName=email.split('@')[0];
    var row=document.createElement('div');
    row.className='member-row';
    row.setAttribute('data-member',id);
    row.innerHTML='<div class="member-info"><span class="member-name">'+esc(displayName)+'</span><span class="member-role">Viewer</span><div class="member-email">'+esc(email)+'</div></div><button type="button" class="btn-remove" data-action="remove-member" data-member-id="'+id+'" data-member-name="'+esc(displayName)+'">Remove</button>';
    document.getElementById('team-list').appendChild(row);
    bindRemoveBtn(row.querySelector('[data-action="remove-member"]'));
    inviteOk.textContent='Invitation sent to '+email+'.';
    show(inviteOk);
    inviteInput.value='';
  });
  inviteInput.addEventListener('input',function(){
    hide(inviteErr);
    inviteInput.removeAttribute('aria-invalid');
    inviteInput.removeAttribute('aria-describedby');
  });

  /* ── Projects ── */
  var projectCount=0;
  var projectEmpty=document.getElementById('project-empty');
  var projectItems=document.getElementById('project-items');

  document.querySelector('[data-action="create-project"]').addEventListener('click',function(){
    projectCount++;
    var id='project-'+projectCount;
    var li=document.createElement('li');
    li.className='project-item';
    li.setAttribute('data-project',id);
    li.innerHTML='<div><span class="project-name">New Project '+projectCount+'</span><div class="project-meta">Active</div></div>';
    projectItems.appendChild(li);
    projectItems.hidden=false;
    if(projectCount===1){hide(projectEmpty);}
  });

  /* ── Billing ── */
  var cardNum=document.getElementById('field-card-number');
  var cardErr=document.getElementById('err-card');
  var billingOk=document.getElementById('ok-billing');

  document.querySelector('[data-action="pay"]').addEventListener('click',function(){
    hide(cardErr);hide(billingOk);
    var digits=cardNum.value.replace(/\s/g,'');
    if(digits==='4000000000000002'){
      show(cardErr);
      return;
    }
    if(!/^\d{16}$/.test(digits)){
      cardErr.textContent='Enter a valid 16-digit card number.';
      show(cardErr);
      return;
    }
    billingOk.textContent='Payment accepted. Your card was updated successfully.';
    show(billingOk);
  });

  /* ── Danger / Delete workspace dialog ── */
  var dlgDelete=document.getElementById('dlg-delete');
  document.querySelector('[data-action="delete-workspace"]').addEventListener('click',function(){
    openDialog(dlgDelete);
  });
  document.getElementById('dlg-delete-cancel').addEventListener('click',function(){closeDialog(dlgDelete);});
  document.getElementById('dlg-delete-confirm').addEventListener('click',function(){closeDialog(dlgDelete);});

  /* ── Dialog open / close / focus trap ── */
  function openDialog(dlg){
    dlg.hidden=false;
    dlg.classList.add('open');
    var focusables=getFocusables(dlg);
    if(focusables.length)focusables[0].focus();
    dlg._trapFn=function(e){
      if(e.key==='Tab'){
        var f=getFocusables(dlg);
        if(!f.length)return;
        var first=f[0],last=f[f.length-1];
        if(e.shiftKey){if(document.activeElement===first){e.preventDefault();last.focus();}}
        else{if(document.activeElement===last){e.preventDefault();first.focus();}}
      }
    };
    dlg.addEventListener('keydown',dlg._trapFn);
  }
  function closeDialog(dlg){
    if(dlg._trapFn){dlg.removeEventListener('keydown',dlg._trapFn);dlg._trapFn=null;}
    dlg.hidden=true;
    dlg.classList.remove('open');
  }
  function getFocusables(root){
    return Array.from(root.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'));
  }

  /* Global Escape */
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      document.querySelectorAll('.dialog-overlay.open').forEach(function(d){closeDialog(d);});
    }
  });
})();
</script>
</body>
</html>
```