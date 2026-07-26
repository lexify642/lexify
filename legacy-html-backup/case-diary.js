(() => {
const cases=[
{no:'01',number:'WP/890/2025',court:'High Court',city:'Bombay',room:'Courtroom 24',judge:'Justice A. Deshmukh',parties:'Chevron Inc. vs. State of California',date:'2026-07-21',time:'10:30 AM',stage:'Admission',tone:'blue',activity:'Documents uploaded by R. Sharma',registered:'18 Nov 2025',filing:'Writ Petition',history:[['18 Nov 2025','Petition registered','Writ petition numbered and notice issued.']],notes:[['16 Apr 2026','Court granted three weeks for respondent affidavit.']],tasks:[['Tomorrow','File compilation of annexures','High']],docs:['Writ Petition.pdf','List of Dates.docx'],client:{name:'Chevron Inc.',phone:'+1 415 555 0194',address:'6001 Bollinger Canyon Road, San Ramon, CA 94583'}},
{no:'02',number:'CS/1245/2024',court:'Supreme Court',city:'New Delhi',room:'Courtroom 3',judge:'Justice S. Banerjee',parties:'ABC Corp. vs. XYZ Ltd.',date:'2026-07-21',time:'12:00 PM',stage:'Final Hearing',tone:'orange',activity:'Hearing notice sent',registered:'09 Aug 2024',filing:'Commercial Civil Suit',history:[['09 Aug 2024','Suit registered','Commercial suit admitted.']],notes:[['30 Jun 2026','Focus next hearing on limitation.']],tasks:[['Today, 11:15 AM','Confirm appearance with briefing counsel','High']],docs:['Plaint.pdf','Written Statement.pdf'],client:{name:'ABC Corp.',phone:'+91 22 4422 7689',address:'Nariman Point, Mumbai, Maharashtra 400021'}},
{no:'03',number:'CR/887/2025',court:'City Civil Court',city:'Mumbai',room:'Room 12',judge:'Smt. R. Kulkarni',parties:'State vs. R. Khanna',date:'2026-07-21',time:'02:15 PM',stage:'Evidence',tone:'red',activity:'Witness list added',registered:'27 Sep 2025',filing:'Criminal Revision Petition',history:[['27 Sep 2025','Revision registered','Notice issued to respondent.']],notes:[['11 Jun 2026','Witness attendance confirmed for 21 July.']],tasks:[['Today, 01:30 PM','Coordinate witness attendance','High']],docs:['Revision Petition.pdf','Witness List.xlsx'],client:{name:'R. Khanna',phone:'+91 98 2201 4409',address:'Bandra West, Mumbai, Maharashtra 400050'}},
{no:'04',number:'CP/112/2026',court:'NCLT',city:'Mumbai',room:'Courtroom 1',judge:'Member P. Iyer',parties:'Mehta Industries vs. Union of India',date:'2026-07-21',time:'03:30 PM',stage:'Reply',tone:'green',activity:'Reply draft saved',registered:'06 Feb 2026',filing:'Company Petition',history:[['06 Feb 2026','Petition registered','Petition admitted for preliminary hearing.']],notes:[],tasks:[['Today, 12:00 PM','Obtain signed board resolution','High']],docs:['Company Petition.pdf'],client:{name:'Mehta Industries',phone:'+91 22 4928 2100',address:'Andheri East, Mumbai, Maharashtra 400093'}},
{no:'05',number:'ARB/64/2026',court:'High Court',city:'Bombay',room:'Courtroom 18',judge:'Justice M. Shah',parties:'Orion Logistics vs. Prime Warehousing',date:'2026-07-22',time:'11:00 AM',stage:'Reply',tone:'green',activity:'Notice acknowledged by respondent',registered:'05 May 2026',filing:'Arbitration Petition',history:[['05 May 2026','Petition registered','Matter listed for directions.']],notes:[],tasks:[['Today','Finalize service affidavit','Medium']],docs:['Arbitration Petition.pdf'],client:{name:'Orion Logistics',phone:'+91 80 4400 1367',address:'Whitefield, Bengaluru, Karnataka 560066'}}];
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));let selectedDate='',search='',current=null,modalType='',editIndex=null;
const display=d=>new Date(`${d}T00:00:00`).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),tone=s=>({Admission:'blue','Final Hearing':'orange',Evidence:'red',Reply:'green'}[s]||'blue');
function render(){let list=cases.filter(c=>(!selectedDate||c.date===selectedDate)&&`${c.number} ${c.court} ${c.city} ${c.parties}`.toLowerCase().includes(search));$('#case-diary-results').innerHTML=list.map(c=>`<tr class="case-row" tabindex="0" data-case="${c.no}"><td>${c.no}</td><td><strong>${esc(c.number)}</strong><br><small>View analytics →</small></td><td><strong>${esc(c.court)}</strong><br><small>${esc(c.city)}</small></td><td><strong>${esc(c.parties)}</strong></td><td>${display(c.date)}<br><small>${esc(c.time)}</small></td><td><span class="badge ${c.tone}">${esc(c.stage)}</span></td><td>${esc(c.activity)}</td></tr>`).join('');$('#no-cases').hidden=!!list.length;$('#date-filter-summary').textContent=selectedDate?`Showing ${list.length} active case${list.length===1?'':'s'} scheduled for ${display(selectedDate)}.`:'Showing all active cases across all courts.';$('#clear-date').hidden=!selectedDate}
function buttons(type,i=''){return `<span class="mini-actions"><button data-edit="${type}" data-index="${i}">Edit</button><button class="danger-action" data-delete="${type}" data-index="${i}">Delete</button></span>`}
function draw(){let c=current;if(!c)return;$('#drawer-title').textContent=c.parties;$('#drawer-number').textContent=`${c.number} · Active matter`;$('#drawer-content').innerHTML=`<div class="drawer-actions"><button class="btn btn-outline" data-edit="case">Edit case</button><button class="btn btn-outline danger-outline" data-delete="case">Delete case</button></div><div class="matter-meta"><span><b>${esc(c.court)}</b>${esc(c.city)} · ${esc(c.room)}</span><span><b>${esc(c.judge)}</b>Presiding judge</span><span><b>${esc(c.stage)}</b>Current stage</span></div><section class="drawer-section"><div class="drawer-section-title"><h3>Client details</h3>${c.client?`<span><button class="link" data-edit="client">Edit</button><button class="link danger-link" data-delete="client">Delete</button></span>`:`<button class="link" data-add="client">+ Add client</button>`}</div>${c.client?`<div class="client-card"><b>${esc(c.client.name)}</b><span>${esc(c.client.phone)}</span><span>${esc(c.client.address)}</span></div>`:'<div class="empty-inline">No client linked.</div>'}</section><section class="drawer-section"><h3>Upcoming hearing</h3><div class="hearing-highlight"><b>${display(c.date)} · ${esc(c.time)}</b><span>${esc(c.court)}, ${esc(c.room)}</span></div></section><section class="drawer-section"><h3>Registration & lifecycle</h3><p class="lifecycle-intro"><b>Registered ${esc(c.registered)}</b>${esc(c.filing)}</p><div class="case-timeline">${c.history.map(h=>`<article><time>${h[0]}</time><div><b>${esc(h[1])}</b><p>${esc(h[2])}</p></div></article>`).join('')}</div></section><section class="drawer-section"><div class="drawer-section-title"><h3>Historical notes</h3><button class="link" data-add="note">+ Add note</button></div>${c.notes.map((n,i)=>`<div class="case-note"><div><time>${n[0]}</time><p>${esc(n[1])}</p></div>${buttons('note',i)}</div>`).join('')||'<div class="empty-inline">No historical notes.</div>'}</section><section class="drawer-section"><div class="drawer-section-title"><h3>Reminders & tasks</h3><button class="link" data-add="task">+ Add task</button></div>${c.tasks.map((t,i)=>`<div class="case-task"><span class="task-check">✓</span><div><b>${esc(t[1])}</b><small>Due ${esc(t[0])}</small></div><em class="priority ${t[2].toLowerCase()}">${t[2]}</em>${buttons('task',i)}</div>`).join('')||'<div class="empty-inline">No active tasks.</div>'}</section><section class="drawer-section"><div class="drawer-section-title"><h3>Linked drafts & documents</h3><button class="link" data-add="document">+ Add document</button></div><div class="document-chips">${c.docs.map((d,i)=>`<span>▧ ${esc(d)}${buttons('document',i)}</span>`).join('')}</div></section>`}
function openDrawer(c){current=c;draw();$('#case-drawer').classList.add('open');$('#case-drawer-backdrop').classList.add('show')}
const forms={case:`<div class="form-grid"><label class="form-field">Case number<input name="number" required></label><label class="form-field">Parties<input name="parties" required></label><label class="form-field">Court<input name="court" required></label><label class="form-field">City<input name="city" required></label><label class="form-field">Room<input name="room" required></label><label class="form-field">Judge<input name="judge" required></label><label class="form-field">Next date<input name="date" type="date" required></label><label class="form-field">Time<input name="time" required placeholder="10:30 AM"></label><label class="form-field">Stage<select name="stage"><option>Admission</option><option>Final Hearing</option><option>Evidence</option><option>Reply</option></select></label><label class="form-field">Registration date<input name="registered" required></label><label class="form-field full">Filing details<input name="filing" required></label></div>`,client:`<div class="form-grid"><label class="form-field full">Client name<input name="name" required></label><label class="form-field">Phone number<input name="phone" required pattern="[0-9+ ()-]{7,}"></label><label class="form-field full">Address<textarea name="address" required rows="3"></textarea></label></div>`,note:`<div class="form-grid"><label class="form-field">Hearing date<input name="date" type="date" required></label><label class="form-field full">Historical note<textarea name="text" required rows="5"></textarea></label></div>`,task:`<div class="form-grid"><label class="form-field">Due date/time<input name="due" required></label><label class="form-field">Priority<select name="priority"><option>High</option><option>Medium</option></select></label><label class="form-field full">Task<input name="text" required></label></div>`,document:`<div class="form-grid"><label class="form-field full">Document / draft name<input name="name" required></label><label class="form-field full">Upload new document<input name="file" type="file" accept=".pdf,.doc,.docx,.xlsx"><small>Selected filename will be added to this demo case.</small></label></div>`};
function openModal(type,i=null){modalType=type;editIndex=i;let f=$('#case-modal-form');$('#case-modal-title').textContent=`${i===null?'Add':'Edit'} ${type}`;$('#case-modal-fields').innerHTML=forms[type];let v=type==='client'?current?.client:type==='note'&&i!==null?{date:'',text:current.notes[i][1]}:type==='task'&&i!==null?{due:current.tasks[i][0],text:current.tasks[i][1],priority:current.tasks[i][2]}:type==='document'&&i!==null?{name:current.docs[i]}:type==='case'&&i!==null?current:null;if(v)Object.entries(v).forEach(([k,x])=>f.elements[k]&&(f.elements[k].value=x));$('#case-modal').classList.add('show')}
function closeModal(){$('#case-modal').classList.remove('show')}function toast(m){let t=$('#case-toast');t.textContent=m;t.className='toast show';clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='toast',2500)}
$('#case-modal-form').addEventListener('submit',e=>{e.preventDefault();let f=e.currentTarget;if(!f.reportValidity())return;let d=Object.fromEntries(new FormData(f));if(modalType==='case'){if(editIndex!==null)Object.assign(current,d,{tone:tone(d.stage),activity:'Case details updated'});else{let no=String(cases.length+1).padStart(2,'0');cases.push({no,...d,tone:tone(d.stage),activity:'Case created',history:[],notes:[],tasks:[],docs:[],client:null})}render()}else if(modalType==='client')current.client=d;else if(modalType==='note'){let x=[d.date?display(d.date):'Today',d.text];editIndex===null?current.notes.unshift(x):current.notes[editIndex]=x}else if(modalType==='task'){let x=[d.due,d.text,d.priority];editIndex===null?current.tasks.push(x):current.tasks[editIndex]=x}else if(modalType==='document'){let x=d.file?.name||d.name;editIndex===null?current.docs.push(x):current.docs[editIndex]=x}draw();closeModal();toast('Changes saved.')});
document.addEventListener('click',e=>{if(e.target.closest('.heading-row .btn'))openModal('case');let r=e.target.closest('[data-case]');if(r)openDrawer(cases.find(c=>c.no===r.dataset.case));let nav=e.target.closest('[data-date-nav]');if(nav){let b=selectedDate?new Date(`${selectedDate}T00:00:00`):new Date('2026-07-21T00:00:00');if(nav.dataset.dateNav==='today')selectedDate='2026-07-21';else{b.setDate(b.getDate()+(nav.dataset.dateNav==='previous'?-1:1));selectedDate=b.toISOString().slice(0,10)}$('#diary-date').value=selectedDate;render()}if(e.target.closest('#clear-date')){selectedDate='';$('#diary-date').value='';render()}if(e.target=== $('#case-drawer-backdrop')||e.target.closest('#close-case-drawer')){$('#case-drawer').classList.remove('open');$('#case-drawer-backdrop').classList.remove('show')}if(e.target.closest('[data-modal-close]')||e.target===$('#case-modal'))closeModal();let a=e.target.closest('[data-add]');if(a)openModal(a.dataset.add);let ed=e.target.closest('[data-edit]');if(ed)openModal(ed.dataset.edit,ed.dataset.index===undefined?0:+ed.dataset.index);let de=e.target.closest('[data-delete]');if(de){let t=de.dataset.delete;if(!confirm(`Delete this ${t}?`))return;if(t==='case'){cases.splice(cases.indexOf(current),1);$('#case-drawer').classList.remove('open');$('#case-drawer-backdrop').classList.remove('show');render()}else if(t==='client')current.client=null;else if(t==='note')current.notes.splice(+de.dataset.index,1);else if(t==='task')current.tasks.splice(+de.dataset.index,1);else if(t==='document')current.docs.splice(+de.dataset.index,1);draw();toast(`${t} deleted.`)}});document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();$('#case-drawer').classList.remove('open');$('#case-drawer-backdrop').classList.remove('show')}});$('#diary-date').addEventListener('change',e=>{selectedDate=e.target.value;render()});$('#diary-search').addEventListener('input',e=>{search=e.target.value.toLowerCase();render()});render();
})();

