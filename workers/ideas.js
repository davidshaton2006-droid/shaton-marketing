/* Shaton Prime: user ideas (video / article topics) + referral bonuses.
   Cloudflare Worker + KV namespace IDEAS. Secrets: ADMIN_SECRET (panel), BOT_TOKEN (verifies Telegram initData),
   optional NOTIFY_TOKEN + NOTIFY_CHAT (admin bot token and chat id: pings the author about a new idea).
   Routes:
     POST /idea        {initData?, device, kind, text}          -> {ok, id}
     GET  /my?initData=..&device=..                             -> [{id, kind, text, ts, status, reason}]
     GET  /admin/list      (X-Admin: secret)                    -> all ideas
     POST /admin/set       (X-Admin: secret) {key, status, reason}
   Status values: new | review | accepted | declined.
   Referrals (Telegram identity only, verified by initData):
     POST /ref/claim   {initData, ref:'ref_<tgid>'}   invitee opened the app from a referral link
     GET  /ref/me?initData=..                          -> {invited:[{name, ok}], counted, per, available, spent, meSub, verifiable, unlocked:[ids]}
     POST /ref/redeem  {initData, id}                  spend one reward on a paid material (read access, no tools)
     POST /mat/text    {initData, id}                  plaintext of an unlocked material (secret MAT_KEYS: {id: hex AES key})
   Points ("баллы"), one map per Telegram user (key pt:<uid>), idempotent event keys:
     POST /pts/sync    {initData, events:{key:pts}}     client events are validated by key pattern and clamped -> {ok, total, events}
     GET  /admin/users (X-Admin)                        -> [{uid, name, username, total, guide, friends, ts}]
     POST /admin/grant (X-Admin) {uid, key, pts}        key must start with buy: | sub: | grant:
   Landing leads: POST /lead {phone, comment, form, page, extra, utm, ref} -> KV ld:* + Telegram ping to the owner; GET /admin/leads (X-Admin)
   AI-Mentor (D1 + FTS5 retrieval + LLM): see mentor.js / mentor.sql
   Public bot @SHATONLAB_bot as a webhook (always on, no PC needed):
     POST /tg          Telegram updates (header X-Telegram-Bot-Api-Secret-Token = secret TG_SECRET); EVERY message / every /start gets the same welcome
     GET  /admin/botusers (X-Admin)                    -> [{id, name, username, ts}] subscribers of the bot (for newsletters)
   A referral counts when the invitee opened the app AND is subscribed to the channel (needs the bot to be channel admin). */
const CHANNEL = '@shatonlab', PER = 3, PAGES = 'https://davidshaton2006-droid.github.io/shaton-marketing/';
import { handleMentor } from './mentor.js';
const ORIGINS = ['https://davidshaton2006-droid.github.io', 'http://localhost:8765'];
const KINDS = { video: 1, article: 1 }, STATUSES = { new: 1, review: 1, accepted: 1, declined: 1 };

function cors(req) {
  const o = req.headers.get('Origin') || '';
  return { 'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0], 'Access-Control-Allow-Headers': 'Content-Type, X-Admin', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Vary': 'Origin' };
}
function json(req, data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(req) } }); }

async function hmac(key, data) {
  const k = await crypto.subtle.importKey('raw', typeof key === 'string' ? new TextEncoder().encode(key) : key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data)));
}
const hex = (u) => [...u].map((b) => b.toString(16).padStart(2, '0')).join('');

