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
    { id: "often", label: "经常", score: 2 },
    { id: "sometimes", label: "偶尔", score: 1 },
    { id: "rarely", label: "基本没有", score: 0 }
  ];

  return {
    version: "0.2",
    title: "生活与心情小调查",
    subtitle: "按真实感受点就好。",
    duration: "大约 3 分钟",
    questions: [
      {
        id: "q1",
        field: "年龄段",
        title: "您今年多大？",
        type: "single",
        scored: false,
        options: [
          { id: "45", label: "45～54岁" },
          { id: "55", label: "55～64岁" },
          { id: "65", label: "65～74岁" },
          { id: "75", label: "75岁及以上" }
        ]
      },
      {
        id: "q2",
        field: "居住",
        title: "和谁一起住？",
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
        title: "现在的日子？",
        type: "single",
        scored: false,
        options: [
          { id: "work", label: "还在工作" },
          { id: "semi", label: "偶尔工作" },
          { id: "retired", label: "已退休" },
          { id: "home", label: "照顾家庭" }
        ]
      },
      {
        id: "q4",
        field: "Q4",
        title: "最近孤单吗？",
        type: "single",
        scored: true,
        options: often.slice()
      },
      {
        id: "q5",
        field: "Q5",
        title: "心里话没处说吗？",
        type: "single",
        scored: true,
        options: often.slice()
      },
      {
        id: "q6",
        field: "Q6",
        title: "事情放不下吗？",
        type: "single",
        scored: true,
        options: often.slice()
      },
      {
        id: "q7",
        field: "Q7",
        title: "会心烦、委屈吗？",
        type: "single",
        scored: true,
        options: often.slice()
      },
      {
        id: "q8",
        field: "Q8",
        title: "能自己缓过来吗？",
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
        title: "为家人操心吗？",
        type: "single",
        scored: true,
        options: often.slice()
      },
      {
        id: "q10",
        field: "Q10",
        title: "有人在，仍不被懂吗？",
        type: "single",
        scored: true,
        options: often.slice()
      },
      {
        id: "q11",
        field: "Q11",
        title: "还和朋友联系吗？",
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
        title: "日子单调吗？",
        type: "single",
        scored: true,
        options: often.slice()
      },
      {
        id: "q13",
        field: "Q13",
        title: "想学新东西吗？",
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
        title: "不知接下来做什么？",
        type: "single",
        scored: true,
        options: [
          { id: "often", label: "经常", score: 2 },
          { id: "sometimes", label: "偶尔", score: 1 },
          { id: "rarely", label: "很少", score: 0 }
        ]
      },
      {
        id: "q15",
        field: "Q15",
        kicker: "最后一题",
        title: "想参加什么？",
        help: "最多选 3 项",
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
