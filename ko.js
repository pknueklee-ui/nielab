// 해외 방문자 기준: 한글(한자 포함) 글자는 조금 작고 회색으로. 나중에 데이터로 그려지는 글(멤버 이름 등)도 따라 바꾼다.
// 링크 안의 한글은 링크 색을 유지한다.
(() => {
  const st = document.createElement('style');
  st.textContent = '.ko-t{font-size:.88em;color:#7a7a7a}a .ko-t{color:inherit}';
  document.head.appendChild(st);
  const RUN = /[가-힣ㄱ-ㅎ一-鿿]+(?:[\s.,·()~\-\d!?‘’'"`:%·]*[가-힣ㄱ-ㅎ一-鿿]+)*[.!?)]?/g;
  const skip = n => n.closest('script,style,textarea,.ko-t,svg,title');
  const wrap = root => {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: t => /[가-힣一-鿿]/.test(t.data) && !skip(t.parentElement) ? 1 : 2 });
    const list = [];
    while (w.nextNode()) list.push(w.currentNode);
    list.forEach(t => {
      const f = document.createDocumentFragment();
      let i = 0;
      t.data.replace(RUN, (m, at) => {
        if (at > i) f.appendChild(document.createTextNode(t.data.slice(i, at)));
        const s = document.createElement('span'); s.className = 'ko-t'; s.textContent = m; f.appendChild(s);
        i = at + m.length;
      });
      if (i < t.data.length) f.appendChild(document.createTextNode(t.data.slice(i)));
      t.replaceWith(f);
    });
  };
  const go = () => {
    wrap(document.body);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType === 1 && !n.classList.contains('ko-t')) wrap(n);
      else if (n.nodeType === 3 && n.parentElement && !skip(n.parentElement)) wrap(n.parentElement);
    }))).observe(document.body, { childList: true, subtree: true });
  };
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', go) : go();
})();
