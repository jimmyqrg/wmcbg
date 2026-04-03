const TOTAL_LEVELS = 8;

const homeScreen = document.getElementById('homeScreen');
const levelSelectScreen = document.getElementById('levelSelectScreen');
const gameScreen = document.getElementById('gameScreen');

const startBtn = document.getElementById('startBtn');
const backHomeBtn = document.getElementById('backHomeBtn');
const levelsGrid = document.getElementById('levelsGrid');

const stage = document.getElementById('stage');
const btn = document.getElementById('mainBtn');

const ui = document.getElementById('ui');
const ctx = document.getElementById('ctx');
const freezeOpt = document.getElementById('freezeOpt');
const stageCtx = document.getElementById('stageCtx');
const restartOpt = document.getElementById('restartOpt');
const l4Ctx = document.getElementById('l4Ctx');
const l4PasteOpt = document.getElementById('l4PasteOpt');
const globalToast = document.getElementById('globalToast');
const finalArea = document.getElementById('finalArea');
const finalBtn = document.getElementById('finalBtn');
const levelPassModal = document.getElementById('levelPassModal');
const nextBtn = document.getElementById('nextBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const levelsBtn = document.getElementById('levelsBtn');

// Level 4 elements
const l4Area = document.getElementById('l4Area');
const l4CounterBtn = document.getElementById('l4CounterBtn');

// Level 6 elements
const l6Area = document.getElementById('l6Area');
const l6Link = document.getElementById('l6Link');

// Level 7 elements
const l7Area = document.getElementById('l7Area');
const l7Btn = document.getElementById('l7Btn');
const l7Speech = document.getElementById('l7Speech');
const l7MoneyDisplay = document.getElementById('l7MoneyDisplay');
const l7ContributeBtn = document.getElementById('l7ContributeBtn');
const l7FormedWord = document.getElementById('l7FormedWord');
const l7MoneyBar = document.getElementById('l7MoneyBar');

// Level 8 elements
const l8Area = document.getElementById('l8Area');
const l8BarFill = document.getElementById('l8BarFill');
const l8BarLabel = document.getElementById('l8BarLabel');
const l8BarWrap = document.getElementById('l8BarWrap');
const l8Ctx = document.getElementById('l8Ctx');
const l8CopyOpt = document.getElementById('l8CopyOpt');

let level = 1;
let unlockedLevel = Number(localStorage.getItem('wmcbg_unlocked')) || 1;
let frozen = false;
let stageDragging = false;
let stageOffsetX = 0;
let stageOffsetY = 0;
let pendingCompletedLevel = null;

// Level 4 state
let l4Count = 0;
let l4UiCount = 0;

// Level 7 state
let l7Money = 5412950;
let l7SpeechShown = false;

// Level 8 state
let l8Progress = 0;
let l8Raf = null;
let l8StartTime = 0;
let l8ClipboardLinked = false; // true when L4 has a live pasted progress

function showScreen(screen){
  homeScreen.classList.add('hidden');
  levelSelectScreen.classList.add('hidden');
  gameScreen.classList.add('hidden');
  screen.classList.remove('hidden');
}

function resetStagePosition(){
  stage.style.left = '50%';
  stage.style.top = '50%';
  stage.style.transform = 'translate(-50%, -50%)';
}

function renderLevelSelect(){
  levelsGrid.innerHTML = '';

  for(let i = 1; i <= TOTAL_LEVELS; i += 1){
    const tile = document.createElement('button');
    tile.className = 'level-tile';
    tile.textContent = String(i);
    tile.type = 'button';

    if(i > unlockedLevel){
      tile.classList.add('locked');
      tile.disabled = true;
    }

    tile.addEventListener('click', () => {
      startLevel(i, false);
    });

    levelsGrid.appendChild(tile);
  }
}

let toastTimer = null;
function showToast(msg){
  window.clearTimeout(toastTimer);
  globalToast.textContent = msg;
  globalToast.classList.add('show');
  toastTimer = window.setTimeout(() => {
    globalToast.classList.remove('show');
  }, 1600);
}

function hideAllCtx(){
  ctx.style.display = 'none';
  stageCtx.style.display = 'none';
  l4Ctx.style.display = 'none';
  l8Ctx.style.display = 'none';
}

function flipToLevel(nextLevel){
  stage.classList.remove('flip-in');
  stage.classList.add('flip-out');

  window.setTimeout(() => {
    stage.classList.remove('flip-out');
    setLevel(nextLevel);
    stage.classList.add('flip-in');
    window.setTimeout(() => {
      stage.classList.remove('flip-in');
    }, 490);
  }, 480);
}

function saveProgress(){
  localStorage.setItem('wmcbg_unlocked', String(unlockedLevel));
}

function onLevelPassed(completedLevel){
  pendingCompletedLevel = completedLevel;
  unlockedLevel = Math.max(unlockedLevel, Math.min(TOTAL_LEVELS, completedLevel + 1));
  saveProgress();
  renderLevelSelect();

  // Hide NEXT button if this is the last level
  nextBtn.style.display = completedLevel >= TOTAL_LEVELS ? 'none' : '';

  levelPassModal.classList.remove('hidden');
}

function startLevel(n, animate){
  showScreen(gameScreen);
  levelPassModal.classList.add('hidden');

  if(animate){
    flipToLevel(n);
    return;
  }

  setLevel(n);
}

function hideAllLevelAreas(){
  l4Area.classList.add('hidden');
  if(l4PastedBtn){ l4PastedBtn.remove(); l4PastedBtn = null; }
  if(l4PasteInterval){ clearInterval(l4PasteInterval); l4PasteInterval = null; }
  l6Area.classList.add('hidden');
  l7Area.classList.add('hidden');
  l7Speech.classList.remove('show');
  l7MoneyBar.classList.add('hidden');
  l7FormedWord.classList.add('hidden');
  l7FormedWord.innerHTML = '';
  l8Area.classList.add('hidden');
  if(l8Raf){ cancelAnimationFrame(l8Raf); l8Raf = null; }
  // reset l7 char highlights
  l7Speech.querySelectorAll('.l7-char').forEach(ch => ch.classList.remove('highlighted'));
}

function setLevel(n){
  level = n;
  ui.textContent = 'Level ' + n;
  ui.classList.remove('clickable');
  ui.onclick = null;
  frozen = false;
  stageDragging = false;

  btn.style.display = 'block';
  btn.textContent = 'CLICK ME';
  btn.disabled = false;
  btn.className = 'btn';
  resetStagePosition();
  btn.style.left = '50%';
  btn.style.top = '50%';
  btn.style.transform = 'translate(-50%, -50%)';
  btn.style.transition = 'transform 0.12s, left 0.3s, top 0.3s';
  btn.classList.remove('shake');
  btn.dataset.landed = 'false';

  hideAllLevelAreas();
  ctx.style.display = 'none';
  btn.onclick = null;
  stage.onpointerdown = null;
  stage.onpointermove = null;
  window.onpointerup = null;
  btn.onpointerenter = null;

  // L5 scroll mode
  gameScreen.classList.remove('scrollable');
  document.body.classList.remove('level5');
  finalArea.style.display = 'none';

  if(n === 5){
    gameScreen.classList.add('scrollable');
    document.body.classList.add('level5');
    finalArea.style.display = 'block';
  }

  if(n === 3) setupLevel3();
  if(n === 4) setupLevel4();
  if(n === 5) setupLevel5();
  if(n === 6) setupLevel6();
  if(n === 7) setupLevel7();
  if(n === 8) setupLevel8();
}

btn.addEventListener('click', () => {
  if(level === 1){
    onLevelPassed(1);
    return;
  }

  if(level === 2){
    const s = stage.getBoundingClientRect();
    if(btn.dataset.landed === 'false'){
      btn.dataset.landed = 'true';
      btn.style.transition = 'top .5s';
      btn.style.top = (s.height - 50) + 'px';
      return;
    }
    onLevelPassed(2);
  }
});

function setupLevel3(){
  btn.onclick = () => {
    if(!frozen){
      teleportBtn();
      return;
    }
    onLevelPassed(3);
  };
}

function teleportBtn(){
  if(frozen) return;
  const s = stage.getBoundingClientRect();
  const x = 40 + Math.random() * (s.width - 80);
  const y = 40 + Math.random() * (s.height - 80);
  btn.style.left = x + 'px';
  btn.style.top = y + 'px';
}

btn.addEventListener('contextmenu', (e) => {
  if(level === 3){
    e.preventDefault();
    hideAllCtx();
    ctx.style.display = 'block';
    ctx.style.left = e.clientX + 'px';
    ctx.style.top = e.clientY + 'px';
  }
});

stage.addEventListener('contextmenu', (e) => {
  if(e.target === btn) return;
  e.preventDefault();
  hideAllCtx();
  if(level === 4){
    l4Ctx.style.display = 'block';
    l4Ctx.style.left = e.clientX + 'px';
    l4Ctx.style.top = e.clientY + 'px';
  } else if(level === 8){
    l8Ctx.style.display = 'block';
    l8Ctx.style.left = e.clientX + 'px';
    l8Ctx.style.top = e.clientY + 'px';
  } else {
    stageCtx.style.display = 'block';
    stageCtx.style.left = e.clientX + 'px';
    stageCtx.style.top = e.clientY + 'px';
  }
});

restartOpt.addEventListener('click', () => {
  stageCtx.style.display = 'none';
  setLevel(level);
});

freezeOpt.addEventListener('click', () => {
  frozen = true;
  ctx.style.display = 'none';
});

document.getElementById('ctxRestartOpt').addEventListener('click', () => {
  ctx.style.display = 'none';
  setLevel(level);
});

l4PasteOpt.addEventListener('click', () => {
  l4Ctx.style.display = 'none';
  const clip = localStorage.getItem('wmcbg_clipboard');
  if(!clip){
    showToast('NOTHING TO PASTE.');
    return;
  }
  pasteProgressIntoL4();
});

document.getElementById('l4CtxRestartOpt').addEventListener('click', () => {
  l4Ctx.style.display = 'none';
  setLevel(level);
});

// Level 8 context menu handlers
l8CopyOpt.addEventListener('click', () => {
  l8Ctx.style.display = 'none';
  localStorage.setItem('wmcbg_clipboard', String(Math.floor(l8Progress)));
  l8ClipboardLinked = true;
  showToast('PROGRESS COPIED!');
});

document.getElementById('l8CtxRestartOpt').addEventListener('click', () => {
  l8Ctx.style.display = 'none';
  setLevel(level);
});

/* LEVEL 4 — Counter 0/10000 */
function setupLevel4(){
  btn.style.display = 'none';
  l4Area.classList.remove('hidden');
  l4Count = 0;
  l4CounterBtn.textContent = '0/10000';

  l4CounterBtn.onclick = (e) => {
    l4Count += 1;
    spawnPlusOne(e);
    updateL4Display();
  };

  // Clicking "Level 4" label directly passes
  ui.classList.add('clickable');
  ui.onclick = () => {
    ui.onclick = null;
    ui.classList.remove('clickable');
    onLevelPassed(4);
  };
}

function spawnPlusOne(e){
  const el = document.createElement('span');
  el.className = 'float-plus-one';
  el.textContent = '+1';
  el.style.left = e.clientX + 'px';
  el.style.top = e.clientY + 'px';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function updateL4Display(){
  const display = Math.min(l4Count, 10000);
  l4CounterBtn.textContent = display + '/10000';
  if(l4Count >= 10000){
    l4CounterBtn.onclick = null;
    ui.onclick = null;
    ui.classList.remove('clickable');
    onLevelPassed(4);
  }
}

/* LEVEL 5 — Button disappears, scroll to find the real one */
function setupLevel5(){
  btn.disabled = true;
  btn.onpointerenter = () => {
    btn.style.display = 'none';
  };

  // Scroll game screen to top
  gameScreen.scrollTop = 0;
  window.scrollTo(0, 0);

  finalBtn.onclick = () => {
    onLevelPassed(5);
  };
}

/* LEVEL 6 — "IS THERE NO NEXT LEVEL?" */
function setupLevel6(){
  btn.style.display = 'none';
  l6Area.classList.remove('hidden');

  l6Link.onclick = () => {
    onLevelPassed(6);
  };
}

/* LEVEL 7 — Normal button + contribute money */
let l7Clickable = false;

function setupLevel7(){
  btn.style.display = 'none';
  l7Area.classList.remove('hidden');
  l7Money = 5412950;
  l7SpeechShown = false;
  l7Clickable = false;
  l7MoneyDisplay.textContent = '$' + l7Money.toLocaleString();
  l7Speech.classList.remove('show');
  l7MoneyBar.classList.add('hidden');
  l7FormedWord.classList.add('hidden');
  l7FormedWord.innerHTML = '';
  l7Btn.className = 'btn l7-btn-normal';

  // Reset highlights
  l7Speech.querySelectorAll('.l7-char').forEach(ch => ch.classList.remove('highlighted'));

  // Click on button
  l7Btn.onclick = () => {
    if(!l7SpeechShown){
      // First click → show permanent speech bubble + money bar + shake
      l7SpeechShown = true;
      l7Speech.classList.add('show');
      l7MoneyBar.classList.remove('hidden');
      l7Btn.classList.remove('shake');
      void l7Btn.offsetWidth;
      l7Btn.classList.add('shake');
      return;
    }
    if(l7Clickable){
      onLevelPassed(7);
      return;
    }
    // Shake head
    l7Btn.classList.remove('shake');
    void l7Btn.offsetWidth;
    l7Btn.classList.add('shake');
  };

  // Contribute button
  l7ContributeBtn.onclick = () => {
    if(l7Money <= 0) return;
    l7Money = Math.max(0, l7Money - 50);
    l7MoneyDisplay.textContent = '$' + l7Money.toLocaleString();
    if(l7Money <= 0){
      makeL7Clickable();
    }
  };

  // Clickable characters in "CONTRIBUTE" for solution 2
  l7Speech.querySelectorAll('.l7-char').forEach(ch => {
    ch.onclick = () => {
      ch.classList.toggle('highlighted');
      checkL7Word();
    };
  });
}

function makeL7Clickable(){
  l7Clickable = true;
  l7Btn.classList.remove('shake');
  void l7Btn.offsetWidth;
  l7Btn.classList.add('jump');
}

function checkL7Word(){
  const chars = l7Speech.querySelectorAll('.l7-char');
  const highlighted = [];
  chars.forEach(ch => {
    if(ch.classList.contains('highlighted')){
      highlighted.push(ch.textContent);
    }
  });
  const word = highlighted.join('');

  // Target: O, N, T, B, U, T → "ONTBUT" which rearranges to "BUTTON"
  // The letters in CONTRIBUTE at positions: C(0) O(1) N(2) T(3) R(4) I(5) B(6) U(7) T(8) E(9)
  // Exactly highlight indices 1,2,3,6,7,8 → O,N,T,B,U,T
  if(word === 'ONTBUT'){
    // Animate: letters fly to form BUTTON
    const target = 'BUTTON';
    const highlightedEls = Array.from(chars).filter(ch => ch.classList.contains('highlighted'));

    // Map ONTBUT → BUTTON reorder: B(3) U(4) T(0,5) O(1) N(2)
    // ONTBUT indices: O=0 N=1 T=2 B=3 U=4 T=5
    // BUTTON order:   B=3 U=4 T=2 T=5 O=0 N=1
    const order = [3, 4, 2, 5, 0, 1];

    l7FormedWord.classList.remove('hidden');
    l7FormedWord.innerHTML = '';

    order.forEach(idx => {
      highlightedEls[idx].classList.remove('highlighted');
    });

    const formedBtn = document.createElement('button');
    formedBtn.className = 'btn l7-formed-btn';
    formedBtn.textContent = 'BUTTON';
    l7FormedWord.appendChild(formedBtn);

    formedBtn.onclick = () => {
      onLevelPassed(7);
    };
  }
}

/* LEVEL 8 — Loading bar */
function setupLevel8(){
  btn.style.display = 'none';
  l8Area.classList.remove('hidden');
  l8Progress = 0;
  l8ClipboardLinked = false;
  l8BarFill.style.width = '0%';
  l8BarLabel.textContent = '0%';
  localStorage.removeItem('wmcbg_clipboard');
  l8StartTime = performance.now();
  l8Raf = requestAnimationFrame(l8Tick);
}

function l8Tick(now){
  const elapsed = (now - l8StartTime) / 1000; // seconds

  // 0→50% at constant fast speed (~2.5s to reach 50)
  // 50→99% decelerating, asymptotically approaching 99
  if(elapsed <= 2.5){
    l8Progress = (elapsed / 2.5) * 50;
  } else {
    // exponential decay toward 99
    const t = elapsed - 2.5;
    l8Progress = 50 + 49 * (1 - Math.exp(-t / 4));
  }

  const display = Math.min(Math.floor(l8Progress), 99);
  l8BarFill.style.width = display + '%';
  l8BarLabel.textContent = display + '%';

  // update clipboard in real time if linked
  if(l8ClipboardLinked){
    localStorage.setItem('wmcbg_clipboard', String(display));
  }

  if(display < 99){
    l8Raf = requestAnimationFrame(l8Tick);
  } else {
    l8Raf = null;
  }
}

function resumeL8WithProgress(pct){
  // Called when returning from L4 with >= 100%
  l8Progress = pct;
  const barDisplay = Math.min(pct, 100);
  l8BarFill.style.width = barDisplay + '%';
  l8BarLabel.textContent = Math.floor(pct) + '%';
  onLevelPassed(8);
}

/* Level 4 — Paste progress */
let l4PastedBtn = null;
let l4PasteInterval = null;

function pasteProgressIntoL4(){
  const clip = Number(localStorage.getItem('wmcbg_clipboard')) || 0;

  // Remove existing pasted button if any
  if(l4PastedBtn){
    l4PastedBtn.remove();
    l4PastedBtn = null;
  }
  if(l4PasteInterval){
    clearInterval(l4PasteInterval);
    l4PasteInterval = null;
  }

  l4PastedBtn = document.createElement('button');
  l4PastedBtn.className = 'btn l4-pasted-progress';
  l4PastedBtn.textContent = clip + '%';
  l4Area.appendChild(l4PastedBtn);

  // Live-update from clipboard (L8 bar keeps ticking)
  l4PasteInterval = setInterval(() => {
    const cur = Number(localStorage.getItem('wmcbg_clipboard')) || 0;
    const val = Number(l4PastedBtn.dataset.extra || 0) + cur;
    l4PastedBtn.textContent = val + '%';
    if(val >= 100){
      clearInterval(l4PasteInterval);
      l4PasteInterval = null;
      // Auto-return to level 8 with the progress
      returnToL8(val);
    }
  }, 200);

  l4PastedBtn.dataset.extra = '0';

  l4PastedBtn.onclick = (e) => {
    const extra = Number(l4PastedBtn.dataset.extra || 0) + 1;
    l4PastedBtn.dataset.extra = String(extra);
    const cur = Number(localStorage.getItem('wmcbg_clipboard')) || 0;
    const val = extra + cur;
    l4PastedBtn.textContent = val + '%';
    spawnPlusOne(e);

    if(val >= 100){
      if(l4PasteInterval){ clearInterval(l4PasteInterval); l4PasteInterval = null; }
      returnToL8(val);
    }
  };
}

function returnToL8(pct){
  // Clean up L4 paste state
  if(l4PastedBtn){ l4PastedBtn.remove(); l4PastedBtn = null; }
  if(l4PasteInterval){ clearInterval(l4PasteInterval); l4PasteInterval = null; }
  localStorage.removeItem('wmcbg_clipboard');

  // Switch to level 8 and complete it
  showScreen(gameScreen);
  levelPassModal.classList.add('hidden');
  flipToLevel(8);

  // After flip animation, update bar and pass level
  window.setTimeout(() => {
    resumeL8WithProgress(pct);
  }, 1000);
}

document.addEventListener('click', (e) => {
  if(!ctx.contains(e.target) && e.target !== btn){
    ctx.style.display = 'none';
  }
  if(!stageCtx.contains(e.target)){
    stageCtx.style.display = 'none';
  }
  if(!l4Ctx.contains(e.target)){
    l4Ctx.style.display = 'none';
  }
  if(!l8Ctx.contains(e.target)){
    l8Ctx.style.display = 'none';
  }
});

startBtn.addEventListener('click', () => {
  renderLevelSelect();
  showScreen(levelSelectScreen);
});

backHomeBtn.addEventListener('click', () => {
  showScreen(homeScreen);
});

nextBtn.addEventListener('click', () => {
  if(pendingCompletedLevel === null) return;

  const currentCompleted = pendingCompletedLevel;
  levelPassModal.classList.add('hidden');

  if(currentCompleted >= TOTAL_LEVELS){
    showScreen(levelSelectScreen);
    return;
  }

  startLevel(currentCompleted + 1, true);
});

playAgainBtn.addEventListener('click', () => {
  if(pendingCompletedLevel === null) return;
  levelPassModal.classList.add('hidden');
  startLevel(pendingCompletedLevel, false);
});

levelsBtn.addEventListener('click', () => {
  levelPassModal.classList.add('hidden');
  renderLevelSelect();
  showScreen(levelSelectScreen);
});

renderLevelSelect();
showScreen(homeScreen);

