"use client";

import * as React from "react";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OllamaModel } from "@/lib/types";
import { LayersIcon } from "@radix-ui/react-icons";
import { useModelStore } from "../lib/store";

interface ModelMenuProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  models: OllamaModel[];
}

const ModelMenu = React.forwardRef<HTMLButtonElement, ModelMenuProps>(
  ({ models, ...props }, ref) => { 
    const { updateModelName } = useModelStore();

    const modelHandler = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>
    ): void => {
      updateModelName(e.currentTarget.textContent);
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" ref={ref} {...props}>
            <LayersIcon className="mr-2" />
            <span>Choose Model</span>
            <ChevronDownIcon
              className="ml-2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Models</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {models.map((model, index) => (
            <DropdownMenuItem
              onClick={modelHandler}
              className="hover:cursor-pointer"
              key={index}
            >
              {model.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

ModelMenu.displayName = "ModelMenu";

export { ModelMenu };