/* Telegram Mini App initData check: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app */
async function tgUser(initData, botToken) {
  if (!initData || !botToken) return null;
  const p = new URLSearchParams(initData), h = p.get('hash'); if (!h) return null;
  p.delete('hash');
  const str = [...p.entries()].map(([k, v]) => k + '=' + v).sort().join('\n');
  const secret = await hmac('WebAppData', botToken);
  const sig = hex(await hmac(secret, str));
  if (sig !== h) return null;
  if (Date.now() / 1000 - Number(p.get('auth_date') || 0) > 7 * 86400) return null;
  try { return JSON.parse(p.get('user')); } catch (e) { return null; }
}
async function who(req, env, initData, device) {
  const u = await tgUser(initData, env.BOT_TOKEN);
  if (u && u.id) return { uid: 'tg' + u.id, name: [u.first_name, u.last_name].filter(Boolean).join(' '), username: u.username || '' };
  const d = String(device || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
  return d.length >= 12 ? { uid: 'dv' + d, name: '', username: '' } : null;
}


/* ---- points ---- */
const PT_RULES = [
  [/^story:[\w|%.\-]{1,90}$/, () => 2],
  [/^read:[a-z0-9\-]{1,40}$/, (v) => Math.min(20, Math.max(0, v))],
  [/^guide$/, () => 20],
  [/^idea:[a-z0-9]{1,16}$/, () => 5],
  [/^game:[a-z0-9\-]{1,40}:[\w\-]{1,40}$/, (v) => Math.min(50, Math.max(0, v))],
];
const ptTotal = (m) => Object.keys(m).reduce((t, k) => t + (k[0] === '_' ? 0 : (Number(m[k]) || 0)), 0);
async function ptGet(env, uid) { return (await env.IDEAS.get('pt:' + uid, 'json')) || {}; }
async function tgSend(env, chat, text, button) {
  if (!env.BOT_TOKEN) return;
  const body = { chat_id: chat, text, disable_web_page_preview: true };
  if (button) body.reply_markup = { inline_keyboard: [[button]] };
  try { await fetch('https://api.telegram.org/bot' + env.BOT_TOKEN + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); } catch (e) {}
}
const APP = PAGES + 'catalog.html', CHANNEL_URL = 'https://t.me/shatonlab';

/* ---- public bot welcome: one fixed text and keyboard, sent on EVERY /start and any private message ---- */
const WELCOME = 'Привет, {name}! 👋\n\nЭто Shaton Prime — приложение Давида Шатона с практическими материалами по маркетингу: Авито, Яндекс Директ, сайты, SEO и SMM. Внутри пошаговые разборы, задания, кейсы и истории с советами.\n\n👇 Нажмите «Открыть приложение», чтобы начать — первые руководства бесплатные.\n\n📣 Подпишитесь на канал: там разборы, новости и новые материалы.\n\nВопросы — @shaton_lid';
const FREE_URL = 'https://t.me/shatonlab/20';
async function botWelcome(env, m) {
  const f = m.from || {}, name = f.first_name || 'друг';
  const parts = String(m.text || '').split(/\s+/), ref = /^ref_\d{3,15}$/.test(parts[1] || '') ? parts[1] : '';
  const url = APP + (ref ? '?ref=' + ref : '');
  const kb = { inline_keyboard: [
    [{ text: 'Открыть приложение', web_app: { url } }],
    [{ text: 'Подписаться на канал', url: CHANNEL_URL }, { text: 'Бесплатные руководства', url: FREE_URL }],
  ] };
  const key = 'bu:' + m.chat.id, had = await env.IDEAS.get(key, 'json');
  await env.IDEAS.put(key, JSON.stringify({ name: f.first_name || '', username: f.username || '', ts: (had && had.ts) || Date.now(), last: Date.now() }));
  const r = await fetch('https://api.telegram.org/bot' + env.BOT_TOKEN + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: m.chat.id, text: WELCOME.replace('{name}', name), reply_markup: kb, disable_web_page_preview: true }) });
  return r.ok || (r.status >= 400 && r.status < 500 && r.status !== 429);   // blocked bot / bad chat: do not make Telegram retry forever
}

