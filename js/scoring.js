/**
 * 本地规则引擎。页面只使用返回值里的 feedback。
 * 高 / 中 / 低、用户类型、跟进方式、risk、需求总结写入提交数据，不在页面展示。
 *
 * 计分：
 * - 经常 / 经常有 / 经常会 / 很想 / 经常有这种感觉 = 2
 * - 偶尔、有一点 = 1
 * - 基本没有 / 很少 / 暂时没有 = 0
 * - Q8 反向：基本可以 = 0，有时很难 = 1，经常很难 = 2
 * - Q11：经常联系 = 0，偶尔联系 = 1，基本没有 = 2
 * - 各维取相关题均分：>= 1.4 高，>= 0.7 中，否则低
 * - Q13 同时计入兴趣生活、精神成长/意义
 * - Q15 勾选把对应维抬一档，已经是高则不变；「暂时都不需要」不抬升
 * - 用户类型取抬升后的最高维。并列时：家庭 > 陪伴 > 情绪 > 意义 > 兴趣 > 社交
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.SurveyScoring = api;
  }
})(typeof window !== "undefined" ? window : null, function () {
  var LEVELS = ["低", "中", "高"];

  var DIMENSIONS = [
    { id: "companion", name: "情感陪伴", code: "A", typeName: "陪伴型", priority: 2, questions: ["q4", "q5"] },
    { id: "family", name: "家庭关系", code: "B", typeName: "家庭困扰型", priority: 1, questions: ["q9", "q10"] },
    { id: "emotion", name: "情绪支持", code: "C", typeName: "情绪困扰型", priority: 3, questions: ["q6", "q7", "q8"] },
    { id: "meaning", name: "精神成长/意义", code: "F", typeName: "成长探索型", priority: 4, questions: ["q13", "q14"] },
    { id: "interest", name: "兴趣生活", code: "E", typeName: "生活空心型", priority: 5, questions: ["q12", "q13"] },
    { id: "social", name: "社交连接", code: "D", typeName: "社交缺失型", priority: 6, questions: ["q11"] }
  ];

  var FIXED_LINE = "接下来会根据大家的真实需要安排聊天、兴趣、健康和生活成长方面的活动。";
  var THANKS_LINE = "谢谢您按真实感受做了选择。";

  var FEEDBACK = {
    low: "听下来，您最近的日子大体是安稳的，有人说说话、做些喜欢的小事就很好。",
    companion: "听下来，您最近比较希望有人陪着说说话，心里的事慢慢讲出来，人会松快一些。",
    family: "家里的事常常放在心上，也希望家里人能多懂您一点，这些都可以慢慢说开。",
    emotion: "最近心里装的事有点多，找人聊一聊、慢慢缓一缓，都会好一些。",
    social: "您似乎想和朋友多走动走动，人与人说说话，日子会更热闹一些。",
    interest: "日子如果有些单调，添一两件新鲜小事，生活会重新有滋味。",
    meaning: "您还想把接下来的日子过得更有意思，也愿意学一点新东西，这种心思很珍贵。"
  };

  var FOLLOW = {
    A: "建议安排轻松聊天，以倾听和陪伴为主。",
    B: "建议从家庭关系入手，安排小范围聊聊，把家里的心意说开。",
    C: "建议先安排倾听和聊天，再邀请参加放松心情的活动。",
    D: "建议邀请参加认识朋友的小活动，从说说话开始。",
    E: "建议邀请参加兴趣活动或健康养生，让日子多一点新鲜感。",
    F: "建议邀请参加学新东西、生活成长一类的活动。"
  };

  function findQuestion(questions, id) {
    for (var i = 0; i < questions.length; i += 1) {
      if (questions[i].id === id) return questions[i];
    }
    return null;
  }

  function findOption(question, optionId) {
    var options = question.options || [];
    for (var i = 0; i < options.length; i += 1) {
      if (options[i].id === optionId) return options[i];
    }
    return null;
  }

  function levelFromMean(mean) {
    if (mean >= 1.4) return "高";
    if (mean >= 0.7) return "中";
    return "低";
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function selectedIds(question, raw) {
    if (question.type === "multi") {
      if (!Array.isArray(raw)) return [];
      return raw.slice();
    }
    if (raw === undefined || raw === null || raw === "") return [];
    return [raw];
  }

  function scoreAnswers(questions, answers) {
    var scores = {};
    questions.forEach(function (question) {
      if (!question.scored) return;
      var ids = selectedIds(question, answers[question.id]);
      if (!ids.length) {
        throw new Error("缺少题目答案：" + question.id);
      }
      var option = findOption(question, ids[0]);
      if (!option || typeof option.score !== "number") {
        throw new Error("题目选项无效：" + question.id);
      }
      scores[question.id] = option.score;
    });
    return scores;
  }

  function q15Selection(questions, answers) {
    var question = findQuestion(questions, "q15");
    if (!question) return { ids: [], labels: [], lifts: {} };
    var ids = selectedIds(question, answers.q15);
    if (!ids.length) throw new Error("缺少题目答案：q15");
    var hasNone = ids.indexOf(question.exclusive || "none") !== -1;
    var lifts = {};
    var labels = [];
    var usable = hasNone ? [question.exclusive || "none"] : ids.slice(0, question.max || 3);
    usable.forEach(function (id) {
      var option = findOption(question, id);
      if (!option) throw new Error("题目选项无效：q15");
      labels.push(option.label);
      if (!hasNone && option.lift) lifts[option.lift] = true;
    });
    return { ids: usable, labels: labels, lifts: lifts, hasNone: hasNone };
  }

  function labelOf(questions, qid, answers) {
    var question = findQuestion(questions, qid);
    var ids = selectedIds(question, answers[qid]);
    if (!ids.length) return "";
    var option = findOption(question, ids[0]);
    return option ? option.label : "";
  }

  function interestSentence(selection) {
    if (selection.hasNone || !selection.labels.length) {
      return "暂没有特别想参加的项目。";
    }
    return "感兴趣的是：" + selection.labels.join("、") + "。";
  }

  function liftFeedback(top, selection) {
    if (top.id === "interest") {
      var health = selection.ids.indexOf("health") !== -1;
      var hobby = selection.ids.indexOf("hobby") !== -1;
      if (health && !hobby) return "您对健康养生有兴趣，适合从轻松的活动慢慢做起。";
      if (hobby && !health) return "您对兴趣活动有兴趣，适合从喜欢的小事慢慢做起。";
      return "您想给生活添一点兴趣和养生，适合从轻松的活动慢慢做起。";
    }
    var lines = {
      companion: "您希望有人倾听、聊聊天，我们会把轻松的聊天放在心里。",
      emotion: "您想把心情调得顺一点，聊天和放松的活动都可以慢慢来。",
      family: "您关心家里的关系，有机会可以在轻松的场合慢慢聊。",
      social: "您想多认识朋友、多走动，我们会留意这类轻松的活动。",
      meaning: "您想学一点新东西，这种心思很珍贵，可以慢慢来。"
    };
    return lines[top.id] || FEEDBACK[top.id];
  }

  function buildFeedback(top, selection) {
    var first;
    if (top.level === "低") first = FEEDBACK.low;
    else if (top.q15Targeted && top.levelBeforeLift === "低") first = liftFeedback(top, selection);
    else first = FEEDBACK[top.id];
    return [first, FIXED_LINE, THANKS_LINE];
  }

  function buildFollowUp(winner, selection) {
    if (winner.level === "低") {
      return "目前生活大体平稳，可偶尔邀请参加轻松活动，不必急着跟进。各维度都较轻，类型仅按并列规则归档，不代表该项有明显需要。";
    }
    var text = FOLLOW[winner.code];
    if (!selection.hasNone && selection.labels.length) {
      text += "本人感兴趣：" + selection.labels.join("、") + "。";
    }
    return text;
  }

  function buildSummary(demo, ranked, selection, followUp) {
    var notable = ranked.filter(function (item) { return item.level !== "低"; });
    var head = demo.age + "，" + demo.living + "，" + demo.status + "。";
    if (!notable.length) {
      return head + "最近生活大体平稳，没有特别突出的需要。" + interestSentence(selection) + followUp;
    }
    var names = notable.slice(0, 3).map(function (item) { return item.name; }).join("、");
    return head + "比较在意的是" + names + "。" + interestSentence(selection) + followUp;
  }

  function assessRisk(scores, emotionLevelBefore) {
    var hardToSettle = scores.q8 === 2;
    var frequentEmotion = scores.q6 === 2 || scores.q7 === 2;
    if (emotionLevelBefore === "高" || (hardToSettle && frequentEmotion)) {
      return {
        flag: true,
        code: "priority_listen",
        note: "心情不太容易自己缓过来，建议优先安排聊天倾听"
      };
    }
    return { flag: false, code: "none", note: "常规跟进" };
  }

  function scoreSurvey(answers, questions) {
    if (!answers || !questions) throw new Error("缺少答案或题目");
    var scores = scoreAnswers(questions, answers);
    var selection = q15Selection(questions, answers);

    var dimensions = {};
    var ranked = DIMENSIONS.map(function (dim) {
      var sum = 0;
      dim.questions.forEach(function (qid) { sum += scores[qid]; });
      var meanExact = sum / dim.questions.length;
      var levelBeforeLift = levelFromMean(meanExact);
      var targeted = !!selection.lifts[dim.id];
      var level = levelBeforeLift;
      if (targeted) {
        level = LEVELS[Math.min(2, LEVELS.indexOf(levelBeforeLift) + 1)];
      }
      var item = {
        id: dim.id,
        name: dim.name,
        priority: dim.priority,
        code: dim.code,
        typeName: dim.typeName,
        mean: round2(meanExact),
        _mean: meanExact,
        levelBeforeLift: levelBeforeLift,
        level: level,
        q15Targeted: targeted,
        levelRaised: level !== levelBeforeLift
      };
      dimensions[dim.id] = item;
      return item;
    });

    ranked.sort(function (a, b) {
      var levelDelta = LEVELS.indexOf(b.level) - LEVELS.indexOf(a.level);
      if (levelDelta) return levelDelta;
      if (a._mean !== b._mean) return b._mean - a._mean;
      return a.priority - b.priority;
    });
    ranked.forEach(function (item) { delete item._mean; });

    var winner = ranked[0];
    var demo = {
      age: labelOf(questions, "q1", answers),
      living: labelOf(questions, "q2", answers),
      status: labelOf(questions, "q3", answers)
    };
    var followUp = buildFollowUp(winner, selection);
    var emotionBefore = dimensions.emotion.levelBeforeLift;

    return {
      dimensions: dimensions,
      dimensionOrder: DIMENSIONS.map(function (dim) { return dim.id; }),
      topNeeds: ranked.slice(0, 3).map(function (item, index) {
        return {
          rank: index + 1,
          id: item.id,
          name: item.name,
          level: item.level,
          mean: item.mean
        };
      }),
      userType: {
        code: winner.code,
        name: winner.typeName,
        dimension: winner.name
      },
      followUp: followUp,
      risk: assessRisk(scores, emotionBefore),
      summary: buildSummary(demo, ranked, selection, followUp),
      feedback: buildFeedback(winner, selection),
      scores: scores
    };
  }

  /**
   * 用选项原文核对分值。Q8、Q11 走特例。
   * 供自测使用，页面计分以选项上的 score 为准。
   */
  function expectedScore(questionId, label) {
    if (questionId === "q8") {
      if (label.indexOf("基本可以") !== -1) return 0;
      if (label.indexOf("有时") !== -1) return 1;
      if (label.indexOf("经常很难") !== -1) return 2;
      return null;
    }
    if (questionId === "q11") {
      if (label.indexOf("经常") !== -1) return 0;
      if (label.indexOf("偶尔") !== -1) return 1;
      if (label.indexOf("基本没有") !== -1) return 2;
      return null;
    }
    if (/经常|很想/.test(label)) return 2;
    if (/偶尔|有一点/.test(label)) return 1;
    if (/基本没有|很少|暂时没有/.test(label)) return 0;
    return null;
  }

  return {
    DIMENSIONS: DIMENSIONS,
    scoreSurvey: scoreSurvey,
    expectedScore: expectedScore,
    levelFromMean: levelFromMean
  };
});
