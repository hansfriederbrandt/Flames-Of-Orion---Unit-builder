var PANEL_COUNT = 4;
var NEW_COUNT = 4;
const panelGrid = document.getElementById('panel-grid');
const unit_numbers = document.getElementById('unit-numbers');

let units = [];
let items = [];
let ammo = [];

// per-panel runtime state and refs
var panels = Array.from({length: PANEL_COUNT}, () => ({
  state: {
    selectedIndex: 0,
    maxHP: 0, currentHP: 0,
    heatLimit: 0, currentHeat: 0,
    savedHPBeforeHeatOverride: null
  },
  refs: {platformList: null, statsGrid: null, statsMap: {}, totalEl: null, gameplayHp: null, gameplayHeat: null, hpPlus: null, hpMinus: null, heatPlus: null, heatMinus: null, destroyed: null}
}));

async function loadData(){
  const [uRes, pRes, aRes] = await Promise.all([
    fetch('data/Units.json'),
    fetch('data/Platform.json'),
    fetch('data/Ammo.json')
  ]);
  const ujson = await uRes.json();
  const pjson = await pRes.json();
  const ajson = await aRes.json();

  units = ujson.Units || [];
  items = (pjson.Platform && pjson.Platform.Items) || pjson.Items || [];
  ammo = ajson.Ammo || [];

  initPanels();
}

function initPanels() {
  // panelGrid.innerHTML = '';
  var panel_diff = NEW_COUNT - PANEL_COUNT;
  if (panel_diff > 0) {
    // if reducing panels, remove excess panels from the end
    for (let i = PANEL_COUNT; i < NEW_COUNT; i++) {
      const panelEl = createPanel(i);
      panelGrid.appendChild(panelEl);
      populateUnitSelect(i);
      renderPanel(i);
    }
    // adjust widths based on current window size
  } else if (panel_diff < 0) {
    // for (let i = 0; i < NEW_COUNT; i++) {
    //   const panelEl = createPanel(i);
    //   panelGrid.appendChild(panelEl);
    //   populateUnitSelect(i);
    //   renderPanel(i);
    // }
  } else {
    for (let i = 0; i < PANEL_COUNT; i++) {
      const panelEl = createPanel(i);
      panelGrid.appendChild(panelEl);
      populateUnitSelect(i);
      renderPanel(i);
    }

    

  }
  adjustPanelWidths();
}

function adjustPanelWidths(){
  // compute available width (respect body padding and a max main width)
  const gap = 12; // must match CSS grid gap
  const bodyStyle = getComputedStyle(document.body);
  const padLeft = parseInt(bodyStyle.paddingLeft) || 0;
  const padRight = parseInt(bodyStyle.paddingRight) || 0;
  const availableWindow = window.innerWidth - padLeft - padRight;
  const totalGaps = gap * (PANEL_COUNT - 1);
  let w = Math.floor((availableWindow - totalGaps) / PANEL_COUNT);
  const minW = 140;
  const maxW = 800;
  if(w < minW) w = minW;
  if(w > maxW) w = maxW;
  panelGrid.style.gridTemplateColumns = `repeat(${PANEL_COUNT}, ${w}px)`;
}

window.addEventListener('resize', adjustPanelWidths);
window.addEventListener('orientationchange', adjustPanelWidths);


