import type { FC } from 'react';
import { Badge } from './ui/badge';
import { formatBytes } from '@/lib/utils';
import { XIcon, PaperclipIcon } from 'lucide-react';
import type { FileInfo } from '@/app/upload/upload-types';

interface FileBadgeProps {
  file: FileInfo;
  onRemoveAttachment: (fileId: string) => void;
}

export const FileBadge: FC<FileBadgeProps> = ({ file, onRemoveAttachment }) => {
  return (
    <Badge variant="secondary" className="group relative flex gap-2 p-1.5">
      <PaperclipIcon className="h-4 w-4" />
      <span>{file.filename}</span>
      <span>{formatBytes(file.sizeInBytes)}</span>
      <XIcon
        onClick={(e) => {
          e.preventDefault();
          onRemoveAttachment(file.id);
        }}
        className="invisible absolute top-1/2 right-1 -translate-y-1/2 cursor-pointer rounded-md p-1 text-white group-hover:visible group-hover:bg-stone-700 hover:bg-stone-900"
      />
    </Badge>
  );
};
