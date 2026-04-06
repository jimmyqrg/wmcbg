const TOTAL_LEVELS = 10;

const homeScreen = document.getElementById('homeScreen');
const levelSelectScreen = document.getElementById('levelSelectScreen');
const gameScreen = document.getElementById('gameScreen');

const startBtn = document.getElementById('startBtn');
const backHomeBtn = document.getElementById('backHomeBtn');
const levelsGrid = document.getElementById('levelsGrid');
const restartOverlay = document.getElementById('restartOverlay');

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
const l9AlertModal = document.getElementById('l9AlertModal');
const l9ReloadBtn = document.getElementById('l9ReloadBtn');
const l9FakePassModal = document.getElementById('l9FakePassModal');
const l9FakeNextBtn = document.getElementById('l9FakeNextBtn');

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
const l8DoneBtn = document.getElementById('l8DoneBtn');

// Level 9 elements
const l9Area = document.getElementById('l9Area');
const l9Text = document.getElementById('l9Text');
const l9ClickMeBtn = document.getElementById('l9ClickMeBtn');
const l9RealBtn = document.getElementById('l9RealBtn');

// Level 10 elements
const l10Area = document.getElementById('l10Area');
const l10CloseBtn = document.getElementById('l10CloseBtn');
const l10Chat = document.getElementById('l10Chat');
const l10Messages = document.getElementById('l10Messages');
const l10Input = document.getElementById('l10Input');
const l10SendBtn = document.getElementById('l10SendBtn');
const l10Phone = document.getElementById('l10Phone');
const l10PhoneChatApp = document.getElementById('l10PhoneChatApp');
const l10PhoneGptApp = document.getElementById('l10PhoneGptApp');

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

// Level 9 state
let l9StepTimers = [];
let l9GuardActive = false;
let l9Failing = false;
let restartOverlayTimer = null;

// Level 10 state
let l10Timers = [];
let l10QuestionIndex = 0;      // how many questions answered (0-19)
let l10WaitingForAnswer = false;
let l10ChatGptMode = false;
let l10PhoneUnlocked = false;   // close btn has been clicked
let l10GamePicks = [];           // indices of 20 games chosen for this round

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

function runSceneTransition(action, midpoint = 280){
  hideAllCtx();
  restartOverlay.classList.remove('hidden', 'restart-overlay-animate');
  void restartOverlay.offsetWidth;
  restartOverlay.classList.add('restart-overlay-animate');

  if(restartOverlayTimer){
    window.clearTimeout(restartOverlayTimer);
  }

  restartOverlayTimer = window.setTimeout(() => {
    action();
  }, midpoint);
}

function restartLevelWithFade(targetLevel = level){
  runSceneTransition(() => {
    setLevel(targetLevel);
  });
}

function showHomeScreen(useTransition = true){
  if(useTransition){
    runSceneTransition(() => {
      showHomeScreen(false);
    });
    return;
  }

  showScreen(homeScreen);
}

function showLevelSelectScreen(useTransition = true){
  if(useTransition){
    runSceneTransition(() => {
      showLevelSelectScreen(false);
    });
    return;
  }

  renderLevelSelect();
  showScreen(levelSelectScreen);
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

function startLevel(n, animate, useTransition = true){
  if(useTransition){
    runSceneTransition(() => {
      startLevel(n, animate, false);
    });
    return;
  }

  showScreen(gameScreen);
  levelPassModal.classList.add('hidden');
  l9AlertModal.classList.add('hidden');
  l9FakePassModal.classList.add('hidden');

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
  l9Area.classList.add('hidden');
  cleanupLevel9();
  l10Area.classList.add('hidden');
  cleanupLevel10();
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
  if(n === 9) setupLevel9();
  if(n === 10) setupLevel10();
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
  } else if(level === 8 && (e.target === l8BarWrap || l8BarWrap.contains(e.target))){
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
  restartLevelWithFade();
});

document.getElementById('stageCtxLevelsOpt').addEventListener('click', () => {
  showLevelSelectScreen();
});

