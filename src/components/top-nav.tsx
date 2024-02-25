"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Badge } from "@/components/ui/badge"
import { LayersIcon, ChatBubbleIcon } from "@radix-ui/react-icons";
import { useModelStore } from "../lib/store";

export const TopNav: React.FC = () => {
  const { modelName, model } = useModelStore();

  const newChat = () => {
    window.location.href = "/";
  };

  return (
    <header className="w-full text-center">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink className={`${navigationMenuTriggerStyle()} hover:cursor-pointer`} onClick={newChat}>
              <ChatBubbleIcon className="mr-2 w-4 h-4" />New Chat
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
              {modelName != null && (
                <div className="flex gap-1">
                  <LayersIcon className="mt-1 w-4 h-4" />
                  <span className="hidden md:block">You are talking to</span>
                  <Badge variant="outline">{modelName}</Badge>
                  <Badge variant="outline">{model?.sizeInGB}</Badge>
                  <Badge variant="outline" className="hidden md:block">{model?.details.family}</Badge>
                  <Badge variant="outline" className="hidden md:block">{model?.details.parameter_size}</Badge>
                  <Badge variant="outline" className="hidden md:block">{model?.details.quantization_level}</Badge>
                  <Badge variant="outline" className="hidden md:block">{model?.details.format}</Badge>
                </div>
              )}
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}

// const ListItem = React.forwardRef<
//   React.ElementRef<"a">,
//   React.ComponentPropsWithoutRef<"a">
// >(({ className, title, children, ...props }, ref) => {
//   return (
//     <li>
//       <NavigationMenuLink asChild>
//         <a
//           ref={ref}
//           className={cn(
//             "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
//             className
//           )}
//           {...props}
//         >
//           <div className="text-sm font-medium leading-none">{title}</div>
//           <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
//             {children}
//           </p>
//         </a>
//       </NavigationMenuLink>
//     </li>
//   )
// })
// ListItem.displayName = "ListItem"

export default TopNav;