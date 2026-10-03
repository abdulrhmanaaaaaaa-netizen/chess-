/* ═══════════════════════════════════════════════════════════
   شطرنج برو V4 — محرك كامل + AI متعدد المستويات + Elo + أكاديمية
   ═══════════════════════════════════════════════════════════ */

/* ═══ قطع SVG بدون صلبان ═══ */
const SVG = {
  p:`<svg viewBox="0 0 45 45"><circle cx="22.5" cy="13" r="6.5"/><path d="M22.5 19.5c-5 0-9 6.5-9 14.5h18c0-8-4-14.5-9-14.5z"/><rect x="10" y="34" width="25" height="4.5" rx="2.2"/></svg>`,
  r:`<svg viewBox="0 0 45 45"><path d="M11 9h5v5h4V9h5v5h4V9h5v10l-3 3v11l3 3v3H11v-3l3-3V22l-3-3z"/></svg>`,
  n:`<svg viewBox="0 0 45 45"><path d="M24 9c-1.5 0-2.6.6-3.5 1.5-2-1-4.2-.8-6.3.5l-5.2 3.2c-2 1.2-3 3.2-2.6 5.5l.6 3.6c.2 1.2 1.6 1.7 2.6 1l3.3-2.3c.8 2.4.8 5-.2 7.5l-2 5h22l-1.5-7c-.8-3.9-2.6-7-5.2-9.3-1.6-1.4-2.6-3.3-2.6-5.4 0-1.6 1-2.9 2.3-3.6-.4-.1-.8-.2-1.7-.2z"/></svg>`,
  b:`<svg viewBox="0 0 45 45"><circle cx="22.5" cy="8" r="3.3"/><path d="M22.5 12.5c-4.5 4.5-8.5 9.5-8.5 15 0 3.5 2.2 5.5 5 5.5h7c2.8 0 5-2 5-5.5 0-5.5-4-10.5-8.5-15z"/><rect x="15" y="33.5" width="15" height="3" rx="1"/><rect x="12" y="36.5" width="21" height="4.5" rx="2"/></svg>`,
  q:`<svg viewBox="0 0 45 45"><circle cx="9" cy="12" r="2.6"/><circle cx="16.5" cy="8.5" r="2.6"/><circle cx="22.5" cy="7" r="2.8"/><circle cx="28.5" cy="8.5" r="2.6"/><circle cx="36" cy="12" r="2.6"/><path d="M9 14l4.5 16h18l4.5-16-6 7-5-11-5 11-5-11-5 11z"/><rect x="14" y="31" width="17" height="3" rx="1"/><rect x="12" y="34" width="21" height="4.5" rx="2"/></svg>`,
  k:`<svg viewBox="0 0 45 45"><circle cx="22.5" cy="6.5" r="3.3"/><path d="M11 13l2.5 15h18L34 13l-5.5 9L24 10l-4.5 12L14 13z"/><rect x="14" y="29" width="17" height="3" rx="1"/><rect x="12" y="32" width="21" height="4.5" rx="2"/><rect x="10" y="36.5" width="25" height="4.5" rx="2"/></svg>`
};

/* ═══ قيم القطع ═══ */
const VAL={p:100,n:320,b:330,r:500,q:900,k:20000};
const DIRS={r:[[1,0],[-1,0],[0,1],[0,-1]],b:[[1,1],[1,-1],[-1,1],[-1,-1]],n:[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]};
DIRS.q=DIRS.r.concat(DIRS.b);DIRS.k=DIRS.r;

/* ═══ لوحة البداية ═══ */
function startBoard(){
  const back=['r','n','b','q','k','b','n','r'];
  const b=Array.from({length:8},()=>Array(8).fill(null));
  for(let c=0;c<8;c++){b[0][c]='b'+back[c];b[1][c]='bp';b[6][c]='wp';b[7][c]='w'+back[c];}
  return b;
}
const clone=b=>b.map(r=>r.slice());

