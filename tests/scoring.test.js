/**
 * 抽样核对六维、分型、Q15 抬升和结果文案。
 * 运行：node tests/scoring.test.js
 */
var assert = require("assert");
var content = require("../js/content.js");
var scoring = require("../js/scoring.js");
var submitApi = require("../js/submit.js");

var BANNED = [
  "心理疾病",
  "心理测评",
  "抑郁测试",
  "老年心理问题",
  "精神状态评估",
  "心理健康得分",
  "诊断",
  "焦虑症",
  "抑郁症",
  "心理咨询"
];

var questions = content.questions;

function optionIdByScore(qid, score) {
  var question = questions.find(function (item) { return item.id === qid; });
  var option = question.options.find(function (item) { return item.score === score; });
  if (!option) throw new Error("找不到分值 " + score + "：" + qid);
  return option.id;
}

function baseline() {
  var answers = {
    q1: "60",
    q2: "partner",
    q3: "retired",
    q15: ["none"]
  };
  ["q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13", "q14"].forEach(function (qid) {
    answers[qid] = optionIdByScore(qid, 0);
  });
  return answers;
}

function withScores(map, extra) {
  var answers = baseline();
  Object.keys(map).forEach(function (qid) {
    answers[qid] = optionIdByScore(qid, map[qid]);
  });
  if (extra) {
    Object.keys(extra).forEach(function (key) { answers[key] = extra[key]; });
  }
  return answers;
}

function run(name, fn) {
  try {
    fn();
    console.log("  ok  " + name);
  } catch (err) {
    console.error("  fail  " + name);
    throw err;
  }
}

function assertNoBanned(text, where) {
  BANNED.forEach(function (word) {
    assert.strictEqual(text.indexOf(word), -1, where + " 含有禁词：" + word);
  });
}

console.log("选项分值与文案规则");
questions.forEach(function (question) {
  if (!question.scored) return;
  question.options.forEach(function (option) {
    run(question.id + " " + option.label, function () {
      assert.strictEqual(scoring.expectedScore(question.id, option.label), option.score);
    });
  });
});

run("阈值", function () {
  assert.strictEqual(scoring.levelFromMean(1.4), "高");
  assert.strictEqual(scoring.levelFromMean(1.399), "中");
  assert.strictEqual(scoring.levelFromMean(0.7), "中");
  assert.strictEqual(scoring.levelFromMean(0.699), "低");
  assert.strictEqual(scoring.levelFromMean(2 / 3), "低");
  assert.strictEqual(scoring.levelFromMean(4 / 3), "中");
  assert.strictEqual(scoring.levelFromMean(5 / 3), "高");
});

run("全低时按并列归到家庭，页面用安稳反馈", function () {
  var profile = scoring.scoreSurvey(baseline(), questions);
  assert.strictEqual(profile.userType.code, "B");
  assert.strictEqual(profile.userType.name, "家庭困扰型");
  assert.strictEqual(profile.dimensions.family.level, "低");
  assert.strictEqual(profile.topNeeds.map(function (item) { return item.id; }).join(","), "family,companion,emotion");
  assert.strictEqual(profile.risk.flag, false);
  assert.ok(profile.feedback[0].indexOf("安稳") !== -1);
  assert.ok(profile.followUp.indexOf("大体平稳") !== -1);
  assert.ok(profile.summary.indexOf("没有特别突出的需要") !== -1);
});

run("陪伴型 A", function () {
  var profile = scoring.scoreSurvey(withScores({ q4: 2, q5: 2 }), questions);
  assert.strictEqual(profile.dimensions.companion.level, "高");
  assert.strictEqual(profile.dimensions.companion.mean, 2);
  assert.strictEqual(profile.userType.code, "A");
  assert.strictEqual(profile.risk.flag, false);
  assert.ok(profile.feedback[0].indexOf("说说话") !== -1);
});

run("家庭与陪伴同分时家庭优先", function () {
  var profile = scoring.scoreSurvey(withScores({ q4: 2, q5: 2, q9: 2, q10: 2 }), questions);
  assert.strictEqual(profile.userType.code, "B");
  assert.strictEqual(profile.topNeeds[0].id, "family");
  assert.strictEqual(profile.topNeeds[1].id, "companion");
});

run("情绪型 C 且内部优先倾听", function () {
  var profile = scoring.scoreSurvey(withScores({ q6: 2, q7: 2, q8: 2 }), questions);
  assert.strictEqual(profile.dimensions.emotion.level, "高");
  assert.strictEqual(profile.userType.code, "C");
  assert.strictEqual(profile.risk.flag, true);
  assert.strictEqual(profile.risk.code, "priority_listen");
  assert.ok(profile.feedback.join("").indexOf(profile.risk.note) === -1);
});

