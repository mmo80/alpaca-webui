# Alpaca WebUI
Alpaca WebUI, initially crafted for [Ollama](https://ollama.com/), is a chat conversation interface equipped with markup formatting and code syntax highlighting. It now supports a variety of LLM endpoints through the OpenAI Chat Completions API.

<a href="https://github.com/mmo80/alpaca-webui/actions/workflows/integrations.yml"><img src="https://img.shields.io/github/actions/workflow/status/mmo80/alpaca-webui/integrations.yml" /></a> <img src="https://img.shields.io/github/commit-activity/t/mmo80/alpaca-webui" /> <img src="https://img.shields.io/github/languages/top/mmo80/alpaca-webui" /> <img src="https://img.shields.io/github/repo-size/mmo80/alpaca-webui" />
<br>

**Has**
- [x] Support for your local or remote [Ollama](https://ollama.com/) server
- [x] Compatible with OpenAI Chat Completions API
- [x] Tested with [OpenAI](https://chat.openai.com/), [Together.ai](https://www.together.ai/products#inference) and [Mistral.ai](https://mistral.ai/)
- [x] Markup Formatting
- [x] Code Highlighting
- [x] List available models for services supporting OpenAI API model endpoint
- [x] Responsive Layout

![Alt Text](https://media.giphy.com/media/SYkpUkv9ycAD912GIV/giphy.gif)


**Pending Implementation**
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
