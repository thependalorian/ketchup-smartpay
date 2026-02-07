import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        ketchup: "gradient-primary text-primary-foreground shadow-ketchup hover:opacity-95 focus-visible:ring-primary/50",
        // iOS-style gradient buttons
        ios: "bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]",
        iosSecondary: "bg-secondary text-white shadow-lg shadow-secondary/25 hover:shadow-xl hover:shadow-secondary/30 hover:scale-[1.02] active:scale-[0.98]",
        iosSuccess: "bg-success text-white shadow-lg shadow-success/25 hover:shadow-xl hover:shadow-success/30 hover:scale-[1.02] active:scale-[0.98]",
        iosWarning: "bg-warning text-white shadow-lg shadow-warning/25 hover:shadow-xl hover:shadow-warning/30 hover:scale-[1.02] active:scale-[0.98]",
        iosDanger: "bg-destructive text-white shadow-lg shadow-destructive/25 hover:shadow-xl hover:shadow-destructive/30 hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // iOS-style sizes
        ios: "h-12 px-6 rounded-full",
        iosSm: "h-9 px-4 rounded-full",
        iosLg: "h-14 px-8 rounded-full",
        iosIcon: "h-12 w-12 rounded-full",
        // Pill buttons
        pill: "h-10 px-6 rounded-full",
        pillSm: "h-8 px-4 rounded-full text-xs",
        pillLg: "h-12 px-8 rounded-full text-base",
      },
      shape: {
        default: "rounded-md",
        ios: "rounded-full",
        pill: "rounded-full",
        square: "rounded-none",
        lg: "rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  shape?: "default" | "ios" | "pill" | "square" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, shape, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
