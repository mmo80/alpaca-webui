'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/lib/store';
import { useEffect } from 'react';

const modelListVariant = [
  { label: 'Ollama', value: 'ollama' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Manual', value: 'manual' },
] as const;

const urlPattern = /^(https?:\/\/)(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?$/; // ?(\/)

const SettingsSchema = z.object({
  url: z
    .string()
    .regex(urlPattern, "URL must start with 'http://' or 'https://' followed by a domain name, without any trailing path."),
  apiKey: z.union([z.string().min(5, 'API Key must be at least 5 characters long.'), z.literal('')]),
  modelListVariant: z.string({ required_error: 'Please select a model api.' }),
});

type TSettingsSchema = z.infer<typeof SettingsSchema>;

export const EditSettings: React.FC = () => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { setValues, token, hostname, modelVariant } = useSettingsStore();

  const form = useForm<TSettingsSchema>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {},
  });

  useEffect(() => {
    form.setValue('url', hostname ?? '');
    form.setValue('apiKey', token ?? '');
    form.setValue('modelListVariant', modelVariant ?? '');
  }, [form, hostname, token, modelVariant]);

  function onSubmit(data: TSettingsSchema) {
    setValues(data.modelListVariant, data.url, data.apiKey);
    setDialogOpen(false);
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Settings</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Settings</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                          {field.value ? modelListVariant.find((model) => model.value === field.value)?.label : 'Select'}
                          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandGroup>
                          {modelListVariant.map((model) => (
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
                    <Input placeholder="http://..." {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your base domain url (http://localhost:11434, https://api.together.xyz, https://api.openai.com)
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
                    <Input placeholder="" {...field} />
                  </FormControl>
                  <FormDescription>
                    <strong>Caution:</strong> Your information is stored unencrypted in your browser&apos;s local storage.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="sm:justify-start">
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
