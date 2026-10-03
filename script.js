/* =========================================================
   شطرنج برو V2 — قطع SVG بدون صلبان + تقييم Elo + أكاديمية كاملة
   ========================================================= */

/* ============ قطع SVG بدون صلبان ============ */
const PIECE_SVG = {
  p:`<svg viewBox="0 0 45 45"><circle cx="22.5" cy="13" r="6.5"/><path d="M22.5 19.5c-5 0-9 6.5-9 14.5h18c0-8-4-14.5-9-14.5z"/><rect x="10" y="34" width="25" height="4.5" rx="2.2"/></svg>`,
  r:`<svg viewBox="0 0 45 45"><path d="M11 9h5v5h4V9h5v5h4V9h5v10l-3 3v11l3 3v3H11v-3l3-3V22l-3-3z"/></svg>`,
  n:`<svg viewBox="0 0 45 45"><path d="M24 9c-1.5 0-2.6.6-3.5 1.5-2-1-4.2-.8-6.3.5l-5.2 3.2c-2 1.2-3 3.2-2.6 5.5l.6 3.6c.2 1.2 1.6 1.7 2.6 1l3.3-2.3c.8 2.4.8 5-.2 7.5l-2 5h22l-1.5-7c-.8-3.9-2.6-7-5.2-9.3-1.6-1.4-2.6-3.3-2.6-5.4 0-1.6 1-2.9 2.3-3.6-.4-.1-.8-.2-1.7-.2z"/></svg>`,
  b:`<svg viewBox="0 0 45 45"><circle cx="22.5" cy="8" r="3.3"/><path d="M22.5 12.5c-4.5 4.5-8.5 9.5-8.5 15 0 3.5 2.2 5.5 5 5.5h7c2.8 0 5-2 5-5.5 0-5.5-4-10.5-8.5-15z"/><rect x="15" y="33.5" width="15" height="3" rx="1"/><rect x="12" y="36.5" width="21" height="4.5" rx="2"/></svg>`,
  q:`<svg viewBox="0 0 45 45"><circle cx="9" cy="12" r="2.6"/><circle cx="16.5" cy="8.5" r="2.6"/><circle cx="22.5" cy="7" r="2.8"/><circle cx="28.5" cy="8.5" r="2.6"/><circle cx="36" cy="12" r="2.6"/><path d="M9 14l4.5 16h18l4.5-16-6 7-5-11-5 11-5-11-5 11z"/><rect x="14" y="31" width="17" height="3" rx="1"/><rect x="12" y="34" width="21" height="4.5" rx="2"/></svg>`,
  k:`<svg viewBox="0 0 45 45"><circle cx="22.5" cy="6.5" r="3.3"/><path d="M11 13l2.5 15h18L34 13l-5.5 9L24 10l-4.5 12L14 13z"/><rect x="14" y="29" width="17" height="3" rx="1"/><rect x="12" y="32" width="21" height="4.5" rx="2"/><rect x="10" y="36.5" width="25" height="4.5" rx="2"/></svg>`
};

/* ============ محرك الشطرنج ============ */
const VALUE = {p:100, n:320, b:330, r:500, q:900, k:20000};
const DIRS = {
  r:[[1,0],[-1,0],[0,1],[0,-1]],
  b:[[1,1],[1,-1],[-1,1],[-1,-1]],
  n:[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]
};
DIRS.q = DIRS.r.concat(DIRS.b);
DIRS.k = DIRS.r;

function startBoard(){
  const back = ['r','n','b','q','k','b','n','r'];
  const b = Array.from({length:8}, ()=>Array(8).fill(null));
  for(let c=0;c<8;c++){
    b[0][c] = 'b'+back[c];
    b[1][c] = 'bp';
    b[6][c] = 'wp';
    b[7][c] = 'w'+back[c];
  }
  return b;
}
const cloneBoard = b => b.map(r=>r.slice());

function pseudoMoves(board, r, c){
  const p = board[r][c];
  if(!p) return [];
  const color = p[0], type = p[1];
  const out = [];
  const singlePush = (rr,cc)=>{
    if(rr<0||rr>7||cc<0||cc>7) return false;
    const t = board[rr][cc];
    if(t && t[0]===color) return false;
    out.push([rr,cc]);
    return !t;
  };

  if(type === 'p'){
    const dir = color==='w' ? -1 : 1;
    const startRow = color==='w' ? 6 : 1;
    if(r+dir>=0 && r+dir<=7 && !board[r+dir][c]){
      out.push([r+dir, c]);
      if(r===startRow && !board[r+2*dir][c]) out.push([r+2*dir, c]);
    }
    for(const dc of [-1,1]){
      const rr=r+dir, cc=c+dc;
      if(rr>=0 && rr<=7 && cc>=0 && cc<=7){
        const t = board[rr][cc];
        if(t && t[0]!==color) out.push([rr,cc]);
      }
    }
  }
  else if(type === 'n' || type === 'k'){
    const dirs = type==='n' ? DIRS.n : DIRS.r;
    for(const [dr,dc] of dirs) singlePush(r+dr, c+dc);
  }
  else {
    for(const [dr,dc] of DIRS[type]){
      let rr=r+dr, cc=c+dc;
      while(rr>=0 && rr<=7 && cc>=0 && cc<=7){
        const t = board[rr][cc];
        if(!t) out.push([rr,cc]);
        else { if(t[0]!==color) out.push([rr,cc]); break; }
        rr+=dr; cc+=dc;
      }
    }
  }
  return out;
}

function findKing(board, color){
  for(let r=0;r<8;r++) for(let c=0;c<8;c++)
    if(board[r][c] === color+'k') return [r,c];
  return null;
}