/* ═══ توليد النقلات ═══ */
function pseudo(board,r,c){
  const p=board[r][c];if(!p)return[];
  const color=p[0],type=p[1],out=[];
  const push=(rr,cc)=>{if(rr<0||rr>7||cc<0||cc>7)return false;const t=board[rr][cc];if(t&&t[0]===color)return false;out.push([rr,cc]);return!t;};
  if(type==='p'){
    const d=color==='w'?-1:1,sr=color==='w'?6:1;
    if(r+d>=0&&r+d<=7&&!board[r+d][c]){out.push([r+d,c]);if(r===sr&&!board[r+2*d][c])out.push([r+2*d,c]);}
    for(const dc of[-1,1]){const rr=r+d,cc=c+dc;if(rr>=0&&rr<=7&&cc>=0&&cc<=7){const t=board[rr][cc];if(t&&t[0]!==color)out.push([rr,cc]);}}
  } else if(type==='n'||type==='k'){
    for(const[dr,dc]of(type==='n'?DIRS.n:DIRS.r))push(r+dr,c+dc);
  } else {
    for(const[dr,dc]of DIRS[type]){let rr=r+dr,cc=c+dc;while(rr>=0&&rr<=7&&cc>=0&&cc<=7){const t=board[rr][cc];if(!t)out.push([rr,cc]);else{if(t[0]!==color)out.push([rr,cc]);break;}rr+=dr;cc+=dc;}}
  }
  return out;
}
function findKing(board,color){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]===color+'k')return[r,c];return null;}
function attacked(board,r,c,by){
  const pd=by==='w'?1:-1;
  for(const dc of[-1,1]){const rr=r+pd,cc=c+dc;if(rr>=0&&rr<=7&&cc>=0&&cc<=7&&board[rr][cc]===by+'p')return true;}
  for(const[dr,dc]of DIRS.n){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<=7&&cc>=0&&cc<=7&&board[rr][cc]===by+'n')return true;}
  for(const[dr,dc]of DIRS.r){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<=7&&cc>=0&&cc<=7&&board[rr][cc]===by+'k')return true;}
  for(const[dr,dc]of DIRS.r){let rr=r+dr,cc=c+dc;while(rr>=0&&rr<=7&&cc>=0&&cc<=7){const t=board[rr][cc];if(t){if(t[0]===by&&(t[1]==='r'||t[1]==='q'))return true;break;}rr+=dr;cc+=dc;}}
  for(const[dr,dc]of DIRS.b){let rr=r+dr,cc=c+dc;while(rr>=0&&rr<=7&&cc>=0&&cc<=7){const t=board[rr][cc];if(t){if(t[0]===by&&(t[1]==='b'||t[1]==='q'))return true;break;}rr+=dr;cc+=dc;}}
  return false;
}
function inCheck(board,color){const k=findKing(board,color);return k?attacked(board,k[0],k[1],color==='w'?'b':'w'):false;}
function legal(board,color){
  const res=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    if(board[r][c]&&board[r][c][0]===color){
      for(const[rr,cc]of pseudo(board,r,c)){
        const nb=clone(board);nb[rr][cc]=nb[r][c];nb[r][c]=null;
        if(!inCheck(nb,color))res.push([r,c,rr,cc]);
      }
    }
  }
  return res;
}

/* ═══ الذكاء الاصطناعي ═══ */
function evaluate(board){
  let s=0;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=board[r][c];if(!p)continue;
    const v=VAL[p[1]];
    const center=(3.5-Math.abs(3.5-r))+(3.5-Math.abs(3.5-c));
    const develop=p[1]==='p'?(p[0]==='w'?7-r:r)*3:0;
    s+=p[0]==='w'?(v+center*2+develop):-(v+center*2+develop);
  }
  return s;
}
function apply(board,m){
  const nb=clone(board);nb[m[2]][m[3]]=nb[m[0]][m[1]];nb[m[0]][m[1]]=null;
  const pc=nb[m[2]][m[3]];
  if(pc[1]==='p'&&(m[2]===0||m[2]===7))nb[m[2]][m[3]]=pc[0]+'q';
  return nb;
}
function nega(board,depth,a,b,color){
  const moves=legal(board,color);
  if(!moves.length)return inCheck(board,color)?-100000-depth:0;
  if(depth===0)return evaluate(board)*(color==='w'?1:-1);
  moves.sort((x,y)=>{const cx=board[x[2]][x[3]]?VAL[board[x[2]][x[3]][1]]:0;const cy=board[y[2]][y[3]]?VAL[board[y[2]][y[3]][1]]:0;return cy-cx;});
  let best=-Infinity;
  for(const m of moves){
    const nb=apply(board,m);
    const sc=-nega(nb,depth-1,-b,-a,color==='w'?'b':'w');
    if(sc>best)best=sc;
    if(best>a)a=best;
    if(a>=b)break;
  }
  return best;
}
function aiChoose(board,color,depth){
  const moves=legal(board,color);if(!moves.length)return null;
  let best=-Infinity,bestList=[];
  for(const m of moves){
    const nb=apply(board,m);
    const sc=-nega(nb,depth-1,-Infinity,Infinity,color==='w'?'b':'w');
    if(sc>best){best=sc;bestList=[m];}
    else if(sc===best)bestList.push(m);
  }
  return bestList[Math.floor(Math.random()*bestList.length)];
}

/* ═══ المستخدمون ═══ */
const getUsers=()=>JSON.parse(localStorage.getItem('chess_users')||'{}');
const saveUsers=u=>localStorage.setItem('chess_users',JSON.stringify(u));
let currentUser=null;

function getRank(r){
  if(r<1000)return{name:'مبتدئ',icon:'🌱'};
  if(r<1300)return{name:'لاعب مبتدئ',icon:'⚔️'};
  if(r<1600)return{name:'متوسط',icon:'🛡️'};
  if(r<1900)return{name:'متقدم',icon:'⚡'};
  if(r<2200)return{name:'خبير',icon:'🔥'};
  return{name:'أستاذ',icon:'👑'};
}

/* ═══ الحالة ═══ */
let board,selected,legalSel,turn,gameOver,gameMode,aiColor,aiDepth,aiLevelNum,myColorOnline,onlineChannel,lastMove,flipped,moveLog,captured;

function resetState(){
  board=startBoard();selected=null;legalSel=[];turn='w';gameOver=false;
  lastMove=null;moveLog=[];captured={w:[],b:[]};
}

/* ═══ DOM ═══ */
const $=id=>document.getElementById(id);
const boardEl=$('board'),gameBox=$('gameBox'),statusEl=$('status'),turnDot=$('turnDot'),turnLabel=$('turnLabel');

