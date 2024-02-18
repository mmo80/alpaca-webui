"use client"

import * as React from "react"
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu"
import { ChevronDownIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Checked = DropdownMenuCheckboxItemProps["checked"]

export function ModelMenu() {
    const [showStatusBar, setShowStatusBar] = React.useState<Checked>(true)
    const [showPanel, setShowPanel] = React.useState<Checked>(false)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    Choose model
                    <ChevronDownIcon
                        className="ml-2 h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Models</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuCheckboxItem
                    checked={showStatusBar}
                    onCheckedChange={setShowStatusBar}
                >
                    Mistral
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                    checked={showPanel}
                    onCheckedChange={setShowPanel}
                >
                    Llama2
                </DropdownMenuCheckboxItem>

            </DropdownMenuContent>
        </DropdownMenu>
    )
}