function attacked(board, r, c, byColor){
  const pd = byColor==='w' ? 1 : -1;
  for(const dc of [-1,1]){
    const rr=r+pd, cc=c+dc;
    if(rr>=0&&rr<=7&&cc>=0&&cc<=7 && board[rr][cc]===byColor+'p') return true;
  }
  for(const [dr,dc] of DIRS.n){
    const rr=r+dr, cc=c+dc;
    if(rr>=0&&rr<=7&&cc>=0&&cc<=7 && board[rr][cc]===byColor+'n') return true;
  }
  for(const [dr,dc] of DIRS.r){
    const rr=r+dr, cc=c+dc;
    if(rr>=0&&rr<=7&&cc>=0&&cc<=7 && board[rr][cc]===byColor+'k') return true;
  }
  for(const [dr,dc] of DIRS.r){
    let rr=r+dr, cc=c+dc;
    while(rr>=0&&rr<=7&&cc>=0&&cc<=7){
      const t=board[rr][cc];
      if(t){ if(t[0]===byColor && (t[1]==='r'||t[1]==='q')) return true; break; }
      rr+=dr; cc+=dc;
    }
  }
  for(const [dr,dc] of DIRS.b){
    let rr=r+dr, cc=c+dc;
    while(rr>=0&&rr<=7&&cc>=0&&cc<=7){
      const t=board[rr][cc];
      if(t){ if(t[0]===byColor && (t[1]==='b'||t[1]==='q')) return true; break; }
      rr+=dr; cc+=dc;
    }
  }
  return false;
}

function inCheck(board, color){
  const k = findKing(board, color);
  if(!k) return false;
  return attacked(board, k[0], k[1], color==='w'?'b':'w');
}

function legalMoves(board, color){
  const res = [];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    if(board[r][c] && board[r][c][0]===color){
      for(const [rr,cc] of pseudoMoves(board,r,c)){
        const nb = cloneBoard(board);
        nb[rr][cc] = nb[r][c];
        nb[r][c] = null;
        if(!inCheck(nb, color)) res.push([r,c,rr,cc]);
      }
    }
  }
  return res;
}

/* ============ الذكاء الاصطناعي ============ */
function evaluate(board){
  let s = 0;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const p = board[r][c];
    if(!p) continue;
    const v = VALUE[p[1]];
    const centerBonus = (3.5 - Math.abs(3.5-r)) + (3.5 - Math.abs(3.5-c));
    s += p[0]==='w' ? v + centerBonus : -(v + centerBonus);
  }
  return s;
}

function applyToBoard(board, m){
  const nb = cloneBoard(board);
  nb[m[2]][m[3]] = nb[m[0]][m[1]];
  nb[m[0]][m[1]] = null;
  const pc = nb[m[2]][m[3]];
  if(pc[1]==='p' && (m[2]===0 || m[2]===7)) nb[m[2]][m[3]] = pc[0]+'q';
  return nb;
}

function negamax(board, depth, alpha, beta, color){
  const moves = legalMoves(board, color);
  if(moves.length === 0){
    if(inCheck(board, color)) return -100000 - depth;
    return 0;
  }
  if(depth === 0) return evaluate(board) * (color==='w'?1:-1);

  moves.sort((a,b)=>{
    const ca = board[a[2]][a[3]] ? VALUE[board[a[2]][a[3]][1]] : 0;
    const cb = board[b[2]][b[3]] ? VALUE[board[b[2]][b[3]][1]] : 0;
    return cb - ca;
  });

  let best = -Infinity;
  for(const m of moves){
    const nb = applyToBoard(board, m);
    const sc = -negamax(nb, depth-1, -beta, -alpha, color==='w'?'b':'w');
    if(sc > best) best = sc;
    if(best > alpha) alpha = best;
    if(alpha >= beta) break;
  }
  return best;
}

