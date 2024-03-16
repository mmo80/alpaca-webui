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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayersIcon, ChatBubbleIcon, GearIcon } from '@radix-ui/react-icons';
import { useModelStore } from '../lib/store';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import SettingsForm from './settings/settings-form';
import SystemPromptForm from './settings/system-prompt-form';

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
              <ChatBubbleIcon className="mr-2 h-4 w-4" /> New Chat
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <NavigationMenuLink className={`${navigationMenuTriggerStyle()} hover:cursor-pointer`}>
                  <GearIcon className="mr-2 h-4 w-4" /> Settings
                </NavigationMenuLink>
              </DialogTrigger>
              <DialogContent className="p-3 sm:max-w-[625px] min-h-96 top-5 translate-y-0">
                <Tabs defaultValue="manage" className="flex">
                  <TabsList className="flex w-2/6 flex-col items-start justify-start gap-1 bg-inherit me-3">
                    <TabsTrigger
                      value="manage"
                      className="w-full items-start justify-start rounded p-2 ps-3 hover:bg-stone-900 data-[state=active]:shadow-none data-[state=active]:bg-stone-900"
                    >
                      Api
                    </TabsTrigger>
                    <TabsTrigger
                      value="password"
                      className="w-full items-start justify-start rounded p-2 ps-3 hover:bg-stone-900 data-[state=active]:shadow-none data-[state=active]:bg-stone-900"
                    >
                      System Prompt
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="manage" className="w-4/6">
                    <SettingsForm setDialogOpen={setDialogOpen} />
                  </TabsContent>
                  <TabsContent value="password" className="w-4/6">
                    <SystemPromptForm setDialogOpen={setDialogOpen} />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </NavigationMenuItem>
          <NavigationMenuItem>
            {modelName != null && (
              <div className="flex gap-1">
                <LayersIcon className="mt-1 h-4 w-4" />
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
