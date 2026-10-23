import{l as r,e as a,c as d,w as p}from"./board.D_BOLvXe.js";import"https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";import"https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";import"https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";for(const c of document.querySelectorAll(".gc")){const n=(c.dataset.cats||"").split(",").filter(Boolean),i=Number(c.dataset.limit)||6,o=c.querySelector(".gc-list"),l=s=>s.createdAt?.toMillis?.()??0;Promise.all(n.map(s=>r(s,null).then(e=>e.posts))).then(s=>{const e=s.flat().sort((t,m)=>l(m)-l(t)).slice(0,i);o.innerHTML=e.length?e.map(t=>`
            <li><a href="/board/post/?id=${encodeURIComponent(t.id)}">
              <em class="bd-tag bd-tag-${a(t.cat)}">${a(d(t.cat))}</em>
              <span class="gc-title">${a(t.title)}</span>
              ${t.commentCount?`<span class="gc-cc">[${Number(t.commentCount)}]</span>`:""}
              <span class="gc-meta">${a(t.authorName||"")} · ${a(p(t.createdAt))}</span>
            </a></li>`).join(""):'<li class="gc-empty">아직 글이 없습니다. 첫 공략이나 질문을 남겨 보세요!</li>'}).catch(()=>{o.innerHTML='<li class="gc-empty">글 목록을 불러오지 못했습니다. <a href="/board/">게시판</a>에서 직접 확인해 주세요.</li>'})}
