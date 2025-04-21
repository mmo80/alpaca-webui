import React from 'react';

interface DropZoneProps {
  onFilesDropped: (files: FileList) => void;
  children?: React.ReactNode;
  setDragging: React.Dispatch<React.SetStateAction<boolean>>;
  onClickZone: () => void;
  onEnterSpaceZone: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesDropped,
  children,
  setDragging,
  onClickZone,
  onEnterSpaceZone,
}) => {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (e.dataTransfer.files.length > 0) {
      onFilesDropped(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onEnterSpaceZone();
    }
  };

  const handleClick = () => {
    onClickZone();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};
