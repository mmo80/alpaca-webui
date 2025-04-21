import { type FC, useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { AutosizeTextarea } from '@/components/ui/autosize-textarea';
import { PaperclipIcon, ChevronsUpIcon, SquareIcon } from 'lucide-react';
import { FileUpload, type FileUploadRef } from '@/app/upload/_components/file-upload';
import type { FileInfo, TFilesUploadForm } from '@/app/upload/upload-types';
import { v7 as uuidv7 } from 'uuid';
import { FileBadge } from './file-badge';

interface ChatInputProps {
  onSendInput: (input: string) => Promise<void>;
  onCancelStream: () => void;
  files: FileInfo[];
  setFiles: (files: FileInfo[]) => void;
  chatInputPlaceholder: string;
  isStreamProcessing: boolean;
  isFetchLoading: boolean;
  isLlmModelActive: boolean;
}

export const ChatInput: FC<ChatInputProps> = ({
  onSendInput,
  onCancelStream,
  files,
  setFiles,
  chatInputPlaceholder,
  isStreamProcessing,
  isFetchLoading,
  isLlmModelActive,
}) => {
  const [chatInput, setChatInput] = useState<string>('');
  const [textareaPlaceholder, setTextareaPlaceholder] = useState<string>('');

  const fileUploadRef = useRef<FileUploadRef>(null);

  const [dragging, setDragging] = useState<boolean>(false);

  const maxFileSizeMb = 10;
  const allowedFileTypes: string[] = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ] as const;
  const fileTypeErrorMessage = 'File must of these types (pdf, jpg, jpeg, png, gif, webp)';

  useEffect(() => {
    setTextareaPlaceholder(chatInputPlaceholder);
  }, [chatInputPlaceholder]);

  const sendChat = async () => {
    const chatInputTrimmed = chatInput.trim();
    setChatInput(' ');
    await onSendInput(chatInputTrimmed);
  };

  const chatEnterPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreamProcessing && !isFetchLoading && isLlmModelActive) {
      await sendChat();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreamProcessing && !isFetchLoading && isLlmModelActive) {
      e.preventDefault();
    }
  };

  const onAttachFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    fileUploadRef.current?.trigger();
  };

  const onFileSubmit = async (formFileData: TFilesUploadForm) => {
    console.log('onFileSubmit');
  };

  const attachFiles = async (fileList: FileList) => {
    const valid = await fileUploadRef.current?.validate(fileList);
    if (valid) {
      const filesArray = [...fileList];

      const filePromises = filesArray.map(async (f) => {
        const dataUrl = await convertFileToBase64(f);

        return {
          id: uuidv7(),
          filename: f.name,
          sizeInBytes: f.size,
          type: f.type,
          dataUrl: dataUrl,
        };
      });

      const attachedFiles: FileInfo[] = await Promise.all(filePromises);

      const updatedFiles = [...files, ...attachedFiles];
      setFiles(updatedFiles);
    }
  };

  const handleFileChange = async (files: FileList) => {
    await attachFiles(files);
  };

  const onFilesDropped = async (files: FileList) => {
    await attachFiles(files);
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsDataURL(file);
    });
  };

  const onRemoveAttachment = (fileId: string) => {
    const newFiles = files.filter((f) => f.id !== fileId);
    setFiles(newFiles);
  };

  return (
    <FileUpload
      onSubmit={onFileSubmit}
      handleFileChange={handleFileChange}
      onFilesDropped={onFilesDropped}
      setDragging={setDragging}
      disableClickZone={true}
      disableEnterSpaceZone={true}
      ref={fileUploadRef}
      maxFileSizeMb={maxFileSizeMb}
      allowedFileTypes={allowedFileTypes}
      fileTypeErrorMessage={fileTypeErrorMessage}
    >
      {/* Dropzone :: START */}
      <div className="flex gap-2 px-3 py-2">
        {files.map((file) => (
          <FileBadge key={file.id} file={file} onRemoveAttachment={onRemoveAttachment} />
        ))}
      </div>
      <div className="px-3">
        <AutosizeTextarea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyUp={chatEnterPress}
          onKeyDown={handleKeyPress}
          placeholder={textareaPlaceholder}
          maxHeight={180}
          className={`appearance-none pr-20 outline-hidden ${dragging ? 'border-zinc-800 bg-zinc-900' : ''}`}
          disabled={!isLlmModelActive}
        />

        {isStreamProcessing ? (
          <Button
            onClick={onCancelStream}
            variant="secondary"
            size="icon"
            className="absolute right-5 bottom-5 cursor-pointer"
            disabled={isFetchLoading}
          >
            <SquareIcon />
          </Button>
        ) : (
          <Button
            onClick={sendChat}
            variant="secondary"
            size="icon"
            className="absolute right-5 bottom-5 cursor-pointer"
            disabled={isStreamProcessing || isFetchLoading || !isLlmModelActive}
          >
            <ChevronsUpIcon />
          </Button>
        )}

        <Button
          variant="secondary"
          size="icon"
          className="pointer absolute right-15 bottom-5 cursor-pointer"
          disabled={isStreamProcessing || isFetchLoading || !isLlmModelActive}
          onClick={onAttachFile}
        >
          <PaperclipIcon />
        </Button>
      </div>
      {/* Dropzone :: END */}
    </FileUpload>
  );
};