freezeOpt.addEventListener('click', () => {
  frozen = true;
  ctx.style.display = 'none';
});

document.getElementById('ctxRestartOpt').addEventListener('click', () => {
  restartLevelWithFade();
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
  restartLevelWithFade();
});

// Level 8 context menu handlers
l8CopyOpt.addEventListener('click', () => {
  l8Ctx.style.display = 'none';
  localStorage.setItem('wmcbg_clipboard', String(Math.floor(l8Progress)));
  l8ClipboardLinked = true;
  showToast('PROGRESS COPIED!');
});

document.getElementById('l8CtxRestartOpt').addEventListener('click', () => {
  restartLevelWithFade();
});

l8DoneBtn.addEventListener('click', () => {
  onLevelPassed(8);
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
  l8DoneBtn.classList.add('hidden');
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
  // Cancel any running animation first
  if(l8Raf){ cancelAnimationFrame(l8Raf); l8Raf = null; }
  // Show final bar state immediately (no animation from 0)
  btn.style.display = 'none';
  l8Area.classList.remove('hidden');
  l8Progress = pct;
  l8BarFill.style.transition = 'none';
  l8BarFill.style.width = '100%';
  l8BarLabel.textContent = '100%';
  // Restore transition for future use
  requestAnimationFrame(() => {
    l8BarFill.style.transition = 'width 0.1s linear';
  });
  // Show the done button instead of immediately passing
  l8DoneBtn.classList.remove('hidden');
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

  l4PastedBtn = document.createElement('span');
  l4PastedBtn.className = 'l4-pasted-progress';
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

  runSceneTransition(() => {
    showScreen(gameScreen);
    levelPassModal.classList.add('hidden');
    flipToLevel(8);

    // After flip animation, update bar and pass level
    window.setTimeout(() => {
      resumeL8WithProgress(pct);
    }, 1000);
  });
}

function addL9Timer(callback, delay){
  const timer = window.setTimeout(callback, delay);
  l9StepTimers.push(timer);
  return timer;
}

function showL9Element(element){
  element.classList.remove('hidden');
  requestAnimationFrame(() => {
    element.classList.remove('l9-fade-hidden');
  });
}

function hideL9Element(element){
  element.classList.add('l9-fade-hidden');
}

function swapL9Text(nextText){
  hideL9Element(l9Text);
  addL9Timer(() => {
    if(level !== 9){
      return;
    }
    l9Text.textContent = nextText;
    showL9Element(l9Text);
  }, 320);
}

function cleanupLevel9(){
  l9StepTimers.forEach(timer => window.clearTimeout(timer));
  l9StepTimers = [];
  l9GuardActive = false;
  l9Failing = false;
  l9AlertModal.classList.add('hidden');
  l9FakePassModal.classList.add('hidden');
  l9Text.textContent = "DON'T CLICK ANYTHING";
  l9Text.classList.add('l9-fade-hidden');
  l9ClickMeBtn.classList.add('hidden', 'l9-fade-hidden');
  l9RealBtn.classList.add('hidden', 'l9-fade-hidden');
}

function failLevel9(){
  if(level !== 9 || l9Failing){
    return;
  }

  l9Failing = true;
  l9GuardActive = false;
  l9AlertModal.classList.add('hidden');
  l9FakePassModal.classList.add('hidden');
  showToast('FAILED');

  addL9Timer(() => {
    if(level === 9){
      restartLevelWithFade(9);
    }
  }, 700);
}

function l9InputGuard(event){
  if(level !== 9 || !l9GuardActive){
    return;
  }

  if(event.type === 'keydown'){
    if(event.key !== ' ' && event.key !== 'Enter'){
      return;
    }
  }

  event.preventDefault();
  event.stopPropagation();
  if(typeof event.stopImmediatePropagation === 'function'){
    event.stopImmediatePropagation();
  }
  failLevel9();
}

function showL9BrowserAlert(){
  if(level !== 9){
    return;
  }

  l9AlertModal.classList.remove('hidden');

  addL9Timer(() => {
    if(level !== 9 || l9Failing){
      return;
    }

    l9AlertModal.classList.add('hidden');
    l9FakePassModal.classList.remove('hidden');

    addL9Timer(() => {
      if(level !== 9 || l9Failing){
        return;
      }

      l9FakePassModal.classList.add('hidden');
      l9GuardActive = false;
      onLevelPassed(9);
    }, 3000);
  }, 5000);
}

function setupLevel9(){
  btn.style.display = 'none';
  l9Area.classList.remove('hidden');
  l9Text.textContent = "DON'T CLICK ANYTHING";
  l9AlertModal.classList.add('hidden');
  l9FakePassModal.classList.add('hidden');
  l9Text.classList.add('l9-fade-hidden');
  l9ClickMeBtn.classList.add('l9-fade-hidden');
  l9RealBtn.classList.add('hidden', 'l9-fade-hidden');
  l9ClickMeBtn.classList.remove('hidden');
  l9GuardActive = true;
  l9Failing = false;

  addL9Timer(() => {
    if(level !== 9){
      return;
    }
    showL9Element(l9Text);
    showL9Element(l9ClickMeBtn);
  }, 0);

  addL9Timer(() => {
    if(level !== 9){
      return;
    }
    hideL9Element(l9ClickMeBtn);
    swapL9Text('YOU CAN CLICK IT NOW.');
    l9RealBtn.classList.remove('hidden');
    addL9Timer(() => {
      if(level !== 9){
        return;
      }
      showL9Element(l9RealBtn);
    }, 320);
  }, 5000);

  addL9Timer(() => {
    showL9BrowserAlert();
  }, 8000);
}

document.addEventListener('pointerdown', l9InputGuard, true);
document.addEventListener('click', l9InputGuard, true);
document.addEventListener('keydown', l9InputGuard, true);

l9ClickMeBtn.addEventListener('click', failLevel9);
l9RealBtn.addEventListener('click', failLevel9);
l9ReloadBtn.addEventListener('click', failLevel9);
l9FakeNextBtn.addEventListener('click', failLevel9);

/* ═══════════════════════════════════════
   LEVEL 10 — Chat App guessing game
   ═══════════════════════════════════════ */

const L10_GAMES = [
  { name: "Minecraft", desc: "A sandbox game where you mine blocks and craft tools to survive in a procedurally generated world." },
  { name: "Fortnite", desc: "A battle royale game where 100 players fight on a shrinking island with building mechanics." },
  { name: "Tetris", desc: "Arrange falling geometric shapes into complete rows to clear them before the screen fills up." },
  { name: "Mario Kart", desc: "Race cartoon characters on colorful tracks with power-ups like shells and bananas." },
  { name: "Among Us", desc: "A social deduction game where crewmates must find the impostors sabotaging their spaceship." },
  { name: "GTA V", desc: "An open-world crime game set in a fictional version of Los Angeles with three playable protagonists." },
  { name: "The Legend of Zelda", desc: "A hero in green explores dungeons, solves puzzles, and saves a princess from an evil sorcerer." },
  { name: "Pac-Man", desc: "Navigate a yellow circle through a maze eating dots while avoiding four colorful ghosts." },
  { name: "Roblox", desc: "A platform where users create and play millions of experiences made by other players." },
  { name: "Chess", desc: "A two-player strategy board game with 16 pieces each on a 64-square checkered board." },
  { name: "Pokemon", desc: "Catch, train, and battle creatures with elemental powers across a region to become champion." },
  { name: "Call of Duty", desc: "A first-person military shooter franchise known for its fast-paced multiplayer combat." },
  { name: "Super Mario Bros", desc: "A plumber runs and jumps across side-scrolling levels, stomping on enemies to rescue a princess." },
  { name: "Rocket League", desc: "Play soccer with rocket-powered cars in an arena, scoring goals by hitting a giant ball." },
  { name: "Overwatch", desc: "A team-based hero shooter where players choose characters with unique abilities to complete objectives." },
  { name: "Clash Royale", desc: "A real-time strategy card game where you deploy troops to destroy your opponent's towers." },
  { name: "Candy Crush", desc: "Match three or more candies of the same color to clear tiles and complete level objectives." },
  { name: "FIFA", desc: "A football simulation where you control real-world teams and players in matches and tournaments." },
  { name: "Apex Legends", desc: "A free-to-play battle royale with hero characters called Legends, each having unique tactical abilities." },
  { name: "Valorant", desc: "A tactical 5v5 shooter where agents have special abilities and you must plant or defuse a spike." },
  { name: "League of Legends", desc: "A 5v5 MOBA where champions battle on a three-lane map to destroy the enemy's nexus." },
  { name: "Dota 2", desc: "Two teams of five heroes fight on a battlefield of three lanes with creeps and towers." },
  { name: "Subway Surfers", desc: "An endless runner where you dodge trains and obstacles on subway tracks while collecting coins." },
  { name: "Temple Run", desc: "Sprint through ancient temple ruins, swiping to turn, jump, and slide to escape a pursuing creature." },
  { name: "Flappy Bird", desc: "Tap to keep a small bird flying through gaps between green pipes without crashing." },
  { name: "Angry Birds", desc: "Launch birds from a slingshot at structures to destroy the pigs hiding inside them." },
  { name: "Clash of Clans", desc: "Build a village, train troops, and attack other players' bases to earn resources and trophies." },
  { name: "Geometry Dash", desc: "A rhythm-based platformer where a cube automatically moves forward and you tap to jump over obstacles." },
  { name: "Plants vs Zombies", desc: "Place different plants in your garden to defend your house from waves of approaching zombies." },
  { name: "Wordle", desc: "Guess a five-letter word in six tries; after each guess, tiles change color to show correctness." },
  { name: "Fall Guys", desc: "60 players compete in obstacle courses and mini-games inspired by TV game shows to be the last one standing." },
  { name: "Animal Crossing", desc: "Live on a deserted island, catch bugs and fish, decorate your home, and interact with animal villagers." },
  { name: "Stardew Valley", desc: "Inherit a farm and grow crops, raise animals, mine, fish, and befriend townspeople in a pixelated valley." },
  { name: "The Sims", desc: "Control virtual people's lives — build houses, manage relationships, careers, and daily needs." },
  { name: "Terraria", desc: "A 2D sandbox adventure with mining, crafting, building, and fighting bosses in procedurally generated worlds." },
  { name: "Portal", desc: "Solve physics puzzles using a gun that creates two connected portals on flat surfaces." },
  { name: "Half-Life", desc: "A scientist fights aliens after a teleportation experiment goes wrong in an underground research facility." },
  { name: "Doom", desc: "A space marine blasts through hordes of demons from Hell using an arsenal of powerful weapons." },
  { name: "Halo", desc: "A super-soldier in green armor fights an alien alliance on a ring-shaped megastructure in space." },
  { name: "God of War", desc: "A Spartan warrior driven by rage battles gods and mythological creatures across ancient realms." },
  { name: "Dark Souls", desc: "An extremely challenging action RPG where you die repeatedly fighting through a dark, interconnected fantasy world." },
  { name: "Elden Ring", desc: "An open-world action RPG set in the Lands Between, created with involvement from a famous fantasy author." },
  { name: "Skyrim", desc: "An open-world RPG where you play as the Dragonborn, shouting at dragons in a Nordic fantasy land." },
  { name: "Undertale", desc: "A retro-style RPG where you can choose to befriend or fight every monster you encounter." },
  { name: "Celeste", desc: "A challenging platformer about climbing a mountain, featuring tight controls and a story about mental health." },
  { name: "Hollow Knight", desc: "Explore a vast underground insect kingdom with precise combat and interconnected areas in a Metroidvania style." },
  { name: "Cuphead", desc: "A run-and-gun game with 1930s cartoon art style, focused on difficult boss battles." },
  { name: "Sekiro", desc: "A shinobi fights through Sengoku-era Japan with a prosthetic arm, using precise deflection-based combat." },
  { name: "Resident Evil", desc: "Survive a zombie outbreak in a mansion by solving puzzles and managing scarce ammo and health items." },
  { name: "Silent Hill", desc: "A father searches for his daughter in a fog-covered town that shifts into a nightmarish alternate dimension." },
  { name: "Five Nights at Freddy's", desc: "Work as a night security guard at a pizza restaurant where animatronic characters try to kill you." },
  { name: "Phasmophobia", desc: "A cooperative horror game where you and friends investigate haunted locations to identify types of ghosts." },
  { name: "Left 4 Dead", desc: "Four survivors fight through zombie hordes cooperatively across campaigns to reach safe rooms." },
  { name: "Counter-Strike", desc: "A tactical FPS where terrorists and counter-terrorists compete in round-based matches with an in-game economy." },
  { name: "Rainbow Six Siege", desc: "A tactical team shooter focused on destructible environments and operator gadgets in close-quarters combat." },
  { name: "PUBG", desc: "Parachute onto an island, scavenge for gear, and fight to be the last player alive in a shrinking zone." },
  { name: "Splatoon", desc: "Teams of squid-kids shoot colorful ink to cover territory while battling the opposing team." },
  { name: "Street Fighter", desc: "A one-on-one fighting game with special moves, combos, and iconic characters from around the world." },
  { name: "Mortal Kombat", desc: "A brutal fighting game known for its violent finishing moves and characters from different realms." },
  { name: "Super Smash Bros", desc: "Nintendo characters fight on platforms, trying to knock each other off the stage to score points." },
  { name: "Wii Sports", desc: "Motion-controlled sports games including tennis, bowling, boxing, baseball, and golf using Wii remotes." },
  { name: "Just Dance", desc: "Follow on-screen dance moves by moving your body or controller to score points on popular songs." },
  { name: "Guitar Hero", desc: "Press colored buttons on a guitar controller in time with notes scrolling down the screen to play rock songs." },
  { name: "Brawl Stars", desc: "A mobile multiplayer game with fast 3v3 battles and various modes like gem grab and showdown." },
  { name: "Hearthstone", desc: "A digital collectible card game based on a fantasy universe where you build decks and duel opponents." },
  { name: "Monopoly", desc: "A board game where you buy properties, charge rent, and try to bankrupt all other players." },
  { name: "Uno", desc: "A card game where you match colors or numbers and use special cards to change direction, skip, or stack draws." },
  { name: "Sudoku", desc: "Fill a 9×9 grid with digits 1-9 so that each column, row, and 3×3 box contains all digits." },
  { name: "2048", desc: "Slide numbered tiles on a 4×4 grid to combine matching numbers until you create the tile valued 2048." },
  { name: "Snake", desc: "Control a growing line that moves around the screen eating food while avoiding its own tail and walls." },
  { name: "Minesweeper", desc: "Click squares on a grid to reveal numbers that indicate nearby mines; clear all safe squares to win." },
  { name: "Solitaire", desc: "A single-player card game where you sort a shuffled deck into four foundation piles by suit in ascending order." },
  { name: "The Witcher 3", desc: "A monster hunter searches for his adopted daughter in a vast open world filled with morally gray choices." },
  { name: "Red Dead Redemption 2", desc: "An outlaw in 1899 America rides through a detailed open world as the age of gunslingers fades." },
  { name: "Cyberpunk 2077", desc: "A mercenary navigates a dystopian megacity full of cybernetic implants, gangs, and corporate intrigue." },
  { name: "Assassin's Creed", desc: "Relive ancestors' memories through a machine, performing stealth assassinations across historical time periods." },
  { name: "Uncharted", desc: "A treasure hunter explores exotic locations, solving puzzles and engaging in cinematic gunfights and climbing." },
  { name: "The Last of Us", desc: "A smuggler escorts a girl across post-apocalyptic America overrun by fungal zombie-like infected." },
  { name: "Spider-Man", desc: "Swing through a detailed city as a superhero, fighting crime and iconic villains with web-based abilities." },
  { name: "Batman Arkham", desc: "Be the Dark Knight, using stealth, gadgets, and combat to stop villains in a Gothic city." },
  { name: "Sonic the Hedgehog", desc: "A blue hedgehog runs at extreme speed through loop-de-loops collecting gold rings and fighting a mad scientist." },
  { name: "Kirby", desc: "A pink puffball inhales enemies to copy their abilities while exploring colorful platforming worlds." },
  { name: "Mega Man", desc: "A blue robot fights through stages of enemy robots, gaining their weapons after defeating each boss." },
  { name: "Metroid", desc: "A bounty hunter in a power suit explores alien planets, gaining abilities to access new areas." },
  { name: "Donkey Kong", desc: "A gorilla throws barrels down platforms at a jumping man trying to rescue someone at the top." },
  { name: "Final Fantasy", desc: "A JRPG franchise featuring turn-based combat, epic stories, and summoning powerful creatures called summons." },
  { name: "World of Warcraft", desc: "A massive online RPG where you choose a faction, complete quests, raid dungeons, and battle other players." },
  { name: "Diablo", desc: "Hack and slash through randomized dungeons full of demons, collecting loot and leveling up your character." },
  { name: "Civilization", desc: "Build an empire from the Stone Age to the Information Age, competing against other civilizations on a world map." },
  { name: "Age of Empires", desc: "Gather resources, build an army, and wage war across historical eras in real-time strategy battles." },
  { name: "SimCity", desc: "Design and manage a city, zoning areas for residential, commercial, and industrial use while keeping citizens happy." },
  { name: "Roller Coaster Tycoon", desc: "Build and manage a theme park, designing roller coasters and attractions to entertain guests and earn profit." },
  { name: "Need for Speed", desc: "Race exotic cars through city streets while evading police in high-speed chases." },
  { name: "Gran Turismo", desc: "A realistic driving simulator with hundreds of licensed cars and tracks around the world." },
  { name: "Crossy Road", desc: "Guide a character across busy roads, rivers, and train tracks in an endless version of a classic road-crossing concept." },
  { name: "Fruit Ninja", desc: "Swipe your finger across the screen to slice fruit flying through the air while avoiding bombs." },
  { name: "Cut the Rope", desc: "Cut ropes to drop candy into a green creature's mouth while collecting stars in physics-based puzzles." },
  { name: "Monument Valley", desc: "Guide a silent princess through impossible architecture and optical illusions in a beautiful puzzle game." },
  { name: "Plague Inc", desc: "Evolve a pathogen to infect and wipe out all of humanity before a cure is developed." },
  { name: "Papers Please", desc: "As a border inspector, check documents and decide who to let into your country under a totalitarian regime." },
  { name: "Untitled Goose Game", desc: "Play as a mischievous goose terrorizing a peaceful village by stealing items and honking at people." },
];

const L10_ANSWER_20 = "At most 1000 plays and at least 1000 plays\n\"At most 1000\" means:\nnumber of plays \u2264 1000\n\"At least 1000\" means:\nnumber of plays \u2265 1000\n\nThink of it like rules:\n\nFirst case: both rules \"meet\" at 1000 \u2192 \u2705 one solution\nSecond case: rules \"pull apart\" \u2192 \u274C no possible solution\nFinal takeaway\nWhen two conditions overlap \u2192 you get valid answers (sometimes just one).\nWhen they don't overlap \u2192 no solution exists.";

function addL10Timer(callback, delay){
  const t = window.setTimeout(callback, delay);
  l10Timers.push(t);
  return t;
}

function cleanupLevel10(){
  l10Timers.forEach(t => window.clearTimeout(t));
  l10Timers = [];
  l10WaitingForAnswer = false;
  l10ChatGptMode = false;
  l10PhoneUnlocked = false;
  l10QuestionIndex = 0;
  l10GamePicks = [];
  l10Messages.innerHTML = '';
  l10Input.value = '';
  l10Phone.classList.add('hidden');
  l10Chat.classList.remove('hidden');
}

function l10AddMsg(text, cls){
  const wrap = document.createElement('div');
  wrap.className = 'l10-msg-wrap ' + cls;
  const label = document.createElement('span');
  label.className = 'l10-msg-name';
  label.textContent = cls === 'me' ? 'You' : 'SuperGamer002';
  const bubble = document.createElement('div');
  bubble.className = 'l10-msg ' + cls;
  bubble.textContent = text;
  wrap.appendChild(label);
  wrap.appendChild(bubble);
  l10Messages.appendChild(wrap);
  l10Messages.scrollTop = l10Messages.scrollHeight;
  return bubble;
}

function l10ShowTyping(){
  const div = document.createElement('div');
  div.className = 'l10-typing';
  div.innerHTML = '<span>.</span><span>.</span><span>.</span>';
  div.id = 'l10TypingInd';
  l10Messages.appendChild(div);
  l10Messages.scrollTop = l10Messages.scrollHeight;
}

function l10HideTyping(){
  const el = document.getElementById('l10TypingInd');
  if(el) el.remove();
}

function l10PickGames(){
  const pool = Array.from({ length: L10_GAMES.length }, (_, i) => i);
  for(let i = pool.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 20);
}

function l10SendQuestion(){
  if(level !== 10) return;

  const qNum = l10QuestionIndex + 1;

  if(qNum <= 19){
    const gameIdx = l10GamePicks[l10QuestionIndex];
    const game = L10_GAMES[gameIdx];
    l10ShowTyping();
    addL10Timer(() => {
      if(level !== 10) return;
      l10HideTyping();
      l10AddMsg(qNum + '. ' + game.desc, 'them');
      l10WaitingForAnswer = true;
    }, 800 + Math.random() * 600);
  } else {
    l10ShowTyping();
    addL10Timer(() => {
      if(level !== 10) return;
      l10HideTyping();
      l10AddMsg('20. A game with at most 1000 plays and at least 1500 plays.', 'them');
      l10WaitingForAnswer = true;
    }, 800 + Math.random() * 600);
  }
}

function l10HandleUserMessage(text){
  if(level !== 10) return;

  if(!l10WaitingForAnswer){
    showToast('YOU ARE KICKED FOR SPAMMING');
    addL10Timer(() => {
      if(level === 10) restartLevelWithFade(10);
    }, 700);
    return;
  }

  l10WaitingForAnswer = false;
  l10AddMsg(text, 'me');
  l10Input.value = '';

  const qNum = l10QuestionIndex + 1;

  if(qNum <= 19){
    const gameIdx = l10GamePicks[l10QuestionIndex];
    const game = L10_GAMES[gameIdx];
    const correct = text.trim().toLowerCase().includes(game.name.toLowerCase());

    if(!correct){
      showToast('FAILED');
      addL10Timer(() => {
        if(level === 10) restartLevelWithFade(10);
      }, 700);
      return;
    }

    l10ShowTyping();
    addL10Timer(() => {
      if(level !== 10) return;
      l10HideTyping();
      l10AddMsg('Correct! \u2705', 'them');
      l10QuestionIndex++;

      addL10Timer(() => {
        l10SendQuestion();
      }, 600);
    }, 500);
  } else {
    const trimmed = text.trim();
    if(trimmed === L10_ANSWER_20.trim()){
      l10ShowTyping();
      addL10Timer(() => {
        if(level !== 10) return;
        l10HideTyping();
        l10AddMsg('Correct! \u2705 You got all 20!', 'them');
        addL10Timer(() => {
          if(level === 10) onLevelPassed(10);
        }, 1200);
      }, 500);
    } else {
      showToast('FAILED');
      addL10Timer(() => {
        if(level === 10) restartLevelWithFade(10);
      }, 700);
    }
  }
}

function l10StartChat(){
  l10Messages.innerHTML = '';
  l10QuestionIndex = 0;
  l10WaitingForAnswer = false;
  l10ChatGptMode = false;
  l10GamePicks = l10PickGames();

  l10ShowTyping();
  addL10Timer(() => {
    if(level !== 10) return;
    l10HideTyping();
    l10AddMsg('I will give you a game description, you need to guess what game that is 20 times in a row.', 'them');

    addL10Timer(() => {
      if(level !== 10) return;
      l10SendQuestion();
    }, 800);
  }, 1000);
}

function l10OpenPhone(){
  l10Chat.classList.add('hidden');
  l10Phone.classList.remove('hidden');
}

function l10OpenChatFromPhone(){
  l10Phone.classList.add('hidden');
  l10Chat.classList.remove('hidden');
}

function l10AutoAnswer(){
  if(level !== 10) return;
  l10ChatGptMode = true;
  l10OpenChatFromPhone();
  l10Area.scrollTop = l10Area.scrollHeight;
  l10RunAutoAnswer();
}

function l10RunAutoAnswer(){
  if(level !== 10 || !l10ChatGptMode) return;

  if(!l10WaitingForAnswer){
    addL10Timer(() => l10RunAutoAnswer(), 300);
    return;
  }

  const qNum = l10QuestionIndex + 1;

  addL10Timer(() => {
    if(level !== 10 || !l10ChatGptMode || !l10WaitingForAnswer) return;

    if(qNum <= 19){
      const gameIdx = l10GamePicks[l10QuestionIndex];
      const game = L10_GAMES[gameIdx];
      l10HandleUserMessage(game.name);
      addL10Timer(() => l10RunAutoAnswer(), 800);
    } else {
      l10HandleUserMessage(L10_ANSWER_20);
    }
  }, 500 + Math.random() * 400);
}

function setupLevel10(){
  btn.style.display = 'none';
  l10Area.classList.remove('hidden');
  l10Phone.classList.add('hidden');
  l10Chat.classList.remove('hidden');
  l10PhoneUnlocked = false;
  l10ChatGptMode = false;

  // Scroll past the hidden close button + spacer so only the chat is visible
  requestAnimationFrame(() => {
    l10Area.scrollTop = l10Area.scrollHeight;
  });

  l10StartChat();
}

l10SendBtn.addEventListener('click', () => {
  if(level !== 10) return;
  const text = l10Input.value.trim();
  if(!text) return;
  l10HandleUserMessage(text);
});

l10Input.addEventListener('keydown', (e) => {
  if(level !== 10) return;
  if(e.key === 'Enter'){
    e.preventDefault();
    const text = l10Input.value.trim();
    if(!text) return;
    l10HandleUserMessage(text);
  }
});

l10CloseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if(level !== 10) return;
  l10PhoneUnlocked = true;
  l10OpenPhone();
});

