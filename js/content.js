/**
 * 题目文案与选项。计分数字写在选项上，方便和规格对照。
 * Q1～Q3 不计分。Q8、Q11 的分值是特例，不要按「经常 = 2」去改。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.SURVEY_CONTENT = api;
  }
})(typeof window !== "undefined" ? window : null, function () {
  var often = [
    { id: "often", label: "经常有这种感觉", score: 2 },
    { id: "sometimes", label: "偶尔会", score: 1 },
    { id: "rarely", label: "基本没有", score: 0 }
  ];

  return {
    version: "0.1",
    title: "生活与心情小调查",
    subtitle: "花 2～3 分钟，了解一下您最近的生活状态。没有标准答案，按真实感受选择就好。",
    duration: "约 15 题，2～3 分钟",
    questions: [
      {
        id: "q1",
        field: "年龄段",
        kicker: "先了解一下基本情况",
        title: "您的年龄大概是？",
        type: "single",
        scored: false,
        options: [
          { id: "50", label: "50～54岁" },
          { id: "55", label: "55～59岁" },
          { id: "60", label: "60～64岁" },
          { id: "65", label: "65～69岁" },
          { id: "70", label: "70岁及以上" }
        ]
      },
      {
        id: "q2",
        field: "居住",
        title: "您目前主要和谁一起生活？",
        type: "single",
        scored: false,
        options: [
          { id: "alone", label: "自己一个人" },
          { id: "partner", label: "和老伴一起" },
          { id: "child", label: "和子女一起" },
          { id: "both", label: "和老伴、子女一起" },
          { id: "relative", label: "其他亲人" }
        ]
      },
      {
        id: "q3",
        field: "生活状态",
        title: "您现在的生活状态，更接近哪一种？",
        type: "single",
        scored: false,
        options: [
          { id: "work", label: "还在工作" },
          { id: "semi", label: "半退休·偶尔工作" },
          { id: "retired", label: "已退休" },
          { id: "home", label: "主要照顾家庭" }
        ]
      },
      {
        id: "q4",
        field: "Q4",
        kicker: "下面是最近的生活感受",
        title: "最近，您会觉得孤单吗？",
        type: "single",
        scored: true,
        options: often.slice()
      },
      {
        id: "q5",
        field: "Q5",
        title: "您会觉得心里话不知道跟谁说吗？",
        type: "single",
        scored: true,
        options: often.slice()
      },
      {
        id: "q6",
        field: "Q6",
        title: "您会想很多事情，放不下来吗？",
        type: "single",
        scored: true,
        options: [
          { id: "often", label: "经常会", score: 2 },
          { id: "sometimes", label: "偶尔会", score: 1 },
          { id: "rarely", label: "基本没有", score: 0 }
        ]
      },
      {
        id: "q7",
        field: "Q7",
        title: "您会觉得心烦、委屈，或者心情低落吗？",
        type: "single",
        scored: true,
        options: [
          { id: "often", label: "经常有", score: 2 },
          { id: "sometimes", label: "偶尔有", score: 1 },
          { id: "rarely", label: "基本没有", score: 0 }
        ]
      },
      {
        id: "q8",
        field: "Q8",
        title: "遇到不开心的事，您能自己慢慢调节过来吗？",
        type: "single",
        scored: true,
        reverse: true,
        options: [
          { id: "ok", label: "基本可以", score: 0 },
          { id: "hard", label: "有时很难", score: 1 },
          { id: "often-hard", label: "经常很难", score: 2 }
        ]
      },
      {
        id: "q9",
        field: "Q9",
        title: "您会为家人的事情操心吗？",
        type: "single",
        scored: true,
        options: [
          { id: "often", label: "经常会", score: 2 },
          { id: "sometimes", label: "偶尔会", score: 1 },
          { id: "rarely", label: "基本没有", score: 0 }
        ]
      },
      {
        id: "q10",
        field: "Q10",
        title: "就算身边有人，您也会觉得不太被理解吗？",
        type: "single",
        scored: true,
        options: often.slice()
      },
      {
        id: "q11",
        field: "Q11",
        title: "您和朋友、老同事还会经常联系、聊聊天吗？",
        type: "single",
        scored: true,
        options: [
          { id: "often", label: "经常联系", score: 0 },
          { id: "sometimes", label: "偶尔联系", score: 1 },
          { id: "rarely", label: "基本没有", score: 2 }
        ]
      },
      {
        id: "q12",
        field: "Q12",
        title: "您会觉得日子有些单调吗？",
        type: "single",
        scored: true,
        options: often.slice()
      },
      {
        id: "q13",
        field: "Q13",
        title: "您还想学一点新东西吗？",
        type: "single",
        scored: true,
        options: [
          { id: "much", label: "很想", score: 2 },
          { id: "some", label: "有一点", score: 1 },
          { id: "none", label: "暂时没有", score: 0 }
        ]
      },
      {
        id: "q14",
        field: "Q14",
        title: "退休，或者在家里的角色退后之后，您会不知道接下来做什么吗？",
        type: "single",
        scored: true,
        options: [
          { id: "often", label: "经常有这种感觉", score: 2 },
          { id: "sometimes", label: "偶尔会", score: 1 },
          { id: "rarely", label: "很少", score: 0 }
        ]
      },
      {
        id: "q15",
        field: "Q15",
        kicker: "最后一题",
        title: "如果接下来有一些轻松的安排，您最感兴趣的是？",
        help: "可以选 1 到 3 项。选「暂时都不需要」时，不用再选别的。",
        type: "multi",
        max: 3,
        exclusive: "none",
        options: [
          { id: "listen", label: "倾听聊天", lift: "companion" },
          { id: "mood", label: "调节情绪", lift: "emotion" },
          { id: "family", label: "家庭关系", lift: "family" },
          { id: "friends", label: "交朋友", lift: "social" },
          { id: "hobby", label: "兴趣活动", lift: "interest" },
          { id: "health", label: "健康养生", lift: "interest" },
          { id: "learn", label: "学新东西", lift: "meaning" },
          { id: "none", label: "暂时都不需要", lift: null }
        ]
      }
    ]
  };
});
