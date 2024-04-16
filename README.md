# Alpaca WebUI

Alpaca WebUI, initially crafted for [Ollama](https://ollama.com/), is a chat conversation interface featuring markup formatting and code syntax highlighting. It supports a variety of LLM endpoints through the OpenAI Chat Completions API and now includes a RAG (Retrieval-Augmented Generation) feature, allowing users to engage in conversations with information pulled from uploaded documents.

The app lets you easily try out different AI models from various services to find answers using your documents. It simplifies mixing and matching these models to see which one works best for your needs.

<a href="https://github.com/mmo80/alpaca-webui/actions/workflows/integrations.yml"><img src="https://img.shields.io/github/actions/workflow/status/mmo80/alpaca-webui/integrations.yml" /></a> <img src="https://img.shields.io/github/commit-activity/t/mmo80/alpaca-webui" /> <img src="https://img.shields.io/github/languages/top/mmo80/alpaca-webui" /> ![Docker Pulls](https://img.shields.io/docker/pulls/forloopse/alpaca-webui) <img src="https://img.shields.io/github/repo-size/mmo80/alpaca-webui" />
<br>

**Has**

- [x] Support for your local or remote [Ollama](https://ollama.com/) server
- [x] Compatible with OpenAI Chat Completions API
- [x] Workes with [OpenAI](https://chat.openai.com/), [Together.ai](https://www.together.ai/products#inference), [Mistral.ai](https://mistral.ai/), [Groq.com](https://wow.groq.com/) and [Ollama](https://ollama.com/)
- [x] Upload document (pdf, txt, docx) for RAG usage
- [x] Modify System Prompt for Chat and RAG
- [x] Markup Formatting
- [x] Code Syntax Highlighting
- [x] List available models for services supporting OpenAI API model endpoint (and listing of Ollama models)
- [x] Mobile-Friendly and Desktop-Friendly Layout

**Pending Implementation**

- Modify Parameters (like temperature, mirostat ...)
- Attach ImageFile
- Chat History

**Env**
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

#### Run the development server:

1. `git clone https://github.com/mmo80/alpaca-webui.git`
2. Setup and install your [Weaviate database](https://weaviate.io/developers/weaviate/installation) or just use the docker-compose weaviate file in the repository with the following command `docker-compose -f docker-compose.weaviate.yml up --build --detach`.
3. Check the environment variables in `.env.development`
4. Then just run `npm install` followed by `npm run dev` :sunglasses:

Open [http://localhost:3000](http://localhost:3000) with your browser to start using the app.

#### Docker Compose

This command sets up two containers: one for the app and another for the [Weaviate](https://weaviate.io/) vector database. (Please note that there is no data persistence on a mapped volume in this configuration.)

```shell
docker compose up --detach
```

Then Open [http://localhost:3033](http://localhost:3033) with your browser to start using the app.

The official [Alpaca WebUI Docker Image](https://hub.docker.com/r/forloopse/alpaca-webui) `forloopse/alpaca-webui` is available on Docker Hub.

## YouTube Overview

[![Alpaca WebUI on YouTube](http://img.youtube.com/vi/utacKYiHtwI/0.jpg)](https://www.youtube.com/watch?v=utacKYiHtwI 'Alpaca WebUI Demo, AI, LLM, RAG, Web UI for Ollama, OpenAI, Together.xyz, Mistral.ai, Groq.com')
