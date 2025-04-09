import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import hljs from 'highlight.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const delayHighlighter = () => {
  setTimeout(() => {
    setHighlighter();
  }, 100);
};

const setHighlighter = () => {
  const elements = document.querySelectorAll(`code[class^="language-"]`);
  const filteredElements = Array.from(elements).filter(
    (element) => !element.hasAttribute('data-highlighted')
  ) as HTMLElement[];
  if (filteredElements) {
    filteredElements.forEach((codeBlock) => {
      if (codeBlock.dataset.highlighted !== 'yes') {
        codeBlock.parentElement?.classList.remove('p-3');
        hljs.highlightElement(codeBlock);
      }
    });
  }
};

export const removeJunkStreamData = (data: string) => {
  data = data.replace(': OPENROUTER PROCESSING', ''); //
  data = data.replace('data: {"type": "ping"}', ''); // Anthropic adds this in stream for some reason
  data = data.replace('data: [DONE]', '');
  return data
    .replace(/^data:\s*/, '')
    .trimEnd()
    .trimStart();
};

export const isNullOrWhitespace = (input: string | null | undefined): boolean => {
  return !input?.trim();
};

export const hasNonWhitespaceChars = (str: string | null | undefined): boolean => {
  return !str ? false : /\S/.test(str);
};

export const isEmpty = (str: string | null | undefined): boolean => {
  return !str || str.trim() === '';
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
