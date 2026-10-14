/**
 * 飞书接入配置
 * --------------------
 * 静态网页里的配置任何人都能看到。多维表格自动化地址优先；不要把高权限密钥放进来。
 *
 * 方式一（当前准备好的）：多维表格自动化「接收到 webhook 时」
 *   把自动化地址填进 FEISHU_WEBHOOK_URL
 *   FEISHU_WEBHOOK_MODE 保持 "bitable"
 *   请求体为 { "fields": { "用户ID", "提交时间", "年龄段", "居住", "生活状态",
 *     "Q4"…"Q15", "六维", "核心需求TOP3", "用户类型", "建议跟进", "风险提示", "需求总结" } }
 *   表格里先建好这些同名文本字段。
 *
 * 方式二：飞书群自定义机器人
 *   FEISHU_WEBHOOK_URL = "https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx"
 *   FEISHU_WEBHOOK_MODE = "bot"
 *   调查结果会以一条文本消息发到该群。
 *
 * 方式三：开放平台多维表格 API（浏览器可能被跨域拦住，且密钥会公开）
 *   留空 FEISHU_WEBHOOK_URL，填 FEISHU_BITABLE 四项。
 *   应用需要「查看、编辑和管理多维表格」权限，并把应用加为表格协作者。
 *
 * 以上都留空：不请求飞书。调查仍可做完，结果只留在本机，页面不报错。
 *
 * 改完本文件后，把 index.html 里 css/js 的 ?v= 数字加一，避免旧缓存。
 */
window.SURVEY_CONFIG = {
  FEISHU_WEBHOOK_URL: "https://hvtg4neiebi.feishuapp.com/app/app_17g16djq8cb/__runtime__/api/v1/automation/survey-ingest/runtime/webhook/3bf3b4a96b5d4ae0a27a9bebd9fbf172",
  FEISHU_WEBHOOK_MODE: "bitable",
  FEISHU_BITABLE: {
    appId: "",
    appSecret: "",
    appToken: "",
    tableId: ""
  }
};
