/* ═══════════════════════════════════════════════════════════
   شطرنج برو V5 — نظام كامل
   ═══════════════════════════════════════════════════════════ */

/* ═══════════ قطع SVG بدون صلبان ═══════════ */
const SVG = {
  p:`<svg viewBox="0 0 45 45"><circle cx="22.5" cy="13" r="6.5"/><path d="M22.5 19.5c-5 0-9 6.5-9 14.5h18c0-8-4-14.5-9-14.5z"/><rect x="10" y="34" width="25" height="4.5" rx="2.2"/></svg>`,
  r:`<svg viewBox="0 0 45 45"><path d="M11 9h5v5h4V9h5v5h4V9h5v10l-3 3v11l3 3v3H11v-3l3-3V22l-3-3z"/></svg>`,
  n:`<svg viewBox="0 0 45 45"><path d="M24 9c-1.5 0-2.6.6-3.5 1.5-2-1-4.2-.8-6.3.5l-5.2 3.2c-2 1.2-3 3.2-2.6 5.5l.6 3.6c.2 1.2 1.6 1.7 2.6 1l3.3-2.3c.8 2.4.8 5-.2 7.5l-2 5h22l-1.5-7c-.8-3.9-2.6-7-5.2-9.3-1.6-1.4-2.6-3.3-2.6-5.4 0-1.6 1-2.9 2.3-3.6-.4-.1-.8-.2-1.7-.2z"/></svg>`,
  b:`<svg viewBox="0 0 45 45"><circle cx="22.5" cy="8" r="3.3"/><path d="M22.5 12.5c-4.5 4.5-8.5 9.5-8.5 15 0 3.5 2.2 5.5 5 5.5h7c2.8 0 5-2 5-5.5 0-5.5-4-10.5-8.5-15z"/><rect x="15" y="33.5" width="15" height="3" rx="1"/><rect x="12" y="36.5" width="21" height="4.5" rx="2"/></svg>`,
  q:`<svg viewBox="0 0 45 45"><circle cx="9" cy="12" r="2.6"/><circle cx="16.5" cy="8.5" r="2.6"/><circle cx="22.5" cy="7" r="2.8"/><circle cx="28.5" cy="8.5" r="2.6"/><circle cx="36" cy="12" r="2.6"/><path d="M9 14l4.5 16h18l4.5-16-6 7-5-11-5 11-5-11-5 11z"/><rect x="14" y="31" width="17" height="3" rx="1"/><rect x="12" y="34" width="21" height="4.5" rx="2"/></svg>`,
  k:`<svg viewBox="0 0 45 45"><circle cx="22.5" cy="6.5" r="3.3"/><path d="M11 13l2.5 15h18L34 13l-5.5 9L24 10l-4.5 12L14 13z"/><rect x="14" y="29" width="17" height="3" rx="1"/><rect x="12" y="32" width="21" height="4.5" rx="2"/><rect x="10" y="36.5" width="25" height="4.5" rx="2"/></svg>`
};

/* ═══════════ محرك الشطرنج ═══════════ */
const VAL={p:100,n:320,b:330,r:500,q:900,k:20000};
const DIRS={r:[[1,0],[-1,0],[0,1],[0,-1]],b:[[1,1],[1,-1],[-1,1],[-1,-1]],n:[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]};
DIRS.q=DIRS.r.concat(DIRS.b);DIRS.k=DIRS.r;

function startBoard(){
  const back=['r','n','b','q','k','b','n','r'];
  const b=Array.from({length:8},()=>Array(8).fill(null));
  for(let c=0;c<8;c++){b[0][c]='b'+back[c];b[1][c]='bp';b[6][c]='wp';b[7][c]='w'+back[c];}
  return b;
}
const clone=b=>b.map(r=>r.slice());

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

