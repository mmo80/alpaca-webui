export const Constants = {
  api: {
    uploadRouteUrl: '/api/upload',
  },
  systemPromptVariables: {
    userQuestion: '{{UserQuestion}}',
    documentContent: '{{DocumentContent}}',
    chatHistoryInput: '{{ChatHistoryGoesHere}}',
  },
  settingKeys: {
    providers: 'providers',
    systemPrompt: 'systemPrompt',
    systemPromptForRag: 'systemPromptForRag',
    systemPromptForRagSlim: 'systemPromptForRagSlim',
    systemPromptForChatTitle: 'systemPromptForChatTitle',
  },
};

export const defaultValues = {
  systemPrompt: `Hello i am a AI assistant, how can i help you?`,
  systemPromptForRag: `Instructions: Carefully read and synthesize the information presented in the document section below to answer the user's question. Your response must be derived exclusively from the content found between the "### Begin Document ###" and "### End Document ###" markers. If the information within these markers does not contain sufficient details to answer the question, you must clearly state that an answer cannot be provided based on the available document/data. Aim for a concise, accurate, and relevant response to the user's query.

User's Question:
${Constants.systemPromptVariables.userQuestion}

Relevant Document Information:
### Begin Document
${Constants.systemPromptVariables.documentContent}
### End Document

Answer:`,
  systemPromptForRagSlim: `User's Question:
${Constants.systemPromptVariables.userQuestion}

Relevant Document Information:
### Begin Document ###
${Constants.systemPromptVariables.documentContent}
### End Document ###

Answer:`,
  systemPromptForChatTitle: `### Task:
Generate a concise, 3-8 word title summarizing the chat history.
### Guidelines:
- The title should clearly represent the main theme or subject of the conversation.
- Avoid quotation marks or special formatting.
- Write the title in the chat's primary language; default to English if multilingual.
- Prioritize accuracy over excessive creativity; keep it clear and simple.
### Output:
JSON format: { "title": "Chat history concise title goes here" }
### Examples:
- { "title": "Understanding Current Stock Market Trends" },
- { "title": "Most delicious Chewy Chocolate Chip Cookies Recipe Ever" },
- { "title": "Digital Transformation of Music through Streaming" },
- { "title": "Strategies for Staying Productive While Working Remotely" },
- { "title": "Impact of Machine Learning in Modern Healthcare Settings" },
- { "title": "Innovative Approaches to Video Game Development" }
### Chat History:
<chat_history>
${Constants.systemPromptVariables.chatHistoryInput}
</chat_history>`,
};
