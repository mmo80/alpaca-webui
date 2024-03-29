import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { Button } from '../ui/button';
import { Command, CommandGroup, CommandItem } from '../ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useSettingsStore } from '@/lib/store';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge } from '../ui/badge';
import { apiServiceModelTypes, apiServices } from '@/lib/data';

interface SettingsFormProps {
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const urlPattern = /^(https?:\/\/)(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?$/;

const SettingsSchema = z.object({
  url: z
    .string()
    .regex(urlPattern, "URL must start with 'http://' or 'https://' followed by a domain name, without any trailing path."),
  apiKey: z.union([z.string().min(5, 'API Key must be at least 5 characters long.'), z.literal('')]),
  modelListVariant: z.string({ required_error: 'Please select a model api.' }),
});

type TSettingsSchema = z.infer<typeof SettingsSchema>;

const SettingsForm: React.FC<SettingsFormProps> = ({ setDialogOpen }) => {
  const [open, setOpen] = useState(false);
  const { setSettings, token, hostname, modelVariant } = useSettingsStore();

  const form = useForm<TSettingsSchema>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      url: '',
      apiKey: '',
    },
  });

  useEffect(() => {
    form.setValue('url', hostname ?? '');
    form.setValue('apiKey', token ?? '');
    form.setValue('modelListVariant', modelVariant ?? '');
  }, [form, hostname, token, modelVariant]);

  const onSubmit = (data: TSettingsSchema) => {
    setSettings(data.modelListVariant, data.url, data.apiKey);
    setDialogOpen(false);
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
    <section>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  This is your base domain url. ex. <i>&#123;Base Url&#125;/v1/chat/completions</i>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-wrap items-start gap-2">
            {apiServices.map((as) => (
              <Badge key={as.url} className="cursor-pointer" onClick={() => setFormValues(as.url, as.modelType)}>
                {as.url}
              </Badge>
            ))}
          </div>

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

          <div className="text-right">
            <Button type="submit" className="px-7">
              Save
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
};

export default SettingsForm;