/* ═══════════ الذكاء الاصطناعي ═══════════ */
function evaluate(board){
  let s=0;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=board[r][c];if(!p)continue;
    const v=VAL[p[1]];
    const center=(3.5-Math.abs(3.5-r))+(3.5-Math.abs(3.5-c));
    s+=p[0]==='w'?(v+center*2):-(v+center*2);
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

/* ═══════════ التخزين ═══════════ */
const USERS_KEY='chess_users_v2';
const SESSION_KEY='chess_session_v2';
const Store={
  getUsers(){try{return JSON.parse(localStorage.getItem(USERS_KEY)||'{}');}catch(e){return{};}},
  saveUsers(u){try{localStorage.setItem(USERS_KEY,JSON.stringify(u));return true;}catch(e){return false;}},
  setSession(name,remember){
    localStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(SESSION_KEY);
    (remember?localStorage:sessionStorage).setItem(SESSION_KEY,name);
  },
  getSession(){return localStorage.getItem(SESSION_KEY)||sessionStorage.getItem(SESSION_KEY);},
  clearSession(){localStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(SESSION_KEY);}
};

let currentUser=null;
function getUsers(){return Store.getUsers();}
function saveUsers(u){return Store.saveUsers(u);}

function getRank(r){
  if(r<1000)return{name:'مبتدئ',icon:'🌱'};
  if(r<1300)return{name:'لاعب مبتدئ',icon:'⚔️'};
  if(r<1600)return{name:'متوسط',icon:'🛡️'};
  if(r<1900)return{name:'متقدم',icon:'⚡'};
  if(r<2200)return{name:'خبير',icon:'🔥'};
  return{name:'أستاذ',icon:'👑'};
}

/* ═══════════ AUTH SYSTEM ═══════════ */
function isValidEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}
function isValidUsername(u){return /^[a-zA-Z0-9_\u0600-\u06FF]{3,20}$/.test(u);}

function showMsg(text,type='error'){
  const el=document.getElementById('authMsg');
  el.textContent=text;
  el.className='auth-msg show '+type;
}
function hideMsg(){
  const el=document.getElementById('authMsg');
  el.className='auth-msg';
  el.textContent='';
}

document.querySelectorAll('.eye-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const target=document.getElementById(btn.dataset.target);
    if(!target)return;
    const isPass=target.type==='password';
    target.type=isPass?'text':'password';
    btn.textContent=isPass?'🙈':'👁';
  });
});

function calcStrength(pass){
  let s=0;
  if(pass.length>=8)s++;
  if(/[A-Z]/.test(pass))s++;
  if(/[0-9]/.test(pass))s++;
  if(/[^A-Za-z0-9]/.test(pass)||pass.length>=12)s++;
  return s;
}
function updateStrengthUI(pass){
  const segs=document.querySelectorAll('.strength-seg');
  const text=document.getElementById('strengthText');
  const score=calcStrength(pass);
  segs.forEach(s=>s.classList.remove('weak','medium','strong'));
  if(!pass){text.textContent='قوة كلمة المرور';text.style.color='var(--muted)';return;}
  let cls,label,color;
  if(score<=1){cls='weak';label='ضعيفة';color='#f87171';}
  else if(score===2){cls='medium';label='متوسطة';color='#fbbf24';}
  else if(score===3){cls='medium';label='جيدة';color='#60a5fa';}
  else{cls='strong';label='قوية جدًا';color='#4ade80';}
  for(let i=0;i<score&&i<4;i++)segs[i].classList.add(cls);
  text.textContent='قوة كلمة المرور: '+label;
  text.style.color=color;
}
function updateRequirements(){
  const pass=document.getElementById('regPass').value;
  const pass2=document.getElementById('regPass2').value;
  const checks={
    'req-len':pass.length>=8,
    'req-num':/[0-9]/.test(pass),
    'req-upper':/[A-Z]/.test(pass),
    'req-match':pass.length>0&&pass===pass2
  };
  Object.entries(checks).forEach(([id,ok])=>{
    const el=document.getElementById(id);
    if(el)el.classList.toggle('ok',ok);
  });
}
document.getElementById('regPass')?.addEventListener('input',e=>{updateStrengthUI(e.target.value);updateRequirements();});
document.getElementById('regPass2')?.addEventListener('input',updateRequirements);