/* ---- referrals ---- */
async function subscribed(env, tgid) {
  if (!env.BOT_TOKEN) return null;
  try {
    const r = await fetch('https://api.telegram.org/bot' + env.BOT_TOKEN + '/getChatMember', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: CHANNEL, user_id: tgid }) });
    const j = await r.json();
    if (!j.ok) return null; // bot cannot see the member list: not verifiable
    return ['creator', 'administrator', 'member', 'restricted'].includes(j.result.status) && (j.result.status !== 'restricted' || j.result.is_member);
  } catch (e) { return null; }
}
async function refState(env, me) {
  const invitedRaw = (await env.IDEAS.get('rr:' + me.uid, 'json')) || [];
  const rewards = (await env.IDEAS.get('rw:' + me.uid, 'json')) || [];
  const meSub = await subscribed(env, Number(me.uid.slice(2)));
  let counted = 0, verifiable = meSub !== null;
  const invited = [];
  for (const i of invitedRaw.slice(0, 60)) {
    const ok = await subscribed(env, i.id);
    if (ok === null) verifiable = false;
    if (ok) { counted++; i.ok_ = true; }
    invited.push({ name: i.name || 'Гость', ok: !!ok });
  }
  if (meSub !== null) {
    const pm = await ptGet(env, me.uid); let ch = false;
    for (const i of invitedRaw.slice(0, 60)) { if (i.ok_ && !pm['ref:' + i.id]) { pm['ref:' + i.id] = 50; ch = true; } }
    if (ch) await env.IDEAS.put('pt:' + me.uid, JSON.stringify(pm));
  }
  const earned = Math.floor(counted / PER), available = meSub ? Math.max(0, earned - rewards.length) : 0;
  return { invited, counted, per: PER, available, spent: rewards.length, meSub: !!meSub, verifiable, unlocked: rewards };
}
async function aesText(raw64, hexKey) {
  const bin = Uint8Array.from(atob(raw64.replace(/\s/g, '')), (c) => c.charCodeAt(0));
  const iv = bin.slice(16, 28), ct = bin.slice(28);
  const key = await crypto.subtle.importKey('raw', Uint8Array.from(hexKey.match(/../g).map((h) => parseInt(h, 16))), 'AES-GCM', false, ['decrypt']);
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct));
}
const isAdmin = (req, env) => env.ADMIN_SECRET && req.headers.get('X-Admin') === env.ADMIN_SECRET;

