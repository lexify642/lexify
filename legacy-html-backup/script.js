document.querySelectorAll('[data-search]').forEach((input) => {
  input.addEventListener('input', () => {
    const term = input.value.toLowerCase();
    document.querySelectorAll(input.dataset.search).forEach((row) => { row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none'; });
  });
});

document.querySelectorAll('[data-calculate]').forEach((button) => {
  button.addEventListener('click', () => {
    const amount = Number(document.querySelector('#relief')?.value.replace(/,/g, '')) || 2500000;
    const fee = Math.min(Math.round(amount * .035), 300000);
    document.querySelector('#court-fee').textContent = '₹' + fee.toLocaleString('en-IN');
    document.querySelector('#total-cost').textContent = '₹' + (fee + 28600).toLocaleString('en-IN');
  });
});

const generator = document.querySelector('[data-library-view="generator"]');
const appState = {
  template: 'Partnership Deed', description: 'Configure your document, then review it live before exporting.', variants: ['General', 'LLP', 'Family', 'Limited'], variant: 'General', step: 1,
  fields: { title: 'Partnership Deed', partyA: '', partyACapacity: 'Partner', partyB: '', partyBCapacity: 'Partner', address: '', effectiveDate: '', governingLaw: 'India', capital: '', profitShare: '', purpose: '' },
  conditions: { confidentiality: true, nonCompete: false, arbitration: true }, extraClause: false
};

const byId = (id) => document.getElementById(id);
const fieldValue = (name, fallback) => appState.fields[name]?.trim() || fallback;
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' })[char]);

function renderPreview() {
  const title = escapeHtml(fieldValue('title', appState.template));
  const a = escapeHtml(fieldValue('partyA', 'FIRST PARTY'));
  const b = escapeHtml(fieldValue('partyB', 'SECOND PARTY'));
  const aCapacity = escapeHtml(fieldValue('partyACapacity', 'Party'));
  const bCapacity = escapeHtml(fieldValue('partyBCapacity', 'Party'));
  const address = escapeHtml(fieldValue('address', 'their respective addresses stated below'));
  const purpose = escapeHtml(fieldValue('purpose', 'the business and commercial purpose to be agreed between the Parties'));
  const date = appState.fields.effectiveDate ? new Date(`${appState.fields.effectiveDate}T00:00:00`).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : 'the date of execution';
  const capital = escapeHtml(fieldValue('capital', 'the agreed capital contribution'));
  const share = escapeHtml(fieldValue('profitShare', 'the agreed ratio'));
  const templateWord = appState.template.toUpperCase();
  const additions = [appState.conditions.confidentiality && '<h4>Confidentiality</h4><p>Each Party shall keep confidential all non-public commercial, financial and technical information received in connection with this arrangement, except where disclosure is required by law.</p>', appState.conditions.nonCompete && '<h4>Non-compete</h4><p>During the term, neither Party shall knowingly engage in a business that directly competes with the agreed purpose without the prior written consent of the other Party.</p>', appState.conditions.arbitration && `<h4>Dispute Resolution</h4><p>Any dispute arising out of or in connection with this document shall first be referred to arbitration in accordance with the laws of ${escapeHtml(appState.fields.governingLaw)}.</p>`, appState.extraClause && '<h4>Additional Clause</h4><p>The Parties shall cooperate in good faith and execute any further documents reasonably required to give effect to this arrangement.</p>'].filter(Boolean).join('');
  byId('preview-document-name').textContent = fieldValue('title', appState.template);
  byId('document-preview').innerHTML = `<h3>${templateWord}</h3><p class="preview-meta">${escapeHtml(appState.variant)} variant · Draft preview</p><p>This ${title} is made on <b>${date}</b> by and between:</p><p><b>${a}</b>, acting as ${aCapacity}, and <b>${b}</b>, acting as ${bCapacity}, having their registered or principal office at ${address}.</p><h4>1. Purpose</h4><p>The Parties wish to record their understanding in relation to ${purpose}.</p><h4>2. Capital and Participation</h4><p>The agreed capital contribution shall be ${capital}. The Parties shall participate in profits and losses in the ratio of ${share}.</p>${additions}<h4>Execution</h4><p>IN WITNESS WHEREOF, the Parties have executed this ${title} on the date first written above.</p>`;
}

function setStep(step) {
  appState.step = Math.max(1, Math.min(3, step));
  document.querySelectorAll('[data-generator-step]').forEach((button) => button.classList.toggle('active', Number(button.dataset.generatorStep) === appState.step));
  document.querySelectorAll('[data-panel]').forEach((panel) => panel.classList.toggle('active', Number(panel.dataset.panel) === appState.step));
  byId('generator-status').textContent = `Step ${appState.step} of 3`;
}

function renderVariants() {
  const picker = byId('variant-picker');
  picker.replaceChildren(...appState.variants.map((variant) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = `variant-choice${variant === appState.variant ? ' selected' : ''}`;
    button.innerHTML = `<b>${escapeHtml(variant)}</b><span>Use this ${escapeHtml(variant.toLowerCase())} structure</span>`;
    button.addEventListener('click', () => { appState.variant = variant; renderVariants(); renderPreview(); }); return button;
  }));
}

function openGenerator(card) {
  appState.template = card.dataset.template;
  appState.description = card.dataset.description;
  appState.variants = card.dataset.variants.split('|');
  appState.variant = appState.variants[0]; appState.step = 1;
  appState.fields = { ...appState.fields, title: appState.template };
  byId('generator-title').textContent = appState.template; byId('generator-description').textContent = appState.description;
  byId('workspace-title').textContent = appState.template; byId('workspace-subtitle').textContent = 'Template Bank · Configure your legal document';
  document.querySelector('[data-back-to-templates]').hidden = false;
  location.hash = '#generator'; renderVariants(); syncFields(); renderPreview(); setStep(1);
}

function syncFields() { document.querySelectorAll('[data-document-field]').forEach((input) => { input.value = appState.fields[input.dataset.documentField] || ''; }); document.querySelectorAll('[data-condition]').forEach((input) => { input.checked = Boolean(appState.conditions[input.dataset.condition]); }); }

function exportPdf() { window.print(); }
function saveDraft() { const button = document.querySelector('[data-save-draft]'); if (!button) return; const original = button.textContent; button.textContent = 'Saved ✓'; setTimeout(() => { button.textContent = original; }, 1400); }

document.querySelectorAll('.template-card').forEach((card) => {
  card.addEventListener('click', (event) => { if (event.target.closest('button') || event.target.closest('.template-card')) openGenerator(card); });
  card.tabIndex = 0; card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openGenerator(card); } });
});
document.querySelectorAll('[data-generator-step]').forEach((button) => button.addEventListener('click', () => setStep(Number(button.dataset.generatorStep))));
document.querySelectorAll('[data-next-step]').forEach((button) => button.addEventListener('click', () => setStep(appState.step + 1)));
document.querySelectorAll('[data-previous-step]').forEach((button) => button.addEventListener('click', () => setStep(appState.step - 1)));
document.querySelectorAll('[data-document-field]').forEach((input) => input.addEventListener('input', () => { appState.fields[input.dataset.documentField] = input.value; renderPreview(); }));
document.querySelectorAll('[data-condition]').forEach((input) => input.addEventListener('change', () => { appState.conditions[input.dataset.condition] = input.checked; renderPreview(); }));
document.querySelectorAll('[data-export-pdf]').forEach((button) => button.addEventListener('click', exportPdf));
document.querySelectorAll('[data-save-draft]').forEach((button) => button.addEventListener('click', saveDraft));
document.querySelector('[data-back-to-templates]')?.addEventListener('click', () => { location.hash = '#templates'; });
document.querySelector('[data-insert-clause]')?.addEventListener('click', () => { appState.extraClause = true; renderPreview(); });

