# MultiAIAns 使用教学

MultiAIAns 是一个轻量的「多模型对照」问答工具：同一个问题同时问多个 AI，把回答并排放在一起看，避免单个模型的片面和幻觉。

---

## 快速开始

1. 打开 **Settings**，添加一个 Provider。
2. 回到 **Chat**，选一个或多个模型，输入问题，点发送。
3. 想回看以前的问答，去 **History** 页面，点开任意一条能看到当时的完整回答和总结。

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

### 总结所有回答

多个模型答完后，发送键旁会出现「总结所有回答」按钮（没有回答时不显示）。点它会用你在 **Settings → 总结设置** 里选定的模型，把所有回答汇总成一份更完整、去重的版本，并指出共识与分歧，结果显示在最下方的「总结」卡片里。

> 用之前记得先去 Settings 选一个「总结用模型」。

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

## 演示模式（/demo）

想直接给别人体验、不让对方填 Key？用演示模式：访问 `/demo` 即可，模型来自站点预置配置，访客**不用配 Provider**。

- 模型、总结用模型等设置在演示模式下**固定不可改**（界面置灰），顶部会提示「Demo 模式下设置固定，若需灵活更改请自行部署」。
- 真实 API Key **只在服务端**，存在环境变量里，**不会下发到浏览器**；演示模式的请求只带模型 id，由后端解析 Key。
- 演示模式的问答**不写入 History**（临时演示，不污染访客本地记录）。

### 站长怎么配

1. 编辑仓库根目录的 `demo.config.json`，写好每个 Provider 的 `name` / `baseUrl` / `models`，以及 `apiKeyEnv`（**环境变量名**，不是真实 Key），再选一个 `summary` 总结用模型。
2. 把真实 Key 配到环境变量：本地放 `.env.local`（如 `MAA_APIKEY_01=sk-...`），线上（Vercel）在项目的 Environment Variables 里加同名变量。
3. `demo.config.json` 里只有环境变量名、没有真实 Key，可以安全提交进仓库。

---

## 常见问题

- **一直转圈 / 报 "Connection error."**：多半是 Base URL 或 API Key 填错，或者本机 **LuLu 防火墙**拦了外联——先看看右上角有没有 LuLu 弹窗，点允许。
- **提示「请先去 Settings 添加」**：还没配 Provider，或者换了浏览器（localStorage 按浏览器隔离）。
- **回答是空的**：模型名可能填错了，对照平台文档改 Models。
- **某一张卡片报错、其他正常**：那是对应模型/Key 的问题，各卡片互不影响，单独看那张即可。
