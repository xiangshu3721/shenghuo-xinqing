/**
 * 飞书接入配置
 * --------------------
 * 静态网页里的配置任何人都能看到。请优先用「群自定义机器人 Webhook」。
 * 不要把拥有高权限的企业应用密钥放进这里。
 *
 * 方式一（推荐）：飞书群 → 设置 → 群机器人 → 自定义机器人 → 复制 Webhook
 *   FEISHU_WEBHOOK_URL = "https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx"
 *   FEISHU_WEBHOOK_MODE = "bot"
 *   调查结果会以一条文本消息发到该群。
 *
 * 方式二：多维表格自动化「接收到 webhook 时」
 *   把自动化提供的地址填进 FEISHU_WEBHOOK_URL
 *   FEISHU_WEBHOOK_MODE = "bitable"
 *   请求体为 { "fields": { "用户ID": "...", "提交时间": "...", ... } }
 *   请在多维表格里先建好同名的文本字段。
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
  FEISHU_WEBHOOK_URL: "",
  FEISHU_WEBHOOK_MODE: "bot",
  FEISHU_BITABLE: {
    appId: "",
    appSecret: "",
    appToken: "",
    tableId: ""
  }
};
