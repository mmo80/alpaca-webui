'use client';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSettingsStore } from '@/lib/settings-store';

const SystemPromptSchema = z.object({
  systemPrompt: z.union([z.string().min(5, 'Prompt must be at least 5 characters long.'), z.literal('')]),
});

type TSystemPromptSchema = z.infer<typeof SystemPromptSchema>;

export default function Page() {
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
    toast.success('Saved!');
  };

  return (
    <section>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                Define the welcome message that guides users and instructs the AI on its role in the conversation. Keep it
                concise, informative, and engaging to ensure a clear and helpful interaction.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button>Save</Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </section>
  );
}
