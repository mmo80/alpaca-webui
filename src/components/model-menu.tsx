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
import { OllamaTag } from "@/lib/types";
import { LayersIcon } from "@radix-ui/react-icons";
import { useOllamaStore } from "../lib/store";

export const ModelMenu: React.FC<OllamaTag> = ({ models }) => {
  const { updateModel } = useOllamaStore();

  const modelHandler = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ): void => {
    updateModel(e.currentTarget.textContent);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
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
          <DropdownMenuItem onClick={modelHandler} className="hover:cursor-pointer" key={index}>
            {model.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
