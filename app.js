import { calculate, DEFAULTS } from './model.js';
const $ = id => document.getElementById(id);
const KEY = 'geo02-inquiry-v1';
let tidal3d = null, viewMode = '2d', loading3d = false, failed3d = false;
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let records = [], choice = '', inputs = { ...DEFAULTS }, storageAvailable = true;
const concepts = [
  ['Ⅶ', '☼', '경관적 가치', '뛰어난 자연 현상과 자연의 아름다움에 주목해요.', '제주 화산섬과 용암동굴 · 121쪽'],
  ['Ⅷ', '△', '지질학적 가치', '지구의 역사와 지형이 만들어지는 과정을 보여 줘요.', '제주 화산섬과 용암동굴 · 121~122쪽'],
  ['Ⅸ', '♧', '생태학적 가치', '생태계와 생물 군락이 변화하고 발달하는 중요한 과정에 주목해요.', '기준 설명 · 120쪽'],
  ['Ⅹ', '⌁', '생물학적 가치', '멸종 위기종을 포함한 생물 다양성을 지키는 중요한 서식지예요.', '한국의 갯벌 · 121, 123쪽']
];
$('concept-cards').innerHTML = concepts.map(([roman, icon, title, desc, example], i) => `<article class="concept-card"><span class="concept-symbol" aria-hidden="true">${icon}</span><span class="roman">${roman}</span><h3>${title}${i === 3 ? '<span class="focus-badge">이번 탐구</span>' : ''}</h3><p>${desc}</p><div class="example">${example}</div></article>`).join('');
// The four criteria are conceptual lenses, never an automatic inscription score.
$('concept-cards').insertAdjacentHTML('afterend', '<p class="footnote">등재 기준 중 하나 이상과 함께 가치의 충분한 구성 요소, 제도적 관리도 검토합니다. 네 가지 가치의 단순 합계로 등재가 결정되지는 않습니다. (120쪽)</p>');
function tab(name) {
  document.querySelectorAll('.panel').forEach(p => p.hidden = p.id !== name);
  document.querySelectorAll('.step').forEach(b => {
    const active = b.dataset.tab === name;
    b.classList.toggle('active', active); b.setAttribute('aria-selected', String(active));
  });
}
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => tab(b.dataset.tab)));
document.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => { tab(b.dataset.next); document.querySelector('.steps').scrollIntoView({ behavior:'smooth', block:'start' }); }));
function save() {
  const answers = Object.fromEntries([...document.querySelectorAll('[data-save]')].map(el => [el.id, el.value]));
  try { localStorage.setItem(KEY, JSON.stringify({ answers, inputs, records, choice })); }
  catch { storageAvailable = false; }
  $('save-status').textContent = storageAvailable ? '✓ 이 브라우저에 저장됨' : '자동 저장을 사용할 수 없어요. PDF로 기록을 보관하세요.';
}
function restore() {
  try {
    const state = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!state || typeof state !== 'object') return;
    document.querySelectorAll('[data-save]').forEach(el => { if(typeof state.answers?.[el.id] === 'string') el.value = state.answers[el.id]; });
    for (const key of Object.keys(DEFAULTS)) if(Number.isFinite(state.inputs?.[key])) inputs[key] = Math.max(0, Math.min(100, state.inputs[key]));
    records = Array.isArray(state.records) ? state.records.filter(r => r && Object.keys(DEFAULTS).every(k => Number.isFinite(r[k]) && r[k] >= 0 && r[k] <= 100)).slice(0,8).map(r => ({area:r.area,pollution:r.pollution,protection:r.protection})) : [];
    choice = ['Ⅶ','Ⅷ','Ⅸ','Ⅹ'].includes(state.choice) ? state.choice : '';
  } catch { storageAvailable = false; $('save-status').textContent = '저장된 기록을 불러올 수 없어요. PDF로 기록을 보관하세요.'; }
}
function draw() {
  const m = calculate(inputs);
  if(tidal3d) tidal3d.update(inputs, m);
  for (const key of Object.keys(DEFAULTS)) { $(key).value = inputs[key]; $(`${key}-value`).textContent = inputs[key] + (key === 'area' ? '%' : ''); }
  $('metrics').innerHTML = [['habitat','서식 기반'],['birds','철새 쉼터'],['purification','정화 잠재력']].map(([key,label]) => `<div class="metric"><span>${label}</span><strong>${m[key]}<small>/ 100</small></strong><div class="bar"><i style="width:${m[key]}%"></i></div></div>`).join('');
  const y = 295 - inputs.area * 1.15;
  $('mud').setAttribute('d', `M0 ${y} Q150 ${y-35} 320 ${y+5} T760 ${y-5} V300H0Z`);
  const birdCount = Math.round(m.birds / 9);
  $('birds').innerHTML = Array.from({length:birdCount}, (_,i) => {
    const x = 190 + ((i*83)%480), yy = Math.min(280,y+30+(i%3)*15);
    return `<g transform="translate(${x} ${yy})" fill="#faf8e9" stroke="#3c5e52" stroke-width="1.7"><ellipse rx="10" ry="5"/><path d="M6-2q-2-20 5-20l12 4-12 1M-3 4v15m7-15v15" fill="none"/></g>`;
  }).join('');
  $('plants').innerHTML = inputs.area === 0 ? '' : Array.from({length:Math.ceil(inputs.area/12)},(_,i) => `<path d="M${35+i*90} 289l2-22m-2 14-7-9m9 4 6-10" fill="none" stroke="#668466" stroke-width="2.4"/>`).join('');
  $('pollutants').innerHTML = Array.from({length:Math.round(inputs.pollution/6)},(_,i)=>`<circle cx="${45+(i*47)%700}" cy="${154+(i*17)%32}" r="${3+i%3}" fill="#948569" opacity=".5"/>`).join('');
  $('scene').setAttribute('aria-label', `가상 갯벌: 면적 ${inputs.area}%, 서식 기반 ${m.habitat}, 철새 쉼터 ${m.birds}, 정화 잠재력 ${m.purification}. 실제 관측값이 아닌 가상 지수.`);
  $('scene-label').textContent = inputs.area === 0 ? '남아 있는 갯벌이 없어요' : `남아 있는 갯벌 ${inputs.area}%`;
}
function renderRecords() {
  $('records').innerHTML = records.length ? records.map((r,i) => {
    const m = calculate(r);
    return `<tr><td>${i+1}차</td><td>${r.area}%</td><td>${r.pollution}</td><td>${r.protection}</td><td>${m.habitat}</td><td>${m.birds}</td><td>${m.purification}</td><td><button class="delete" data-delete="${i}" aria-label="${i+1}차 실험 삭제">삭제</button></td></tr>`;
  }).join('') : '<tr><td colspan="8" class="empty">조건을 바꾼 뒤 ‘결과 기록’을 눌러 첫 실험을 남겨 보세요.</td></tr>';
  $('record').disabled = records.length >= 8;
  $('record').textContent = records.length >= 8 ? '8회 기록 완료' : '＋ 결과 기록';
}
for (const key of Object.keys(DEFAULTS)) $(key).addEventListener('input', e => { inputs[key] = Number(e.target.value); draw(); save(); });
$('record').addEventListener('click', () => { if(records.length >= 8) return; records.push({...inputs}); renderRecords(); save(); });
$('records').addEventListener('click', e => { const b=e.target.closest('[data-delete]'); if(b){ records.splice(Number(b.dataset.delete),1);renderRecords();save(); } });
$('reset').addEventListener('click', () => {inputs = {...DEFAULTS};draw();save();});
document.querySelectorAll('[data-save]').forEach(el=>el.addEventListener('input',save));
document.querySelectorAll('.preset').forEach(b => b.addEventListener('click',()=>{for(const key of Object.keys(DEFAULTS)) inputs[key]=Number(b.dataset[key]);draw();save();tab('lab');}));
function choices() {
  $('choices').innerHTML = concepts.map(([roman,,title])=>`<button type="button" aria-pressed="${choice===roman}" class="${choice===roman?'selected':''}" data-choice="${roman}">${roman} ${title}</button>`).join('');
  $('choice-feedback').textContent = !choice ? '교과서에 제시된 한국의 갯벌 등재 근거를 떠올려 보세요.' : choice==='Ⅹ' ? '맞아요. 교과서에서는 다양한 생물과 멸종 위기종의 서식지라는 생물학적 가치를 설명합니다. (121, 123쪽)' : '갯벌이 가진 여러 의미와 실제 등재 근거는 구분해요. 교과서 121, 123쪽에서 생물 다양성과 멸종 위기종의 서식지를 확인해 보세요.';
}
$('choices').addEventListener('click', e=>{const b=e.target.closest('[data-choice]');if(b){choice=b.dataset.choice;choices();save();}});
$('clear').addEventListener('click',()=>{
  if(!confirm('입력한 답변과 모든 실험 기록을 지울까요?'))return;
  document.querySelectorAll('[data-save]').forEach(el=>el.value='');inputs={...DEFAULTS};records=[];choice='';draw();renderRecords();choices();save();
});
const answer = id => escapeHTML($(id).value.trim() || '(아직 작성하지 않음)');
function buildReport() {
  const rows=records.map((r,i)=>{const m=calculate(r);return `<tr><td>${i+1}</td><td>${r.area}%</td><td>${r.pollution}</td><td>${r.protection}</td><td>${m.habitat}</td><td>${m.birds}</td><td>${m.purification}</td></tr>`;}).join('');
  const sections=[['실험 전 예상','prediction'],['일상 적용 · 산책로와 갯벌','daily'],['낯선 상황 · 철새 이동 경로','unfamiliar'],['주장','claim'],['실험 근거','evidence'],['개념을 연결한 이유','reasoning'],['한계와 추가 탐구','limitations']];
  $('print-report').innerHTML=`<div class="print-help">인쇄 창에서 ‘PDF로 저장’을 선택하세요. <button class="button light" id="print-again">인쇄 창 열기</button> <button class="button light" id="back-to-app">탐구실로 돌아가기</button></div><div class="print-title"><div class="eyebrow">자연유산 탐구실 · 개념 기반 탐구 보고서</div><h1>갯벌에서 발견한 자연의 가치</h1><p>이름: ${answer('student')}　 학급·번호: ${answer('classroom')}</p><p>핵심 질문: 갯벌이 줄어들면, 철새와 우리의 삶은 어떻게 달라질까요?</p></div><div class="print-section"><h3>실험 기록 · 모든 수치는 학습용 가상 지수</h3><table class="print-table"><thead><tr><th>실험</th><th>면적</th><th>오염</th><th>보호</th><th>서식 기반</th><th>철새 쉼터</th><th>정화 잠재력</th></tr></thead><tbody>${rows||'<tr><td colspan="7">기록된 실험 없음</td></tr>'}</tbody></table></div>${sections.map(([title,id])=>`<div class="print-section"><h3>${title}</h3><div class="print-answer">${answer(id)}</div></div>`).join('')}<div class="print-section"><h3>내가 선택한 등재 가치</h3><p>${escapeHTML(choice ? concepts.find(c=>c[0]===choice)[2] : '선택하지 않음')}</p><p>교과서의 한국의 갯벌 등재 근거: Ⅹ 생물학적 가치 (121, 123쪽)</p></div><div class="print-source">출처: 비상교육 고등 「한국지리 탐구」 IV-01 세계유산과 자연경관, 118~129쪽. 네 가지 등재 기준 및 관리 조건 120쪽, 국내 자연유산 121쪽, 갯벌 특징과 기능 123쪽.<br>교과서 사실: 한국의 갯벌은 다양한 생물과 멸종 위기종의 서식지이며 철새의 기착지입니다.<br>모델의 가정: A=면적/100, P=오염/100, C=보호/100, H=(1−0.7P)(0.65+0.35C). 서식 기반=100AH, 철새 쉼터=100A√H, 정화 잠재력=100A(1−0.5P). 반올림한 0~100의 가상 지수로 실제 관측·예측이나 등재 심사에 사용할 수 없습니다. 산책로와 해외 습지 상황은 창작한 적용 과제입니다.<br>별도 개념 기반 탐구 학습 자료는 아직 반영 전이며, 현재 활동은 사용자가 제시한 수업 흐름을 바탕으로 구성한 초안입니다.</div>`;
  $('back-to-app').addEventListener('click',()=>document.body.classList.remove('pdf-mode'));
  $('print-again').addEventListener('click',()=>window.print());
}
function exportPDF(){save();buildReport();document.body.classList.add('pdf-mode');window.scrollTo(0,0);requestAnimationFrame(()=>window.print());}
$('pdf-top').addEventListener('click',exportPDF);$('pdf-report').addEventListener('click',exportPDF);
window.addEventListener('beforeprint',buildReport);
restore();draw();renderRecords();choices();