run("两项偏高但均分未到高，仍做内部标记", function () {
  var profile = scoring.scoreSurvey(withScores({ q6: 0, q7: 2, q8: 2 }), questions);
  assert.strictEqual(profile.dimensions.emotion.level, "中");
  assert.strictEqual(profile.dimensions.emotion.mean, 1.33);
  assert.strictEqual(profile.risk.flag, true);
});

run("情绪均分四题边界仍为中且不标记", function () {
  var profile = scoring.scoreSurvey(withScores({ q6: 2, q7: 1, q8: 1 }), questions);
  assert.strictEqual(profile.dimensions.emotion.levelBeforeLift, "中");
  assert.strictEqual(profile.risk.flag, false);
});

run("Q11 经常联系为低，基本没有为高，分型 D", function () {
  var low = scoring.scoreSurvey(withScores({ q11: 0 }), questions);
  assert.strictEqual(low.dimensions.social.level, "低");
  var mid = scoring.scoreSurvey(withScores({ q11: 1 }), questions);
  assert.strictEqual(mid.dimensions.social.level, "中");
  assert.strictEqual(mid.userType.code, "D");
  var high = scoring.scoreSurvey(withScores({ q11: 2 }), questions);
  assert.strictEqual(high.dimensions.social.level, "高");
  assert.strictEqual(high.userType.code, "D");
});

run("Q13 同时抬高兴趣与意义，意义优先", function () {
  var profile = scoring.scoreSurvey(withScores({ q13: 2 }), questions);
  assert.strictEqual(profile.dimensions.interest.mean, 1);
  assert.strictEqual(profile.dimensions.meaning.mean, 1);
  assert.strictEqual(profile.dimensions.interest.level, "中");
  assert.strictEqual(profile.userType.code, "F");
});

run("兴趣高于意义时为生活空心型 E", function () {
  var profile = scoring.scoreSurvey(withScores({ q12: 2, q13: 2, q14: 0 }), questions);
  assert.strictEqual(profile.dimensions.interest.level, "高");
  assert.strictEqual(profile.dimensions.meaning.level, "中");
  assert.strictEqual(profile.userType.code, "E");
});

run("意义题更高时为成长探索型 F", function () {
  var profile = scoring.scoreSurvey(withScores({ q12: 0, q13: 0, q14: 2 }), questions);
  assert.strictEqual(profile.dimensions.meaning.level, "中");
  assert.strictEqual(profile.userType.code, "F");
});

run("六维都是中时顺序为家庭、陪伴、情绪", function () {
  var profile = scoring.scoreSurvey(withScores({
    q4: 1, q5: 1, q6: 1, q7: 1, q8: 1, q9: 1, q10: 1, q11: 1, q12: 1, q13: 1, q14: 1
  }), questions);
  assert.strictEqual(profile.userType.code, "B");
  assert.deepStrictEqual(profile.topNeeds.map(function (item) { return item.id; }), ["family", "companion", "emotion"]);
});

run("Q15 交朋友把社交从低抬到中，并改分型", function () {
  var profile = scoring.scoreSurvey(withScores({}, { q15: ["friends"] }), questions);
  assert.strictEqual(profile.dimensions.social.levelBeforeLift, "低");
  assert.strictEqual(profile.dimensions.social.level, "中");
  assert.strictEqual(profile.dimensions.social.levelRaised, true);
  assert.strictEqual(profile.userType.code, "D");
  assert.ok(profile.feedback[0].indexOf("朋友") !== -1);
});

run("已经是高时 Q15 不再抬升", function () {
  var profile = scoring.scoreSurvey(withScores({ q4: 2, q5: 2 }, { q15: ["listen"] }), questions);
  assert.strictEqual(profile.dimensions.companion.level, "高");
  assert.strictEqual(profile.dimensions.companion.levelRaised, false);
  assert.strictEqual(profile.dimensions.companion.q15Targeted, true);
  assert.strictEqual(profile.userType.code, "A");
});

run("兴趣活动与健康养生只抬一档", function () {
  var profile = scoring.scoreSurvey(withScores({}, { q15: ["hobby", "health"] }), questions);
  assert.strictEqual(profile.dimensions.interest.level, "中");
  assert.strictEqual(profile.userType.code, "E");
});

run("暂时都不需要与其他项同时出现时不抬升", function () {
  var profile = scoring.scoreSurvey(withScores({}, { q15: ["none", "friends"] }), questions);
  assert.strictEqual(profile.dimensions.social.level, "低");
  assert.strictEqual(profile.userType.code, "B");
});

run("三项勾选按优先级取最高", function () {
  var profile = scoring.scoreSurvey(withScores({}, { q15: ["listen", "mood", "learn"] }), questions);
  assert.strictEqual(profile.userType.code, "A");
  assert.deepStrictEqual(profile.topNeeds.map(function (item) { return item.id; }), ["companion", "emotion", "meaning"]);
});

