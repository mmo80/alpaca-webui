'use client';

import * as React from 'react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Badge } from '@/components/ui/badge';
import { LayersIcon, ChatBubbleIcon, GearIcon } from '@radix-ui/react-icons';
import { useModelStore } from '../lib/store';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import SettingsForm from './settings-form';

export const TopNav: React.FC = () => {
  const { modelName } = useModelStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  const newChat = () => {
    window.location.href = '/';
  };

  return (
    <header className="w-full text-center">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink className={`${navigationMenuTriggerStyle()} hover:cursor-pointer`} onClick={newChat}>
              <ChatBubbleIcon className="mr-2 w-4 h-4" /> New Chat
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <NavigationMenuLink className={`${navigationMenuTriggerStyle()} hover:cursor-pointer`}>
                  <GearIcon className="mr-2 w-4 h-4" /> Settings
                </NavigationMenuLink>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <SettingsForm setDialogOpen={setDialogOpen} />
              </DialogContent>
            </Dialog>
          </NavigationMenuItem>
          <NavigationMenuItem>
            {modelName != null && (
              <div className="flex gap-1">
                <LayersIcon className="mt-1 w-4 h-4" />
                <span className="hidden md:block">You are talking to</span>
                <Badge variant="outline">{modelName}</Badge>
              </div>
            )}
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};

export default TopNav;
