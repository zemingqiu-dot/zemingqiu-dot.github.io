/* 咖啡杯测 —— 前端（零构建，原生 JS） */

/* 少数直接写进属性（placeholder 等）的界面词，按语言取一份；
   其余界面文案由 i18n.js 在渲染后统一替换。 */
function L4(zh, en, ja, ko) {
  const l = (window.I18N && window.I18N.lang) || "zh";
  return ({ zh, en, ja, ko })[l] || zh;
}

const ATTRS = [
  ["dryAroma", "干香"],
  ["wetAroma", "湿香"],
  ["hot", "高温"],
  ["warm", "中温"],
  ["cool", "低温"],
];
/* 需要单独记录风味的环节 */
const NOTE_STAGES = [
  { key: "dry", label: "干香", attr: "dryAroma", hint: "磨粉后闻" },
  { key: "wet", label: "湿香", attr: "wetAroma", hint: "注水破渣后闻" },
  { key: "hot", label: "高温", attr: "hot", hint: "刚入口，约 70℃" },
  { key: "warm", label: "中温", attr: "warm", hint: "约 50℃，风味展开" },
  { key: "cool", label: "低温", attr: "cool", hint: "凉了之后，约 35℃" },
];

/* 五个环节之外还要打分的项目 */

/* 产地：只到产国，不细分产区（细分产区填在「品种」外的备注里） */
const ORIGINS = [
  { g: "非洲", items: [
    "埃塞俄比亚", "肯尼亚", "卢旺达", "布隆迪", "坦桑尼亚", "乌干达", "也门",
  ]},
  { g: "中南美洲", items: [
    "巴拿马", "哥伦比亚", "巴西", "秘鲁", "玻利维亚", "厄瓜多尔", "墨西哥",
    "危地马拉", "哥斯达黎加", "洪都拉斯", "萨尔瓦多", "尼加拉瓜", "牙买加", "多米尼加",
  ]},
  { g: "亚洲与太平洋", items: [
    "印度尼西亚", "印度", "越南", "泰国", "巴布亚新几内亚", "中国", "夏威夷",
  ]},
];

/* 处理法 */
const PROCESSES = [
  { g: "常规", items: ["水洗", "日晒", "蜜处理", "黄蜜", "红蜜", "黑蜜", "半水洗", "湿刨法"] },
  { g: "特殊发酵", items: [
    "厌氧日晒", "厌氧水洗", "二氧化碳浸渍", "酒桶发酵", "酵母发酵",
    "乳酸菌发酵", "果肉日晒", "去果胶日晒",
  ]},
];

/* 品种 */
const VARIETIES = [
  { g: "常见", items: [
    "铁皮卡 Typica", "波旁 Bourbon", "粉红波旁", "卡杜拉 Caturra", "卡杜艾 Catuai",
    "蒙多诺沃 Mundo Novo", "帕卡斯 Pacas", "维拉萨奇 Villa Sarchi",
  ]},
  { g: "东非系", items: [
    "SL28", "SL34", "Ruiru 11", "Batian", "K7", "Kents",
    "埃塞原生种 Heirloom", "Kurume", "Wolisho", "Dega", "74110", "74112", "74158",
    "尖身波旁 Bourbon Pointu", "Mibirizi", "N39", "SL14",
  ]},
  { g: "精品/稀有", items: [
    "瑰夏 Geisha", "帕卡玛拉 Pacamara", "象豆 Maragogype", "Wush Wush",
    "Sidra", "Mokka", "Java", "Arusha",
  ]},
  { g: "抗病/杂交", items: [
    "卡蒂姆 Catimor", "卡斯蒂略 Castillo", "哥伦比亚种 Colombia", "Tabi",
    "IHCAFE 90", "Lempira", "S795", "Cauvery", "Catucai", "Obata", "Icatu",
  ]},
  { g: "美洲/其他特色", items: [
    "Pache", "Villa Lobos", "Garnica", "Kona Typica", "蓝山 Blue Mountain",
    "Jember", "Sidikalang", "Ateng", "Gayo", "Kartika", "Selection 9", "罗布斯塔 Robusta",
  ]},
];

/* 各产国的主力品种：选定产国后，这些会单独置顶成「本地常见」一组，方便先选
 * 下面的固定分组顺序不受影响，找不到再往下翻。 */
const VARIETY_LOCAL = {
  "埃塞俄比亚": ["埃塞原生种 Heirloom", "Kurume", "Wolisho", "Dega", "74110", "74112", "74158"],
  "肯尼亚": ["SL28", "SL34", "Ruiru 11", "Batian", "K7", "Kents"],
  "卢旺达": ["尖身波旁 Bourbon Pointu", "Mibirizi", "波旁 Bourbon", "卡杜拉 Caturra"],
  "布隆迪": ["尖身波旁 Bourbon Pointu", "Mibirizi", "波旁 Bourbon"],
  "坦桑尼亚": ["波旁 Bourbon", "Kents", "N39", "铁皮卡 Typica"],
  "乌干达": ["铁皮卡 Typica", "Kents", "SL14", "SL28"],
  "也门": ["铁皮卡 Typica", "波旁 Bourbon"],
  "巴拿马": ["瑰夏 Geisha", "铁皮卡 Typica", "波旁 Bourbon", "卡杜拉 Caturra", "帕卡玛拉 Pacamara"],
  "哥伦比亚": ["卡斯蒂略 Castillo", "卡杜拉 Caturra", "哥伦比亚种 Colombia", "Tabi", "瑰夏 Geisha", "粉红波旁"],
  "巴西": ["卡杜艾 Catuai", "蒙多诺沃 Mundo Novo", "波旁 Bourbon", "Catucai", "Obata", "Icatu"],
  "秘鲁": ["铁皮卡 Typica", "波旁 Bourbon", "卡杜拉 Caturra", "Pache", "卡蒂姆 Catimor"],
  "玻利维亚": ["铁皮卡 Typica", "波旁 Bourbon", "卡杜拉 Caturra", "卡杜艾 Catuai"],
  "厄瓜多尔": ["Sidra", "铁皮卡 Typica", "波旁 Bourbon", "卡杜拉 Caturra", "瑰夏 Geisha"],
  "墨西哥": ["铁皮卡 Typica", "波旁 Bourbon", "卡杜拉 Caturra", "象豆 Maragogype", "Garnica"],
  "危地马拉": ["波旁 Bourbon", "卡杜拉 Caturra", "卡杜艾 Catuai", "Pache", "帕卡玛拉 Pacamara"],
  "哥斯达黎加": ["卡杜拉 Caturra", "卡杜艾 Catuai", "维拉萨奇 Villa Sarchi", "Villa Lobos", "SL28", "瑰夏 Geisha"],
  "洪都拉斯": ["卡杜艾 Catuai", "卡杜拉 Caturra", "波旁 Bourbon", "帕卡斯 Pacas", "IHCAFE 90", "Lempira"],
  "萨尔瓦多": ["波旁 Bourbon", "帕卡斯 Pacas", "帕卡玛拉 Pacamara", "卡蒂姆 Catimor"],
  "尼加拉瓜": ["卡杜拉 Caturra", "波旁 Bourbon", "卡杜艾 Catuai", "帕卡玛拉 Pacamara", "Java"],
  "牙买加": ["蓝山 Blue Mountain", "铁皮卡 Typica", "波旁 Bourbon"],
  "多米尼加": ["铁皮卡 Typica", "波旁 Bourbon", "卡杜拉 Caturra"],
  "印度尼西亚": ["铁皮卡 Typica", "Jember", "Sidikalang", "Ateng", "Gayo", "Kartika"],
  "印度": ["Kents", "S795", "Cauvery", "Selection 9"],
  "越南": ["卡蒂姆 Catimor", "罗布斯塔 Robusta"],
  "泰国": ["卡蒂姆 Catimor", "铁皮卡 Typica", "卡杜拉 Caturra"],
  "巴布亚新几内亚": ["铁皮卡 Typica", "波旁 Bourbon", "Arusha", "蓝山 Blue Mountain"],
  "中国": ["卡蒂姆 Catimor", "铁皮卡 Typica", "瑰夏 Geisha", "波旁 Bourbon"],
  "夏威夷": ["Kona Typica", "卡杜拉 Caturra", "卡杜艾 Catuai", "瑰夏 Geisha"],
};

/* 品种合集：一次勾选就选中一整组（混合品种的豆子用）
 * 只挂在本地产区下面，作为「本地常见」组的第一项，不单独占一个分类 */
const VARIETY_SETS = {
  "肯尼亚": [{ label: "SL28 · SL34 · Ruiru 11 · Batian", set: ["SL28", "SL34", "Ruiru 11", "Batian"] }],
};

/* 按产国拼出品种分组：本地常见（合集排第一）→ 5 个固定分组
 * 固定分组不做去重，无论选哪个产国，位置和顺序都不变，好找 */
function varietyGroupsFor(origin) {
  const o = String(origin || "").trim();
  const local = VARIETY_LOCAL[o];
  const sets = VARIETY_SETS[o] || [];
  if (!local || !local.length) return VARIETIES;
  /* 本地常见里已出现的词，从下面固定组里剔除，避免同一词出现两次 */
  const shown = new Set([...sets, ...local]);
  const rest = VARIETIES.map((g) => ({ g: g.g, items: g.items.filter((x) => !shown.has(x)) })).filter((g) => g.items.length);
  return [{ g: "本地常见", items: [...sets, ...local] }, ...rest];
}

/* 烘焙度 */
const ROASTS = ["极浅烘", "浅烘", "中浅烘", "中烘", "中深烘", "深烘"];

/* 风味树：一级 → 二级（参考 SCA / 中国版咖啡风味轮常用词） */
const FLAVOR_GROUPS = [
  { name: "花香", subs: ["花香", "白色花", "深色花", "茉莉", "白兰花", "玉兰", "玫瑰", "桂花", "金银花", "栀子花", "橙花", "洋甘菊", "薰衣草", "咖啡花", "紫罗兰"] },
  { name: "柑橘", subs: ["柑橘", "甜橙", "橘子", "柚子", "西柚", "柠檬", "青柠檬", "香水柠檬", "佛手柑", "柠檬皮"] },
  { name: "莓果", subs: ["莓果", "草莓", "蓝莓", "黑莓", "覆盆子", "蔓越莓", "黑加仑", "樱桃"] },
  { name: "甜味水果", subs: ["甜味水果", "苹果", "水蜜桃", "梨", "杏", "葡萄", "荔枝", "西瓜", "哈密瓜"] },
  { name: "热带水果", subs: ["热带水果", "菠萝", "芒果", "百香果", "椰子", "香蕉", "木瓜", "榴莲"] },
  { name: "果干", subs: ["果干", "青葡萄干", "黑葡萄干", "红枣干", "无花果干", "李子干", "陈皮", "梅干"] },
  { name: "茶感", subs: ["茶感", "红茶", "绿茶", "乌龙茶", "白茶", "黑茶", "茉莉花茶"] },
  { name: "甜感", subs: ["甜感", "清甜", "蜂蜜", "焦糖", "红糖", "枫糖", "糖蜜", "香草", "奶油糖"] },
  { name: "坚果·可可·谷物", subs: ["坚果", "可可", "黑巧克力", "牛奶巧克力", "花生", "杏仁", "榛子", "腰果", "核桃", "碧根果", "香米", "燕麦", "麦芽"] },
  { name: "奶制品", subs: ["奶制品", "牛奶", "奶油", "黄油", "芝士", "酸奶", "炼乳"] },
  { name: "香料", subs: ["香料", "肉桂", "丁香", "胡椒", "豆蔻", "八角", "生姜", "薄荷"] },
  { name: "烘烤·木质", subs: ["烘烤", "烟熏", "烧焦", "焦糖化", "烟草", "木质", "雪松", "檀木香", "松木", "纸板"] },
  { name: "植物·蔬菜", subs: ["植物", "青草", "干草", "生青", "黄瓜", "番茄叶", "豌豆", "青椒"] },
  { name: "酒", subs: ["酒", "红葡萄酒", "白葡萄酒", "威士忌", "朗姆", "白兰地", "啤酒"] },
];

const ALL_SUBS = new Set(FLAVOR_GROUPS.flatMap((g) => g.subs));
const GROUP_OF = new Map(FLAVOR_GROUPS.flatMap((g) => g.subs.map((s) => [s, g.name])));

/* 常见瑕疵（按成因分组，参考 SCA 杯测瑕疵与国内杯测常用说法） */
const DEFECT_GROUPS = [
  { g: "发酵类", items: ["发酵过度", "醋味", "酒糟味", "药水味", "碘味", "丁酸味", "腐味"] },
  { g: "霉变类", items: ["霉味", "土腥味", "湿纸板味", "麻袋味"] },
  { g: "生青类", items: ["青草味", "生青", "未熟", "青椒味", "豌豆味"] },
  { g: "化学类", items: ["土豆味", "化学味", "金属味", "樟脑味", "农药味"] },
  { g: "烘焙类", items: ["烟熏味", "灰烬味", "烧焦味", "橡胶味", "停滞（烤面包）", "焙烤过度"] },
  { g: "口感类", items: ["涩感", "干涩", "粗糙", "咸味"] },
  { g: "其他", items: ["纸味", "木味", "洋葱味", "大蒜味"] },
];

/* 历史记录里自己填过的词：接口只读，每次保存后刷新 */
window.__KNOWN = { origin: [], process: [], roastLevel: [], roaster: [], varietyByOrigin: {}, varietyAll: [] };

async function loadKnown() {
  try {
    const res = await fetch("/api/known");
    if (!res.ok) return;
    const d = await res.json();
    window.__KNOWN = {
      origin: d.origin || [],
      process: d.process || [],
      roastLevel: d.roastLevel || [],
      roaster: d.roaster || [],
      varietyByOrigin: d.varietyByOrigin || {},
      varietyAll: d.varietyAll || [],
    };
  } catch (err) {
    /* 拿不到就用静态表，不影响使用 */
  }
}

/* 把记忆里的词追加到最后一组（或单独一组「我填过」），已存在的不重复加 */
function withKnown(groups, extra, groupName) {
  const list = (extra || []).filter(Boolean);
  if (!list.length) return groups;
  const seen = new Set();
  groups.forEach((g) => (g.items || []).forEach((it) => (it && it.set ? it.set.forEach((x) => seen.add(x)) : seen.add(it))));
  const add = list.filter((x) => !seen.has(x));
  if (!add.length) return groups;
  const name = groupName || "我填过";
  const hasGroup = groups.some((g) => g.g === name);
  if (hasGroup) {
    return groups.map((g) => (g.g === name ? { g: g.g, items: [...g.items, ...add], mem: g.mem || 1 } : g));
  }
  return [...groups, { g: name, items: add, mem: 1 }];
}

/* 长按「我填过」里的词 → 二次确认后记进 forgotton，之后不再出现。
   只影响候选列表，不碰任何样品数据。 */
window.__forgetKnown = async (value, field0, hostEl) => {
  const ok = await confirmDialog({
    title: L4("不再显示这个词？", "Hide this word?", "この語を非表示にしますか？", "이 단어를 숨길까요?"),
    text: L4(
      `「${esc(value)}」以后不会出现在下拉候选里。<br>已经填过它的样品不受影响，随时可以重新手填。`,
      `“${esc(value)}” will no longer appear in the list.<br>Samples that already use it are untouched — you can always type it again.`,
      `「${esc(value)}」は今後リストに出ません。<br>すでに入力済みのサンプルは変わりません。`,
      `“${esc(value)}” 는 더 이상 목록에 나오지 않습니다.<br>이미 입력한 샘플은 그대로입니다.`
    ),
    confirmText: L4("确定", "OK", "OK", "확인"),
    danger: true,
  });
  if (!ok) return false;
  const field = field0 || "variety";
  /* 品种是按产地分组的，删除时带上产地，只影响这一个国家下的候选 */
  let origin = "";
  if (field === "variety" || field === "process") {
    const wrap = hostEl && hostEl.closest ? hostEl.closest(".sample") : null;
    const oh = wrap ? wrap.querySelector('[data-pick="origin"] input[type="hidden"]') : null;
    origin = oh ? oh.value : "";
  }
  try {
    await api("POST", "/api/known/forget", { field, origin, value });
  } catch (err) {
    toast(L4("删除失败：", "Failed: ", "失敗：", "실패: ") + err.message);
    return false;
  }
  const kn = window.__KNOWN || {};
  if (field === "variety") {
    Object.keys(kn.varietyByOrigin || {}).forEach((k) => {
      if (origin && k !== origin) return;
      kn.varietyByOrigin[k] = (kn.varietyByOrigin[k] || []).filter((x) => x !== value);
    });
    kn.varietyAll = (kn.varietyAll || []).filter((x) => x !== value);
  } else {
    const key = field === "roastLevel" ? "roastLevel" : field;
    kn[key] = (kn[key] || []).filter((x) => x !== value);
  }
  window.__KNOWN = kn;
  toast(L4("已不再显示", "Hidden", "非表示にしました", "숨겼습니다"));
  return true;
};