run("陪伴与情绪同为高时陪伴优先，同时保留内部标记", function () {
  var profile = scoring.scoreSurvey(withScores({
    q4: 2, q5: 2, q6: 2, q7: 2, q8: 2
  }), questions);
  assert.strictEqual(profile.userType.code, "A");
  assert.strictEqual(profile.risk.flag, true);
});

run("结果三句话无禁词、无数字", function () {
  var samples = [
    baseline(),
    withScores({ q4: 2, q5: 2 }),
    withScores({ q9: 2, q10: 2 }),
    withScores({ q6: 2, q7: 2, q8: 2 }),
    withScores({ q11: 2 }),
    withScores({ q12: 2, q13: 2 }),
    withScores({ q13: 2, q14: 2 }),
    withScores({}, { q15: ["health"] })
  ];
  samples.forEach(function (answers) {
    var profile = scoring.scoreSurvey(answers, questions);
    assert.strictEqual(profile.feedback.length, 3);
    var text = profile.feedback.join("");
    assertNoBanned(text, "feedback");
    assertNoBanned(profile.summary, "summary");
    assertNoBanned(profile.followUp, "followUp");
    assertNoBanned(profile.risk.note, "risk");
    assert.strictEqual(/\d/.test(text), false, text);
    assert.ok(text.indexOf("接下来会根据大家的真实需要安排聊天、兴趣、健康和生活成长方面的活动。") !== -1);
    assert.ok(text.indexOf("谢谢您") !== -1);
  });
});

run("提交数据含全部答案与画像", function () {
  var answers = withScores({ q4: 2, q5: 1 }, { q15: ["listen", "hobby"] });
  var profile = scoring.scoreSurvey(answers, questions);
  var payload = submitApi.buildPayload(answers, profile, questions, {
    userId: "sx-test",
    submittedAt: "2026-10-14T02:00:00.000Z"
  });
  assert.strictEqual(payload.userId, "sx-test");
  assert.strictEqual(payload.submittedAtLocal.indexOf("2026"), 0);
  assert.strictEqual(payload.fields["年龄段"], "60～64岁");
  assert.strictEqual(payload.fields["居住"], "和老伴一起");
  assert.strictEqual(payload.fields["生活状态"], "已退休");
  assert.strictEqual(payload.fields.Q4, "经常有这种感觉");
  assert.strictEqual(payload.fields.Q8, "基本可以");
  assert.strictEqual(payload.fields.Q11, "经常联系");
  assert.strictEqual(payload.fields.Q15, "倾听聊天、兴趣活动");
  assert.ok(payload.fields["六维"].indexOf("情感陪伴:高") !== -1);
  assert.ok(payload.fields["用户类型"].indexOf("A 陪伴型") !== -1);
  assert.ok(payload.fields["需求总结"].length > 20);
  assert.ok(payload.fields["风险提示"].length > 0);
  var body = submitApi.buildFeishuBody(payload, "bot");
  assert.strictEqual(body.msg_type, "text");
  assert.ok(body.content.text.indexOf("风险提示：") !== -1);
  assert.ok(body.content.text.indexOf("Q15：倾听聊天、兴趣活动") !== -1);
  var bitable = submitApi.buildFeishuBody(payload, "bitable");
  assert.strictEqual(bitable.fields["用户ID"], "sx-test");
  assert.strictEqual(submitApi.deliveryPlan({ webhookUrl: "", bitable: {} }), "local");
  assert.strictEqual(submitApi.deliveryPlan({
    webhookUrl: "",
    bitable: { appId: "a", appSecret: "b", appToken: "c", tableId: "d" }
  }), "bitable");
});

run("题目数量与多选上限", function () {
  assert.strictEqual(questions.length, 15);
  var q15 = questions[14];
  assert.strictEqual(q15.max, 3);
  assert.strictEqual(q15.exclusive, "none");
  assert.strictEqual(q15.options.length, 8);
});

var answersForSubmit = withScores({ q4: 2, q5: 2 });
var payloadForSubmit = submitApi.buildPayload(
  answersForSubmit,
  scoring.scoreSurvey(answersForSubmit, questions),
  questions,
  { userId: "sx-empty", submittedAt: "2026-10-14T02:00:00.000Z" }
);

Promise.all([
  submitApi.submitSurvey(payloadForSubmit, { FEISHU_WEBHOOK_URL: "" }),
  submitApi.submitSurvey(payloadForSubmit, { FEISHU_WEBHOOK_URL: "notaurl" })
]).then(function (results) {
  assert.strictEqual(results[0].ok, true);
  assert.strictEqual(results[0].channel, "local");
  assert.strictEqual(results[0].feishu, false);
  assert.strictEqual(results[1].ok, true);
  assert.strictEqual(results[1].channel, "webhook");
  assert.strictEqual(results[1].feishu, false);
  console.log("  ok  空地址或无效地址仍完成本地结果");
  console.log("全部抽样通过");
}).catch(function (err) {
  console.error(err);
  process.exit(1);
});
