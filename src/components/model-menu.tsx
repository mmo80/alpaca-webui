'use client';

import * as React from 'react';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TModelResponseSchema } from '@/lib/types';
import { useState } from 'react';

interface ModelMenuProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  models: TModelResponseSchema[];
  selectedValue: string;
  onModelChange: (modelName: string) => void;
}

// eslint-disable-next-line no-unused-vars
const ModelMenu = React.forwardRef<HTMLButtonElement, ModelMenuProps>(({ models, selectedValue, onModelChange, ...props }, ref) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(selectedValue);

  const displayLabel = () => {
    const id = models.find((model) => model.id.toLowerCase() === value.toLowerCase())?.id;
    return id ? `${id}` : 'Select model...';
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[300px] justify-between">
          {value ? `${displayLabel()}` : 'Select model...'}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search model..." className="h-9" />
          <CommandEmpty>No model found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-72">
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
                  <CheckIcon className={cn('ml-auto h-4 w-4', value.toLowerCase() === model.id.toLowerCase() ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

ModelMenu.displayName = 'ModelMenu';

export { ModelMenu };
