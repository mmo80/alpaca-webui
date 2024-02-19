export type ChatMessage = {
    role: ChatRole;
    content: string;
}

export enum ChatRole {
    USER = 'user',
    SYSTEM = 'system',
    ASSISTANT = 'assistant'
}