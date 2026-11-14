/* 访问密码门：只挡「随手点开」，不是加密。
   密码只存哈希，输对一次记在本机（localStorage），下次不再问。
   要更严的保护请改用带服务端校验的托管。 */
(function () {
  var HASH = (window.__GATE_HASH || "").trim().toLowerCase();
  if (!HASH) return;                       // 没配密码就直通
  var KEY = "cupping.gate";
  try {
    if (localStorage.getItem(KEY) === HASH) return;
  } catch (e) {}

  function hex(buf) {
    return Array.prototype.map
      .call(new Uint8Array(buf), function (b) {
        return ("0" + b.toString(16)).slice(-2);
      })
      .join("");
  }

  function sha256(text) {
    var data = new TextEncoder().encode(text);
    return crypto.subtle.digest("SHA-256", data).then(hex);
  }

  var wrap = document.createElement("div");
  wrap.setAttribute("data-gate", "1");
  wrap.style.cssText =
    "position:fixed;inset:0;z-index:9999;background:#fff;display:flex;align-items:center;" +
    "justify-content:center;padding:24px;font:15px/1.5 -apple-system,system-ui,'PingFang SC',sans-serif;color:#111";
  wrap.innerHTML =
    '<div style="width:100%;max-width:320px">' +
    '<div style="font-size:20px;font-weight:600;letter-spacing:.01em;margin-bottom:6px">杯测</div>' +
    '<div style="color:#8a8a90;font-size:13px;margin-bottom:18px">' +
    (window.__GATE_TIP || "输入访问密码") +
    "</div>" +
    '<input id="gate-pw" type="password" autocomplete="off" inputmode="text" ' +
    'style="width:100%;height:44px;padding:0 13px;border:1px solid #e4e4e7;border-radius:10px;' +
    'font-size:16px;outline:none" placeholder="" />' +
    '<div id="gate-err" style="color:#c0392b;font-size:12.5px;height:18px;margin-top:8px"></div>' +
    '<button id="gate-ok" type="button" ' +
    'style="width:100%;height:44px;border:0;border-radius:10px;background:#111;color:#fff;' +
    'font-size:15px;font-weight:500">进入</button>' +
    "</div>";
  document.documentElement.appendChild(wrap);

  var pw = wrap.querySelector("#gate-pw");
  var err = wrap.querySelector("#gate-err");
  var ok = wrap.querySelector("#gate-ok");
  pw.focus();

  function submit() {
    var v = pw.value;
    if (!v) {
      err.textContent = "请输入密码";
      return;
    }
    ok.disabled = true;
    sha256(v)
      .then(function (h) {
        ok.disabled = false;
        if (h === HASH) {
          try {
            localStorage.setItem(KEY, h);
          } catch (e) {}
          wrap.remove();
        } else {
          err.textContent = "密码不对";
          pw.select();
        }
      })
      .catch(function () {
        ok.disabled = false;
        err.textContent = "浏览器不支持，换个浏览器打开";
      });
  }

  ok.addEventListener("click", submit);
  pw.addEventListener("keydown", function (e) {
    if (e.key === "Enter") submit();
  });
})();