function createPanel(i){
  const wrapper = document.createElement('div'); wrapper.className='unit-panel';

  // header select
  const header = document.createElement('div'); header.className='row';
  const lbl = document.createElement('label'); lbl.textContent = `Unit ${i+1}`;
  const sel = document.createElement('select'); sel.id = `unit-select-${i}`;
  header.appendChild(lbl); header.appendChild(sel);

  // stats card
  const statsCard = document.createElement('section'); statsCard.className='card';
  const callsign = document.createElement('input'); callsign.type='text'; callsign.placeholder='Callsign'; callsign.className='callsign-input';
  const stH = document.createElement('h3'); stH.textContent='Stats';
  const statsGrid = document.createElement('div'); statsGrid.className='unit-stats'; statsGrid.id = `stats-${i}`;
  statsCard.appendChild(callsign); statsCard.appendChild(stH); statsCard.appendChild(statsGrid);

  // gameplay card
  const gpCard = document.createElement('section'); gpCard.className='card';
  const gpH = document.createElement('h3'); gpH.textContent='Gameplay';
  gpCard.appendChild(gpH);
  const hpRow = document.createElement('div'); hpRow.className='gameplay-row';
  const hpLabel = document.createElement('div'); hpLabel.innerHTML = `<strong>HP:</strong> <span id="gameplay-hp-${i}">-</span>`;
  const hpButtons = document.createElement('div'); hpButtons.className='buttons row';
  const hpMinus = document.createElement('button'); hpMinus.id=`hp-minus-${i}`; hpMinus.textContent='-';
  const hpPlus = document.createElement('button'); hpPlus.id=`hp-plus-${i}`; hpPlus.textContent='+';
  hpButtons.appendChild(hpMinus); hpButtons.appendChild(hpPlus);
  hpRow.appendChild(hpLabel); hpRow.appendChild(hpButtons);

  const heatRow = document.createElement('div'); heatRow.className='gameplay-row';
  const heatLabel = document.createElement('div'); heatLabel.innerHTML = `<strong>Heat:</strong> <span id="gameplay-heat-${i}">-</span>`;
  const heatButtons = document.createElement('div'); heatButtons.className='buttons row';
  const heatMinus = document.createElement('button'); heatMinus.id=`heat-minus-${i}`; heatMinus.textContent='-';
  const heatPlus = document.createElement('button'); heatPlus.id=`heat-plus-${i}`; heatPlus.textContent='+';
  heatButtons.appendChild(heatMinus); heatButtons.appendChild(heatPlus);
  heatRow.appendChild(heatLabel); heatRow.appendChild(heatButtons);

  const destroyed = document.createElement('div'); destroyed.id = `destroyed-${i}`; destroyed.className='destroyed'; destroyed.style.display='none'; destroyed.textContent='DESTROYED';

  gpCard.appendChild(hpRow); gpCard.appendChild(heatRow); gpCard.appendChild(destroyed);

  // platforms card
  const platCard = document.createElement('section'); platCard.className='card';
  const plH = document.createElement('h3'); plH.textContent='Platforms';
  const plList = document.createElement('div'); plList.id = `platform-list-${i}`; plList.className='platform-list';
  // add header row for platform columns
  const plHeader = document.createElement('div'); plHeader.className='platform-slot header';
  const hPlatform = document.createElement('div'); hPlatform.textContent='Platform';
  const hDmg = document.createElement('div'); hDmg.textContent='Damage'; hDmg.className='platform-damage';
  const hRange = document.createElement('div'); hRange.textContent='Range'; hRange.className='platform-range';
  // add an empty spacer so header has same number of columns as rows (4)
  const hSpacer = document.createElement('div'); hSpacer.textContent='';
  plHeader.appendChild(hPlatform); plHeader.appendChild(hDmg); plHeader.appendChild(hRange); plHeader.appendChild(hSpacer);
  platCard.appendChild(plH); platCard.appendChild(plList);
  platCard.insertBefore(plHeader, plList);

  // add total into the stats card (HP/Heat moved to gameplay area)
  const totalRow = document.createElement('div'); totalRow.className='row'; totalRow.innerHTML = `<strong>Total Cost:</strong> <span id="total-${i}">0</span>¢`;
  statsCard.appendChild(totalRow);

  wrapper.appendChild(header);
  wrapper.appendChild(statsCard);
  wrapper.appendChild(gpCard);
  wrapper.appendChild(platCard);

  // store refs
  panels[i].refs = {
    select: sel,
    statsGrid,
    statsMap: {},
    platformList: plList,
    totalEl: totalRow.querySelector('span'),
    gameplayHp: hpLabel.querySelector('span'),
    gameplayHeat: heatLabel.querySelector('span'),
    hpPlus, hpMinus, heatPlus, heatMinus, destroyed
  };
  // runtime tracking for generated slots created by grant-type platforms
  panels[i].state.extraSlots = 0;
  panels[i].state.generatedIds = [];

  // events
  sel.addEventListener('change', ()=> onPanelUnitChange(i));
  hpPlus.addEventListener('click', ()=> onHpPlus(i));
  hpMinus.addEventListener('click', ()=> onHpMinus(i));
  heatPlus.addEventListener('click', ()=> onHeatPlus(i));
  heatMinus.addEventListener('click', ()=> onHeatMinus(i));

  return wrapper;
}

