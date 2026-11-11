

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tessera</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;color:#e0e0f0;font-family:'Segoe UI',system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;min-height:100vh;overflow-x:hidden;user-select:none}
#game-container{display:flex;gap:20px;padding:20px;align-items:flex-start;justify-content:center;flex-wrap:wrap}
.panel{background:#12122a;border-radius:12px;padding:16px;min-width:140px;display:flex;flex-direction:column;align-items:center;gap:8px}
.panel h3{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#6a6a9a;margin-bottom:4px}
#hold-canvas{width:80px;height:80px}
#score,#lines,#level{font-size:22px;font-weight:700;color:#fff;text-shadow:0 0 10px rgba(100,100,255,0.3)}
#next-container{display:flex;flex-direction:column;gap:4px}
.next-preview{width:60px;height:60px;display:flex;align-items:center;justify-content:center}
#board-wrap{position:relative}
#board{border-radius:8px;box-shadow:0 0 30px rgba(80,80,200,0.2),inset 0 0 20px rgba(0,0,0,0.5)}
#controls{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:16px;padding:0 20px}
#controls button{width:48px;height:48px;border:none;border-radius:10px;background:#1a1a3a;color:#a0a0d0;font-size:18px;cursor:pointer;transition:background 0.15s,transform 0.1s;display:flex;align-items:center;justify-content:center}
#controls button:hover{background:#2a2a5a}
#controls button:active{transform:scale(0.92);background:#3a3a7a}
#btn-row{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;justify-content:center}
#btn-row button{padding:8px 18px;border:none;border-radius:8px;background:#1a1a3a;color:#a0a0d0;font-size:13px;cursor:pointer;transition:background 0.15s}
#btn-row button:hover{background:#2a2a5a}
#btn-row button[aria-pressed="true"]{background:#3a3a8a;color:#fff;box-shadow:0 0 12px rgba(100,100,255,0.3)}
#overlay{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);z-index:100;pointer-events:none;opacity:0;transition:opacity 0.3s}
#overlay[data-state="paused"],#overlay[data-state="over"]{opacity:1;pointer-events:auto}
#overlay .msg{font-size:36px;font-weight:700;text-shadow:0 0 20px rgba(100,100,255,0.5)}
#fps{position:fixed;bottom:8px;right:12px;font-size:11px;color:#4a4a6a}
#best-score{font-size:13px;color:#6a6a9a;margin-top:4px}
canvas{image-rendering:pixelated}
@keyframes flash{0%{opacity:1}100%{opacity:0}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.shake{animation:shake 0.15s ease-in-out}
</style>
</head>
<body>
<div id="game-container">
<div class="panel" id="left-panel">
<h3>Hold</h3>
<canvas id="hold" width="80" height="80" data-piece="none"></canvas>
<h3>Score</h3>
<div id="score">0</div>
<h3>Lines</h3>
<div id="lines">0</div>
<h3>Level</h3>
<div id="level">1</div>
<div id="best-score">Best: 0</div>
</div>
<div id="board-wrap"><canvas id="board"></canvas></div>
<div class="panel" id="right-panel">
<h3>Next</h3>
<div id="next">
<canvas class="next-preview" data-preview="0" data-piece="" width="60" height="60"></canvas>
<canvas class="next-preview" data-preview="1" data-piece="" width="60" height="60"></canvas>
<canvas class="next-preview" data-preview="2" data-piece="" width="60" height="60"></canvas>
<canvas class="next-preview" data-preview="3" data-piece="" width="60" height="60"></canvas>
<canvas class="next-preview" data-preview="4" data-piece="" width="60" height="60"></canvas>
</div>
</div>
</div>
<div id="controls">
<button data-action="left">←</button>
<button data-action="right">→</button>
<button data-action="ccw">↺</button>
<button data-action="cw">↻</button>
<button data-action="soft">↓</button>
<button data-action="hard">⤓</button>
<button data-action="hold">⇡</button>
</div>
<div id="btn-row">
<button id="pause">Pause</button>
<button id="restart">Restart</button>
<button id="autoplay" aria-pressed="false">Autoplay</button>
<button id="mute" aria-pressed="false">Mute</button>
</div>
<div id="overlay" data-state="playing"><div class="msg" id="overlay-msg"></div></div>
<div id="fps">60</div>
<script>
(function(){
"use strict";

// === CONSTANTS ===
const COLS=10,ROWS=20;
const PIECE_IDS={I:1,J:2,L:3,O:4,S:5,T:6,Z:7};
const PIECE_NAMES=['I','J','L','O','S','T','Z'];
const COLORS={I:'#00e5ff',J:'#4488ff',L:'#ff8800',O:'#ffdd00',S:'#00dd44',T:'#cc44ff',Z:'#ff3355'};
const COLORS_DIM={I:'#005566',J:'#223366',L:'#664400',O:'#665500',S:'#006622',T:'#552266',Z:'#661122'};

// Piece shapes: [rotation][cell] = [x, y] in bounding box
const SHAPES={
I:[[0,1],[1,1],[2,1],[3,1],[2,0],[2,1],[2,2],[2,3],[0,2],[1,2],[2,2],[3,2],[1,0],[1,1],[1,2],[1,3]],
J:[[0,0],[0,1],[1,1],[2,1],[2,0],[1,0],[1,1],[1,2],[2,2],[2,1],[1,1],[0,1],[0,0],[1,0],[1,1],[0,2]],
L:[[2,0],[0,1],[1,1],[2,1],[2,2],[1,0],[1,1],[1,2],[0,2],[2,1],[1,1],[0,1],[0,0],[1,0],[1,1],[1,2]],
O:[[0,0],[1,0],[0,1],[1,1],[0,0],[1,0],[0,1],[1,1],[0,0],[1,0],[0,1],[1,1],[0,0],[1,0],[0,1],[1,1]],
S:[[1,0],[2,0],[0,1],[1,1],[1,0],[1,1],[2,1],[2,2],[1,1],[2,1],[1,2],[2,2],[0,0],[0,1],[1,1],[1,2]],
T:[[1,0],[0,1],[1,1],[2,1],[1,0],[2,1],[1,1],[1,2],[2,1],[1,2],[1,1],[0,1],[0,1],[1,1],[1,2],[1,0]],
Z:[[0,0],[1,0],[1,1],[2,1],[2,0],[2,1],[1,1],[1,2],[2,2],[1,2],[1,1],[0,1],[0,0],[0,1],[1,1],[1,2]]
};
// Reorganize as [type][rot][cell]
const PIECE_CELLS={};
for(let i=0;i<7;i++){
let name=PIECE_NAMES[i];
PIECE_CELLS[name]=[];
for(let r=0;r<4;r++){
let cells=[];
for(let c=0;c<4;c++){cells.push([SHAPES[name][r*4+c][0],SHAPES[name][r*4+c][1]]);}
PIECE_CELLS[name].push(cells);
}
}

// Box sizes
const BOX_SIZE={I:4,J:3,L:3,O:2,S:3,T:3,Z:3};

// SRS Kick tables (well coords: dx=cols, dy=rows, positive dy=down)
const KICKS_JLSTZ={
'0>1':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
'1>0':[[0,0],[1,0],[1,1],[0,-2],[1,-2]],
'1>2':[[0,0],[1,0],[1,1],[0,-2],[1,-2]],
'2>1':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
'2>3':[[0,0],[1,0],[1,-1],[0,2],[1,2]],
'3>2':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
'3>0':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
'0>3':[[0,0],[1,0],[1,-1],[0,2],[1,2]]
};
const KICKS_I={
'0>1':[[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
'1>0':[[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
'1>2':[[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
'2>1':[[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
'2>3':[[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
'3>2':[[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
'3>0':[[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
'0>3':[[0,0],[-1,0],[2,0],[-1,-2],[2,1]]
};

// T-spin front corners per rotation: which two of the 4 diagonal cells are "front"
// Diagonals: TL=(x,y), TR=(x+2,y), BL=(x,y+2), BR=(x+2,y+2)
// 0: points up → front = TL, TR
// 1: points right → front = TR, BR
// 2: points down → front = BL, BR
// 3: points left → front = TL, BL
const T_FRONT={0:[0,1],1:[1,3],2:[2,3],3:[0,2]};
const DIAG_INDEX={TL:0,TR:1,BL:2,BR:3};

// === SEEDED RNG (mulberry32) ===
function mulberry32(a){
return function(){
a|=0;a=a+0x6D2B79F5|0;
var t=Math.imul(a^a>>>15,1|a);
t=t+Math.imul(t^t>>>7,61|t)^t;
return((t^t>>>14)>>>0)/4294967296;
}
}

// === GAME STATE ===
let G={
board:[],
activePiece:null,
hold:null,
holdUsed:false,
bag:[],
rng:null,
score:0,
lines:0,
level:1,
combo:-1,
b2b:false,
lastSpin:'none',
phase:'playing',
grounded:false,
lockTimer:0,
lockResets:0,
gravityAcc:0,
tickCount:0,
seed:0,
replayLog:[],
autoplay:false,
aiTimer:0,
nextQueue:[]
};

// === AUDIO ===
let audioCtx=null;
let muted=false;
try{muted=JSON.parse(localStorage.getItem('tessera.settings')||'{}').mute||false}catch(e){}

function initAudio(){
if(!audioCtx){try{audioCtx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}
if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume();
}

function playTone(freq,dur,type,vol){
if(muted||!audioCtx)return;
try{
let osc=audioCtx.createOscillator();
let gain=audioCtx.createGain();
osc.type=type||'sine';
osc.frequency.value=freq;
gain.gain.setValueAtTime(vol||0.15,audioCtx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
osc.connect(gain);gain.connect(audioCtx.destination);
osc.start();osc.stop(audioCtx.currentTime+dur);
}catch(e){}
}

function sfxMove(){playTone(200,0.04,'square',0.06)}
function sfxRotate(){playTone(320,0.06,'square',0.08)}
function sfxLock(){playTone(120,0.1,'sawtooth',0.12);playTone(80,0.15,'sine',0.1)}
function sfxSoftDrop(){playTone(180,0.03,'sine',0.05)}
function sfxHardDrop(){playTone(100,0.08,'sawtooth',0.15);playTone(60,0.12,'sine',0.1)}
function sfxLineClear(){playTone(440,0.1,'sine',0.15);setTimeout(()=>playTone(660,0.1,'sine',0.15),80);setTimeout(()=>playTone(880,0.15,'sine',0.12),160)}
function sfxTetris(){playTone(523,0.1,'sine',0.18);setTimeout(()=>playTone(659,0.1,'sine',0.18),100);setTimeout(()=>playTone(784,0.1,'sine',0.18),200);setTimeout(()=>playTone(1047,0.2,'sine',0.2),300)}
function sfxLevelUp(){playTone(330,0.15,'sine',0.15);setTimeout(()=>playTone(440,0.15,'sine',0.15),120);setTimeout(()=>playTone(550,0.2,'sine',0.15),240)}
function sfxGameOver(){playTone(440,0.2,'sawtooth',0.12);setTimeout(()=>playTone(330,0.2,'sawtooth',0.12),200);setTimeout(()=>playTone(220,0.4,'sawtooth',0.12),400)}
function sfxHold(){playTone(500,0.05,'sine',0.1)}

// === CORE GAME FUNCTIONS ===
function createBoard(){
let b=[];
for(let i=0;i<ROWS*COLS;i++)b.push(0);
return b;
}

function getCell(type,rot,x,y){
let cells=PIECE_CELLS[type][rot];
let result=[];
for(let i=0;i<4;i++){
result.push([x+cells[i][0],y+cells[i][1]]);
}
return result;
}

function isValid(type,rot,x,y){
let cells=getCell(type,rot,x,y);
for(let i=0;i<4;i++){
let c=cells[i][0],r=cells[i][1];
if(c<0||c>=COLS||r<0||r>=ROWS)return false;
if(G.board[r*COLS+c]!==0)return false;
}
return true;
}

function getSpawnPos(type){
let boxW=BOX_SIZE[type];
let x=Math.floor((COLS-boxW)/2);
if(type==='O')x=4;
if(type==='I')x=3;
return{x:x,y:0};
}

function spawnPiece(type){
let pos=getSpawnPos(type);
G.activePiece={type:type,rot:0,x:pos.x,y:pos.y};
G.grounded=false;
G.lockTimer=0;
G.lockResets=0;
G.gravityAcc=0;
if(!isValid(type,0,pos.x,pos.y)){
G.phase='over';
updateOverlay();
sfxGameOver();
}
}

function refillBag(){
let bag=[0,1,2,3,4,5,6];
for(let i=5;i>=0;i--){
let j=Math.floor(G.rng()*(i+1));
let tmp=bag[i];bag[i]=bag[j];bag[j]=tmp;
}
G.bag=bag;
}

function nextFromBag(){
if(G.bag.length===0)refillBag();
return PIECE_NAMES[G.bag.shift()];
}

function getNextFive(){
let result=[];
let tempBag=G.bag.slice();
let tempRng=G.rng;
for(let i=0;i<5;i++){
if(tempBag.length===0){
let bag=[0,1,2,3,4,5,6];
for(let j=5;j>=0;j--){
let k=Math.floor(tempRng()*(j+1));
let t=bag[j];bag[j]=bag[k];bag[k]=t;
}
tempBag=bag;
}
result.push(PIECE_NAMES[tempBag.shift()]);
}
return result;
}

function tryMove(dx,dy){
if(!G.activePiece)return false;
let p=G.activePiece;
if(isValid(p.type,p.rot,p.x+dx,p.y+dy)){
p.x+=dx;p.y+=dy;
return true;
}
return false;
}

function canMove(dx,dy){
if(!G.activePiece)return false;
let p=G.activePiece;
return isValid(p.type,p.rot,p.x+dx,p.y+dy);
}

function tryRotate(dir){
if(!G.activePiece)return false;
let p=G.activePiece;
if(p.type==='O'){
// O never changes shape, but we still try the rotation for the "last action was rotation" check
// Actually, O rotation is a no-op but counts as a successful rotation? Let's say it succeeds.
return true;
}
let from=p.rot;
let to=(p.rot+dir+4)%4;
let kicks=(p.type==='I')?KICKS_I:KICKS_JLSTZ;
let key=from+'>'+to;
let offsets=kicks[key];
for(let i=0;i<offsets.length;i++){
let nx=p.x+offsets[i][0];
let ny=p.y+offsets[i][1];
if(isValid(p.type,to,nx,ny)){
p.x=nx;p.y=ny;p.rot=to;
return true;
}
}
return false;
}

function getGhostY(){
if(!G.activePiece)return -1;
let p=G.activePiece;
let gy=p.y;
while(isValid(p.type,p.rot,p.x,gy+1))gy++;
return gy;
}

function hardDrop(){
if(!G.activePiece)return false;
let p=G.activePiece;
let dist=0;
while(isValid(p.type,p.rot,p.x,p.y+1)){p.y++;dist++;}
G.score+=dist*2;
lockPiece();
return true;
}

function softDrop(){
if(!G.activePiece)return false;
if(canMove(0,1)){
G.activePiece.y++;
G.score+=1;
G.gravityAcc=0;
return true;
}
return false;
}

function doHold(){
if(!G.activePiece)return false;
if(G.holdUsed)return false;
let currentType=G.activePiece.type;
if(G.hold===null){
G.hold=currentType;
let next=nextFromBag();
G.activePiece={type:next,rot:0,...getSpawnPos(next)};
} else{
let heldType=G.hold;
G.hold=currentType;
G.activePiece={type:heldType,rot:0,...getSpawnPos(heldType)};
}
G.holdUsed=true;
G.grounded=false;
G.lockTimer=0;
G.lockResets=0;
G.gravityAcc=0;
if(!isValid(G.activePiece.type,0,G.activePiece.x,G.activePiece.y)){
G.phase='over';
updateOverlay();
sfxGameOver();
}
return true;
}

function checkTSpin(){
if(!G.activePiece||G.activePiece.type!=='T')return'none';
let p=G.activePiece;
let cx=p.x+1,cy=p.y+1;
// 4 diagonal cells
let diags=[];
let positions=[[cx-1,cy-1],[cx+1,cy-1],[cx-1,cy+1],[cx+1,cy+1]];
for(let i=0;i<4;i++){
let c=positions[i][0],r=positions[i][1];
let occupied=false;
if(c<0||c>=COLS||r<0||r>=ROWS)occupied=true;
else if(r>=ROWS)occupied=true;
else if(G.board[r*COLS+c]!==0)occupied=true;
diags.push(occupied);
}
let count=diags.filter(d=>d).length;
if(count<3)return'none';
// Check front corners
let front=T_FRONT[p.rot];
let bothFront=diags[front[0]]&&diags[front[1]];
return bothFront?'full':'mini';
}

function lockPiece(){
if(!G.activePiece)return;
let p=G.activePiece;
let cells=getCell(p.type,p.rot,p.x,p.y);
let lastActionWasRotation=G.lastActionWasRotation;
G.lastActionWasRotation=false;

// Check T-spin before locking
let spin='none';
if(lastActionWasRotation){
spin=checkTSpin();
}

for(let i=0;i<4;i++){
let c=cells[i][0],r=cells[i][1];
if(c>=0&&c<COLS&&r>=0&&r<ROWS){
G.board[r*COLS+c]=PIECE_IDS[p.type];
}
}

// Clear lines
let cleared=0;
let rowsToClear=[];
for(let r=0;r<ROWS;r++){
let full=true;
for(let c=0;c<COLS;c++){
if(G.board[r*COLS+c]===0){full=false;break;}
}
if(full)rowsToClear.push(r);
}
cleared=rowsToClear.length;

if(cleared>0){
// Remove cleared rows
for(let i=0;i<cleared;i++){
let row=rowsToClear[i];
for(let r=row;r>0;r--){
for(let c=0;c<COLS;c++){
G.board[r*COLS+c]=G.board[(r-1)*COLS+c];
}
}
for(let c=0;c<COLS;c++)G.board[c]=0;
}
G.lines+=cleared;
G.level=Math.floor(G.lines/10)+1;
}

// Scoring
let base=0;
let isB2B=false;
let isPC=false;

// Check perfect clear
if(cleared>0){
let empty=true;
for(let i=0;i<ROWS*COLS;i++){if(G.board[i]!==0){empty=false;break;}}
if(empty)isPC=true;
}

// Determine base score
if(spin==='full'||spin==='mini'){
if(spin==='full'){
base=[400,800,1200,1600][cleared]||400;
} else{
base=[100,200,400,0][cleared]||100;
}
if(cleared===0&&spin==='mini')base=100;
if(cleared===0&&spin==='full')base=400;
} else if(cleared>0){
base=[0,100,300,500,800][cleared]||0;
} else{
base=0;
}

// B2B
let prevWasB2B=G.b2b;
if(cleared>0){
if(prevWasB2B&&(cleared===4||spin!=='none')){
base=Math.floor(base*1.5);
}
}
// Update B2B
if(cleared>0){
G.b2b=(cleared===4||spin!=='none');
} else{
G.b2b=false;
}

// Combo
if(cleared>0){
G.combo++;
} else{
G.combo=-1;
}

// Combo bonus
let comboBonus=0;
if(cleared>0&&G.combo>=2){
comboBonus=50*(G.combo-1)*G.level;
}

// Perfect clear bonus
let pcBonus=0;
if(isPC){
pcBonus=[0,800,1200,1800,2000][cleared]*G.level;
}

G.score+=base*G.level+comboBonus+pcBonus;
G.lastSpin=spin;

// Effects and sounds
if(cleared===4){
sfxTetris();
triggerEffect('tetris');
} else if(cleared>0){
sfxLineClear();
triggerEffect('clear');
} else{
sfxLock();
}
if(spin==='full')triggerEffect('tspin');
if(isPC)triggerEffect('pc');

// Level up check
let prevLevel=Math.floor((G.lines-cleared)/10)+1;
if(G.level>prevLevel){
sfxLevelUp();
triggerEffect('levelup');
}

// Spawn next piece
G.holdUsed=false;
let nextType=nextFromBag();
spawnPiece(nextType);

// Update best score
updateBest();
}

function triggerEffect(type){
// Visual feedback - handled in render
G.effect=type;
G.effectTimer=30;
}

function updateBest(){
let best=parseInt(localStorage.getItem('tessera.best')||'0');
if(G.score>best){
localStorage.setItem('tessera.best',String(G.score));
document.getElementById('best-score').textContent='Best: '+G.score;
}
}

function resetGame(seed){
if(seed!==undefined&&seed!==null)G.seed=seed;
G.rng=mulberry32(G.seed);
G.board=createBoard();
G.bag=[];
G.hold=null;
G.holdUsed=false;
G.score=0;
G.lines=0;
G.level=1;
G.combo=-1;
G.b2b=false;
G.lastSpin='none';
G.phase='playing';
G.grounded=false;
G.lockTimer=0;
G.lockResets=0;
G.gravityAcc=0;
G.tickCount=0;
G.replayLog=[];
G.activePiece=null;
G.effect=null;
G.effectTimer=0;
G.lastActionWasRotation=false;
G.aiTimer=0;
refillBag();
let first=nextFromBag();
spawnPiece(first);
updateOverlay();
updateHUD();
}

// === GRAVITY & LOCK (fixed timestep) ===
function getGravityMs(){
return Math.max(50,Math.round(1000*Math.pow(0.8,G.level-1)));
}

function tick(dt){
if(G.phase!=='playing'||!G.activePiece)return;
G.tickCount++;

// Gravity
G.gravityAcc+=dt;
let gMs=getGravityMs();
while(G.gravityAcc>=gMs){
G.gravityAcc-=gMs;
if(canMove(0,1)){
G.activePiece.y++;
G.grounded=false;
G.lockTimer=0;
}
}

// Check if grounded
if(!canMove(0,1)){
if(!G.grounded){
G.grounded=true;
G.lockTimer=0;
}
} else{
G.grounded=false;
G.lockTimer=0;
}

// Lock delay
if(G.grounded){
G.lockTimer+=dt;
if(G.lockResets>=15||G.lockTimer>=500){
lockPiece();
}
}
}

// === INPUT HANDLING ===
function doAction(action){
if(G.phase==='over')return false;
if(G.phase==='paused')return false;
if(!G.activePiece)return false;

let result=false;
switch(action){
case'left':
result=tryMove(-1,0);
if(result)sfxMove();
break;
case'right':
result=tryMove(1,0);
if(result)sfxMove();
break;
case'cw':
result=tryRotate(1);
if(result){G.lastActionWasRotation=true;sfxRotate();}
break;
case'ccw':
result=tryRotate(-1);
if(result){G.lastActionWasRotation=true;sfxRotate();}
break;
case'soft':
result=softDrop();
if(result)sfxSoftDrop();
break;
case'hard':
result=hardDrop();
if(result)sfxHardDrop();
break;
case'hold':
result=doHold();
if(result)sfxHold();
break;
}

if(result){
// Lock delay reset
if(G.grounded&&G.lockResets<15&&(action==='left'||action==='right'||action==='cw'||action==='ccw')){
G.lockTimer=0;
G.lockResets++;
}
// Record in replay
G.replayLog.push({tick:G.tickCount,action:action});
}
return result;
}

// Keyboard
let keyRepeatTimers={};
let keyRepeatIntervals={};
let keysDown={};

document.addEventListener('keydown',function(e){
initAudio();
if(e.repeat)return;
let action=null;
switch(e.key){
case'ArrowLeft':action='left';break;
case'ArrowRight':action='right';break;
case'ArrowDown':action='soft';break;
case' ':action='hard';break;
case'ArrowUp':case'x':case'X':action='cw';break;
case'z':case'Z':case'Control':action='ccw';break;
case'c':case'C':case'Shift':action='hold';break;
case'p':case'P':case'Escape':
togglePause();return;
case'r':case'R':
resetGame(G.seed);return;
}
if(action){
if(e.key===' '||e.key.startsWith('Arrow'))e.preventDefault();
doAction(action);
// Start auto-repeat for directional keys
if(action==='left'||action==='right'||action==='soft'){
keysDown[action]=true;
keyRepeatTimers[action]=setTimeout(function(){
keyRepeatIntervals[action]=setInterval(function(){
doAction(action);
},35);
},150);
}
}
});

document.addEventListener('keyup',function(e){
let action=null;
switch(e.key){
case'ArrowLeft':action='left';break;
case'ArrowRight':action='right';break;
case'ArrowDown':action='soft';break;
}
if(action){
keysDown[action]=false;
if(keyRepeatTimers[action]){clearTimeout(keyRepeatTimers[action]);keyRepeatTimers[action]=null;}
if(keyRepeatIntervals[action]){clearInterval(keyRepeatIntervals[action]);keyRepeatIntervals[action]=null;}
}
});

// On-screen buttons
document.getElementById('controls').addEventListener('mousedown',function(e){
let btn=e.target.closest('button[data-action]');
if(!btn)return;
initAudio();
let action=btn.getAttribute('data-action');
doAction(action);
// Auto-repeat for press-and-hold
let repeatId=setInterval(function(){doAction(action);},35);
let timeoutId=setTimeout(function(){},150);
function stop(){
clearInterval(repeatId);
clearTimeout(timeoutId);
}
btn.addEventListener('mouseup',stop,{once:true});
btn.addEventListener('mouseleave',stop,{once:true});
});
document.getElementById('controls').addEventListener('touchstart',function(e){
let btn=e.target.closest('button[data-action]');
if(!btn)return;
initAudio();
let action=btn.getAttribute('data-action');
doAction(action);
let repeatId=setInterval(function(){doAction(action);},35);
function stop(){clearInterval(repeatId);}
btn.addEventListener('touchend',stop,{once:true});
btn.addEventListener('touchcancel',stop,{once:true});
});

// Pause
function togglePause(){
if(G.phase==='playing')G.phase='paused';
else if(G.phase==='paused')G.phase='playing';
updateOverlay();
}

// === AUTOPLAY AI ===
function aiStep(){
if(G.phase!=='playing'||!G.activePiece)return;
let p=G.activePiece;
let bestScore=-Infinity;
let bestRot=0,bestX=0,bestY=0;

for(let rot=0;rot<4;rot++){
for(let x=0;x<COLS;x++){
// Find drop position
let y=0;
if(!isValid(p.type,rot,x,0))continue;
while(isValid(p.type,rot,x,y+1))y++;
if(!isValid(p.type,rot,x,y))continue;

// Simulate
let simBoard=G.board.slice();
let cells=getCell(p.type,rot,x,y);
for(let i=0;i<4;i++){
let c=cells[i][0],r=cells[i][1];
if(c>=0&&c<COLS&&r>=0&&r<ROWS)simBoard[r*COLS+c]=PIECE_IDS[p.type];
}

// Count lines cleared
let cleared=0;
for(let r=0;r<ROWS;r++){
let full=true;
for(let c=0;c<COLS;c++){if(simBoard[r*COLS+c]===0){full=false;break;}}
if(full)cleared++;
}

// Remove cleared lines from sim
if(cleared>0){
let rows=[];
for(let r=0;r<ROWS;r++){
let full=true;
for(let c=0;c<COLS;c++){if(simBoard[r*COLS+c]===0){full=false;break;}}
if(full)rows.push(r);
}
for(let i=0;i<cleared;i++){
let row=rows[i];
for(let r=row;r>0;r--){
for(let c=0;c<COLS;c++)simBoard[r*COLS+c]=simBoard[(r-1)*COLS+c];
}
for(let c=0;c<COLS;c++)simBoard[c]=0;
}
}

// Score the board
let colHeights=[];
let holes=0;
for(let c=0;c<COLS;c++){
let h=0;
for(let r=0;r<ROWS;r++){
if(simBoard[r*COLS+c]!==0){h=ROWS-r;break;}
}
colHeights.push(h);
}
for(let c=0;c<COLS;c++){
let found=false;
for(let r=0;r<ROWS;r++){
if(simBoard[r*COLS+c]!==0)found=true;
else if(found)holes++;
}
}
let heightSum=colHeights.reduce((a,b)=>a+b,0);
let bumpiness=0;
for(let c=0;c<COLS-1;c++)bumpiness+=Math.abs(colHeights[c]-colHeights[c+1]);
let flatBonus=0;
for(let c=0;c<COLS-1;c++)if(colHeights[c]===colHeights[c+1])flatBonus++;

let score=1000*cleared*G.level-heightSum*0.5-holes*0.3-bumpiness*0.5+flatBonus*1.0;
if(cleared===4)score+=500;

if(score>bestScore){
bestScore=score;
bestRot=rot;bestX=x;bestY=y;
}
}
}

// Execute: rotate to bestRot, move to bestX, hard drop
// Rotate
let curRot=p.rot;
let targetRot=bestRot;
let cwSteps=(targetRot-curRot+4)%4;
let ccwSteps=(curRot-targetRot+4)%4;
if(cwSteps<=ccwSteps){
for(let i=0;i<cwSteps;i++){if(!doAction('cw'))break;}
}else{
for(let i=0;i<ccwSteps;i++){if(!doAction('ccw'))break;}
}
// Move
let curX=G.activePiece?G.activePiece.x:p.x;
let diff=bestX-curX;
if(diff>0){
for(let i=0;i<diff;i++){if(!doAction('right'))break;}
}else if(diff<0){
for(let i=0;i<-diff;i++){if(!doAction('left'))break;}
}
// Hard drop
doAction('hard');
}

// === RENDERING ===
const boardCanvas=document.getElementById('board');
const bctx=boardCanvas.getContext('2d');
let cellSize=30;
let boardW=COLS*cellSize;
let boardH=ROWS*cellSize;
boardCanvas.width=boardW;
boardCanvas.height=boardH;

function resizeBoard(){
let maxH=window.innerHeight-120;
let maxW=window.innerWidth-340;
cellSize=Math.floor(Math.min(maxW/COLS,maxH/ROWS));
cellSize=Math.max(20,Math.min(cellSize,40));
boardW=COLS*cellSize;
boardH=ROWS*cellSize;
boardCanvas.width=boardW;
boardCanvas.height=boardH;
}
resizeBoard();
window.addEventListener('resize',resizeBoard);

function drawCell(ctx,x,y,size,color,alpha){
ctx.globalAlpha=alpha||1;
ctx.fillStyle=color;
ctx.fillRect(x*size+1,y*size+1,size-2,size-2);
// Subtle 3D effect
ctx.fillStyle='rgba(255,255,255,0.15)';
ctx.fillRect(x*size+1,y*size+1,size-2,3);
ctx.fillStyle='rgba(0,0,0,0.2)';
ctx.fillRect(x*size+1,y*size+size-4,size-2,3);
ctx.globalAlpha=1;
}

function drawGhostCell(ctx,x,y,size,color){
ctx.strokeStyle=color;
ctx.lineWidth=2;
ctx.strokeRect(x*size+2,y*size+2,size-4,size-4);
}

function render(){
bctx.clearRect(0,0,boardW,boardH);

// Background
bctx.fillStyle='#0d0d22';
bctx.fillRect(0,0,boardW,boardH);

// Grid
bctx.strokeStyle='rgba(60,60,100,0.3)';
bctx.lineWidth=1;
for(let r=0;r<=ROWS;r++){
bctx.beginPath();bctx.moveTo(0,r*cellSize);bctx.lineTo(boardW,r*cellSize);bctx.stroke();
}
for(let c=0;c<=COLS;c++){
bctx.beginPath();bctx.moveTo(c*cellSize,0);bctx.lineTo(c*cellSize,boardH);bctx.stroke();
}

// Locked blocks
for(let r=0;r<ROWS;r++){
for(let c=0;c<COLS;c++){
let id=G.board[r*COLS+c];
if(id!==0){
let name=PIECE_NAMES[id-1];
drawCell(bctx,c,r,cellSize,COLORS[name],1);
}
}
}

// Ghost
if(G.activePiece&&G.phase==='playing'){
let p=G.activePiece;
let gy=getGhostY();
if(gy>p.y){
let gcells=getCell(p.type,p.rot,p.x,gy);
for(let i=0;i<4;i++){
let c=gcells[i][0],r=gcells[i][1];
if(c>=0&&c<COLS&&r>=0&&r<ROWS){
drawGhostCell(bctx,c,r,cellSize,COLORS[p.type]+'66');
}
}
}
}

// Active piece
if(G.activePiece&&G.phase==='playing'){
let p=G.activePiece;
let cells=getCell(p.type,p.rot,p.x,p.y);
for(let i=0;i<4;i++){
let c=cells[i][0],r=cells[i][1];
if(c>=0&&c<COLS&&r>=0&&r<ROWS){
drawCell(bctx,c,r,cellSize,COLORS[p.type],1);
}
}
}

// Effect flash
if(G.effect&&G.effectTimer>0){
bctx.globalAlpha=G.effectTimer/30*0.3;
bctx.fillStyle='#fff';
bctx.fillRect(0,0,boardW,boardH);
bctx.globalAlpha=1;
}
}

function renderHold(){
let canvas=document.getElementById('hold');
let ctx=canvas.getContext('2d');
ctx.clearRect(0,0,canvas.width,canvas.height);
let holdEl=document.getElementById('hold');
if(G.hold===null){
holdEl.setAttribute('data-piece','none');
return;
}
holdEl.setAttribute('data-piece',G.hold);
let type=G.hold;
let cells=PIECE_CELLS[type][0];
let boxW=BOX_SIZE[type];
let s=Math.min(16,canvas.width/(boxW+2));
let ox=(canvas.width-boxW*s)/2;
let oy=(canvas.height-4*s)/2;
for(let i=0;i<4;i++){
ctx.fillStyle=COLORS[type];
ctx.fillRect(ox+cells[i][0]*s+1,oy+cells[i][1]*s+1,s-2,s-2);
}
}

function renderNext(){
let previews=document.querySelectorAll('.next-preview');
let nextFive=getNextFive();
for(let i=0;i<5;i++){
let canvas=previews[i];
let ctx=canvas.getContext('2d');
ctx.clearRect(0,0,canvas.width,canvas.height);
if(i<5&&nextFive[i]){
canvas.setAttribute('data-piece',nextFive[i]);
let type=nextFive[i];
let cells=PIECE_CELLS[type][0];
let boxW=BOX_SIZE[type];
let s=Math.min(12,canvas.width/(boxW+2));
let ox=(canvas.width-boxW*s)/2;
let oy=(canvas.height-4*s)/2;
for(let j=0;j<4;j++){
ctx.fillStyle=COLORS[type];
ctx.fillRect(ox+cells[j][0]*s+1,oy+cells[j][1]*s+1,s-2,s-2);
}
}else{
canvas.setAttribute('data-piece','');
}
}
}

function updateHUD(){
document.getElementById('score').textContent=G.score;
document.getElementById('lines').textContent=G.lines;
document.getElementById('level').textContent=G.level;
renderHold();
renderNext();
}

function updateOverlay(){
let overlay=document.getElementById('overlay');
overlay.setAttribute('data-state',G.phase);
let msg=document.getElementById('overlay-msg');
if(G.phase==='paused')msg.textContent='PAUSED';
else if(G.phase==='over')msg.textContent='GAME OVER';
else msg.textContent='';
}

// === MAIN LOOP ===
let lastTime=0;
let accumulator=0;
const FIXED_DT=16;
let fpsCounter=0;
let fpsTime=0;
let displayFps=60;

function gameLoop(timestamp){
if(lastTime===0)lastTime=timestamp;
let dt=timestamp-lastTime;
lastTime=timestamp;
if(dt>100)dt=100;

// FPS
fpsCounter++;
fpsTime+=dt;
if(fpsTime>=1000){
displayFps=Math.round(fpsCounter*1000/fpsTime);
document.getElementById('fps').textContent=displayFps;
fpsCounter=0;fpsTime=0;
}

if(G.phase==='playing'){
accumulator+=dt;
while(accumulator>=FIXED_DT){
tick(FIXED_DT);
accumulator-=FIXED_DT;
}

// Autoplay
if(G.autoplay){
G.aiTimer+=FIXED_DT;
if(G.aiTimer>=200){
G.aiTimer=0;
aiStep();
}
}

// Effect timer
if(G.effectTimer>0)G.effectTimer--;
}

render();
if(G.phase==='playing'||G.phase==='paused')updateHUD();

requestAnimationFrame(gameLoop);
}

// === REPLAY ===
function exportReplay(){
return G.replayLog.map(e=>e.tick+':'+e.action).join('|');
}

function importReplay(str){
if(!str)return;
// Reset with current seed
resetGame(G.seed);
let entries=str.split('|').filter(s=>s.length>0);
let sorted=entries.map(s=>{
let parts=s.split(':');
return{tick:parseInt(parts[0]),action:parts[1]};
}).sort((a,b)=>a.tick-b.tick);

let currentTick=0;
for(let i=0;i<sorted.length;i++){
let entry=sorted[i];
// Advance to entry tick
while(currentTick<entry.tick&&G.phase==='playing'){
tick(FIXED_DT);
currentTick++;
}
if(G.phase!=='playing')break;
doAction(entry.action);
currentTick=entry.tick;
}
// Advance to end (let any remaining piece lock)
let maxTicks=sorted.length>0?sorted[sorted.length-1].tick:0;
while(currentTick<maxTicks+500&&G.phase==='playing'){
tick(FIXED_DT);
currentTick++;
}
}

// === GRADER CONTRACT ===
window.__arena={
state:function(){
return{
phase:G.phase,
score:G.score,
lines:G.lines,
level:G.level,
combo:G.combo,
b2b:G.b2b,
gravityMs:getGravityMs(),
lastSpin:G.lastSpin,
hold:G.hold||'none',
next:getNextFive(),
seed:G.seed
};
},
board:function(){
return G.board.slice();
},
piece:function(){
if(!G.activePiece)return null;
let p=G.activePiece;
let cells=getCell(p.type,p.rot,p.x,p.y);
return{type:p.type,rot:p.rot,cells:cells};
},
ghostY:function(){
return getGhostY();
},
input:function(action){
return doAction(action);
},
reset:function(seed){
if(seed!==undefined&&seed!==null)G.seed=seed;
resetGame(G.seed);
},
setSeed:function(n){
G.seed=n;
},
setBoard:function(cells){
G.board=cells.slice();
if(G.activePiece){
let type=G.activePiece.type;
let pos=getSpawnPos(type);
G.activePiece={type:type,rot:0,x:pos.x,y:pos.y};
G.grounded=false;
G.lockTimer=0;
G.lockResets=0;
G.gravityAcc=0;
}
},
spawn:function(type,x,y){
if(!type||!PIECE_IDS[type])return false;
let pos;
if(x!==undefined&&y!==undefined){
pos={x:x,y:y};
}else{
pos=getSpawnPos(type);
}
let cells=getCell(type,0,pos.x,pos.y);
for(let i=0;i<4;i++){
let c=cells[i][0],r=cells[i][1];
if(c<0||c>=COLS||r<0||r>=ROWS)return false;
}
G.activePiece={type:type,rot:0,x:pos.x,y:pos.y};
G.grounded=false;
G.lockTimer=0;
G.lockResets=0;
G.gravityAcc=0;
return true;
},
setLines:function(n){
G.lines=n;
G.level=Math.floor(n/10)+1;
},
exportReplay:exportReplay,
importReplay:importReplay
};

// === BUTTON HANDLERS ===
document.getElementById('pause').addEventListener('click',function(){
initAudio();
togglePause();
});
document.getElementById('restart').addEventListener('click',function(){
initAudio();
resetGame(G.seed);
});
document.getElementById('autoplay').addEventListener('click',function(){
initAudio();
G.autoplay=!G.autoplay;
this.setAttribute('aria-pressed',G.autoplay?'true':'false');
if(!G.autoplay)G.aiTimer=0;
});
document.getElementById('mute').addEventListener('click',function(){
initAudio();
muted=!muted;
this.setAttribute('aria-pressed',muted?'true':'false');
try{
let settings=JSON.parse(localStorage.getItem('tessera.settings')||'{}');
settings.mute=muted;
localStorage.setItem('tessera.settings',JSON.stringify(settings));
}catch(e){}
});

// Initialize mute button state
document.getElementById('mute').setAttribute('aria-pressed',muted?'true':'false');

// === INIT ===
try{
let best=parseInt(localStorage.getItem('tessera.best')||'0');
document.getElementById('best-score').textContent='Best: '+best;
}catch(e){}
try{
localStorage.setItem('tessera.settings',JSON.stringify({mute:muted}));
}catch(e){}

G.seed=12345;
resetGame(G.seed);
requestAnimationFrame(gameLoop);

})();
</script>
</body>
</html>
```