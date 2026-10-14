/**
 * 组装提交数据，并按 config.js 送往飞书。
 * Webhook 为空时不发请求，也不在控制台报错；页面仍可看结果。
 * 飞书写入失败时，数据留在 localStorage，结果页可以再试一次。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.SurveySubmit = api;
  }
})(typeof window !== "undefined" ? window : null, function () {
  var LAST_KEY = "shenghuo-xinqing:last";
  var PENDING_KEY = "shenghuo-xinqing:pending";

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function createUserId(date) {
    var d = date || new Date();
    var stamp = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
    var rand = Math.random().toString(36).slice(2, 8);
    return "sx" + stamp + rand;
  }

  function formatLocalTime(date) {
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(date).replace(/\//g, "-");
    } catch (err) {
      return date.toISOString();
    }
  }

  function readConfig(override) {
    var source = override;
    if (!source) {
      if (typeof window !== "undefined" && window.SURVEY_CONFIG) source = window.SURVEY_CONFIG;
      else if (typeof globalThis !== "undefined" && globalThis.SURVEY_CONFIG) source = globalThis.SURVEY_CONFIG;
      else source = {};
    }
    var bitable = source.FEISHU_BITABLE || source.bitable || {};
    return {
      webhookUrl: String(source.FEISHU_WEBHOOK_URL || source.webhookUrl || "").trim(),
      webhookMode: source.FEISHU_WEBHOOK_MODE || source.webhookMode || "bot",
      bitable: {
        appId: String(bitable.appId || "").trim(),
        appSecret: String(bitable.appSecret || "").trim(),
        appToken: String(bitable.appToken || "").trim(),
        tableId: String(bitable.tableId || "").trim()
      }
    };
  }

  function bitableReady(cfg) {
    var b = cfg.bitable;
    return !!(b.appId && b.appSecret && b.appToken && b.tableId);
  }

  function deliveryPlan(cfg) {
    if (cfg.webhookUrl) return "webhook";
    if (bitableReady(cfg)) return "bitable";
    return "local";
  }

  function findQuestion(questions, id) {
    for (var i = 0; i < questions.length; i += 1) {
      if (questions[i].id === id) return questions[i];
    }
    return null;
  }

  function answerLabels(question, raw) {
    var ids = question.type === "multi" ? (Array.isArray(raw) ? raw : []) : (raw ? [raw] : []);
    var labels = [];
    ids.forEach(function (id) {
      var found = null;
      (question.options || []).forEach(function (option) {
        if (option.id === id) found = option;
      });
      labels.push(found ? found.label : id);
    });
    return { ids: ids, labels: labels };
  }

  function dimensionText(profile) {
    return profile.dimensionOrder.map(function (id) {
      var item = profile.dimensions[id];
      return item.name + ":" + item.level;
    }).join("；");
  }

  function topNeedText(profile) {
    return profile.topNeeds.map(function (item) {
      return item.name + "(" + item.level + ")";
    }).join("、");
  }

  function buildFields(payload) {
    var answers = payload.answers;
    var profile = payload.profile;
    var fields = {
      "用户ID": payload.userId,
      "提交时间": payload.submittedAtLocal,
      "年龄段": answers.q1.labels[0] || "",
      "居住": answers.q2.labels[0] || "",
      "生活状态": answers.q3.labels[0] || "",
      "六维": dimensionText(profile),
      "核心需求TOP3": topNeedText(profile),
      "用户类型": profile.userType.code + " " + profile.userType.name,
      "建议跟进": profile.followUp,
      "风险提示": profile.risk.note,
      "需求总结": profile.summary
    };
    ["q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13", "q14", "q15"].forEach(function (qid) {
      var pack = answers[qid];
      fields[qid.toUpperCase()] = (pack.labels || []).join("、");
    });
    return fields;
  }

  function buildPayload(answers, profile, questions, meta) {
    meta = meta || {};
    var submitted = meta.submittedAt ? new Date(meta.submittedAt) : new Date();
    var packed = {};
    questions.forEach(function (question) {
      var picked = answerLabels(question, answers[question.id]);
      packed[question.id] = {
        field: question.field,
        optionIds: picked.ids,
        labels: picked.labels,
        score: profile.scores ? profile.scores[question.id] : undefined
      };
    });
    var payload = {
      version: "0.1",
      userId: meta.userId || createUserId(submitted),
      submittedAt: submitted.toISOString(),
      submittedAtLocal: formatLocalTime(submitted),
      answers: packed,
      profile: {
        dimensions: profile.dimensions,
        dimensionOrder: profile.dimensionOrder,
        topNeeds: profile.topNeeds,
        userType: profile.userType,
        followUp: profile.followUp,
        risk: profile.risk,
        summary: profile.summary
      }
    };
    payload.fields = buildFields(payload);
    return payload;
  }

  function buildFeishuText(payload) {
    var fields = payload.fields;
    var lines = [
      "【生活与心情小调查】",
      "用户ID：" + fields["用户ID"],
      "提交时间：" + fields["提交时间"],
      "年龄段：" + fields["年龄段"],
      "居住：" + fields["居住"],
      "生活状态：" + fields["生活状态"]
    ];
    ["Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q12", "Q13", "Q14", "Q15"].forEach(function (key) {
      lines.push(key + "：" + (fields[key] || ""));
    });
    lines.push("六维：" + fields["六维"]);
    lines.push("核心需求TOP3：" + fields["核心需求TOP3"]);
    lines.push("用户类型：" + fields["用户类型"]);
    lines.push("建议跟进：" + fields["建议跟进"]);
    lines.push("风险提示：" + fields["风险提示"]);
    lines.push("需求总结：" + fields["需求总结"]);
    return lines.join("\n");
  }

  function buildFeishuBody(payload, mode) {
    if (mode === "bitable") return { fields: payload.fields };
    return {
      msg_type: "text",
      content: { text: buildFeishuText(payload) }
    };
  }

  function writeStore(key, value) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* 隐私模式可能禁用本地存储，不影响看结果 */
    }
  }

  function readStore(key) {
    try {
      if (typeof localStorage === "undefined") return null;
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function removeStore(key) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.removeItem(key);
    } catch (err) {
      /* 忽略 */
    }
  }

  function isHttpsUrl(url) {
    return /^https:\/\/\S+$/i.test(url);
  }

  function feishuAccepted(body) {
    if (!body || typeof body !== "object") return true;
    if (typeof body.code === "number" && body.code !== 0) return false;
    if (typeof body.StatusCode === "number" && body.StatusCode !== 0) return false;
    return true;
  }

  function postJson(url, body, headers, timeoutMs) {
    var fetcher = typeof fetch === "function" ? fetch : null;
    if (!fetcher) return Promise.resolve({ ok: false, reason: "no-fetch" });
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs || 10000) : null;
    return fetcher(url, {
      method: "POST",
      headers: headers || { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      return res.text().then(function (text) {
        var parsed = null;
        try { parsed = text ? JSON.parse(text) : null; } catch (err) { parsed = null; }
        return {
          ok: res.ok && feishuAccepted(parsed),
          status: res.status,
          body: parsed
        };
      });
    }).catch(function () {
      return { ok: false, reason: "network" };
    }).then(function (result) {
      if (timer) clearTimeout(timer);
      return result;
    });
  }

  /* 妙搭 Webhook 不回 CORS 头，预检(OPTIONS)会被 302 到登录页；
     用 text/plain + no-cors 的“简单请求”避开预检，响应不可读，发出即视为成功。 */
  function postSimple(url, body, timeoutMs) {
    var text = JSON.stringify(body);
    var fetcher = typeof fetch === "function" ? fetch : null;
    if (!fetcher) {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        var sent = navigator.sendBeacon(url, new Blob([text], { type: "text/plain;charset=UTF-8" }));
        return Promise.resolve({ ok: !!sent, reason: sent ? "beacon" : "beacon-failed" });
      }
      return Promise.resolve({ ok: false, reason: "no-fetch" });
    }
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs || 10000) : null;
    return fetcher(url, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: text,
      signal: ctrl ? ctrl.signal : undefined
    }).then(function () {
      return { ok: true, status: 0, opaque: true };
    }).catch(function () {
      return { ok: false, reason: "network" };
    }).then(function (result) {
      if (timer) clearTimeout(timer);
      return result;
    });
  }

  function calmLog(message) {
    if (typeof console !== "undefined" && console.info) {
      console.info("[生活与心情小调查] " + message);
    }
  }

  function sendWebhook(cfg, payload) {
    if (!isHttpsUrl(cfg.webhookUrl)) {
      calmLog("Webhook 需要以 https 开头，这次只留在本机。");
      return Promise.resolve({ ok: false, reason: "bad-url" });
    }
    var mode = cfg.webhookMode === "bitable" ? "bitable" : "bot";
    if (mode === "bitable") return postSimple(cfg.webhookUrl, buildFeishuBody(payload, mode));
    return postJson(cfg.webhookUrl, buildFeishuBody(payload, mode));
  }

  function sendBitable(cfg, payload) {
    var tokenUrl = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";
    return postJson(tokenUrl, {
      app_id: cfg.bitable.appId,
      app_secret: cfg.bitable.appSecret
    }).then(function (tokenRes) {
      var token = tokenRes.body && tokenRes.body.tenant_access_token;
      if (!tokenRes.ok || !token) return { ok: false, reason: "token" };
      var url = "https://open.feishu.cn/open-apis/bitable/v1/apps/"
        + encodeURIComponent(cfg.bitable.appToken)
        + "/tables/"
        + encodeURIComponent(cfg.bitable.tableId)
        + "/records";
      return postJson(url, { fields: payload.fields }, {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      });
    });
  }

  function finishLocal(payload, channel, feishuOk) {
    writeStore(LAST_KEY, payload);
    if (feishuOk || channel === "local") removeStore(PENDING_KEY);
    else writeStore(PENDING_KEY, payload);
    return {
      ok: true,
      channel: channel,
      feishu: feishuOk,
      storedLocal: true,
      userId: payload.userId
    };
  }

  function submitSurvey(payload, configOverride) {
    var cfg = readConfig(configOverride);
    var plan = deliveryPlan(cfg);
    writeStore(LAST_KEY, payload);
    if (plan === "local") {
      removeStore(PENDING_KEY);
      return Promise.resolve(finishLocal(payload, "local", false));
    }
    var request = plan === "bitable" ? sendBitable(cfg, payload) : sendWebhook(cfg, payload);
    return request.then(function (result) {
      if (result && result.ok) return finishLocal(payload, plan, true);
      if (!result || result.reason !== "bad-url") {
        calmLog("飞书这次没有收下，选择已留在本机，可以再试一次。");
      }
      return finishLocal(payload, plan, false);
    });
  }

  return {
    LAST_KEY: LAST_KEY,
    PENDING_KEY: PENDING_KEY,
    createUserId: createUserId,
    readConfig: readConfig,
    deliveryPlan: deliveryPlan,
    buildPayload: buildPayload,
    buildFeishuBody: buildFeishuBody,
    buildFeishuText: buildFeishuText,
    submitSurvey: submitSurvey,
    readLast: function () { return readStore(LAST_KEY); },
    readPending: function () { return readStore(PENDING_KEY); }
  };
});
