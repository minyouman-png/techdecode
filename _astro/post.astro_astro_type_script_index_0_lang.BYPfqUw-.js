import{o as g,h as $,j as h,e as d,c as C,d as y,w as v,C as L,k as m,D as w,u as x,m as k,l as E,g as T,n as A,p as D}from"./board.CMVNCoII.js";import"https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";import"https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";import"https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";const t=e=>document.getElementById(e),i=new URLSearchParams(location.search).get("id");let s=null,r="",a=null,o=[];i?(g((e,n)=>{s=e,r=n?.nick||"",c()}),M()):t("post").innerHTML='<p class="bd-empty">잘못된 주소입니다. <a href="/board/">목록으로</a></p>';async function M(){try{if(a=await $(i),!a){t("post").innerHTML='<p class="bd-empty">삭제되었거나 없는 글입니다. <a href="/board/">목록으로</a></p>';return}o=await h(i),t("commentsWrap").hidden=!1,c()}catch(e){t("post").innerHTML=`<p class="bd-empty">글을 불러오지 못했습니다. (${d(e.code||e.message)})</p>`}}const u=()=>!!s&&a&&s.uid===a.authorUid,B=()=>u()||m(s),H=e=>!!s&&(s.uid===e.authorUid||m(s)||u());function c(){a&&(t("post").innerHTML=`
      <div class="bd-post-cat">
        <a class="bd-tag bd-tag-${a.cat||"free"}" href="/board/?cat=${d(a.cat||"free")}">${d(C(a.cat))}</a>
      </div>
      <h1 class="bd-post-title">${d(a.title)}</h1>
      <div class="bd-post-meta">
        ${y(a.authorPhoto,a.authorName)}
        <span>${d(a.authorName)}</span><i>·</i><span>${v(a.createdAt)}</span>
        ${a.updatedAt?"<i>·</i><span>수정됨</span>":""}
      </div>
      <div class="bd-post-body">${d(a.body)}</div>
      <div class="bd-post-actions">
        ${u()?'<button type="button" class="bd-btn bd-btn-sm" id="editBtn">수정</button>':""}
        ${B()?'<button type="button" class="bd-btn bd-btn-sm bd-btn-danger" id="delBtn">삭제</button>':""}
      </div>`,t("editBtn")?.addEventListener("click",P),t("delBtn")?.addEventListener("click",N),t("commentsTitle").textContent=`댓글 ${o.length}`,t("clist").innerHTML=o.length?o.map(e=>`<li class="bd-citem">
          <div class="bd-cmeta">${y(e.authorPhoto,e.authorName)}<b>${d(e.authorName)}</b><i>·</i><span>${v(e.createdAt)}</span>
            ${H(e)?`<button type="button" class="bd-clink" data-del="${d(e.id)}">삭제</button>`:""}
          </div>
          <div class="bd-cbody">${d(e.body)}</div>
        </li>`).join(""):'<li class="bd-empty">첫 댓글을 남겨 보세요.</li>',t("clist").querySelectorAll("[data-del]").forEach(e=>e.addEventListener("click",()=>U(e.dataset.del))),t("cbody").placeholder=s?r?"댓글을 입력하세요":"닉네임을 먼저 정해 주세요":"댓글을 쓰려면 로그인이 필요합니다",t("cbtn").textContent=s?r?"댓글 등록":"닉네임 정하기":"구글 계정으로 로그인")}function P(){t("post").innerHTML=`
      <form class="bd-form" id="editForm">
        <div class="bd-form-row">
          <label class="bd-form-cat">분류<select id="ecat"></select></label>
          <label class="bd-form-title">제목<input id="etitle" maxlength="120" required /></label>
        </div>
        <label>내용<textarea id="ebody" rows="12" maxlength="10000" required></textarea></label>
        <div class="bd-form-actions">
          <button type="submit" class="bd-btn bd-btn-primary" id="esave">저장</button>
          <button type="button" class="bd-btn" id="ecancel">취소</button>
          <span class="bd-hint" id="emsg"></span>
        </div>
      </form>`;const e=L.filter(n=>!n.admin||m(s));t("ecat").innerHTML=e.map(n=>`<option value="${n.key}">${n.label}</option>`).join(""),t("ecat").value=e.some(n=>n.key===a.cat)?a.cat:w,t("etitle").value=a.title,t("ebody").value=a.body,t("ecancel").addEventListener("click",c),t("editForm").addEventListener("submit",async n=>{n.preventDefault();const l=t("etitle").value.trim(),b=t("ebody").value.trim(),p=t("ecat").value;if(!l||!b){t("emsg").textContent="제목과 내용을 모두 입력해 주세요.";return}t("esave").disabled=!0,t("emsg").textContent="저장 중…";try{await x(i,l,b,p),a={...a,title:l,body:b,cat:p,updatedAt:!0},c()}catch(f){t("emsg").textContent="저장에 실패했습니다: "+(f.message||f.code),t("esave").disabled=!1}})}async function N(){if(confirm("이 글을 삭제할까요? 댓글도 함께 지워집니다.")){t("delBtn").disabled=!0;try{await k(i),location.href="/board/"}catch(e){alert("삭제에 실패했습니다: "+(e.message||e.code)),t("delBtn").disabled=!1}}}t("cform").addEventListener("submit",async e=>{if(e.preventDefault(),!s){E();return}if(!r){T(s);return}const n=t("cbody").value.trim();if(n){t("cbtn").disabled=!0,t("cmsg").textContent="등록 중…";try{await A(i,s,n),t("cbody").value="",o=await h(i),t("cmsg").textContent="",c()}catch(l){t("cmsg").textContent="등록에 실패했습니다: "+(l.message||l.code)}finally{t("cbtn").disabled=!1}}});async function U(e){if(confirm("이 댓글을 삭제할까요?"))try{await D(i,e),o=o.filter(n=>n.id!==e),c()}catch(n){alert("삭제에 실패했습니다: "+(n.message||n.code))}}
