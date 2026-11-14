/* 杯测 · 安卓离线版的数据层
 * 把原来 Node + SQLite 的后端换成浏览器里的 IndexedDB，
 * 拦截所有 /api/* 请求，返回和服务器完全一样的数据结构。
 * 必须在 app.js 之前加载。
 */
(function () {
  "use strict";

  /* ---------------- 工具 ---------------- */
  const ATTR_KEYS = [
    "dryAroma", "wetAroma", "hot", "warm", "cool",
    "aftertaste", "acidity", "sweetness", "body", "overall",
  ];
  const STAGE_KEYS = ["dry", "wet", "hot", "warm", "cool"];
  const SEP_KV = " / ";
  const now = () => new Date().toISOString();
  const today = () => new Date().toISOString().slice(0, 10);
  const t = (s) => (window.I18N && window.I18N.on ? window.I18N.t(s) : s);

  function round(v, n) {
    const p = Math.pow(10, n);
    return Math.round(v * p) / p;
  }
  function normalizeScores(raw) {
    const out = {};
    if (!raw || typeof raw !== "object") return out;
    for (const key of ATTR_KEYS) {
      const v = Number(raw[key]);
      if (Number.isFinite(v)) out[key] = Math.min(10, Math.max(0, Math.round(v * 4) / 4));
    }
    return out;
  }
  function normalizeDefects(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((d) => ({
        desc: String((d && d.desc) || "").slice(0, 80),
        cups: Math.min(10, Math.max(0, Math.round(Number(d && d.cups) || 0))),
        level: d && d.level === "fault" ? "fault" : "taint",
      }))
      .filter((d) => d.cups > 0)
      .slice(0, 20);
  }
  function normalizeTags(raw) {
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.map((x) => String(x).slice(0, 12)).filter(Boolean))].slice(0, 24);
  }
  function normalizeStageTags(raw) {
    const out = {};
    for (const k of STAGE_KEYS) {
      const list = Array.isArray(raw && raw[k]) ? raw[k] : [];
      out[k] = [...new Set(list.map((x) => String(x).slice(0, 12)).filter(Boolean))].slice(0, 12);
    }
    return out;
  }
  function normalizeStageNotes(raw) {
    const out = {};
    if (!raw || typeof raw !== "object") return out;
    for (const k of STAGE_KEYS) {
      const v = raw[k];
      if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, 300);
    }
    return out;
  }
  function totalScore(scores, defects) {
    const sum = ATTR_KEYS.reduce((a, k) => a + (Number(scores && scores[k]) || 0), 0);
    const ded = (defects || []).reduce(
      (a, d) => a + (d.level === "fault" ? 4 : 2) * (Number(d.cups) || 0),
      0
    );
    return Math.max(0, round(sum - ded, 2));
  }

  /* ---------------- IndexedDB ---------------- */
  const DB_NAME = "cupping-local";
  const DB_VER = 1;
  let dbp = null;

  function openDB() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of ["sessions", "samples", "photos", "forgotten"]) {
          if (!db.objectStoreNames.contains(name)) {
            const st = db.createObjectStore(name, { keyPath: "id", autoIncrement: true });
            if (name === "samples") st.createIndex("session_id", "session_id");
            if (name === "photos") {
              st.createIndex("sample_id", "sample_id");
              st.createIndex("session_id", "session_id");
            }
          }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  async function tx(store, mode, fn) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tr = db.transaction(store, mode);
      const os = tr.objectStore(store);
      let out;
      try {
        out = fn(os);
      } catch (err) {
        reject(err);
        return;
      }
      tr.oncomplete = () => resolve(out && out.__req ? out.__req.result : out);
      tr.onerror = () => reject(tr.error);
      tr.onabort = () => reject(tr.error);
    });
  }
  const all = (store) =>
    tx(store, "readonly", (os) => {
      const r = os.getAll();
      return { __req: r };
    });
  const put = (store, row) =>
    tx(store, "readwrite", (os) => {
      const r = os.put(row);
      return { __req: r };
    });
  const del = (store, id) => tx(store, "readwrite", (os) => os.delete(id));
  const clearStore = (store) => tx(store, "readwrite", (os) => os.clear());

  /* ---------------- 照片 ---------------- */
  const urlCache = new Map();

  function photoURL(p) {
    if (urlCache.has(p.id)) return urlCache.get(p.id);
    let u = "";
    try {
      u = URL.createObjectURL(p.blob);
    } catch {
      u = "";
    }
    urlCache.set(p.id, u);
    return u;
  }

  function photoRow(p) {
    return { id: p.id, url: photoURL(p), width: p.width, height: p.height };
  }

  async function liveRows(store) {
    const rows = await all(store);
    return rows.filter((r) => !r.deleted_at);
  }

  async function samplesOf(sessionId) {
    const rows = (await liveRows("samples")).filter((s) => s.session_id === sessionId);
    rows.sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id));
    return rows;
  }

  async function photosFor({ sampleId = null, sessionId = null }) {
    const rows = (await liveRows("photos")).filter((p) =>
      sampleId ? p.sample_id === sampleId : p.session_id === sessionId && !p.sample_id
    );
    rows.sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id));
    return rows.map(photoRow);
  }

  /* ---------------- 序列化（与 server.js 一致） ---------------- */
  async function sampleOut(row) {
    const scores = row.scores || {};
    const defects = row.defects || [];
    return {
      id: row.id,
      sessionId: row.session_id,
      name: row.name,
      origin: row.origin,
      process: row.process,
      variety: row.variety,
      roastLevel: row.roast_level,
      roastDate: row.roast_date,
      roaster: row.roaster || "",
      restDays: row.rest_days === undefined ? null : row.rest_days,
      dose: row.dose,
      waterGrams: row.water_grams,
      waterTemp: row.water_temp,
      grind: row.grind,
      scores,
      defects,
      tags: row.tags || [],
      stageTags: normalizeStageTags(row.stage_tags),
      stageNotes: normalizeStageNotes(row.stage_notes),
      note: row.note,
      total: totalScore(scores, defects),
      photos: await photosFor({ sampleId: row.id }),
    };
  }

  async function sessionOut(row) {
    const list = await samplesOf(row.id);
    const samples = [];
    for (const s of list) samples.push(await sampleOut(s));
    return {
      id: row.id,
      title: row.title,
      cuppedOn: row.cupped_on,
      host: row.host,
      note: row.note,
      photos: await photosFor({ sessionId: row.id }),
      samples,
    };
  }

  async function sessionList() {
    const rows = (await liveRows("sessions")).sort(
      (a, b) => (a.cupped_on < b.cupped_on ? 1 : a.cupped_on > b.cupped_on ? -1 : b.id - a.id)
    );
    const out = [];
    for (const row of rows) {
      const samples = await samplesOf(row.id);
      const totals = samples.map((s) => totalScore(s.scores || {}, s.defects || []));
      const own = await photosFor({ sessionId: row.id });
      const samplePhotos = [];
      for (const s of samples) samplePhotos.push(...(await photosFor({ sampleId: s.id })));
      const thumbs = [...own, ...samplePhotos].slice(0, 4).map((p) => p.url);
      out.push({
        id: row.id,
        title: row.title,
        cuppedOn: row.cupped_on,
        host: row.host,
        sampleCount: samples.length,
        photoCount: own.length + samplePhotos.length,
        topScore: totals.length ? Math.max(...totals) : 0,
        thumbs,
      });
    }
    return out;
  }

  /* ---------------- 业务 ---------------- */
  async function getSession(id) {
    const row = (await all("sessions")).find((r) => r.id === Number(id) && !r.deleted_at);
    if (!row) throw httpError(404, t("场次不存在"));
    return row;
  }
  async function getSample(id) {
    const row = (await all("samples")).find((r) => r.id === Number(id) && !r.deleted_at);
    if (!row) throw httpError(404, t("样品不存在"));
    return row;
  }

  function httpError(status, message) {
    const e = new Error(message);
    e.status = status;
    return e;
  }

  function newSampleRow(sessionId, name, sortOrder) {
    const ts = now();
    return {
      session_id: sessionId,
      name,
      origin: "",
      process: "",
      variety: "",
      roast_level: "",
      roast_date: "",
      rest_days: null,
      roaster: "",
      dose: 8.25,
      water_grams: 150,
      water_temp: 93,
      grind: "中粗",
      scores: {},
      defects: [],
      tags: [],
      stage_tags: {},
      stage_notes: {},
      note: "",
      sort_order: sortOrder,
      created_at: ts,
      updated_at: ts,
      deleted_at: null,
    };
  }

  async function createSession(body) {
    const title = String(body.title || "").trim() || `${today()} 杯测`;
    const date = String(body.cuppedOn || "").trim() || today();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw httpError(400, t("日期格式应为 YYYY-MM-DD"));
    const ts = now();
    const id = await put("sessions", {
      title,
      cupped_on: date,
      host: String(body.host || "").trim(),
      note: String(body.note || ""),
      created_at: ts,
      updated_at: ts,
      deleted_at: null,
    });
    const n = Math.max(0, Math.min(40, Number(body.sampleCount) || 0));
    for (let i = 0; i < n; i++) await put("samples", newSampleRow(id, `样品 ${i + 1}`, i));
    return sessionOut(await getSession(id));
  }

  async function patchSession(id, body) {
    const row = await getSession(id);
    if (body.title !== undefined) row.title = String(body.title).trim() || row.title;
    if (body.cuppedOn !== undefined) row.cupped_on = String(body.cuppedOn).trim();
    if (body.host !== undefined) row.host = String(body.host).trim();
    if (body.note !== undefined) row.note = String(body.note);
    row.updated_at = now();
    await put("sessions", row);
    return sessionOut(await getSession(id));
  }

  async function softDeleteSession(id) {
    const row = await getSession(id);
    const ts = now();
    row.deleted_at = ts;
    await put("sessions", row);
    for (const s of (await all("samples")).filter((x) => x.session_id === row.id && !x.deleted_at)) {
      s.deleted_at = ts;
      await put("samples", s);
    }
    for (const p of (await all("photos")).filter((x) => x.session_id === row.id && !x.deleted_at)) {
      p.deleted_at = ts;
      await put("photos", p);
    }
    return { ok: true };
  }

  async function duplicateSession(id) {
    const row = await getSession(id);
    const ts = now();
    const newId = await put("sessions", {
      title: `${row.title} 复测`,
      cupped_on: today(),
      host: row.host,
      note: row.note,
      created_at: ts,
      updated_at: ts,
      deleted_at: null,
    });
    const list = await samplesOf(row.id);
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      await put("samples", {
        ...newSampleRow(newId, s.name, i),
        origin: s.origin,
        process: s.process,
        variety: s.variety,
        roast_level: s.roast_level,
        roast_date: s.roast_date,
        rest_days: s.rest_days,
        roaster: s.roaster || "",
        dose: s.dose,
        water_grams: s.water_grams,
        water_temp: s.water_temp,
        grind: s.grind,
      });
    }
    return sessionOut(await getSession(newId));
  }

  async function addSamples(sessionId, body) {
    const session = await getSession(sessionId);
    const count = (await samplesOf(session.id)).length;
    const n = Math.max(1, Math.min(40, Number(body.count) || 1));
    const out = [];
    for (let i = 0; i < n; i++) {
      const name = String(body.name || `样品 ${count + i + 1}`).trim();
      const id = await put("samples", newSampleRow(session.id, name, count + i));
      out.push(await sampleOut(await getSample(id)));
    }
    return n === 1 ? out[0] : out;
  }

  async function patchSample(id, b) {
    const row = await getSample(id);
    const str = (key, col) => (b[key] !== undefined ? String(b[key]).trim().slice(0, 200) : row[col]);
    const dateStr = (key, col) => {
      if (b[key] === undefined) return row[col];
      const v = String(b[key]).trim().slice(0, 10);
      if (v === "") return "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return row[col];
      const y = Number(v.slice(0, 4));
      if (y < 1980 || y > 2100) return row[col];
      return v;
    };
    const num = (key, col) => {
      if (b[key] === undefined) return row[col];
      if (b[key] === null || b[key] === "") return null;
      const v = Number(b[key]);
      return Number.isFinite(v) ? v : null;
    };
    const next = {
      ...row,
      name: str("name", "name") || row.name,
      origin: str("origin", "origin"),
      process: str("process", "process"),
      variety: str("variety", "variety"),
      roast_level: str("roastLevel", "roast_level"),
      roast_date: dateStr("roastDate", "roast_date"),
      rest_days: num("restDays", "rest_days"),
      roaster: str("roaster", "roaster"),
      dose: num("dose", "dose"),
      water_grams: num("waterGrams", "water_grams"),
      water_temp: num("waterTemp", "water_temp"),
      grind: str("grind", "grind"),
      scores: b.scores !== undefined ? normalizeScores(b.scores) : row.scores,
      defects: b.defects !== undefined ? normalizeDefects(b.defects) : row.defects,
      tags: b.tags !== undefined ? normalizeTags(b.tags) : row.tags,
      stage_tags: b.stageTags !== undefined ? normalizeStageTags(b.stageTags) : row.stage_tags,
      stage_notes: b.stageNotes !== undefined ? normalizeStageNotes(b.stageNotes) : row.stage_notes,
      note: b.note !== undefined ? String(b.note).slice(0, 4000) : row.note,
      updated_at: now(),
    };
    await put("samples", next);
    return sampleOut(await getSample(id));
  }

  async function softDeleteSample(id) {
    const row = await getSample(id);
    const ts = now();
    row.deleted_at = ts;
    await put("samples", row);
    for (const p of (await all("photos")).filter((x) => x.sample_id === row.id && !x.deleted_at)) {
      p.deleted_at = ts;
      await put("photos", p);
    }
    return { ok: true };
  }

  async function moveSample(id, direction) {
    const row = await getSample(id);
    const list = await samplesOf(row.session_id);
    const i = list.findIndex((s) => s.id === row.id);
    const delta = direction === "up" ? -1 : 1;
    const swap = list[i + delta];
    if (!swap) return { ok: true };
    const a = list[i];
    const b = swap;
    const ao = a.sort_order;
    a.sort_order = b.sort_order;
    b.sort_order = ao;
    await put("samples", a);
    await put("samples", b);
    return { ok: true };
  }

  async function uploadPhoto(form) {
    const file = form.get("file");
    if (!file || typeof file === "string") throw httpError(400, t("没有收到图片"));
    const mime = String(file.type || "").toLowerCase();
    if (!mime.startsWith("image/")) throw httpError(415, t("只接受图片文件"));
    const sampleId = Number(form.get("sample_id")) || null;
    const sessionId = Number(form.get("session_id")) || null;
    if (sampleId) await getSample(sampleId);
    else if (sessionId) await getSession(sessionId);
    else throw httpError(400, t("缺少 sample_id 或 session_id"));
    const rows = await liveRows("photos");
    const same = rows.filter((p) =>
      sampleId ? p.sample_id === sampleId : p.session_id === sessionId && !p.sample_id
    );
    const id = await put("photos", {
      session_id: sampleId ? null : sessionId,
      sample_id: sampleId,
      blob: file,
      width: Number(form.get("width")) || 0,
      height: Number(form.get("height")) || 0,
      bytes: file.size || 0,
      sort_order: same.length,
      created_at: now(),
      deleted_at: null,
    });
    const row = (await all("photos")).find((p) => p.id === id);
    return { status: 201, body: photoRow(row) };
  }

  async function known() {
    const gone = new Set(
      (await all("forgotten")).map((r) => `${r.field}|${r.origin}|${r.value}`)
    );
    const keep = (field, origin, v) =>
      !gone.has(`${field}|${origin}|${v}`) && !gone.has(`${field}||${v}`);

    const sessions = new Map((await liveRows("sessions")).map((s) => [s.id, s]));
    const samples = (await liveRows("samples")).filter((s) => sessions.has(s.session_id));

    const varietyByOrigin = {};
    const varietyAll = [];
    for (const s of samples) {
      const origin = String(s.origin || "").trim();
      const raw = String(s.variety || "").trim();
      if (!raw) continue;
      raw.split(SEP_KV).map((x) => x.trim()).filter(Boolean).forEach((v) => {
        if (!keep("variety", origin, v)) return;
        if (!varietyByOrigin[origin]) varietyByOrigin[origin] = [];
        if (!varietyByOrigin[origin].includes(v)) varietyByOrigin[origin].push(v);
        if (!varietyAll.includes(v)) varietyAll.push(v);
      });
    }
    for (const k of Object.keys(varietyByOrigin)) varietyByOrigin[k].sort();
    varietyAll.sort();
    const flat = (col, field) => {
      const set = new Set(
        samples.map((s) => String(s[col] || "").trim()).filter(Boolean)
      );
      return [...set].filter((v) => keep(field, "", v)).sort();
    };
    return {
      origin: flat("origin", "origin"),
      process: flat("process", "process"),
      roastLevel: flat("roast_level", "roastLevel"),
      roaster: flat("roaster", "roaster"),
      varietyByOrigin,
      varietyAll,
    };
  }

  async function forget(body) {
    const field = String(body.field || "").trim();
    const origin = String(body.origin || "").trim();
    const value = String(body.value || "").trim();
    if (!field || !value) throw httpError(400, t("参数不全"));
    const rows = await all("forgotten");
    if (!rows.some((r) => r.field === field && r.origin === origin && r.value === value)) {
      await put("forgotten", { field, origin, value, created_at: now() });
    }
    return { ok: true };
  }

  async function beansIndex() {
    const sessions = (await liveRows("sessions")).sort(
      (a, b) => (a.cupped_on < b.cupped_on ? 1 : a.cupped_on > b.cupped_on ? -1 : b.id - a.id)
    );
    const out = [];
    for (const se of sessions) {
      for (const s of await samplesOf(se.id)) {
        const scores = s.scores || {};
        const defects = s.defects || [];
        const st = normalizeStageTags(s.stage_tags);
        const tags = [];
        for (const k of STAGE_KEYS) for (const x of st[k] || []) if (!tags.includes(x)) tags.push(x);
        out.push({
          id: s.id,
          sessionId: s.session_id,
          sessionTitle: se.title,
          sessionDate: se.cupped_on,
          name: s.name,
          origin: s.origin,
          process: s.process,
          variety: s.variety,
          roastLevel: s.roast_level,
          roaster: s.roaster || "",
          total: totalScore(scores, defects),
          tags,
          scored: ATTR_KEYS.some((k) => Number(scores[k]) > 0),
        });
      }
    }
    return out;
  }

  /* ---------------- 回收站 ---------------- */
  const TRASH_KEEP_DAYS = 30;
  function expiresAt(deletedAt) {
    const ms = Date.parse(deletedAt || "");
    if (!Number.isFinite(ms)) return null;
    return new Date(ms + TRASH_KEEP_DAYS * 864e5).toISOString();
  }

  async function trashList() {
    const sessionsRows = (await all("sessions")).filter((r) => r.deleted_at);
    const samplesRows = (await all("samples")).filter((r) => r.deleted_at);
    const photosRows = (await all("photos")).filter((r) => r.deleted_at);
    const sesMap = new Map((await all("sessions")).map((s) => [s.id, s]));
    const byDeleted = (a, b) => (a.deleted_at < b.deleted_at ? 1 : -1);
    sessionsRows.sort(byDeleted);
    samplesRows.sort(byDeleted);
    photosRows.sort(byDeleted);
    return {
      keepDays: TRASH_KEEP_DAYS,
      sessions: sessionsRows.map((s) => ({
        id: s.id,
        title: s.title,
        cuppedOn: s.cupped_on,
        deletedAt: s.deleted_at,
        expiresAt: expiresAt(s.deleted_at),
      })),
      samples: samplesRows.map((s) => ({
        id: s.id,
        name: s.name,
        sessionTitle: (sesMap.get(s.session_id) || {}).title || "",
        deletedAt: s.deleted_at,
        expiresAt: expiresAt(s.deleted_at),
      })),
      photos: photosRows.map((p) => ({
        id: p.id,
        url: photoURL(p),
        deletedAt: p.deleted_at,
        expiresAt: expiresAt(p.deleted_at),
      })),
    };
  }

  async function trashRestore({ type, id }) {
    const n = Number(id);
    const sessions = await all("sessions");
    const samples = await all("samples");
    const photos = await all("photos");
    if (type === "session") {
      const row = sessions.find((r) => r.id === n);
      if (!row) throw httpError(404, t("不存在"));
      const ts = row.deleted_at;
      row.deleted_at = null;
      await put("sessions", row);
      for (const s of samples.filter((x) => x.session_id === n && x.deleted_at === ts)) {
        s.deleted_at = null;
        await put("samples", s);
      }
      for (const p of photos.filter((x) => x.session_id === n && x.deleted_at === ts)) {
        p.deleted_at = null;
        await put("photos", p);
      }
    } else if (type === "sample") {
      const row = samples.find((r) => r.id === n);
      if (!row) throw httpError(404, t("不存在"));
      const ts = row.deleted_at;
      row.deleted_at = null;
      await put("samples", row);
      for (const p of photos.filter((x) => x.sample_id === n && x.deleted_at === ts)) {
        p.deleted_at = null;
        await put("photos", p);
      }
    } else if (type === "photo") {
      const row = photos.find((r) => r.id === n);
      if (row) {
        row.deleted_at = null;
        await put("photos", row);
      }
    } else {
      throw httpError(400, t("类型不对"));
    }
    return { ok: true };
  }

  async function trashPurge({ type, id, all: allFlag }) {
    if (allFlag) {
      for (const p of (await all("photos")).filter((x) => x.deleted_at)) await del("photos", p.id);
      for (const s of (await all("samples")).filter((x) => x.deleted_at)) await del("samples", s.id);
      for (const s of (await all("sessions")).filter((x) => x.deleted_at)) await del("sessions", s.id);
      return { ok: true };
    }
    const n = Number(id);
    if (type === "session") {
      for (const p of (await all("photos")).filter((x) => x.session_id === n)) await del("photos", p.id);
      for (const s of (await all("samples")).filter((x) => x.session_id === n)) await del("samples", s.id);
      await del("sessions", n);
    } else if (type === "sample") {
      for (const p of (await all("photos")).filter((x) => x.sample_id === n)) await del("photos", p.id);
      await del("samples", n);
    } else if (type === "photo") {
      await del("photos", n);
    } else {
      throw httpError(400, t("类型不对"));
    }
    return { ok: true };
  }

  /* ---------------- 导出 ---------------- */
  const STAGE_META = [
    ["dry", "干香", "dryAroma"],
    ["wet", "湿香", "wetAroma"],
    ["hot", "高温", "hot"],
    ["warm", "中温", "warm"],
    ["cool", "低温", "cool"],
  ];
  const IMAGE_STAGES = new Set(["dry", "wet"]);
  const EXTRA_LABEL = {
    aftertaste: "余韵",
    acidity: "酸质",
    sweetness: "甜感",
    body: "口感",
    overall: "总体",
  };

  function titleOut(title) {
    const s = String(title || "");
    const m = s.match(/^(\d{4}-\d{2}-\d{2}) 杯测$/);
    if (m) {
      const word = { en: "Cupping", ja: "カッピング", ko: "커핑" }[window.I18N && window.I18N.lang];
      return word ? `${m[1]} ${word}` : s;
    }
    return s;
  }

  function termOut(v) {
    return v ? t(v) : "";
  }

  function sep() {
    return window.I18N && window.I18N.on ? ", " : "、";
  }

  function bundleToText(se) {
    const out = [];
    out.push(titleOut(se.title));
    out.push(`${se.cuppedOn} · ${se.samples.length} ${t("支样品")}`);
    out.push("");

    se.samples.forEach((s, i) => {
      const beans = [s.origin, s.name, s.variety, s.process, s.roastDate, s.roastLevel];
      if (s.roaster) beans.push(`${t("烘焙机")} ${s.roaster}`);
      if (s.restDays !== null && s.restDays !== undefined && s.restDays !== "") {
        beans.push(t("养豆") + " " + s.restDays + " " + t("天"));
      }
      const bits = beans.map((x) => String(x || "").trim()).filter(Boolean);
      out.push(`${i + 1}. ${bits.join(" · ")}　${t("合计")} ${s.total} / 50`);

      const colon = window.I18N && window.I18N.on ? ": " : "：";
      for (const [key, label, attr] of STAGE_META) {
        const v = s.scores && s.scores[attr];
        const tags = ((s.stageTags || {})[key] || []).map(termOut).filter(Boolean);
        const name = termOut(label);
        out.push(`${name}${colon}${v === undefined || v === null ? "" : v}`.trimEnd());
        if (tags.length) out.push(tags.join(sep()));
      }

      const extra = ["aftertaste", "acidity", "sweetness", "body", "overall"].filter(
        (k) => s.scores && s.scores[k] !== undefined && s.scores[k] !== null
      );
      if (extra.length) {
        out.push(extra.map((k) => `${termOut(EXTRA_LABEL[k] || k)} ${s.scores[k]}`).join(" · "));
      }

      if (s.defects && s.defects.length) {
        const ded = s.defects.reduce(
          (a, d) => a + (d.level === "fault" ? 4 : 2) * (Number(d.cups) || 1),
          0
        );
        const items = s.defects.map((x) => {
          const cups = Number(x.cups) || 1;
          return `${termOut(x.desc) || t("瑕疵")}（${t(x.level === "fault" ? "缺陷" : "瑕疵")} ${cups} ${t("杯")}）`;
        });
        out.push(`${t("扣分")} −${ded}　${items.join(window.I18N && window.I18N.on ? "; " : "；")}`);
      }

      if (s.note) out.push(`${t("备注")}：${s.note}`);
      out.push("");
    });

    return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
  }

  function csvCell(v) {
    const s = String(v === undefined || v === null ? "" : v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function bundleToCsv(se) {
    const head = [
      "场次", "日期", "样品序号", "产地", "豆子名称", "品种", "处理法", "烘焙日", "烘焙度", "养豆天数", "烘焙机",
      "干香分", "干香风味", "湿香分", "湿香风味", "高温分", "高温风味", "中温分", "中温风味",
      "低温分", "低温风味", "余韵", "酸质", "甜感", "口感", "总体", "扣分", "扣分项", "合计", "备注",
    ].map(t);
    const rows = [head];
    se.samples.forEach((s, i) => {
      const g = (attr) => (s.scores && s.scores[attr] !== undefined && s.scores[attr] !== null ? s.scores[attr] : "");
      const tag = (key) => ((s.stageTags || {})[key] || []).map(termOut).join(sep());
      const dedNum = (s.defects || []).reduce(
        (a, d) => a + (d.level === "fault" ? 4 : 2) * (Number(d.cups) || 1),
        0
      );
      const ded = (s.defects || [])
        .map((x) => `${termOut(x.desc) || t("瑕疵")}（${t(x.level === "fault" ? "缺陷" : "瑕疵")} ${x.cups} ${t("杯")}）`)
        .join(sep());
      rows.push([
        titleOut(se.title), se.cuppedOn, i + 1,
        termOut(s.origin), termOut(s.name), termOut(s.variety), termOut(s.process),
        s.roastDate, termOut(s.roastLevel), s.restDays === null ? "" : s.restDays, s.roaster || "",
        g("dryAroma"), tag("dry"), g("wetAroma"), tag("wet"), g("hot"), tag("hot"),
        g("warm"), tag("warm"), g("cool"), tag("cool"),
        g("aftertaste"), g("acidity"), g("sweetness"), g("body"), g("overall"),
        dedNum || "", ded, s.total, s.note,
      ]);
    });
    return "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  }

  async function exportText(kind, id, format) {
    const bundles = [];
    if (kind === "all") {
      for (const s of await sessionList()) bundles.push(await sessionOut(await getSession(s.id)));
    } else {
      bundles.push(await sessionOut(await getSession(id)));
    }
    if (format === "csv") {
      const blocks = bundles.map((b) => bundleToCsv(b));
      return blocks.length === 1
        ? blocks[0]
        : blocks[0] + "\r\n" +
          blocks.slice(1).map((x) => x.replace(/^\uFEFF/, "").split("\r\n").slice(1).join("\r\n")).join("\r\n");
    }
    return bundles.map((b) => bundleToText(b)).join("\n\n");
  }

  /* ---------------- 备份 / 恢复 ---------------- */
  async function backupJSON() {
    const photos = [];
    for (const p of await all("photos")) {
      let data = "";
      try {
        data = await blobToDataURL(p.blob);
      } catch {
        data = "";
      }
      photos.push({
        id: p.id,
        session_id: p.session_id,
        sample_id: p.sample_id,
        width: p.width,
        height: p.height,
        bytes: p.bytes,
        sort_order: p.sort_order,
        created_at: p.created_at,
        deleted_at: p.deleted_at,
        data,
      });
    }
    return JSON.stringify(
      {
        app: "cupping-local",
        version: 1,
        exportedAt: now(),
        sessions: await all("sessions"),
        samples: await all("samples"),
        photos,
        forgotten: await all("forgotten"),
      },
      null,
      1
    );
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  }

  function dataURLToBlob(url) {
    const m = /^data:([^;,]*)(;base64)?,(.*)$/.exec(url || "");
    if (!m) return null;
    const mime = m[1] || "image/jpeg";
    if (m[2]) {
      const bin = atob(m[3]);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return new Blob([buf], { type: mime });
    }
    return new Blob([decodeURIComponent(m[3])], { type: mime });
  }

  async function restoreFromJSON(text) {
    const data = JSON.parse(text);
    if (!data || data.app !== "cupping-local") throw new Error(t("这不是本应用的备份文件"));
    for (const name of ["sessions", "samples", "photos", "forgotten"]) await clearStore(name);
    urlCache.clear();
    const rows = (data.sessions || []).slice();
    for (const r of rows) await put("sessions", r);
    for (const r of data.samples || []) await put("samples", r);
    for (const r of data.photos || []) {
      const blob = dataURLToBlob(r.data);
      const copy = { ...r };
      delete copy.data;
      copy.blob = blob || new Blob([], { type: "image/jpeg" });
      await put("photos", copy);
    }
    for (const r of data.forgotten || []) await put("forgotten", r);
    return { ok: true, sessions: (data.sessions || []).length };
  }

  /* ---------------- 路由 ---------------- */
  const ROUTES = [];
  const route = (method, pattern, handler) => ROUTES.push({ method, pattern, handler });

  route("GET", /^\/api\/sessions$/, () => sessionList());
  route("POST", /^\/api\/sessions$/, (ctx) => createSession(ctx.body));
  route("GET", /^\/api\/sessions\/(\d+)$/, async (ctx, id) => sessionOut(await getSession(id)));
  route("PATCH", /^\/api\/sessions\/(\d+)$/, (ctx, id) => patchSession(id, ctx.body));
  route("DELETE", /^\/api\/sessions\/(\d+)$/, (ctx, id) => softDeleteSession(id));
  route("POST", /^\/api\/sessions\/(\d+)\/duplicate$/, (ctx, id) => duplicateSession(id));
  route("POST", /^\/api\/sessions\/(\d+)\/samples$/, (ctx, id) => addSamples(id, ctx.body));

  route("GET", /^\/api\/known$/, () => known());
  route("POST", /^\/api\/known\/forget$/, (ctx) => forget(ctx.body));
  route("GET", /^\/api\/beans-index$/, () => beansIndex());

  route("PATCH", /^\/api\/samples\/(\d+)$/, (ctx, id) => patchSample(id, ctx.body));
  route("DELETE", /^\/api\/samples\/(\d+)$/, (ctx, id) => softDeleteSample(id));
  route("POST", /^\/api\/samples\/(\d+)\/move$/, (ctx, id) => moveSample(id, ctx.body.direction));

  route("POST", /^\/api\/upload$/, (ctx) => uploadPhoto(ctx.form));
  route("DELETE", /^\/api\/photos\/(\d+)$/, async (ctx, id) => {
    const row = (await all("photos")).find((p) => p.id === Number(id) && !p.deleted_at);
    if (!row) throw httpError(404, t("图片不存在"));
    row.deleted_at = now();
    await put("photos", row);
    return { ok: true };
  });

  route("GET", /^\/api\/trash$/, () => trashList());
  route("POST", /^\/api\/trash\/restore$/, (ctx) => trashRestore(ctx.body));
  route("POST", /^\/api\/trash\/purge$/, (ctx) => trashPurge(ctx.body));

  async function dispatch(method, pathname, search, body, form) {
    for (const r of ROUTES) {
      if (r.method !== method) continue;
      const m = pathname.match(r.pattern);
      if (!m) continue;
      const out = await r.handler({ body: body || {}, form, search }, m[1]);
      return out;
    }
    throw httpError(404, "接口不存在: " + pathname);
  }

  /* ---------------- fetch 拦截 ---------------- */
  const realFetch = window.fetch ? window.fetch.bind(window) : null;

  async function readBody(input, init) {
    if (init && init.body instanceof FormData) return { form: init.body };
    if (init && typeof init.body === "string") {
      try {
        return { body: init.body ? JSON.parse(init.body) : {} };
      } catch {
        return { body: {} };
      }
    }
    if (input instanceof Request) {
      const type = (init && init.method) || input.method;
      if (type === "POST" || type === "PATCH" || type === "PUT") {
        const ct = input.headers.get("content-type") || "";
        if (ct.includes("multipart/form-data")) return { form: await input.formData() };
        const text = await input.text();
        try {
          return { body: text ? JSON.parse(text) : {} };
        } catch {
          return { body: {} };
        }
      }
    }
    return { body: {} };
  }

  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : (input && input.url) || "";
    let u;
    try {
      u = new URL(url, location.href);
    } catch {
      return realFetch ? realFetch(input, init) : Promise.reject(new Error("bad url"));
    }
    if (!u.pathname.startsWith("/api/")) {
      return realFetch ? realFetch(input, init) : Promise.reject(new Error("offline"));
    }
    const method = ((init && init.method) || (input && input.method) || "GET").toUpperCase();
    const { body, form } = await readBody(input, init);
    try {
      const out = await dispatch(method, u.pathname, u.searchParams, body, form);
      const payload = out && out.body !== undefined ? out.body : out;
      const status = (out && out.status) || 200;
      return new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || "出错了" }), {
        status: err.status || 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
  };

  window.__LOCAL_EXPORT = async function (kind, id, format) {
    return exportText(kind, id, format);
  };
  window.__LOCAL_BACKUP = backupJSON;
  window.__LOCAL_RESTORE = restoreFromJSON;
  window.__LOCAL_IS_LOCAL = true;
})();