// Parse and apply Mods from selected platforms to the unit's stats
function parseModToken(token){
  token = token.trim();
  // patterns: STAT+N or STAT-N  (add/subtract), STAT=VALUE (set)
  const addMatch = token.match(/^([A-Za-z]+)\s*([+-]\d+)$/);
  if(addMatch){ return {stat: addMatch[1].toUpperCase(), op:'add', value: Number(addMatch[2])}; }
  const setMatch = token.match(/^([A-Za-z]+)\s*=\s*(.+)$/);
  if(setMatch){ return {stat: setMatch[1].toUpperCase(), op:'set', value: setMatch[2].trim()}; }
  return null;
}

function applyModsAndRenderStats(panelIndex){
  const p = panels[panelIndex];
  const u = units[p.state.selectedIndex];
  if(!u) return;
  // base stats
  const base = {
    'Category': u.Category,
    'Name': u.Name,
    'Speed (S)': u['Speed (S)'],
    'Combat Skill (CS)': u['Combat Skill (CS)'],
    'Armor (AR)': u['Armor (AR)'],
    'Hull Points (HP)': u['Hull Points (HP)'],
    'Heat Limit (HL)': u['Heat Limit (HL)'],
    'Platforms (PF)': u['Platforms (PF)'],
    'Cost': u['Cost'] || 0
  };
  const modified = Object.assign({}, base);
  const modifiedKeys = new Set();

  // scan selected platforms for Mods
  p.refs.platformList.querySelectorAll('.platform-slot').forEach(slot=>{
    const sel = slot.querySelector('select');
    const grantName = slot.dataset && slot.dataset.grantName;
    // process grant-type entry only if it's not the currently selected item (avoid double-apply)
    if(grantName && !(sel && sel.value===grantName)){
      const git = items.find(x=>x.Name===grantName);
      if(git && git.Mods && git.Mods!=='-'){
        const parts = git.Mods.split(/[,;]+/);
        parts.forEach(tok=>{
          const m = parseModToken(tok); if(!m) return;
          const map = {'HP':'Hull Points (HP)', 'AR':'Armor (AR)', 'HL':'Heat Limit (HL)', 'S':'Speed (S)', 'CS':'Combat Skill (CS)', 'PF':'Platforms (PF)'};
          const key = map[m.stat] || m.stat;
          if(m.op==='add'){ const cur = Number(modified[key]) || 0; modified[key] = cur + m.value; modifiedKeys.add(key);} else if(m.op==='set'){ modified[key] = m.value; modifiedKeys.add(key);} 
        });
      }
    }
    if(sel && sel.value){
      const it = items.find(x=>x.Name===sel.value);
      if(it && it.Mods && it.Mods!=='-'){
        const parts = it.Mods.split(/[,;]+/);
        parts.forEach(tok=>{
          const m = parseModToken(tok); if(!m) return;
          const map = {'HP':'Hull Points (HP)', 'AR':'Armor (AR)', 'HL':'Heat Limit (HL)', 'S':'Speed (S)', 'CS':'Combat Skill (CS)', 'PF':'Platforms (PF)'};
          const key = map[m.stat] || m.stat;
          if(m.op==='add'){ const cur = Number(modified[key]) || 0; modified[key] = cur + m.value; modifiedKeys.add(key);} else if(m.op==='set'){ modified[key] = m.value; modifiedKeys.add(key);} 
        });
      }
    }
  });

  // update stats grid DOM and panel state (HP and HL used by gameplay)
  const map = p.refs.statsMap || {};
  Object.keys(modified).forEach(k=>{
    const valEl = map[k];
    if(!valEl) return;
    valEl.textContent = (modified[k]===undefined?'':modified[k]);
    if(modifiedKeys.has(k)) valEl.classList.add('modified'); else valEl.classList.remove('modified');
  });

  // apply to runtime state
  p.state.maxHP = Number(modified['Hull Points (HP)']) || 0;
  p.state.heatLimit = Number(modified['Heat Limit (HL)']) || 0;
  if(p.state.currentHP > p.state.maxHP) p.state.currentHP = p.state.maxHP;
  updatePanelGameplayDisplay(panelIndex);
}

