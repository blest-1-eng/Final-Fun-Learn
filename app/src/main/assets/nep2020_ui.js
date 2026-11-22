/* Interactive NEP 2020 Discovery Zones UI Controller for Fun & Learn Android WebView */
(function () {
  var nepUiState = {
    zoneId: null,
    classAge: 3,
    tab: "lessons",
    lessonIdx: 0,
    sortedItems: {},
    sortFeedback: "",
    seqDoneIds: [],
    seqExpected: 1,
    seqFeedback: "",
    expChoice: null,
    expFeedback: "",
    quizIdx: 0,
    quizSelected: null,
    quizHintShown: false,
    quizCorrect: 0,
    quizWrongTopics: [],
    quizDone: false,
    quizFinalScore: 0,
    unlockedToast: ""
  };

  function activeStudentId() {
    return (window.nyraState && nyraState.activeStudent && nyraState.activeStudent.id) || "student-default";
  }

  function storageKey() {
    return "funlearn_nep_store_v1_" + activeStudentId();
  }

  function loadNepStore() {
    try {
      var raw = safeStorage.getItem(storageKey());
      if (raw) {
        var parsed = JSON.parse(raw);
        return {
          progress: parsed.progress || {},
          badges: Array.isArray(parsed.badges) ? parsed.badges : []
        };
      }
    } catch (e) {}
    return { progress: {}, badges: [] };
  }

  function saveNepStore(store) {
    try {
      safeStorage.setItem(storageKey(), JSON.stringify(store));
    } catch (e) {}
  }

  function getZoneProgress(zoneId, classAge) {
    var store = loadNepStore();
    var k = classAge + ":" + zoneId;
    return store.progress[k] || {
      zoneId: zoneId,
      classAge: classAge,
      lessonsViewed: false,
      activityDone: false,
      quizBestScore: null,
      challengeDone: false
    };
  }

  function updateZoneProgress(zoneId, classAge, patch) {
    var store = loadNepStore();
    var k = classAge + ":" + zoneId;
    var prev = getZoneProgress(zoneId, classAge);
    var bestScore = prev.quizBestScore;
    if (typeof patch.quizBestScore === "number") {
      bestScore = bestScore != null ? Math.max(bestScore, patch.quizBestScore) : patch.quizBestScore;
    }
    var updated = Object.assign({}, prev, patch, { quizBestScore: bestScore });
    store.progress[k] = updated;
    saveNepStore(store);
    return updated;
  }

  function unlockBadge(zoneId, classAge, badge) {
    var store = loadNepStore();
    if (!store.badges.some(function (b) { return b.badgeId === badge.id; })) {
      store.badges.unshift({
        badgeId: badge.id,
        zoneId: zoneId,
        classAge: classAge,
        title: badge.title,
        emoji: badge.emoji
      });
      saveNepStore(store);
    }
  }

  function checkAndUnlockBadge(zoneId, classAge, mod, latest) {
    var passedQuiz = (latest.quizBestScore || 0) >= 60;
    if (latest.lessonsViewed && (latest.activityDone || latest.challengeDone) && (passedQuiz || latest.challengeDone)) {
      unlockBadge(zoneId, classAge, mod.badge);
      nepUiState.unlockedToast = mod.badge.emoji + " Badge Earned: " + mod.badge.title + "!";
    }
  }

  function getMod(zoneId, classAge) {
    var zones = window.NEP_2020_MODULES || {};
    var zMap = zones[zoneId] || {};
    return zMap[classAge] || zMap[3];
  }

  function getZoneDef(zoneId) {
    var list = window.NEP_2020_ZONES || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === zoneId) return list[i];
    }
    return list[0];
  }

  function esc(val) {
    return typeof nyraEscapeHtml === "function" ? nyraEscapeHtml(val) : String(val || "");
  }

  window.renderNepZonesMenuSection = function (container, currentAge) {
    var list = window.NEP_2020_ZONES || [];
    if (!container || !list.length) return;

    var header = document.createElement("div");
    header.className = "text-xs font-black uppercase tracking-wider text-yellow-200 px-1 mb-1 mt-2 flex items-center justify-between";
    header.innerHTML = '<span>🌟 NEP 2020 Discovery Zones</span><span style="font-size:10px;background:rgba(255,255,255,0.18);padding:2px 8px;border-radius:999px;">' + esc(getClassName(currentAge)) + ' • 8 Zones</span>';
    container.appendChild(header);

    var grid = document.createElement("div");
    grid.className = "grid grid-cols-2 gap-2";

    list.forEach(function (z) {
      var mod = getMod(z.id, currentAge);
      if (!mod) return;
      var prog = getZoneProgress(z.id, currentAge);
      var earned = prog.challengeDone || (prog.activityDone && (prog.quizBestScore || 0) >= 60);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mode-card p-2.5 flex flex-col items-center justify-center text-center relative";
      btn.innerHTML =
        (earned ? '<span style="position:absolute;top:6px;right:8px;font-size:12px;">' + esc(mod.badge.emoji) + '</span>' : '') +
        '<div class="text-2xl mb-1">' + esc(z.emoji) + '</div>' +
        '<div class="font-black text-xs">' + esc(z.shortTitle) + '</div>' +
        '<div class="text-xs font-bold" style="color:#4f46e5;font-size:10px;margin-top:2px;">' + esc(mod.moduleTitle) + '</div>';
      btn.onclick = function () {
        if (typeof soundTap === "function") soundTap();
        openNepZoneModal(z.id);
      };
      grid.appendChild(btn);
    });

    container.appendChild(grid);
  };

  window.openNepZoneModal = function (zoneId) {
    if (typeof closeNyraModals === "function") closeNyraModals();
    var currentAge = typeof age === "number" ? age : 3;
    var mod = getMod(zoneId, currentAge);
    if (!mod) return;

    nepUiState = {
      zoneId: zoneId,
      classAge: currentAge,
      tab: "lessons",
      lessonIdx: 0,
      sortedItems: {},
      sortFeedback: "",
      seqDoneIds: [],
      seqExpected: 1,
      seqFeedback: "",
      expChoice: null,
      expFeedback: "",
      quizIdx: 0,
      quizSelected: null,
      quizHintShown: false,
      quizCorrect: 0,
      quizWrongTopics: [],
      quizDone: false,
      quizFinalScore: 0,
      unlockedToast: ""
    };

    updateZoneProgress(zoneId, currentAge, { lessonsViewed: true });
    var modal = document.getElementById("nep-zone-modal");
    if (modal) modal.classList.remove("hidden");
    renderNepZoneModal();
  };

  window.closeNepZoneModal = function () {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    var modal = document.getElementById("nep-zone-modal");
    if (modal) modal.classList.add("hidden");
    if (typeof buildMenu === "function") buildMenu();
  };

  window.setNepZoneTab = function (tabName) {
    if (typeof soundTap === "function") soundTap();
    nepUiState.tab = tabName;
    renderNepZoneModal();
  };

  window.stepNepLesson = function (delta) {
    if (typeof soundTap === "function") soundTap();
    var mod = getMod(nepUiState.zoneId, nepUiState.classAge);
    var len = (mod && mod.lessons && mod.lessons.length) || 1;
    nepUiState.lessonIdx = (nepUiState.lessonIdx + delta + len) % len;
    renderNepZoneModal();
  };

  window.speakCurrentNepLesson = function () {
    if (typeof soundTap === "function") soundTap();
    var mod = getMod(nepUiState.zoneId, nepUiState.classAge);
    var lesson = mod.lessons[nepUiState.lessonIdx];
    if (!lesson) return;
    if ("speechSynthesis" in window) {
      try {
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(lesson.title + ". " + lesson.explanation);
        u.lang = "en-IN";
        u.rate = 0.9;
        speechSynthesis.speak(u);
      } catch (e) {}
    }
  };

  window.askNyraFromNepLesson = function (promptText) {
    if (typeof soundTap === "function") soundTap();
    closeNepZoneModal();
    if (typeof openNyraChatModal === "function") {
      openNyraChatModal(promptText);
    }
  };

  window.pickNepClassify = function (itemId, expected, chosen) {
    if (nepUiState.sortedItems[itemId]) return;
    var mod = getMod(nepUiState.zoneId, nepUiState.classAge);
    if (expected === chosen) {
      if (typeof soundCorrect === "function") soundCorrect();
      nepUiState.sortedItems[itemId] = chosen;
      nepUiState.sortFeedback = "Great match!";
      var total = (mod.activity.classifyItems || []).length;
      if (Object.keys(nepUiState.sortedItems).length === total) {
        nepUiState.sortFeedback = mod.activity.successMessage;
        completeNepActivity();
        return;
      }
    } else {
      if (typeof soundWrong === "function") soundWrong();
      nepUiState.sortFeedback = "Oops! Try the other basket!";
    }
    renderNepZoneModal();
  };

  window.pickNepSequence = function (stepId, order) {
    if (nepUiState.seqDoneIds.indexOf(stepId) !== -1) return;
    var mod = getMod(nepUiState.zoneId, nepUiState.classAge);
    if (order === nepUiState.seqExpected) {
      if (typeof soundCorrect === "function") soundCorrect();
      nepUiState.seqDoneIds.push(stepId);
      var total = (mod.activity.sequenceSteps || []).length;
      if (nepUiState.seqDoneIds.length === total) {
        nepUiState.seqFeedback = mod.activity.successMessage;
        completeNepActivity();
        return;
      } else {
        nepUiState.seqExpected = order + 1;
        nepUiState.seqFeedback = "Nice! Now tap Step " + nepUiState.seqExpected + "!";
      }
    } else {
      if (typeof soundWrong === "function") soundWrong();
      nepUiState.seqFeedback = "Not yet—find Step " + nepUiState.seqExpected + "!";
    }
    renderNepZoneModal();
  };

  window.pickNepExperiment = function (optIndex) {
    var mod = getMod(nepUiState.zoneId, nepUiState.classAge);
    var opt = (mod.activity.options || [])[optIndex];
    if (!opt) return;
    nepUiState.expChoice = opt.label;
    nepUiState.expFeedback = opt.feedback;
    if (opt.correct) {
      completeNepActivity();
    } else {
      if (typeof soundWrong === "function") soundWrong();
      renderNepZoneModal();
    }
  };

  function completeNepActivity() {
    var mod = getMod(nepUiState.zoneId, nepUiState.classAge);
    if (typeof soundFinish === "function") soundFinish();
    if (typeof createConfetti === "function") createConfetti(innerWidth / 2, innerHeight / 2);
    var latest = updateZoneProgress(nepUiState.zoneId, nepUiState.classAge, { activityDone: true });
    checkAndUnlockBadge(nepUiState.zoneId, nepUiState.classAge, mod, latest);
    renderNepZoneModal();
  }

  window.toggleNepQuizHint = function () {
    if (typeof soundTap === "function") soundTap();
    nepUiState.quizHintShown = !nepUiState.quizHintShown;
    renderNepZoneModal();
  };

  window.pickNepQuizOption = function (optIndex) {
    if (nepUiState.quizSelected !== null) return;
    var mod = getMod(nepUiState.zoneId, nepUiState.classAge);
    var q = mod.quiz[nepUiState.quizIdx];
    if (!q) return;
    var opt = q.options[optIndex];
    nepUiState.quizSelected = opt;
    if (opt === q.correctAnswer) {
      if (typeof soundCorrect === "function") soundCorrect();
      nepUiState.quizCorrect += 1;
      if (typeof createConfetti === "function") createConfetti(innerWidth / 2, innerHeight / 2);
    } else {
      if (typeof soundWrong === "function") soundWrong();
      nepUiState.quizWrongTopics.push(mod.moduleTitle);
    }
    renderNepZoneModal();
  };

  window.nextNepQuizQuestion = function () {
    if (typeof soundTap === "function") soundTap();
    var mod = getMod(nepUiState.zoneId, nepUiState.classAge);
    var zDef = getZoneDef(nepUiState.zoneId);
    if (nepUiState.quizIdx + 1 < mod.quiz.length) {
      nepUiState.quizIdx += 1;
      nepUiState.quizSelected = null;
      nepUiState.quizHintShown = false;
      renderNepZoneModal();
      return;
    }
    var pct = Math.round((nepUiState.quizCorrect / mod.quiz.length) * 100);
    nepUiState.quizFinalScore = pct;
    nepUiState.quizDone = true;
    if (typeof soundFinish === "function") soundFinish();
    var latest = updateZoneProgress(nepUiState.zoneId, nepUiState.classAge, { quizBestScore: pct });
    checkAndUnlockBadge(nepUiState.zoneId, nepUiState.classAge, mod, latest);

    if (typeof nyraCallBridge === "function") {
      nyraCallBridge("recordResult", {
        studentId: activeStudentId(),
        classAge: nepUiState.classAge,
        mode: "nep_" + nepUiState.zoneId,
        subject: zDef.title,
        topic: mod.moduleTitle,
        score: pct,
        wrongCount: mod.quiz.length - nepUiState.quizCorrect,
        wrongTopics: nepUiState.quizWrongTopics
      }).then(function (snap) {
        if (typeof nyraApplySnapshot === "function") nyraApplySnapshot(snap);
      });
    }
    renderNepZoneModal();
  };

  window.restartNepQuiz = function () {
    if (typeof soundTap === "function") soundTap();
    nepUiState.quizIdx = 0;
    nepUiState.quizSelected = null;
    nepUiState.quizHintShown = false;
    nepUiState.quizCorrect = 0;
    nepUiState.quizWrongTopics = [];
    nepUiState.quizDone = false;
    nepUiState.quizFinalScore = 0;
    renderNepZoneModal();
  };

  window.completeNepChallenge = function () {
    var mod = getMod(nepUiState.zoneId, nepUiState.classAge);
    if (typeof soundCorrect === "function") soundCorrect();
    if (typeof createConfetti === "function") createConfetti(innerWidth / 2, innerHeight / 2);
    updateZoneProgress(nepUiState.zoneId, nepUiState.classAge, { challengeDone: true });
    unlockBadge(nepUiState.zoneId, nepUiState.classAge, mod.badge);
    nepUiState.unlockedToast = mod.badge.emoji + " Badge Earned: " + mod.badge.title + "!";
    renderNepZoneModal();
  };

  window.renderParentNepProgressHtml = function () {
    var store = loadNepStore();
    var startedCount = Object.keys(store.progress || {}).length;
    var badges = store.badges || [];
    var badgesHtml = badges.length
      ? '<div class="flex flex-wrap gap-1.5 mt-1">' + badges.slice(0, 8).map(function (b) {
          return '<span style="background:#fff;border:1px solid #a7f3d0;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:800;">' + esc(b.emoji) + ' ' + esc(b.title) + '</span>';
        }).join("") + '</div>'
      : '<div style="font-size:11px;color:#065f46;margin-top:2px;">Explore the 8 NEP 2020 Discovery Zones on the home menu to earn holistic badges!</div>';

    return '<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:16px;padding:10px;font-size:12px;">' +
      '<div style="display:flex;justify-content:space-between;font-weight:900;color:#065f46;">' +
      '<span>🏅 NEP 2020 Discovery Progress (' + startedCount + ' started)</span>' +
      '<span>' + badges.length + ' Badge' + (badges.length === 1 ? '' : 's') + '</span></div>' +
      badgesHtml + '</div>';
  };

  function renderNepZoneModal() {
    var headEl = document.getElementById("nep-zone-header");
    var bodyEl = document.getElementById("nep-zone-body");
    if (!headEl || !bodyEl) return;

    var zDef = getZoneDef(nepUiState.zoneId);
    var mod = getMod(nepUiState.zoneId, nepUiState.classAge);
    var prog = getZoneProgress(nepUiState.zoneId, nepUiState.classAge);

    var tabs = [
      { id: "lessons", label: "📖 Lessons", done: prog.lessonsViewed },
      { id: "activity", label: "🎮 Activity", done: prog.activityDone },
      { id: "quiz", label: "⭐ Quiz", done: (prog.quizBestScore || 0) >= 60 },
      { id: "challenge", label: "🌟 Mission", done: prog.challengeDone }
    ];

    headEl.style.background = zDef.bgGradient;
    headEl.innerHTML =
      '<div class="flex justify-between items-start gap-2">' +
        '<div>' +
          '<div class="text-xs font-bold" style="color:#334155;">' + esc(mod.className) + ' • ' + esc(zDef.nepPillarTag) + ' • NEP 2020 Inspired</div>' +
          '<div class="text-lg font-black mt-0.5" style="color:#0f172a;">' + esc(zDef.emoji) + ' ' + esc(mod.moduleTitle) + '</div>' +
          '<div class="text-xs font-bold" style="color:#475569;">' + esc(mod.hindiSubtitle) + '</div>' +
        '</div>' +
        '<button type="button" onclick="closeNepZoneModal()" class="w-8 h-8 rounded-full bg-white font-bold" style="flex-shrink:0;">✕</button>' +
      '</div>' +
      '<div class="text-xs font-semibold mt-1" style="color:#475569;font-size:11px;">' + esc(mod.ncertGoalNote) + '</div>' +
      '<div class="grid grid-cols-4 gap-1.5 mt-3">' +
        tabs.map(function (t) {
          var active = nepUiState.tab === t.id;
          return '<button type="button" onclick="setNepZoneTab(\'' + t.id + '\')" style="padding:6px 4px;border-radius:12px;font-size:11px;font-weight:900;border:none;cursor:pointer;' +
            (active ? 'background:#0f172a;color:#fff;' : 'background:rgba(255,255,255,0.88);color:#334155;') + '">' +
            t.label + (t.done ? ' ✓' : '') + '</button>';
        }).join("") +
      '</div>' +
      (nepUiState.unlockedToast ? '<div style="margin-top:8px;background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:6px 10px;text-align:center;font-size:12px;font-weight:900;color:#92400e;">' + esc(nepUiState.unlockedToast) + '</div>' : '');

    if (nepUiState.tab === "lessons") {
      var lesson = mod.lessons[nepUiState.lessonIdx] || mod.lessons[0];
      var nextBtn = nepUiState.lessonIdx + 1 < mod.lessons.length
        ? '<button type="button" onclick="stepNepLesson(1)" class="nyra-primary-btn flex-1">Next Card →</button>'
        : '<button type="button" onclick="setNepZoneTab(\'activity\')" class="nyra-primary-btn flex-1" style="background:linear-gradient(135deg,#10b981,#059669);">Try Activity 🎮 →</button>';
      bodyEl.innerHTML =
        '<div class="flex justify-between items-center text-xs font-bold text-gray-500">' +
          '<span>Concept ' + (nepUiState.lessonIdx + 1) + ' of ' + mod.lessons.length + '</span>' +
          '<button type="button" onclick="speakCurrentNepLesson()" class="nyra-pill-btn">🔊 Read Aloud</button>' +
        '</div>' +
        '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:14px;text-align:center;">' +
          '<div style="background:#fff;border-radius:14px;padding:10px;font-size:20px;font-weight:900;border:1px solid #f1f5f9;">' + esc(lesson.emojiVisual) + '</div>' +
          '<div class="text-base font-black mt-2" style="color:#0f172a;">' + esc(lesson.title) + '</div>' +
          '<div class="text-xs font-bold" style="color:#4f46e5;">' + esc(lesson.hindiTitle) + '</div>' +
          '<p class="text-xs font-semibold text-gray-700 mt-2 leading-relaxed" style="text-align:left;">' + esc(lesson.explanation) + '</p>' +
        '</div>' +
        '<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:10px;font-size:12px;">' +
          '<div style="font-weight:900;color:#065f46;">🇮🇳 Everyday India Example</div>' +
          '<div style="font-weight:600;color:#064e3b;margin-top:2px;">' + esc(lesson.indianExample) + '</div>' +
        '</div>' +
        '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:10px;font-size:12px;">' +
          '<div style="font-weight:900;color:#92400e;">✨ Curiosity Spark</div>' +
          '<div style="font-weight:600;color:#78350f;margin-top:2px;">' + esc(lesson.funFact) + '</div>' +
        '</div>' +
        '<button type="button" onclick="askNyraFromNepLesson(' + JSON.stringify(lesson.askNyraPrompt).replace(/"/g, "&quot;") + ')" class="nyra-primary-btn w-full">💬 Ask NYRA About This</button>' +
        '<div class="flex gap-2">' +
          '<button type="button" onclick="stepNepLesson(-1)" class="nyra-pill-btn flex-1">← Previous</button>' +
          nextBtn +
        '</div>';
    } else if (nepUiState.tab === "activity") {
      var act = mod.activity;
      var actHtml = '<div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:14px;padding:12px;">' +
        '<div class="text-sm font-black" style="color:#312e81;">🎮 ' + esc(act.title) + '</div>' +
        '<div class="text-xs font-semibold text-gray-700 mt-1">' + esc(act.instruction) + '</div></div>';

      if (act.kind === "classify") {
        actHtml += '<div class="grid grid-cols-2 gap-2 text-center text-xs font-black">' +
          '<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:8px;color:#065f46;">' + esc(act.leftBucketLabel) + '</div>' +
          '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:8px;color:#075985;">' + esc(act.rightBucketLabel) + '</div></div>';
        actHtml += (act.classifyItems || []).map(function (it) {
          var placed = nepUiState.sortedItems[it.id];
          return '<div style="border-radius:14px;padding:10px;border:1px solid ' + (placed ? '#6ee7b7' : '#e2e8f0') + ';background:' + (placed ? '#ecfdf5' : '#fff') + ';display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
            '<div class="flex items-center gap-2"><span style="font-size:22px;">' + esc(it.emoji) + '</span><span class="text-xs font-black">' + esc(it.label) + '</span></div>' +
            (placed ? '<span class="text-xs font-black" style="color:#047857;">✓ Sorted</span>' :
              '<div class="flex gap-1"><button type="button" onclick="pickNepClassify(\'' + esc(it.id) + '\',\'' + it.bucket + '\',\'left\')" class="nyra-pill-btn">Left</button>' +
              '<button type="button" onclick="pickNepClassify(\'' + esc(it.id) + '\',\'' + it.bucket + '\',\'right\')" class="nyra-pill-btn">Right</button></div>') +
          '</div>';
        }).join("");
        if (nepUiState.sortFeedback) {
          actHtml += '<div style="background:#eef2ff;padding:8px;border-radius:12px;text-align:center;font-size:12px;font-weight:900;color:#4338ca;">' + esc(nepUiState.sortFeedback) + '</div>';
        }
      } else if (act.kind === "sequence") {
        var steps = (act.sequenceSteps || []).slice();
        if (steps.length >= 3) {
          steps = [steps[1], steps[steps.length - 1], steps[0]].concat(steps.slice(2, steps.length - 1));
        }
        actHtml += steps.map(function (st) {
          var done = nepUiState.seqDoneIds.indexOf(st.id) !== -1;
          return '<button type="button" ' + (done ? 'disabled' : '') + ' onclick="pickNepSequence(\'' + esc(st.id) + '\',' + st.order + ')" style="width:100%;border-radius:14px;padding:10px;border:1px solid ' + (done ? '#6ee7b7' : '#e2e8f0') + ';background:' + (done ? '#ecfdf5' : '#fff') + ';display:flex;align-items:center;justify-content:space-between;text-align:left;cursor:pointer;">' +
            '<div class="flex items-center gap-2"><span style="font-size:22px;">' + esc(st.emoji) + '</span><span class="text-xs font-black">' + esc(st.label) + '</span></div>' +
            '<span class="text-xs font-black" style="background:#f1f5f9;padding:4px 8px;border-radius:8px;">' + (done ? ('Step ' + st.order + ' ✓') : 'Tap Next') + '</span></button>';
        }).join("");
        if (nepUiState.seqFeedback) {
          actHtml += '<div style="background:#eef2ff;padding:8px;border-radius:12px;text-align:center;font-size:12px;font-weight:900;color:#4338ca;">' + esc(nepUiState.seqFeedback) + '</div>';
        }
      } else if (act.kind === "experiment") {
        actHtml += '<div class="text-xs font-black text-gray-700">' + esc(act.prompt) + '</div>';
        actHtml += (act.options || []).map(function (opt, idx) {
          var picked = nepUiState.expChoice === opt.label;
          var bg = picked ? (opt.correct ? '#ecfdf5' : '#fff1f2') : '#fff';
          var bd = picked ? (opt.correct ? '#34d399' : '#fda4af') : '#e2e8f0';
          return '<button type="button" onclick="pickNepExperiment(' + idx + ')" style="width:100%;border-radius:14px;padding:10px;border:1px solid ' + bd + ';background:' + bg + ';display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer;">' +
            '<span style="font-size:22px;">' + esc(opt.emoji) + '</span><span class="text-xs font-black">' + esc(opt.label) + '</span></button>';
        }).join("");
        if (nepUiState.expFeedback) {
          actHtml += '<div style="background:#fffbeb;border:1px solid #fde68a;padding:10px;border-radius:12px;font-size:12px;font-weight:700;color:#78350f;">' + esc(nepUiState.expFeedback) + '</div>';
        }
      }

      if (prog.activityDone) {
        actHtml += '<button type="button" onclick="setNepZoneTab(\'quiz\')" class="nyra-primary-btn w-full" style="background:linear-gradient(135deg,#10b981,#059669);">Take the Mini Quiz ⭐ →</button>';
      }
      bodyEl.innerHTML = actHtml;
    } else if (nepUiState.tab === "quiz") {
      if (!nepUiState.quizDone) {
        var q = mod.quiz[nepUiState.quizIdx];
        var optsHtml = q.options.map(function (opt, idx) {
          var isPicked = nepUiState.quizSelected === opt;
          var isRight = opt === q.correctAnswer;
          var bg = "#fff", bd = "#e2e8f0";
          if (nepUiState.quizSelected !== null) {
            if (isRight) { bg = "#ecfdf5"; bd = "#34d399"; }
            else if (isPicked) { bg = "#fff1f2"; bd = "#fda4af"; }
          }
          return '<button type="button" ' + (nepUiState.quizSelected !== null ? 'disabled' : '') + ' onclick="pickNepQuizOption(' + idx + ')" style="width:100%;border-radius:14px;padding:10px 12px;border:1px solid ' + bd + ';background:' + bg + ';text-align:left;font-size:12px;font-weight:900;cursor:pointer;">' + esc(opt) + '</button>';
        }).join("");

        bodyEl.innerHTML =
          '<div class="flex justify-between items-center text-xs font-bold text-gray-500">' +
            '<span>Question ' + (nepUiState.quizIdx + 1) + ' of ' + mod.quiz.length + '</span>' +
            '<button type="button" onclick="toggleNepQuizHint()" class="nyra-pill-btn">💡 Hint</button>' +
          '</div>' +
          '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:14px;text-align:center;">' +
            '<div style="font-size:34px;">' + esc(q.emoji) + '</div>' +
            '<div class="text-sm font-black mt-2">' + esc(q.prompt) + '</div>' +
          '</div>' +
          (nepUiState.quizHintShown ? '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:8px;font-size:12px;font-weight:700;color:#92400e;">💡 ' + esc(q.hint) + '</div>' : '') +
          optsHtml +
          (nepUiState.quizSelected !== null
            ? '<div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:10px;font-size:12px;font-weight:700;color:#312e81;">' +
              (nepUiState.quizSelected === q.correctAnswer ? '✅ Great! ' : '💛 Remember: ') + esc(q.explanation) + '</div>' +
              '<button type="button" onclick="nextNepQuizQuestion()" class="nyra-primary-btn w-full">' +
              (nepUiState.quizIdx + 1 < mod.quiz.length ? 'Next Question →' : 'See My Score 🏆') + '</button>'
            : '');
      } else {
        var askHelpBtn = nepUiState.quizFinalScore < 60
          ? '<button type="button" onclick="askNyraFromNepLesson(' + JSON.stringify("Can you help me understand " + mod.moduleTitle + " gently?").replace(/"/g, "&quot;") + ')" class="nyra-primary-btn w-full">💬 Ask NYRA for Gentle Help</button>'
          : '';
        bodyEl.innerHTML =
          '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;text-align:center;" class="space-y-3">' +
            '<div style="font-size:40px;">' + (nepUiState.quizFinalScore >= 60 ? '🏆' : '🌟') + '</div>' +
            '<div class="text-2xl font-black" style="color:#4f46e5;">' + nepUiState.quizFinalScore + '%</div>' +
            '<div class="text-xs font-bold text-gray-600">' + nepUiState.quizCorrect + ' out of ' + mod.quiz.length + ' correct!</div>' +
            askHelpBtn +
            '<div class="flex gap-2">' +
              '<button type="button" onclick="restartNepQuiz()" class="nyra-pill-btn flex-1">Try Again</button>' +
              '<button type="button" onclick="setNepZoneTab(\'challenge\')" class="nyra-primary-btn flex-1" style="background:linear-gradient(135deg,#10b981,#059669);">Mission 🌟 →</button>' +
            '</div>' +
          '</div>';
      }
    } else if (nepUiState.tab === "challenge") {
      bodyEl.innerHTML =
        '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:16px;padding:14px;">' +
          '<div class="text-xs font-black" style="color:#b45309;">🌍 HANDS-ON FAMILY MISSION</div>' +
          '<div class="text-base font-black mt-1">' + esc(mod.realLifeChallenge.title) + '</div>' +
          '<p class="text-xs font-semibold text-gray-700 mt-1.5 leading-relaxed">' + esc(mod.realLifeChallenge.instruction) + '</p>' +
          '<div style="background:#fff;border-radius:10px;padding:8px;margin-top:8px;font-size:11px;font-weight:700;color:#475569;">👨‍👩‍👧 Parent Tip: ' + esc(mod.realLifeChallenge.familyTip) + '</div>' +
        '</div>' +
        '<div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:16px;padding:12px;display:flex;align-items:center;justify-content:space-between;">' +
          '<div class="flex items-center gap-2"><span style="font-size:28px;">' + esc(mod.badge.emoji) + '</span>' +
            '<div><div class="text-xs font-black" style="color:#312e81;">Zone Badge: ' + esc(mod.badge.title) + '</div>' +
            '<div style="font-size:11px;font-weight:600;color:#4338ca;">' + (prog.challengeDone ? 'Earned & saved!' : 'Complete the challenge to unlock!') + '</div></div>' +
          '</div><span style="font-size:18px;">' + (prog.challengeDone ? '✅' : '🔒') + '</span>' +
        '</div>' +
        '<button type="button" onclick="completeNepChallenge()" class="nyra-primary-btn w-full" style="background:' + (prog.challengeDone ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#4f46e5,#4338ca)') + ';">' +
          (prog.challengeDone ? 'Challenge Completed! 🌟 (Badge Unlocked)' : 'I Did This Real-Life Challenge! 🌟') +
        '</button>';
    }
  }
})();
