import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import hljs from 'highlight.js';
import { ChatCompletionResponse } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const delayHighlighter = () => {
  setTimeout(() => {
    setHighlighter();
  }, 300);
};

const setHighlighter = () => {
  const elements = document.querySelectorAll(`code[class^="language-"]`);
  const filteredElements = Array.from(elements).filter(
    (element) => !element.hasAttribute('data-highlighted')
  ) as HTMLElement[];
  if (filteredElements) {
    filteredElements.forEach((codeBlock) => {
      if (codeBlock.dataset.highlighted !== 'yes') {
        hljs.highlightElement(codeBlock);
      }
    });
  }
};

const removeDataString = (data: string) => {
  data = data.replace('data: [DONE]', '');
  return data
    .replace(/^data:\s*/, '')
    .trimEnd()
    .trimStart();
};

function containsTwoOrMoreDataBlocks(str: string): boolean {
  const matches = str.match(/data:\s*{/g) ?? [];
  return matches.length >= 2;
}

function isNullOrWhitespace(input: string | null | undefined): boolean {
  return !input?.trim();
}

export const parseJsonStream = (json: string): ChatCompletionResponse[] => {
  try {
    if (isNullOrWhitespace(removeDataString(json))) {
      return [];
    }
    if (containsTwoOrMoreDataBlocks(json)) {
      const jsonStrings = json.split('data: {');
      return jsonStrings.map((str) => {
        if (str.length > 0) {
          return JSON.parse(removeDataString(`{${str}`));
        } else {
          return null;
        }
      });
    }
    return [JSON.parse(removeDataString(json)) as ChatCompletionResponse];
  } catch (error) {
    console.error(`${error}. Failed to parse JSON: ${removeDataString(json)}`);
    return [];
  }
};

// url: https://stackoverflow.com/a/18650828
export const formatBytes = (a: number, b: number = 2) => {
  if (!+a) return '0 Bytes';
  const c = 0 > b ? 0 : b,
    d = Math.floor(Math.log(a) / Math.log(1024));
  return `${parseFloat((a / Math.pow(1024, d)).toFixed(c))} ${
    ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][d]
  }`;
};