function populateUnitSelect(i){
  const sel = panels[i].refs.select;
  sel.innerHTML = '';
  units.forEach((u, idx)=>{
    const o = document.createElement('option'); o.value = idx; o.textContent = `${u.Name} (${u.Category})`; sel.appendChild(o);
  });
  sel.selectedIndex = panels[i].state.selectedIndex || 0;
}

function onPanelUnitChange(i){
  const sel = panels[i].refs.select;
  panels[i].state.selectedIndex = Number(sel.value);
  renderPanel(i);
}

function renderPanel(i){
  const p = panels[i];
  const idx = p.state.selectedIndex;
  const u = units[idx] || null;
  p.refs.statsGrid.innerHTML = '';
  p.refs.platformList.innerHTML = '';
  if(!u) return;

  const keys = [
    ['Category', u.Category], ['Name', u.Name], ['Speed (S)', u['Speed (S)']],
    ['Combat Skill (CS)', u['Combat Skill (CS)']], ['Armor (AR)', u['Armor (AR)']],
    ['Hull Points (HP)', u['Hull Points (HP)']], ['Heat Limit (HL)', u['Heat Limit (HL)']],
    ['Platforms (PF)', u['Platforms (PF)']], ['Cost', u['Cost'] || 0]
  ];
  keys.forEach(([k,v])=>{
    const lab = document.createElement('div'); lab.className='label'; lab.textContent = k;
    const val = document.createElement('div'); val.className='value'; val.textContent = (v===undefined?'':v);
    p.refs.statsGrid.appendChild(lab); p.refs.statsGrid.appendChild(val);
    // store reference for later updates when Mods are applied
    p.refs.statsMap[k] = val;
  });

  // init gameplay state
  p.state.maxHP = Number(u['Hull Points (HP)']) || 0;
  p.state.heatLimit = Number(u['Heat Limit (HL)']) || 0;
  p.state.currentHP = p.state.maxHP;
  p.state.currentHeat = 0;
  p.state.savedHPBeforeHeatOverride = null;

  updatePanelGameplayDisplay(i);

  const slots = Number(u['Platforms (PF)']) || 0;
  for(let s=0;s<slots;s++) addPlatformRow(i, s);
  // after platform rows created, compute and apply any Mods from selected platforms
  applyModsAndRenderStats(i);
  updatePanelTotal(i);
}