/* ═══ الرسم ═══ */
function renderBoard(){
  boardEl.innerHTML='';
  const check=inCheck(board,turn)?findKing(board,turn):null;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const dr=flipped?7-r:r, dc=flipped?7-c:c;
    const sq=document.createElement('div');
    sq.className='sq '+((dr+dc)%2===0?'light':'dark');
    if(selected&&selected[0]===dr&&selected[1]===dc)sq.classList.add('selected');
    if(legalSel.some(m=>m[0]===dr&&m[1]===dc)){
      sq.classList.add('hint');
      if(board[dr][dc])sq.classList.add('capture');
    }
    if(lastMove&&((lastMove[0]===dr&&lastMove[1]===dc)||(lastMove[2]===dr&&lastMove[3]===dc)))sq.classList.add('lastmove');
    if(check&&check[0]===dr&&check[1]===dc)sq.classList.add('check');
    const p=board[dr][dc];
    if(p){
      const sp=document.createElement('span');
      sp.className='piece '+(p[0]==='w'?'white':'black');
      sp.innerHTML=SVG[p[1]];
      sq.appendChild(sp);
    }
    sq.onclick=()=>onClick(dr,dc);
    boardEl.appendChild(sq);
  }
  turnDot.style.background=turn==='w'?'#fdfdfd':'#1c1c1c';
  turnLabel.textContent=turn==='w'?'دور الأبيض':'دور الأسود';
  renderCaptured();
  renderMoves();
}
function renderCaptured(){
  const toGlyph=arr=>arr.map(x=>SVG[x[1]].replace('<svg','<svg style="width:20px;height:20px;vertical-align:middle"')).join('');
  $('capWhite').innerHTML=captured.w.map(x=>`<span style="display:inline-block;width:20px;height:20px">${SVG[x[1]]}</span>`).join('');
  $('capBlack').innerHTML=captured.b.map(x=>`<span style="display:inline-block;width:20px;height:20px">${SVG[x[1]]}</span>`).join('');
}
function renderMoves(){
  const el=$('movesList');
  el.innerHTML=moveLog.map((m,i)=>{
    const num=Math.floor(i/2)+1;
    return i%2===0?`<span class="move-num">${num}.</span> ${m}`:`${m}`;
  }).join(' · ')||'<span style="color:#8797b0">—</span>';
  el.scrollTop=el.scrollHeight;
}

/* ═══ التفاعل ═══ */
function onClick(r,c){
  if(gameOver)return;
  if(gameMode==='ai'&&turn===aiColor)return;
  if(gameMode==='online'&&turn!==myColorOnline)return;
  const p=board[r][c];
  if(selected){
    const mv=legalSel.find(m=>m[0]===r&&m[1]===c);
    if(mv){doMove(selected[0],selected[1],r,c);return;}
  }
  if(p&&p[0]===turn){
    selected=[r,c];
    legalSel=legal(board,turn).filter(m=>m[0]===r&&m[1]===c).map(m=>[m[2],m[3]]);
  } else {selected=null;legalSel=[];}
  renderBoard();
}

function doMove(r,c,rr,cc,broadcast=true){
  const target=board[rr][cc];
  if(target)captured[target[0]].push(target);
  const pc=board[r][c];
  board[rr][cc]=pc;board[r][c]=null;
  if(pc[1]==='p'&&(rr===0||rr===7))board[rr][cc]=pc[0]+'q';

  const files='abcdefgh';
  const notation=pc[1]==='p'?`${target?'':''}${files[c]}${8-r}${target?'x':'-'}${files[cc]}${8-rr}`:
    `${pc[1].toUpperCase()}${target?'x':''}${files[cc]}${8-rr}`;
  moveLog.push(notation);

  lastMove=[r,c,rr,cc];selected=null;legalSel=[];
  turn=turn==='w'?'b':'w';
  renderBoard();

  if(broadcast&&gameMode==='online'&&onlineChannel)onlineChannel.postMessage({t:'mv',r,c,rr,cc});

  const done=checkEnd();
  if(!done&&gameMode==='ai'&&turn===aiColor){
    statusEl.textContent='🤖 الذكاء الاصطناعي يفكر...';
    setTimeout(aiPlay,320);
  } else if(!done) statusEl.textContent=turn==='w'?'دور الأبيض':'دور الأسود';
}

function aiPlay(){
  const moves=legal(board,aiColor);
  if(!moves.length){checkEnd();return;}
  const rand=aiDepth===1?.5:aiDepth===2?.15:aiDepth===3?.05:0;
  let mv;
  if(Math.random()<rand)mv=moves[Math.floor(Math.random()*moves.length)];
  else mv=aiChoose(board,aiColor,aiDepth);
  if(mv)doMove(mv[0],mv[1],mv[2],mv[3],false);
}

function checkEnd(){
  const moves=legal(board,turn);
  if(!moves.length){
    gameOver=true;
    if(inCheck(board,turn)){
      const winner=turn==='w'?'b':'w';
      showResult(winner,'checkmate');
    } else showResult('d','stalemate');
    return true;
  }
  if(inCheck(board,turn))statusEl.textContent='⚠️ كش!';
  return false;
}

