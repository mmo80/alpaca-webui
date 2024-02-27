# Alpaca WebUI
Alpaca WebUI, initially crafted for [Ollama](https://ollama.com/), is a chat conversation interface equipped with markup formatting and code syntax highlighting. It has evolved to support a broader range of APIs, including the OpenAI Chat Completions API, making it compatible with OpenAI, Together.ai, and other services that utilize the OpenAI Chat Completions API.

<a href="https://github.com/mmo80/alpaca-webui/actions/workflows/integrations.yml"><img src="https://img.shields.io/github/actions/workflow/status/mmo80/alpaca-webui/integrations.yml" /></a> <img src="https://img.shields.io/github/commit-activity/t/mmo80/alpaca-webui" /> <img src="https://img.shields.io/github/languages/top/mmo80/alpaca-webui" /> <img src="https://img.shields.io/github/repo-size/mmo80/alpaca-webui" />
<br>

**Has**
- [x] Support for OpenAI Chat Completions API
- [x] Markup Formatting
- [x] Code Highlighting
- [x] Responsive Layout

**Not implemented**
- Modify System Prompt
- Modify Parameters (like temperature, mirostat ...)
- Attach ImageFile
- Attach PdfFile
- Chat History

**Env**
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