function addPlatformRow(panelIndex, slotIndex, opts={}){
  const p = panels[panelIndex];
  const row = document.createElement('div'); row.className='platform-slot';
  if(opts.generatedBy){ row.dataset.generated = 'true'; row.dataset.generatedBy = opts.generatedBy; }

  const select = document.createElement('select');
  const emptyOpt = document.createElement('option'); emptyOpt.value=''; emptyOpt.textContent='Empty'; select.appendChild(emptyOpt);
  const byCat = items.reduce((acc,it)=>{ (acc[it.Category]=acc[it.Category]||[]).push(it); return acc; },{});
  Object.keys(byCat).forEach(cat=>{
    const grp = document.createElement('optgroup'); grp.label = cat;
    byCat[cat].forEach(it=>{ const o=document.createElement('option'); o.value=it.Name; o.textContent=`${it.Name} — ${it.Price||0}¢`; grp.appendChild(o); });
    select.appendChild(grp);
  });

  const ammoSel = document.createElement('select'); ammoSel.style.width='120px'; const ammoEmpty = document.createElement('option'); ammoEmpty.value=''; ammoEmpty.textContent='-'; ammoSel.appendChild(ammoEmpty);
  ammo.forEach(a=>{ const o=document.createElement('option'); o.value=a.Name; o.textContent=`${a.Name} — ${a.Price||0}¢`; ammoSel.appendChild(o)});
  ammoSel.disabled = true;

  // create ammo container (hidden by default) that appears under platform special
  const ammoContainer = document.createElement('div'); ammoContainer.className='ammo-container'; ammoContainer.style.display='none';
  ammoContainer.appendChild(ammoSel);
  // ammo special text will sit right of the dropdown inside the container
  const ammoSpec = document.createElement('div'); ammoSpec.className='ammo-special'; ammoSpec.textContent='';
  ammoContainer.appendChild(ammoSpec);

  const dmgDiv = document.createElement('div'); dmgDiv.className='platform-damage'; dmgDiv.textContent='-';
  const rangeDiv = document.createElement('div'); rangeDiv.className='platform-range'; rangeDiv.textContent='-';
  const platformSpec = document.createElement('div'); platformSpec.className='platform-special'; platformSpec.textContent='';

  select.addEventListener('change', ()=>{
    const name = select.value;
    if(!name){
      // if this row had generated slots from a grant, remove them
      if(row.dataset.addedBy) removeGeneratedSlots(panelIndex, row.dataset.addedBy);
      delete row.dataset.addedBy; delete row.dataset.addedSlots; delete row.dataset.grantName; delete row.dataset.grantPrice;
      dmgDiv.textContent='-'; rangeDiv.textContent='-'; platformSpec.textContent=''; ammoSel.disabled=true; ammoSel.value=''; ammoSpec.textContent=''; ammoContainer.style.display='none'; applyModsAndRenderStats(panelIndex); updatePanelTotal(panelIndex); return;
    }
    const it = items.find(x=>x.Name===name);
    // check if this platform grants PF mods
    let pfGrant = 0;
    if(it && it.Mods && it.Mods!=='-'){
      const parts = it.Mods.split(/[,;]+/);
      parts.forEach(tok=>{ const m = parseModToken(tok); if(m && (m.stat==='PF' || m.stat==='P' || m.stat==='PLATFORMS')){ if(m.op==='add') pfGrant += Number(m.value); }});
    }
    if(pfGrant>0){
      // remove existing generated slots for this row if present
      if(row.dataset.addedBy) removeGeneratedSlots(panelIndex, row.dataset.addedBy);
      const genId = `${it.Name.replace(/\s+/g,'_')}-${Date.now()}`;
      // number of extra slots equals the PF granted
      const slotsToAdd = pfGrant+Number(1);
      row.dataset.grantName = it.Name; row.dataset.addedBy = genId; row.dataset.addedSlots = slotsToAdd; row.dataset.grantPrice = it.Price||0;
      platformSpec.textContent = (it.Special && it.Special!=='-') ? `${it.Special} — Grants ${pfGrant} PF` : `Grants ${pfGrant} PF`;
      // keep the select value so the platform occupies this slot as normal
      // add generated empty slots at the end
      for(let k=0;k<slotsToAdd;k++){ addPlatformRow(panelIndex, null, {generatedBy: genId}); }
      // track generated id
      panels[panelIndex].state.generatedIds.push(genId);
      applyModsAndRenderStats(panelIndex);
      updatePanelTotal(panelIndex);
      return;
    }

    // normal platform selection
    dmgDiv.textContent = it.Damage||'-';
    rangeDiv.textContent = it.Range||'-';
    // price shown in dropdown; no separate price column
    platformSpec.textContent = (it.Special && it.Special!=='-') ? it.Special : '';
    if((it.Category||'').toLowerCase().startsWith('ranged')){ ammoSel.disabled=false; ammoContainer.style.display='flex'; } else { ammoSel.disabled=true; ammoSel.value=''; ammoSpec.textContent=''; ammoContainer.style.display='none'; }
    // if this row previously had generated slots, remove them (changed selection)
    if(row.dataset.addedBy) removeGeneratedSlots(panelIndex, row.dataset.addedBy);
    delete row.dataset.addedBy; delete row.dataset.addedSlots; delete row.dataset.grantName; delete row.dataset.grantPrice;
    // apply mods after selection changes
    applyModsAndRenderStats(panelIndex);
    updatePanelTotal(panelIndex);
  });
  ammoSel.addEventListener('change', ()=>{
    const aName = ammoSel.value;
    if(!aName){ ammoSpec.textContent=''; applyModsAndRenderStats(panelIndex); updatePanelTotal(panelIndex); return; }
    const a = ammo.find(x=>x.Name===aName);
    ammoSpec.textContent = (a && a.Special && a.Special!=='-') ? a.Special : '';
    applyModsAndRenderStats(panelIndex);
    updatePanelTotal(panelIndex);
  });

  row.appendChild(select); row.appendChild(dmgDiv); row.appendChild(rangeDiv);
  // second row: platform special (under select) and ammo container (hidden by default)
  row.appendChild(platformSpec);
  row.appendChild(ammoContainer);
  p.refs.platformList.appendChild(row);
}

