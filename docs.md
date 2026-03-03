# MultiAIAns 使用教学

MultiAIAns 是一个轻量的「多模型对照」问答工具：同一个问题同时问多个 AI，把回答并排放在一起看，避免单个模型的片面和幻觉。

本页内容由项目根目录的 `docs.md` 渲染而来，你可以直接改这个文件来更新教学。

---

## 快速开始

1. 打开 **Settings**，添加一个 Provider。
2. 回到 **Chat**，选一个或多个模型，输入问题，点发送。
3. 想看历史请求结果，去 **Log** 页面。

---

## 配置 Provider

在 Settings 里填四个字段：

| 字段 | 说明 | 示例 |
| --- | --- | --- |
| Name | 随便起的名字 | `DeepSeek` |
| Base URL | 兼容 OpenAI 的接口地址，**填到 `/v1`** | `https://api.deepseek.com/v1` |
| API Key | 对应平台申请的密钥 | `sk-...` |
| Models | 逗号分隔的模型名 | `deepseek-chat, deepseek-reasoner` |

> API Key 只存在你自己的浏览器 localStorage 里，请求时临时传给后端，后端**不保存**。

常见平台参考：

| 平台 | Base URL | 模型示例 |
| --- | --- | --- |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| 本地 Ollama | `http://localhost:11434/v1` | `llama3.2` |

---

## 多模型并排提问

Chat 页面可以加多行模型，每行选一个 `Provider / model` 组合：

- 点 **「+ 添加模型」** 增加一行，点行尾的 **「−」** 删除。
- 发送后，每个模型一张卡片，**同时**流式输出。
- 桌面够宽时卡片并排，窗口变窄会自动堆叠成单列。

同一个模型也可以加多行，相当于让它对同一个问题答多次，方便对比稳定性。

---

## 流式输出与 Markdown

- 回答是**流式**的，模型一边生成你一边能看到。
- 回答内容按 **Markdown** 渲染，支持标题、列表、表格、代码块等。

示例代码块：

```ts
const answer = await ask("你好");
console.log(answer);
```

---

## 小技巧

- **回车发送**：问题框里按 Enter 直接发送，Shift+Enter 换行。
- **深色模式**：右上角按钮切换浅色 / 深色，选择会记在本地浏览器。

---

## 常见问题

- **一直转圈 / 报 "Connection error."**：多半是 Base URL 或 API Key 填错，或者本机 **LuLu 防火墙**拦了外联——先看看右上角有没有 LuLu 弹窗，点允许。
- **提示「请先去 Settings 添加」**：还没配 Provider，或者换了浏览器（localStorage 按浏览器隔离）。
- **回答是空的**：模型名可能填错了，对照平台文档改 Models。
- **某一张卡片报错、其他正常**：那是对应模型/Key 的问题，各卡片互不影响，单独看那张即可。