function aiChooseMove(board, color, depth){
  const moves = legalMoves(board, color);
  if(!moves.length) return null;
  let best = -Infinity, bestMoves = [];
  for(const m of moves){
    const nb = applyToBoard(board, m);
    const sc = -negamax(nb, depth-1, -Infinity, Infinity, color==='w'?'b':'w');
    if(sc > best){ best = sc; bestMoves = [m]; }
    else if(sc === best) bestMoves.push(m);
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

/* ============ المستخدمون والتقييم ============ */
const getUsers = () => JSON.parse(localStorage.getItem('chess_users') || '{}');
const saveUsers = u => localStorage.setItem('chess_users', JSON.stringify(u));
let currentUser = null;

function getRank(rating){
  if(rating < 1000) return {name:'مبتدئ', icon:'🌱'};
  if(rating < 1300) return {name:'لاعب مبتدئ', icon:'⚔️'};
  if(rating < 1600) return {name:'متوسط', icon:'🛡️'};
  if(rating < 1900) return {name:'متقدم', icon:'⚡'};
  if(rating < 2200) return {name:'خبير', icon:'🔥'};
  return {name:'أستاذ', icon:'👑'};
}

function loadSession(){
  const name = localStorage.getItem('chess_current');
  if(name){
    const users = getUsers();
    if(users[name]){ currentUser = name; enterApp(); }
  }
}

function enterApp(){
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('sideUser').textContent = currentUser;
  const u = getUsers()[currentUser];
  document.getElementById('sideRating').textContent = u.rating || 1200;
  renderProfile();
  renderFriends();
  renderLessons('all');
  renderLeaderboard();
}

function logout(){
  localStorage.removeItem('chess_current');
  location.reload();
}

/* ============ حالة اللعبة ============ */
let board = startBoard();
let selected = null;
let legalForSelected = [];
let turn = 'w';
let gameOver = false;
let gameMode = null;
let aiColor = 'b';
let aiDepth = 2;
let aiLevelNum = 2;
let myColorOnline = 'w';
let onlineChannel = null;
let lastMove = null;

const boardEl = document.getElementById('board');
const gameBox = document.getElementById('gameBox');
const statusEl = document.getElementById('status');
const turnDot = document.getElementById('turnDot');

/* ============ الرسم ============ */
function renderBoard(){
  boardEl.innerHTML = '';
  const kingInCheck = inCheck(board, turn) ? findKing(board, turn) : null;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const sq = document.createElement('div');
    sq.className = 'sq ' + ((r+c)%2===0 ? 'light' : 'dark');
    if(selected && selected[0]===r && selected[1]===c) sq.classList.add('selected');
    if(legalForSelected.some(m=>m[0]===r && m[1]===c)) sq.classList.add('hint');
    if(lastMove && ((lastMove[0]===r&&lastMove[1]===c) || (lastMove[2]===r&&lastMove[3]===c)))
      sq.classList.add('lastmove');
    if(kingInCheck && kingInCheck[0]===r && kingInCheck[1]===c) sq.classList.add('check');

    const p = board[r][c];
    if(p){
      const span = document.createElement('span');
      span.className = 'piece ' + (p[0]==='w' ? 'white' : 'black');
      span.innerHTML = PIECE_SVG[p[1]];
      sq.appendChild(span);
    }
    sq.onclick = () => onSquareClick(r, c);
    boardEl.appendChild(sq);
  }
  turnDot.style.background = turn==='w' ? '#fff' : '#1a1a1a';
}

function updateStatus(msg){
  if(msg){ statusEl.textContent = msg; return; }
  if(gameOver) return;
  const name = turn==='w' ? 'الأبيض' : 'الأسود';
  statusEl.textContent = `الدور الآن على: ${name}`;
}

function onSquareClick(r, c){
  if(gameOver) return;
  if(gameMode === 'ai' && turn === aiColor) return;
  if(gameMode === 'online' && turn !== myColorOnline) return;

  const p = board[r][c];
  if(selected){
    const mv = legalForSelected.find(m => m[0]===r && m[1]===c);
    if(mv){ doMove(selected[0], selected[1], r, c); return; }
  }
  if(p && p[0]===turn){
    selected = [r, c];
    legalForSelected = legalMoves(board, turn)
      .filter(m => m[0]===r && m[1]===c)
      .map(m => [m[2], m[3]]);
  } else {
    selected = null;
    legalForSelected = [];
  }
  renderBoard();
}

function doMove(r, c, rr, cc, broadcast = true){
  board[rr][cc] = board[r][c];
  board[r][c] = null;
  const pc = board[rr][cc];
  if(pc[1]==='p' && (rr===0 || rr===7)) board[rr][cc] = pc[0]+'q';

  lastMove = [r, c, rr, cc];
  selected = null;
  legalForSelected = [];
  turn = turn === 'w' ? 'b' : 'w';

  renderBoard();
  updateStatus();

  if(broadcast && gameMode === 'online' && onlineChannel){
    onlineChannel.postMessage({type:'move', r, c, rr, cc});
  }

  checkGameEnd();

  if(!gameOver && gameMode === 'ai' && turn === aiColor){
    statusEl.textContent = '🤖 الذكاء الاصطناعي يفكر...';
    setTimeout(aiMove, 260);
  }
}

function aiMove(){
  const randomChance = aiDepth===1 ? 0.45 : aiDepth===2 ? 0.08 : 0;
  const moves = legalMoves(board, aiColor);
  if(!moves.length){ checkGameEnd(); return; }
  let move;
  if(Math.random() < randomChance){
    move = moves[Math.floor(Math.random()*moves.length)];
  } else {
    move = aiChooseMove(board, aiColor, aiDepth);
  }
  if(move) doMove(move[0], move[1], move[2], move[3], false);
}

function checkGameEnd(){
  const moves = legalMoves(board, turn);
  if(moves.length === 0){
    gameOver = true;
    if(inCheck(board, turn)){
      const winner = turn==='w' ? 'b' : 'w';
      const wName = winner==='w' ? 'الأبيض' : 'الأسود';
      statusEl.textContent = `🏆 كش مات! فاز ${wName}`;
      handleResult(winner);
    } else {
      statusEl.textContent = '🤝 تعادل (ستاليميت)';
      handleResult('d');
    }
  } else if(inCheck(board, turn)){
    statusEl.textContent = '⚠️ كش!';
  }
}

/* ============ معالجة النتيجة + تقييم Elo ============ */
function handleResult(winner){
  // winner: 'w' | 'b' | 'd'
  const users = getUsers();
  const u = users[currentUser];
  if(!u) return;
  u.rating = u.rating || 1200;

  let delta = 0;
  if(gameMode === 'ai'){
    const humanColor = aiColor === 'w' ? 'b' : 'w';
    const humanWon = winner === humanColor;
    const isDraw = winner === 'd';
    if(isDraw){ u.stats.d++; delta = 3; }
    else if(humanWon){ u.stats.w++; delta = 12 + aiLevelNum * 8; }
    else { u.stats.l++; delta = -(5 + aiLevelNum * 3); }
  } else if(gameMode === 'online'){
    const humanWon = winner === myColorOnline;
    const isDraw = winner === 'd';
    if(isDraw){ u.stats.d++; delta = 5; }
    else if(humanWon){ u.stats.w++; delta = 20; }
    else { u.stats.l++; delta = -15; }
  }
  u.rating = Math.max(400, u.rating + delta);
  saveUsers(users);
  renderProfile();
  renderLeaderboard();

  setTimeout(()=>{
    const r = getRank(u.rating);
    statusEl.textContent += `   |   ${delta>0?'+':''}${delta} تقييم → ${u.rating} (${r.name})`;
  }, 100);
}

/* ============ تشغيل لعبة AI ============ */
function newAIGame(){
  aiLevelNum = parseInt(document.getElementById('aiLevelSel').value);
  aiDepth = aiLevelNum;
  const humanColor = document.getElementById('aiColorSel').value;
  aiColor = humanColor === 'w' ? 'b' : 'w';

  board = startBoard();
  turn = 'w'; selected = null; legalForSelected = [];
  lastMove = null; gameOver = false; gameMode = 'ai';

  gameBox.classList.remove('hidden');
  document.querySelector('#view-playAI .board-slot').appendChild(gameBox);
  renderBoard();
  updateStatus();

  if(aiColor === 'w') setTimeout(aiMove, 450);
}

/* ============ أونلاين ============ */
function createRoom(){
  const code = Math.random().toString(36).slice(2,7).toUpperCase();
  onlineChannel = new BroadcastChannel('chess-room-' + code);
  onlineChannel.onmessage = handleOnlineMsg;
  myColorOnline = 'w';

  board = startBoard();
  turn='w'; selected=null; legalForSelected=[]; lastMove=null;
  gameOver=false; gameMode='online';

  gameBox.classList.remove('hidden');
  document.querySelector('#view-playOnline .board-slot').appendChild(gameBox);
  renderBoard();
  updateStatus('⏳ بانتظار انضمام صديق... شارك الكود: ' + code);
  document.getElementById('roomInfo').textContent = 'كود الغرفة: ' + code;
}

function joinRoom(){
  const code = document.getElementById('joinCode').value.trim().toUpperCase();
  if(code.length !== 5){ document.getElementById('roomInfo').textContent = 'كود غير صالح'; return; }
  onlineChannel = new BroadcastChannel('chess-room-' + code);
  onlineChannel.onmessage = handleOnlineMsg;
  myColorOnline = 'b';

  board = startBoard();
  turn='w'; selected=null; legalForSelected=[]; lastMove=null;
  gameOver=false; gameMode='online';

  gameBox.classList.remove('hidden');
  document.querySelector('#view-playOnline .board-slot').appendChild(gameBox);
  renderBoard();
  updateStatus('⏳ جارٍ الاتصال...');
  onlineChannel.postMessage({type:'join'});
  document.getElementById('roomInfo').textContent = 'انضممت للغرفة: ' + code;
}

function handleOnlineMsg(e){
  const msg = e.data;
  if(msg.type === 'join' && myColorOnline === 'w'){
    onlineChannel.postMessage({type:'start', board, turn});
    updateStatus('✅ بدأت اللعبة! أنت الأبيض');
  }
  if(msg.type === 'start'){
    board = msg.board; turn = msg.turn;
    renderBoard();
    updateStatus('✅ بدأت اللعبة! أنت الأسود');
  }
  if(msg.type === 'move'){
    doMove(msg.r, msg.c, msg.rr, msg.cc, false);
  }
}

/* ============ الأكاديمية — 40+ درس ============ */
const LESSONS = [
  // ══════ الأساسيات ══════
  {cat:'basics', level:'مبتدئ', title:'♟️ قطع الشطرنج وقيمتها',
   body:'كل قطعة لها قيمة رقمية تُستخدم لتقييم التبادلات: البيدق=1، الحصان=3، الفيل=3، الرخ=5، الوزير=9، الملك=لا نهائي. عند تبادل القطع احسب الفرق: إذا أخذت رخًّا (5) وخسرت فيلًا (3) فأنت رابح +2.',
   tip:'لا تضحّي بالوزير مقابل رخ + فيل إلا إذا كنت ترى ماتًا قريبًا.'},

  {cat:'basics', level:'مبتدئ', title:'♞ حركة كل قطعة',
   body:'البيدق: خطوة للأمام فقط (خطوتان من البداية)، يأكل مائلًا. الحصان: حرف L، يقفز فوق القطع. الفيل: أقطار فقط. الرخ: صفوف وأعمدة. الوزير: كل الاتجاهات. الملك: خطوة واحدة في أي اتجاه.',
   tip:'الحصان هو القطعة الوحيدة التي تقفز فوق القطع الأخرى.'},

  {cat:'basics', level:'مبتدئ', title:'🎯 الهدف من اللعبة',
   body:'الفوز = كش مات على ملك الخصم. الكش = الملك مهدد لكن يمكنه الهرب أو الحماية أو الأكل. الكش مات = لا مفر. الستاليميت = الملك ليس مكشوشًا لكن لا حركة قانونية = تعادل.',
   tip:'عندما تكون متقدمًا، تجنّب الستاليميت — اترك للخصم حركة دائمًا.'},

  {cat:'basics', level:'مبتدئ', title:'🏰 التبييت (Castling)',
   body:'حركة دفاعية تنقل الملك إلى الأمان: الملك يتحرك مربعين نحو الرخ والرخ يقفز فوقه. شرطه: لم يتحرك الملك ولا الرخ، لا يوجد قطع بينهما، الملك ليس مكشوشًا ولا يمرّ على مربع مهدد.',
   tip:'بيّت مبكرًا (خلال أول 10 نقلات) لحماية ملكك.'},

  {cat:'basics', level:'مبتدئ', title:'⬆️ ترقية البيدق',
   body:'عندما يصل البيدق للصف الأخير يمكنك ترقيته لأي قطعة (غالبًا الوزير). الترقية إلى وزير ثاني قوية جدًا. يمكنك أيضًا الترقية لحصان في بعض المواقف لإعطاء كش.',
   tip:'إذا كان البيدق قريبًا من الترقية، ركّز جهدك على حمايته وإيصاله.'},

  {cat:'basics', level:'متوسط', title:'👑 حركة الأخذ بالتجاوز (En Passant)',
   body:'إذا تحرك بيدق الخصم خطوتين ومرّ بجانب بيدقك في الصف الخامس، يمكنك أكله فورًا كأنه تحرك خطوة واحدة فقط. الفرصة متاحة لنقلة واحدة فقط ثم تسقط.',
   tip:'تذكّرها عندما يلعب الخصم بيدقًا خطوتين — قد تكون لك هدية مجانية.'},

  // ══════ الافتتاحيات ══════
  {cat:'openings', level:'متوسط', title:'🇮🇹 الافتتاحية الإيطالية',
   body:'1.e4 e5 2.Nf3 Nc6 3.Bc4 — من أقدم وأقوى الافتتاحيات. تهدف للسيطرة على المركز والضغط على f7 (أضعف مربع قرب الملك). الفيل على c4 يستهدف نقطة حساسة.',
   tip:'بعد Bc4 غالبًا تلعب d3 ثم c3 لبناء مركز قوي.'},

  {cat:'openings', level:'متقدم', title:'🇪🇸 الافتتاحية الإسبانية (Ruy López)',
   body:'1.e4 e5 2.Nf3 Nc6 3.Bb5 — سلاح الأبطال. الفيل يضغط على الحصان الذي يحمي e5. الهدف البعيد: السيطرة على المركز بعد دفع d4. من أشهر فروعها: المورفي، البيرلينية، والمغلقة.',
   tip:'الإسبانية تعطي ضغطًا استراتيجيًا طويل المدى بدل هجوم مباشر.'},

  {cat:'openings', level:'متوسط', title:'🇫🇷 الدفاع الفرنسي',
   body:'1.e4 e6 — دفاع صلب من الأسود. يعيق دفع e4-e5، ويبني سلسلة بيادق قوية. عيبه: الفيل الملكي محبوس. أشهر فروعه: Winawer, Tarrasch, Advance.',
   tip:'الأسود يضرب على d4 و c5 لتقويض مركز الأبيض.'},

  {cat:'openings', level:'متقدم', title:'🇸🇮 الصقلية (Sicilian Defense)',
   body:'1.e4 c5 — أشهر رد على e4. غير متوازن، يمنح الأسود فرص فوز. الفروع: Najdorf (الأقوى)، Dragon، Sveshnikov، Classical. الأسود يهاجم على الوزير.',
   tip:'الصقلية تحتاج حفظًا عميقًا، لا تجرّبها بدون تحضير.'},

  {cat:'openings', level:'متوسط', title:'♛ غامبيت الوزير',
   body:'1.d4 d5 2.c4 — أشهر افتتاحية بالأبيض على d4. الأبيض يضحي ببيدق مقابل مركز قوي وسيطرة. الفروع: Accepted (يقبل)، Declined (يرفض)، Slav.',
   tip:'لا تحتفظ بالبيدق الإضافي إذا كان سيُضعف موقفك.'},

  {cat:'openings', level:'متوسط', title:'🇬🇧 افتتاحية لندن',
   body:'1.d4 2.Nf3 3.Bf4 — نظام صلب وسهل التعلم. الأبيض يبني بيادق d4/e3/c3 ويخرج الفيل الأسود قبل e3. مناسبة للمبتدئين لأنها لا تحتاج حفظًا عميقًا.',
   tip:'مثالية إذا كنت تكره الافتتاحيات النظرية المعقدة.'},

  {cat:'openings', level:'متقدم', title:'🇳🇴 افتتاحية النرويجية',
   body:'1.e4 g6 2.d4 Bg7 — الأسود يلعب هجومًا غير مباشر من الجناح. الفيل على g7 يضغط على المركز. الشائع بعدها: 3.Nc3 d6 ثم e5 أو c5.',
   tip:'قوية ضد اللاعبين الهجوميين لأنها تُبطئ إيقاع اللعب.'},

  {cat:'openings', level:'متوسط', title:'⚠️ أخطاء الافتتاح الشائعة',
   body:'1) تحريك نفس القطعة مرتين. 2) إخراج الوزير مبكرًا فيُطارَد. 3) تجاهل تطوير القطع. 4) تحريك بيادق الأجنحة بلا سبب. 5) التبييت المتأخر.',
   tip:'قاعدة: طوّر حصانًا وفيلًا، بيّت، ثم ابدأ الهجوم.'},

  // ══════ التكتيكات ══════
  {cat:'tactics', level:'مبتدئ', title:'📌 التثبيت (Pin)',
   body:'تثبيت قطعة الخصم لأن خلفها قطعة أهم. النوع المطلق: القطعة خلفها الملك (لا يمكنها التحرك قانونيًا). النوع النسبي: خلفها قطعة ثمينة. استغل القطعة المثبتة بمهاجمتها.',
   tip:'فيل على b5 يثبّت حصان c6 ضد الملك على e8.'},

  {cat:'tactics', level:'مبتدئ', title:'🍴 الشوكة (Fork)',
   body:'قطعة واحدة تهاجم قطعتين أو أكثر دفعة واحدة. الحصان هو سيد الشوكات. البيدق أيضًا يشوك بسهولة. الهدف: اكسب مادة بلا خسارة.',
   tip:'اقلب وضع القطع في ذهنك وابحث عن مربعات انطلاق الحصان.'},

  {cat:'tactics', level:'متوسط', title:'🔪 الشيشة (Skewer)',
   body:'عكس التثبيت: قطعة ثمينة في المقدمة، قطعة أقل قيمة في الخلف. تهاجم الأولى فيهرب فتأكل الثانية. الفيل والرخ والوزير هم سادة الشيشة.',
   tip:'مفيدة في النهايات عندما يكون الملك خلف قطعة.'},

  {cat:'tactics', level:'متوسط', title:'💥 الهجوم المكتشف',
   body:'تحرك قطعة فتكشف عن هجوم قطعة أخرى خلفها. إذا كانت القطعة المكتشِفة تعطي كشًا، فالخصم مُجبر على الرد بينما قطعتك المتحركة تفعل ما تشاء.',
   tip:'الهجوم المكتشف مع كش = أقوى تكتيك في الشطرنج.'},

  {cat:'tactics', level:'متوسط', title:'🎭 التضحية (Sacrifice)',
   body:'التخلي عن مادة مقابل ميزة أكبر (هجوم، مركز، تفعيل). التضحية النوعية: رخ مقابل حصان/فيل. التضحية الحقيقية: قطعة كاملة مقابل هجوم قاتل.',
   tip:'احسب حتى النهاية قبل التضحية — لا تلعبها عاطفيًا.'},

  {cat:'tactics', level:'متقدم', title:'🌀 مات الصف الأخير',
   body:'عندما يكون الملك محصورًا في الصف الأخير ببيادقه، رخ أو وزير يعطي مات على طول الصف. كثيرًا ما يُستخدم مع تضحية لإزالة المدافعين.',
   tip:'تأكد دائمًا من وجود "نافذة تنفس" لملكك في النهايات.'},

  {cat:'tactics', level:'متقدم', title:'⚡ التعادل بالكش المستمر',
   body:'عندما تكون خاسرًا ماديًا، يمكنك إجبار الخصم على تكرار الوضع ثلاث مرات للحصول على تعادل. الكش المستمر = إنقاذ الموقف.',
   tip:'لو كنت خاسرًا، ابحث عن سلسلة كش لا تنتهي.'},

  {cat:'tactics', level:'متوسط', title:'🧲 الجذب والصد',
   body:'تكتيك جذب قطعة دفاعية بعيدًا ثم مهاجمة هدف محمي. مثال: تضحي بالوزير لسحب الملك ثم مات بالحصان.',
   tip:'ابحث عن قطع الخصم المدافعة — كيف تُبعدها؟'},

  // ══════ الاستراتيجية ══════
  {cat:'strategy', level:'متوسط', title:'🎯 السيطرة على المركز',
   body:'المركز = المربعات d4/e4/d5/e5. من يسيطر عليه يتحرك بحرية ويشن هجمات أسرع. السيطرة تكون بالبيادق أو القطع. لا تُفرط في المركز بدون مقابل.',
   tip:'افتح اللعبة ببيدق مركزي (e4 أو d4) وتدعمه بقطعة.'},

  {cat:'strategy', level:'متوسط', title:'🏗️ بنية البيادق',
   body:'البيادق لا تعود للخلف. البيادق المتضاعفة = ضعف. البيادق المعزولة = ضعف. البيدق الحر (Passed Pawn) = قوة. سلسلة البيادق = درع.',
   tip:'تجنّب البيادق المتضاعفة بدون تعويض من نشاط القطع.'},

  {cat:'strategy', level:'متقدم', title:'🛤️ الأعمدة المفتوحة',
   body:'الرخ يحتاج أعمدة مفتوحة أو نصف مفتوحة ليصل لعمق موقف الخصم. ضاعف الرخاخ على عمود مفتوح لضغط قاتل.',
   tip:'الرخ الجيد على عمود مفتوح = 1.5 بيدق مادي.'},

  {cat:'strategy', level:'متقدم', title:'🐴 الحصان الجيد ضد الفيل السيئ',
   body:'الحصان يحتاج مربعات دعم لا يمكن مهاجمتها ببيادق. ضع حصانك على مربع أمامي محمي. الفيل السيئ هو المحصور ببيادقه.',
   tip:'إذا كان لديك فيل سيئ، فكّر في تبادله.'},

  {cat:'strategy', level:'متقدم', title:'📐 المربعات الضعيفة',
   body:'المربع الضعيف = مربع لا يمكن حمايته ببيدق. ضع قطعة فيه (حصان مثالي). ابحث عن المربعات الضعيفة في معسكر الخصم واستوطنها.',
   tip:'المربع d5 في الفرنسي مثال كلاسيكي للمربع الضعيف.'},

  {cat:'strategy', level:'مبتدئ', title:'🧘 قاعدة "لا تستعجل"',
   body:'في المواقف الهادئة، حسّن أسوأ قطعة لديك. لا تشن هجومًا بدون تفوق. القاعدة الذهبية: عندما لا ترى تكتيكًا، حسّن موقعك.',
   tip:'اسأل نفسك: ما أسوأ قطعة عندي؟ حسّنها.'},

  // ══════ النهايات ══════
  {cat:'endgame', level:'متوسط', title:'👑 الملك في النهاية',
   body:'في النهاية، الملك يتحول من قطعة دفاعية إلى قطعة هجومية قوية. فعّله! في نهايات البيادق، الملك النشط يفوز غالبًا.',
   tip:'بعد تبادل الوزراء، أخرج ملكك للمركز فورًا.'},

  {cat:'endgame', level:'متقدم', title:'⚖️ التقابل (Opposition)',
   body:'عندما يقف الملكان على نفس العمود/الصف مع مربع واحد بينهما، صاحب الدور للتحرك خاسر (يُضطر للتنازل). قاعدة حاسمة في نهايات الملك والبيدق.',
   tip:'حاول إجبار الخصم على الخسارة بالتقابل ثم ادفع البيدق.'},

  {cat:'endgame', level:'متوسط', title:'🏁 الملك + بيدق ضد الملك',
   body:'إذا وصل ملكك أمام بيدقك بمربع مقابل ملك الخصم، فأنت تفوز. إن لم تفعل، تعادل. القاعدة: "الملك أمام البيدق".',
   tip:'ادفع الملك أولًا ثم البيدق — لا العكس.'},

  {cat:'endgame', level:'متقدم', title:'🏰 نهاية الرخ',
   body:'أصعب أنواع النهايات. الرخ النشط يفوز. القاعدة: ضع رخك خلف البيدق الحر (لك أو ضدك). قاعدة لوسينا وفيلبيك يجب حفظها.',
   tip:'الرخ الخلفي يدعم تقدم بيدقك بلا حصار.'},

  {cat:'endgame', level:'متقدم', title:'💎 نهاية الوزراء',
   body:'الوزير وحده لا يعطي مات بدون مساعدة الملك. اجعل الملك قريبًا ثم استخدم الوزير لإجبار الملك على الحافة. احذر الكش المستمر من وزير الخصم.',
   tip:'في نهاية وزير ضد بيدق، غالبًا الوزير يفوز إلا إذا كان البيدق في الصف السابع.'},

  {cat:'endgame', level:'مبتدئ', title:'📏 قاعدة المربع',
   body:'عندما يجري بيدق نحو الترقية والملك يطارده، ارسم مربعًا ذهنيًا: إذا كان الملك داخل المربع يلحق بالبيدق، وإلا لا. احسب المربع من البيدق لصف الترقية.',
   tip:'بيدق على a4 وملك أسود على f6: هل يلحق؟ عُدّ المربعات!'},

  // ══════ سيكولوجيا ══════
  {cat:'psych', level:'متوسط', title:'🧠 التحكم في العواطف',
   body:'الشطرنج صراع نفسي. لا تلعب وأنت غاضب أو متعب. إذا خسرت قطعة، لا تنتقم — العب أفضل نقلة. الهدوء يفوز أكثر من العبقرية.',
   tip:'خسارة قطعة ليست نهاية اللعبة — استمر بالضغط.'},

  {cat:'psych', level:'متقدم', title:'⏱️ إدارة الوقت',
   body:'في المباريات المؤقتة، وزّع وقتك: 20% للافتتاح، 50% للوسط، 30% للنهاية. لا تُفرط في التفكير بنقلة واضحة. 5 دقائق للتفكير في نقلة = خسارة.',
   tip:'إذا كانت النقلة "بديهية" لا تصرف عليها أكثر من 30 ثانية.'},

  {cat:'psych', level:'متقدم', title:'🎭 خداع الخصم',
   body:'لا تلعب دائمًا أفضل نقلة — العب النقلة الأصعب على الخصم. اقترح تبادلات تبدو متساوية لكنها مربحة لك. اضبط إيقاعك حسب مستوى الخصم.',
   tip:'ضد لاعب هجومي، العب هادئًا. ضد لاعب دفاعي، اضغط بقوة.'},

  {cat:'psych', level:'متوسط', title:'📖 التعلم من الأخطاء',
   body:'بعد كل مباراة، راجعها وحلّل الأخطاء. اسأل: أين أضعت الميزة؟ ما الذي فاتني؟ احتفظ بدفتر أخطاء متكررة. التطور يأتي من التحليل لا من اللعب فقط.',
   tip:'3 مباريات + تحليل > 10 مباريات بدون تحليل.'}
];

let activeCat = 'all';
const CATS = {
  all:{name:'الكل', icon:'📚'},
  basics:{name:'الأساسيات', icon:'♟️'},
  openings:{name:'الافتتاحيات', icon:'🚪'},
  tactics:{name:'التكتيكات', icon:'⚡'},
  strategy:{name:'الاستراتيجية', icon:'🎯'},
  endgame:{name:'النهايات', icon:'🏁'},
  psych:{name:'سيكولوجيا', icon:'🧠'}
};

function getReadLessons(){
  const u = getUsers()[currentUser];
  return (u && u.readLessons) || [];
}

function markRead(idx){
  const users = getUsers();
  const u = users[currentUser];
  u.readLessons = u.readLessons || [];
  if(!u.readLessons.includes(idx)){
    u.readLessons.push(idx);
    saveUsers(users);
    renderLessons(activeCat);
  }
}

function renderCatFilter(){
  const el = document.getElementById('catFilter');
  el.innerHTML = '';
  Object.entries(CATS).forEach(([key, val])=>{
    const btn = document.createElement('button');
    btn.className = 'cat-btn' + (activeCat===key ? ' active' : '');
    btn.textContent = val.icon + ' ' + val.name;
    btn.onclick = ()=>{ activeCat = key; renderLessons(key); };
    el.appendChild(btn);
  });
}

function renderLessons(cat){
  activeCat = cat;
  renderCatFilter();
  const el = document.getElementById('lessonsList');
  el.innerHTML = '';
  const read = getReadLessons();

  const list = LESSONS.map((l,i)=>({...l, idx:i}))
    .filter(l => cat === 'all' || l.cat === cat);

  list.forEach(l=>{
    const card = document.createElement('div');
    card.className = 'lesson-card' + (read.includes(l.idx) ? ' read' : '');
    card.innerHTML = `
      <div class="lesson-head">
        <h4>${l.title}</h4>
        <span class="level-badge ${l.level}">${l.level}</span>
      </div>
      <p>${l.body}</p>
      <div class="lesson-tip">💡 ${l.tip}</div>
    `;
    card.onclick = ()=> markRead(l.idx);
    el.appendChild(card);
  });

  // التقدم
  const total = LESSONS.length;
  const done = read.length;
  document.getElementById('progressFill').style.width = (done/total*100)+'%';
  document.getElementById('progressText').textContent = `${done} / ${total} درس`;
}

/* ============ الأصدقاء ============ */
function renderFriends(){
  const el = document.getElementById('friendsList');
  const users = getUsers();
  const u = users[currentUser];
  const friends = (u && u.friends) || [];
  el.innerHTML = '';
  if(!friends.length){
    el.innerHTML = '<p style="color:var(--muted)">لا يوجد أصدقاء بعد. أضف صديقًا باسم المستخدم.</p>';
    return;
  }
  friends.forEach(name=>{
    const card = document.createElement('div');
    card.className = 'friend-card';
    card.innerHTML = `<span>👤 ${name}</span>
      <button onclick="challengeFriend('${name}')">تحدّي</button>`;
    el.appendChild(card);
  });
}

function addFriend(){
  const name = document.getElementById('friendName').value.trim();
  if(!name || name === currentUser) return;
  const users = getUsers();
  if(!users[name]){ alert('لا يوجد مستخدم بهذا الاسم'); return; }
  const u = users[currentUser];
  u.friends = u.friends || [];
  if(!u.friends.includes(name)) u.friends.push(name);
  saveUsers(users);
  document.getElementById('friendName').value = '';
  renderFriends();
}

function challengeFriend(name){
  alert('لتحدّي ' + name + '، أنشئ غرفة وأرسل له الكود.');
  showView('playOnline');
  createRoom();
}

/* ============ الحساب ============ */
function renderProfile(){
  const users = getUsers();
  const u = users[currentUser];
  if(!u) return;
  u.rating = u.rating || 1200;
  u.stats = u.stats || {w:0,l:0,d:0};

  document.getElementById('profileName').textContent = currentUser;
  document.getElementById('statW').textContent = u.stats.w;
  document.getElementById('statL').textContent = u.stats.l;
  document.getElementById('statD').textContent = u.stats.d;
  document.getElementById('ratingNum').textContent = u.rating;
  const r = getRank(u.rating);
  document.getElementById('rankName').textContent = r.name;
  document.getElementById('rankIcon').textContent = r.icon;
  document.getElementById('sideRating').textContent = u.rating;
}

/* ============ المتصدرون ============ */
function renderLeaderboard(){
  const el = document.getElementById('leaderboard');
  const users = getUsers();
  const list = Object.entries(users)
    .map(([name, u])=>({name, rating: u.rating||1200, stats: u.stats||{w:0,l:0,d:0}}))
    .sort((a,b)=> b.rating - a.rating);

  el.innerHTML = '';
  list.forEach((u, i)=>{
    const row = document.createElement('div');
    row.className = 'lb-row' + (u.name === currentUser ? ' me' : '');
    const rankCls = i===0 ? 'gold' : i===1 ? 'silver' : i===2 ? 'bronze' : '';
    const medal = i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : (i+1);
    row.innerHTML = `
      <div class="lb-rank ${rankCls}">${medal}</div>
      <div class="lb-name">${u.name} ${u.name===currentUser?'(أنت)':''}</div>
      <div class="lb-rating">${u.rating}</div>
    `;
    el.appendChild(row);
  });
}

/* ============ التنقل ============ */
function showView(name){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const v = document.getElementById('view-' + name);
  const btn = document.querySelector(`.nav-btn[data-view="${name}"]`);
  if(v) v.classList.add('active');
  if(btn) btn.classList.add('active');

  if(name === 'playAI' || name === 'playOnline'){
    const slot = v.querySelector('.board-slot');
    if(slot && gameBox.parentElement !== slot) slot.appendChild(gameBox);
    gameBox.classList.remove('hidden');
  }
  if(name === 'leaderboard') renderLeaderboard();
}

/* ============ الأحداث ============ */
document.querySelectorAll('.tab').forEach(tab=>{
  tab.onclick = ()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    const isLogin = tab.dataset.tab === 'login';
    document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
    document.getElementById('registerForm').classList.toggle('hidden', isLogin);
    document.getElementById('authMsg').textContent = '';
  };
});

