/**
 * 欢迎 → 逐题点选 → 结果。
 * 结果页只展示计分引擎给出的三句反馈，不展示分档、类型和内部标记。
 */
(function () {
  var content = window.SURVEY_CONTENT;
  var scoring = window.SurveyScoring;
  var submitApi = window.SurveySubmit;
  var questions = content.questions;
  var root = document.getElementById("app");

  var state = {
    screen: "welcome",
    index: 0,
    answers: {},
    profile: null,
    payload: null,
    recordNote: "",
    showRetry: false,
    submitting: false
  };

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function question() {
    return questions[state.index];
  }

  function selectedIds(q) {
    var value = state.answers[q.id];
    if (q.type === "multi") return Array.isArray(value) ? value.slice() : [];
    return value ? [value] : [];
  }

  function isAnswered(q) {
    return selectedIds(q).length > 0;
  }

  function shell(body, foot) {
    root.innerHTML = '<div class="shell"><div class="body" id="main">' + body + '</div><div class="foot">' + foot + '</div></div>';
  }

  function renderWelcome() {
    shell(
      '<header class="hero">' +
        '<div class="seal" aria-hidden="true"><span>安</span></div>' +
        '<h1>' + escapeHtml(content.title) + '</h1>' +
        '<p class="lede">' + escapeHtml(content.subtitle) + '</p>' +
        '<p class="duration">' + escapeHtml(content.duration) + '</p>' +
        '<p class="quiet">不用登录，也不用打字，点一点就可以。</p>' +
      '</header>',
      '<button type="button" class="btn-primary" id="start">开始</button>'
    );
    document.getElementById("start").addEventListener("click", function () {
      state.screen = "question";
      state.index = 0;
      render();
    });
  }

  function progressMarkup(index) {
    var current = index + 1;
    var total = questions.length;
    var width = Math.round((current / total) * 100);
    return '<div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="' + total + '" aria-valuenow="' + current + '" aria-valuetext="第 ' + current + ' 题，共 ' + total + ' 题">' +
      '<div class="progress-row"><span>第 ' + current + ' 题</span><span>共 ' + total + ' 题</span></div>' +
      '<div class="track"><div class="fill" style="width:' + width + '%"></div></div>' +
    '</div>';
  }

  function optionMarkup(q, option) {
    var pressed = selectedIds(q).indexOf(option.id) !== -1;
    return '<button type="button" class="option" data-option="' + escapeHtml(option.id) + '" aria-pressed="' + (pressed ? "true" : "false") + '">' +
      '<span class="option-label">' + escapeHtml(option.label) + '</span>' +
      '<span class="tick" aria-hidden="true">✓</span>' +
    '</button>';
  }

  function renderQuestion() {
    var q = question();
    var last = state.index === questions.length - 1;
    var options = q.options.map(function (option) { return optionMarkup(q, option); }).join("");
    var help = q.help ? '<p class="help" id="question-help">' + escapeHtml(q.help) + '</p>' : "";
    var count = q.type === "multi" ? '<p class="count" id="pick-count"></p>' : "";
    var kicker = q.kicker ? '<p class="kicker">' + escapeHtml(q.kicker) + '</p>' : '<p class="kicker kicker-spacer"></p>';
    shell(
      progressMarkup(state.index) +
      '<div class="question">' +
        kicker +
        '<h1 id="question-title" tabindex="-1">' + escapeHtml(q.title) + '</h1>' +
        help +
        '<div class="options" role="group" aria-labelledby="question-title">' + options + '</div>' +
        count +
      '</div>',
      '<p class="hint" id="hint" role="status"></p>' +
      '<button type="button" class="btn-primary" id="next">' + (last ? "完成" : "下一题") + '</button>' +
      '<button type="button" class="btn-ghost" id="back">' + (state.index === 0 ? "返回" : "上一题") + '</button>'
    );
    updateCount();
    document.querySelectorAll(".option").forEach(function (button) {
      button.addEventListener("click", function () {
        choose(q, button.getAttribute("data-option"));
      });
    });
    document.getElementById("next").addEventListener("click", goNext);
    document.getElementById("back").addEventListener("click", goBack);
    var title = document.getElementById("question-title");
    if (title && title.focus) title.focus({ preventScroll: true });
  }

  function updateCount() {
    var q = question();
    var node = document.getElementById("pick-count");
    if (!node || q.type !== "multi") return;
    node.textContent = "已选 " + selectedIds(q).length + " 项，最多 " + q.max + " 项";
  }

  function syncPressed(q) {
    var chosen = selectedIds(q);
    document.querySelectorAll(".option").forEach(function (button) {
      var id = button.getAttribute("data-option");
      button.setAttribute("aria-pressed", chosen.indexOf(id) !== -1 ? "true" : "false");
    });
    updateCount();
  }

  function showHint(text) {
    var hint = document.getElementById("hint");
    if (hint) hint.textContent = text;
  }

  function choose(q, optionId) {
    if (q.type === "single") {
      state.answers[q.id] = optionId;
      syncPressed(q);
      showHint("");
      return;
    }
    var selected = selectedIds(q);
    var index = selected.indexOf(optionId);
    if (index !== -1) {
      selected.splice(index, 1);
    } else if (optionId === q.exclusive) {
      selected = [q.exclusive];
    } else {
      selected = selected.filter(function (id) { return id !== q.exclusive; });
      if (selected.length >= q.max) {
        showHint("最多选 " + q.max + " 项。可以先点已选的，取消一项。");
        return;
      }
      selected.push(optionId);
    }
    state.answers[q.id] = selected;
    syncPressed(q);
    showHint("");
  }

  function goBack() {
    if (state.index === 0) {
      state.screen = "welcome";
    } else {
      state.index -= 1;
    }
    render();
  }

  function goNext() {
    var q = question();
    if (!isAnswered(q)) {
      showHint(q.type === "multi" ? "请至少选一项。" : "请先选一个最接近的。");
      return;
    }
    if (state.index < questions.length - 1) {
      state.index += 1;
      render();
      return;
    }
    complete();
  }

  function recordMessage(result) {
    if (result && result.channel !== "local" && result.feishu === false) {
      return "选择已留在这台设备上。送到记录处时没成功，可以再试一次。";
    }
    return "已记录本次选择";
  }

  function complete() {
    state.profile = scoring.scoreSurvey(state.answers, questions);
    state.payload = submitApi.buildPayload(state.answers, state.profile, questions);
    var plan = submitApi.deliveryPlan(submitApi.readConfig());
    state.recordNote = plan === "local" ? "已记录本次选择" : "正在记下这次选择…";
    state.showRetry = false;
    state.submitting = plan !== "local";
    state.screen = "result";
    render();
    submitApi.submitSurvey(state.payload).then(function (result) {
      if (state.screen !== "result" || !state.payload || result.userId !== state.payload.userId) return;
      state.recordNote = recordMessage(result);
      state.showRetry = result.channel !== "local" && result.feishu === false;
      state.submitting = false;
      var note = document.getElementById("record-note");
      if (note) note.textContent = state.recordNote;
      var retry = document.getElementById("retry");
      if (retry) retry.hidden = !state.showRetry;
    });
  }

  function retrySend() {
    if (!state.payload || state.submitting) return;
    state.submitting = true;
    state.recordNote = "正在记下这次选择…";
    var note = document.getElementById("record-note");
    if (note) note.textContent = state.recordNote;
    submitApi.submitSurvey(state.payload).then(function (result) {
      state.submitting = false;
      state.recordNote = recordMessage(result);
      state.showRetry = result.channel !== "local" && result.feishu === false;
      if (note) note.textContent = state.recordNote;
      var retry = document.getElementById("retry");
      if (retry) retry.hidden = !state.showRetry;
    });
  }

  function renderResult() {
    var lines = (state.profile.feedback || []).map(function (line) {
      return "<p>" + escapeHtml(line) + "</p>";
    }).join("");
    shell(
      '<header class="hero hero-result">' +
        '<div class="seal" aria-hidden="true"><span>安</span></div>' +
        '<h1>给您的几句话</h1>' +
      '</header>' +
      '<div class="feedback" id="feedback">' + lines + '</div>',
      '<button type="button" class="btn-ghost" id="restart">再填一次</button>' +
      '<button type="button" class="btn-text" id="retry"' + (state.showRetry ? "" : " hidden") + '>再试一次送出</button>' +
      '<p class="fine-print" id="record-note">' + escapeHtml(state.recordNote) + '</p>'
    );
    document.getElementById("restart").addEventListener("click", function () {
      state.screen = "welcome";
      state.index = 0;
      state.answers = {};
      state.profile = null;
      state.payload = null;
      state.recordNote = "";
      state.showRetry = false;
      render();
    });
    var retry = document.getElementById("retry");
    if (retry) retry.addEventListener("click", retrySend);
  }

  function render() {
    if (state.screen === "question") renderQuestion();
    else if (state.screen === "result") renderResult();
    else renderWelcome();
    root.setAttribute("data-screen", state.screen);
  }

  render();
})();
