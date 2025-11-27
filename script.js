
const $ = id => document.getElementById(id);

// Step management
let currentStep = 0;
const stepIds = [0,1,2,3];

function setActiveStep(i){
    if(typeof i !== 'number' || !stepIds.includes(i)) return;
    currentStep = i;

    // update panels (.stepPanel)
    stepIds.forEach(s => {
        const panel = $('step-'+s);
        if(panel) panel.classList.toggle('active', s === i);
    });

    // update stepper visual badges
    stepIds.forEach(s => {
        const badge = $('s'+s);
        if(badge) badge.classList.toggle('active', s === i);
    });
}

// Auth controls
const loginBtn = $('loginBtn'), clearBtn = $('clearBtn'), startBtn = $('startBtn');

function updateStatus(){
    const user = sessionStorage.getItem('user') || null;
    $('status').textContent = user ? 'Signed in as: ' + user : 'Not signed in.';
    startBtn.disabled = !user;
}

loginBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    const u = $('username').value.trim(), p = $('password').value.trim();
    if(!u || !p){ alert('Please enter credentials.'); return; }
    sessionStorage.setItem('user', u);
    updateStatus();

    // Expand container and move to step 1 — only if user is signed in
    $('mainContainer').classList.add('expanded');
    const s0 = $('s0'); if(s0) s0.classList.add('completed');

    // Move to step 1 immediately and reliably
    setActiveStep(0);
});

clearBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    $('username').value=''; $('password').value='';
    sessionStorage.removeItem('user');
    updateStatus();
    $('mainContainer').classList.remove('expanded');
    const s0 = $('s0'); if(s0) s0.classList.remove('completed');
    setActiveStep(0);
});

// Prevent Start if not signed in
startBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    if(!sessionStorage.getItem('user')) {
        alert('You must sign in first.');
        return;
    }
    // Expand (in case user used start) and move to step 1
    $('mainContainer').classList.add('expanded');
    setActiveStep(1);
});

// From step 1 to 2
$('toUpload').addEventListener('click', (ev) => {
    ev.preventDefault();
    // require login
    if(!sessionStorage.getItem('user')){
        alert('You must be signed in to continue.');
        setActiveStep(0);
        return;
    }

    const fn = $('fullName').value.trim();
    const bd = $('birthdate').value;
    const contact = $('contact').value.trim();
    const address = $('address').value.trim();
    const strand = $('strand').value;
    if(!fn || !bd || !contact || !address || !strand){
        alert('Please complete all required fields.');
        return;
    }
    if(!$('req-bc').checked || !$('req-grades').checked){
        if(!confirm('Required documents not all ticked. Proceed anyway?')) return;
    }
    setActiveStep(2);
});

// back buttons
$('backFrom1').addEventListener('click', (ev)=> {
    ev.preventDefault();
    // If user is not signed in collapse back to compact view
    if(!sessionStorage.getItem('user')) {
        $('mainContainer').classList.remove('expanded');
        setActiveStep(0);
    } else {
        setActiveStep(0);
    }
});
$('backFrom2').addEventListener('click', (ev)=> { ev.preventDefault(); setActiveStep(1); });
$('backFrom3').addEventListener('click', (ev)=> { ev.preventDefault(); setActiveStep(2); });

// drag & drop helpers (unchanged)
function setupDrop(dropId, inputId, thumbId){
    const drop = $(dropId), input = $(inputId), thumbs = $(thumbId);
    if(!drop || !input || !thumbs) return;
    drop.addEventListener('click', ()=> input.click());
    input.addEventListener('change', e => handleFile(e.target.files[0], thumbs));
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = 'rgba(110,231,183,0.6)'; });
    drop.addEventListener('dragleave', e => { drop.style.borderColor='rgba(255,255,255,0.03)'; });
    drop.addEventListener('drop', e => {
        e.preventDefault(); drop.style.borderColor='rgba(255,255,255,0.03)';
        const f = e.dataTransfer.files[0];
        if(f) { input.files = e.dataTransfer.files; handleFile(f, thumbs); }
    });
}
function handleFile(file, thumbs){
    const maxMB = 5;
    if(!file.type.startsWith('image/')){ alert('Only images allowed.'); return; }
    if(file.size > maxMB*1024*1024){ alert('File too big. Max '+maxMB+'MB.'); return; }
    const reader = new FileReader();
    reader.onload = e => {
        thumbs.innerHTML = '';
        const div = document.createElement('div'); div.className='thumb';
        const img = document.createElement('img'); img.src = e.target.result;
        div.appendChild(img); thumbs.appendChild(div);
        sessionStorage.setItem(thumbs.id, e.target.result);
    };
    reader.readAsDataURL(file);
}

setupDrop('drop-bc','fileBC','thumb-bc');
setupDrop('drop-g9','fileG9','thumb-g9');
setupDrop('drop-g10','fileG10','thumb-g10');

