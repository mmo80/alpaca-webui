import { Button } from '../ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useSettingsStore } from '@/lib/store';
import { zodResolver } from '@hookform/resolvers/zod';

interface SettingsFormProps {
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SystemPromptSchema = z.object({
  systemPrompt: z.union([z.string().min(5, 'Prompt must be at least 5 characters long.'), z.literal('')]),
});

type TSystemPromptSchema = z.infer<typeof SystemPromptSchema>;

const SystemPromptForm: React.FC<SettingsFormProps> = ({ setDialogOpen }) => {
  const { setSystemPrompt, systemPrompt } = useSettingsStore();

  const form = useForm<TSystemPromptSchema>({
    resolver: zodResolver(SystemPromptSchema),
    defaultValues: {
      systemPrompt: '',
    },
  });

  useEffect(() => {
    form.setValue('systemPrompt', systemPrompt ?? '');
  }, [form, systemPrompt]);

  const onSubmit = (data: TSystemPromptSchema) => {
    setSystemPrompt(data.systemPrompt);
    window.location.href = '/';
  };

  return (
    <section>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="systemPrompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>System Prompt</FormLabel>
                <FormControl>
                  <Textarea rows={8} {...field} />
                </FormControl>
                <FormDescription>
                  Craft a detailed prompt to guide the AI model on the intended objective of the conversation.
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

export default SystemPromptForm;
