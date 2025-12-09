const stage = document.getElementById('stage');
const btn = document.getElementById('mainBtn');
const ui = document.getElementById('ui');
const ctx = document.getElementById('ctx');
const freezeOpt = document.getElementById('freezeOpt');
const lvlMsg = document.getElementById('levelPassedMsg');
const dropZone = document.getElementById('dropZone');
const hiddenBtn = document.getElementById('hiddenBtn');
const finalArea = document.getElementById('finalArea');
const finalBtn = document.getElementById('finalBtn');

let level = 1;
let frozen = false;
let dragging = false;
let offsetX=0, offsetY=0;
let repelInterval=null;
let stageDragging=false;
let stageOffsetX=0, stageOffsetY=0;

function resetStagePosition(){
  stage.style.left="50%";
  stage.style.top="50%";
  stage.style.transform="translate(-50%,-50%)";
}

function showMessage(msg, duration=1200){
  const original = lvlMsg.textContent;
  lvlMsg.textContent = msg;
  lvlMsg.style.display="block";
  requestAnimationFrame(()=> lvlMsg.style.opacity=1);
  setTimeout(()=>{
    lvlMsg.style.opacity=0;
    setTimeout(()=>{
      lvlMsg.style.display="none";
      lvlMsg.textContent = original;
    },300);
  },duration);
}

/* ★ PAGE TURN + LEVEL PASSED MESSAGE */
function showLevelPassed(next){
  lvlMsg.textContent="LEVEL PASSED!";
  lvlMsg.style.display="block";
  requestAnimationFrame(()=> lvlMsg.style.opacity=1);

  setTimeout(()=>{
    lvlMsg.style.opacity=0;
    setTimeout(()=> lvlMsg.style.display="none",300);
  },900);

  /* ★ page turn */
  setTimeout(()=> stage.classList.add("turn"), 300);
  setTimeout(()=>{
    stage.classList.remove("turn");
    next();
  },900);
}

function setLevel(n){
  level=n;
  ui.textContent="Level "+n;
  frozen=false;
  dragging=false;
  dropZone.style.display="none";
  btn.style.display="block";
  btn.disabled=false;
  resetStagePosition();
  btn.style.left="50%";
  btn.style.top="50%";
  btn.style.transform="translate(-50%,-50%)";
  btn.dataset.landed="false";
  ctx.style.display="none";
  btn.onclick=null;
  hiddenBtn.onclick=null;
  stage.onpointerdown=null;
  stage.onpointermove=null;
  window.onpointerup=null;
  btn.onpointerdown=null;
  btn.onpointerenter=null;
  document.body.classList.toggle("level5", n===5);
  finalArea.style.display = n===5 ? "block" : "none";

  clearInterval(repelInterval);

  if(n===3) setupLevel3();
  if(n===4) setupLevel4();
  if(n===5) setupLevel5();
}

/* LEVEL 1 & 2 */
btn.addEventListener('click', ()=>{
  if(level===1){
    showLevelPassed(()=> setLevel(2));
  }
  else if(level===2){
    const s = stage.getBoundingClientRect();
    if(btn.dataset.landed==="false"){
      btn.dataset.landed="true";
      btn.style.transition="top .5s";
      btn.style.top=(s.height-50)+"px";
      return;
    }
    showLevelPassed(()=> setLevel(3));
  }
});

/* LEVEL 3 */
function setupLevel3(){
  btn.onclick = ()=>{
    if(!frozen) teleportBtn();
    else showLevelPassed(()=> setLevel(4));
  };
}

function teleportBtn(){
  if(frozen) return;
  const s=stage.getBoundingClientRect();
  const x=40+Math.random()*(s.width-80);
  const y=40+Math.random()*(s.height-80);
  btn.style.left=x+"px";
  btn.style.top=y+"px";
}

/* Right-click freeze */
btn.addEventListener('contextmenu', e=>{
  if(level===3 || level===4){
    e.preventDefault();
    ctx.style.display="block";
    ctx.style.left=e.clientX+"px";
    ctx.style.top=e.clientY+"px";
  }
});
freezeOpt.addEventListener('click', ()=>{
  if(level===4){
    showMessage("Nice try. Level 4 won't freeze!");
    ctx.style.display="none";
    return;
  }
  frozen=true;
  ctx.style.display="none";
});

/* LEVEL 4 — Drag into target zone */
function setupLevel4(){
  dropZone.style.display="none";
  resetStagePosition();

  stage.onpointerdown = e=>{
    if(e.target !== stage) return;
    stageDragging=true;
    const rect = stage.getBoundingClientRect();
    stageOffsetX = e.clientX - rect.left;
    stageOffsetY = e.clientY - rect.top;
    stage.setPointerCapture(e.pointerId);
  };

  stage.onpointermove = e=>{
    if(!stageDragging) return;
    stage.style.left = (e.clientX - stageOffsetX) + "px";
    stage.style.top = (e.clientY - stageOffsetY) + "px";
    stage.style.transform = "translate(0,0)";
  };

  window.onpointerup = e=>{
    if(!stageDragging) return;
    stageDragging=false;
    if(stage.hasPointerCapture && e.pointerId!==undefined){
      stage.releasePointerCapture(e.pointerId);
    }
  };

  hiddenBtn.onclick = ()=>{
    showLevelPassed(()=> setLevel(5));
  };
}

/* LEVEL 5 — Button repels cursor unless Shift is held */
function setupLevel5(){
  // The in-stage button vanishes on touch.
  btn.disabled=true;
  btn.onpointerenter = ()=>{
    btn.style.display="none";
  };

  // Scroll to bottom to find the real one.
  finalBtn.onclick = ()=>{
    showMessage("You completed the game!", 1600);
  };
}

setLevel(1);

