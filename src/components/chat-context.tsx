import type { TCustomContext } from '@/lib/types';
import type { FC } from 'react';
import { Badge } from './ui/badge';
import { FileTextIcon, ImageIcon, XIcon } from 'lucide-react';
import type { TFile } from '@/db/schema';
import { cn } from '@/lib/utils';

export interface ChatContextProps extends React.HTMLAttributes<HTMLDivElement> {
  context: TCustomContext;
  documents: TFile[];
  documentPrefix?: string;
  removeContext?: () => void;
  editable?: boolean;
}

export const ChatContext: FC<ChatContextProps> = ({
  context,
  documents,
  removeContext,
  documentPrefix = 'Question: ',
  editable = false,
  className,
  ...props
}) => {
  const contextIcon = (contextId: string) => {
    if (contextId === 'image') {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileTextIcon className="h-4 w-4" />;
  };

  const contextIndicator = (contextId: string): string => {
    if (contextId === 'image') {
      return 'Generate Image';
    }

    const docId = parseFloat(contextId);
    if (!isNaN(docId) && docId > 0) {
      const filename = documents.filter((doc) => doc.id === docId).map((doc) => doc.filename);
      return `${documentPrefix}${filename[0]}`;
    }

    return contextId;
  };

  return (
    <Badge variant="secondary" className={cn('group relative inline-flex gap-2 rounded-lg p-1 px-2', className)} {...props}>
      {contextIcon(context.contextId)}
      <span>{contextIndicator(context.contextId)}</span>
      {editable && removeContext && (
        <XIcon
          onClick={(e) => {
            e.preventDefault();
            removeContext();
          }}
          className="invisible absolute right-0.5 cursor-pointer rounded-lg p-1 text-white group-hover:visible group-hover:bg-stone-700 hover:bg-stone-900"
        />
      )}
    </Badge>
  );
};