/* ═══ النتيجة + Elo ═══ */
function showResult(winner,reason){
  const users=getUsers();const u=users[currentUser];
  u.rating=u.rating||1200;u.stats=u.stats||{w:0,l:0,d:0};
  const before=u.rating;

  let delta=0,humanWon,isDraw=winner==='d';
  if(gameMode==='ai'){
    const humanColor=aiColor==='w'?'b':'w';
    humanWon=winner===humanColor;
    if(isDraw){u.stats.d++;delta=3;}
    else if(humanWon){u.stats.w++;delta=10+aiLevelNum*6;}
    else{u.stats.l++;delta=-(4+aiLevelNum*3);}
  } else {
    humanWon=winner===myColorOnline;
    if(isDraw){u.stats.d++;delta=5;}
    else if(humanWon){u.stats.w++;delta=22;}
    else{u.stats.l++;delta=-18;}
  }
  u.rating=Math.max(400,u.rating+delta);
  saveUsers(users);
  renderProfile();renderLeaderboard();

  const emoji=isDraw?'🤝':(humanWon?'🏆':'💔');
  const title=isDraw?'تعادل':(humanWon?'فوز رائع!':'خسارة');
  const sub=reason==='checkmate'?'كش مات':(reason==='stalemate'?'ستاليميت — تعادل':(reason==='resign'?'استسلام':''));

  $('modalEmoji').textContent=emoji;
  $('modalTitle').textContent=title;
  $('modalSub').textContent=`${sub} — ${humanWon||isDraw?'أحسنت':'حاول مرة أخرى'}`;
  $('ratingBefore').textContent=before;
  $('ratingAfter').textContent=u.rating;
  $('ratingArrow').textContent=delta>=0?'→ +'+delta:'→ '+delta;
  $('ratingArrow').style.color=delta>=0?'#4ade80':'#f87171';
  $('resultModal').classList.remove('hidden');
}

/* ═══ بدء لعبة AI ═══ */
function newAIGame(){
  aiLevelNum=parseInt(document.querySelector('#aiLevelPills .pill.active').dataset.v);
  aiDepth=aiLevelNum;
  const humanColor=document.querySelector('#aiColorPills .pill.active').dataset.v;
  aiColor=humanColor==='w'?'b':'w';
  flipped=humanColor==='b';

  resetState();gameMode='ai';
  gameBox.classList.remove('hidden');
  document.querySelector('#view-playAI .board-slot').appendChild(gameBox);
  renderBoard();statusEl.textContent='دور الأبيض';
  $('topName').textContent='🤖 الذكاء الاصطناعي';
  $('topRate').textContent='مستوى '+aiLevelNum;
  $('bottomName').textContent='أنت';
  $('bottomRate').textContent=getUsers()[currentUser].rating;
  if(aiColor==='w')setTimeout(aiPlay,450);
}

/* ═══ أونلاين ═══ */
function createRoom(){
  const code=Math.random().toString(36).slice(2,7).toUpperCase();
  onlineChannel=new BroadcastChannel('chess-'+code);
  onlineChannel.onmessage=handleOnline;
  myColorOnline='w';flipped=false;
  resetState();gameMode='online';
  gameBox.classList.remove('hidden');
  document.querySelector('#view-playOnline .board-slot').appendChild(gameBox);
  renderBoard();
  statusEl.textContent='⏳ بانتظار الانضمام...';
  $('roomInfo').textContent='📋 كود الغرفة: '+code+' — شاركه مع صديقك';
  $('topName').textContent='الخصم';$('bottomName').textContent='أنت (أبيض)';
}
function joinRoom(){
  const code=$('joinCode').value.trim().toUpperCase();
  if(code.length!==5){$('roomInfo').textContent='❌ كود غير صالح';return;}
  onlineChannel=new BroadcastChannel('chess-'+code);
  onlineChannel.onmessage=handleOnline;
  myColorOnline='b';flipped=true;
  resetState();gameMode='online';
  gameBox.classList.remove('hidden');
  document.querySelector('#view-playOnline .board-slot').appendChild(gameBox);
  renderBoard();
  statusEl.textContent='⏳ جارٍ الاتصال...';
  onlineChannel.postMessage({t:'join'});
  $('roomInfo').textContent='✅ انضممت للغرفة: '+code;
  $('topName').textContent='أنت (أسود)';$('bottomName').textContent='الخصم';
}
function handleOnline(e){
  const m=e.data;
  if(m.t==='join'&&myColorOnline==='w'){
    onlineChannel.postMessage({t:'start',board,turn});
    statusEl.textContent='✅ بدأت اللعبة — أنت الأبيض';
  }
  if(m.t==='start'){
    board=m.board;turn=m.turn;renderBoard();
    statusEl.textContent='✅ بدأت اللعبة — أنت الأسود';
  }
  if(m.t==='mv')doMove(m.r,m.c,m.rr,m.cc,false);
}

