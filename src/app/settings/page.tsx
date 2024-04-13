'use client';

import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CaretSortIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { cn, removeClassesByWord } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSettingsStore } from '@/lib/settings-store';
import { apiServiceModelTypes, preDefinedApiServices } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { TrashIcon } from '@heroicons/react/24/outline';
import { OpenPopovers, SettingsFormSchema, TApiSettingsSchema, TSettingsFormSchema } from '@/lib/types';
import { useModelStore } from '@/lib/model-store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Page() {
  const [openPopovers, setOpenPopovers] = useState<OpenPopovers>({});
  const { services, setServices, hasHydrated } = useSettingsStore();
  const { setModel, setService, setEmbedModel, setEmbedService } = useModelStore();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const form = useForm<TSettingsFormSchema>({
    resolver: zodResolver(SettingsFormSchema),
    defaultValues: {
      services: [] as TApiSettingsSchema[],
    },
  });
  const { fields } = useFieldArray({ name: 'services', control: form.control });

  useEffect(() => {
    form.setValue('services', services ?? []);
  }, [form, services]);

  const onSubmit = (data: TSettingsFormSchema) => {
    setServices(data.services);
    setErrorMessages([]);
    setEmbedModel(null);
    setEmbedService(null);
    setModel(null);
    setService(null);
    toast.success('Saved!');
  };

  const addService = (
    url: string,
    modelListType: string,
    serviceId: string,
    hasEmbedding: boolean,
    embeddingPath: string,
    lockedModelType: boolean
  ) => {
    const formList = form.getValues();
    const excistingService = formList.services?.find((service) => service.serviceId === serviceId);
    if (excistingService !== undefined && excistingService.serviceId != 'Standard') {
      toast.warning(`${serviceId} already added!`);
      return;
    }

    const service: TApiSettingsSchema = {
      serviceId: serviceId,
      url: url,
      modelListType: modelListType,
      lockedModelType: lockedModelType,
      apiKey: '',
      hasEmbedding: hasEmbedding,
      embeddingPath: embeddingPath,
    };

    form.setValue('services', [...formList.services, service]);
  };

  const removeService = (index: number) => {
    form.setValue(
      'services',
      form.getValues().services.filter((_, i) => i !== index)
    );
  };

  const onErrors = (errors: any) => {
    const errorMsgs = [] as string[];
    const list = errors?.services ?? [];
    list.forEach((element: any) => {
      for (const property in element) {
        const refItem = element[property]?.ref;
        errorMsgs.push(element[property]?.message);
        if (refItem) {
          const newClasses = removeClassesByWord(refItem.className, 'border');
          refItem.className = `${newClasses} border border-1 border-rose-500`;
        }
      }
    });

    if (errorMsgs.length > 0) {
      setErrorMessages(errorMsgs);
    } else {
      setErrorMessages([]);
    }
  };

  const handleOpenChange = (id: string, open: boolean) => {
    setOpenPopovers((prev) => ({ ...prev, [id]: open }));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onErrors)}>
        <Card>
          <CardHeader>
            <CardTitle>API</CardTitle>
            <CardDescription>
              Configure the API endpoints and authentication credentials required for the AI service to connect with external
              model providers. Enter the base URL and input your API key or bearer token to authenticate your session with
              the service provider.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-8">
            <div className="flex flex-col space-y-2">
              <p className="font-medium leading-none">
                Add Service
                <br />
                <span className="text-xs font-thin">(and then add key / token)</span>
              </p>
              <div className="flex flex-wrap items-start gap-2">
                {preDefinedApiServices.map((as) => (
                  <Badge
                    key={as.url}
                    variant={as.hasEmbedding ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() =>
                      addService(as.url, as.modelType, as.id, as.hasEmbedding, as.embeddingPath, as.lockedModelType)
                    }
                  >
                    {as.id}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={'default'}>&nbsp;</Badge>
                  <span className="text-xs font-thin">= Supports embeddings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={'secondary'}>&nbsp;</Badge>
                  <span className="text-xs font-thin">= Embeddings not supported</span>
                </div>
              </div>
            </div>
            {/* w-[calc(100vw-4.5rem)] */}
            <div className="relative w-[calc(100vw-5.5rem)] overflow-x-auto lg:w-full">
              <Table className="table-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild className="w-6 cursor-help px-2 py-0">
                            <Button type="button" variant={'default'} className="h-6 text-xs font-semibold">
                              E
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supports Embeddings?</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>
                      Models Api <br />
                      <span className="text-xs font-light">(Choose how to populate model list or to enter manually)</span>
                    </TableHead>
                    <TableHead>Base Url</TableHead>
                    <TableHead>ApiKey/Token</TableHead>
                    <TableHead className="w-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        {field.hasEmbedding ? (
                          <Badge variant={'default'} className="h-6 w-6 px-1">
                            <CheckIcon />
                          </Badge>
                        ) : (
                          <Badge variant={'secondary'} className="h-6 w-6 px-1">
                            <Cross2Icon />
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{field.serviceId ?? field.url}</TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          key={field.serviceId}
                          name={`services.${index}.modelListType`}
                          render={({ field: formField }) => (
                            <FormItem className="flex flex-col">
                              <Popover
                                open={openPopovers[field.id] || false}
                                onOpenChange={(open) => handleOpenChange(field.id, open)}
                              >
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      disabled={field.lockedModelType}
                                      {...form.register(`services.${index}.modelListType`)}
                                      variant="outline"
                                      role="combobox"
                                      className={cn(
                                        'w-[200px] justify-between',
                                        !formField.value && 'text-muted-foreground'
                                      )}
                                    >
                                      <Input type="hidden" {...form.register(`services.${index}.modelListType`)} />
                                      {formField.value
                                        ? apiServiceModelTypes.find((model) => model.value === formField.value)?.label
                                        : 'Select'}
                                      <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                  <Command>
                                    <CommandGroup>
                                      {apiServiceModelTypes
                                        .filter(
                                          (m) => (!field.lockedModelType && m.value !== 'ollama') || field.lockedModelType
                                        )
                                        .map((model) => (
                                          <CommandItem
                                            value={model.label}
                                            key={model.value}
                                            onSelect={() => {
                                              form.setValue(`services.${index}.modelListType`, model.value);
                                              handleOpenChange(field.id, false);
                                            }}
                                          >
                                            {model.label}
                                            <CheckIcon
                                              className={cn(
                                                'ml-auto h-4 w-4',
                                                model.value === formField.value ? 'opacity-100' : 'opacity-0'
                                              )}
                                            />
                                          </CommandItem>
                                        ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          key={field.serviceId}
                          name={`services.${index}.url`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input className="w-52 xl:w-full" {...form.register(`services.${index}.url`)} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          key={field.serviceId}
                          name={`services.${index}.apiKey`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input className="w-52 xl:w-full" {...form.register(`services.${index}.apiKey`)} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger>
                            <TrashIcon className="h-6 w-6" title="Remove Service" />
                            <span className="sr-only">Remove service</span>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Are you absolutely sure?</DialogTitle>
                              <DialogDescription>
                                While this removes the service from the list, saving is required to permanently reflect this
                                change. <br />
                                <br />
                                <strong>Note!</strong> Ensure that the service has not been utilized for embedding existing
                                documents, as this action renders interaction with it unusable.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button onClick={() => removeService(index)}>Remove</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow key="loading" className={`${hasHydrated && 'hidden'}`}>
                    <TableCell colSpan={2}>
                      <Skeleton className="h-3 w-full rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-full rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-full rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-full rounded-full" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="p-2">
              {errorMessages.map((error, i) => (
                <p key={i} className="block text-red-700">
                  * {error}
                </p>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Save</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
