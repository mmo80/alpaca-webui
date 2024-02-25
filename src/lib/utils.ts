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
  const filteredElements = Array.from(elements).filter((element) => !element.hasAttribute('data-highlighted')) as HTMLElement[];
  if (filteredElements) {
    filteredElements.forEach((codeBlock) => {
      if (codeBlock.dataset.highlighted !== 'yes') {
        hljs.highlightElement(codeBlock);
      }
    });
  }
};

export const parseJsonStream = (json: string): any[] => {
  try {
    if (json.includes('}\n')) {
      // Handle cases where stream returns two or more json object strings
      const jsonStrings = json.split('}\n');
      return jsonStrings.map((str) => {
        if (str.length > 0) {
          return JSON.parse(`${str}}`);
        } else {
          return null;
        }
      });
    }
    return [JSON.parse(json)];
  } catch (error) {
    console.error(`${error}. Failed to parse JSON: ${json}`);
    return [];
  }
};
