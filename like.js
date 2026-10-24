// 좋아요(하트): 누구나 수를 보고, 같은 IP는 항목마다 하루(한국 날짜) 한 번만 누른다.
// IP는 ipify로 받아 SHA-256 해시만 Apps Script에 보낸다(원래 IP는 저장하지 않음). 서버가 최종 판정, localStorage는 화면 표시용.
// 쓰는 법: NIELIKE.html('g:…' 또는 'm:…')로 버튼 HTML을 넣으면, 수·눌림 상태는 이 파일이 알아서 채운다.
(() => {
  const API = 'https://script.google.com/macros/s/AKfycbwQ1zLyqlhWx-5i-VVdNoP1oInUUhwnRqPiLEOHH3Gw50bw8Gat0yg9bvZ90tz4OpHWyw/exec';
  const st = document.createElement('style');
  st.textContent = '.lk{display:inline-flex;align-items:center;gap:4px;border:0;border-radius:14px;padding:3px 10px 3px 8px;background:rgba(255,255,255,.92);color:#f34f4c;font:600 13px/1 "Open Sans",Arial,sans-serif;cursor:pointer;user-select:none;box-shadow:0 1px 3px rgba(0,0,0,.18)}' +
    '.lk svg{width:15px;height:15px;fill:none;stroke:#f34f4c;stroke-width:2.2;transition:transform .15s}.lk.on svg{fill:#f34f4c}.lk:hover svg{transform:scale(1.15)}' +
    '.lk.pop svg{animation:lkpop .35s}.lk.no{animation:lkno .3s}@keyframes lkpop{50%{transform:scale(1.45)}}@keyframes lkno{25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}';
  document.head.appendChild(st);
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const ls = { get: k => { try { return localStorage.getItem(k) } catch (e) { return null } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) {} } };
  let N = {};
  const paint = () => document.querySelectorAll('.lk[data-lk]').forEach(b => {
    const id = b.dataset.lk;
    b.querySelector('.c').textContent = N[id] || 0;
    b.classList.toggle('on', ls.get('lk:' + id) === today());
  });
  window.NIELIKE = {
    html: id => `<span class="lk" role="button" tabindex="0" aria-label="Like" data-lk="${esc(id)}">${HEART}<span class="c">0</span></span>`,
    paint
  };
  fetch(API + '?type=likes').then(r => r.json()).then(d => { N = d.likes || {}; paint(); }).catch(() => {});
  new MutationObserver(ms => { if (ms.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches('.lk') || n.querySelector('.lk'))))) paint(); })
    .observe(document.body, { childList: true, subtree: true });

  let hp = null;
  const hash = () => hp || (hp = fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip)
    .catch(() => { let k = ls.get('lk:anon'); if (!k) { k = 'b' + Math.random().toString(36).slice(2); ls.set('lk:anon', k); } return k; })
    .then(ip => crypto.subtle.digest('SHA-256', new TextEncoder().encode('nielab-like|' + ip)))
    .then(b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')));
  const like = b => {
    const id = b.dataset.lk;
    if (ls.get('lk:' + id) === today()) { b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); return; }
    ls.set('lk:' + id, today()); N[id] = (N[id] || 0) + 1; paint();
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    hash().then(h => fetch(API + '?type=like&id=' + encodeURIComponent(id) + '&h=' + h)).then(r => r.json())
      .then(d => { if (d.n != null) N[id] = d.n; else if (!d.ok) { N[id]--; ls.set('lk:' + id, ''); } paint(); })
      .catch(() => { N[id]--; ls.set('lk:' + id, ''); paint(); });
  };
  // 캡처 단계에서 받아 카드 열기·창 닫기 같은 바깥 클릭 동작이 일어나지 않게 한다
  document.addEventListener('click', e => { const b = e.target.closest('.lk[data-lk]'); if (b) { e.stopPropagation(); e.preventDefault(); like(b); } }, true);
  document.addEventListener('keydown', e => { const b = e.target.closest && e.target.closest('.lk[data-lk]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); like(b); } });
})();
