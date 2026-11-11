```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Harbor settings · Northwind</title>
<style>
:root{
  --navy:#1a2332; --navy2:#223044; --navy3:#2b3c54;
  --teal:#2d8b8b; --teal-ui:#4fb3b3; --seafoam:#a8dadc; --cream:#f1faee;
  --err:#ffb3b3; --ok:#a8e6c1;
}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--navy);color:var(--cream);font-family:"DejaVu Sans",Verdana,Geneva,sans-serif;font-size:15px;line-height:1.5}
.skip{position:absolute;left:-999px;top:8px;background:var(--seafoam);color:var(--navy);padding:10px 14px;border-radius:6px;z-index:100}
.skip:focus{left:8px}
.app{display:grid;grid-template-columns:260px 1fr;min-height:100vh}
aside{background:#141c29;border-right:1px solid var(--navy3);padding:24px 16px;display:flex;flex-direction:column;gap:20px}
.brand{display:flex;align-items:center;gap:10px;padding:0 8px}
.brand svg{width:32px;height:32px}
.brand b{font-size:20px;letter-spacing:.5px}
.ws{padding:0 8px;color:var(--seafoam);font-size:13px;margin-top:-12px}
nav ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
nav button{width:100%;min-height:44px;text-align:left;background:transparent;color:var(--cream);border:0;border-left:4px solid transparent;border-radius:6px;padding:8px 12px;font:inherit;cursor:pointer}
nav button:hover{background:var(--navy2)}
nav button[aria-current="page"]{background:var(--navy3);border-left-color:var(--seafoam);font-weight:bold}
main{padding:40px 48px;max-width:860px;width:100%}
h1{font-size:26px;margin:0 0 6px;outline:none}
.lead{color:var(--seafoam);margin:0 0 24px}
.card{background:var(--navy2);border:1px solid var(--navy3);border-radius:12px;padding:24px;margin-bottom:20px}
h2{font-size:17px;margin:0 0 12px}
label,.lbl{display:block;font-weight:bold;margin-bottom:6px}
.field{margin-bottom:16px;max-width:420px}
input{width:100%;min-height:44px;background:var(--navy);color:var(--cream);border:2px solid var(--teal-ui);border-radius:8px;padding:8px 12px;font:inherit}
input::placeholder{color:#8fa3b8}
input[aria-invalid="true"]{border-color:var(--err)}
.row{display:flex;gap:16px;flex-wrap:wrap}
.row .field{flex:1;min-width:140px}
button:focus-visible,input:focus-visible,[role=switch]:focus-visible{outline:3px solid var(--seafoam);outline-offset:2px}
input:focus-visible{outline-color:var(--cream)}
.btn{min-height:44px;min-width:44px;padding:8px 20px;border-radius:8px;border:2px solid var(--seafoam);background:var(--seafoam);color:var(--navy);font:inherit;font-weight:bold;cursor:pointer}
.btn:hover{background:var(--cream);border-color:var(--cream)}
.btn.sec{background:transparent;color:var(--cream);border-color:var(--teal-ui)}
.btn.sec:hover{background:var(--navy3)}
.btn.danger{background:#ffb3b3;border-color:#ffb3b3;color:#3a0d0d}
.btn.danger:hover{background:#ffd0d0}
.msgs{min-height:0;margin-top:14px}
.err,[role=status]:not(:empty){padding:10px 14px;border-radius:8px;margin-top:10px;max-width:560px}
.err{background:#3a1f28;border:1px solid var(--err);color:var(--err)}
[role=status]:not(:empty){background:#173a35;border:1px solid var(--ok);color:var(--ok)}
.sw{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid var(--navy3)}
.sw:last-of-type{border-bottom:0}
.sw .t{font-weight:bold}
.sw .d{color:var(--seafoam);font-size:13px}
[role=switch]{flex:none;display:flex;align-items:center;gap:10px;min-height:44px;min-width:92px;background:transparent;color:var(--cream);border:0;font:inherit;cursor:pointer;padding:0}
.track{width:48px;height:26px;border-radius:13px;background:var(--navy);border:2px solid var(--teal-ui);position:relative;flex:none}
.track::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:var(--cream);transition:transform .15s}
[aria-checked=true] .track{background:var(--teal)}
[aria-checked=true] .track::after{transform:translateX(22px)}
.state{width:24px;font-size:13px}
ul.list{list-style:none;margin:0 0 4px;padding:0}
ul.list li{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--navy3)}
ul.list li:last-child{border-bottom:0}
.who b{display:block}
.who span{color:var(--seafoam);font-size:13px}
.role{background:var(--navy3);border-radius:20px;padding:2px 10px;font-size:12px;margin-left:8px;white-space:nowrap}
.empty{text-align:center;padding:36px 16px;border:2px dashed var(--teal-ui);border-radius:12px}
.empty p{max-width:420px;margin:0 auto 16px;color:var(--seafoam)}
.empty h2{margin-bottom:8px}
.plan{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:baseline}
.plan strong{font-size:22px}
.zone{border-color:var(--err)}
.overlay{position:fixed;inset:0;background:rgba(10,15,24,.8);display:flex;align-items:center;justify-content:center;padding:16px;z-index:50}
.overlay[hidden]{display:none}
[role=dialog]{background:var(--navy2);border:2px solid var(--seafoam);border-radius:12px;padding:24px;max-width:460px;width:100%}
[role=dialog][hidden]{display:none}
[role=dialog] h2{font-size:19px}
[role=dialog] p{margin:0 0 20px}
.actions{display:flex;gap:12px;justify-content:flex-end;flex-wrap:wrap}
[hidden]{display:none!important}
@media (max-width:760px){.app{grid-template-columns:1fr}aside{border-right:0;border-bottom:1px solid var(--navy3)}nav ul{flex-direction:row;flex-wrap:wrap}nav button{width:auto}main{padding:24px 16px}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to settings</a>
<div class="app">
  <aside>
    <div class="brand">
      <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#2d8b8b"/><path d="M16 5v15M9 18c0 4 3 7 7 7s7-3 7-7M11 11h10" stroke="#f1faee" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>
      <b>Harbor</b>
    </div>
    <div class="ws">Workspace: Northwind</div>
    <nav aria-label="Settings">
      <ul>
        <li><button type="button" data-nav="profile">Profile</button></li>
        <li><button type="button" data-nav="notifications">Notifications</button></li>
        <li><button type="button" data-nav="team">Team</button></li>
        <li><button type="button" data-nav="projects">Projects</button></li>
        <li><button type="button" data-nav="billing">Billing</button></li>
        <li><button type="button" data-nav="danger">Danger zone</button></li>
      </ul>
    </nav>
  </aside>
  <main id="main" tabindex="-1">

    <section data-panel="profile" aria-labelledby="h-profile">
      <h1 id="h-profile" tabindex="-1">Profile</h1>
      <p class="lead">Update how you appear to teammates in Northwind.</p>
      <form class="card" novalidate>
        <div class="field"><label for="f-name">Full name</label><input id="f-name" data-field="name" autocomplete="name" value="Maya Chen"></div>
        <div class="field"><label for="f-email">Email address</label><input id="f-email" data-field="email" type="email" autocomplete="email" value="maya@northwind.com"></div>
        <button type="submit" class="btn" data-action="save-profile">Save profile</button>
        <div class="msgs"><div role="status"></div><div class="errs"></div></div>
      </form>
    </section>

    <section data-panel="notifications" aria-labelledby="h-notifications" hidden>
      <h1 id="h-notifications" tabindex="-1">Notifications</h1>
      <p class="lead">Choose which updates Harbor sends to your inbox.</p>
      <form class="card" novalidate>
        <div class="sw"><div><div class="t" id="n1">Product updates</div><div class="d" id="n1d">New features and improvements to Harbor.</div></div>
          <button type="button" role="switch" aria-checked="true" data-switch="product-updates" aria-labelledby="n1" aria-describedby="n1d"><span class="track"></span><span class="state">On</span></button></div>
        <div class="sw"><div><div class="t" id="n2">Comments</div><div class="d" id="n2d">Replies on threads you started or joined.</div></div>
          <button type="button" role="switch" aria-checked="true" data-switch="comments" aria-labelledby="n2" aria-describedby="n2d"><span class="track"></span><span class="state">On</span></button></div>
        <div class="sw"><div><div class="t" id="n3">Mentions</div><div class="d" id="n3d">Anytime a teammate @mentions you.</div></div>
          <button type="button" role="switch" aria-checked="true" data-switch="mentions" aria-labelledby="n3" aria-describedby="n3d"><span class="track"></span><span class="state">On</span></button></div>
        <div class="sw"><div><div class="t" id="n4">Weekly digest</div><div class="d" id="n4d">A Monday summary of what your team did.</div></div>
          <button type="button" role="switch" aria-checked="false" data-switch="weekly-digest" aria-labelledby="n4" aria-describedby="n4d"><span class="track"></span><span class="state">Off</span></button></div>
        <div style="margin-top:12px"><button type="submit" class="btn" data-action="save-notifications">Save notification settings</button></div>
        <div class="msgs"><div role="status"></div><div class="errs"></div></div>
      </form>
    </section>

    <section data-panel="team" aria-labelledby="h-team" hidden>
      <h1 id="h-team" tabindex="-1">Team</h1>
      <p class="lead">People who can access Northwind.</p>
      <div class="card"><h2>Members</h2><ul class="list" id="members"></ul>
        <div class="msgs"><div role="status" id="team-status"></div></div></div>
      <form class="card" novalidate>
        <h2>Invite a teammate</h2>
        <div class="field"><label for="f-invite">Teammate's email address</label><input id="f-invite" data-field="invite-email" type="email" autocomplete="off" placeholder="name@company.com"></div>
        <button type="submit" class="btn" data-action="invite">Send invitation</button>
        <div class="msgs"><div role="status"></div><div class="errs"></div></div>
      </form>
    </section>

    <section data-panel="projects" aria-labelledby="h-projects" hidden>
      <h1 id="h-projects" tabindex="-1">Projects</h1>
      <p class="lead">Projects keep your team's work organized in one place.</p>
      <div class="card">
        <div id="proj-empty" class="empty" data-empty>
          <h2>No projects yet</h2>
          <p>Northwind doesn't have any projects, so there's nothing to show here. Create your first project to start collaborating with your team.</p>
          <div id="btn-slot-empty"><button type="button" class="btn" data-action="create-project" id="create-btn">Create project</button></div>
        </div>
        <ul class="list" id="projects" hidden></ul>
        <div id="btn-slot-list" style="margin-top:14px" hidden></div>
        <div class="msgs"><div role="status" id="proj-status"></div></div>
      </div>
    </section>

    <section data-panel="billing" aria-labelledby="h-billing" hidden>
      <h1 id="h-billing" tabindex="-1">Billing</h1>
      <p class="lead">Manage your plan and payment method.</p>
      <div class="card"><h2>Current plan</h2>
        <div class="plan"><strong>Team plan</strong><span>$48 per month · 6 seats</span></div></div>
      <form class="card" novalidate>
        <h2>Payment method</h2>
        <div class="field"><label for="f-card">Card number</label><input id="f-card" data-field="card-number" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456"></div>
        <div class="row" style="max-width:420px">
          <div class="field"><label for="f-exp">Expiry (MM/YY)</label><input id="f-exp" data-field="card-expiry" autocomplete="cc-exp" placeholder="MM/YY"></div>
          <div class="field"><label for="f-cvc">Security code</label><input id="f-cvc" data-field="card-cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="123"></div>
        </div>
        <button type="submit" class="btn" data-action="pay">Save payment method</button>
        <div class="msgs"><div role="status"></div><div class="errs"></div></div>
      </form>
    </section>

    <section data-panel="danger" aria-labelledby="h-danger" hidden>
      <h1 id="h-danger" tabindex="-1">Danger zone</h1>
      <p class="lead">Actions here affect everyone in Northwind.</p>
      <div class="card zone"><h2>Delete this workspace</h2>
        <p style="margin-top:0">Deleting Northwind permanently removes its projects, members and settings. This can't be undone.</p>
        <button type="button" class="btn danger" data-action="delete-workspace">Delete workspace</button>
        <div class="msgs"><div role="status"></div></div>
      </div>
    </section>
  </main>
</div>

<div class="overlay" id="overlay" hidden>
  <div role="dialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-text" id="dialog" hidden>
    <h2 id="dlg-title"></h2>
    <p id="dlg-text"></p>
    <div class="actions">
      <button type="button" class="btn sec" id="dlg-cancel"></button>
      <button type="button" class="btn danger" id="dlg-ok"></button>
    </div>
  </div>
</div>

<script>
(function(){
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var errN=0;

  /* navigation */
  function show(id,focus){
    $$('[data-panel]').forEach(function(p){p.hidden=p.getAttribute('data-panel')!==id});
    $$('[data-nav]').forEach(function(b){
      if(b.getAttribute('data-nav')===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });
    document.title=$('[data-nav="'+id+'"]').textContent+' · Harbor settings';
    if(focus)$('#h-'+id).focus();
  }
  $$('[data-nav]').forEach(function(b){b.addEventListener('click',function(){show(b.getAttribute('data-nav'),true)})});
  show('profile');

  /* messages */
  function clearMsgs(scope){
    $$('[role=status]',scope).forEach(function(s){s.textContent=''});
    $$('.errs',scope).forEach(function(e){e.innerHTML=''});
    $$('[aria-invalid]',scope).forEach(function(i){i.removeAttribute('aria-invalid');i.removeAttribute('aria-describedby')});
  }
  function fail(form,text,input){
    var box=$('.errs',form),id='err'+(++errN);
    var d=document.createElement('div');
    d.className='err';d.id=id;d.setAttribute('data-error','');d.setAttribute('role','alert');
    d.textContent=text;box.appendChild(d);
    if(input){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',id);input.focus();}
  }
  function ok(form,text){$('[role=status]',form).textContent=text}
  var emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* clear stale messages when the user edits */
  $$('form').forEach(function(f){
    f.addEventListener('input',function(){clearMsgs(f)});
  });

  /* profile */
  $('[data-panel=profile] form').addEventListener('submit',function(e){
    e.preventDefault();var f=e.currentTarget;clearMsgs(f);
    var n=$('[data-field=name]'),m=$('[data-field=email]');
    if(!n.value.trim()){fail(f,"Your name is missing. Harbor shows it to your teammates, so it can't be blank. Enter your full name and save again.",n);return}
    if(!emailRe.test(m.value.trim())){fail(f,"That email address doesn't look right. It should look like name@company.com. Check it and save again.",m);return}
    ok(f,"Profile saved. Your teammates will see "+n.value.trim()+" from now on.");
  });

  /* notifications */
  $$('[role=switch]').forEach(function(s){
    s.addEventListener('click',function(){
      var on=s.getAttribute('aria-checked')!=='true';
      s.setAttribute('aria-checked',on);
      $('.state',s).textContent=on?'On':'Off';
      clearMsgs(s.closest('form'));
    });
  });
  $('[data-panel=notifications] form').addEventListener('submit',function(e){
    e.preventDefault();clearMsgs(e.currentTarget);
    ok(e.currentTarget,"Notification settings saved. Changes apply to your next email.");
  });

  /* team */
  var members=[
    {n:'Maya Chen',e:'maya@northwind.com',r:'Owner'},
    {n:'Luca Ferrari',e:'luca@northwind.com',r:'Admin'},
    {n:'Priya Nair',e:'priya@northwind.com',r:'Member'}
  ];
  function renderMembers(){
    var ul=$('#members');ul.innerHTML='';
    members.forEach(function(m){
      var li=document.createElement('li');li.setAttribute('data-member','');
      var w=document.createElement('div');w.className='who';
      var b=document.createElement('b');b.textContent=m.n;
      var r=document.createElement('span');r.className='role';r.textContent=m.r;b.appendChild(r);
      var s=document.createElement('span');s.textContent=m.e;
      w.appendChild(b);w.appendChild(s);
      var btn=document.createElement('button');btn.type='button';btn.className='btn sec';
      btn.setAttribute('data-action','remove-member');btn.textContent='Remove';
      btn.setAttribute('aria-label','Remove '+m.n);
      btn.addEventListener('click',function(){
        clearMsgs($('[data-panel=team]'));
        openDialog({title:'Remove '+m.n+' from Northwind?',
          text:m.n+" will lose access to the workspace right away. You can invite them again later.",
          ok:'Remove member',cancel:'Keep member',opener:btn,
          onOk:function(){
            members=members.filter(function(x){return x!==m});
            renderMembers();
            $('#team-status').textContent=m.n+' was removed from Northwind.';
            $('#h-team').focus();
          }});
      });
      li.appendChild(w);li.appendChild(btn);ul.appendChild(li);
    });
    if(!members.length){var li=document.createElement('li');li.textContent='No members left. Invite a teammate below to add someone.';ul.appendChild(li)}
  }
  renderMembers();
  $('[data-panel=team] form').addEventListener('submit',function(e){
    e.preventDefault();var f=e.currentTarget;clearMsgs(f);$('#team-status').textContent='';
    var i=$('[data-field=invite-email]'),v=i.value.trim();
    if(!emailRe.test(v)){fail(f,"That email address isn't valid. Invitations need an address like name@company.com. Check for typos and send again.",i);return}
    if(members.some(function(m){return m.e.toLowerCase()===v.toLowerCase()})){fail(f,v+" is already on the team. Enter a different email address to invite someone new.",i);return}
    var name=v.split('@')[0].replace(/[._-]+/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase()});
    members.push({n:name,e:v,r:'Member'});renderMembers();i.value='';
    ok(f,"Invitation sent. "+name+" now appears in your team as a member.");
  });

  /* projects */
  var names=['Website relaunch','Q3 roadmap','Customer research','Mobile app'],pc=0;
  $('#create-btn').addEventListener('click',function(){
    var st=$('#proj-status');st.textContent='';
    var name=pc<names.length?names[pc]:'Project '+(pc+1);pc++;
    var li=document.createElement('li');li.setAttribute('data-project','');
    var w=document.createElement('div');w.className='who';
    var b=document.createElement('b');b.textContent=name;
    var s=document.createElement('span');s.textContent='Created just now · 1 member';
    w.appendChild(b);w.appendChild(s);li.appendChild(w);$('#projects').appendChild(li);
    var empty=$('#proj-empty');if(empty)empty.remove();
    $('#projects').hidden=false;
    var slot=$('#btn-slot-list');slot.hidden=false;slot.appendChild($('#create-btn'));
    $('#create-btn').focus();
    st.textContent='Project created. "'+name+'" is ready for your team.';
  });

  /* billing */
  $('[data-panel=billing] form').addEventListener('submit',function(e){
    e.preventDefault();var f=e.currentTarget;clearMsgs(f);
    var c=$('[data-field=card-number]'),x=$('[data-field=card-expiry]'),v=$('[data-field=card-cvc]');
    var digits=c.value.replace(/[\s-]/g,'');
    if(!/^\d{16}$/.test(digits)){fail(f,"The card number is incomplete. Card numbers have 16 digits. Check the number on your card and try again.",c);return}
    if(x.value.trim()&&!/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/.test(x.value.trim())){fail(f,"The expiry date isn't in the right format. Use MM/YY, for example 08/28.",x);return}
    if(v.value.trim()&&!/^\d{3,4}$/.test(v.value.trim())){fail(f,"The security code should be 3 or 4 digits. You'll find it on the back of your card.",v);return}
    if(digits==='4000000000000002'){fail(f,"Payment declined. Your bank declined this card. Try a different card or contact your bank.",c);return}
    ok(f,"Payment method saved. Your card ending in "+digits.slice(-4)+" will be used for the next invoice.");
  });

  /* danger */
  $('[data-action=delete-workspace]').addEventListener('click',function(e){
    var btn=e.currentTarget;clearMsgs($('[data-panel=danger]'));
    openDialog({title:'Delete Northwind?',
      text:"This permanently deletes the workspace, its projects and all member access. This can't be undone.",
      ok:'Delete workspace',cancel:'Keep workspace',opener:btn,
      onOk:function(){$('[data-panel=danger] [role=status]').textContent='Workspace deletion is turned off in this demo. Northwind is unchanged.';}});
  });

  /* dialog */
  var cur=null,ov=$('#overlay'),dlg=$('#dialog');
  function openDialog(o){
    cur=o;
    $('#dlg-title').textContent=o.title;$('#dlg-text').textContent=o.text;
    $('#dlg-ok').textContent=o.ok;$('#dlg-cancel').textContent=o.cancel;
    ov.hidden=false;dlg.hidden=false;$('#dlg-cancel').focus();
  }
  function closeDialog(){
    if(!cur)return;var o=cur;cur=null;ov.hidden=true;dlg.hidden=true;
    return o;
  }
  $('#dlg-cancel').addEventListener('click',function(){var o=closeDialog();if(o&&o.opener&&document.body.contains(o.opener))o.opener.focus()});
  $('#dlg-ok').addEventListener('click',function(){var o=closeDialog();if(o)o.onOk()});
  ov.addEventListener('mousedown',function(e){if(e.target===ov){var o=closeDialog();if(o&&o.opener&&document.body.contains(o.opener))o.opener.focus()}});
  document.addEventListener('keydown',function(e){
    if(!cur)return;
    if(e.key==='Escape'){e.preventDefault();var o=closeDialog();if(o&&o.opener&&document.body.contains(o.opener))o.opener.focus();return}
    if(e.key==='Tab'){
      var f=[$('#dlg-cancel'),$('#dlg-ok')],i=f.indexOf(document.activeElement);
      if(e.shiftKey){if(i<=0){e.preventDefault();f[1].focus()}}
      else if(i===-1||i===1){e.preventDefault();f[0].focus()}
    }
  });
})();
</script>
</body>
</html>
```