import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import hljs from 'highlight.js';

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

export const removeDataString = (data: string) => {
  data = data.replace('data: [DONE]', '');
  return data
    .replace(/^data:\s*/, '')
    .trimEnd()
    .trimStart();
};

export const isNullOrWhitespace = (input: string | null | undefined): boolean => {
  return !input?.trim();
};

// url: https://stackoverflow.com/a/18650828
export const formatBytes = (a: number, b: number = 2) => {
  if (!+a) return '0 Bytes';
  const c = 0 > b ? 0 : b,
    d = Math.floor(Math.log(a) / Math.log(1024));
  return `${parseFloat((a / Math.pow(1024, d)).toFixed(c))} ${['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][d]}`;
};

export const removeClassesByWord = (classes: string, wordToRemove: string): string => {
  const escapedWord = wordToRemove.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const wordRegex = new RegExp(`\\b[\\w-]*${escapedWord}[\\w-]*\\b`, 'g');
  return classes
    .replace(wordRegex, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export const removeHttp = (url: string): string => {
  return url.replace(/^(https?:\/\/)/, '');
};
