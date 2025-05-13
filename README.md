# Alpaca WebUI

Alpaca WebUI is a chat conversation interface for working with LLMs, originally built for Ollama and now supporting a wide range of AI providers. It features markup formatting, code syntax highlighting, and lets you use models from providers like OpenAI, Anthropic, Google, Deepseek, OpenRouter, Mistral.ai, Together.ai, Groq.com, and your local or remote Ollama server.

You can upload documents (PDF, TXT, DOCX) for Retrieval-Augmented Generation (RAG), and also attach images or PDFs for LLMs with vision support. The app keeps track of your chat history with automatic title generation, and allows you to modify the system prompt for chat, RAG, and title generation. It lists available models from each provider so you can easily try out different models and see which works best for your needs.

Alpaca WebUI works well on both mobile and desktop devices. You can also generate images using OpenAI’s gpt-image-1 (new), dall-e-3, and dall-e-2 models by setting the image context from the "More" menu.

For added security, API keys used in the app are encrypted and stored in the database. You can set your own secret key for encryption in the environment file.

<a href="https://github.com/mmo80/alpaca-webui/actions/workflows/integrations.yml"><img src="https://img.shields.io/github/actions/workflow/status/mmo80/alpaca-webui/integrations.yml" /></a> <img src="https://img.shields.io/github/commit-activity/t/mmo80/alpaca-webui" /> <img src="https://img.shields.io/github/languages/top/mmo80/alpaca-webui" /> ![Docker Pulls](https://img.shields.io/docker/pulls/forloopse/alpaca-webui) <img src="https://img.shields.io/github/repo-size/mmo80/alpaca-webui" />
<br>

**Has**

- [x] Support for your local or remote [Ollama](https://ollama.com/) server
- [x] Providers supported: 
  - [OpenAI](https://chat.openai.com/)
  - [Anthropic](https://anthropic.com)
  - [Google](https://ai.google.dev/)
  - [Deepseek](https://deepseek.com/en)
  - [OpenRouter](https://openrouter.ai)
  - [Mistral.ai](https://mistral.ai/)
  - [Together.ai](https://www.together.ai/products#inference)
  - [Groq.com](https://wow.groq.com/)
  - [Ollama](https://ollama.com/)
- [x] Upload document (pdf, txt, docx) for RAG usage
- [x] Attach images and PDF files to the chat for LLMs that support it. (*which is primarily used for vision interpretation by the LLM*)
- [x] Chat History (with auto title generation)
- [x] Modify System Prompt for Chat, RAG and title generation
- [x] Markup Formatting
- [x] Code Syntax Highlighting
- [x] List available models for supported api providers
- [x] Mobile-Friendly and Desktop-Friendly Layout
- [x] Generate images with OpenAI **gpt-image-1**(**new**), **dall-e-3** and **dall-e-2** models _(choose model and click on More-menu to set context for image generation)_


**Pending Implementation**
- MCP Support
- Create chat groups with set context/system prompts
- Web Search
- Modify Parameters (like temperature, mirostat ...)

**Env**

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

#### Run the development server:

1. `git clone https://github.com/mmo80/alpaca-webui.git`
2. Setup and install your [Weaviate database](https://weaviate.io/developers/weaviate/installation) or just use the docker-compose weaviate file in the repository with the following command `docker-compose -f docker-compose.weaviate.yaml up --build --detach`.
3. Check the environment variables in `.env.development`
4. Then just run `npm install` followed by `npm run dev` :sunglasses:

Open [http://localhost:3000](http://localhost:3000) with your browser to start using the app.

#### Docker Compose

This command sets up two containers: one for the app and another for the [Weaviate](https://weaviate.io/) vector database.

```shell
docker compose up --detach
```

Then Open [http://localhost:3033](http://localhost:3033) with your browser to start using the app.

The official [Alpaca WebUI Docker Image](https://hub.docker.com/r/forloopse/alpaca-webui) `forloopse/alpaca-webui` is available on Docker Hub.

## YouTube Overview
### v0.7
(Coming soon...)

### v0.5
[![Alpaca WebUI on YouTube](http://img.youtube.com/vi/utacKYiHtwI/0.jpg)](https://www.youtube.com/watch?v=utacKYiHtwI 'Alpaca WebUI Demo, AI, LLM, RAG, Web UI for Ollama, OpenAI, Together.xyz, Mistral.ai, Groq.com')