document.getElementById('loginForm').onsubmit = e=>{
  e.preventDefault();
  const name = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const users = getUsers();
  const msg = document.getElementById('authMsg');
  if(!users[name] || users[name].pass !== pass){
    msg.textContent = '❌ اسم المستخدم أو كلمة المرور غير صحيحة';
    return;
  }
  currentUser = name;
  localStorage.setItem('chess_current', name);
  enterApp();
};

document.getElementById('registerForm').onsubmit = e=>{
  e.preventDefault();
  const name = document.getElementById('regUser').value.trim();
  const pass = document.getElementById('regPass').value;
  const msg = document.getElementById('authMsg');
  if(name.length < 3){ msg.textContent = '❌ الاسم قصير جدًا'; return; }
  if(pass.length < 4){ msg.textContent = '❌ كلمة المرور قصيرة'; return; }
  const users = getUsers();
  if(users[name]){ msg.textContent = '❌ الاسم مستخدم بالفعل'; return; }
  users[name] = {pass, rating:1200, stats:{w:0,l:0,d:0}, friends:[], readLessons:[]};
  saveUsers(users);
  currentUser = name;
  localStorage.setItem('chess_current', name);
  enterApp();
};

document.getElementById('logoutBtn').onclick = logout;

document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.onclick = ()=> showView(btn.dataset.view);
});

document.getElementById('newAIGame').onclick = newAIGame;
document.getElementById('createRoom').onclick = createRoom;
document.getElementById('joinRoom').onclick = joinRoom;
document.getElementById('addFriend').onclick = addFriend;
document.getElementById('resignBtn').onclick = ()=>{
  if(gameOver) return;
  gameOver = true;
  const winner = turn === 'w' ? 'b' : 'w';
  handleResult(winner);
  statusEl.textContent = '🏳️ استسلمت — انتهت اللعبة';
};
document.getElementById('resetStats').onclick = ()=>{
  if(!confirm('هل تريد تصفير كل الإحصائيات والتقييم؟')) return;
  const users = getUsers();
  users[currentUser].stats = {w:0,l:0,d:0};
  users[currentUser].rating = 1200;
  saveUsers(users);
  renderProfile();
  renderLeaderboard();
};

/* ============ التشغيل ============ */
loadSession();
