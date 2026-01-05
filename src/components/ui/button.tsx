import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] rounded-lg font-display uppercase tracking-wider",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg",
        outline: "border-2 border-primary/50 bg-transparent text-primary hover:bg-primary/10 hover:border-primary rounded-lg font-display uppercase tracking-wider",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded-lg",
        ghost: "hover:bg-muted hover:text-foreground rounded-lg",
        link: "text-primary underline-offset-4 hover:underline",
        // Hero button with neon glow
        hero: "relative bg-gradient-to-r from-primary to-accent text-primary-foreground font-display uppercase tracking-widest rounded-lg shadow-[0_0_30px_hsl(175_100%_50%/0.4),0_0_60px_hsl(320_100%_60%/0.2)] hover:shadow-[0_0_50px_hsl(175_100%_50%/0.6),0_0_100px_hsl(320_100%_60%/0.3)] hover:scale-[1.03] active:scale-[0.98] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-primary before:to-accent before:opacity-0 before:transition-opacity hover:before:opacity-100 before:-z-10 before:blur-xl",
        // Cyber outline with animated border
        cyber: "relative border border-primary/50 bg-card/50 text-primary font-display uppercase tracking-wider rounded-lg overflow-hidden hover:border-primary hover:bg-primary/5 hover:shadow-[0_0_20px_hsl(175_100%_50%/0.3)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/10 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        // Glass morphism style
        glass: "bg-white/5 backdrop-blur-md border border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 rounded-lg shadow-lg",
        // Neon magenta accent
        neon: "bg-accent text-accent-foreground font-display uppercase tracking-wider rounded-lg shadow-[0_0_20px_hsl(320_100%_60%/0.4)] hover:shadow-[0_0_40px_hsl(320_100%_60%/0.6)] hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8",
        xl: "h-14 px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
