const TOTAL_LEVELS = 5;

const homeScreen = document.getElementById('homeScreen');
const levelSelectScreen = document.getElementById('levelSelectScreen');
const gameScreen = document.getElementById('gameScreen');

const startBtn = document.getElementById('startBtn');
const backHomeBtn = document.getElementById('backHomeBtn');
const levelsGrid = document.getElementById('levelsGrid');

const stage = document.getElementById('stage');
const btn = document.getElementById('mainBtn');
const speechBox = document.getElementById('speechBox');
const ui = document.getElementById('ui');
const ctx = document.getElementById('ctx');
const freezeOpt = document.getElementById('freezeOpt');
const dropZone = document.getElementById('dropZone');
const hiddenBtn = document.getElementById('hiddenBtn');
const finalArea = document.getElementById('finalArea');
const finalBtn = document.getElementById('finalBtn');

const levelPassModal = document.getElementById('levelPassModal');
const nextBtn = document.getElementById('nextBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const levelsBtn = document.getElementById('levelsBtn');

let level = 1;
let unlockedLevel = 1;
let frozen = false;
let stageDragging = false;
let stageOffsetX = 0;
let stageOffsetY = 0;
let pendingCompletedLevel = null;
let speechTimer = null;

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

function hideSpeechBox(){
  speechBox.classList.remove('show');
}

function showNopeSpeech(){
  window.clearTimeout(speechTimer);
  speechBox.classList.add('show');
  speechTimer = window.setTimeout(hideSpeechBox, 1100);
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

function onLevelPassed(completedLevel){
  pendingCompletedLevel = completedLevel;
  unlockedLevel = Math.max(unlockedLevel, Math.min(TOTAL_LEVELS, completedLevel + 1));
  renderLevelSelect();
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

function setLevel(n){
  level = n;
  ui.textContent = 'Level ' + n;
  frozen = false;
  stageDragging = false;

  dropZone.style.display = 'none';
  btn.style.display = 'block';
  btn.disabled = false;
  resetStagePosition();
  btn.style.left = '50%';
  btn.style.top = '50%';
  btn.style.transform = 'translate(-50%, -50%)';
  btn.style.transition = 'transform 0.12s, left 0.3s, top 0.3s';
  btn.classList.remove('shake');
  btn.dataset.landed = 'false';

  hideSpeechBox();
  ctx.style.display = 'none';
  btn.onclick = null;
  hiddenBtn.onclick = null;
  stage.onpointerdown = null;
  stage.onpointermove = null;
  window.onpointerup = null;
  btn.onpointerenter = null;

  document.body.classList.toggle('level5', n === 5);
  finalArea.style.display = n === 5 ? 'block' : 'none';

  if(n === 3) setupLevel3();
  if(n === 4) setupLevel4();
  if(n === 5) setupLevel5();
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
  if(level === 3 || level === 4){
    e.preventDefault();
    ctx.style.display = 'block';
    ctx.style.left = e.clientX + 'px';
    ctx.style.top = e.clientY + 'px';
  }
});

freezeOpt.addEventListener('click', () => {
  if(level === 4){
    ctx.style.display = 'none';
    btn.classList.remove('shake');
    void btn.offsetWidth;
    btn.classList.add('shake');
    showNopeSpeech();
    return;
  }

  frozen = true;
  ctx.style.display = 'none';
});

function setupLevel4(){
  dropZone.style.display = 'none';
  resetStagePosition();

  stage.onpointerdown = (e) => {
    if(e.target !== stage) return;
    stageDragging = true;
    const rect = stage.getBoundingClientRect();
    stageOffsetX = e.clientX - rect.left;
    stageOffsetY = e.clientY - rect.top;
    stage.setPointerCapture(e.pointerId);
  };

  stage.onpointermove = (e) => {
    if(!stageDragging) return;
    stage.style.left = (e.clientX - stageOffsetX) + 'px';
    stage.style.top = (e.clientY - stageOffsetY) + 'px';
    stage.style.transform = 'translate(0,0)';
  };

  window.onpointerup = (e) => {
    if(!stageDragging) return;
    stageDragging = false;
    if(stage.hasPointerCapture && e.pointerId !== undefined){
      stage.releasePointerCapture(e.pointerId);
    }
  };

  hiddenBtn.onclick = () => {
    onLevelPassed(4);
  };
}

function setupLevel5(){
  btn.disabled = true;
  btn.onpointerenter = () => {
    btn.style.display = 'none';
  };

  finalBtn.onclick = () => {
    onLevelPassed(5);
  };
}

document.addEventListener('click', (e) => {
  if(!ctx.contains(e.target) && e.target !== btn){
    ctx.style.display = 'none';
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