/* ═══ الدروس ═══ */
const LESSONS=[
  {cat:'basics',level:'مبتدئ',title:'♟️ قطع الشطرنج وقيمتها',body:'البيدق=1، الحصان=3، الفيل=3، الرخ=5، الوزير=9، الملك=لا نهائي. استخدم هذه القيم لتقييم كل تبادل: هل هو مربح أم خاسر.',tip:'لا تضحّي بالوزير مقابل رخ + فيل إلا إذا رأيت ماتًا قريبًا.'},
  {cat:'basics',level:'مبتدئ',title:'♞ حركة كل قطعة',body:'البيدق: للأمام فقط (خطوتان من البداية)، يأكل مائلًا. الحصان: حرف L، يقفز. الفيل: أقطار. الرخ: صفوف وأعمدة. الوزير: كل الاتجاهات. الملك: خطوة واحدة.',tip:'الحصان وحده يقفز فوق القطع.'},
  {cat:'basics',level:'مبتدئ',title:'🎯 الهدف من اللعبة',body:'الفوز = كش مات على ملك الخصم. الكش = الملك مهدد ويمكنه الهرب. الستاليميت = لا حركة قانونية بدون كش = تعادل.',tip:'عندما تتقدم ماديًا، تجنّب الستاليميت.'},
  {cat:'basics',level:'مبتدئ',title:'🏰 التبييت (Castling)',body:'نقل الملك والرخ دفعة واحدة. الملك يتحرك مربعين نحو الرخ، والرخ يقفز فوقه. الشرط: لم يتحركا، لا قطع بينهما، الملك غير مكشوش ولا يمرّ على مربع مهدد.',tip:'بيّت خلال أول 10 نقلات دائمًا.'},
  {cat:'basics',level:'مبتدئ',title:'⬆️ ترقية البيدق',body:'عند وصول البيدق للصف الأخير، رقّيه لأي قطعة. غالبًا وزير. أحيانًا حصان لإعطاء كش.',tip:'احمِ بيادقك القريبة من الترقية.'},
  {cat:'basics',level:'متوسط',title:'👑 الأخذ بالتجاوز (En Passant)',body:'إذا تحرك بيدق الخصم خطوتين ومرّ بجانب بيدقك في الصف الخامس، يمكنك أكله فورًا كأنه تحرك خطوة واحدة. الفرصة لنقلة واحدة فقط.',tip:'تذكّرها عندما يدفع الخصم بيدقًا خطوتين.'},
  {cat:'openings',level:'متوسط',title:'🇮🇹 الافتتاحية الإيطالية',body:'1.e4 e5 2.Nf3 Nc6 3.Bc4 — الفيل يستهدف f7 (أضعف مربع قرب الملك). ثم d3 وc3 لبناء مركز قوي.',tip:'مثالية للمبتدئين لفهم مبادئ الافتتاح.'},
  {cat:'openings',level:'متقدم',title:'🇪🇸 الإسبانية (Ruy López)',body:'1.e4 e5 2.Nf3 Nc6 3.Bb5 — سلاح الأبطال. الفيل يضغط على الحصان. الفروع: المورفي، البيرلينية، المغلقة.',tip:'ضغط استراتيجي طويل المدى بدل هجوم مباشر.'},
  {cat:'openings',level:'متوسط',title:'🇫🇷 الدفاع الفرنسي',body:'1.e4 e6 — دفاع صلب. يعيق دفع e4-e5. عيبه: الفيل الملكي محبوس. الفروع: Winawer, Tarrasch.',tip:'الأسود يضرب على d4 و c5 لتقويض المركز.'},
  {cat:'openings',level:'متقدم',title:'🇸🇮 الصقلية (Sicilian)',body:'1.e4 c5 — أشهر رد على e4. غير متوازن. الفروع: Najdorf (الأقوى)، Dragon، Sveshnikov.',tip:'تحتاج حفظًا عميقًا — لا تجرّبها بدون تحضير.'},
  {cat:'openings',level:'متوسط',title:'♛ غامبيت الوزير',body:'1.d4 d5 2.c4 — الأبيض يضحي ببيدق مقابل مركز قوي. الفروع: Accepted، Declined، Slav.',tip:'لا تحتفظ بالبيدق الإضافي إذا كان سيُضعفك.'},
  {cat:'openings',level:'متوسط',title:'🇬🇧 نظام لندن',body:'1.d4 2.Nf3 3.Bf4 — نظام صلب وسهل. الأبيض يبني d4/e3/c3 ويخرج الفيل قبل e3.',tip:'مثالي إذا كنت تكره النظرية المعقدة.'},
  {cat:'openings',level:'متوسط',title:'⚠️ أخطاء الافتتاح الشائعة',body:'1) تحريك نفس القطعة مرتين. 2) إخراج الوزير مبكرًا. 3) تجاهل التطوير. 4) تحريك بيادق الأجنحة بلا سبب. 5) تبييت متأخر.',tip:'طوّر → بيّت → هاجم.'},
  {cat:'tactics',level:'مبتدئ',title:'📌 التثبيت (Pin)',body:'تثبيت قطعة الخصم لأن خلفها قطعة أهم. المطلق: خلفها الملك (لا تتحرك). النسبي: خلفها قطعة ثمينة. استغل القطعة المثبتة.',tip:'فيل b5 يثبّت حصان c6 ضد الملك e8.'},
  {cat:'tactics',level:'مبتدئ',title:'🍴 الشوكة (Fork)',body:'قطعة واحدة تهاجم قطعتين. الحصان سيد الشوكات. البيدق أيضًا يشوك.',tip:'اقلب وضع القطع في ذهنك وابحث عن مربعات الحصان.'},
  {cat:'tactics',level:'متوسط',title:'🔪 الشيشة (Skewer)',body:'عكس التثبيت: قطعة ثمينة في المقدمة، أقل قيمة في الخلف. تهاجم الأولى فيهرب فتأكل الثانية.',tip:'مفيدة في النهايات عندما يكون الملك خلف قطعة.'},
  {cat:'tactics',level:'متوسط',title:'💥 الهجوم المكتشف',body:'تحرك قطعة فتكشف عن هجوم قطعة أخرى خلفها. إذا كانت المكتشِفة تعطي كشًا، فالخصم مُجبر على الرد.',tip:'الهجوم المكتشف مع كش = أقوى تكتيك.'},
  {cat:'tactics',level:'متوسط',title:'🎭 التضحية (Sacrifice)',body:'التخلي عن مادة مقابل ميزة أكبر (هجوم، مركز، تفعيل). النوعية: رخ مقابل حصان/فيل.',tip:'احسب حتى النهاية قبل التضحية.'},
  {cat:'tactics',level:'متقدم',title:'🌀 مات الصف الأخير',body:'عندما يكون الملك محصورًا في الصف الأخير ببيادقه، رخ أو وزير يعطي مات على طول الصف.',tip:'تأكد من وجود "نافذة تنفس" لملكك.'},
  {cat:'tactics',level:'متقدم',title:'⚡ التعادل بالكش المستمر',body:'عندما تكون خاسرًا ماديًا، اجبر الخصم على تكرار الوضع 3 مرات للحصول على تعادل.',tip:'لو كنت خاسرًا، ابحث عن سلسلة كش لا تنتهي.'},
  {cat:'tactics',level:'متوسط',title:'🧲 الجذب والصد',body:'تكتيك جذب قطعة دفاعية بعيدًا ثم مهاجمة هدف محمي. مثال: تضحي بالوزير لسحب الملك ثم مات بالحصان.',tip:'ابحث عن قطع الخصم المدافعة — كيف تُبعدها؟'},
  {cat:'strategy',level:'متوسط',title:'🎯 السيطرة على المركز',body:'المركز = d4/e4/d5/e5. من يسيطر عليه يتحرك بحرية ويهجم أسرع. السيطرة بالبيادق أو القطع.',tip:'افتح ببيدق مركزي (e4 أو d4) ودعمه.'},
  {cat:'strategy',level:'متوسط',title:'🏗️ بنية البيادق',body:'البيادق لا تعود. المتضاعفة = ضعف. المعزولة = ضعف. الحرة (Passed) = قوة. سلسلة البيادق = درع.',tip:'تجنّب التضاعف بدون تعويض من نشاط القطع.'},
  {cat:'strategy',level:'متقدم',title:'🛤️ الأعمدة المفتوحة',body:'الرخ يحتاج أعمدة مفتوحة للوصول لعمق موقف الخصم. ضاعف الرخاخ على عمود مفتوح لضغط قاتل.',tip:'رخ على عمود مفتوح = 1.5 بيدق مادي.'},
  {cat:'strategy',level:'متقدم',title:'🐴 الحصان الجيد ضد الفيل السيئ',body:'الحصان يحتاج مربعات دعم لا يمكن مهاجمتها ببيادق. ضعه على مربع أمامي محمي. الفيل السيئ = المحصور ببيادقه.',tip:'إذا كان لديك فيل سيئ، فكّر في تبادله.'},
  {cat:'strategy',level:'متقدم',title:'📐 المربعات الضعيفة',body:'المربع الضعيف = مربع لا يمكن حمايته ببيدق. ضع قطعة فيه (حصان مثالي). ابحث عن المربعات الضعيفة في معسكر الخصم.',tip:'المربع d5 في الفرنسي مثال كلاسيكي.'},
  {cat:'strategy',level:'مبتدئ',title:'🧘 قاعدة "حسّن أسوأ قطعة"',body:'في المواقف الهادئة، حسّن أسوأ قطعة لديك. لا تشن هجومًا بدون تفوق. عندما لا ترى تكتيكًا، حسّن موقعك.',tip:'اسأل نفسك: ما أسوأ قطعة عندي؟ حسّنها.'},
  {cat:'endgame',level:'متوسط',title:'👑 الملك في النهاية',body:'في النهاية، الملك يتحول لقطعة هجومية. فعّله! في نهايات البيادق، الملك النشط يفوز غالبًا.',tip:'بعد تبادل الوزراء، أخرج ملكك للمركز.'},
  {cat:'endgame',level:'متقدم',title:'⚖️ التقابل (Opposition)',body:'عندما يقف الملكان على نفس العمود/الصف مع مربع بينهما، صاحب الدور خاسر. قاعدة حاسمة في نهايات الملك والبيدق.',tip:'اجبر الخصم على الخسارة بالتقابل ثم ادفع البيدق.'},
  {cat:'endgame',level:'متوسط',title:'🏁 الملك + بيدق ضد الملك',body:'إذا وصل ملكك أمام بيدقك بمربع مقابل ملك الخصم، فأنت تفوز. إن لم تفعل، تعادل.',tip:'ادفع الملك أولًا ثم البيدق.'},
  {cat:'endgame',level:'متقدم',title:'🏰 نهاية الرخ',body:'أصعب أنواع النهايات. الرخ النشط يفوز. القاعدة: ضع رخك خلف البيدق الحر (لك أو ضدك).',tip:'الرخ الخلفي يدعم تقدم بيدقك بلا حصار.'},
  {cat:'endgame',level:'متقدم',title:'💎 نهاية الوزراء',body:'الوزير وحده لا يعطي مات بدون مساعدة الملك. اجعل الملك قريبًا ثم استخدم الوزير لإجبار الملك على الحافة.',tip:'احذر الكش المستمر من وزير الخصم.'},
  {cat:'endgame',level:'مبتدئ',title:'📏 قاعدة المربع',body:'عندما يجري بيدق نحو الترقية والملك يطارده: ارسم مربعًا ذهنيًا. إذا كان الملك داخل المربع يلحق، وإلا لا.',tip:'احسب المربع من البيدق لصف الترقية.'},
  {cat:'psych',level:'متوسط',title:'🧠 التحكم في العواطف',body:'الشطرنج صراع نفسي. لا تلعب وأنت غاضب أو متعب. خسارة قطعة ليست نهاية اللعبة — استمر بالضغط.',tip:'الهدوء يفوز أكثر من العبقرية.'},
  {cat:'psych',level:'متقدم',title:'⏱️ إدارة الوقت',body:'وزّع الوقت: 20% للافتتاح، 50% للوسط، 30% للنهاية. لا تُفرط في التفكير بنقلة واضحة.',tip:'إذا كانت النقلة بديهية، لا تصرف أكثر من 30 ثانية.'},
  {cat:'psych',level:'متقدم',title:'🎭 خداع الخصم',body:'لا تلعب دائمًا أفضل نقلة — العب الأصعب على الخصم. اضبط إيقاعك حسب مستوى الخصم.',tip:'ضد هجومي، العب هادئًا. ضد دفاعي، اضغط.'},
  {cat:'psych',level:'متوسط',title:'📖 التعلم من الأخطاء',body:'بعد كل مباراة، راجعها وحلل الأخطاء. احتفظ بدفتر أخطاء متكررة. التطور من التحليل لا اللعب فقط.',tip:'3 مباريات + تحليل > 10 مباريات بدون تحليل.'}
];

