# MultiAIAns

MultiAIAns 是一个轻量的多模型问答工具。

它的目标很简单：  
同一个问题，同时问多个 AI 模型，把回答放在一起看，最大程度避免单个模型的幻觉和片面性，更加全面的看待问题。
需要的话，再让其中一个模型把所有回答整理成一份更完整、更稳妥的版本。

---

## 为什么做这个

平时用 AI 的时候，经常会遇到几种情况：

- 一个模型回答得快，但细节不够。
- 一个模型逻辑不错，但容易保守。
- 一个模型想法多，但偶尔会飘。
- 同一个模型多问几次，答案也会有差异。

所以 MultiAIAns 想做的是：

1. 同一个问题，可以同时问多个模型。
2. 每个模型可以重复问几次。
3. 所有回答直接并排展示，不替用户藏起来。
4. 可选让一个模型总结所有回答，给出一个综合版本。
5. 后面再支持模型之间互相审阅、补充、修正。

简单说，它不是想再做一个普通 ChatBot WebUI，而是想做一个“多模型回答对照和整理工具”。

---

## 当前 MVP 范围

第一版只做最小可用版本，功能尽量收着点。

### 已规划的 MVP 功能

- 配置 OpenAI-compatible API Provider
  - Provider 名称
  - Base URL
  - API Key
  - 模型列表
- 配置保存在浏览器本地
- Chat 页面输入问题
- 选择一个 Provider 和一个模型
- 调用后端 API 请求模型
- 展示模型返回内容
- 基础错误提示
- 简单可读的页面布局

### 第一版暂时不做

- 用户登录
- 数据库
- 账号系统
- 付费系统
- 多用户
- Streaming 流式输出
- 文件上传
- RAG
- Agent 工具调用
- 插件系统
- 复杂工作流编辑器
- etc.

---

## 技术栈

暂定：

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- OpenAI npm SDK
- Zod
- localStorage

后端先用 Next.js Route Handler。  
API Key 第一版只在用户浏览器本地保存，请求时临时传给后端使用，后端不保存。

---

## OpenAI-compatible API

项目使用最通用、标准的 OpenAI-compatible API（POST /v1/chat/completions），支持几乎所有模型提供商。