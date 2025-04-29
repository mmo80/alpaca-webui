import { type FC, useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { AutosizeTextarea, type AutosizeTextAreaRef } from '@/components/ui/autosize-textarea';
import { PaperclipIcon, ChevronsUpIcon, SquareIcon, FileTextIcon, XIcon } from 'lucide-react';
import { FileUpload, type FileUploadRef } from '@/app/upload/_components/file-upload';
import type { FileInfo, TFilesUploadForm } from '@/app/upload/upload-types';
import { v7 as uuidv7 } from 'uuid';
import { FileBadge } from './file-badge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Badge } from './ui/badge';

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
  const [dragging, setDragging] = useState<boolean>(false);
  const [indicatorPosition, setIndicatorPosition] = useState<{ left: number; top: number } | null>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState<boolean>(false);
  const [activeContextId, setActiveContextId] = useState<string | null>(null);

  const fileUploadRef = useRef<FileUploadRef>(null);
  const textareaRef = useRef<AutosizeTextAreaRef>(null);
  const hiddenTriggerRef = useRef<HTMLSpanElement>(null);

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
    if (e.key === 'Enter' && !e.shiftKey && !isStreamProcessing && !isFetchLoading && isLlmModelActive && !contextMenuOpen) {
      await sendChat();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreamProcessing && !isFetchLoading && isLlmModelActive) {
      e.preventDefault();
    }
    // SlashContextMenu
    if (e.key === '/') {
      const textarea = textareaRef.current?.textArea;
      if (textarea) {
        const caretPosition = getCaretCoordinates(textarea);
        if (caretPosition) {
          setIndicatorPosition(caretPosition);

          if (hiddenTriggerRef.current) {
            const contextMenuEvent = new MouseEvent('contextmenu', {
              bubbles: true,
              clientX: caretPosition.left,
              clientY: caretPosition.top,
            });
            hiddenTriggerRef.current.dispatchEvent(contextMenuEvent);
          }

          setChatInput((prev) => {
            return prev + '/ ';
          });

          e.preventDefault();

          setTimeout(() => {
            setIndicatorPosition(null);
          }, 5000);
        }
      }
    }
  };

  const getCaretCoordinates = (textarea: HTMLTextAreaElement) => {
    // Save current selection
    const selectionStart = textarea.selectionStart;

    // Create a mirror div
    const div = document.createElement('div');
    const style = div.style;
    const computed = window.getComputedStyle(textarea);

    // Copy essential styles
    style.width = computed.width;
    style.fontFamily = computed.fontFamily;
    style.fontSize = computed.fontSize;
    style.padding = computed.padding;
    style.border = computed.border;
    style.position = 'absolute';
    style.visibility = 'hidden';
    style.whiteSpace = 'pre-wrap';

    // Get text before caret
    const textBeforeCursor = textarea.value.substring(0, selectionStart);

    // Create a span for the caret position
    div.textContent = textBeforeCursor;
    const span = document.createElement('span');
    span.textContent = '|';
    div.appendChild(span);

    // Add to DOM, measure, and clean up
    document.body.appendChild(div);
    const textareaRect = textarea.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const result = {
      left: textareaRect.left + (spanRect.left - div.getBoundingClientRect().left),
      top: textareaRect.top + (spanRect.top - div.getBoundingClientRect().top),
    };
    document.body.removeChild(div);

    return result;
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

  const onOpenChange = (open: boolean) => {
    if (open) {
      setContextMenuOpen(open);
      return;
    }

    setTimeout(() => {
      setContextMenuOpen(open);
    }, 100);
  };

  const onContextMenuItemSelect = (event: Event) => {
    const target = event.target as HTMLDivElement;
    const dataId = target.getAttribute('data-id');

    if (dataId) {
      console.log('* Data ID:', dataId);
      setActiveContextId(dataId);
    }
  };

  return (
    <>
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
        {indicatorPosition && (
          <div
            style={{
              position: 'fixed',
              left: `${indicatorPosition.left}px`,
              top: `${indicatorPosition.top}px`,
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'red',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Dropzone :: START */}
        <div className="flex gap-2 px-3 py-2">
          {files.map((file) => (
            <FileBadge key={file.id} file={file} onRemoveAttachment={onRemoveAttachment} />
          ))}
          {activeContextId && (
            // <div className="bg-secondary absolute bottom-5 left-5 rounded-md p-2">
            //   <FileTextIcon className="h-5 w-5" />
            // </div>
            <Badge variant="default" className="group relative flex gap-2 rounded-lg p-1">
              <FileTextIcon className="h-4 w-4" />
              <span>Context: </span>
              <span>{activeContextId}</span>
              <XIcon
                onClick={(e) => {
                  e.preventDefault();
                  //onRemoveAttachment(file.id);
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

      <ContextMenu onOpenChange={onOpenChange}>
        <ContextMenuTrigger ref={hiddenTriggerRef}></ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem className="flex flex-col items-start" data-id="image" onSelect={onContextMenuItemSelect}>
            <span>Image</span>
            <span className="font-light">Generate an Image</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <div className="flex flex-col items-start pe-5">
                <span>Documents</span>
                <span className="font-light">Talk to a document</span>
              </div>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem data-id="11" onSelect={onContextMenuItemSelect}>
                document.pdf
              </ContextMenuItem>
              <ContextMenuItem data-id="22" onSelect={onContextMenuItemSelect}>
                vdocument02.pdf
              </ContextMenuItem>
              <ContextMenuItem data-id="33" onSelect={onContextMenuItemSelect}>
                document04.doc
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
};