function removeGeneratedSlots(panelIndex, generatedId){
  const p = panels[panelIndex];
  if(!generatedId) return;
  const list = p.refs.platformList;
  const toRemove = Array.from(list.querySelectorAll(`.platform-slot[data-generated-by="${generatedId}"]`));
  toRemove.forEach(n=>n.remove());
  // update tracking
  const idx = p.state.generatedIds.indexOf(generatedId);
  if(idx!==-1) p.state.generatedIds.splice(idx,1);
}

function updatePanelTotal(i){
  const p = panels[i];
  const selIdx = p.state.selectedIndex; const u = units[selIdx]; if(!u) return;
  let total = Number(u['Cost'] || 0);
  p.refs.platformList.querySelectorAll('.platform-slot').forEach(slot=>{
    const sel = slot.querySelector('select'); const ammoSel = slot.querySelectorAll('select')[1];
    // include grant-name platforms (they were cleared from the select)
    if(slot.dataset && slot.dataset.grantName){ const itg = items.find(x=>x.Name===slot.dataset.grantName); if(itg) total += Number(itg.Price||0); }
    if(!sel || !sel.value) return;
    const it = items.find(x=>x.Name===sel.value); if(it) total += Number(it.Price||0);
    if(ammoSel && ammoSel.value){ const a = ammo.find(x=>x.Name===ammoSel.value); if(a) total += Number(a.Price||0); }
  });
  p.refs.totalEl.textContent = total;
}

function updatePanelGameplayDisplay(i){
  const p = panels[i];
  if(p.state.currentHeat > p.state.heatLimit){
    p.refs.gameplayHp.textContent = 0; p.refs.gameplayHeat.textContent = p.state.currentHeat; p.refs.destroyed.style.display='block';
  } else {
    p.refs.gameplayHp.textContent = p.state.currentHP; p.refs.gameplayHeat.textContent = p.state.currentHeat;
    if(p.state.currentHP <= 0) p.refs.destroyed.style.display='block'; else p.refs.destroyed.style.display='none';
  }
    // update stat trackers (displayed in gameplay card now)
}