l10PhoneChatApp.addEventListener('click', () => {
  if(level !== 10) return;
  l10OpenChatFromPhone();
});

l10PhoneGptApp.addEventListener('click', () => {
  if(level !== 10) return;
  l10AutoAnswer();
});

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
  showLevelSelectScreen();
});

backHomeBtn.addEventListener('click', () => {
  showHomeScreen();
});

nextBtn.addEventListener('click', () => {
  if(pendingCompletedLevel === null) return;

  const currentCompleted = pendingCompletedLevel;
  levelPassModal.classList.add('hidden');

  if(currentCompleted >= TOTAL_LEVELS){
    showLevelSelectScreen();
    return;
  }

  startLevel(currentCompleted + 1, true);
});

playAgainBtn.addEventListener('click', () => {
  if(pendingCompletedLevel === null) return;
  levelPassModal.classList.add('hidden');
  restartLevelWithFade(pendingCompletedLevel);
});

levelsBtn.addEventListener('click', () => {
  levelPassModal.classList.add('hidden');
  showLevelSelectScreen();
});

document.getElementById('uiHomeBtn').addEventListener('click', () => {
  showLevelSelectScreen();
});

document.getElementById('uiRestartBtn').addEventListener('click', () => {
  restartLevelWithFade();
});

renderLevelSelect();
showScreen(homeScreen);

window.addEventListener('load', () => {
  homeScreen.classList.add('loaded');
});

