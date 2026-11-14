/* 界面中英切换（零构建）
 * 思路：DOM 层翻译。渲染层始终用中文模板，渲染完把文本节点按词典换成英文。
 * 数据库里存的仍然是原始中文值，切换语言不改数据。
 */
(function () {
  const STORE_KEY = "cupping.lang";
  const hasZh = (s) => /[\u4e00-\u9fa5]/.test(s);
  let dict = null;
  let lang = "zh";
  let applying = false;
  /* 同一个词在页面上出现成百上千次，缓存翻译结果，省掉每节点的正则匹配 */
  let memo = new Map();

  /* 带数字的模板串用正则处理；[正则, 英, 日, 韩] */
  const PATTERNS = [
    [/^已选 (\d+)$/, "$1 picked", "$1 件選択", "$1개 선택"],
    [/^已更新 (\d+) 支$/, "Updated $1 samples", "$1 本を更新しました", "$1개 업데이트됨"],
    [/^烘焙日已填 (\d+) 支$/, "Roast date filled for $1 samples", "焙煎日を $1 本に入力しました", "로스팅 날짜 $1개 입력됨"],
    [/^养豆天数已填 (\d+) 支$/, "Rest days filled for $1 samples", "養生日数を $1 本に入力しました", "레스트 일수 $1개 입력됨"],
    [/^养豆天数 → (\d+) 天$/, "Rest days → $1", "養生日数 → $1 日", "레스트 일수 → $1일"],
    [/^养豆 (\d+) 天$/, "Rested $1 days", "養生 $1 日", "레스트 $1일"],
    [/^将把 (.+) 的 (.+)。原有这些字段的值会被覆盖，确定吗？$/, "Set $2 for $1.\n\nExisting values in these fields will be overwritten. Continue?", "$1 に $2 を設定します。\n\n既存の値は上書きされます。よろしいですか？", "$1에 $2을(를) 설정합니다.\n\n기존 값은 덮어쓰여집니다. 진행할까요?"],
    [/^产地 → (.+)$/, "Origin → $1", "産地 → $1", "산지 → $1"],
    [/^处理法 → (.+)$/, "Process → $1", "精製方法 → $1", "가공법 → $1"],
    [/^烘焙度 → (.+)$/, "Roast level → $1", "焙煎度 → $1", "로스팅 정도 → $1"],
    [/^烘焙日 → (.+)$/, "Roast date → $1", "焙煎日 → $1", "로스팅 날짜 → $1"],
    [/^共 (\d+) 场$/, "$1 sessions", "全 $1 セッション", "총 $1 세션"],
    [/^全部 (\d+) 场$/, "All $1 sessions", "すべて $1 セッション", "전체 $1 세션"],
    [/^(\d+) 支样品$/, "$1 samples", "$1 サンプル", "$1 샘플"],
    [/^(\d+) 支样品 · (\d+) 张图$/, "$1 samples · $2 photos", "$1 サンプル · 写真 $2 枚", "$1 샘플 · 사진 $2장"],
    [/^(\d+) 张图$/, "$1 photos", "写真 $1 枚", "사진 $1장"],
    [/^(\d+) 支$/, "$1", "$1 本", "$1개"],
    [/^(\d+) \/ (\d+) 支$/, "$1 / $2", "$1 / $2", "$1 / $2"],
    [/^最高 ([\d.]+)$/, "Top $1", "最高 $1", "최고 $1"],
    [/^下一环节：(.*)$/, "Next: $1", "次: $1", "다음: $1"],
    [/^样品 (\d+)$/, "Sample $1", "サンプル $1", "샘플 $1"],
    [/^最多还能加 (\d+) 支$/, "Up to $1 more", "あと $1 本まで追加できます", "$1개 더 추가 가능"],
    [/^这次加几支（当前已有 (\d+) 支）$/, "How many to add ($1 in session)", "追加する本数（現在 $1 本）", "추가할 수량 (현재 $1개)"],
    [/^这次有几支豆子$/, "How many beans", "豆は何本ですか", "원두가 몇 개인가요"],
    [/^整场杯测和里面 (\d+) 支样品会一起移入回收站，30 天内都可以还原。$/, "The session and its $1 samples will move to trash. Restorable for 30 days.", "セッションと中の $1 サンプルをまとめてゴミ箱へ移動します。30 日以内なら復元できます。", "세션과 그 안의 샘플 $1개가 함께 휴지통으로 이동합니다. 30일 이내에 복원할 수 있습니다."],
    [/^没搜到「(.*)」$/, 'No match for "$1"', "「$1」は見つかりません", "'$1' 검색 결과 없음"],
    [/^已加 (\d+) 支$/, "Added $1", "$1 本追加しました", "$1개 추가됨"],
    [/^已加 (\d+) 张$/, "Added $1 photo(s)", "写真を $1 枚追加しました", "사진 $1장 추가됨"],
    [/^(\d+) 项$/, "$1 items", "$1 件", "$1개 항목"],
    [/^最高 ([\d.]+) \/ ([\d.]+)$/, "Top $1 / $2", "最高 $1 / $2", "최고 $1 / $2"],
    [/^(.+) · 删于 (.+) · (.+) 自动删$/, "$1 · deleted $2 · auto-delete $3", "$1 · $2 に削除 · $3 自動削除", "$1 · $2 삭제 · $3 자동 삭제"],
    [/^删于 (.+)$/, "deleted $1", "$1 に削除", "$1 삭제"],
    [/^(.+) 支样品$/, "$1 samples", "$1 サンプル", "$1 샘플"],
    [/^(.+)（(\d+)）$/, "$1 ($2)", "$1 ($2)", "$1 ($2)"],
    /* 自动生成的场次名（默认「2026-11-14 杯测」） */
    [/^(\d{4}-\d{2}-\d{2}) 杯测$/, "$1 Cupping", "$1 カッピング", "$1 커핑"],
  ];

  /* 语言在 PATTERNS 里的列位：0=正则 1=en 2=ja 3=ko */
  const PCOL = { en: 1, ja: 2, ko: 3 };

  function t(str) {
    if (!str || lang === "zh" || !dict) return str;
    const s = String(str).trim();
    if (!s) return str;
    const hit0 = memo.get(s);
    if (hit0 !== undefined) return hit0 === null ? str : str.replace(s, hit0);
    const out = tRaw(str, s);
    memo.set(s, out === s ? null : out);
    return out === s ? str : str.replace(s, out);
  }

  /* 真正的翻译逻辑；t() 负责查缓存 */
  function tRaw(str, s) {
    const hit = dict.ui[s] || dict.terms[s];
    if (hit) return hit;
    /* 「SL28 / SL34 / Ruiru 11」这类多选值：逐段翻译，查不到的原样保留 */
    if (s.includes(" / ")) {
      const parts = s.split(" / ");
      const mapped = parts.map((x) => dict.ui[x] || dict.terms[x] || x);
      if (mapped.some((x, i) => x !== parts[i])) return mapped.join(" / ");
    }
    const col = PCOL[lang] || 1;
    for (const row of PATTERNS) {
      const re = row[0];
      if (!re.test(s)) continue;
      const rep = row[col] || row[1];
      const m = s.match(re);
      /* 「杯测场次（4）」这类要连前面的组名一起翻 */
      if (re.source.startsWith("^(.+)（")) {
        const inner = dict.ui[m[1]] || dict.terms[m[1]] || m[1];
        return `${inner} (${m[2]})`;
      }
      /* 「下一环节：湿香」这类要连后半段一起翻 */
      if (re.source.startsWith("^下一环节")) {
        const inner = dict.ui[m[1]] || dict.terms[m[1]] || m[1];
        const pre = { en: "Next: ", ja: "次: ", ko: "다음: " }[lang] || "Next: ";
        return pre + inner;
      }
      return s.replace(re, rep);
    }
    /* 「N. 豆子名」这种带序号的保持原样 */
    return s;
  }

  function translateTextNode(node) {
    const raw = node.nodeValue;
    if (!raw || !hasZh(raw)) return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    const out = t(trimmed);
    if (out === trimmed) return;
    const lead = raw.match(/^\s*/)[0];
    const tail = raw.match(/\s*$/)[0];
    node.nodeValue = lead + out + tail;
  }

  function translateAttrs(el) {
    for (const attr of ["placeholder", "title", "aria-label"]) {
      const v = el.getAttribute && el.getAttribute(attr);
      if (v && hasZh(v)) {
        const out = t(v);
        if (out !== v) el.setAttribute(attr, out);
      }
    }
  }

  function apply(root) {
    if (lang === "zh" || !dict || !root) return;
    const start = root.nodeType === 9 ? root.body : root;
    if (!start) return;
    applying = true;
    try {
      if (start.nodeType === 3) {
        translateTextNode(start);
      } else {
        if (start.nodeType === 1) {
          translateAttrs(start);
          start.querySelectorAll("[placeholder],[title],[aria-label]").forEach(translateAttrs);
        }
        const walker = document.createTreeWalker(start, NodeFilter.SHOW_TEXT, {
          acceptNode(n) {
            const p = n.parentElement;
            if (!p) return NodeFilter.FILTER_REJECT;
            if (p.closest("script,style,textarea")) return NodeFilter.FILTER_REJECT;
            return hasZh(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          },
        });
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(translateTextNode);
      }
    } finally {
      applying = false;
    }
  }

  const run = () => {
    if (lang === "zh" || !dict) return;
    apply(document.body);
  };

  /* 只处理变动的节点，不再每次全量重扫 body —— 全量重扫是打字卡顿的主因 */
  let pending = [];
  let queued = false;
  const flush = () => {
    queued = false;
    const list = pending;
    pending = [];
    if (lang === "zh" || !dict || !list.length) return;
    applying = true;
    try {
      for (const m of list) {
        if (m.type === "characterData") {
          if (m.target && m.target.nodeType === 3) translateTextNode(m.target);
        } else {
          m.addedNodes.forEach((n) => apply(n));
        }
      }
    } finally {
      applying = false;
    }
  };
  const schedule = (muts) => {
    if (lang === "zh" || !dict || applying) return;
    for (const m of muts) pending.push(m);
    /* 微任务里翻完，仍在浏览器绘制之前 —— 用 rAF 会露出 1 帧中文 */
    if (queued) return;
    queued = true;
    queueMicrotask(flush);
  };

  /* 首帧前页面是隐藏的（index.html 内联脚本加了 i18n-pending），翻译完再显示，避免中文一闪 */
  function ready() {
    document.documentElement.classList.remove("i18n-pending");
  }

  /* 渲染即翻译：innerHTML / textContent 落 DOM 后，在同一个任务里同步译完再返回。
     这样浏览器根本没有机会画出一帧中文，也不需要 MutationObserver 去追。 */
  function installHooks() {
    const html = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    if (html && html.set) {
      Object.defineProperty(Element.prototype, "innerHTML", {
        configurable: true,
        enumerable: html.enumerable,
        get: html.get,
        set(v) {
          html.set.call(this, v);
          if (lang !== "zh" && dict && !applying) apply(this);
        },
      });
    }
    const text = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
    if (text && text.set) {
      Object.defineProperty(Node.prototype, "textContent", {
        configurable: true,
        enumerable: text.enumerable,
        get: text.get,
        set(v) {
          const s = typeof v === "string" ? tr0(v) : v;
          text.set.call(this, s);
        },
      });
    }
    /* 属性（placeholder / title）跟着一起 */
    const setAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (lang !== "zh" && dict && typeof value === "string" && (name === "placeholder" || name === "title" || name === "aria-label")) {
        value = tr0(value);
      }
      return setAttr.call(this, name, value);
    };
  }

  /* 只翻整串，不做 replace 包裹（给 textContent / setAttribute 用） */
  function tr0(v) {
    const s = String(v).trim();
    if (!s || !hasZh(s)) return v;
    const out = t(s);
    return out === s ? v : String(v).replace(s, out);
  }

  const LANGS = ["zh", "en", "ja", "ko"];

  function setLang(next) {
    lang = LANGS.includes(next) ? next : "zh";
    try {
      localStorage.setItem(STORE_KEY, lang);
    } catch {}
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
    return lang;
  }

  async function boot() {
    try {
      const stored = localStorage.getItem(STORE_KEY);
      if (LANGS.includes(stored) && stored !== "zh") lang = stored;
    } catch {}
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
    if (lang === "zh") {
      window.I18N = api;
      ready();
      return;
    }
    /* 词典随 /i18n-data.js 同步加载过来，直接用，不发请求、不 await ——
       所以在 app.js 渲染前就已经有译文，页面不会先出中文。 */
    const pre = window.__I18N_DATA && window.__I18N_DATA[lang];
    if (pre) {
      dict = pre;
    } else {
      try {
        const res = await fetch(`/i18n-${lang}.json`, { cache: "force-cache" });
        dict = await res.json();
      } catch {
        dict = null;
      }
    }
    window.I18N = api;
    installHooks();
    run();
    ready();
    new MutationObserver(schedule).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  const api = {
    get lang() {
      return lang;
    },
    /* 界面是否已切成非中文，调用方据此决定要不要走 t() */
    get on() {
      return lang !== "zh";
    },
    get LANGS() {
      return LANGS;
    },
    t,
    apply,
    run,
    setLang,
    /* 切换语言：DOM 已翻译过，回中文需要重渲染，直接重载最稳 */
    switchTo(next) {
      setLang(next);
      location.reload();
    },
  };

  window.I18N = api;
  boot().catch(() => ready());
})();