const CATS={all:{name:'الكل',icon:'📚'},basics:{name:'الأساسيات',icon:'♟️'},openings:{name:'الافتتاحيات',icon:'🚪'},tactics:{name:'التكتيكات',icon:'⚡'},strategy:{name:'الاستراتيجية',icon:'🎯'},endgame:{name:'النهايات',icon:'🏁'},psych:{name:'سيكولوجيا',icon:'🧠'}};
let activeCat='all';

function getRead(){const u=getUsers()[currentUser];return(u&&u.readLessons)||[];}
function markRead(i){
  const users=getUsers();const u=users[currentUser];
  u.readLessons=u.readLessons||[];
  if(!u.readLessons.includes(i)){u.readLessons.push(i);saveUsers(users);renderLessons(activeCat);renderProgress();}
}
function renderProgress(){
  const total=LESSONS.length,done=getRead().length;
  const pct=Math.round(done/total*100);
  $('progressPct').textContent=pct+'%';
  const ring=$('progressRing');
  const dash=157;
  ring.style.strokeDashoffset=dash-(dash*pct/100);
}
function renderCatFilter(){
  const el=$('catFilter');el.innerHTML='';
  Object.entries(CATS).forEach(([k,v])=>{
    const b=document.createElement('button');
    b.className='cat-btn'+(activeCat===k?' active':'');
    b.textContent=v.icon+' '+v.name;
    b.onclick=()=>{activeCat=k;renderLessons(k);};
    el.appendChild(b);
  });
}
function renderLessons(cat){
  activeCat=cat;renderCatFilter();
  const el=$('lessonsList');el.innerHTML='';
  const read=getRead();
  LESSONS.map((l,i)=>({...l,i})).filter(l=>cat==='all'||l.cat===cat).forEach(l=>{
    const c=document.createElement('div');
    c.className='lesson-card'+(read.includes(l.i)?' read':'');
    c.innerHTML=`<div class="lesson-head"><h4>${l.title}</h4><span class="level-badge ${l.level}">${l.level}</span></div><p>${l.body}</p><div class="lesson-tip">💡 ${l.tip}</div>`;
    c.onclick=()=>markRead(l.i);
    el.appendChild(c);
  });
  renderProgress();
}