(() => {
  const content = document.querySelector('#drawer-content');
  if (!content) return;
  new MutationObserver(() => {
    const heading = [...content.querySelectorAll('.drawer-section h3')].find((item) => item.textContent === 'Registration & lifecycle');
    if (!heading || heading.parentElement.querySelector('[data-record-hearing]')) return;
    const button = document.createElement('button');
    button.className = 'link'; button.dataset.recordHearing = 'true'; button.textContent = '+ Record hearing';
    heading.parentElement.append(button);
  }).observe(content, { childList: true });
})();

/* Enrich each matter timeline with all prior listed dates and their outcomes. */
(() => {
  const content = document.querySelector('#drawer-content');
  if (!content) return;
  const histories = {
    'WP/890/2025': [['12 Jan 2026', 'First listing', 'Counsel sought time to file additional documents.'], ['16 Apr 2026', 'Directions recorded', 'Respondent was directed to file an affidavit in reply.']],
    'CS/1245/2024': [['14 Feb 2025', 'Issues framed', 'Issues were settled for trial.'], ['30 Jun 2026', 'Final arguments', 'Matter was part-heard and listed for continuation.']],
    'CR/887/2025': [['04 Mar 2026', 'Evidence commenced', 'PW-1 was examined in chief.'], ['11 Jun 2026', 'Cross examination', 'Cross examination was deferred to the next date.']],
    'CP/112/2026': [['19 May 2026', 'Reply directions', 'Respondent received a final opportunity to file its reply.']],
    'ARB/64/2026': [['08 Jun 2026', 'Service verified', 'Service affidavit was taken on record and directions were issued.']]
  };
  const enrich = () => {
    const number = document.querySelector('#drawer-number')?.textContent.split(' · ')[0];
    const timeline = content.querySelector('.case-timeline');
    if (!timeline || timeline.dataset.enriched || !histories[number]) return;
    histories[number].forEach(([date, title, result]) => {
      const item = document.createElement('article');
      item.innerHTML = '<time></time><div><b></b><p></p></div>';
      item.querySelector('time').textContent = date;
      item.querySelector('b').textContent = title;
      item.querySelector('p').textContent = result;
      timeline.append(item);
    });
    timeline.dataset.enriched = 'true';
  };
  new MutationObserver(enrich).observe(content, { childList: true, subtree: true });
})();

