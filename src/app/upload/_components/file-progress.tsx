import { formatBytes } from '@/lib/utils';
import { type FC } from 'react';
import { Progress } from '@/components/ui/progress';
import type { FileInfo } from '../upload-types';

type FileProgressProps = {
  progress: number;
  file: FileInfo;
  fadeOut: boolean;
};

export const FileProgress: FC<FileProgressProps> = ({ progress, file, fadeOut }) => {
  return (
    <div
      className={`${fadeOut ? 'opacity-0' : 'opacity-100'} flex items-center space-x-4 rounded-md border p-4 transition-opacity duration-1000 ease-in-out`}
    >
      <div className="flex-1 space-y-1">
        <p className="mb-2 text-sm leading-none font-medium">{file.filename}</p>
        <div className="text-muted-foreground text-sm">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between">
            <p className="mt-1">{formatBytes(file.sizeInBytes)}</p>
            <p className="mt-1">{progress?.toFixed()}% Complete</p>
          </div>
        </div>
      </div>
    </div>
  );
};
