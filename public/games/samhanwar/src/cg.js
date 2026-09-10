/* CrazyGames SDK 연동 래퍼.
 *
 * SDK 가 없으면 모든 함수가 무해한 no-op 이 되므로, 이 파일이 들어간 채로도
 * menewsoft.com 이나 로컬 서버에서 그대로 돌아간다. 포털 규칙상 광고가 뜨는 동안
 * 오디오를 음소거하고 게임을 멈춰야 하므로 그 처리를 여기서 함께 한다.
 */
(function () {
  var AD_COOLDOWN = 180000;            // midgame 권장 간격 3분 (포털 정책)
  var ready = false, playing = false, lastAd = 0;
  var portalMuted = false;             // 포털이 음소거를 요청한 상태

  function sdk() {
    return (window.CrazyGames && window.CrazyGames.SDK) || null;
  }
  function mute() {
    try { if (window.__actx && window.__actx.state === 'running') window.__actx.suspend(); } catch (e) {}
  }
  function unmute() {
    if (portalMuted) return;           // 포털이 끄라고 했으면 광고가 끝나도 켜지 않는다
    try { if (window.__actx && window.__actx.state === 'suspended') window.__actx.resume(); } catch (e) {}
  }

  /* 포털 플레이어가 스피커 아이콘을 눌렀을 때 따라가는 처리.
     이게 있어야 제출 폼의 '지원' 항목에 체크할 수 있다. */
  function applySettings() {
    var s = sdk();
    try {
      portalMuted = !!(s && s.game && s.game.settings && s.game.settings.muteAudio);
      if (portalMuted) {
        try { if (window.__actx && window.__actx.state === 'running') window.__actx.suspend(); } catch (e) {}
      } else {
        try { if (window.__actx && window.__actx.state === 'suspended') window.__actx.resume(); } catch (e) {}
      }
    } catch (e) {}
  }

  var CG = {
    available: function () { return !!sdk(); },

    init: function () {
      var s = sdk();
      if (!s) return;
      try {
        var p = s.init();
        function done() {
          ready = true;
          try { s.game.addSettingsChangeListener(applySettings); } catch (e) {}
          applySettings();
        }
        if (p && p.then) p.then(done).catch(function (e) { console.warn('[CG] init', e); });
        else done();
      } catch (e) { console.warn('[CG] init', e); }
    },

    // 플레이가 시작/재개될 때. 메뉴·일시정지·광고 중에는 stop 이어야 한다.
    play: function () {
      var s = sdk();
      if (!s || !ready || playing) return;
      try { s.game.gameplayStart(); playing = true; } catch (e) {}
    },
    stop: function () {
      var s = sdk();
      if (!s || !ready || !playing) return;
      try { s.game.gameplayStop(); playing = false; } catch (e) {}
    },

    // 도전과제 달성 같은 좋은 순간 — 포털이 광고 타이밍을 잡는 데 쓴다
    happy: function () {
      var s = sdk();
      if (!s || !ready) return;
      try { s.game.happytime(); } catch (e) {}
    },

    /* 광고 요청. 성공/실패/미표시 어느 경우든 done() 을 정확히 한 번 부른다.
       done 이 안 불리면 게임이 멈춘 채로 남으므로 이 보장이 중요하다. */
    ad: function (type, done) {
      var s = sdk();
      var finished = false;
      function end(ok) {
        if (finished) return;
        finished = true;
        unmute();
        done(ok);
      }
      if (!s || !ready) { end(false); return; }
      if (type === 'midgame' && Date.now() - lastAd < AD_COOLDOWN) { end(false); return; }

      try {
        CG.stop();
        mute();
        s.ad.requestAd(type, {
          adStarted:  function () {},
          adFinished: function () { lastAd = Date.now(); end(true); },
          adError:    function () { end(false); }
        });
        setTimeout(function () { end(false); }, 45000);   // 콜백이 영영 안 오는 경우 대비
      } catch (e) { end(false); }
    }
  };

  /* ★세이브 저장소.
     포털 iframe 안의 localStorage 는 격리되거나 지워질 수 있어서, 지어놓은 세계가
     날아간다. 포털에선 SDK 의 데이터 모듈을 쓰고, 밖에서는 localStorage 로 떨어진다.
     양쪽 다 동기 API 라 그대로 갈아끼울 수 있다. */
  function dm() {
    var s = sdk();
    try { return (s && s.data && typeof s.data.getItem === 'function') ? s.data : null; }
    catch (e) { return null; }
  }
  CG.store = {
    get: function (k) {
      var d = dm();
      if (d) { try { return d.getItem(k); } catch (e) {} }
      try { return localStorage.getItem(k); } catch (e) { return null; }
    },
    set: function (k, v) {
      var d = dm();
      if (d) { try { d.setItem(k, v); return; } catch (e) {} }
      try { localStorage.setItem(k, v); } catch (e) {}
    },
    del: function (k) {
      var d = dm();
      if (d) { try { d.removeItem(k); return; } catch (e) {} }
      try { localStorage.removeItem(k); } catch (e) {}
    }
  };

  // 로딩 신호 — 포털이 로딩 화면을 언제 걷을지 안다
  CG.loadingStart = function () {
    var s = sdk(); if (!s) return;
    try { s.game.loadingStart(); } catch (e) {}
  };
  CG.loadingStop = function () {
    var s = sdk(); if (!s) return;
    try { s.game.loadingStop(); } catch (e) {}
  };

  // 검증용 — 내부 상태를 들여다볼 수 있게
  CG.debug = function () {
    return { hasSDK: !!sdk(), ready: ready, playing: playing,
             lastAd: lastAd, portalMuted: portalMuted, dataModule: !!dm() };
  };

  window.CG = CG;
  CG.init();
  CG.loadingStart();
  window.addEventListener('load', function () { setTimeout(CG.loadingStop, 300); });
})();
