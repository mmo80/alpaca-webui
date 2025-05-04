import { type FC, useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { AutosizeTextarea, type AutosizeTextAreaRef } from '@/components/ui/autosize-textarea';
import { PaperclipIcon, ChevronsUpIcon, SquareIcon, FileTextIcon, XIcon, ListRestartIcon, ImageIcon } from 'lucide-react';
import { FileUpload, type FileUploadRef } from '@/app/upload/_components/file-upload';
import type { FileInfo, TFilesUploadForm } from '@/app/upload/upload-types';
import { v7 as uuidv7 } from 'uuid';
import { FileBadge } from './file-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from './ui/badge';
import { useDocumentsQuery } from '@/trpc/queries';
import { formatBytes } from '@/lib/utils';

interface ChatInputProps {
  onSendInput: (input: string) => Promise<void>;
  onCancelStream: () => void;
  onReset: () => void;
  onContextChange?: (contextId: string | undefined) => void;
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
  onReset,
  onContextChange,
  files,
  setFiles,
  chatInputPlaceholder,
  isStreamProcessing,
  isFetchLoading,
  isLlmModelActive,
}) => {
  const [chatInput, setChatInput] = useState<string>('');
  const [textareaPlaceholder, setTextareaPlaceholder] = useState<string>('');
  const [dragging, setDragging] = useState<boolean>(false);
  const [activeContextId, setActiveContextId] = useState<string | undefined>(undefined);

  const { data: documents, isLoading: isDocumentsLoading } = useDocumentsQuery();

  const fileUploadRef = useRef<FileUploadRef>(null);
  const textareaRef = useRef<AutosizeTextAreaRef>(null);

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

  const handleKeyUp = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreamProcessing && !isFetchLoading && isLlmModelActive) {
      await sendChat();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreamProcessing && !isFetchLoading && isLlmModelActive) {
      e.preventDefault();
    }
  };

  const onAttachFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    fileUploadRef.current?.trigger();
  };

  const onFileSubmit = async (formFileData: TFilesUploadForm) => {};

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

  const onContextMenuItemSelect = (event: Event) => {
    const target = event.target as HTMLDivElement;
    const dataId = target.getAttribute('data-id');

    if (dataId) {
      setActiveContextId(dataId);
      onContextChange?.(dataId);
    }
  };

  const removeContext = () => {
    setActiveContextId(undefined);
    onContextChange?.(undefined);
  };

  const contextIndicator = (contextId: string): string => {
    if (contextId === 'image') {
      return 'Generate Image';
    }

    const docId = parseFloat(contextId);
    if (!isNaN(docId) && docId > 0) {
      const filename = documents.filter((doc) => doc.id === docId).map((doc) => doc.filename);
      return `Question: ${filename[0]}`;
    }

    return contextId;
  };

  const renderContextIcon = (contextId: string) => {
    if (contextId === 'image') {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileTextIcon className="h-4 w-4" />;
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
        {activeContextId && (
          <Badge variant="secondary" className="group relative flex gap-2 rounded-lg p-1 px-3">
            {renderContextIcon(activeContextId)}
            <span>{contextIndicator(activeContextId)}</span>
            <XIcon
              onClick={(e) => {
                e.preventDefault();
                removeContext();
              }}
              className="invisible absolute right-0.5 cursor-pointer rounded-lg p-1 text-white group-hover:visible group-hover:bg-stone-700 hover:bg-stone-900"
            />
          </Badge>
        )}
      </div>
      <div className="px-3">
        <AutosizeTextarea
          ref={textareaRef}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyUp={handleKeyUp}
          onKeyDown={handleKeyDown}
          placeholder={textareaPlaceholder}
          maxHeight={180}
          className={`appearance-none pr-20 outline-hidden ${dragging ? 'border-zinc-800 bg-zinc-900' : ''}`}
          disabled={!isLlmModelActive}
        />

        <div className="flex w-full justify-between gap-1.5 pt-1.5">
          <div className="flex gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size={'sm'}
                  className="cursor-pointer p-2"
                  disabled={isStreamProcessing || isFetchLoading || !isLlmModelActive}
                >
                  <FileTextIcon className="h-4 w-4" /> <span>More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start">
                <DropdownMenuItem
                  className="flex flex-col items-start gap-0"
                  data-id="image"
                  onSelect={onContextMenuItemSelect}
                >
                  <span>Image</span>
                  <span className="text-xs font-light">Generate an Image</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <div className="gap flex flex-col items-start pe-5">
                      <span>Documents</span>
                      <span className="text-xs font-light">Question uploaded document (RAG)</span>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {documents.map((doc, index) =>
                        doc.isEmbedded ? (
                          <DropdownMenuItem key={doc.id} data-id={doc.id} onSelect={onContextMenuItemSelect}>
                            <div className="flex flex-col items-start gap-0">
                              <span>{doc.filename}</span>
                              <span className="text-xs font-light">{formatBytes(doc.fileSize ?? 0)}</span>
                            </div>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem key={doc.id}>
                            <div className="flex flex-col items-start gap-0 text-stone-500">
                              <span>{doc.filename}</span>
                              <span className="text-xs font-light">Embed document first</span>
                            </div>
                          </DropdownMenuItem>
                        )
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="secondary"
              size="sm"
              className="cursor-pointer p-2"
              disabled={isStreamProcessing || isFetchLoading || !isLlmModelActive}
              onClick={onReset}
            >
              <ListRestartIcon className="h-4 w-4" />
              Reset Chat
            </Button>
          </div>

          <div className="flex gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              className="cursor-pointer p-2"
              disabled={isStreamProcessing || isFetchLoading || !isLlmModelActive}
              onClick={onAttachFile}
            >
              <PaperclipIcon className="h-4 w-4" />
            </Button>

            {isStreamProcessing ? (
              <Button
                onClick={onCancelStream}
                variant="secondary"
                size="sm"
                className="cursor-pointer p-2"
                disabled={isFetchLoading}
              >
                <SquareIcon />
              </Button>
            ) : (
              <Button
                onClick={sendChat}
                variant="secondary"
                size="sm"
                className="cursor-pointer p-2"
                disabled={isStreamProcessing || isFetchLoading || !isLlmModelActive}
              >
                <ChevronsUpIcon />
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Dropzone :: END */}
    </FileUpload>
  );
};