/* ═══ الأصدقاء ═══ */
function renderFriends(){
  const el=$('friendsList');
  const u=getUsers()[currentUser];
  const friends=(u&&u.friends)||[];
  el.innerHTML='';
  if(!friends.length){el.innerHTML='<p class="empty-msg">لا يوجد أصدقاء بعد — أضف صديقًا باسم المستخدم</p>';return;}
  friends.forEach(n=>{
    const c=document.createElement('div');
    c.className='friend-card';
    c.innerHTML=`<span>👤 ${n}</span><button onclick="challengeFriend('${n}')">تحدّي</button>`;
    el.appendChild(c);
  });
}
function addFriend(){
  const name=$('friendName').value.trim();
  if(!name||name===currentUser)return;
  const users=getUsers();
  if(!users[name]){alert('لا يوجد مستخدم بهذا الاسم');return;}
  const u=users[currentUser];u.friends=u.friends||[];
  if(!u.friends.includes(name))u.friends.push(name);
  saveUsers(users);$('friendName').value='';renderFriends();
}
function challengeFriend(name){
  alert('لتحدّي '+name+'، أنشئ غرفة وأرسل له الكود.');
  showView('playOnline');createRoom();
}

/* ═══ الحساب ═══ */
function renderProfile(){
  const users=getUsers();const u=users[currentUser];
  if(!u)return;
  u.rating=u.rating||1200;u.stats=u.stats||{w:0,l:0,d:0};
  $('profileName').textContent=currentUser;
  $('statW').textContent=u.stats.w;$('statL').textContent=u.stats.l;$('statD').textContent=u.stats.d;
  $('ratingNum').textContent=u.rating;
  const r=getRank(u.rating);
  $('rankName').textContent=r.name;$('rankIcon').textContent=r.icon;
  $('sideRating').textContent=u.rating;
}
function renderLeaderboard(){
  const el=$('leaderboard');
  const users=getUsers();
  const list=Object.entries(users).map(([n,u])=>({n,r:u.rating||1200})).sort((a,b)=>b.r-a.r);
  el.innerHTML='';
  list.forEach((u,i)=>{
    const row=document.createElement('div');
    row.className='lb-row'+(u.n===currentUser?' me':'');
    const cls=i===0?'gold':i===1?'silver':i===2?'bronze':'';
    const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1);
    row.innerHTML=`<div class="lb-rank ${cls}">${medal}</div><div class="lb-name">${u.n}${u.n===currentUser?' (أنت)':''}</div><div class="lb-rating">${u.r}</div>`;
    el.appendChild(row);
  });
}

