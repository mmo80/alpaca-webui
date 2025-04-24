import fs, { readFileSync } from 'fs';
import mammoth from 'mammoth';
import path from 'path';

// @ts-ignore
import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
import type { TextContent, TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

export class DocumentReader {
  private readonly filePath: string;
  private readonly fileExtension: string;

  constructor(filePath: string) {
    if (!filePath) {
      throw new Error('File path is required.');
    }
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    this.filePath = filePath;
    this.fileExtension = path.extname(filePath);
  }

  private readonly getTextFileContent = (path: string): string => {
    return readFileSync(path, 'utf-8');
  };

  private readonly getPdfFileContent = async (path: string): Promise<string> => {
    // @ts-ignore
    await import('pdfjs-dist/build/pdf.worker.min.mjs');

    const filePath = path;

    const doc = await pdfjs.getDocument(filePath).promise;
    const numPages = doc.numPages;
    const fileContent: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const textContent: TextContent = await page.getTextContent();

      textContent.items.forEach((item: TextItem | TextMarkedContent) => {
        const textItem = item as TextItem;
        fileContent.push(`${textItem.str}${textItem.hasEOL ? '\n' : ''}`);
      });
    }

    return fileContent.join('');
  };

  private readonly getDocFileContent = async (path: string): Promise<string> => {
    const result = await mammoth.extractRawText({ path: path });
    return result.value.replace(/(\r\n|\n|\r)/gm, '');
  };

  async getFileContent(): Promise<string> {
    switch (this.fileExtension) {
      case '.txt':
        return this.getTextFileContent(this.filePath);
      case '.pdf':
        return await this.getPdfFileContent(this.filePath);
      case '.docx':
        return await this.getDocFileContent(this.filePath);
      default:
        throw new Error('Unsupported file format.');
    }
  }
}