/* 长按「已选」里自己填的词 → 从这支样品的取值里去掉（不动候选表，也不动别的样品） */
window.__confirmRemoveValue = async (value) => {
  return confirmDialog({
    title: L4("从这支样品里去掉？", "Remove from this sample?", "このサンプルから外しますか？", "이 샘플에서 뺄까요?"),
    text: L4(
      `「${esc(value)}」会从这支样品的取值里去掉，其它样品和候选词表都不受影响。`,
      `“${esc(value)}” will be removed from this sample. Other samples and the candidate list stay as they are.`,
      `「${esc(value)}」をこのサンプルの値から外します。他のサンプルと候補リストは変わりません。`,
      `“${esc(value)}” 를 이 샘플 값에서 뺍니다. 다른 샘플과 후보 목록은 그대로입니다.`
    ),
    confirmText: L4("去掉", "Remove", "外す", "빼기"),
    danger: true,
  });
};

/* 下拉候选词表 */
window.__CUPPING_DYNAMIC = {
  /* 品种列表随所选产国变化（打开面板时才计算），并合并历史记录里填过的 */
  variety: (host) => {
    const wrap = host.closest(".sample") || document;
    const hid = wrap.querySelector('[data-pick="origin"] input[type="hidden"]');
    const o = hid ? hid.value : "";
    const base = varietyGroupsFor(o);
    const kn = window.__KNOWN || {};
    const mem = (kn.varietyByOrigin || {})[o] || [];
    /* 拆开多选值，逐段判断是否已在候选表里 */
    const flat = new Set(base.flatMap((g) => (g.items || []).flatMap((it) => (it && it.set ? it.set : [it]))));
    const add = [];
    mem.forEach((v) => {
      String(v).split(" / ").map((x) => x.trim()).filter(Boolean).forEach((x) => {
        if (!flat.has(x) && !add.includes(x)) add.push(x);
      });
    });
    if (!o) {
      /* 还没选产国：给出所有产地出现过的品种，单独一组放在最前 */
      const all = [];
      (kn.varietyAll || []).forEach((v) => {
        String(v).split(" / ").map((x) => x.trim()).filter(Boolean).forEach((x) => {
          if (!flat.has(x) && !all.includes(x)) all.push(x);
        });
      });
      return all.length ? [{ g: "我填过", items: all, mem: 1 }, ...base] : base;
    }
    /* 选了产国：直接并进「本地常见」末尾，紧跟该国产区，不用翻到最后去找 */
    if (!add.length) return base;
    const at = base.findIndex((g) => g.g === "本地常见");
    if (at < 0) return [...base, { g: "我填过", items: add, mem: 1 }];
    return base.map((g, i) => (i === at ? { ...g, items: [...g.items, ...add], mem: 1, memItems: add } : g));
  },
};

/* 多选值的固定显示顺序（按候选表里出现的先后） */
window.__CUPPING_ORDER = {
  variety: VARIETIES.flatMap((g) => g.items),
};

window.__CUPPING_DATA = {
  origin: ORIGINS,
  process: PROCESSES,
  variety: VARIETIES,
  roastLevel: [{ g: "烘焙度", items: ROASTS }],
  defects: DEFECT_GROUPS,
};

/* 产地/处理法/烘焙度同样把记忆里的词挂到末尾 */
window.__CUPPING_DYNAMIC.origin = () => withKnown(ORIGINS, (window.__KNOWN || {}).origin);
window.__CUPPING_DYNAMIC.process = () => withKnown(PROCESSES, (window.__KNOWN || {}).process);
window.__CUPPING_DYNAMIC.roastLevel = () =>
  withKnown([{ g: "烘焙度", items: ROASTS }], (window.__KNOWN || {}).roastLevel);
/* 烘焙机没有内置表，全是自己填过的词 */
window.__CUPPING_DYNAMIC.roaster = () => {
  const list = (window.__KNOWN || {}).roaster || [];
  return list.length ? [{ g: "我填过", items: list, mem: 1 }] : [];
};

const app = document.getElementById("app");
const layer = document.getElementById("layer");
const filePicker = document.getElementById("filePicker");

const state = {
  view: "list",
  sessions: [],
  session: null,
  openId: null,
  uploadTarget: null,
  lightbox: null,
  /* 按环节填写：一次选一个环节，下面列出所有豆子 */
  stageFlow: false,
  /* 豆子信息视图：null=按内容自动判断（还没打分的场次默认进），true/false=用户手动指定 */
  infoMode: null,
  stage: "dry",
  /* 从「搜豆子」跳过来时高亮的那支 */
  focusSample: null,
  /* 豆子信息：一屏填完所有样品的基本信息（新建后默认打开） */
  infoMode: false,
};

/* ---------------- 基础工具 ---------------- */

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const num = (v) => {
  if (v === null || v === undefined || v === "" || Number.isNaN(Number(v))) return "";
  const n = Number(v);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
};

const fmtDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${y}.${m}.${d}`;
};

const fmtWhen = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const todayStr = () => new Date().toLocaleDateString("sv-SE");

function toast(msg, isErr) {
  const el = document.createElement("div");
  el.className = "toast" + (isErr ? " err" : "");
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, isErr ? 3200 : 1800);
}

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `请求失败（${res.status}）`);
  return data;
}

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/* ---------------- 弹窗 ---------------- */

function confirmDialog({ title, text, confirmText = "确定", danger = false }) {
  return new Promise((resolve) => {
    const mask = document.createElement("div");
    mask.className = "mask";
    mask.innerHTML = `
      <div class="modal glass" style="width:min(400px,100%)">
        <div class="mhead"><h3>${esc(title)}</h3></div>
        <div class="mbody"><div style="color:var(--ink-2);font-size:13.5px;line-height:1.6">${text}</div></div>
        <div class="mfoot">
          <div class="grow"></div>
          <button class="btn" data-x="no">取消</button>
          <button class="btn ${danger ? "danger" : "primary"}" data-x="yes" style="${danger ? "border-color:#fecaca;background:#fef2f2;color:#b91c1c" : ""}">${esc(confirmText)}</button>
        </div>
      </div>`;
    layer.appendChild(mask);
    /* 长按触发时手指还按在屏幕上，松手会在遮罩上补一次 click，
       刚弹出来的确认框会被立刻关掉。所以「点外面关闭」走 pointerdown（新的按下动作），
       不用 click —— 长按松手产生不了 pointerdown。 */
    const close = (v) => {
      mask.remove();
      resolve(v);
    };
    mask.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target === mask) return close(false);
    });
    mask.addEventListener("click", (e) => {
      if (e.target === mask) return;
      const act = e.target.closest("[data-x]")?.dataset.x;
      if (act) close(act === "yes");
    });
    mask.querySelector('[data-x="yes"]').focus();
  });
}

function openModal(html, { wide = false } = {}) {
  const mask = document.createElement("div");
  mask.className = "mask";
  /* 弹窗要压在已经打开的下拉面板之上（如从下拉里长按删除时的确认框） */
  const aboveZ = [...document.querySelectorAll(".mask, .pick-pop, .pick-mask")].reduce(
    (mx, el) => Math.max(mx, Number(getComputedStyle(el).zIndex) || 0),
    0
  );
  if (aboveZ >= 100) mask.style.zIndex = String(aboveZ + 1);
  mask.innerHTML = `<div class="modal glass${wide ? " wide" : ""}">${html}</div>`;
  layer.appendChild(mask);
  const close = () => mask.remove();
  mask.addEventListener("click", (e) => {
    if (e.target === mask || e.target.closest("[data-close]")) close();
  });
  return { mask, close };
}

/* ---------------- 路由 ---------------- */

function go(path) {
  history.pushState({}, "", path);
  render();
}

window.addEventListener("popstate", render);

async function render() {
  const m = location.pathname.match(/^\/s\/(\d+)$/);
  if (m) {
    state.view = "detail";
    await loadSession(Number(m[1]));
  } else {
    state.view = "list";
    await loadList();
  }
}

/* ---------------- 列表页 ---------------- */

async function loadList() {
  app.innerHTML = `<div class="loading">读取中…</div>`;
  try {
    state.sessions = await api("GET", "/api/sessions");
  } catch (err) {
    app.innerHTML = `<div class="empty"><h3>读取失败</h3>${esc(err.message)}</div>`;
    return;
  }
  renderList();
}

function renderList() {
  const list = state.sessions;
  const cards = list
    .map((s) => {
      const strip = s.thumbs || [];
      return `
      <div class="scard glass" data-act="open-session" data-id="${s.id}">
        <div class="date">${fmtDate(s.cuppedOn)}${s.host ? " · " + esc(s.host) : ""}</div>
        <h3>${esc(s.title)}</h3>
        <div class="sum">
          <span>${s.sampleCount} 支样品</span>
          ${s.photoCount ? `<span>${s.photoCount} 张图</span>` : ""}
          ${s.topScore ? `<span style="color:var(--accent);font-weight:600">最高 ${num(s.topScore)}</span>` : ""}
          <button class="scard-del" data-act="delete-session" data-id="${s.id}" data-title="${esc(s.title)}" data-count="${s.sampleCount}"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg></button>
        </div>
        ${strip.length ? `<div class="strip">${strip.map((u) => `<img src="${u}" loading="lazy" alt="" />`).join("")}</div>` : ""}
      </div>`;
    })
    .join("");

  app.innerHTML = `
    <div class="wrap">
      <div class="list-head">
        <h1>杯测记录</h1>
        <div class="meta">${list.length ? `共 ${list.length} 场` : ""}</div>
        <div style="flex:1"></div>
        <button class="btn" data-act="find-bean">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>搜豆子
        </button>
        <button class="btn" data-act="export-all">导出</button>
        <button class="btn" data-act="open-trash">回收站</button>
        <button class="btn lang-btn" data-act="lang" title="${L4("切换语言", "Change language", "言語を変更", "언어 변경")}" aria-label="${L4("切换语言", "Change language", "言語を変更", "언어 변경")}"><svg viewBox="0 0 24 24"><path d="M3 7h8M7 5v2M10 7c0 4-2.8 7.4-6.8 8.8"/><path d="M5 10.4c1.5 2.3 3.6 4.1 6.1 5.1"/><path d="M13.4 19.6 16.9 10.4 20.4 19.6"/><path d="M14.7 17.1h4.4"/></svg><span>Language</span></button>
        <button class="btn primary" data-act="new-session">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>新建一场
        </button>
      </div>
      ${list.length ? `<div class="grid-sessions">${cards}</div>` : `
        <div class="empty">
          <h3>还没有杯测记录</h3>
          点右上角「新建一场」开始，之后就能加样品、打分、拍照。
        </div>`}
    </div>`;

}

/* ---------------- 详情页 ---------------- */

async function loadSession(id, { keepScroll = false } = {}) {
  const y = window.scrollY;
  if (!state.session || state.session.id !== id) {
    app.innerHTML = `<div class="loading">读取中…</div>`;
    if (state.infoMode !== null) state.infoMode = null;
  }
  try {
    state.session = await api("GET", `/api/sessions/${id}`);
  } catch (err) {
    state.session = null;
    app.innerHTML = `<div class="wrap"><div class="empty"><h3>打不开这场杯测</h3>${esc(err.message)}
      <div style="margin-top:12px"><button class="btn" data-act="back">回到列表</button></div></div></div>`;
    return;
  }
  renderDetail();
  if (keepScroll) window.scrollTo(0, y);
}

const sampleTotal = (s) => {
  const base = ATTRS.reduce((a, [k]) => a + (Number(s.scores?.[k]) || 0), 0);
  const ded = (s.defects || []).reduce((a, d) => a + (d.level === "fault" ? 4 : 2) * (Number(d.cups) || 0), 0);
  return Math.max(0, Math.round((base - ded) * 100) / 100);
};

function sampleMeta(s) {
  const on = !!(window.I18N && window.I18N.on);
  return [s.origin, s.process, s.variety, s.roastLevel, s.roaster]
    .filter(Boolean)
    .map((v) => (on ? window.I18N.t(v) : v))
    .join(" · ");
}

function renderDetail() {
  const se = state.session;
  const sessionPhotos = se.photos;
  const samples = se.samples;

  /* 只在这支场次还没打过分时自动进「豆子信息」；一旦用户手动切过就尊重用户选择 */
  const scored = samples.some((x) => Object.values(x.scores || {}).some((v) => v) || Object.values(x.stageTags || {}).some((a) => Array.isArray(a) && a.length));
  let infoOn = state.infoMode === true;
  if (state.infoMode === null && samples.length > 0) infoOn = !scored;
  const sampleRows = samples.map((s, i) => renderSample(s, i)).join("");

  app.innerHTML = `
    <div class="wrap">
      <div class="detail-head glass">
        <div class="grow">
          <h1>${esc(se.title)}</h1>
          <div class="row">
            <span>${fmtDate(se.cuppedOn)}</span>
            ${se.host ? `<span class="dot"></span><span>主持 ${esc(se.host)}</span>` : ""}
            <span class="dot"></span><span>${samples.length} 支样品</span>
            ${se.note ? `<span class="dot"></span><span style="max-width:520px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(se.note)}</span>` : ""}
          </div>
        </div>
        <button class="btn" data-act="back">返回</button>
        <button class="btn" data-act="edit-session">编辑</button>
        <button class="btn" data-act="duplicate-session">复测</button>
        <button class="btn" data-act="export-session">导出</button>
      </div>

      <div class="strip-bar">
        <div class="label">现场照片 <span style="color:var(--ink-3)">${sessionPhotos.length || ""}</span></div>
        <div class="thumbs" id="sessionThumbs">
          ${sessionPhotos.map((p) => thumbHtml(p, "session")).join("")}
          <button class="thumb add" data-act="pick-photo" data-target="session">
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            加照片
          </button>
        </div>
      </div>

      ${state.stageFlow ? stageRibbon() : ""}
      <div class="table-wrap glass${state.stageFlow ? " flow" : ""}${infoOn && !state.stageFlow ? " info" : ""}">
        ${state.stageFlow
          ? ""
          : `<div class="tbar">
          <span class="title">${infoOn ? "豆子信息" : "样品评分"}</span>
          <span class="count">${samples.length} 支${infoOn ? " · 改完自动保存" : ""}</span>
          <div class="spacer"></div>
          <button class="btn sm${infoOn ? " on" : ""}" data-act="toggle-info-mode">${infoOn ? "返回主页面" : `<i class="step">1</i><span class="lbl">豆子信息记录</span>`}</button>
          <button class="btn sm" data-act="batch-fill">一键填写</button>
          <button class="btn sm amber" data-act="stage-flow-enter"><i class="step">2</i><span class="lbl">风味记录</span></button>
          <button class="btn sm primary" data-act="add-sample">＋ 样品</button>
        </div>`}
        ${!samples.length ? `<div class="empty" style="border:none;background:none">还没有样品，点「＋ 样品」加一支。</div>` : infoOn && !state.stageFlow ? infoTable(samples) : sampleRows}
      </div>
    </div>`;

  if (state.stageFlow) {
    app.querySelectorAll(".sample").forEach((el) => {
      el.classList.add("open");
      const body = el.querySelector(".sbody");
      if (body) body.hidden = false;
    });
    if (window.Picker) window.Picker.mount(app);
    return;
  }

  // 展开上次打开的那支
  if (state.openId) {
    const el = app.querySelector(`.sample[data-id="${state.openId}"]`);
    if (el) {
      el.classList.add("open");
      const body = el.querySelector(".sbody");
      if (body) body.hidden = false;
    }
  }

  // 挂载下拉（必须在这批 DOM 插入之后）
  if (window.Picker) window.Picker.mount(app);

  // 从「搜豆子」跳过来：滚到这支并闪一下
  if (state.focusSample) {
    const el = app.querySelector(`.sample[data-id="${state.focusSample}"]`);
    state.focusSample = null;
    if (el) {
      el.classList.add("hit");
      el.scrollIntoView({ block: "start", behavior: "auto" });
      setTimeout(() => el.classList.remove("hit"), 1600);
    }
  }
}

function thumbHtml(p, kind) {
  return `<div class="thumb" data-act="zoom" data-kind="${kind}" data-id="${p.id}">
    <img src="${p.url}" loading="lazy" alt="" />
    <button class="del" data-act="del-photo" data-id="${p.id}" title="删除">
      <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
  </div>`;
}

/* 豆子信息：所有样品的基本字段并排一次填完，不用一个个展开 */
function infoTable(samples) {
  const head = `
    <div class="ihead">
      <span class="ic-no">#</span>
      <span>${L4("编号 / 名称", "Name", "番号 / 名称", "번호 / 이름")}</span>
      <span>${L4("产地", "Origin", "産地", "산지")}</span>
      <span>${L4("处理法", "Process", "精製方法", "가공법")}</span>
      <span>${L4("品种", "Variety", "品種", "품종")}</span>
      <span>${L4("烘焙度", "Roast level", "焙煎度", "로스팅 정도")}</span>
      <span>${L4("烘焙日", "Roast date", "焙煎日", "로스팅 날짜")}</span>
      <span>${L4("养豆天数", "Rest days", "エイジング日数", "숙성 일수")}</span>
      <span>${L4("烘焙机", "Roaster", "焙煎機", "로스터")}</span>
    </div>`;
  const rows = samples
    .map((s, i) => {
      return `
      <div class="sample inrow" data-id="${s.id}">
        <div class="sbody">
          <div class="ic-no">${i + 1}</div>
          <div class="field" data-l="${L4("编号 / 名称","Name","番号 / 名称","번호 / 이름")}"><input data-f="name" value="${esc(s.name)}" aria-label="编号 / 名称" /></div>
          <div class="field" data-l="${L4("产地","Origin","産地","산지")}">${comboField("origin", s.origin, ORIGINS, "选产地")}</div>
          <div class="field" data-l="${L4("处理法","Process","精製方法","가공법")}">${comboField("process", s.process, PROCESSES, "选处理法")}</div>
          <div class="field" data-l="${L4("品种","Variety","品種","품종")}">${comboField("variety", s.variety, VARIETIES, "选品种", { multi: true })}</div>
          <div class="field" data-l="${L4("烘焙度","Roast","焙煎度","로스팅 정도")}">${comboField("roastLevel", s.roastLevel, [{ g: "烘焙度", items: ROASTS }], "选烘焙度")}</div>
          <div class="field" data-l="${L4("烘焙日","Roast date","焙煎日","로스팅 날짜")}"><input data-f="roastDate" type="date" value="${esc(s.roastDate)}" aria-label="烘焙日" /></div>
          <div class="field" data-l="${L4("养豆天数","Rest days","養生日数","레스트 일수")}"><input data-f="restDays" type="number" min="0" max="365" value="${s.restDays === null || s.restDays === undefined ? "" : s.restDays}" aria-label="养豆天数" /></div>
          <div class="field" data-l="${L4("烘焙机","Roaster","焙煎機","로스터")}">${comboField("roaster", s.roaster, [], "选烘焙机")}</div>
        </div>
      </div>`;
    })
    .join("");
  return `<div class="itable">${head}${rows}</div>`;
}

function renderSample(s, i) {
  const total = sampleTotal(s);
  const hasScore = total > 0;
  const tags = s.tags || [];
  const pics = s.photos || [];

  return `
  <div class="sample" data-id="${s.id}">
    <div class="srow" data-act="toggle-sample" data-id="${s.id}">
      <div class="idx">${i + 1}</div>
      <div class="nm">
        <div class="n">${esc(s.name)}</div>
        <div class="m">${esc(sampleMeta(s)) || "—"}</div>
      </div>
      <div class="tags">${tags.slice(0, 4).map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
      <div class="pics">
        ${pics.slice(0, 2).map((p) => `<img src="${p.url}" loading="lazy" alt="" />`).join("")}
        ${pics.length > 2 ? `<span class="n">+${pics.length - 2}</span>` : ""}
      </div>
      <div class="score">${hasScore ? `<b>${num(total)}</b><span>/${ATTRS.length * 10}</span>` : `<span style="color:var(--ink-3)">未评</span>`}</div>
      <div class="chev"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></div>
    </div>
    <div class="sbody" hidden>
      ${sampleBody(s, total)}
    </div>
  </div>`;
}

/* 下拉选择：自研 picker.js（可选可自填），值写回 hidden input */
function comboField(key, value, groups, placeholder, opts) {
  const o = opts || {};
  return `
    <div class="combo pick" data-pick="${key}" data-list="${key}" data-value="${esc(value)}"${o.multi ? ' data-multi="1"' : ""}>
      <input type="hidden" data-f="${key}" value="${esc(value)}" />
      <button type="button" class="pick-btn${value ? "" : " empty"}" data-ph="${esc(placeholder)}"${o.title ? ` data-title="${esc(o.title)}"` : ""}>
        <span class="pick-val">${esc(o.multi && value ? String(value).split(" / ").map((x) => x.trim()).filter(Boolean).join("、") : (value || ""))}</span>
        <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
      </button>
    </div>`;
}

/* 瑕疵名称下拉（同一个 picker，值写回 data-d="desc"） */
function defectCombo(desc, ph = "瑕疵名称") {
  return `
    <div class="combo pick defcombo" data-pick="defect" data-list="defects" data-value="${esc(desc)}">
      <input type="hidden" data-d="desc" data-val value="${esc(desc)}" />
      <button type="button" class="pick-btn${desc ? "" : " empty"}" data-ph="${esc(ph)}" data-title="瑕疵 / 缺陷">
        <span class="pick-val">${esc(desc || "")}</span>
        <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
      </button>
    </div>`;
}

/* 风味选择器 */
/* 收起时的一行已选风味（外层容器常驻，方便局部刷新） */
function stageTagsInline(tags) {
  const shown = tags.slice(0, 4);
  return shown
    .map((t) => `<span class="itag">${esc(t)}</span>`)
    .join("") + (tags.length > shown.length ? `<span class="itag more">+${tags.length - shown.length}</span>` : "");
}

function flavorPickerHtml(tags, stage, autoOpen = true) {
  return FLAVOR_GROUPS.map((g, i) => {
    const on = g.subs.filter((x) => tags.includes(x)).length;
    return `
    <div class="fg${on ? " has" : ""}${on && autoOpen ? " open" : ""}" data-fg="${esc(g.name)}" style="order:${i}">
      <button class="fg-head" data-act="toggle-group" data-group="${esc(g.name)}" data-stage="${stage}">
        <span class="fg-name">${esc(g.name)}</span>
        <span class="fg-count"${on ? "" : " hidden"}>${on || ""}</span>
        <svg class="fg-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="fg-subs"${on && autoOpen ? "" : " hidden"}>${on && autoOpen ? flavorSubsHtml(g.name, tags) : ""}</div>
    </div>`;
  }).join("");
}

/* 展开时才填充二级词，避免 5 个环节 × 14 组一次性渲染 580 个按钮 */
function flavorSubsHtml(groupName, tags) {
  const g = FLAVOR_GROUPS.find((x) => x.name === groupName);
  if (!g) return "";
  return g.subs
    .map((sub) => {
      const sel = tags.includes(sub);
      return `<button class="fsub${sel ? " on" : ""}" data-act="pick-flavor" data-tag="${esc(sub)}" data-parent="${esc(g.name)}">${esc(sub)}</button>`;
    })
    .join("");
}

/* 点开大类后固定出现在胶囊下方的二级词面板（评分区与环节记录共用同一套） */
function flavorPanelHtml(groupName, tags) {
  const g = FLAVOR_GROUPS.find((x) => x.name === groupName);
  if (!g) return "";
  const picked = g.subs.filter((x) => tags.includes(x));
  const subs = g.subs
    .map((sub) => {
      const sel = tags.includes(sub);
      return `<button class="fsub${sel ? " on" : ""}" data-act="pick-flavor" data-tag="${esc(sub)}" data-parent="${esc(g.name)}">${sel ? '<i class="tick">✓</i>' : ""}${esc(sub)}</button>`;
    })
    .join("");
  return `
    <div class="fp-head">
      <span class="fp-name">${esc(g.name)}</span>
      <span class="fp-count">${picked.length ? `已选 ${picked.length}` : "点一下加入"}</span>
      <div class="spacer"></div>
      <button class="fp-x" data-act="close-panel" aria-label="收起">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>
    <div class="fp-subs">${subs}</div>`;
}

function pickedHtml(tags, stage, note) {
  const chips = tags
    .map((t) => `<button class="fchip on" data-act="unpick-flavor" data-tag="${esc(t)}">${esc(t)}<i>×</i></button>`)
    .join("");
  const noteChip = note
    ? `<button class="fchip note" data-act="stage-note" data-stage="${stage || ""}" title="点一下改备注">${esc(note)}</button>`
    : "";
  return `
    <div class="picked-row">
      ${chips}
      ${noteChip}
      <button class="fchip add${note ? " has-note" : ""}" data-act="add-tag" data-stage="${stage || ""}">＋ 自定义</button>
      ${note ? "" : `<button class="fchip add" data-act="stage-note" data-stage="${stage || ""}">＋ 备注</button>`}
    </div>`;
}

function normalizeStageTags(raw, legacyTags) {
  const out = { dry: [], wet: [], hot: [], warm: [], cool: [] };
  if (raw && typeof raw === "object") {
    for (const k of Object.keys(out)) {
      if (Array.isArray(raw[k])) out[k] = [...new Set(raw[k].map(String).filter(Boolean))].slice(0, 12);
    }
    return out;
  }
  if (Array.isArray(legacyTags) && legacyTags.length) out.dry = [...new Set(legacyTags.map(String).filter(Boolean))];
  return out;
}

function allTagsOf(stageTags) {
  const seen = new Set();
  Object.values(stageTags || {}).forEach((arr) => (arr || []).forEach((t) => seen.add(t)));
  return [...seen];
}

/* 瑕疵 / 缺陷：只在「按环节记录」里可编辑，末行常驻一个空白行直接可点选 */
function defectRowHtml(d, idx, draft = false) {
  return `
        <div class="defect-row" data-defect="${idx}"${draft ? ' data-draft="1"' : ""}>
          ${defectCombo(d.desc || "", draft ? "选瑕疵" : "瑕疵名称")}
          <input class="cups" data-d="cups" type="number" step="1" min="1" max="10" inputmode="numeric" value="${num(d.cups || 1)}" title="杯数" />
          <button class="fchip ${d.level === "fault" ? "on" : ""}" data-act="toggle-level" data-idx="${idx}">${d.level === "fault" ? "缺陷" : "瑕疵"}</button>
          ${draft ? "" : `<button class="btn sm icon ghost" data-act="del-defect" data-idx="${idx}">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>`}
        </div>`;
}

/* 空白行始终只有一个、且排在最后 */
function resetDraftRow(list) {
  if (!list) return;
  list.querySelectorAll('[data-draft="1"]').forEach((d) => d.remove());
  const idx = list.querySelectorAll("[data-defect]").length;
  const dump = document.createElement("div");
  dump.innerHTML = defectRowHtml({ desc: "", cups: 1, level: "taint" }, idx, true);
  const row = dump.firstElementChild;
  /* 有真实瑕疵时才显示扣分说明，保持和首次渲染一致 */
  const hasReal = list.querySelector("[data-defect]:not([data-draft])");
  const note = list.querySelector("div[style]");
  if (hasReal && !note) {
    list.insertAdjacentHTML("beforeend", `<div style="font-size:11.5px;color:var(--ink-3)">瑕疵每杯扣 2 分，缺陷每杯扣 4 分</div>`);
  } else if (!hasReal && note) {
    note.remove();
  }
  list.insertBefore(row, list.querySelector("div[style]") || null);
  window.Picker && window.Picker.mount(row);
}

function defectBlock(s) {
  const defects = s.defects || [];
  const rows = defects.map((d, i) => defectRowHtml(d, i));
  rows.push(defectRowHtml({ desc: "", cups: 1, level: "taint" }, defects.length, true));
  return `
    <div class="sub-head"><span class="t">瑕疵 / 缺陷</span><div class="spacer"></div></div>
    <div class="defect-list">
      ${rows.join("")}
      ${defects.length ? `<div style="font-size:11.5px;color:var(--ink-3)">瑕疵每杯扣 2 分，缺陷每杯扣 4 分</div>` : ""}
    </div>`;
}

function sampleBody(s, total) {
  if (state.stageFlow) return stageFlowBody(s);
  const scores = s.scores || {};
  const defects = s.defects || [];
  const tags = s.tags || [];
  const pics = s.photos || [];

  /* 风味按环节分组：新数据存 stageTags；老数据全塞进 dry */
  const stageTags = normalizeStageTags(s.stageTags, tags);
  return `
    <div class="field-grid">
      <div class="field wide"><label>样品编号 / 名称</label><input data-f="name" value="${esc(s.name)}" /></div>
      <div class="field"><label>产地</label>${comboField("origin", s.origin, ORIGINS, "选产地")}</div>
      <div class="field"><label>处理法</label>${comboField("process", s.process, PROCESSES, "选处理法")}</div>
      <div class="field"><label>品种</label>${comboField("variety", s.variety, VARIETIES, "选品种", { multi: true, hint: "可多选" })}</div>
      <div class="field"><label>烘焙度</label>${comboField("roastLevel", s.roastLevel, [{ g: "烘焙度", items: ROASTS }], "选烘焙度")}</div>
      <div class="field"><label>烘焙日</label><input data-f="roastDate" type="date" value="${esc(s.roastDate)}" /></div>
      <div class="field"><label>养豆天数</label><input data-f="restDays" type="number" min="0" max="365" value="${s.restDays === null || s.restDays === undefined ? "" : s.restDays}" /></div>
      <div class="field"><label>烘焙机</label>${comboField("roaster", s.roaster, [], "选烘焙机")}</div>
    </div>

    <div class="sub-head"><span class="t">风味记录</span><div class="spacer"></div>
      <span style="font-size:12px;color:var(--ink-3)">每个环节单独选风味和打分</span>
    </div>
    <div class="stages" data-flavor-zone>
      ${NOTE_STAGES.map((st) => {
        const list = stageTags[st.key] || [];
        const v = scores[st.attr];
        const has = v !== undefined && v !== null;
        return `
        <div class="stage-block${has || list.length ? " has" : ""}" data-stage-block data-stage="${st.key}">
          <div class="stage-head">
            <button type="button" class="stage-toggle" data-act="toggle-stage">
              <span class="stage-title">${st.label}</span>
              <span class="stage-hint">${st.hint}</span>
              <span class="stage-tags-inline" data-inline>${stageTagsInline(list)}</span>
            </button>
            <div class="stage-score">
              <button type="button" class="sl-lock" data-act="toggle-slider-lock" title="点一下解锁，才能拖动打分" aria-label="解锁打分">
                <svg class="lock-on" viewBox="0 0 24 24"><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2"/><path d="M8.2 10.5V7.4a3.8 3.8 0 0 1 7.6 0v3.1"/></svg>
                <svg class="lock-off" viewBox="0 0 24 24"><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2"/><path d="M8.2 10.5V7.4a3.8 3.8 0 0 1 7.2-1.5"/></svg>
              </button>
              <div class="slider-row locked${has ? " filled" : ""}" data-s="${st.attr}" data-value="${has ? num(v) : ""}" style="--pct:${has ? (v / 10) * 100 : 0}%">
                <input type="range" min="0" max="10" step="0.25" value="${has ? num(v) : 0}" data-range="${st.attr}" disabled />
                <input class="sl-val" type="text" inputmode="decimal" autocomplete="off" spellcheck="false"
                       value="${has ? num(v) : ""}" placeholder="—" data-val="${st.attr}" aria-label="${st.label} ${L4('分数', 'score', 'スコア', '점수')}" />
              </div>
            </div>
            <button type="button" class="stage-chev-btn" data-act="toggle-stage" aria-label="展开/收起">
              <svg class="stage-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>
          <div class="stage-body" hidden>
            <div class="flavor-picker" data-picker data-stage="${st.key}">
              ${flavorPickerHtml(list, st.key, false)}
              <div class="flavor-panel" data-panel hidden></div>
            </div>
            <div class="flavor-picked" data-picked data-stage="${st.key}">
              ${pickedHtml(list, st.key, (s.stageNotes || {})[st.key])}
            </div>
          </div>
        </div>`;
      }).join("")}
    </div>

    <div class="sub-head"><span class="t">合计</span><div class="spacer"></div>
      <b data-total style="font-size:15px;font-variant-numeric:tabular-nums">${num(total)}</b>
      <span style="font-size:12px;color:var(--ink-3)">/${ATTRS.length * 10}</span>
    </div>

    <div class="sub-head"><span class="t">备注</span><div class="spacer"></div></div>
    <textarea class="note" data-f="note">${esc(s.note)}</textarea>

    <div class="sample-photos">
      <div class="sub-head"><span class="t">这支的照片</span><div class="spacer"></div></div>
      <div class="thumbs">
        ${pics.map((p) => thumbHtml(p, "sample")).join("")}
        <button class="thumb add" data-act="pick-photo" data-target="sample" data-sample="${s.id}">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          加照片
        </button>
      </div>
    </div>

    <div class="foot">
      <button class="btn sm danger" data-act="delete-sample" data-id="${s.id}">删除样品</button>
      <button class="btn sm ghost" data-act="move-sample" data-id="${s.id}" data-dir="up">↑ 上移</button>
      <button class="btn sm ghost" data-act="move-sample" data-id="${s.id}" data-dir="down">↓ 下移</button>
      <div class="grow"></div>
      <span class="saved-hint" data-hint="${s.id}">已保存</span>
    </div>`;
}

/* 按环节填写：一次只看一个环节，下面列出所有豆子 */
function stageOf(key) {
  return NOTE_STAGES.find((x) => x.key === key) || NOTE_STAGES[0];
}

function stageRibbon() {
  const cur = stageOf(state.stage);
  const idx = NOTE_STAGES.findIndex((x) => x.key === cur.key);
  const next = NOTE_STAGES[idx + 1];
  const samples = state.session?.samples || [];
  return `
    <div class="sgbar" data-stage="${cur.key}">
      <div class="sgtabs">
        ${NOTE_STAGES.map((st) => `<button class="sgtab${st.key === cur.key ? " on" : ""}" data-act="pick-stage-flow" data-stage="${st.key}"><span class="sgt-n">${st.label}</span></button>`).join('<span class="sgt-sep">→</span>')}
      </div>
      <div class="spacer"></div>
      <div class="sgact">
        <span class="sghint">${cur.hint}</span>
        ${next ? `<button class="btn sm primary" data-act="stage-flow-next">下一环节：${next.label}</button>` : `<button class="btn sm primary" data-act="stage-flow-done">完成</button>`}
        <button class="btn sm" data-act="add-sample">＋ 样品</button>
        <button class="btn sm ghost" data-act="stage-flow-exit">退出</button>
      </div>
    </div>`;
}

function stageFlowBody(s) {
  const st = stageOf(state.stage);
  const stageTags = normalizeStageTags(s.stageTags, s.tags);
  const list = stageTags[st.key] || [];
  const v = s.scores?.[st.attr];
  const has = v !== undefined && v !== null;
  return `
    <div class="stage-flow" data-stage-block data-stage="${st.key}">
      <div class="sf-head">
        <span class="sf-lab">${esc(st.label)}</span>
        <div class="stage-score sf-score">
          <div class="slider-row${has ? " filled" : ""}" data-s="${st.attr}" data-value="${has ? num(v) : ""}" style="--pct:${has ? (v / 10) * 100 : 0}%">
            <input type="range" min="0" max="10" step="0.25" value="${has ? num(v) : 0}" data-range="${st.attr}" />
            <input class="sl-val" type="text" inputmode="decimal" autocomplete="off" spellcheck="false"
                   value="${has ? num(v) : ""}" placeholder="—" data-val="${st.attr}" aria-label="${st.label} ${L4('分数', 'score', 'スコア', '점수')}" />
          </div>
        </div>
      </div>
      <div class="flavor-picker" data-picker data-stage="${st.key}">
        ${flavorPickerHtml(list, st.key, false)}
        <div class="flavor-panel" data-panel hidden></div>
      </div>
      <div class="flavor-picked" data-picked data-stage="${st.key}">
        ${pickedHtml(list, st.key, (s.stageNotes || {})[st.key])}
      </div>
      ${defectBlock(s)}
      <div class="sf-pics">
        <div class="sub-head"><span class="t">这支的照片</span><div class="spacer"></div></div>
        <div class="thumbs">
        ${(s.photos || []).map((p) => thumbHtml(p, "sample")).join("")}
        <button class="thumb add" data-act="pick-photo" data-target="sample" data-sample="${s.id}">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          加照片
        </button>
        </div>
      </div>
    </div>`;
}

/* ---------------- 评分 / 下拉 / 风味 交互 ---------------- */

/* 只改滑块本身（轨道、圆点、data-value），不动右侧数字框 */
function paintSlider(row, value) {
  const v = Number(value) || 0;
  row.dataset.value = v > 0 ? String(Math.round(v * 100) / 100) : "";
  row.classList.toggle("filled", v > 0);
  const range = row.querySelector("input[type=range]");
  if (range && Number(range.value) !== v) range.value = String(v);
  row.style.setProperty("--pct", `${(v / 10) * 100}%`);
  return v;
}

function setSlider(row, value, opts = {}) {
  const v = paintSlider(row, value);
  const label = row.querySelector(".sl-val");
  if (label) {
    if (label.tagName === "INPUT") label.value = v > 0 ? num(v) : "";
    else label.textContent = v > 0 ? num(v) : "—";
  }
  if (!opts.silent) updateTotal(row.closest(".sample"));
}

function updateTotal(wrap) {
  if (!wrap) return;
  const sbody = wrap.querySelector(".sbody");
  /* 以库里的评分为基线，再用当前 DOM 覆盖（按环节模式下只渲染了一个环节） */
  const base = state.session?.samples || [];
  const saved = base.find((x) => x.id === Number(wrap.dataset.id));
  const scores = { ...(saved?.scores || {}) };
  sbody?.querySelectorAll(".slider-row[data-s]").forEach((a) => {
    const k = a.dataset.s;
    if (a.dataset.value !== "") scores[k] = Number(a.dataset.value);
    else delete scores[k];
  });
  let sum = 0;
  ATTRS.forEach(([k]) => { if (scores[k]) sum += Number(scores[k]); });
  /* 瑕疵：有列表就读 DOM，否则用库里的 */
  let deds = 0;
  const defectRows = sbody ? [...sbody.querySelectorAll("[data-defect]")] : [];
  if (defectRows.length) {
    deds = defectRows.reduce((acc, row) => {
      const cups = Number(row.querySelector(".cups").value) || 0;
      const fault = row.querySelector('[data-act="toggle-level"]').classList.contains("on");
      return acc + (fault ? 4 : 2) * cups;
    }, 0);
  } else {
    deds = (saved?.defects || []).reduce(
      (acc, d) => acc + (d.level === "fault" ? 4 : 2) * (Number(d.cups) || 0),
      0
    );
  }
  const t = Math.max(0, Math.round((sum - deds) * 100) / 100);
  const totalEl = sbody?.querySelector("[data-total]");
  if (totalEl) totalEl.textContent = num(t);
  const row = wrap.querySelector(".srow .score");
  if (row) {
    row.innerHTML = t > 0 || sum > 0
      ? `<b>${num(t)}</b><span>/${ATTRS.length * 10}</span>`
      : `<span style="color:var(--ink-3)">未评</span>`;
  }
}

/* 只重绘某个环节的风味区 + 行内标签，不动输入框与滑块，避免丢焦点 */
function refreshFlavor(wrap, stage, tags) {
  const body = wrap.querySelector(".sbody");
  const id = Number(wrap.dataset.id);
  const s = (state.session?.samples || []).find((x) => x.id === id);
  const stageTags = normalizeStageTags(s?.stageTags, s?.tags);
  stageTags[stage] = [...new Set(tags)];
  if (s) s.stageTags = stageTags;

  const block = body.querySelector(`[data-stage-block][data-stage="${stage}"]`);
  if (block) {
    const picker = block.querySelector("[data-picker]");
    const panel = block.querySelector("[data-panel]");
    if (picker) {
      /* 胶囊只更新选中态，DOM 顺序与尺寸都不变，位置不会跳 */
      const openGroup = panel?.dataset.group || "";
      picker.innerHTML = flavorPickerHtml(tags, stage, false);
      if (panel) {
        picker.appendChild(panel);
        picker.querySelectorAll(".fg").forEach((g) => g.classList.toggle("open", g.dataset.fg === openGroup));
        if (openGroup) {
          const g = FLAVOR_GROUPS.find((x) => x.name === openGroup);
          panel.innerHTML = g ? flavorPanelHtml(openGroup, tags) : "";
          const fg = picker.querySelector(`.fg[data-fg="${CSS.escape(openGroup)}"]`);
          panel.style.order = String([...picker.querySelectorAll(".fg")].indexOf(fg) + 1);
        }
      }
    }
    const picked = block.querySelector("[data-picked]");
    if (picked) {
      const smp = (state.session?.samples || []).find((x) => x.id === id);
      picked.innerHTML = pickedHtml(tags, stage, (smp?.stageNotes || {})[stage]);
    }
    block.classList.toggle("has", tags.length > 0);
    /* 收起状态下也要能看到已选风味 */
    const inline = block.querySelector("[data-inline]");
    if (inline) inline.innerHTML = stageTagsInline(tags);
  }

  const row = wrap.querySelector(".srow .tags");
  if (row) {
    row.innerHTML = allTagsOf(stageTags).slice(0, 4).map((t) => `<span class="chip">${esc(t)}</span>`).join("");
  }
}

/* 下拉选定后落库（hidden input 用 JS 赋值不会触发 change） */
window.__onPickChange = (host, v) => {
  const wrap = host.closest(".sample");
  if (!wrap) return;
  const row = host.closest(".defect-row");
  if (row) {
    row.querySelector('[data-d="desc"]').value = v;
    /* 空白行选完就变成真的一行，并在末尾补一个新的空白行，继续直接选 */
    if (row.dataset.draft === "1") {
      delete row.dataset.draft;
      const tick = row.querySelector(".pick-btn");
      if (tick) tick.classList.remove("empty");
      /* 转正后补一个可点的删除按钮 */
      if (!row.querySelector("[data-act='del-defect']")) {
        row.insertAdjacentHTML(
          "beforeend",
          `<button class="btn sm icon ghost" data-act="del-defect"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`
        );
      }
      resetDraftRow(row.parentElement);
    }
  }
  scheduleSave(wrap);
};

/* ---------------- 自动保存 ---------------- */

const pendingSave = new Map();
/* 评分滑块解锁后的自动回锁定时器 */
const lockTimers = new Map();

function collectSample(el) {
  const wrap = el.closest(".sample");
  const baseSample = wrap ? (state.session?.samples || []).find((x) => x.id === Number(wrap.dataset.id)) : null;
  const payload = {};
  el.querySelectorAll("[data-f]").forEach((input) => {
    const key = input.dataset.f;
    if (input.type === "number") payload[key] = input.value === "" ? null : Number(input.value);
    else payload[key] = input.value;
  });
  const baseScores = { ...(baseSample?.scores || {}) };
  el.querySelectorAll(".slider-row[data-s]").forEach((row) => {
    const raw = row.dataset.value;
    const k = row.dataset.s;
    if (raw !== "") baseScores[k] = Number(raw);
    else delete baseScores[k];
    row.classList.toggle("filled", raw !== "");
  });
  payload.scores = baseScores;
  if (el.querySelector(".defect-list")) {
    payload.defects = [...el.querySelectorAll("[data-defect]")]
      .map((row) => ({
        desc: (row.querySelector('[data-d="desc"]').value || "").trim(),
        cups: Number(row.querySelector(".cups").value) || 0,
        level: row.querySelector('[data-act="toggle-level"]').classList.contains("on") ? "fault" : "taint",
      }))
      .filter((d) => d.desc);
  }

  /* 风味：以库里的为基线，只覆盖页面上出现的那几个环节 */
  const stageTags = normalizeStageTags(baseSample?.stageTags, baseSample?.tags);
  el.querySelectorAll("[data-stage-block][data-stage]").forEach((block) => {
    stageTags[block.dataset.stage] = [...block.querySelectorAll("[data-picked] .fchip[data-tag]")].map(
      (b) => b.dataset.tag
    );
  });

  payload.stageTags = stageTags;
  payload.tags = allTagsOf(stageTags);
  const baseNotes = { ...(baseSample?.stageNotes || {}) };
  const noteInput = el.querySelector(".picked-row .tag-input");
  if (noteInput) {
    const stageOfInput = noteInput.closest("[data-stage-block]")?.dataset.stage;
    const v = noteInput.value.trim();
    if (stageOfInput) {
      if (v) baseNotes[stageOfInput] = v;
      else delete baseNotes[stageOfInput];
    }
  }
  payload.stageNotes = baseNotes;
  const noteEl = el.querySelector("[data-f='note']");
  if (noteEl) payload.note = noteEl.value;
  return payload;
}

async function saveSample(wrap) {
  const id = Number(wrap.dataset.id);
  const sbody = wrap.querySelector(".sbody");
  const payload = collectSample(sbody);
  try {
    const saved = await api("PATCH", `/api/samples/${id}`, payload);
    const idx = state.session.samples.findIndex((x) => x.id === id);
    if (idx >= 0) state.session.samples[idx] = { ...state.session.samples[idx], ...saved };
    refreshRow(wrap, saved);
    /* 保存成功后刷新「我填过」的记忆词，下一次打开下拉就能看到刚填的 */
    if ("origin" in payload || "process" in payload || "variety" in payload || "roastLevel" in payload) {
      loadKnown();
    }
    const hint = sbody.querySelector(`[data-hint="${id}"]`);
    if (hint) {
      hint.classList.add("show");
      setTimeout(() => hint.classList.remove("show"), 1200);
    }
    const totalEl = sbody.querySelector("[data-total]");
    if (totalEl) totalEl.textContent = num(sampleTotal(saved));
    if (state.stageFlow) {
      const bar = app.querySelector(".sgbar");
      if (bar) bar.outerHTML = stageRibbon();
    }
  } catch (err) {
    toast(err.message, true);
  }
}

function refreshRow(wrap, s) {
  const row = wrap.querySelector(".srow");
  if (!row) return;
  row.querySelector(".n").textContent = s.name;
  row.querySelector(".m").textContent = sampleMeta(s) || "—";
  const total = sampleTotal(s);
  row.querySelector(".score").innerHTML =
    total > 0 ? `<b>${num(total)}</b><span>/${ATTRS.length * 10}</span>` : `<span style="color:var(--ink-3)">未评</span>`;
  row.querySelector(".tags").innerHTML = (s.tags || [])
    .slice(0, 4)
    .map((t) => `<span class="chip">${esc(t)}</span>`)
    .join("");
}

const scheduleSave = debounce((wrap) => saveSample(wrap), 600);

/* ---------------- 图片 ---------------- */

function pickPhotos(target) {
  state.uploadTarget = target;
  filePicker.value = "";
  filePicker.click();
}

filePicker.addEventListener("change", async () => {
  const files = [...filePicker.files];
  if (!files.length) return;
  const target = state.uploadTarget;
  if (!target) return;
  await uploadFiles(files, target);
});

async function compressImage(file, max = 1800, quality = 0.86) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) throw new Error("压缩失败");
    return { blob, width, height, name: file.name.replace(/\.[^.]+$/, "") + ".jpg" };
  } catch {
    return { blob: file, width: 0, height: 0, name: file.name || "photo.jpg" };
  }
}

async function uploadFiles(files, target) {
  const images = files.filter((f) => f.type.startsWith("image/"));
  if (!images.length) return toast("只能加图片文件", true);

  const holder =
    target.sampleId
      ? app.querySelector(`.sample[data-id="${target.sampleId}"] .thumbs`)
      : document.getElementById("sessionThumbs");

  const placeholders = images.map((f) => {
    const ph = document.createElement("div");
    ph.className = "thumb uploading";
    if (holder) holder.appendChild(ph);
    return ph;
  });

  let ok = 0;
  for (let i = 0; i < images.length; i++) {
    const file = images[i];
    try {
      const { blob, width, height, name } = await compressImage(file);
      const form = new FormData();
      form.append("file", blob, name);
      if (target.sampleId) form.append("sample_id", String(target.sampleId));
      else form.append("session_id", String(target.sessionId));
      if (width) form.append("width", String(width));
      if (height) form.append("height", String(height));

      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "上传失败");
      }
      ok++;
    } catch (err) {
      toast(err.message, true);
    } finally {
      placeholders[i]?.remove();
    }
  }

  if (ok) {
    toast(`已加 ${ok} 张`);
    state.thumbs = null;
    await loadSession(state.session.id, { keepScroll: true });
    if (target.sampleId) {
      state.openId = target.sampleId;
      const el = app.querySelector(`.sample[data-id="${target.sampleId}"]`);
      if (el && !el.classList.contains("open")) {
        el.classList.add("open");
        el.querySelector(".sbody").hidden = false;
      }
    }
  }
}

function zoomPhoto(photoId) {
  const se = state.session;
  if (!se) return;
  const all = [
    ...se.photos.map((p, i) => ({ ...p, cap: se.title })),
    ...se.samples.flatMap((s) => s.photos.map((p) => ({ ...p, cap: s.name, sampleId: s.id }))),
  ];
  const index = all.findIndex((p) => p.id === photoId);
  if (index < 0) return;
  showLightbox(all, index);
}

function showLightbox(items, index) {
  state.lightbox = { items, index };
  const draw = () => {
    const { items, index } = state.lightbox;
    const item = items[index];
    layer.innerHTML = `
      <div class="lightbox">
        <button class="btn icon close" data-lb="close" style="background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.18);color:#fff">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
        ${index > 0 ? `<button class="nav prev" data-lb="prev"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>` : ""}
        ${index < items.length - 1 ? `<button class="nav next" data-lb="next"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>` : ""}
        <img src="${item.url}" alt="" />
        <div class="cap">${esc(item.cap || "")} ${items.length > 1 ? `· ${index + 1}/${items.length}` : ""}</div>
      </div>`;
  };
  draw();

  layer.querySelector(".lightbox").addEventListener("click", (e) => {
    const act = e.target.closest("[data-lb]")?.dataset.lb;
    if (!act) {
      if (e.target.tagName === "IMG") return;
      closeLightbox();
      return;
    }
    if (act === "close") return closeLightbox();
    const { items } = state.lightbox;
    if (act === "prev" && state.lightbox.index > 0) state.lightbox.index--;
    if (act === "next" && state.lightbox.index < items.length - 1) state.lightbox.index++;
    draw();
  });
}

function closeLightbox() {
  state.lightbox = null;
  layer.innerHTML = "";
}

/* ---------------- 事件 ---------------- */

app.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  const se = state.session;

  // 头像/顶栏等公共
  if (act === "back") return go("/");
  if (act === "open-session") return go(`/s/${el.dataset.id}`);
  if (act === "new-session") return newSessionDialog();

  if (act === "edit-session") return editSessionDialog();
  if (act === "export-session") return openExportDialog({ scope: "session", id: se.id, title: se.title });
  if (act === "export-all") {
    if (!state.sessions || !state.sessions.length) await loadList();
    return openExportDialog({ scope: "all" });
  }
  if (act === "duplicate-session") {
    try {
      const created = await api("POST", `/api/sessions/${se.id}/duplicate`);
      toast("已复测（空白评分）");
      state.thumbs = null;
      return go(`/s/${created.id}`);
    } catch (err) {
      return toast(err.message, true);
    }
  }
  if (act === "delete-session") {
    const id = Number(el.dataset.id || (se && se.id));
    const title = el.dataset.title || (se && se.title) || "这场杯测";
    const count = el.dataset.count || (se ? se.samples.length : "");
    /* 第一次确认 */
    const first = await confirmDialog({
      title: `删除「${title}」？`,
      text: `整场杯测${count ? `和里面 ${count} 支样品` : ""}会一起移入回收站，30 天内都可以还原。`,
      confirmText: "移入回收站",
      danger: true,
    });
    if (!first) return;
    /* 第二次确认 */
    const second = await confirmDialog({
      title: "再确认一次",
      text: `回收站保留 30 天，到期会自动彻底删除，之后找不回来。`,
      confirmText: "确定删除",
      danger: true,
    });
    if (!second) return;
    try {
      await api("DELETE", `/api/sessions/${id}`);
      state.thumbs = null;
      toast("已移入回收站");
      if (location.pathname.startsWith("/s/")) go("/");
      else render();
    } catch (err) {
      toast(err.message, true);
    }
    return;
  }

  if (act === "add-sample") {
    addSamplesDialog();
    return;
  }

  if (act === "toggle-slider-lock") {
    const block = el.closest(".stage-block");
    const row = block?.querySelector(".slider-row");
    const range = row?.querySelector("input[type=range]");
    if (!row || !range) return;
    const unlock = row.classList.contains("locked");
    row.classList.toggle("locked", !unlock);
    range.disabled = !unlock;
    block.querySelector(".sl-lock")?.classList.toggle("unlocked", unlock);
    if (unlock) {
      /* 解锁后 6 秒没动就自动锁回去，避免一直处于可误触状态 */
      clearTimeout(lockTimers.get(row));
      lockTimers.set(row, setTimeout(() => {
        row.classList.add("locked");
        range.disabled = true;
        block.querySelector(".sl-lock")?.classList.remove("unlocked");
      }, 6000));
    } else {
      clearTimeout(lockTimers.get(row));
      lockTimers.delete(row);
    }
    return;
  }

  if (act === "toggle-info-mode") {
    state.infoMode = !(state.infoMode === true || document.querySelector(".itable") !== null);
    state.openId = null;
    renderDetail();
    return;
  }

  if (act === "batch-fill") {
    batchFillDialog();
    return;
  }

  if (act === "stage-flow-enter") {
    state.stageFlow = true;
    state.infoMode = false;
    state.stage = "dry";
    state.openId = null;
    renderDetail();
    return;
  }

  if (act === "stage-flow-exit") {
    state.stageFlow = false;
    renderDetail();
    return;
  }

  if (act === "stage-flow-next") {
    const i = NOTE_STAGES.findIndex((x) => x.key === state.stage);
    const next = NOTE_STAGES[i + 1];
    if (next) {
      state.stage = next.key;
      renderDetail();
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    return;
  }

  if (act === "stage-flow-done") {
    toast("五个环节都记完了");
    state.stageFlow = false;
    renderDetail();
    return;
  }

  if (act === "pick-stage-flow") {
    state.stage = el.dataset.stage;
    renderDetail();
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  if (act === "toggle-sample") {
    const wrap = el.closest(".sample");
    const body = wrap.querySelector(".sbody");
    const open = !wrap.classList.contains("open");
    wrap.classList.toggle("open", open);
    body.hidden = !open;
    state.openId = open ? Number(wrap.dataset.id) : null;
    return;
  }

  if (act === "delete-sample") {
    const wrap = el.closest(".sample");
    const id = Number(el.dataset.id);
    const nameInput = wrap.querySelector('[data-f="name"]');
    const name = nameInput ? nameInput.value : "这支样品";
    const ok = await confirmDialog({
      title: `删除「${name}」？`,
      text: "样品和它的照片会进回收站，之后可以还原。",
      confirmText: "删除",
      danger: true,
    });
    if (!ok) return;
    try {
      await api("DELETE", `/api/samples/${id}`);
      state.openId = null;
      toast("已移入回收站");
      await loadSession(se.id, { keepScroll: true });
    } catch (err) {
      toast(err.message, true);
    }
    return;
  }

  if (act === "move-sample") {
    try {
      await api("POST", `/api/samples/${el.dataset.id}/move`, { direction: el.dataset.dir });
      await loadSession(se.id, { keepScroll: true });
    } catch (err) {
      toast(err.message, true);
    }
    return;
  }

  if (act === "toggle-stage") {
    const block = el.closest("[data-stage-block]");
    const list = block.closest(".stages");
    const wasOpen = block.classList.contains("open");
    /* 手风琴：一次只开一块，填完收起后视野干净 */
    list.querySelectorAll(".stage-block").forEach((b) => {
      b.classList.remove("open");
      const body = b.querySelector(".stage-body");
      if (body) body.hidden = true;
    });
    if (!wasOpen) {
      block.classList.add("open");
      block.querySelector(".stage-body").hidden = false;
    }
    return;
  }

  if (act === "toggle-group") {
    const group = el.closest(".fg");
    const picker = group.closest(".flavor-picker");
    const panel = picker && picker.querySelector("[data-panel]");
    const block = group.closest("[data-stage-block]");
    const picked = block ? [...block.querySelectorAll("[data-picked] .fchip[data-tag]")].map((b) => b.dataset.tag) : [];
    if (!panel) return;
    const same = !panel.hidden && panel.dataset.group === group.dataset.fg;
    picker.querySelectorAll(".fg.open").forEach((g) => g.classList.remove("open"));
    if (same) {
      panel.hidden = true;
      panel.innerHTML = "";
      panel.dataset.group = "";
      return;
    }
    group.classList.add("open");
    panel.dataset.group = group.dataset.fg;
    panel.style.order = String([...picker.querySelectorAll(".fg")].indexOf(group) + 1);
    panel.innerHTML = flavorPanelHtml(group.dataset.fg, picked);
    panel.hidden = false;
    const r = panel.getBoundingClientRect();
    if (r.bottom > window.innerHeight - 12) panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
    return;
  }

  if (act === "close-panel") {
    const panel = el.closest("[data-panel]");
    const picker = panel?.closest("[data-picker]");
    if (panel) {
      panel.hidden = true;
      panel.innerHTML = "";
      panel.dataset.group = "";
    }
    picker?.querySelectorAll(".fg.open").forEach((g) => g.classList.remove("open"));
    return;
  }

  if (act === "pick-flavor") {
    const wrap = el.closest(".sample");
    const block = el.closest("[data-stage-block]");
    const stage = block.dataset.stage;
    const tag = el.dataset.tag;
    let picked = [...block.querySelectorAll("[data-picked] .fchip[data-tag]")].map((b) => b.dataset.tag);
    if (picked.includes(tag)) picked = picked.filter((t) => t !== tag);
    else picked.push(tag);
    refreshFlavor(wrap, stage, picked);
    scheduleSave(wrap);
    return;
  }

  if (act === "unpick-flavor") {
    const wrap = el.closest(".sample");
    const block = el.closest("[data-stage-block]");
    const stage = block.dataset.stage;
    const tag = el.dataset.tag;
    const picked = [...block.querySelectorAll("[data-picked] .fchip[data-tag]")]
      .map((b) => b.dataset.tag)
      .filter((t) => t !== tag);
    refreshFlavor(wrap, stage, picked);
    scheduleSave(wrap);
    return;
  }

  if (act === "stage-note") {
    const wrap = el.closest(".sample");
    const block = el.closest("[data-stage-block]");
    const stage = block.dataset.stage;
    const row = block.querySelector(".picked-row");
    if (row.querySelector(".tag-input")) return;
    const s0 = (state.session?.samples || []).find((x) => x.id === Number(wrap.dataset.id));
    const input = document.createElement("input");
    input.className = "tag-input";
    input.maxLength = 60;
    input.placeholder = L4("这一环节的备注", "Note for this stage", "この段階のメモ", "이 단계의 메모");
    input.value = s0?.stageNotes?.[stage] || "";
    row.insertBefore(input, el);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      const v = input.value.trim();
      const id = Number(wrap.dataset.id);
      const smp = (state.session?.samples || []).find((x) => x.id === id);
      if (smp) {
        smp.stageNotes = { ...(smp.stageNotes || {}) };
        if (v) smp.stageNotes[stage] = v;
        else delete smp.stageNotes[stage];
      }
      if (input.isConnected) input.remove();
      const tags = [...block.querySelectorAll("[data-picked] .fchip[data-tag]")].map((b) => b.dataset.tag);
      refreshFlavor(wrap, stage, tags);
      scheduleSave(wrap);
    };
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") commit();
      if (ev.key === "Escape") {
        input.value = s0?.stageNotes?.[stage] || "";
        commit();
      }
    });
    input.addEventListener("blur", commit);
    return;
  }

  if (act === "add-tag") {
    const wrap = el.closest(".sample");
    const block = el.closest("[data-stage-block]");
    const stage = block.dataset.stage;
    const row = block.querySelector(".picked-row");
    const input = document.createElement("input");
    input.className = "tag-input";
    input.maxLength = 12;
    input.placeholder = L4("自定义风味", "Custom flavor", "カスタム風味", "사용자 향미");
    row.insertBefore(input, el);
    input.focus();
    const commit = () => {
      const v = input.value.trim();
      if (v) {
        const picked = [...block.querySelectorAll("[data-picked] .fchip[data-tag]")].map((b) => b.dataset.tag);
        if (!picked.includes(v)) picked.push(v);
        refreshFlavor(wrap, stage, picked);
        scheduleSave(wrap);
      } else {
        input.remove();
      }
    };
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") commit();
      if (ev.key === "Escape") input.remove();
    });
    input.addEventListener("blur", commit);
    return;
  }

  if (act === "toggle-level") {
    el.classList.toggle("on");
    el.textContent = el.classList.contains("on") ? "缺陷" : "瑕疵";
    scheduleSave(el.closest(".sample"));
    return;
  }

  if (act === "del-defect") {
    const wrap = el.closest(".sample");
    const list = wrap.querySelector(".defect-list");
    el.closest(".defect-row").remove();
    [...list.querySelectorAll("[data-defect]")].forEach((r, i) => (r.dataset.defect = String(i)));
    resetDraftRow(list);
    // 直接从 DOM 重算，绕过 state
    const payload = collectSample(wrap.querySelector(".sbody"));
    try {
      const saved = await api("PATCH", `/api/samples/${wrap.dataset.id}`, payload);
      const idx = state.session.samples.findIndex((x) => x.id === saved.id);
      if (idx >= 0) state.session.samples[idx] = { ...state.session.samples[idx], ...saved };
      refreshRow(wrap, saved);
      const totalEl = wrap.querySelector("[data-total]");
      if (totalEl) totalEl.textContent = num(sampleTotal(saved));
    } catch (err) {
      toast(err.message, true);
    }
    return;
  }

  if (act === "pick-photo") {
    const target = el.dataset.target === "sample"
      ? { sampleId: Number(el.dataset.sample) }
      : { sessionId: se.id };
    return pickPhotos(target);
  }

  if (act === "del-photo") {
    e.stopPropagation();
    const ok = await confirmDialog({
      title: "删除这张照片？",
      text: "会进回收站，之后可以还原。",
      confirmText: "删除",
      danger: true,
    });
    if (!ok) return;
    try {
      await api("DELETE", `/api/photos/${el.dataset.id}`);
      state.thumbs = null;
      await loadSession(se.id, { keepScroll: true });
    } catch (err) {
      toast(err.message, true);
    }
    return;
  }

  if (act === "zoom") {
    return zoomPhoto(Number(el.dataset.id));
  }

  if (act === "open-trash") return openTrash();

  if (act === "lang") return openLangPicker();
  if (act === "find-bean") return openBeanSearch();
});

/* 输入：自动保存 */
app.addEventListener("input", (e) => {
  const wrap = e.target.closest(".sample");
  if (!wrap) return;
  /* 分数数字框：直接手打，边打边同步滑块与合计 */
  if (e.target.matches("input.sl-val")) {
    const el = e.target;
    let raw = el.value.replace(/[^0-9.]/g, "");
    const bits = raw.split(".");
    if (bits.length > 2) raw = bits[0] + "." + bits.slice(1).join("");
    if (raw.startsWith(".")) raw = "0" + raw;
    if (Number(raw) > 10) raw = "10";
    if (raw !== el.value) el.value = raw;
    const row = el.closest(".slider-row");
    if (row) {
      paintSlider(row, raw === "" || raw === "." ? 0 : Number(raw));
      updateTotal(wrap);
    }
    scheduleSave(wrap);
    return;
  }
  /* 滑块：实时更新数值与合计 */
  if (e.target.matches("input[type=range][data-range]")) {
    const row = e.target.closest(".slider-row");
    setSlider(row, e.target.value);
    const t = lockTimers.get(row);
    if (t) {
      clearTimeout(t);
      const block = row.closest(".stage-block");
      lockTimers.set(row, setTimeout(() => {
        row.classList.add("locked");
        row.querySelector("input[type=range]").disabled = true;
        block?.querySelector(".sl-lock")?.classList.remove("unlocked");
      }, 6000));
    }
  }
  scheduleSave(wrap);
});

/* 数字框：回车收键盘（触发 change 落库），Esc 还原成聚焦前的值 */
app.addEventListener("focusin", (e) => {
  if (!e.target.matches("input.sl-val")) return;
  const row = e.target.closest(".slider-row");
  if (row) row.dataset.prev = e.target.value;
});

app.addEventListener("keydown", (e) => {
  if (!e.target.matches("input.sl-val")) return;
  if (e.key === "Enter") {
    e.preventDefault();
    e.target.blur();
  } else if (e.key === "Escape") {
    e.preventDefault();
    const row = e.target.closest(".slider-row");
    if (row) setSlider(row, Number(row.dataset.prev) || 0);
    e.target.blur();
  }
});

app.addEventListener("change", (e) => {
  const wrap = e.target.closest(".sample");
  if (!wrap) return;
  if (e.target.matches("input.sl-val")) {
    const row = e.target.closest(".slider-row");
    const raw = e.target.value.trim();
    const v = raw === "" ? 0 : Math.min(10, Math.max(0, Number(raw) || 0));
    /* 失焦时按滑块的步长落定，数字和滑块永远对得上 */
    const range = row ? row.querySelector("input[type=range]") : null;
    const snapped = range && range.value !== "" ? Number(range.value) : v;
    if (row) setSlider(row, snapped);
    saveSample(wrap);
    return;
  }
  if (e.target.matches("[data-f], .cups")) saveSample(wrap);
});

/* 把某一支的烘焙日 / 养豆天数顺着往后抄给还空着的样品 */
async function fillDownField(wrap, key, value) {
  const v = String(value ?? "").trim();
  if (!v) return;
  const list = [...app.querySelectorAll(".sample")];
  const at = list.indexOf(wrap);
  if (at < 0) return;
  const targets = list.slice(at + 1).filter((w) => {
    const cur = (state.session?.samples || []).find((x) => x.id === Number(w.dataset.id));
    const filled =
      key === "restDays"
        ? cur?.restDays !== null && cur?.restDays !== undefined && String(cur.restDays).trim() !== ""
        : String(cur?.[key] ?? "").trim() !== "";
    return !filled; /* 已经填过的不覆盖 */
  });
  if (!targets.length) return;
  for (const w of targets) {
    const inp = w.querySelector(`.sbody [data-f="${key}"]`);
    const id = Number(w.dataset.id);
    const payload = key === "restDays" ? { restDays: Number(v) } : { [key]: v };
    try {
      const saved = await api("PATCH", `/api/samples/${id}`, payload);
      const idx = state.session.samples.findIndex((x) => x.id === id);
      if (idx >= 0) state.session.samples[idx] = { ...state.session.samples[idx], ...saved };
      inp.value = v;
      if (key === "roastDate" && idx >= 0) refreshRow(w, state.session.samples[idx]);
    } catch {
      /* 单支失败不影响其它支 */
    }
  }
  toast(key === "restDays" ? `养豆天数已填 ${targets.length} 支` : `烘焙日已填 ${targets.length} 支`);
}

/* 滑块上滚轮会静默改分数（滚动查看更多样品时很容易误触），改成让页面正常滚动、分数不动 */
app.addEventListener("wheel", (e) => {
  if (!e.target.matches || !e.target.matches('input[type="range"]')) return;
  e.preventDefault();
  e.target.blur();
  window.scrollBy({ top: e.deltaY, left: 0, behavior: "auto" });
}, { passive: false });

/* 粘贴 */
document.addEventListener("paste", (e) => {
  if (state.view !== "detail" || !state.session) return;
  if (e.target.closest("input, textarea")) return;
  const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith("image/"));
  if (!files.length) return;
  e.preventDefault();
  uploadFiles(files, { sessionId: state.session.id });
});

/* 拖拽 */
let dragDepth = 0;
window.addEventListener("dragenter", (e) => {
  if (state.view !== "detail" || !state.session) return;
  if (![...(e.dataTransfer?.types || [])].includes("Files")) return;
  dragDepth++;
  if (dragDepth === 1) {
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.textContent = "松手就加到这场杯测的现场照片";
    document.body.appendChild(dz);
  }
});
window.addEventListener("dragleave", () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) document.querySelector(".dropzone")?.remove();
});
window.addEventListener("dragover", (e) => {
  if (state.view === "detail" && state.session) e.preventDefault();
});
window.addEventListener("drop", (e) => {
  document.querySelector(".dropzone")?.remove();
  dragDepth = 0;
  if (state.view !== "detail" || !state.session) return;
  const files = [...(e.dataTransfer?.files || [])];
  if (!files.length) return;
  e.preventDefault();
  uploadFiles(files, { sessionId: state.session.id });
});

/* ---------------- 场次弹窗 ---------------- */

/* 加样品：一次可以加多支 */
/* 词库值（产地/处理法/烘焙度等）在英文界面下也转成英文，拼成一行摘要 */
function termList(vals) {
  const on = !!(window.I18N && window.I18N.on);
  return vals.filter(Boolean).map((v) => (on ? window.I18N.t(v) : v)).join(" · ");
}

/* 统一填写：一次把同一产区/处理法/烘焙度套到多支样品上。
   两步确认：先在弹窗里选「改哪几项 + 应用到哪几支」，点「下一步」后再弹一次确认框列出具体改动。 */
function batchFillDialog() {
  const se = state.session;
  if (!se || !se.samples.length) return toast("还没有样品");

  const { mask, close } = openModal(`
    <div class="mhead"><h3>一键填写</h3><button class="icon" data-close>×</button></div>
    <div class="mbody">
      <div class="bhint">只改你填了的项，留空的保持原样。同一个产区只差几支时，先统一再单独改那几支。</div>
      <div class="field-grid batch-grid">
        <div class="field"><label>产地</label>${comboField("origin", "", ORIGINS, "", { title: "选产地" })}</div>
        <div class="field"><label>处理法</label>${comboField("process", "", PROCESSES, "", { title: "选处理法" })}</div>
        <div class="field"><label>烘焙度</label>${comboField("roastLevel", "", [{ g: "烘焙度", items: ROASTS }], "", { title: "选烘焙度" })}</div>
        <div class="field"><label>烘焙日</label><input id="bDate" type="date" /></div>
        <div class="field"><label>养豆天数</label><input id="bRest" type="number" min="0" max="365" /></div>
        <div class="field"><label>烘焙机</label>${comboField("roaster", "", [], "", { title: "选烘焙机" })}</div>
      </div>
      <div class="bhead">
        <span class="t">应用到哪些样品</span>
        <span class="bcnt" id="bCnt">${se.samples.length}</span>
        <div class="spacer"></div>
        <button class="btn sm ghost" data-b="all">全选</button>
        <button class="btn sm ghost" data-b="none">全不选</button>
      </div>
      <div class="batch-list" id="bList">
        ${se.samples
          .map(
            (s) => `<label class="batch-item">
              <input type="checkbox" value="${s.id}" checked />
              <span class="bi-name">${esc(s.name)}</span>
              <span class="bi-cur">${esc(termList([s.origin, s.process, s.roastLevel, s.restDays !== null && s.restDays !== undefined ? `养豆 ${s.restDays} 天` : "", s.roaster]) || "未填")}</span>
            </label>`
          )
          .join("")}
      </div>
    </div>
    <div class="mfoot"><div class="grow"></div><button class="btn" data-close>取消</button>
      <button class="btn primary" id="bGo">下一步</button></div>
  `, { wide: true });

  if (window.Picker) window.Picker.mount(mask);

  const list = mask.querySelector("#bList");
  const cnt = mask.querySelector("#bCnt");
  const boxes = () => [...list.querySelectorAll("input[type=checkbox]")];
  const syncCnt = () => {
    const n = boxes().filter((b) => b.checked).length;
    cnt.textContent = String(n);
    cnt.classList.toggle("zero", n === 0);
  };
  list.addEventListener("change", syncCnt);
  mask.addEventListener("click", (e) => {
    const b = e.target.closest("[data-b]");
    if (!b) return;
    boxes().forEach((x) => (x.checked = b.dataset.b === "all"));
    syncCnt();
  });

  mask.querySelector("#bGo").addEventListener("click", async () => {
    const val = (k) => (mask.querySelector(`input[data-f="${k}"]`)?.value || "").trim();
    const patch = {};
    const parts = [];
    const o = val("origin"), pr = val("process"), rl = val("roastLevel"), rd = mask.querySelector("#bDate").value;
    const rst = (mask.querySelector("#bRest").value || "").trim();
    const rt = val("roaster");
    if (o) { patch.origin = o; parts.push(`产地 → ${o}`); }
    if (pr) { patch.process = pr; parts.push(`处理法 → ${pr}`); }
    if (rl) { patch.roastLevel = rl; parts.push(`烘焙度 → ${rl}`); }
    if (rd) { patch.roastDate = rd; parts.push(`烘焙日 → ${rd}`); }
    if (rst) { patch.restDays = Number(rst); parts.push(`养豆天数 → ${rst} 天`); }
    if (rt) { patch.roaster = rt; parts.push(`烘焙机 → ${rt}`); }
    if (!parts.length) return toast("先填至少一项", true);
    const ids = boxes().filter((b) => b.checked).map((b) => Number(b.value));
    if (!ids.length) return toast("至少选一支样品", true);

    const names = se.samples.filter((s) => ids.includes(s.id)).map((s) => s.name);
    const who = names.length <= 3 ? names.join("、") : `${names.slice(0, 3).join("、")} 等 ${names.length} 支`;
    const ok = await confirmDialog({
      title: "确认一键填写",
      text: `将把 ${who} 的 ${parts.join("；")}。<br><br>原有这些字段的值会被覆盖，确定吗？`,
      confirmText: "确认修改",
    });
    if (!ok) return;

    let done = 0;
    for (const id of ids) {
      try {
        await api("PATCH", `/api/samples/${id}`, patch);
        done += 1;
      } catch (err) {
        toast(`第 ${done + 1} 支失败：${err.message}`, true);
        break;
      }
    }
    close();
    state.openId = null;
    await loadSession(se.id, { keepScroll: true });
    toast(`已更新 ${done} 支`);
  });
}

function addSamplesDialog() {
  const se = state.session;
  const cur = se.samples.length;
  const max = Math.max(1, 40 - cur);
  const { mask, close } = openModal(`
    <div class="mhead"><h3>加样品</h3><button class="icon" data-close>×</button></div>
    <div class="mbody">
      <div class="field"><label>这次加几支（当前已有 ${cur} 支）</label>
        <div class="count-pick">
          ${[1, 2, 3, 4, 5, 6, 8].filter((n) => n <= max).map((n) => `<button class="cpick${n === 1 ? " on" : ""}" data-count="${n}">${n}</button>`).join("")}
          <input class="cnum" id="aCount" type="number" min="1" max="${max}" inputmode="numeric" placeholder="自定义" />
        </div>
      </div>
      <div class="hint" style="color:var(--ink-3);font-size:12px;margin-top:2px">最多还能加 ${max} 支</div>
    </div>
    <div class="mfoot"><div class="grow"></div><button class="btn" data-close>取消</button>
      <button class="btn primary" id="aSave">添加</button></div>
  `);
  const input = mask.querySelector("#aCount");
  mask.addEventListener("click", (e) => {
    const pick = e.target.closest(".cpick");
    if (!pick) return;
    mask.querySelectorAll(".cpick").forEach((b) => b.classList.toggle("on", b === pick));
    input.value = "";
  });
  input.addEventListener("input", () => {
    if (input.value) mask.querySelectorAll(".cpick").forEach((b) => b.classList.remove("on"));
  });
  const doAdd = async () => {
    const picked = mask.querySelector(".cpick.on");
    const n = Math.max(1, Math.min(max, Number(input.value) || (picked ? Number(picked.dataset.count) : 1)));
    try {
      await api("POST", `/api/sessions/${se.id}/samples`, { count: n });
      close();
      state.openId = null;
      await loadSession(se.id, { keepScroll: true });
      toast(`已加 ${n} 支`);
    } catch (err) {
      toast(err.message, true);
    }
  };
  mask.querySelector("#aSave").addEventListener("click", doAdd);
  mask.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doAdd();
  });
  input.focus();
}

function sessionForm({ title = "", date = todayStr(), host = "", note = "", count = 0 }) {
  return `
    <div class="mhead"><h3>${title ? "编辑杯测信息" : "新建一场杯测"}</h3><div style="flex:1"></div>
      <button class="btn sm icon ghost" data-close><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <div class="mbody">
      <div class="field-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
        <div class="field wide"><label>场次名称</label><input id="fTitle" value="${esc(title)}" /></div>
        <div class="field"><label>日期</label><input id="fDate" type="date" value="${esc(date)}" /></div>
        <div class="field"><label>主持 / 记录人</label><input id="fHost" value="${esc(host)}" /></div>
        ${count === null ? "" : `<div class="field wide"><label>这次有几支豆子</label>
          <div class="count-pick" id="fCount">
            ${[2, 3, 4, 5, 6, 8, 10].map((n) => `<button class="cpick${n === count ? " on" : ""}" data-count="${n}">${n}</button>`).join("")}
            <input class="cnum" id="fCountCustom" type="number" min="1" max="40" inputmode="numeric"
              placeholder="自定义" value="${count && ![2,3,4,5,6,8,10].includes(count) ? count : ""}" />
          </div>
        </div>`}
      </div>
      <div class="field"><label>备注</label><textarea class="note" id="fNote">${esc(note)}</textarea></div>
    </div>
    <div class="mfoot"><div class="grow"></div><button class="btn" data-close>取消</button>
      <button class="btn primary" id="fSave">保存</button></div>`;
}

function newSessionDialog() {
  const { mask, close } = openModal(sessionForm({ }));
  const titleInput = mask.querySelector("#fTitle");
  titleInput.focus();

  mask.addEventListener("click", (e) => {
    const pick = e.target.closest(".cpick");
    if (!pick) return;
    mask.querySelectorAll(".cpick").forEach((b) => b.classList.toggle("on", b === pick));
    mask.querySelector("#fCountCustom").value = "";
  });
  mask.querySelector("#fCountCustom").addEventListener("input", (e) => {
    if (e.target.value) mask.querySelectorAll(".cpick").forEach((b) => b.classList.remove("on"));
  });
  const save = async () => {
    try {
      const picked = mask.querySelector(".cpick.on");
      const custom = Number(mask.querySelector("#fCountCustom").value) || 0;
      const sampleCount = custom > 0 ? custom : picked ? Number(picked.dataset.count) : 0;
      const created = await api("POST", "/api/sessions", {
        title: mask.querySelector("#fTitle").value.trim(),
        cuppedOn: mask.querySelector("#fDate").value,
        host: mask.querySelector("#fHost").value.trim(),
        note: mask.querySelector("#fNote").value,
        sampleCount,
      });
      close();
      state.thumbs = null;
      state.infoMode = sampleCount > 0;
      state.openId = null;
      go(`/s/${created.id}`);
    } catch (err) {
      toast(err.message, true);
    }
  };
  mask.querySelector("#fSave").addEventListener("click", save);
  mask.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
  });
}

async function editSessionDialog() {
  const se = state.session;
  const { mask, close } = openModal(sessionForm({ title: se.title, date: se.cuppedOn, host: se.host, note: se.note, count: null }));
  mask.querySelector("#fSave").addEventListener("click", async () => {
    try {
      const updated = await api("PATCH", `/api/sessions/${se.id}`, {
        title: mask.querySelector("#fTitle").value.trim() || se.title,
        cuppedOn: mask.querySelector("#fDate").value,
        host: mask.querySelector("#fHost").value.trim(),
        note: mask.querySelector("#fNote").value,
      });
      state.session = updated;
      state.thumbs = null;
      close();
      renderDetail();
      toast("已保存");
    } catch (err) {
      toast(err.message, true);
    }
  });
}

/* ---------------- 回收站 ---------------- */

/* 快速找豆子：跨场次搜所有样品，点一条直接跳到那场并展开该样品 */
function closeAllModals() {
  layer.querySelectorAll(".mask").forEach((m) => m.remove());
}

function openLangPicker() {
  const cur = window.I18N?.lang || "zh";
  const item = (code, label, sub) => `
    <button class="lang-item${cur === code ? " on" : ""}" data-act="pick-lang" data-lang="${code}">
      <span class="li-l"><b>${label}</b><em>${sub}</em></span>
      <span class="li-ck">${cur === code ? '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>' : ""}</span>
    </button>`;
  const { mask } = openModal(
    `<div class="mhead"><h3>选择语言 / Language</h3><div style="flex:1"></div>
      <button class="btn sm icon ghost" data-close><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <div class="mbody" style="display:flex;flex-direction:column;gap:8px">
      ${item("zh", "中文", "简体中文界面")}
      ${item("en", "English", "English interface")}
      ${item("ja", "日本語", "日本語インターフェース")}
      ${item("ko", "한국어", "한국어 인터페이스")}
    </div>`
  );
  /* 弹窗挂在 #layer 上，不在 #app 的事件委托范围内，单独绑 */
  mask.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-act='pick-lang']");
    if (!pick) return;
    const next = pick.dataset.lang;
    if (next === (window.I18N?.lang || "zh")) return mask.remove();
    mask.remove();
    window.I18N.switchTo(next);
  });
}

/* ---------------- 关于 · 免责声明 ---------------- */

const ABOUT_ZH = {
  title: "关于 · 免责声明",
  sec1: "关于我们",
  p_about: [
    "Hi 我是 Benson，来自深圳，也有一家属于自己的咖啡店——Coffee Freedom。",
    "因为常参加杯测，我发现一个很真实的现象：大家在记录杯测数据时，用得最多的还是手机便签。手机便签确实快，拿起手机就能记，也很符合杯测桌上即时、直接的节奏。但一场杯测结束后，零散在手机里的记录往往很难整理、对比和复盘，也不方便和伙伴分享。",
    "在 AI 发展非常快速的今天，我们开始想：能不能做一个更顺手的杯测记录工具？于是开发这款杯测软件。",
    "App 里的操作逻辑，来自我日常杯测的个人习惯，也在尽量贴合真实杯测桌上的节奏——希望少一点打断，多一点专注，让记录这件事自然发生。我们不想让工具抢走注意力，而是希望它能帮你把注意力还给咖啡本身：闻香、啜吸、感受、判断，然后轻松记下。",
    "在我们看来，AI 不是要替代咖啡师的感官判断，也不是为了炫技。它更适合做那些重复、琐碎、需要整理的事：把手机便签里零散的记录结构化，把历史数据留下来，让对比和复盘变得更简单。最终做判断的，仍然是每一个坐在杯测桌前的人。",
    "这款软件从一家深圳咖啡店的日常里生长出来，也希望能成为更多咖啡人杯测桌上的小工具。它还不完美，但我们会持续打磨。",
    "也欢迎大家试用并反馈，如果觉得好用也可以分享给同样是咖啡师、烘焙师的朋友。希望大家能喜欢。",
  ],
  contactPre: "我的联系方式：",
  contactPost: " 看到邮件会第一时间回复，谢谢~",
  sec2: "免责声明",
  p_disc: [
    "本应用为开源、免费的咖啡杯测记录与辅助工具，按“现状”提供，不构成专业咖啡评测、食品安全检测、医疗或营养建议。杯测评分具有主观性，结果仅供学习、记录和交流参考。",
    "杯测涉及热水、咖啡因及可能的过敏原，请自行注意烫伤、咖啡因摄入和过敏风险；如您怀孕、对咖啡因敏感或有健康问题，请咨询医生。是否吞咽咖啡请根据自身情况决定。",
    "在法律允许范围内，开发者不对因使用或无法使用本应用造成的间接损失、数据丢失或决策后果承担责任。本应用不提供可用性、准确性或持续维护承诺。源代码依据项目 LICENSE 文件授权；如本声明与许可证冲突，以许可证为准。",
    "本项目目前免费开源，不收取费用，也不代表开发者提供商业服务或技术支持。联系方式：",
  ],
  close: "关闭",
};

const ABOUT_EN = {
  title: "About · Disclaimer",
  sec1: "About us",
  p_about: [
    "Hi, I'm Benson. I'm based in Shenzhen, and I run my own coffee shop — Coffee Freedom.",
    "Because I cup often, I kept noticing something: when people record cupping data, most of us still use the notes app on our phones. Phone notes are genuinely fast — pick up the phone and type — and they fit the immediate, direct rhythm of a cupping table. But once a session ends, scattered notes are hard to tidy up, compare, or review, and hard to share with teammates.",
    "With AI moving as fast as it is, we started asking: could we build a smoother cupping tool? So we made this app.",
    "The way the app works comes from my own cupping habits, and it tries to follow the real rhythm of a cupping table — fewer interruptions, more focus, so recording happens naturally. We don't want the tool to steal your attention; we want it to give your attention back to the coffee: smell, slurp, feel, judge — then jot it down easily.",
    "To us, AI isn't here to replace a barista's sensory judgment, and it isn't for showing off. It's better at the repetitive, fiddly, organisational work: turning scattered notes into structured data, keeping the history, making comparison and review simpler. The final call still belongs to the person sitting at the cupping table.",
    "This app grew out of the daily life of a Shenzhen coffee shop, and we hope it becomes a small tool on more coffee people's cupping tables. It isn't perfect yet, but we'll keep polishing it.",
    "Please give it a try and send us feedback — and if you find it useful, share it with friends who are baristas or roasters. We hope you like it.",
  ],
  contactPre: "Contact: ",
  contactPost: " — I reply to every email as soon as I see it. Thank you!",
  sec2: "Disclaimer",
  p_disc: [
    "This app is an open-source, free cupping record and assistance tool, provided “as is”. It does not constitute professional coffee evaluation, food safety testing, medical or nutritional advice. Cupping scores are subjective; results are for learning, record-keeping and discussion only.",
    "Cupping involves hot water, caffeine and possible allergens. Please mind scalding, caffeine intake and allergy risks on your own. If you are pregnant, caffeine-sensitive, or have health concerns, consult a doctor. Whether to swallow the coffee is your own decision.",
    "To the extent permitted by law, the developer is not liable for indirect losses, data loss, or decisions made as a result of using or being unable to use this app. This app promises no availability, accuracy, or ongoing maintenance. Source code is licensed under the project LICENSE; if this notice conflicts with the license, the license prevails.",
    "This project is currently free and open-source, charges no fees, and does not mean the developer provides commercial services or technical support. Contact:",
  ],
  close: "Close",
};

const ABOUT_JA = {
  "title": "このアプリについて・免責事項",
  "sec1": "私たちについて",
  p_about: [
    "こんにちは、Benson です。深圳を拠点に、自分のコーヒーショップ Coffee Freedom を営んでいます。",
    "カッピングに頻繁に参加する中で、とても現実的な光景に気づきました。カッピングの記録に最もよく使われているのは、今でもスマホのメモ帳だということです。メモ帳は確かに速く、スマホを手に取ればすぐ書けますし、カッピングテーブルの即時性・直接性にも合っています。しかし1回のカッピングが終わると、スマホに散らばった記録は整理も比較も振り返りも難しく、仲間と共有するのも面倒です。",
    "AI が非常に速く進歩している今、私たちは考え始めました。もっと使いやすいカッピング記録ツールは作れないだろうか、と。こうしてこのアプリを作りました。",
    "アプリの操作ロジックは、私自身の日々のカッピングの習慣から来ており、実際のカッピングテーブルのリズムにできるだけ寄り添うようにしています。中断を少なく、集中を多く。記録が自然に起こるように。ツールに注意を奪われるのではなく、注意力をコーヒーそのものに返したい。香りを嗅ぎ、すする。感じて、判断して、そして気軽に記録する。",
    "私たちにとって AI は、バリスタの感覚的判断を置き換えるものでも、技術自慢のためのものでもありません。AI が向いているのは、繰り返しが多く、細かく、整理が必要な仕事です。散らばったメモを構造化し、履歴を残し、比較と振り返りを簡単にする。最終的な判断は、カッピングテーブルに座る一人ひとりに残ります。",
    "このアプリは深圳のコーヒーショップの日常から生まれました。より多くのコーヒー人のカッピングテーブルの小さな道具になればと思っています。まだ完璧ではありませんが、磨き続けます。",
    "ぜひ試してフィードバックをください。良ければバリスタや焙煎士の友人にも共有してください。気に入っていただけるとうれしいです。"
  ],
  "contactPre": "連絡先：",
  "contactPost": " メールは拝見次第すぐにお返事します。ありがとうございます。",
  "sec2": "免責事項",
  p_disc: [
    "本アプリはオープンソースかつ無料のカッピング記録・補助ツールであり、「現状のまま」提供されます。専門的なコーヒー評価、食品安全検査、医療・栄養に関する助言を構成するものではありません。カッピングのスコアは主観的であり、結果は学習・記録・意見交換の参考に限られます。",
    "カッピングには高温の湯、カフェイン、アレルゲンの可能性があります。やけど、カフェイン摂取、アレルギーのリスクにはご自身でご注意ください。妊娠中、カフェインに敏感な方、健康上の懸念がある方は医師にご相談ください。コーヒーを飲み込むかどうかはご自身の判断で決めてください。",
    "法律で認められる範囲において、開発者は本アプリの使用または使用不能により生じた間接的損害、データの消失、意思決定の結果について責任を負いません。本アプリは可用性・正確性・継続的な保守を保証しません。ソースコードはプロジェクトの LICENSE に基づいて許諾されます。本免責事項がライセンスと矛盾する場合はライセンスが優先します。",
    "本プロジェクトは現在無料・オープンソースで、料金はいただいておらず、開発者が商用サービスや技術サポートを提供することを意味するものではありません。連絡先："
  ],
  "close": "閉じる"
};

const ABOUT_KO = {
  "title": "앱 정보 · 면책 고지",
  "sec1": "소개",
  p_about: [
    "안녕하세요, Benson입니다. 선전에서 제 커피숍 Coffee Freedom을 운영하고 있습니다.",
    "커핑에 자주 참가하면서 아주 현실적인 모습을 발견했습니다. 커핑 데이터를 기록할 때 여전히 가장 많이 쓰는 것은 휴대폰 메모장입니다. 메모장은 확실히 빠르고, 휴대폰만 들면 바로 적을 수 있으며, 커핑 테이블의 즉각적이고 직접적인 리듬에도 잘 맞습니다. 하지만 한 번의 커핑이 끝나면 휴대폰에 흩어진 기록은 정리와 비교, 되짚어보기가 어렵고 동료와 공유하기도 번거롭습니다.",
    "AI가 매우 빠르게 발전하는 지금, 우리는 생각하기 시작했습니다. 더 편한 커핑 기록 도구를 만들 수 있지 않을까, 하고. 그래서 이 앱을 만들었습니다.",
    "앱의 조작 방식은 제 일상적인 커핑 습관에서 나왔고, 실제 커핑 테이블의 리듬에 최대한 맞추려 합니다. 방해는 줄이고 집중은 늘리기. 기록이 자연스럽게 일어나도록. 도구가 주의를 빼앗는 대신, 주의를 커피 자체로 돌려주고 싶습니다. 향을 맡고, 홀짝이고, 느끼고, 판단한 뒤 가볍게 적어 두는 것.",
    "우리에게 AI는 바리스타의 감각적 판단을 대체하는 것도, 기술 자랑도 아닙니다. AI는 반복적이고 자잘하며 정리가 필요한 일에 더 어울립니다. 흩어진 메모를 구조화하고, 이력을 남기고, 비교와 되짚어보기를 쉽게 만드는 일이죠. 최종 판단은 여전히 커핑 테이블에 앉은 사람의 몫입니다.",
    "이 앱은 선전의 한 커피숍 일상에서 자라났고, 더 많은 커피인들의 커핑 테이블 위 작은 도구가 되길 바랍니다. 아직 완벽하지 않지만 계속 다듬겠습니다.",
    "많이 사용해 보시고 피드백 주세요. 좋다고 느끼시면 바리스타, 로스터 친구들에게도 공유해 주세요. 마음에 드시길 바랍니다."
  ],
  "contactPre": "연락처: ",
  "contactPost": " 메일은 확인하는 대로 바로 답장드립니다. 감사합니다!",
  "sec2": "면책 고지",
  p_disc: [
    "이 앱은 오픈소스 무료 커핑 기록·보조 도구이며 \"있는 그대로\" 제공됩니다. 전문적인 커피 평가, 식품 안전 검사, 의료 또는 영양 조언을 구성하지 않습니다. 커핑 점수는 주관적이며 결과는 학습, 기록, 의견 교환의 참고용입니다.",
    "커핑에는 뜨거운 물, 카페인, 알레르기 유발 물질이 관련될 수 있습니다. 화상, 카페인 섭취, 알레르기 위험은 스스로 주의하세요. 임신 중이거나 카페인에 민감하거나 건강상 우려가 있으면 의사와 상담하세요. 커피를 삼킬지 여부는 본인이 판단하세요.",
    "법이 허용하는 범위에서 개발자는 이 앱의 사용 또는 사용 불능으로 인한 간접 손실, 데이터 손실, 의사결정 결과에 대해 책임지지 않습니다. 이 앱은 가용성, 정확성, 지속적 유지보수를 보장하지 않습니다. 소스 코드는 프로젝트 LICENSE에 따라 허가됩니다. 이 고지가 라이선스와 충돌하면 라이선스가 우선합니다.",
    "이 프로젝트는 현재 무료 오픈소스이며 비용을 받지 않고, 개발자가 상업적 서비스나 기술 지원을 제공함을 의미하지 않습니다. 연락처:"
  ],
  "close": "닫기"
};

function openAbout() {
  const lg = (window.I18N && window.I18N.lang) || "zh";
  const T = lg === "en" ? ABOUT_EN : lg === "ja" ? ABOUT_JA : lg === "ko" ? ABOUT_KO : ABOUT_ZH;
  const mail = "bensonqiuu@gmail.com";
  const sec = (t) => `<div class="about-sec">${t}</div>`;
  const ps = (arr) => arr.map((t) => `<p class="about-p">${t}</p>`).join("");
  const { mask } = openModal(
    `<button class="btn sm icon ghost about-x" data-close><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <div class="mbody about-body">
      <img class="about-logo" src="/logo.svg" alt="COFFEE FREEDOM" />

      ${sec(T.sec1)}
      ${ps(T.p_about)}
      <p class="about-sign">${T.contactPre}<a class="about-mail" href="mailto:${mail}">${mail}</a>${T.contactPost}</p>

      ${sec(T.sec2)}
      ${ps(T.p_disc.slice(0, -1))}
      <p class="about-p">${T.p_disc[T.p_disc.length - 1]}<a class="about-mail" href="mailto:${mail}">${mail}</a>${lg === "zh" ? "。" : "."}</p>
    </div>
    <div class="mfoot"><div class="grow"></div><button class="btn" data-close>${T.close}</button></div>`,
    { wide: true }
  );
  mask.style.alignItems = "flex-start";
  mask.style.padding = "4vh 18px 18px";
  mask.querySelector(".modal")?.classList.add("about-modal");
  return mask;
}

/* 页脚在 #app 之外，单独委托到 document */
document.addEventListener("click", (e) => {
  if (e.target.closest('[data-act="about"]')) {
    e.preventDefault();
    openAbout();
  }
});

async function openBeanSearch() {
  let list;
  try {
    list = await api("GET", "/api/beans-index");
  } catch (err) {
    return toast(err.message, true);
  }
  // 有名字/有分数的排前面，空着的样品沉底
  const weight = (s) => (s.scored ? 2 : 0) + (s.name && !/^样品 \d+$/.test(s.name) ? 1 : 0);
  list = [...list].sort((a, b) => weight(b) - weight(a));

  const hit = (s, q) => {
    if (!q) return true;
    const hay = [s.name, s.origin, s.process, s.variety, s.roastLevel, s.roaster, s.sessionTitle, s.sessionDate, (s.tags || []).join(" ")]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
  };

  const itemHtml = (s) => {
    const meta = [s.origin, s.process, s.variety, s.roastLevel, s.roaster].filter(Boolean).join(" · ");
    const tags = (s.tags || []).slice(0, 5);
    return `<button class="bean-item" data-bean-sample="${s.id}" data-bean-session="${s.sessionId}">
      <span class="bi-l">
        <b>${esc(s.name)}</b>
        <span class="bi-m">${meta ? esc(meta) : "还没填产地/处理法"}</span>
        ${tags.length ? `<span class="bi-tags">${tags.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</span>` : ""}
      </span>
      <span class="bi-r">
        <span class="bi-score">${s.scored ? `<b>${num(s.total)}</b><span>/${ATTRS.length * 10}</span>` : `<span class="bi-none">未评</span>`}</span>
        <span class="bi-s">${esc(s.sessionTitle)}</span>
      </span>
    </button>`;
  };

  const { mask, close } = openModal(
    `<div class="mhead"><h3>搜豆子</h3><span id="beanCount" style="color:var(--ink-3);font-size:12px">${list.length} 支</span>
       <div style="flex:1"></div>
       <button class="btn sm icon ghost" data-close><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
     </div>
     <div class="mbody" style="padding-bottom:16px">
       <div class="bean-search">
         <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
         <input id="beanQ" type="search" placeholder="豆子名、产地、处理法、品种、风味" autocomplete="off" />
       </div>
       <div class="bean-list" id="beanList">
         ${list.length ? list.map(itemHtml).join("") : `<div class="empty" style="border:none">还没有记录过的豆子</div>`}
       </div>
     </div>`,
    { wide: true }
  );

  const input = mask.querySelector("#beanQ");
  const box = mask.querySelector("#beanList");
  const count = mask.querySelector("#beanCount");

  const paint = () => {
    const q = input.value.trim();
    const hits = list.filter((s) => hit(s, q));
    count.textContent = q ? `${hits.length} / ${list.length} 支` : `${list.length} 支`;
    box.innerHTML = hits.length
      ? hits.map(itemHtml).join("")
      : `<div class="empty" style="border:none">没搜到「${esc(q)}」<br /><span style="font-size:12px;color:var(--ink-3)">换个词试试，或检查这支豆子是不是还没建过杯测</span></div>`;
  };

  input.addEventListener("input", paint);
  mask.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && box.firstElementChild?.dataset.beanSample) box.firstElementChild.click();
  });
  box.addEventListener("click", (e) => {
    const it = e.target.closest("[data-bean-sample]");
    if (!it) return;
    const sid = Number(it.dataset.beanSession);
    state.openId = Number(it.dataset.beanSample);
    state.focusSample = state.openId;
    close();
    if (location.pathname === `/s/${sid}`) renderDetail();
    else go(`/s/${sid}`);
  });

  input.focus();
}

/* ---------------- 导出 ---------------- */

/* 纯文字页（/t/11）方便手机上整页全选复制；同时保留 txt / csv 下载。
   主页导出可以按场次挑，不必一次全导。 */
const isWeChat = () => /MicroMessenger/i.test(navigator.userAgent);

/* 安卓离线版：数据都在手机里，导出改成「存到下载目录 / 分享」 */
const isLocalApp = () => !!window.__LOCAL_IS_LOCAL;

function localSave(name, mime, text) {
  if (window.Native && typeof window.Native.saveFile === "function") {
    try {
      window.Native.saveFile(name, mime, text);
      return true;
    } catch (e) {}
  }
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}

function openLocalText(text) {
  const { mask } = openModal(
    `<div class="mhead"><h3>纯文字</h3>
       <div style="flex:1"></div>
       <button class="btn sm icon ghost" data-close><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
     </div>
     <div class="mbody" style="padding-bottom:16px">
       <pre class="local-text" style="white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.7;margin:0;max-height:56vh;overflow:auto">${esc(text)}</pre>
       <div style="display:flex;gap:8px;margin-top:14px">
         <button class="btn sm" data-copy style="flex:1">复制全文</button>
         <button class="btn sm primary" data-save style="flex:1">存到文件</button>
       </div>
     </div>`,
    { wide: true }
  );
  mask.addEventListener("click", (e) => {
    if (e.target.closest("[data-copy]")) {
      const done = () => toast("已复制");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, () => toast("复制失败", true));
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          done();
        } catch {
          toast("复制失败", true);
        }
        ta.remove();
      }
      return;
    }
    if (e.target.closest("[data-save]")) {
      localSave(`杯测-${new Date().toISOString().slice(0, 10)}.txt`, "text/plain", text);
      toast("已保存");
    }
  });
}

function openExportDialog({ scope, id, title }) {
  /* 可选范围：主页给全部场次列表，详情页固定当前这一场 */
  const choices =
    scope === "all"
      ? [{ id: "", label: `全部 ${state.sessions.length} 场`, sub: "把所有杯测放在一个文件里" }].concat(
          state.sessions.map((x) => ({
            id: String(x.id),
            label: `${fmtDate(x.cuppedOn)} · ${x.title}`,
            sub: `${x.sampleCount} 支样品${x.photoCount ? ` · ${x.photoCount} 张图` : ""}`,
          }))
        )
      : [{ id: String(id), label: title, sub: "" }];

  let picked = choices[0].id;
  const qs = () => {
    const parts = [];
    if (window.I18N && window.I18N.on) parts.push(`lang=${window.I18N.lang}`);
    return parts.join("&");
  };
  const base = () => {
    const q = qs();
    const u = picked ? `/api/export/session?id=${picked}` : "/api/export/all";
    return q ? `${u}${u.includes("?") ? "&" : "?"}${q}` : u;
  };
  const textUrl = () => {
    const u = picked ? `/t/${picked}` : "/t";
    const q = qs();
    return q ? `${u}?${q}` : u;
  };

  const dl = (format, name, primary) =>
    `<button class="btn sm${primary ? " primary" : ""}" data-dl="${format}">${name}</button>`;

  const row = (icon, name, desc, buttons) => `
    <div class="export-opt">
      <span class="eo-ic">${icon}</span>
      <span class="eo-t"><b>${name}</b><em>${desc}</em></span>
      ${buttons}
    </div>`;

  const pickList = () =>
    scope === "all"
      ? `<div class="ex-pick">${choices
          .map(
            (c, i) => `
        <button class="ex-item${i === 0 ? " on" : ""}" data-pick="${esc(c.id)}">
          <span class="ex-t"><b>${esc(c.label)}</b>${c.sub ? `<em>${esc(c.sub)}</em>` : ""}</span>
          <svg class="ex-ck" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
        </button>`
          )
          .join("")}</div>`
      : `<div style="font-size:13px;color:var(--ink-2);margin-bottom:10px">${esc(title)}</div>`;

  const { mask, close } = openModal(
    `<div class="mhead"><h3>导出</h3>
       <div style="flex:1"></div>
       <button class="btn sm icon ghost" data-close><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
     </div>
     <div class="mbody" style="padding-bottom:18px">
       ${pickList()}
       <div class="ex-opts">
         ${row(
           '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h10M4 17h13"/></svg>',
           "纯文字",
           "豆子信息在上，下面按环节列分数和风味",
           `${dl("txt", "下载")}<button class="btn sm primary" data-text>打开</button>`
         )}
         ${row(
           '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"/><path d="M4 10h16M10 5v14"/></svg>',
           "表格（CSV）",
           "一行一支豆子，用 Excel / Numbers 打开做横向对比",
           dl("csv", "下载")
         )}
         ${isLocalApp()
           ? row(
               '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/></svg>',
               "备份 / 恢复",
               "整机数据存成一个文件，换手机或误删都能找回",
               '<button class="btn sm" data-backup>备份</button><button class="btn sm primary" data-restore>恢复</button>'
             )
           : ""}
       </div>
       ${isWeChat()
         ? `<div class="export-tip">微信里下载可能被拦。点右上角「···」→ 在浏览器打开，就能正常下载。</div>`
         : ""}
     </div>`,
    { wide: scope === "all" }
  );

  mask.addEventListener("click", async (e) => {
    const pick = e.target.closest("[data-pick]");
    if (pick) {
      picked = pick.dataset.pick;
      mask.querySelectorAll(".ex-item").forEach((b) => b.classList.toggle("on", b === pick));
      return;
    }
    /* 离线版：不跳页面、不下载 URL，直接生成内容 */
    if (isLocalApp()) {
      if (e.target.closest("[data-text]")) {
        const text = await window.__LOCAL_EXPORT(picked ? "session" : "all", picked, "txt");
        openLocalText(text);
        return;
      }
      if (e.target.closest("[data-backup]")) {
        const json = await window.__LOCAL_BACKUP();
        const stamp = new Date().toISOString().slice(0, 10);
        localSave(`杯测备份-${stamp}.json`, "application/json", json);
        toast("备份已保存到「下载」");
        return;
      }
      if (e.target.closest("[data-restore]")) {
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = ".json,application/json";
        inp.onchange = async () => {
          const f = inp.files && inp.files[0];
          if (!f) return;
          let text = "";
          try {
            text = await f.text();
          } catch {
            return toast("读不到这个文件", true);
          }
          const ok = await confirmDialog({
            title: "从备份恢复？",
            text: "手机里现在的记录会被这个备份文件替换。建议先备份一次再恢复。",
            confirmText: "恢复",
            danger: true,
          });
          if (!ok) return;
          try {
            const r = await window.__LOCAL_RESTORE(text);
            toast(`已恢复 ${r.sessions} 场`);
            setTimeout(() => location.replace("/"), 600);
          } catch (err) {
            toast(err.message || "恢复失败", true);
          }
        };
        inp.click();
        return;
      }
      const dl = e.target.closest("[data-dl]");
      if (dl) {
        const fmt = dl.dataset.dl;
        const text = await window.__LOCAL_EXPORT(picked ? "session" : "all", picked, fmt);
        const stamp = new Date().toISOString().slice(0, 10);
        const name = `杯测-${picked ? picked : "全部"}-${stamp}.${fmt}`;
        localSave(name, fmt === "csv" ? "text/csv;charset=utf-8" : "text/plain;charset=utf-8", text);
        toast("已保存到「下载」");
        return;
      }
      return;
    }
    if (e.target.closest("[data-text]")) {
      window.location.href = textUrl();
      return;
    }
    const btn = e.target.closest("[data-dl]");
    if (btn) {
      const url = `${base()}${base().includes("?") ? "&" : "?"}format=${btn.dataset.dl}`;
      const win = window.open(url, "_blank");
      if (!win) window.location.href = url;
    }
  });
}

async function openTrash() {
  let data;
  try {
    data = await api("GET", "/api/trash");
  } catch (err) {
    return toast(err.message, true);
  }
  const total = data.sessions.length + data.samples.length + data.photos.length;

  const section = (title, items, render) =>
    items.length
      ? `<div class="sub-head" style="margin-top:14px"><span class="t">${title}（${items.length}）</span></div>
         <div style="display:flex;flex-direction:column;gap:6px">${items.map(render).join("")}</div>`
      : "";

  const { mask, close } = openModal(
    `<div class="mhead"><h3>回收站</h3><span style="color:var(--ink-3);font-size:12px">${total} 项</span>
       <div style="flex:1"></div>
       <button class="btn sm icon ghost" data-close><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
     </div>
     <div class="mbody" style="padding-bottom:16px">
       <div class="trash-note">删除的记录会保留 ${data.keepDays || 30} 天，到期自动彻底删除。想提前清掉可以手动删。</div>
       ${total === 0 ? `<div class="empty" style="border:none">回收站是空的</div>` : ""}
       ${section("杯测场次", data.sessions, (s) => `
         <div class="trash-item">
           <div class="t"><b>${esc(s.title)}</b><span>${fmtDate(s.cuppedOn)} · 删于 ${fmtWhen(s.deletedAt)}${s.expiresAt ? ` · ${fmtDate(s.expiresAt.slice(0, 10))} 自动删` : ""}</span></div>
           <button class="btn sm" data-trash-restore="session" data-id="${s.id}">还原</button>
           <button class="btn sm danger" data-trash-purge="session" data-id="${s.id}">彻底删</button>
         </div>`)}
       ${section("样品", data.samples, (s) => `
         <div class="trash-item">
           <div class="t"><b>${esc(s.name)}</b><span>${esc(s.sessionTitle || "")} · 删于 ${fmtWhen(s.deletedAt)}${s.expiresAt ? ` · ${fmtDate(s.expiresAt.slice(0, 10))} 自动删` : ""}</span></div>
           <button class="btn sm" data-trash-restore="sample" data-id="${s.id}">还原</button>
           <button class="btn sm danger" data-trash-purge="sample" data-id="${s.id}">彻底删</button>
         </div>`)}
       ${section("照片", data.photos, (p) => `
         <div class="trash-item">
           <img src="${p.url}" alt="" />
           <div class="t"><span>删于 ${fmtWhen(p.deletedAt)}${p.expiresAt ? ` · ${fmtDate(p.expiresAt.slice(0, 10))} 自动删` : ""}</span></div>
           <button class="btn sm" data-trash-restore="photo" data-id="${p.id}">还原</button>
           <button class="btn sm danger" data-trash-purge="photo" data-id="${p.id}">彻底删</button>
         </div>`)}
     </div>
     <div class="mfoot"><div class="grow"></div>
       <button class="btn" data-close>关闭</button>
       ${total ? `<button class="btn danger" data-trash-purge-all>清空回收站</button>` : ""}
     </div>`,
    { wide: true }
  );

  mask.addEventListener("click", async (e) => {
    const restore = e.target.closest("[data-trash-restore]");
    const purge = e.target.closest("[data-trash-purge]");
    const purgeAll = e.target.closest("[data-trash-purge-all]");

    if (restore) {
      try {
        await api("POST", "/api/trash/restore", { type: restore.dataset.trashRestore, id: restore.dataset.id });
        toast("已还原");
        state.thumbs = null;
        close();
        // 底下这页要立刻反映回来，不然看不到
        const onDetail = location.pathname.startsWith("/s/");
        if (onDetail && state.session) loadSession(state.session.id, { keepScroll: true });
        else render();
        // 还有别的东西才继续开着回收站
        const rest = await api("GET", "/api/trash");
        if (rest.sessions.length + rest.samples.length + rest.photos.length) openTrash();
      } catch (err) {
        toast(err.message, true);
      }
      return;
    }
    if (purge) {
      const ok = await confirmDialog({
        title: "彻底删除？",
        text: "这一步不可撤销，数据直接从本机删掉。",
        confirmText: "彻底删除",
        danger: true,
      });
      if (!ok) return;
      try {
        await api("POST", "/api/trash/purge", { type: purge.dataset.trashPurge, id: purge.dataset.id });
        toast("已彻底删除");
        close();
        openTrash();
      } catch (err) {
        toast(err.message, true);
      }
      return;
    }
    if (purgeAll) {
      const ok = await confirmDialog({
        title: "清空回收站？",
        text: `回收站里 ${total} 项会被彻底删除，包括照片文件，不可撤销。`,
        confirmText: "清空",
        danger: true,
      });
      if (!ok) return;
      try {
        await api("POST", "/api/trash/purge", { all: true });
        toast("回收站已清空");
        close();
      } catch (err) {
        toast(err.message, true);
      }
    }
  });
}

/* ---------------- 键盘 ---------------- */

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (state.lightbox) return closeLightbox();
    const mask = layer.querySelector(".mask");
    if (mask && !mask.dataset.keep) {
      // 只关最上面一层，不误关确认框
      const masks = layer.querySelectorAll(".mask");
      if (masks.length > 1) masks[masks.length - 1].remove();
      else mask.remove();
    }
  }
  if (state.lightbox) {
    if (e.key === "ArrowLeft" && state.lightbox.index > 0) {
      state.lightbox.index--;
      showLightbox(state.lightbox.items, state.lightbox.index);
    }
    if (e.key === "ArrowRight" && state.lightbox.index < state.lightbox.items.length - 1) {
      state.lightbox.index++;
      showLightbox(state.lightbox.items, state.lightbox.index);
    }
  }
});

/* 启动：先拿一次「我填过」的记忆词，再渲染。失败不影响使用。 */
loadKnown().finally(() => render());