/* Lets users append a dated outcome to the hearing history in the open drawer. */
(() => {
  const drawer = document.querySelector('#case-drawer');
  if (!drawer) return;
  document.addEventListener('click', (event) => {
    const heading = event.target.closest('.drawer-section h3');
    if (!heading || heading.textContent !== 'Registration & lifecycle') return;
    const section = heading.closest('.drawer-section');
    if (section.querySelector('[data-record-hearing]')) return;
    const button = document.createElement('button');
    button.className = 'link'; button.dataset.recordHearing = 'true'; button.textContent = '+ Record hearing';
    heading.parentElement.append(button);
  });
  drawer.addEventListener('click', (event) => {
    if (!event.target.matches('[data-record-hearing]')) return;
    const date = window.prompt('Hearing date (for example, 22 Jul 2026):');
    const outcome = date && window.prompt('What happened on this date?');
    if (!outcome) return;
    const history = event.target.closest('.drawer-section').querySelector('.case-timeline');
    const item = document.createElement('article');
    item.innerHTML = '<time></time><div><b>Hearing outcome</b><p></p></div>';
    item.querySelector('time').textContent = date;
    item.querySelector('p').textContent = outcome;
    history.prepend(item);
  });
})();

/* Add View alongside the existing Edit and Delete controls for each linked file. */
(() => {
  const content = document.querySelector('#drawer-content');
  if (!content) return;
  const addViewControls = () => content.querySelectorAll('.document-chips > span').forEach((file) => {
    const actions = file.querySelector('.mini-actions');
    if (!actions || actions.querySelector('[data-view-document]')) return;
    const view = document.createElement('button');
    view.type = 'button'; view.dataset.viewDocument = 'true'; view.textContent = 'View';
    actions.prepend(view);
  });
  new MutationObserver(addViewControls).observe(content, { childList: true, subtree: true });
  content.addEventListener('click', (event) => {
    const button = event.target.closest('[data-view-document]');
    if (!button) return;
    const name = button.closest('.document-chips > span').childNodes[0].textContent.trim().replace(/^▧\s*/, '');
    window.alert(`Previewing ${name}\n\nIn a connected application, the selected file opens in the document viewer.`);
  });
})();
