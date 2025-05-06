'use client';

import { useState, type FC, useRef } from 'react';
import FileTable from './file-table';
import { useModelList } from '@/hooks/use-model-list';
import ModelAlts from '@/components/model-alts';
import { AlertBox } from '@/components/alert-box';
import { toast } from 'sonner';
import { useModelStore } from '@/lib/model-store';
import { useDocumentsQuery } from '@/trpc/queries';
import { FileUpload, type FileUploadRef } from './file-upload';
import { UploadIcon } from '@radix-ui/react-icons';
import { FileProgress } from './file-progress';
import throttle from 'lodash.throttle';
import { HttpMethod } from '@/lib/api-service';
import type { FileInfo, TFilesUploadForm } from '../upload-types';
import { v7 as uuidv7 } from 'uuid';
import { useTRPC } from '@/trpc/react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/settings-store';

export type SelectedDocument = {
  documentId: number;
  filename: string;
};

export const DocumentsForm: FC = () => {
  const router = useRouter();
  const { selectedEmbedModel, setEmbedModel, selectedEmbedService, setEmbedService } = useModelStore();
  const { modelList: embeddedModelList } = useModelList(true);
  const { hasHydrated } = useSettingsStore();

  const fileUploadRef = useRef<FileUploadRef>(null);

  const [isEmbedding, setIsEmbedding] = useState<boolean>(false);
  const [fileIdEmbedding, setFileIdEmbedding] = useState<number | null>(null);
  const [dragging, setDragging] = useState<boolean>(false);
  const [uploadFiles, setUploadFiles] = useState<FileInfo[]>([]);
  const [fileUploadState, setFileUploadState] = useState<Record<string, { progress: number; fadeOut: boolean }>>({});

  const { data: files, isLoading: isFilesLoading, refetch: refetchFiles } = useDocumentsQuery();

  const trpc = useTRPC();
  const embedDocumentMutation = useMutation(
    trpc.document.embed.mutationOptions({
      onSuccess: async () => {
        toast.success('Document embedded successfully');

        await reload();

        setIsEmbedding(false);
        setFileIdEmbedding(null);
      },
      onError: (error) => {
        toast.error('Failed to embed document', {
          description: error.message,
        });

        setIsEmbedding(false);
        setFileIdEmbedding(null);
      },
    })
  );

  const createFileProgressUpdater = (fileId: string) => {
    return throttle(
      (percent: number) => {
        setFileUploadState((prev) => ({
          ...prev,
          [fileId]: { progress: percent, fadeOut: prev[fileId]?.fadeOut ?? false },
        }));
      },
      100,
      { leading: true, trailing: true }
    );
  };

  const onEmbedDocument = async (documentId: number) => {
    if (selectedEmbedModel == null || selectedEmbedService == null) {
      toast.warning('No embedding model or service choosen');
      return;
    }

    setIsEmbedding(true);
    setFileIdEmbedding(documentId);

    embedDocumentMutation.mutate({
      documentId: documentId,
      embedModel: selectedEmbedModel,
      apiSetting: selectedEmbedService,
    });
  };

  const initConversationWithDocument = async (documentId: number) => {
    router.push(`/?contextid=${documentId}`);
  };

  const reload = async () => {
    await refetchFiles();
  };

  const onFilesSubmit = async (formFileData: TFilesUploadForm) => {
    const files = formFileData.files;

    const filesInfo = files.map((file) => ({
      id: uuidv7(),
      filename: file.name,
      sizeInBytes: file.size,
      type: file.type,
      file: file,
    }));

    setUploadFiles(filesInfo);

    const initialProgress = filesInfo.reduce(
      (acc, file) => {
        acc[file.id] = { progress: 0, fadeOut: false };
        return acc;
      },
      {} as Record<string, { progress: number; fadeOut: boolean }>
    );

    setFileUploadState(initialProgress);

    const uploadPromises = filesInfo.map(async (file) => {
      try {
        const fileProgressUpdater = createFileProgressUpdater(file.id);
        await postFile(file.file, fileProgressUpdater);

        setFileUploadState((prev) => ({
          ...prev,
          [file.id]: { progress: 100, fadeOut: true },
        }));

        toast.success(`Document uploaded successfully!`, {
          description: `File: ${file.filename}`,
        });

        return { success: true, file };
      } catch (error) {
        console.error(`Error uploading ${file.filename}:`, error);
        toast.error(`Error uploading file: ${file.filename}`);

        return { success: false, file, error };
      }
    });

    await Promise.all(uploadPromises);

    setTimeout(() => {
      resetUploadStatus();
    }, 1200);

    await refetchFiles();
  };

  const postFile = async (file: File, updateFileProgress: (step: number) => void) => {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const uploadRequestOptions: RequestInit = {
      method: HttpMethod.POST,
      body: formData,
    };

    const response = await fetch('/api/documents', uploadRequestOptions);
    if (!response.ok) toast.error('Failed to upload');
    const data = response.body;

    const reader = data?.getReader();
    if (reader == null) return;

    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      receivedLength += value.length;
      const step = parseFloat((receivedLength / file.size).toFixed(2)) * 100;

      updateFileProgress(step);
    }
  };

  const resetUploadStatus = () => {
    setUploadFiles([]);
    setFileUploadState({});
  };

  const handleFileChange = (files: FileList) => {
    fileUploadRef.current?.submitForm(files);
  };

  const onFilesDropped = async (files: FileList) => {
    fileUploadRef.current?.submitForm(files);
  };

  return (
    <>
      <FileUpload
        onSubmit={onFilesSubmit}
        handleFileChange={handleFileChange}
        onFilesDropped={onFilesDropped}
        setDragging={setDragging}
        ref={fileUploadRef}
      >
        {/* Dropzone :: START */}
        <div
          className={`my-3 flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-lg border p-3 ${dragging ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-700 bg-zinc-800'} hover:border-zinc-800 hover:bg-zinc-900`}
        >
          <div className="flex flex-col items-center">
            <UploadIcon />
            <span className="text-center text-xl xl:text-2xl">
              Drag and drop or <u>select document</u>
            </span>
          </div>
          <div className="text-sm text-slate-500 italic">.pdf, .txt, .docx</div>
        </div>
        {/* Dropzone :: END */}
      </FileUpload>
      {uploadFiles.map((file) => (
        <FileProgress
          key={file.id}
          progress={fileUploadState[file.id]?.progress ?? 0}
          fadeOut={fileUploadState[file.id]?.fadeOut ?? false}
          file={file}
        />
      ))}

      {embeddedModelList.modelsIsError && (
        <AlertBox title="Error" description={embeddedModelList.modelsError?.message ?? ''} />
      )}
      <div className="flex flex-col items-baseline gap-1 pb-2">
        <span>Model for embedding:</span>
        <ModelAlts
          embeddingModels={true}
          selectedService={selectedEmbedService}
          selectedModel={selectedEmbedModel}
          models={embeddedModelList.models ?? []}
          modelsIsSuccess={embeddedModelList.modelsIsSuccess}
          modelsIsLoading={embeddedModelList.modelsIsLoading}
          hasHydrated={hasHydrated}
          onModelChange={(model) => {
            setEmbedModel(model);
          }}
          onServiceChange={(service) => {
            setEmbedService(service);
            setEmbedModel(undefined);
          }}
          onReset={() => {
            setEmbedService(undefined);
            setEmbedModel(undefined);
          }}
        />
      </div>

      <FileTable
        files={files}
        filesLoading={isFilesLoading}
        isEmbedding={isEmbedding}
        fileIdEmbedding={fileIdEmbedding}
        onEmbedDocument={onEmbedDocument}
        initConversationWithDocument={initConversationWithDocument}
        reload={reload}
      />
    </>
  );
};
