'use client';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSettingsStore } from '@/lib/store';
import { apiServiceModelTypes, apiServices } from '@/lib/data';

const urlPattern = /^(https?:\/\/)(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?$/;

const SettingsSchema = z.object({
  url: z
    .string()
    .regex(urlPattern, "URL must start with 'http://' or 'https://' followed by a domain name, without any trailing path."),
  apiKey: z.union([z.string().min(5, 'API Key must be at least 5 characters long.'), z.literal('')]),
  modelListVariant: z.string({ required_error: 'Please select a model api.' }),
});

type TSettingsSchema = z.infer<typeof SettingsSchema>;

export default function Page() {
  const [open, setOpen] = useState(false);
  const { setSettings, token, baseUrl, modelVariant } = useSettingsStore();

  const form = useForm<TSettingsSchema>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      url: '',
      apiKey: '',
    },
  });

  useEffect(() => {
    form.setValue('url', baseUrl ?? '');
    form.setValue('apiKey', token ?? '');
    form.setValue('modelListVariant', modelVariant ?? '');
  }, [form, baseUrl, token, modelVariant]);

  const onSubmit = (data: TSettingsSchema) => {
    setSettings(data.modelListVariant, data.url, data.apiKey);
    toast.success('Saved!');
  };

  const setFormValues = (url: string, modelType: string) => {
    form.setValue('url', url);

    if (modelType === 'ollama') {
      form.setValue('modelListVariant', 'ollama');
    } else if (modelType === 'openai') {
      form.setValue('modelListVariant', 'openai');
    } else {
      form.setValue('modelListVariant', 'manual');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>API</CardTitle>
            <CardDescription>
              Configure the API endpoints and authentication credentials required for the AI service to connect with external
              model providers. Enter the base URL and input your API key or bearer token to authenticate your session with the service provider.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-8">
            <div className="flex flex-col space-y-2">
              <p className="font-medium leading-none">
                Predefined api settings
                <br />
                <span className="text-xs font-thin">(Except for key / token))</span>
              </p>

              <div className="flex flex-wrap items-start gap-2">
                {apiServices.map((as) => (
                  <Badge key={as.url} className="cursor-pointer" onClick={() => setFormValues(as.url, as.modelType)}>
                    {as.url}
                  </Badge>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="modelListVariant"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Model List</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn('w-[200px] justify-between', !field.value && 'text-muted-foreground')}
                        >
                          {field.value ? apiServiceModelTypes.find((model) => model.value === field.value)?.label : 'Select'}
                          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandGroup>
                          {apiServiceModelTypes.map((model) => (
                            <CommandItem
                              value={model.label}
                              key={model.value}
                              onSelect={() => {
                                form.setValue('modelListVariant', model.value);
                                setOpen(false);
                              }}
                            >
                              {model.label}
                              <CheckIcon
                                className={cn('ml-auto h-4 w-4', model.value === field.value ? 'opacity-100' : 'opacity-0')}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Choose how to populate model list or to enter manually.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Url</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your base domain url. ex. <i>&quot;<strong>&#123;Base Url&#125;</strong>/v1/chat/completions&quot;</i>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key / Bearer Token</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    <strong>Caution:</strong> Your information is stored unencrypted in your browser&apos;s local storage.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Save</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