// gameplay handlers
function onHpPlus(i){ const p=panels[i]; if(!units[p.state.selectedIndex]) return; p.state.currentHP = Math.min(p.state.maxHP, p.state.currentHP+1); if(p.state.currentHeat>p.state.heatLimit) p.state.savedHPBeforeHeatOverride = p.state.currentHP; updatePanelGameplayDisplay(i); updatePanelTotal(i); }
function onHpMinus(i){ const p=panels[i]; if(!units[p.state.selectedIndex]) return; p.state.currentHP = Math.max(0, p.state.currentHP-1); if(p.state.currentHP===0) p.refs.destroyed.style.display='block'; updatePanelGameplayDisplay(i); }
function onHeatPlus(i){ const p=panels[i]; if(!units[p.state.selectedIndex]) return; p.state.currentHeat = Math.max(0, p.state.currentHeat+1); if(p.state.currentHeat>p.state.heatLimit && p.state.savedHPBeforeHeatOverride===null) p.state.savedHPBeforeHeatOverride = p.state.currentHP; updatePanelGameplayDisplay(i); }
function onHeatMinus(i){ const p=panels[i]; if(!units[p.state.selectedIndex]) return; p.state.currentHeat = Math.max(0, p.state.currentHeat-1); if(p.state.currentHeat<=p.state.heatLimit && p.state.savedHPBeforeHeatOverride!==null){ p.state.currentHP = p.state.savedHPBeforeHeatOverride; p.state.savedHPBeforeHeatOverride = null; } updatePanelGameplayDisplay(i); }

loadData().catch(err=>{ console.error(err); alert('Failed to load JSON files. Run a static server from the Tool folder and open ui/index.html (see README).') });

function updatePanelArray(newCount) {
  if(newCount > PANEL_COUNT){
    // add new panel states for the additional panels
    const additionalPanels = Array.from({ length: newCount - PANEL_COUNT }, () => ({
      state: {
      selectedIndex: 0,
      maxHP: 0, currentHP: 0,
      heatLimit: 0, currentHeat: 0,
      savedHPBeforeHeatOverride: null
    },
    refs: {}
  }));
    panels = panels.concat(additionalPanels);
  } else if(newCount < PANEL_COUNT){
    // remove excess panel states if reducing the number of panels
    panels = panels.slice(0, newCount);
  } 
}
// TESTBEREICH

// DAS GEHT
document.getElementById("unit_numbers").addEventListener("change", (event) => {
   NEW_COUNT = parseInt(event.target.value);

  if(NEW_COUNT > PANEL_COUNT){
    // if we're increasing the number of panels, create new ones
    updatePanelArray(NEW_COUNT);
    initPanels();
    PANEL_COUNT = NEW_COUNT;
    
  } else if(NEW_COUNT < PANEL_COUNT){
    // if we're decreasing the number of panels, remove excess panels
    while(panelGrid.children.length > NEW_COUNT){
      panelGrid.removeChild(panelGrid.lastChild);
      updatePanelArray(NEW_COUNT);
      PANEL_COUNT = NEW_COUNT;
    }
  }
  
  adjustPanelWidths();

});


// function adjustPanelCount(){
//   const option = unit_numbers.options[unit_numbers.selectedIndex].value;
//   const newCount = parseInt(option);
//   if(newCount > PANEL_COUNT){
//     // if we're increasing the number of panels, create new ones
//       PANEL_COUNT = newCount;
//       initPanels;
    
//   } else if(newCount < PANEL_COUNT){
//     // if we're decreasing the number of panels, remove excess panels
//     while(panelGrid.children.length > newCount){
//       panelGrid.removeChild(panelGrid.lastChild);
//     }
//   }
//   console.log("Selected Value:", PANEL_COUNT);
//   console.log("Selected Text:", newCount);

//   adjustPanelWidths();
// };

