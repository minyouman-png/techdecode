import{s as r,o as m,h as u,a as b,f as p,j as f,e as a,w as y,I as g,k as L,m as h,n as v}from"./board.BQEWb11Q.js";import"https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";import"https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";import"https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";const t=n=>document.getElementById(n),$=n=>v.find(s=>s.key===n)?.label??n;t("inqForm").addEventListener("submit",async n=>{n.preventDefault();const s=t("contact").value.trim(),e=t("body").value.trim(),i=[...document.querySelectorAll("input[name=plat]:checked")].map(o=>o.value);if(s.length<5){t("formMsg").textContent="연락받으실 전화번호나 이메일을 적어 주세요.",t("contact").focus();return}if(e.length<5){t("formMsg").textContent="원하는 기능을 조금만 적어 주세요.",t("body").focus();return}if(t("website").value){c();return}t("submitBtn").disabled=!0,t("formMsg").textContent="보내는 중…";try{await r({name:t("name").value,biz:t("biz").value,contact:s,platforms:i,body:e}),t("inqForm").reset(),c(),d&&l()}catch(o){t("formMsg").textContent="보내지 못했습니다. 잠시 뒤 다시 시도해 주세요. ("+(o.code||o.message)+")"}finally{t("submitBtn").disabled=!1}});function c(){t("formMsg").textContent="",t("inqForm").hidden=!0,t("doneBox").hidden=!1,t("doneBox").scrollIntoView({block:"center"})}t("againBtn").addEventListener("click",()=>{t("doneBox").hidden=!0,t("inqForm").hidden=!1});let d=!1;m(n=>{d=u(n),n?(t("adminAuth").innerHTML=(d?"운영자로 로그인됨 · ":"")+'<button type="button" class="bd-link" id="adminLogout">로그아웃</button>',t("adminLogout").addEventListener("click",p)):(t("adminAuth").innerHTML='<button type="button" class="bd-link" id="adminLogin">운영자 로그인</button>',t("adminLogin").addEventListener("click",b)),t("adminBox").hidden=!d,d&&l()});async function l(){t("inqList").innerHTML='<li class="bd-empty">불러오는 중…</li>';try{const n=await f(),s=n.filter(e=>e.status==="new").length;if(t("inqCount").textContent=`${n.length}건 · 새 문의 ${s}건`,!n.length){t("inqList").innerHTML='<li class="bd-empty">아직 받은 문의가 없습니다.</li>';return}t("inqList").innerHTML=n.map(e=>`
        <li class="bd-inq-item st-${a(e.status)}" data-id="${a(e.id)}">
          <div class="bd-inq-meta">
            ${e.sample?'<span class="bd-inq-sample">예시</span>':""}
            <b>${a(e.name||"(이름 없음)")}</b>
            ${e.biz?`<span>${a(e.biz)}</span>`:""}
            <span>${a((e.platforms||[]).map($).join(" · "))}</span>
            <time>${y(e.createdAt)}</time>
          </div>
          <p class="bd-inq-contact">연락처: <b>${a(e.contact)}</b></p>
          <p class="bd-inq-body">${a(e.body)}</p>
          <div class="bd-inq-actions">
            <select data-act="status">
              ${Object.entries(g).map(([i,o])=>`<option value="${i}"${i===e.status?" selected":""}>${o}</option>`).join("")}
            </select>
            <button type="button" class="bd-btn bd-btn-sm" data-act="del">삭제</button>
          </div>
        </li>`).join("")}catch(n){t("inqList").innerHTML=`<li class="bd-empty">문의를 불러오지 못했습니다 (${a(n.code||n.message)})</li>`}}t("inqList").addEventListener("change",async n=>{const s=n.target.closest("select[data-act=status]");if(!s)return;const e=s.closest("li");try{await L(e.dataset.id,s.value),e.className=`bd-inq-item st-${s.value}`}catch(i){alert("상태를 바꾸지 못했습니다: "+(i.code||i.message))}});t("inqList").addEventListener("click",async n=>{const s=n.target.closest("button[data-act=del]");if(s&&confirm("이 문의를 지울까요? 되돌릴 수 없습니다."))try{await h(s.closest("li").dataset.id),l()}catch(e){alert("지우지 못했습니다: "+(e.code||e.message))}});
