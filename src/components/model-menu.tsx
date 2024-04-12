'use client';

import * as React from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { TModelResponseSchema } from '@/lib/types';
import { useEffect, useState } from 'react';

interface ModelMenuProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  models: TModelResponseSchema[];
  selectedModel: string;
  defaultText?: string;
  onModelChange: (modelName: string) => void;
}

const ModelMenu = React.forwardRef<HTMLButtonElement, ModelMenuProps>(
  ({ models: modelList, selectedModel, defaultText = 'Select model...', onModelChange, ...props }, ref) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(selectedModel);
    const [models, setModels] = useState<TModelResponseSchema[]>(modelList);
    const [buttonText, setButtonText] = useState(defaultText);

    useEffect(() => {
      setButtonText(defaultText);
    }, [defaultText]);

    useEffect(() => {
      setValue(selectedModel);
    }, [selectedModel]);

    useEffect(() => {
      setModels(modelList);
    }, [modelList]);

    const displayLabel = () => {
      const id = models.find((model) => model.id.toLowerCase() === value.toLowerCase())?.id;
      return id ? `${id}` : buttonText;
    };

    return (
      <Popover open={open} onOpenChange={setOpen} {...props}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between lg:w-[300px]">
            <span className="truncate hover:text-clip">{value ? `${displayLabel()}` : buttonText}</span>
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" className="popover-content w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search model..." className="h-9" />
            <CommandEmpty>No models found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-64">
                {models.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={(currentValue) => {
                      const selectedModel = currentValue.toLowerCase() === value.toLowerCase() ? '' : currentValue;
                      setValue(selectedModel);
                      onModelChange(selectedModel);
                      setOpen(false);
                    }}
                  >
                    {model.id}
                    <CheckIcon
                      className={cn(
                        'ml-auto h-4 w-4',
                        value.toLowerCase() === model.id.toLowerCase() ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

ModelMenu.displayName = 'ModelMenu';

export { ModelMenu };
