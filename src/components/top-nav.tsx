'use client';

import * as React from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Badge } from '@/components/ui/badge';
import { LayersIcon, ChatBubbleIcon, GearIcon, FileIcon, HamburgerMenuIcon } from '@radix-ui/react-icons';
import { useModelStore } from '../lib/store';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import SettingsMenu from './settings/settings-menu';
import { cn } from '@/lib/utils';

export const TopNav: React.FC = () => {
  const { modelName } = useModelStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  // const newChat = () => {
  //   window.location.href = '/';
  // };

  return (
    <header className="w-full text-center">
      <NavigationMenu>
        <NavigationMenuList>
          {/* <NavigationMenuItem>
            <NavigationMenuLink className={`${navigationMenuTriggerStyle()} hover:cursor-pointer`} onClick={newChat}>
              <ChatBubbleIcon className="mr-2 h-4 w-4" /> New Chat
            </NavigationMenuLink>
          </NavigationMenuItem> */}

          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <HamburgerMenuIcon className="mr-2" />
              Start
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                <ListItem href={'/'}>
                  <div className="flex text-sm font-medium">
                    <ChatBubbleIcon className="mr-2" />
                    New Chat
                  </div>
                  Start a new conversation with new or existing model
                </ListItem>
                <ListItem href={'/upload'}>
                  <div className="flex text-sm font-medium">
                    <FileIcon className="mr-2 h-4 w-4" />
                    Upload document
                  </div>
                  Upload a document to question with choosen model (RAG)
                </ListItem>
                {/* <ListItem href={'/webscrape'}>
                  <div className="flex text-sm font-medium">
                    <FileIcon className="mr-2 h-4 w-4" />
                    Webscrape
                  </div>
                  Upload a document to question with choosen model (RAG)
                </ListItem>
                <ListItem href={'/funccalls'}>
                  <div className="flex text-sm font-medium">
                    <FileIcon className="mr-2 h-4 w-4" />
                    Test Functions Calls
                  </div>
                  Upload a document to question with choosen model (RAG)
                </ListItem> */}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <NavigationMenuLink className={`${navigationMenuTriggerStyle()} hover:cursor-pointer`}>
                  <GearIcon className="mr-2 h-4 w-4" /> Settings
                </NavigationMenuLink>
              </DialogTrigger>
              <DialogContent className="top-5 min-h-96 translate-y-0 p-3 sm:max-w-[625px]">
                <SettingsMenu setDialogOpen={setDialogOpen} />
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

const ListItem = React.forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(
  ({ className, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              'block select-none space-y-1 rounded-md p-3 text-left leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className
            )}
            {...props}
          >
            <div className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</div>
          </a>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = 'ListItem';
