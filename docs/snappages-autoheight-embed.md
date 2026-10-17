# SnapPages one-scroll study embed

The study app keeps its current fixed-height behavior until the host page opts in. Replace the existing `/study` embed block with this code after the matching app change is deployed. This revision also lets passage buttons move the outer page to the opened verse:

```html
<div style="width:100%;max-width:1200px;margin:0 auto;">
  <iframe id="tcf-study-embed"
    src="https://tcf-study-app.onrender.com/"
    title="The Crucible's Fire Bible Study Assistant"
    width="100%" height="950"
    style="display:block;width:100%;border:0;border-radius:12px;background:#F6F1E8;"
    loading="lazy" referrerpolicy="no-referrer" allow="clipboard-write"></iframe>
</div>
<script>
(function () {
  const frame = document.getElementById('tcf-study-embed');
  const appOrigin = 'https://tcf-study-app.onrender.com';
  function enableAutoHeight() {
    if (frame.contentWindow) frame.contentWindow.postMessage({ type: 'tcf-study:enable-autoheight', parentScroll: true }, appOrigin);
  }
  window.addEventListener('message', function (event) {
    if (event.origin !== appOrigin || event.source !== frame.contentWindow) return;
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'tcf-study:ready') { enableAutoHeight(); return; }
    if (data.type === 'tcf-study:scroll-to') {
      if (!Number.isFinite(data.top) || data.top < 0 || data.top > 100000) return;
      requestAnimationFrame(function () {
        const frameTop = frame.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, Math.max(0, frameTop + data.top - 16));
      });
      return;
    }
    if (data.type !== 'tcf-study:height' || !Number.isFinite(data.height) ||
        data.height < 200 || data.height > 100000) return;
    frame.style.height = (Math.ceil(data.height) + 2) + 'px';
  });
  frame.addEventListener('load', enableAutoHeight);
})();
</script>
```

The two pages verify each other's origin and window before accepting messages. The 950px height remains a fallback if SnapPages does not run the script. Do not add `scrolling="no"` because it could hide content if the script is filtered.

After saving the page, check a short study and several follow-ups on desktop and mobile. The outer SnapPages page should scroll, including when a passage button opens its verse, while the iframe grows with the answer and shrinks after **New study**. Inside a returned study packet, Blue Letter Bible links show a copyable address and keep the study page loaded in the native app. Paste that address into Safari or Chrome. The separate Deep Dive widget still opens BLB directly. If the iframe stays exactly 950px high, move the script into a SnapPages custom-code area that runs JavaScript on the page.
