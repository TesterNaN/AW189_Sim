(function () {
  var CACHE = "aw189-assets-v1";
  var VERSION = "v1";
  var EST_MB = 26;

  var ASSETS = [
    "ruffle.js",
    "core.ruffle.16d61072ac7fdc4d5013.js",
    "core.ruffle.994eeef0a471a88cd0e3.js",
    "172de42e6619eac8f371.wasm",
    "apps/cockpit.swf",
    "apps/pfd.swf",
    "apps/mfd.swf",
    "apps/ecdu.swf",
    "apps/mcdu.swf",
    "apps/dtd.swf",
    "AW189.json",
    "apps/AW189.json",
    "apps/atp.pdf",
    "apps/Basic Ethernet.pdf",
    "apps/AFDX ARINC 664 Tutorial.pdf",
    "wallpaper.jpg"
  ];

  var resolveReady;
  var ready = new Promise(function (resolve) { resolveReady = resolve; });
  var started = false;
  var overlay = null;
  var titleEl = null;
  var textEl = null;
  var barEl = null;
  var actionsEl = null;

  window.AW189Preload = { ready: ready, ensure: ensure, cache: CACHE };

  function abs(path) {
    return new URL(path, location.href).href;
  }

  function buildOverlay() {
    if (overlay) return;
    var style = document.createElement("style");
    style.textContent =
      ".aw189-preload{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(5,8,12,.82);font-family:'Segoe UI','Microsoft YaHei',system-ui,sans-serif;}" +
      ".aw189-preload .box{width:min(430px,88vw);background:#11181e;border:1px solid #2b3a46;border-radius:10px;padding:18px 18px 16px;color:#e6edf3;box-shadow:0 24px 70px rgba(0,0,0,.6);}" +
      ".aw189-preload .t{font-size:15px;font-weight:650;margin-bottom:8px;}" +
      ".aw189-preload .d{font-size:12px;line-height:1.6;color:#9eacb8;}" +
      ".aw189-preload .bar{margin-top:14px;height:8px;border-radius:5px;background:#1d2830;overflow:hidden;}" +
      ".aw189-preload .bar i{display:block;height:100%;width:0;background:#8fa3b3;transition:width .15s linear;}" +
      ".aw189-preload .s{margin-top:7px;font-size:11px;color:#7d8b98;font-variant-numeric:tabular-nums;}" +
      ".aw189-preload .a{display:flex;justify-content:flex-end;gap:8px;margin-top:16px;}" +
      ".aw189-preload button{border:1px solid #3a4a57;border-radius:6px;background:#1a242c;color:#e6edf3;font-size:12px;padding:7px 12px;cursor:pointer;}" +
      ".aw189-preload button:hover{background:#22313b;}" +
      ".aw189-preload button.primary{border-color:#5b7182;background:#243440;}" +
      ".aw189-preload button.primary:hover{background:#2d4050;}";
    document.head.appendChild(style);

    overlay = document.createElement("div");
    overlay.className = "aw189-preload";
    overlay.innerHTML =
      '<div class="box"><div class="t"></div><div class="d"></div>' +
      '<div class="bar" style="display:none"><i></i></div><div class="s" style="display:none"></div>' +
      '<div class="a"></div></div>';
    document.body.appendChild(overlay);
    titleEl = overlay.querySelector(".t");
    textEl = overlay.querySelector(".d");
    barEl = overlay.querySelector(".bar");
    actionsEl = overlay.querySelector(".a");
  }

  function showPrompt() {
    buildOverlay();
    titleEl.textContent = "首次加载";
    textEl.textContent =
      "需要下载约 " + EST_MB + " MB 的 Ruffle / SWF 资源。下载后会缓存在本机，之后打开会快很多。";
    barEl.style.display = "none";
    overlay.querySelector(".s").style.display = "none";
    actionsEl.innerHTML = "";
    return new Promise(function (resolve) {
      var start = document.createElement("button");
      start.className = "primary";
      start.textContent = "开始下载";
      var skip = document.createElement("button");
      skip.textContent = "跳过";
      start.addEventListener("click", function () { resolve(true); });
      skip.addEventListener("click", function () { resolve(false); });
      actionsEl.appendChild(skip);
      actionsEl.appendChild(start);
    });
  }

  function showProgress() {
    buildOverlay();
    titleEl.textContent = "正在下载资源";
    textEl.textContent = "下载完成后会缓存到本机，下次打开直接读缓存。";
    actionsEl.innerHTML = "";
    barEl.style.display = "block";
    overlay.querySelector(".s").style.display = "block";
    setProgress(0);
  }

  function setProgress(received) {
    if (!barEl) return;
    var mb = received / (1024 * 1024);
    var pct = Math.min(99, Math.round((mb / EST_MB) * 100));
    barEl.querySelector("i").style.width = pct + "%";
    overlay.querySelector(".s").textContent =
      "已下载 " + mb.toFixed(1) + " / 约 " + EST_MB + " MB";
  }

  function showError(message) {
    buildOverlay();
    titleEl.textContent = "部分资源下载失败";
    textEl.textContent = message + "。仍可继续使用，未缓存的部分会按需加载。";
    actionsEl.innerHTML = "";
    var cont = document.createElement("button");
    cont.className = "primary";
    cont.textContent = "继续";
    cont.addEventListener("click", hideOverlay);
    actionsEl.appendChild(cont);
  }

  function hideOverlay() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  async function hasCache() {
    if (!("caches" in window)) return false;
    try {
      var cache = await caches.open(CACHE);
      return !!(await cache.match(abs("apps/mcdu.swf")));
    } catch (e) {
      return false;
    }
  }

  async function registerSW() {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
    try {
      await navigator.serviceWorker.register("sw.js");
      await navigator.serviceWorker.ready;
    } catch (e) {}
  }

  async function downloadAll() {
    var cache = await caches.open(CACHE);
    var total = 0;
    for (var i = 0; i < ASSETS.length; i++) {
      var path = ASSETS[i];
      var url = abs(path);
      if (await cache.match(url)) continue;

      var resp = await fetch(url, { cache: "no-store" });
      if (!resp.ok) throw new Error(path + " HTTP " + resp.status);
      var type = resp.headers.get("Content-Type") || "application/octet-stream";
      var len = parseInt(resp.headers.get("Content-Length") || "0", 10);
      var chunks = [];
      var got = 0;

      if (resp.body && resp.body.getReader) {
        var reader = resp.body.getReader();
        while (true) {
          var r = await reader.read();
          if (r.done) break;
          chunks.push(r.value);
          got += r.value.length;
          total += r.value.length;
          setProgress(total);
        }
      } else {
        var buf = await resp.arrayBuffer();
        chunks.push(new Uint8Array(buf));
        got = buf.byteLength;
        total += got;
        setProgress(total);
      }

      var blob = new Blob(chunks, { type: type });
      var headers = new Headers();
      headers.set("Content-Type", type);
      headers.set("Content-Length", String(blob.size));
      await cache.put(url, new Response(blob, { status: 200, headers: headers }));
      if (!got && len) total += len;
    }
  }

  async function ensure() {
    if (started) return ready;
    started = true;

    if (!("caches" in window) || !("fetch" in window)) {
      resolveReady();
      return ready;
    }

    var cached = await hasCache();
    if (cached && localStorage.getItem("aw189-preload") === VERSION) {
      resolveReady();
      return ready;
    }

    var go = await showPrompt();
    if (!go) {
      hideOverlay();
      resolveReady();
      return ready;
    }

    await registerSW();
    showProgress();

    try {
      await downloadAll();
      localStorage.setItem("aw189-preload", VERSION);
      try {
        if (navigator.storage && navigator.storage.persist) await navigator.storage.persist();
      } catch (e) {}
      barEl.querySelector("i").style.width = "100%";
      overlay.querySelector(".s").textContent = "完成，资源已缓存";
      setTimeout(hideOverlay, 450);
    } catch (e) {
      showError(e && e.message ? e.message : "网络错误");
    }
    resolveReady();
    return ready;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { ensure(); });
  } else {
    ensure();
  }
})();