// Load the local 3D renderer only when requested. The 2D workflow stays available
// when WebGL is unavailable or a renderer cannot be loaded.
function setView(mode) {
  viewMode=mode;
  $('scene').toggleAttribute('hidden',mode==='3d');
  $('scene-3d-panel').hidden=mode!=='3d';
  for(const name of ['2d','3d']) {
    $(`view-${name}`).classList.toggle('selected',mode===name);
    $(`view-${name}`).setAttribute('aria-pressed',String(mode===name));
  }
  if(mode==='2d') $('view-status').textContent=failed3d ? '3D를 사용할 수 없어 2D로 표시합니다.' : '평면으로 관찰하기';
  else $('view-status').textContent=tidal3d ? '입체로 관찰하기 · 학습용 모형' : '3D 모형을 준비하고 있어요…';
}
$('view-2d').addEventListener('click',()=>setView('2d'));
$('view-3d').addEventListener('click',async()=>{
  setView('3d');
  if(tidal3d || loading3d)return;
  loading3d=true;
  try {
    const { createTidalScene }=await import('./scene3d.js');
    tidal3d=createTidalScene($('scene-3d'));
    tidal3d.update(inputs,calculate(inputs));
    failed3d=false;
    if(viewMode==='3d')setView('3d');
    tidal3dCanvasEvents();
  } catch {
    failed3d=true;
    $('scene-3d').replaceChildren();
    setView('2d');
    $('view-status').textContent='3D를 사용할 수 없어요. 2D로 계속 탐구하거나 다른 브라우저에서 시도해 주세요.';
  } finally {loading3d=false;}
});
function tidal3dCanvasEvents() {
  $('scene-3d').querySelector('canvas').addEventListener('webglcontextlost',e=>{
    e.preventDefault();
    failed3d=true;
    setView('2d');
    $('view-status').textContent='3D 그래픽 연결이 중단되어 2D로 돌아왔어요. 새로고침하면 다시 시도할 수 있습니다.';
    $('view-3d').disabled=true;
  });
}
for(const [id,action] of Object.entries({
  'camera-left':()=>tidal3d?.orbit(-.2), 'camera-right':()=>tidal3d?.orbit(.2),
  'camera-up':()=>tidal3d?.orbit(0,-.15), 'camera-down':()=>tidal3d?.orbit(0,.15),
  'camera-in':()=>tidal3d?.zoom(.85), 'camera-out':()=>tidal3d?.zoom(1.18),
  'camera-reset':()=>tidal3d?.resetCamera()
})) $(id).addEventListener('click',action);
