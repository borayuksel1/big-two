// Big Two game server. No dependencies: run with `node server.js`.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const E = require('./engine.js');

const PORT = process.env.PORT || 3000;
const SAVE = path.join(__dirname, 'scores.json');
const PAGE = path.join(__dirname, 'public', 'index.html');
const REACTS = ['😂', '😤', '🔥', '👏', '🐢'];

let S = E.fresh();
try { const d = JSON.parse(fs.readFileSync(SAVE, 'utf8')); S.scores = d.scores || {}; S.nick = d.nick || {}; } catch (e) {}

const clients = new Map();          // response -> public player id
const lastSeen = {};                // public id -> time last connected
const awaySince = {};
const publicId = token => 'p' + crypto.createHash('sha256').update(String(token)).digest('hex').slice(0, 10);
const here = () => [...new Set(clients.values())];

// Each player only ever receives their own cards. Everyone's cards are shown once the hand is over.
function viewFor(uid) {
  const v = JSON.parse(JSON.stringify(S));
  delete v.acks;
  if (v.phase === 'play') v.hands = v.hands.map((h, i) => (v.seats[i].id === uid ? h : h.map(() => -1)));
  v.here = here();
  v.now = Date.now();
  return v;
}
function send(res, event, data) { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); }
let saveTimer = null;
function broadcast() {
  for (const [res, uid] of clients) send(res, 'state', viewFor(uid));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { fs.writeFileSync(SAVE, JSON.stringify({ scores: S.scores, nick: S.nick })); } catch (e) {} }, 1000);
}
function changed() { S.v++; broadcast(); }

function readBody(req) {
  return new Promise((ok, fail) => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 8000) { req.destroy(); fail(new Error('too big')); } });
    req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch (e) { fail(e); } });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    return fs.createReadStream(PAGE).pipe(res);
  }
  if (req.method === 'GET' && url.pathname === '/events') {
    const pid = url.searchParams.get('pid');
    if (!pid) { res.writeHead(400); return res.end(); }
    const uid = publicId(pid);
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no' });
    res.write('retry: 2000\n\n');
    clients.set(res, uid); lastSeen[uid] = Date.now();
    send(res, 'hello', { uid });
    broadcast();
    req.on('close', () => { clients.delete(res); lastSeen[uid] = Date.now(); broadcast(); });
    return;
  }
  if (url.pathname === '/ping') { res.writeHead(204); return res.end(); }
  if (req.method === 'POST' && url.pathname === '/act') {
    let body;
    try { body = await readBody(req); } catch (e) { res.writeHead(400); return res.end(); }
    const reply = o => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
    const a = body && body.a;
    if (!body.pid || !a || typeof a.t !== 'string') return reply({ ok: false, err: 'Bad request' });
    const uid = publicId(body.pid);
    if (a.t === 'react') {
      if (REACTS.includes(a.e)) for (const r of clients.keys()) send(r, 'react', { uid, e: a.e });
      return reply({ ok: true });
    }
    if (a.t === 'reset') {
      if (S.phase === 'play') return reply({ ok: false, err: 'Finish the hand first' });
      S.scores = {}; changed(); return reply({ ok: true });
    }
    if (!['sit', 'nick', 'leave', 'bots', 'deal', 'lobby', 'back', 'ready', 'play', 'pass'].includes(a.t)) return reply({ ok: false });
    const ok = E.apply(S, uid, a);
    if (ok) { changed(); return reply({ ok: true }); }
    let err = 'That did not work';
    const i = E.seatOf(S, uid);
    if (a.t === 'play' && i >= 0) err = E.valid(S, i, Array.isArray(a.c) ? a.c : []) || err;
    if (a.t === 'pass' && i >= 0) err = S.turn !== i ? 'Not your turn' : !S.last ? 'You are leading, so play anything' : err;
    if ((a.t === 'sit' || a.t === 'nick') && a.name) err = 'Someone at the table already has that name';
    if (a.t === 'deal') err = S.phase === 'play' ? 'A hand is already going' : 'Only the loser shuffles, or sit down first';
    return reply({ ok: false, err });
  }
  res.writeHead(404); res.end('Not found');
});

// Timers, bots, and players who walk away: a bot plays for anyone gone for 15 seconds on their turn.
let due = null;
setInterval(() => {
  if (E.clock(S, Date.now())) { changed(); return; }   // 30s arranging, 20s turn timer
  if (S.phase !== 'play' || S.org) { due = null; return; }
  const seat = S.seats[S.turn];
  if (!seat || !(seat.bot || seat.auto)) { due = null; return; }
  if (!due || due.v !== S.v) { due = { v: S.v, t: Date.now() + 650 + Math.random() * 750 }; return; }
  if (Date.now() < due.t) return;
  due = null;
  const c = E.botPick(S, S.turn);
  const e = c ? E.play(S, S.turn, c) : E.pass(S, S.turn);
  if (e) E.pass(S, S.turn);
  changed();
}, 200);

setInterval(() => {
  const now = Date.now(), on = new Set(here());
  let ch = false;
  if (S.phase === 'play') {
    S.seats.forEach((s, i) => {
      if (s.bot) return;
      if (on.has(s.id)) { delete awaySince[s.id]; if (s.auto === 'away') { s.auto = false; ch = true; } return; }
      awaySince[s.id] = awaySince[s.id] || now;
      if (!s.auto && S.turn === i && now - awaySince[s.id] > 15000) { s.auto = 'away'; ch = true; }
    });
  } else {
    // Free up seats of people who closed the page more than 2 minutes ago.
    const keep = S.lobby.filter(id => on.has(id) || now - (lastSeen[id] || 0) < 120000);
    if (keep.length !== S.lobby.length) { S.lobby = keep; ch = true; }
  }
  if (ch) changed();
}, 1000);

// Keep connections alive through proxies.
setInterval(() => { for (const r of clients.keys()) r.write(': ping\n\n'); }, 20000);

server.listen(PORT, () => console.log(`Big Two is running on http://localhost:${PORT}`));
