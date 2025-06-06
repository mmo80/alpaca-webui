'use client';

import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { CodeIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { removeClassesByWord } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { preDefinedApiProviders } from '@/lib/providers/data';
import { Skeleton } from '@/components/ui/skeleton';
import { ProviderSettingsFormSchema, type TProviderSettings, type TProviderSettingsFormSchema } from '@/lib/types';
import { useModelStore } from '@/lib/model-store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EyeIcon, EyeOffIcon, Trash2Icon } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';

export default function Page() {
  const { providers, setProviders, isFetched } = useSettings();

  const { setModel, setProvider, setEmbedModel, setEmbedProvider } = useModelStore();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState<{ [key: number]: boolean }>({});

  const selectableProviders = preDefinedApiProviders.sort((a, b) => a.id.localeCompare(b.id));

  const form = useForm<TProviderSettingsFormSchema>({
    resolver: zodResolver(ProviderSettingsFormSchema),
    defaultValues: {
      providers: [] as TProviderSettings[],
    },
  });
  const { fields } = useFieldArray({ name: 'providers', control: form.control });

  useEffect(() => {
    if (providers && JSON.stringify(form.getValues().providers) !== JSON.stringify(providers)) {
      form.setValue('providers', providers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);

  const onSubmit = (data: TProviderSettingsFormSchema) => {
    setProviders(data.providers);
    setErrorMessages([]);
    setEmbedModel(null);
    setEmbedProvider(null);
    setModel(null);
    setProvider(null);
    toast.success('Saved!');
  };

  const addProvider = (url: string, apiType: string, serviceId: string, hasEmbedding: boolean, embeddingPath: string) => {
    const formList = form.getValues();
    const excistingService = formList.providers?.find((service) => service.providerId === serviceId);
    if (excistingService) {
      toast.warning(`${serviceId} already added!`);
      return;
    }

    const service: TProviderSettings = {
      providerId: serviceId,
      url: url,
      apiType: apiType,
      apiKey: '',
      hasEmbedding: hasEmbedding,
      embeddingPath: embeddingPath,
    };

    form.setValue('providers', [...formList.providers, service]);
  };

  const removeService = (index: number) => {
    form.setValue(
      'providers',
      form.getValues().providers.filter((_, i) => i !== index)
    );
  };

  const onErrors = (errors: any) => {
    const errorMsgs = [] as string[];
    const list = errors?.providers ?? [];
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

  const toggleApiKeyVisibility = (index: number) => {
    setIsApiKeyVisible((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onErrors)}>
        <Card>
          <CardHeader>
            <CardTitle>API</CardTitle>
            <CardDescription>
              Configure the API connections and authentication details required to connect with external AI models. Enter the
              base URL and your API key or token to establish a secure connection with the selected provider.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-8">
            <div className="flex flex-col space-y-2">
              <p className="leading-none font-medium">
                Add Provider
                <br />
                <span className="text-xs font-thin">(and then add key / token)</span>
              </p>
              <div className="flex flex-wrap items-start gap-2">
                {selectableProviders.map((as) => (
                  <Badge
                    key={as.url}
                    variant={'default'}
                    className="cursor-pointer"
                    onClick={() => addProvider(as.url, as.apiType, as.id, as.supportsEmbedding, as.embeddingPath)}
                  >
                    {as.id}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={'default'} className="px-1">
                    <CodeIcon />
                  </Badge>
                  <span className="text-xs font-thin">= Embedding supported</span>
                </div>
              </div>
            </div>
            {/* w-[calc(100vw-4.5rem)] */}
            <div className="relative w-[calc(100vw-5.5rem)] overflow-x-auto lg:w-full">
              <Table className="table-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead></TableHead>
                    <TableHead>Api Type</TableHead>
                    <TableHead>Base Url</TableHead>
                    <TableHead>ApiKey/Token</TableHead>
                    <TableHead className="w-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>{field.providerId ?? field.url}</TableCell>
                      <TableCell>
                        {field.hasEmbedding && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild className="w-6 cursor-help px-2 py-0">
                                <Button type="button" variant={'default'} className="h-6 text-xs font-semibold">
                                  <Badge variant={'default'} className="px-1">
                                    <CodeIcon />
                                  </Badge>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Embedding supported</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell>{field.apiType}</TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          key={field.providerId}
                          name={`providers.${index}.url`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input className="w-52 xl:w-full" {...form.register(`providers.${index}.url`)} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <FormField
                          control={form.control}
                          key={field.providerId}
                          name={`providers.${index}.apiKey`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type={isApiKeyVisible[index] ? 'text' : 'password'}
                                  className="w-52 xl:w-full"
                                  {...form.register(`providers.${index}.apiKey`)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          className="flex-none"
                          onClick={() => toggleApiKeyVisibility(index)}
                          variant={'secondary'}
                          size={'icon'}
                        >
                          {isApiKeyVisible[index] ? <EyeIcon></EyeIcon> : <EyeOffIcon></EyeOffIcon>}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger className={buttonVariants({ variant: 'secondary', size: 'icon' })}>
                            <Trash2Icon />
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
                  <TableRow key="loading" className={`${isFetched && 'hidden'}`}>
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