async function listBy(env, prefix) {
  const out = []; let cursor;
  do {
    const r = await env.IDEAS.list({ prefix, cursor, limit: 1000 });
    for (const k of r.keys) { const v = await env.IDEAS.get(k.name, 'json'); if (v) out.push(Object.assign({ key: k.name }, v)); }
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor && out.length < 2000);
  return out;
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url), path = url.pathname;
    try {
      const mr = await handleMentor(req, env, url, { json, tgUser, isAdmin, tgSend }); if (mr) return mr;
      if (path === '/idea' && req.method === 'POST') {
        const b = await req.json();
        const me = await who(req, env, b.initData, b.device); if (!me) return json(req, { ok: false, error: 'no-identity' }, 400);
        const text = String(b.text || '').trim().slice(0, 600), kind = String(b.kind || '');
        if (text.length < 5 || !KINDS[kind]) return json(req, { ok: false, error: 'bad-input' }, 400);
        const idx = (await env.IDEAS.get('u:' + me.uid, 'json')) || [];
        const today = Date.now() - 86400000;
        if (idx.filter((i) => i.ts > today).length >= 5) return json(req, { ok: false, error: 'limit' }, 429);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const rec = { id, uid: me.uid, name: me.name, username: me.username, kind, text, ts: Date.now(), status: 'new', reason: '' };
        await env.IDEAS.put('i:' + me.uid + ':' + id, JSON.stringify(rec));
        idx.push({ id, ts: rec.ts }); await env.IDEAS.put('u:' + me.uid, JSON.stringify(idx.slice(-50)));
        if (env.NOTIFY_TOKEN && env.NOTIFY_CHAT) {
          const msg = 'Новая идея для ' + (kind === 'video' ? 'видео' : 'статьи') + (me.name ? ' от ' + me.name : '') + ':\n\n' + text + '\n\nОтветить: панель управления → Идеи.';
          await fetch('https://api.telegram.org/bot' + env.NOTIFY_TOKEN + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: env.NOTIFY_CHAT, text: msg }) }).catch(() => {});
        }
        return json(req, { ok: true, id });
      }
      if (path === '/my' && req.method === 'GET') {
        const me = await who(req, env, url.searchParams.get('initData'), url.searchParams.get('device'));
        if (!me) return json(req, []);
        const idx = (await env.IDEAS.get('u:' + me.uid, 'json')) || [], list = [];
        for (const e of idx.slice(-30)) { const v = await env.IDEAS.get('i:' + me.uid + ':' + e.id, 'json'); if (v) list.push(v); }
        return json(req, list.sort((a, b) => b.ts - a.ts).slice(0, 30).map((i) => ({ id: i.id, kind: i.kind, text: i.text, ts: i.ts, status: i.status, reason: i.reason || '' })));
      }
      if (path === '/admin/list' && req.method === 'GET') {
        if (!isAdmin(req, env)) return json(req, { error: 'forbidden' }, 403);
        const list = await listBy(env, 'i:');
        return json(req, list.sort((a, b) => b.ts - a.ts));
      }
      if (path === '/admin/set' && req.method === 'POST') {
        if (!isAdmin(req, env)) return json(req, { error: 'forbidden' }, 403);
        const b = await req.json(), cur = String(b.key || '').startsWith('i:') ? await env.IDEAS.get(b.key, 'json') : null;
        if (!cur || !STATUSES[b.status]) return json(req, { ok: false, error: 'bad-input' }, 400);
        cur.status = b.status; cur.reason = String(b.reason || '').slice(0, 300); cur.upd = Date.now();
        await env.IDEAS.put(b.key, JSON.stringify(cur));
        return json(req, { ok: true });
      }
      if (path === '/ref/claim' && req.method === 'POST') {
        const b = await req.json(), u = await tgUser(b.initData, env.BOT_TOKEN);
        if (!u || !u.id) return json(req, { ok: false, error: 'no-identity' }, 400);
        const m = /^ref_(\d{3,15})$/.exec(String(b.ref || '')); if (!m || Number(m[1]) === u.id) return json(req, { ok: false, error: 'bad-ref' });
        let rec = await env.IDEAS.get('ri:' + u.id, 'json'); const fresh = !rec;
        if (!rec) {
          rec = { ref: m[1], ts: Date.now(), counted: false };
          const key = 'rr:tg' + m[1], list = (await env.IDEAS.get(key, 'json')) || [];
          if (!list.some((x) => x.id === u.id) && list.length < 500) { list.push({ id: u.id, name: u.first_name || '', ts: Date.now() }); await env.IDEAS.put(key, JSON.stringify(list)); }
        }
        const name = u.first_name || 'Друг', subOk = await subscribed(env, u.id);
        if (fresh) {
          await tgSend(env, u.id, 'Спасибо, что зашли по приглашению! 🙌\n\nПодпишитесь на канал: тогда приглашение засчитается вашему другу и он получит бонус.', { text: 'Подписаться на канал', url: CHANNEL_URL });
          await tgSend(env, Number(m[1]), '👋 ' + name + ' открыл(а) Shaton Prime по вашей ссылке.\n\nОсталось подписаться на канал: после этого приглашение засчитается.');
        }
        if (subOk && !rec.counted) {
          rec.counted = true;
          const st = await refState(env, { uid: 'tg' + m[1] }), left = Math.max(0, PER - (st.counted % PER || (st.counted ? PER : 0)));
          const msg = st.available > 0 ? '🎉 Приглашение засчитано, награда готова!\n\nОткройте профиль и выберите платный материал для чтения. Начислено +50 баллов.'
            : '✅ ' + name + ' засчитан(а): +50 баллов. Приглашено: ' + st.counted + '. До награды: ' + left + '.';
          await tgSend(env, Number(m[1]), msg, { text: 'Открыть приложение', web_app: { url: APP } });
        }
        await env.IDEAS.put('ri:' + u.id, JSON.stringify(rec));
        return json(req, { ok: true, counted: !!rec.counted });
      }
      if (path === '/pts/sync' && req.method === 'POST') {
        const b = await req.json(), u = await tgUser(b.initData, env.BOT_TOKEN);
        if (!u || !u.id) return json(req, { ok: false, error: 'no-identity' }, 400);
        const uid = 'tg' + u.id, map = await ptGet(env, uid), ev = b.events && typeof b.events === 'object' ? b.events : {};
        let n = 0;
        for (const k of Object.keys(ev)) {
          if (n++ > 400 || Object.keys(map).length > 1500) break;
          const rule = PT_RULES.find((r) => r[0].test(k)); if (!rule) continue;
          const v = rule[1](Number(ev[k]) || 0);
          if (k.startsWith('game:')) { map[k] = Math.max(map[k] || 0, v); } else if (map[k] == null) map[k] = v;
        }
        map._m = { name: [u.first_name, u.last_name].filter(Boolean).join(' '), username: u.username || '', ts: Date.now() };
        await env.IDEAS.put('pt:' + uid, JSON.stringify(map));
        const out = {}; for (const k of Object.keys(map)) if (k[0] !== '_') out[k] = map[k];
        return json(req, { ok: true, total: ptTotal(map), events: out });
      }
      if (path === '/admin/users' && req.method === 'GET') {
        if (!isAdmin(req, env)) return json(req, { error: 'forbidden' }, 403);
        const out = []; let cursor;
        do {
          const r = await env.IDEAS.list({ prefix: 'pt:', cursor, limit: 1000 });
          for (const k of r.keys) {
            const m = await env.IDEAS.get(k.name, 'json'); if (!m) continue;
            const meta = m._m || {};
            out.push({ uid: k.name.slice(3), name: meta.name || '', username: meta.username || '', total: ptTotal(m), guide: m.guide != null, friends: Object.keys(m).filter((x) => x.startsWith('ref:')).length, ts: meta.ts || 0 });
          }
          cursor = r.list_complete ? null : r.cursor;
        } while (cursor && out.length < 2000);
        return json(req, out.sort((a, b) => b.total - a.total));
      }
      if (path === '/admin/grant' && req.method === 'POST') {
        if (!isAdmin(req, env)) return json(req, { error: 'forbidden' }, 403);
        const b = await req.json(), uid = String(b.uid || ''), key = String(b.key || ''), pts = Math.floor(Number(b.pts) || 0);
        if (!/^tg\d{3,15}$/.test(uid) || !/^(buy|sub|grant):[\w\-]{1,40}$/.test(key) || pts < 1 || pts > 5000) return json(req, { ok: false, error: 'bad-input' }, 400);
        const map = await ptGet(env, uid); map[key] = pts; await env.IDEAS.put('pt:' + uid, JSON.stringify(map));
        await tgSend(env, Number(uid.slice(2)), '⭐ Вам начислено ' + pts + ' баллов в Shaton Prime. Всего: ' + ptTotal(map) + '.');
        return json(req, { ok: true, total: ptTotal(map) });
      }
      if (path === '/ref/me' && req.method === 'GET') {
        const u = await tgUser(url.searchParams.get('initData'), env.BOT_TOKEN);
        if (!u || !u.id) return json(req, { ok: false, error: 'no-identity' }, 400);
        return json(req, Object.assign({ ok: true }, await refState(env, { uid: 'tg' + u.id })));
      }
      if (path === '/ref/redeem' && req.method === 'POST') {
        const b = await req.json(), u = await tgUser(b.initData, env.BOT_TOKEN);
        if (!u || !u.id) return json(req, { ok: false, error: 'no-identity' }, 400);
        const keys = JSON.parse(env.MAT_KEYS || '{}'), id = String(b.id || '');
        if (!keys[id]) return json(req, { ok: false, error: 'bad-material' }, 400);
        const me = { uid: 'tg' + u.id }, st = await refState(env, me);
        if (st.unlocked.includes(id)) return json(req, { ok: true, unlocked: st.unlocked });
        if (st.available < 1) return json(req, { ok: false, error: st.meSub ? 'no-reward' : 'not-subscribed' }, 403);
        const rw = st.unlocked.concat([id]); await env.IDEAS.put('rw:' + me.uid, JSON.stringify(rw));
        return json(req, { ok: true, unlocked: rw });
      }
      if (path === '/mat/text' && req.method === 'POST') {
        const b = await req.json(), u = await tgUser(b.initData, env.BOT_TOKEN);
        if (!u || !u.id) return json(req, { ok: false, error: 'no-identity' }, 400);
        const rw = (await env.IDEAS.get('rw:tg' + u.id, 'json')) || [], id = String(b.id || '');
        const keys = JSON.parse(env.MAT_KEYS || '{}');
        if (!rw.includes(id) || !keys[id]) return json(req, { ok: false, error: 'locked' }, 403);
        const enc = await (await fetch(PAGES + 'posts/enc/' + encodeURIComponent(id) + '.enc?t=' + Date.now())).text();
        return json(req, { ok: true, text: await aesText(enc, keys[id]) });
      }
      if (path === '/lead' && req.method === 'POST') {
        const b = await req.json().catch(() => null); if (!b) return json(req, { ok: false, error: 'bad-json' }, 400);
        const phone = String(b.phone || '').replace(/\D/g, '');
        if (!/^7\d{10}$/.test(phone)) return json(req, { ok: false, error: 'bad-phone' }, 400);
        const ip = req.headers.get('CF-Connecting-IP') || 'x', rk = 'rl:' + ip + ':' + new Date().toISOString().slice(0, 13);
        const n = Number(await env.IDEAS.get(rk)) || 0; if (n >= 5) return json(req, { ok: false, error: 'limit' }, 429);
        await env.IDEAS.put(rk, String(n + 1), { expirationTtl: 3700 });
        const cut = (v, m) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, m);
        const rec = { ts: Date.now(), phone: '+' + phone, comment: cut(b.comment, 300), form: cut(b.form, 30), page: cut(b.page, 80), ref: cut(b.ref, 200), utm: {}, extra: {}, status: 'new' };
        for (const k of Object.keys(b.utm || {}).slice(0, 5)) rec.utm[cut(k, 20)] = cut(b.utm[k], 80);
        for (const k of Object.keys(b.extra || {}).slice(0, 8)) rec.extra[cut(k, 20)] = cut(b.extra[k], 120);
        const id = rec.ts.toString(36) + Math.random().toString(36).slice(2, 6);
        await env.IDEAS.put('ld:' + id, JSON.stringify(rec));
        if (env.NOTIFY_TOKEN && env.NOTIFY_CHAT) {
          const ex = Object.keys(rec.extra).map((k) => k + ': ' + rec.extra[k]).join(', ');
          const msg = '🔔 Новая заявка с сайта\n📞 ' + rec.phone.replace(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/, '+7 ($1) $2-$3-$4') + (rec.comment ? '\n💬 ' + rec.comment : '') + '\n📍 ' + (rec.page || 'index') + ' · форма: ' + (rec.form || '—') + (ex ? '\n📝 ' + ex : '') + (Object.keys(rec.utm).length ? '\n🔗 ' + Object.keys(rec.utm).map((k) => k + '=' + rec.utm[k]).join(' ') : '');
          await fetch('https://api.telegram.org/bot' + env.NOTIFY_TOKEN + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: env.NOTIFY_CHAT, text: msg }) }).catch(() => {});
        }
        return json(req, { ok: true });
      }
      if (path === '/admin/leads' && req.method === 'GET') {
        if (!isAdmin(req, env)) return json(req, { error: 'forbidden' }, 403);
        const out = []; let cursor;
        do {
          const r = await env.IDEAS.list({ prefix: 'ld:', cursor, limit: 1000 });
          for (const k of r.keys) { const v = await env.IDEAS.get(k.name, 'json'); if (v) out.push(Object.assign({ key: k.name }, v)); }
          cursor = r.list_complete ? null : r.cursor;
        } while (cursor && out.length < 1000);
        return json(req, out.sort((a, b) => b.ts - a.ts));
      }
      if (path === '/admin/leads/status' && req.method === 'POST') {
        if (!isAdmin(req, env)) return json(req, { error: 'forbidden' }, 403);
        const b = await req.json(), cur = String(b.key || '').startsWith('ld:') ? await env.IDEAS.get(b.key, 'json') : null;
        if (!cur || !['new', 'done'].includes(b.status)) return json(req, { ok: false, error: 'bad-input' }, 400);
        cur.status = b.status; await env.IDEAS.put(b.key, JSON.stringify(cur)); return json(req, { ok: true });
      }
      if (path === '/tg' && req.method === 'POST') {
        if (!env.TG_SECRET || req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.TG_SECRET) return new Response('forbidden', { status: 403 });
        const upd = await req.json().catch(() => null), m = upd && upd.message;
        if (m && m.chat && m.chat.type === 'private' && m.from && !m.from.is_bot) {
          let ok = false;
          try { ok = await botWelcome(env, m); } catch (e) { ok = false; }
          if (!ok) return new Response('retry', { status: 500 });   // Telegram will redeliver the update
        }
        return new Response('ok');
      }
      if (path === '/admin/botusers' && req.method === 'GET') {
        if (!isAdmin(req, env)) return json(req, { error: 'forbidden' }, 403);
        const out = []; let cursor;
        do {
          const r = await env.IDEAS.list({ prefix: 'bu:', cursor, limit: 1000 });
          for (const k of r.keys) { const v = await env.IDEAS.get(k.name, 'json'); if (v) out.push({ id: k.name.slice(3), name: v.name, username: v.username, ts: Math.floor((v.ts || 0) / 1000) }); }
          cursor = r.list_complete ? null : r.cursor;
        } while (cursor && out.length < 20000);
        return json(req, out);
      }
      return json(req, { error: 'not-found' }, 404);
    } catch (e) { return json(req, { ok: false, error: 'server' }, 500); }
  },
};