function setAuthMode(mode){
  const isLogin=mode==='login';
  document.querySelectorAll('.auth-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===mode));
  document.getElementById('loginForm').classList.toggle('hidden',!isLogin);
  document.getElementById('registerForm').classList.toggle('hidden',isLogin);
  document.getElementById('authTitle').textContent=isLogin?'أهلًا بعودتك 👋':'انضم إلينا 🚀';
  document.getElementById('authSub').textContent=isLogin?'سجّل دخولك لمتابعة تقدّمك في الشطرنج':'أنشئ حسابك المجاني وابدأ رحلتك';
  document.getElementById('switchText').textContent=isLogin?'ليس لديك حساب؟':'لديك حساب بالفعل؟';
  document.getElementById('switchLink').textContent=isLogin?'أنشئ حسابًا':'سجّل الدخول';
  hideMsg();
}
document.querySelectorAll('.auth-tab').forEach(t=>t.addEventListener('click',()=>setAuthMode(t.dataset.tab)));
document.getElementById('switchLink').addEventListener('click',e=>{
  e.preventDefault();
  const isLoginVisible=!document.getElementById('loginForm').classList.contains('hidden');
  setAuthMode(isLoginVisible?'register':'login');
});

document.getElementById('forgotLink').addEventListener('click',e=>{
  e.preventDefault();
  const user=prompt('أدخل اسم المستخدم أو البريد:');
  if(!user)return;
  const users=Store.getUsers();
  const found=Object.keys(users).find(k=>k===user||users[k].email===user);
  if(!found){showMsg('❌ لا يوجد حساب بهذا الاسم');return;}
  const np=prompt('كلمة المرور الجديدة (8 أحرف + رقم + حرف كبير):');
  if(!np)return;
  if(np.length<8||!/[0-9]/.test(np)||!/[A-Z]/.test(np)){showMsg('❌ كلمة المرور ضعيفة');return;}
  users[found].pass=np;
  Store.saveUsers(users);
  showMsg('✅ تم تحديث كلمة المرور','success');
});

document.getElementById('loginForm').addEventListener('submit',e=>{
  e.preventDefault();hideMsg();
  const user=document.getElementById('loginUser').value.trim();
  const pass=document.getElementById('loginPass').value;
  const remember=document.getElementById('rememberMe').checked;
  if(!user||!pass){showMsg('❌ املأ جميع الحقول');return;}
  const users=Store.getUsers();
  const found=Object.keys(users).find(k=>k===user||(users[k].email&&users[k].email===user));
  if(!found){showMsg('❌ لا يوجد حساب بهذا الاسم/البريد');return;}
  if(users[found].pass!==pass){showMsg('❌ كلمة المرور غير صحيحة');return;}
  showMsg('✅ جارٍ الدخول...','success');
  currentUser=found;
  Store.setSession(found,remember);
  setTimeout(()=>enterApp(),400);
});

document.getElementById('registerForm').addEventListener('submit',e=>{
  e.preventDefault();hideMsg();
  const email=document.getElementById('regEmail').value.trim();
  const user=document.getElementById('regUser').value.trim();
  const pass=document.getElementById('regPass').value;
  const pass2=document.getElementById('regPass2').value;
  const terms=document.getElementById('termsCheck').checked;
  if(!isValidEmail(email)){showMsg('❌ البريد غير صالح');return;}
  if(!isValidUsername(user)){showMsg('❌ اسم المستخدم: 3-20 حرفًا');return;}
  if(pass.length<8){showMsg('❌ كلمة المرور قصيرة');return;}
  if(!/[0-9]/.test(pass)){showMsg('❌ يجب أن تحتوي على رقم');return;}
  if(!/[A-Z]/.test(pass)){showMsg('❌ يجب أن تحتوي على حرف كبير');return;}
  if(pass!==pass2){showMsg('❌ الكلمتان غير متطابقتين');return;}
  if(!terms){showMsg('❌ يجب الموافقة على الشروط');return;}
  const users=Store.getUsers();
  if(users[user]){showMsg('❌ اسم المستخدم محجوز');return;}
  if(Object.values(users).some(u=>u.email===email)){showMsg('❌ البريد مستخدم');return;}
  users[user]={pass,email,rating:1200,stats:{w:0,l:0,d:0},friends:[],readLessons:[],createdAt:Date.now()};
  if(!Store.saveUsers(users)){showMsg('❌ خطأ في التخزين');return;}
  showMsg('🎉 تم إنشاء حسابك!','success');
  currentUser=user;
  Store.setSession(user,true);
  setTimeout(()=>enterApp(),600);
});

function socialLogin(provider){
  const names={google:'مستخدم جوجل',github:'مطور جيتهاب',discord:'عضو ديسكورد'};
  const fakeName=`${provider}_${Math.floor(Math.random()*9000+1000)}`;
  const users=Store.getUsers();
  if(!users[fakeName]){
    users[fakeName]={pass:'social_'+Date.now(),email:`${fakeName}@${provider}.com`,rating:1200,stats:{w:0,l:0,d:0},friends:[],readLessons:[],social:provider,createdAt:Date.now()};
    Store.saveUsers(users);
  }
  showMsg(`✅ تم الدخول عبر ${names[provider]}`,'success');
  currentUser=fakeName;
  Store.setSession(fakeName,true);
  setTimeout(()=>enterApp(),500);
}

/* ═══════════ GAME STATE ═══════════ */
let board,selected,legalSel,turn,gameOver,gameMode,aiColor,aiDepth,aiLevelNum,myColorOnline,onlineChannel,lastMove,flipped,moveLog,captured;

function resetState(){
  board=startBoard();selected=null;legalSel=[];turn='w';gameOver=false;
  lastMove=null;moveLog=[];captured={w:[],b:[]};flipped=false;
}

const $=id=>document.getElementById(id);
const boardEl=$('board'),gameBox=$('gameBox'),statusEl=$('status'),turnDot=$('turnDot'),turnLabel=$('turnLabel');

function renderBoard(){
  boardEl.innerHTML='';
  const check=inCheck(board,turn)?findKing(board,turn):null;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const dr=flipped?7-r:r,dc=flipped?7-c:c;
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
  const render=arr=>arr.map(x=>SVG[x[1]]).join('');
  $('capWhite').innerHTML=captured.w.length?render(captured.w):'<span style="color:#8797b0">—</span>';
  $('capBlack').innerHTML=captured.b.length?render(captured.b):'<span style="color:#8797b0">—</span>';
}
function renderMoves(){
  const el=$('movesList');
  if(!moveLog.length){el.innerHTML='<span style="color:#8797b0">—</span>';return;}
  el.innerHTML=moveLog.map((m,i)=>{
    const num=Math.floor(i/2)+1;
    return i%2===0?`<span class="move-num">${num}.</span> ${m}`:`${m}`;
  }).join(' · ');
  el.scrollTop=el.scrollHeight;
}

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
  const notation=pc[1]==='p'?`${files[c]}${8-r}${target?'x':'-'}${files[cc]}${8-rr}`:`${pc[1].toUpperCase()}${target?'x':''}${files[cc]}${8-rr}`;
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

function showResult(winner,reason){
  const users=getUsers();const u=users[currentUser];
  if(!u)return;
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
  const sub=reason==='checkmate'?'كش مات':(reason==='stalemate'?'ستاليميت':(reason==='resign'?'استسلام':''));
  $('modalEmoji').textContent=emoji;
  $('modalTitle').textContent=title;
  $('modalSub').textContent=sub;
  $('ratingBefore').textContent=before;
  $('ratingAfter').textContent=u.rating;
  $('ratingArrow').textContent=delta>=0?'→ +'+delta:'→ '+delta;
  $('ratingArrow').style.color=delta>=0?'#4ade80':'#f87171';
  $('resultModal').classList.remove('hidden');
}

function newAIGame(){
  aiLevelNum=parseInt(document.querySelector('#aiLevelPills .pill.active').dataset.v);
  aiDepth=aiLevelNum;
  const humanColor=document.querySelector('#aiColorPills .pill.active').dataset.v;
  aiColor=humanColor==='w'?'b':'w';
  resetState();
  flipped=humanColor==='b';
  gameMode='ai';
  gameBox.classList.remove('hidden');
  document.querySelector('#view-playAI .board-slot').appendChild(gameBox);
  renderBoard();statusEl.textContent='دور الأبيض';
  $('topName').textContent='🤖 الذكاء الاصطناعي';
  $('topRate').textContent='مستوى '+aiLevelNum;
  $('bottomName').textContent='أنت';
  $('bottomRate').textContent=getUsers()[currentUser].rating;
  if(aiColor==='w')setTimeout(aiPlay,450);
}

function createRoom(){
  const code=Math.random().toString(36).slice(2,7).toUpperCase();
  onlineChannel=new BroadcastChannel('chess-'+code);
  onlineChannel.onmessage=handleOnline;
  myColorOnline='w';
  resetState();
  gameMode='online';
  gameBox.classList.remove('hidden');
  document.querySelector('#view-playOnline .board-slot').appendChild(gameBox);
  renderBoard();
  statusEl.textContent='⏳ بانتظار الانضمام...';
  $('roomInfo').textContent='📋 كود الغرفة: '+code;
  $('topName').textContent='الخصم';$('bottomName').textContent='أنت (أبيض)';
}
function joinRoom(){
  const code=$('joinCode').value.trim().toUpperCase();
  if(code.length!==5){$('roomInfo').textContent='❌ كود غير صالح';return;}
  onlineChannel=new BroadcastChannel('chess-'+code);
  onlineChannel.onmessage=handleOnline;
  myColorOnline='b';
  resetState();
  flipped=true;
  gameMode='online';
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
  if(m.t==='mv')doMove(m.r,m.c,m.rr,m.mr||m.rr,m.cc,false);
}

/* ═══════════ الدروس ═══════════ */
const LESSONS=[
  {cat:'basics',level:'مبتدئ',title:'♟️ قطع الشطرنج وقيمتها',body:'البيدق=1، الحصان=3، الفيل=3، الرخ=5، الوزير=9. استخدم هذه القيم لتقييم كل تبادل.',tip:'لا تضحّ بالوزير مقابل رخ + فيل إلا لمات قريب.'},
  {cat:'basics',level:'مبتدئ',title:'♞ حركة كل قطعة',body:'البيدق: للأمام فقط، يأكل مائلًا. الحصان: حرف L، يقفز. الفيل: أقطار. الرخ: صفوف وأعمدة. الوزير: كل الاتجاهات. الملك: خطوة واحدة.',tip:'الحصان وحده يقفز فوق القطع.'},
  {cat:'basics',level:'مبتدئ',title:'🎯 الهدف من اللعبة',body:'الفوز = كش مات على ملك الخصم. الستاليميت = لا حركة قانونية بدون كش = تعادل.',tip:'عندما تتقدم ماديًا، تجنّب الستاليميت.'},
  {cat:'basics',level:'مبتدئ',title:'🏰 التبييت (Castling)',body:'نقل الملك والرخ دفعة واحدة. شرطه: لم يتحركا، لا قطع بينهما، الملك غير مكشوش.',tip:'بيّت خلال أول 10 نقلات دائمًا.'},
  {cat:'basics',level:'مبتدئ',title:'⬆️ ترقية البيدق',body:'عند وصول البيدق للصف الأخير، رقّيه لأي قطعة. غالبًا وزير.',tip:'احمِ بيادقك القريبة من الترقية.'},
  {cat:'basics',level:'متوسط',title:'👑 الأخذ بالتجاوز',body:'إذا تحرك بيدق الخصم خطوتين ومرّ بجانب بيدقك في الصف الخامس، يمكنك أكله فورًا.',tip:'الفرصة لنقلة واحدة فقط.'},
  {cat:'openings',level:'متوسط',title:'🇮🇹 الافتتاحية الإيطالية',body:'1.e4 e5 2.Nf3 Nc6 3.Bc4 — الفيل يستهدف f7 الأضعف. ثم d3 وc3.',tip:'مثالية للمبتدئين.'},
  {cat:'openings',level:'متقدم',title:'🇪🇸 الإسبانية',body:'1.e4 e5 2.Nf3 Nc6 3.Bb5 — سلاح الأبطال. الفيل يضغط على الحصان.',tip:'ضغط استراتيجي طويل المدى.'},
  {cat:'openings',level:'متوسط',title:'🇫🇷 الدفاع الفرنسي',body:'1.e4 e6 — دفاع صلب. يعيق دفع e4-e5. عيبه: الفيل الملكي محبوس.',tip:'الأسود يضرب على d4 و c5.'},
  {cat:'openings',level:'متقدم',title:'🇸🇮 الصقلية',body:'1.e4 c5 — أشهر رد على e4. غير متوازن. الفروع: Najdorf, Dragon.',tip:'تحتاج حفظًا عميقًا.'},
  {cat:'openings',level:'متوسط',title:'♛ غامبيت الوزير',body:'1.d4 d5 2.c4 — الأبيض يضحي ببيدق مقابل مركز قوي.',tip:'لا تحتفظ بالبيدق الإضافي إذا سيضعفك.'},
  {cat:'openings',level:'متوسط',title:'🇬🇧 نظام لندن',body:'1.d4 2.Nf3 3.Bf4 — نظام صلب وسهل.',tip:'مثالي إذا كرهت النظرية.'},
  {cat:'openings',level:'متوسط',title:'⚠️ أخطاء الافتتاح',body:'1) تحريك نفس القطعة مرتين. 2) إخراج الوزير مبكرًا. 3) تجاهل التطوير. 4) تبييت متأخر.',tip:'طوّر → بيّت → هاجم.'},
  {cat:'tactics',level:'مبتدئ',title:'📌 التثبيت (Pin)',body:'تثبيت قطعة الخصم لأن خلفها قطعة أهم. المطلق: خلفها الملك.',tip:'فيل b5 يثبّت حصان c6 ضد الملك e8.'},
  {cat:'tactics',level:'مبتدئ',title:'🍴 الشوكة (Fork)',body:'قطعة واحدة تهاجم قطعتين. الحصان سيد الشوكات.',tip:'ابحث عن مربعات انطلاق الحصان.'},
  {cat:'tactics',level:'متوسط',title:'🔪 الشيشة (Skewer)',body:'عكس التثبيت: قطعة ثمينة أمام، أقل قيمة خلف. تهاجم الأولى فيهرب فتأكل الثانية.',tip:'مفيدة في النهايات.'},
  {cat:'tactics',level:'متوسط',title:'💥 الهجوم المكتشف',body:'تحرك قطعة فتكشف عن هجوم قطعة أخرى خلفها.',tip:'مع كش = أقوى تكتيك.'},
  {cat:'tactics',level:'متوسط',title:'🎭 التضحية',body:'التخلي عن مادة مقابل ميزة أكبر (هجوم، مركز، تفعيل).',tip:'احسب حتى النهاية قبل التضحية.'},
  {cat:'tactics',level:'متقدم',title:'🌀 مات الصف الأخير',body:'عندما يكون الملك محصورًا ببيادقه في الصف الأخير، رخ أو وزير يعطي مات.',tip:'تأكد من "نافذة تنفس" لملكك.'},
  {cat:'tactics',level:'متقدم',title:'⚡ الكش المستمر',body:'عندما تكون خاسرًا ماديًا، اجبر الخصم على تكرار الوضع 3 مرات للتعادل.',tip:'ابحث عن سلسلة كش لا تنتهي.'},
  {cat:'tactics',level:'متوسط',title:'🧲 الجذب والصد',body:'جذب قطعة دفاعية بعيدًا ثم مهاجمة هدف محمي.',tip:'ابحث عن قطع الخصم المدافعة.'},
  {cat:'strategy',level:'متوسط',title:'🎯 السيطرة على المركز',body:'المركز = d4/e4/d5/e5. من يسيطر عليه يتحرك بحرية.',tip:'افتح ببيدق مركزي (e4 أو d4).'},
  {cat:'strategy',level:'متوسط',title:'🏗️ بنية البيادق',body:'البيادق لا تعود. المتضاعفة والمعزولة = ضعف. الحرة = قوة.',tip:'تجنّب التضاعف بدون تعويض.'},
  {cat:'strategy',level:'متقدم',title:'🛤️ الأعمدة المفتوحة',body:'الرخ يحتاج أعمدة مفتوحة. ضاعف الرخاخ على عمود واحد.',tip:'رخ على عمود مفتوح = 1.5 بيدق.'},
  {cat:'strategy',level:'متقدم',title:'🐴 الحصان الجيد ضد الفيل السيئ',body:'الحصان يحتاج مربعات دعم لا يمكن مهاجمتها ببيادق.',tip:'إذا كان لديك فيل سيئ، بادله.'},
  {cat:'strategy',level:'متقدم',title:'📐 المربعات الضعيفة',body:'المربع الضعيف = لا يمكن حمايته ببيدق. ضع قطعة فيه.',tip:'d5 في الفرنسي مثال كلاسيكي.'},
  {cat:'strategy',level:'مبتدئ',title:'🧘 حسّن أسوأ قطعة',body:'في المواقف الهادئة، حسّن أسوأ قطعة لديك. لا تشن هجومًا بدون تفوق.',tip:'ما أسوأ قطعة عندي؟ حسّنها.'},
  {cat:'endgame',level:'متوسط',title:'👑 الملك في النهاية',body:'في النهاية، الملك يتحول لقطعة هجومية. فعّله!',tip:'أخرج ملكك للمركز بعد تبادل الوزراء.'},
  {cat:'endgame',level:'متقدم',title:'⚖️ التقابل (Opposition)',body:'عندما يقف الملكان على نفس العمود/الصف مع مربع بينهما، صاحب الدور خاسر.',tip:'اجبر الخصم على التقابل ثم ادفع البيدق.'},
  {cat:'endgame',level:'متوسط',title:'🏁 الملك + بيدق ضد الملك',body:'إذا وصل ملكك أمام بيدقك بمربع مقابل ملك الخصم، فأنت تفوز.',tip:'ادفع الملك أولًا ثم البيدق.'},
  {cat:'endgame',level:'متقدم',title:'🏰 نهاية الرخ',body:'أصعب أنواع النهايات. القاعدة: ضع رخك خلف البيدق الحر.',tip:'الرخ الخلفي يدعم تقدم بيدقك.'},
  {cat:'endgame',level:'متقدم',title:'💎 نهاية الوزراء',body:'الوزير وحده لا يعطي مات. اجعل الملك قريبًا.',tip:'احذر الكش المستمر.'},
  {cat:'endgame',level:'مبتدئ',title:'📏 قاعدة المربع',body:'ارسم مربعًا ذهنيًا من البيدق لصف الترقية. إذا كان الملك داخل المربع يلحق.',tip:'احسب المربعات.'},
  {cat:'psych',level:'متوسط',title:'🧠 التحكم في العواطف',body:'لا تلعب وأنت غاضب. خسارة قطعة ليست نهاية اللعبة.',tip:'الهدوء يفوز أكثر من العبقرية.'},
  {cat:'psych',level:'متقدم',title:'⏱️ إدارة الوقت',body:'20% للافتتاح، 50% للوسط، 30% للنهاية.',tip:'النقلة البديهية في 30 ثانية.'},
  {cat:'psych',level:'متقدم',title:'🎭 خداع الخصم',body:'العب الأصعب على الخصم لا الأفضل لك دائمًا.',tip:'ضد هجومي: العب هادئًا.'},
  {cat:'psych',level:'متوسط',title:'📖 التعلم من الأخطاء',body:'بعد كل مباراة، راجعها وحلل الأخطاء.',tip:'3 مباريات + تحليل > 10 بدون تحليل.'}
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
  if(ring){const dash=157;ring.style.strokeDashoffset=dash-(dash*pct/100);}
}
function renderCatFilter(){
  const el=$('catFilter');if(!el)return;el.innerHTML='';
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
  const el=$('lessonsList');if(!el)return;el.innerHTML='';
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

/* ═══════════ الأصدقاء / الحساب / المتصدرون ═══════════ */
function renderFriends(){
  const el=$('friendsList');if(!el)return;
  const u=getUsers()[currentUser];
  const friends=(u&&u.friends)||[];
  el.innerHTML='';
  if(!friends.length){el.innerHTML='<p class="empty-msg">لا يوجد أصدقاء بعد</p>';return;}
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

function renderProfile(){
  const users=getUsers();const u=users[currentUser];
  if(!u)return;
  u.rating=u.rating||1200;u.stats=u.stats||{w:0,l:0,d:0};
  const el=id=>document.getElementById(id);
  if(el('profileName'))el('profileName').textContent=currentUser;
  if(el('statW'))el('statW').textContent=u.stats.w;
  if(el('statL'))el('statL').textContent=u.stats.l;
  if(el('statD'))el('statD').textContent=u.stats.d;
  if(el('ratingNum'))el('ratingNum').textContent=u.rating;
  const r=getRank(u.rating);
  if(el('rankName'))el('rankName').textContent=r.name;
  if(el('rankIcon'))el('rankIcon').textContent=r.icon;
  if(el('sideRating'))el('sideRating').textContent=u.rating;
  if(el('userAvatar'))el('userAvatar').textContent=r.icon;
}
function renderLeaderboard(){
  const el=$('leaderboard');if(!el)return;
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

/* ═══════════ ENTER APP ═══════════ */
function enterApp(){
  $('authScreen').classList.add('hidden');
  $('app').classList.remove('hidden');
  const u=getUsers()[currentUser];
  if(!u)return;
  $('sideUser').textContent=currentUser;
  $('sideRating').textContent=u.rating||1200;
  renderProfile();renderFriends();renderLessons('all');renderLeaderboard();
}

/* ═══════════ ربط الأحداث ═══════════ */
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));

document.querySelectorAll('#aiLevelPills .pill').forEach(p=>p.addEventListener('click',()=>{
  document.querySelectorAll('#aiLevelPills .pill').forEach(x=>x.classList.remove('active'));
  p.classList.add('active');
}));
document.querySelectorAll('#aiColorPills .pill').forEach(p=>p.addEventListener('click',()=>{
  document.querySelectorAll('#aiColorPills .pill').forEach(x=>x.classList.remove('active'));
  p.classList.add('active');
}));

$('newAIGame')?.addEventListener('click',newAIGame);
$('createRoom')?.addEventListener('click',createRoom);
$('joinRoom')?.addEventListener('click',joinRoom);
$('addFriend')?.addEventListener('click',addFriend);

$('resignBtn')?.addEventListener('click',()=>{
  if(gameOver)return;
  gameOver=true;
  const winner=turn==='w'?'b':'w';
  showResult(winner,'resign');
});

$('flipBtn')?.addEventListener('click',()=>{flipped=!flipped;renderBoard();});

$('resetStats')?.addEventListener('click',()=>{
  if(!confirm('تصفير كل الإحصائيات والتقييم؟'))return;
  const users=getUsers();
  users[currentUser].stats={w:0,l:0,d:0};
  users[currentUser].rating=1200;
  saveUsers(users);renderProfile();renderLeaderboard();
});

$('modalRematch')?.addEventListener('click',()=>{
  $('resultModal').classList.add('hidden');
  if(gameMode==='ai')newAIGame();
  else if(gameMode==='online')createRoom();
});
$('modalClose')?.addEventListener('click',()=>$('resultModal').classList.add('hidden'));

$('logoutBtn')?.addEventListener('click',()=>{
  Store.clearSession();
  location.reload();
});

/* ═══════════ جلسة تلقائية ═══════════ */
(function restoreSession(){
  const saved=Store.getSession();
  if(saved&&Store.getUsers()[saved]){
    currentUser=saved;
    enterApp();
  } else {
    setAuthMode('login');
  }
})();

/* ═══════════ تصدير للاستخدام في onclick ═══════════ */
window.socialLogin=socialLogin;
window.challengeFriend=challengeFriend;