if (window.CASEFLOW_CLAUSES) {
  const clauseContainer = document.querySelector('#clause-results'); const clauseSearch = document.querySelector('#clause-search'); const categoryFilter = document.querySelector('#clause-category'); const clauseCount = document.querySelector('#clause-count'); const documentCanvas = document.querySelector('.document');
  const showView = () => { const viewName = ['clauses','templates','generator'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'draft'; document.querySelectorAll('[data-library-view]').forEach((view) => view.classList.toggle('active', view.dataset.libraryView === viewName)); document.querySelectorAll('[data-workspace-tab]').forEach((tab) => tab.classList.toggle('active', tab.dataset.workspaceTab === viewName)); if (viewName !== 'generator') document.querySelector('[data-back-to-templates]').hidden = true; };
  const renderClauses = () => { const term = clauseSearch.value.trim().toLowerCase(), selected = categoryFilter.value; const matches = window.CASEFLOW_CLAUSES.filter((clause) => (!selected || clause.category === selected) && [clause.id,clause.category,clause.type,clause.name,clause.domain,clause.text].join(' ').toLowerCase().includes(term)); clauseCount.textContent = `${matches.length} clause${matches.length === 1 ? '' : 's'} available`; clauseContainer.replaceChildren(...matches.map((clause) => { const card=document.createElement('article'); card.className='card clause-card'; const risk=document.createElement('span'); risk.className=`badge ${clause.risk === 'HIGH' ? 'red' : clause.risk === 'MEDIUM' ? 'orange' : 'blue'}`; risk.textContent=clause.risk || 'Standard'; const title=document.createElement('h3'); title.textContent=clause.name || clause.type; const meta=document.createElement('div'); meta.className='clause-meta'; meta.textContent=`${clause.category} · ${clause.type}`; const text=document.createElement('p'); text.className='clause-text'; text.textContent=clause.text || 'Clause text unavailable.'; const footer=document.createElement('div'); footer.className='clause-footer'; const id=document.createElement('span'); id.className='clause-id'; id.textContent=clause.id; const insert=document.createElement('button'); insert.className='btn btn-soft'; insert.textContent='Insert'; insert.addEventListener('click', () => { if(documentCanvas) documentCanvas.innerText += `\n\n${clause.text}`; location.hash='#draft'; showView(); }); footer.append(id,insert); card.append(risk,title,meta,text,footer); return card; })); };
  [...new Set(window.CASEFLOW_CLAUSES.map((clause) => clause.category).filter(Boolean))].sort().forEach((category) => { const option=document.createElement('option'); option.value=category; option.textContent=category; categoryFilter.append(option); });
  clauseSearch.addEventListener('input', renderClauses); categoryFilter.addEventListener('change', renderClauses); window.addEventListener('hashchange', showView); renderClauses(); showView();
}