/* ═══ التنقل ═══ */
function showView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
  const v=$('view-'+name);
  const btn=document.querySelector(`.nav-item[data-view="${name}"]`);
  if(v)v.classList.add('active');
  if(btn)btn.classList.add('active');
  if(name==='playAI'||name==='playOnline'){
    const slot=v.querySelector('.board-slot');
    if(slot&&gameBox.parentElement!==slot)slot.appendChild(gameBox);
    gameBox.classList.remove('hidden');
  }
  if(name==='leaderboard')renderLeaderboard();
  if(name==='lessons')renderLessons(activeCat);
}

/* ═══ الأحداث ═══ */
document.querySelectorAll('.auth-tab').forEach(t=>{
  t.onclick=()=>{
    document.querySelectorAll('.auth-tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const isLogin=t.dataset.tab==='login';
    $('loginForm').classList.toggle('hidden',!isLogin);
    $('registerForm').classList.toggle('hidden',isLogin);
    $('authMsg').textContent='';
  };
});
$('loginForm').onsubmit=e=>{
  e.preventDefault();
  const n=$('loginUser').value.trim(),p=$('loginPass').value;
  const users=getUsers();
  if(!users[n]||users[n].pass!==p){$('authMsg').textContent='❌ بيانات غير صحيحة';return;}
  currentUser=n;localStorage.setItem('chess_current',n);enterApp();
};
$('registerForm').onsubmit=e=>{
  e.preventDefault();
  const n=$('regUser').value.trim(),p=$('regPass').value;
  if(n.length<3){$('authMsg').textContent='❌ الاسم قصير جدًا';return;}
  if(p.length<4){$('authMsg').textContent='❌ كلمة المرور قصيرة';return;}
  const users=getUsers();
  if(users[n]){$('authMsg').textContent='❌ الاسم مستخدم';return;}
  users[n]={pass:p,rating:1200,stats:{w:0,l:0,d:0},friends:[],readLessons:[]};
  saveUsers(users);currentUser=n;localStorage.setItem('chess_current',n);enterApp();
};
$('logoutBtn').onclick=()=>{localStorage.removeItem('chess_current');location.reload();};

document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>showView(b.dataset.view));

// Pills
document.querySelectorAll('#aiLevelPills .pill').forEach(p=>p.onclick=()=>{
  document.querySelectorAll('#aiLevelPills .pill').forEach(x=>x.classList.remove('active'));
  p.classList.add('active');
});
document.querySelectorAll('#aiColorPills .pill').forEach(p=>p.onclick=()=>{
  document.querySelectorAll('#aiColorPills .pill').forEach(x=>x.classList.remove('active'));
  p.classList.add('active');
});

$('newAIGame').onclick=newAIGame;
$('createRoom').onclick=createRoom;
$('joinRoom').onclick=joinRoom;
$('addFriend').onclick=addFriend;
$('resignBtn').onclick=()=>{
  if(gameOver)return;
  gameOver=true;
  const winner=turn==='w'?'b':'w';
  showResult(winner,'resign');
};
$('flipBtn').onclick=()=>{flipped=!flipped;renderBoard();};
$('resetStats').onclick=()=>{
  if(!confirm('تصفير كل الإحصائيات والتقييم؟'))return;
  const users=getUsers();
  users[currentUser].stats={w:0,l:0,d:0};
  users[currentUser].rating=1200;
  saveUsers(users);renderProfile();renderLeaderboard();
};
$('modalRematch').onclick=()=>{
  $('resultModal').classList.add('hidden');
  if(gameMode==='ai')newAIGame();
  else if(gameMode==='online')createRoom();
و $('modalClose').onclick=()=>$('resultModal').classList.add('hidden');

/* ═══ التشغيل ═══ */
function enterApp(){
  $('authScreen').classList.add('hidden');
  $('app').classList.remove('hidden');
  $('sideUser').textContent=currentUser;
  const u=getUsers()[currentUser];
  $('sideRating').textContent=u.rating||1200;
  $('userAvatar').textContent=getRank(u.rating||1200).icon;
  renderProfile();renderFriends();renderLessons('all');renderLeaderboard();
}
(function(){
  const n=localStorage.getItem('chess_current');
  if(n&&getUsers()[n]){currentUser=n;enterApp();}
})();
