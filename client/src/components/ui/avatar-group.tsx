import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    image?: string
    name: string
  }[]
  limit?: number
}

export function AvatarGroup({
  items,
  limit = 3,
  className,
  ...props
}: AvatarGroupProps) {
  const itemsToShow = items.slice(0, limit)
  const remainingItems = items.length - limit

  return (
    <div
      className={cn("flex -space-x-2 overflow-hidden", className)}
      {...props}
    >
      {itemsToShow.map((item, i) => (
        <Avatar key={i} className="border-2 border-background">
          {item.image ? (
            <AvatarImage src={item.image} alt={item.name} />
          ) : null}
          <AvatarFallback>
            {item.name
              .split(" ")
              .map((part) => part.charAt(0))
              .join("")}
          </AvatarFallback>
        </Avatar>
      ))}
      {remainingItems > 0 && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
          +{remainingItems}
        </div>
      )}
    </div>
  )
}