// Prepare summary (unchanged except ensure login)
$('toSummary').addEventListener('click', (ev) => {
    ev.preventDefault();
    if(!sessionStorage.getItem('user')){
        alert('You must be signed in to continue.');
        setActiveStep(0);
        return;
    }
    if(!sessionStorage.getItem('thumb-bc') || !sessionStorage.getItem('thumb-g9') || !sessionStorage.getItem('thumb-g10')){
        if(!confirm('Some document images are missing. Submit anyway?')) {
            return;
        }
    }
    const summ = $('summary');
    const obj = {
        name: $('fullName').value.trim(),
        birthdate: $('birthdate').value,
        contact: $('contact').value.trim(),
        address: $('address').value.trim(),
        school: $('school').value.trim(),
        strand: $('strand').value,
        reqs: [
            $('req-bc').checked ? 'Birth certificate' : '',
            $('req-grades').checked ? 'Grades 9 & 10' : '',
            $('req-id').checked ? 'Parent ID' : '',
        ].filter(Boolean)
    };
    summ.innerHTML = `
        <div style="display:flex;gap:12px;flex-wrap:wrap">
            <div style="flex:1;min-width:220px">
                <div style="font-size:13px;color:var(--muted)">Name</div><div style="font-weight:700">${escapeHtml(obj.name)}</div>
                <div style="font-size:13px;color:var(--muted);margin-top:6px">Birthdate</div><div>${obj.birthdate}</div>
                <div style="font-size:13px;color:var(--muted);margin-top:6px">Contact</div><div>${escapeHtml(obj.contact)}</div>
                <div style="font-size:13px;color:var(--muted);margin-top:6px">Address</div><div>${escapeHtml(obj.address)}</div>
            </div>
            <div style="flex:1;min-width:220px">
                <div style="font-size:13px;color:var(--muted)">School</div><div>${escapeHtml(obj.school)}</div>
                <div style="font-size:13px;color:var(--muted);margin-top:6px">Strand</div><div style="font-weight:700" class="strand-name">${escapeHtml(obj.strand)}</div>
                <div style="font-size:13px;color:var(--muted);margin-top:6px">Checked requirements</div><div class="muted">${obj.reqs.join(', ') || '— none'}</div>
            </div>
            <div style="min-width:200px">
                <div style="font-size:13px;color:var(--muted)">Uploaded</div>
                <div style="display:flex;gap:8px;margin-top:6px">
                    <div class="thumb">${ sessionStorage.getItem('thumb-bc') ? '<img src="'+sessionStorage.getItem('thumb-bc')+'" />' : 'BC' }</div>
                    <div class="thumb">${ sessionStorage.getItem('thumb-g9') ? '<img src="'+sessionStorage.getItem('thumb-g9')+'" />' : 'G9' }</div>
                    <div class="thumb">${ sessionStorage.getItem('thumb-g10') ? '<img src="'+sessionStorage.getItem('thumb-g10')+'" />' : 'G10' }</div>
                </div>
            </div>
        </div>`;
    renderCounts();
    setActiveStep(3);
});

function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Enrollment submit
$('submitEnroll').addEventListener('click', (ev) => {
    ev.preventDefault();
    if(!sessionStorage.getItem('user')){
        alert('You must be signed in to submit.');
        setActiveStep(0);
        return;
    }
    const strand = $('strand').value;
    if(!strand){ alert('Invalid strand'); return; }
    const raw = localStorage.getItem('strandCounts');
    const counts = raw ? JSON.parse(raw) : {};
    counts[strand] = (counts[strand] || 0) + 1;
    localStorage.setItem('strandCounts', JSON.stringify(counts));
    alert('Enrollment submitted. Thank you!');
    sessionStorage.removeItem('thumb-bc');
    sessionStorage.removeItem('thumb-g9');
    sessionStorage.removeItem('thumb-g10');
    $('enrollForm').reset();
    $('thumb-bc').innerHTML=''; $('thumb-g9').innerHTML=''; $('thumb-g10').innerHTML='';
    renderCounts();
});

// render counts
function renderCounts(){
    const area = $('countsArea'); area.innerHTML='';
    const raw = localStorage.getItem('strandCounts');
    const counts = raw ? JSON.parse(raw) : {};
    const strands = ['STEM','ABM','HUMSS','TVL'];
    strands.forEach(s => {
        const card = document.createElement('div'); card.className='count-card';
        card.innerHTML = `<div class="strand-name">${s}</div><div class="c-num">${counts[s]||0}</div>`;
        area.appendChild(card);
    });
}

// init
(function init(){
    updateStatus();
    // ensure panels use .active class instead of display toggles
    setActiveStep(0);
    renderCounts();
})();

// keyboard accessibility for drop zones
['drop-bc','drop-g9','drop-g10'].forEach(id=>{
    const el = $(id);
    if(!el) return;
    el.addEventListener('keydown', e => { if(e.key==='Enter' || e.key===' ') { e.preventDefault(); el.click(); } });
});