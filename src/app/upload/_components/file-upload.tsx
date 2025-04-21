import { useRef, useImperativeHandle, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { DropZone } from '@/components/drop-zone';
import {
  createFilesUploadFormSchema,
  FILEUPLOAD_DEFAULT_ALLOWED_FILE_TYPES,
  FILEUPLOAD_DEFAULT_FILETYPE_ERROR_MESSAGE,
  FILEUPLOAD_DEFAULT_MAX_FILE_SIZE_MB,
  type TFilesUploadForm,
} from '../upload-types';
import { toast } from 'sonner';

type FileUploadProps = {
  onSubmit: (formFileData: TFilesUploadForm) => void;
  handleFileChange: (files: FileList) => void;
  onFilesDropped: (files: FileList) => void;
  setDragging: React.Dispatch<React.SetStateAction<boolean>>;

  children?: React.ReactNode;

  disableClickZone?: boolean;
  disableEnterSpaceZone?: boolean;

  maxFileSizeMb?: number;
  allowedFileTypes?: string[];
  fileTypeErrorMessage?: string;
};

export type FileUploadRef = {
  trigger: () => void;
  submitForm: (files: FileList) => void;
  validate: (files: FileList) => Promise<boolean>;
};

export const FileUpload = forwardRef<FileUploadRef, FileUploadProps>(
  (
    {
      onSubmit,
      handleFileChange,
      onFilesDropped,
      setDragging,
      children,
      disableClickZone = false,
      disableEnterSpaceZone = false,
      maxFileSizeMb = FILEUPLOAD_DEFAULT_MAX_FILE_SIZE_MB,
      allowedFileTypes = FILEUPLOAD_DEFAULT_ALLOWED_FILE_TYPES,
      fileTypeErrorMessage = FILEUPLOAD_DEFAULT_FILETYPE_ERROR_MESSAGE,
    },
    ref
  ) => {
    const customFormSchema = createFilesUploadFormSchema(maxFileSizeMb, allowedFileTypes, fileTypeErrorMessage);
    const form = useForm<TFilesUploadForm>({ resolver: zodResolver(customFormSchema) });
    const { ref: filesRef, ...filesRest } = form.register('files');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useImperativeHandle(ref, () => ({
      trigger: () => {
        triggerFileSelection();
      },
      submitForm: async (files: FileList) => {
        if (await isFormValid(files)) {
          await form.handleSubmit(onSubmitForm)();
        }
      },
      validate: async (files: FileList): Promise<boolean> => {
        return await isFormValid(files);
      },
    }));

    const isFormValid = async (files: FileList): Promise<boolean> => {
      if (files && files.length > 0) {
        form.setValue('files', Array.from(files) as [File, ...File[]]);
        const valid = await form.trigger();
        if (valid) {
          return true;
        } else if (Array.isArray(form.formState.errors.files) && form.formState.errors.files.length > 0) {
          form.formState.errors.files.forEach((error, i) => {
            toast.error(`${error?.message} (${files.length > i ? files[i]?.name : ''})`);
          });
        } else {
          toast.error(`Invalid form data`);
        }
      }
      return false;
    };

    const onSubmitForm = async (formFileData: TFilesUploadForm) => {
      const files = formFileData.files;
      if (files && files.length > 0) {
        form.setValue('files', Array.from(files) as [File, ...File[]]);
        onSubmit(formFileData);
      }
    };

    const triggerFileSelection = () => {
      fileInputRef.current?.click();
    };

    const onFilesDroppedInternal = async (files: FileList) => {
      onFilesDropped(files);
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const files = e.target.files;
      if (files) {
        handleFileChange(files);
      }
    };

    const onClickZone = () => {
      if (!disableClickZone) {
        fileInputRef.current?.click();
      }
    };

    const onEnterSpaceZone = () => {
      if (!disableEnterSpaceZone) {
        fileInputRef.current?.click();
      }
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitForm)} className="w-full">
          <FormField
            control={form.control}
            name="files"
            render={() => {
              return (
                <FormItem>
                  <FormControl>
                    <input
                      type="file"
                      multiple={true}
                      className="hidden"
                      {...filesRest}
                      ref={(e) => {
                        filesRef(e);
                        fileInputRef.current = e;
                      }}
                      onChange={handleChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <DropZone
            onFilesDropped={onFilesDroppedInternal}
            setDragging={setDragging}
            onClickZone={onClickZone}
            onEnterSpaceZone={onEnterSpaceZone}
          >
            {children}
          </DropZone>
        </form>
      </Form>
    );
  }
);

FileUpload.displayName = 'FileUpload';
