'use client';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { SystemPromptVariable, useSettingsStore } from '@/lib/settings-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const RagSettingsFormSchema = z.object({
  systemPromptForRag: z.union([z.string().min(5, 'Prompt must be at least 5 characters long.'), z.literal('')]),
  systemPromptForRagSlim: z.union([z.string().min(5, 'Prompt must be at least 5 characters long.'), z.literal('')]),
});

type TRagSettingsFormSchema = z.infer<typeof RagSettingsFormSchema>;

export function RagSetting() {
  const { setSystemPromptForRag, systemPromptForRag, setSystemPromptForRagSlim, systemPromptForRagSlim } =
    useSettingsStore();

  const form = useForm<TRagSettingsFormSchema>({
    resolver: zodResolver(RagSettingsFormSchema),
    defaultValues: {
      systemPromptForRag: '',
      systemPromptForRagSlim: '',
    },
  });

  useEffect(() => {
    form.setValue('systemPromptForRag', systemPromptForRag ?? '');
    form.setValue('systemPromptForRagSlim', systemPromptForRagSlim ?? '');
  }, [form, systemPromptForRag, systemPromptForRagSlim]);

  const onSubmit = (data: TRagSettingsFormSchema) => {
    setSystemPromptForRag(data.systemPromptForRag);
    setSystemPromptForRagSlim(data.systemPromptForRagSlim);
    toast.success('Saved!');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Retrieval Augmented Generation</CardTitle>
            <CardDescription>
              Formulate RAG guidelines to aid AI in synthesizing document content when addressing queries. Both prompt
              settings need to containe <code className="bg-stone-800">{SystemPromptVariable.userQuestion}</code> and{' '}
              <code className="bg-stone-800">{SystemPromptVariable.documentContent}</code> in order to work.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-8">
            <FormField
              control={form.control}
              name="systemPromptForRag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt for RAG</FormLabel>
                  <FormControl>
                    <Textarea rows={8} {...field} />
                  </FormControl>
                  <FormDescription>
                    Write a prompt that tells the AI how to use the document sections provided by the application to answer
                    your question.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="systemPromptForRagSlim"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt for RAG (Slimmed)</FormLabel>
                  <FormControl>
                    <Textarea rows={8} {...field} />
                  </FormControl>
                  <FormDescription>
                    A slimmed down version where the params are replaced with real content compared to the system prompt
                    above wich is sent to the LLM as is.
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
