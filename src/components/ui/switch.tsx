import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, onCheckedChange, ...props }, ref) => {
  const handleCheckedChange = (checked: boolean) => {
    // Force style update on mobile
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      // Force reflow to ensure immediate style update
      const element = document.querySelector(`[data-state="${checked ? 'unchecked' : 'checked'}"]`);
      if (element) {
        element.offsetHeight; // Force reflow
      }
    }
    onCheckedChange?.(checked);
  };

  return (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      "!appearance-none !-webkit-appearance-none !-moz-appearance-none",
      "!outline-none !border-none !box-shadow-none",
      className,
    )}
    style={{
      WebkitAppearance: 'none',
      MozAppearance: 'none',
      appearance: 'none',
      outline: 'none',
      border: 'none',
      boxShadow: 'none',
    }}
    {...props}
    onCheckedChange={handleCheckedChange}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        "!appearance-none !-webkit-appearance-none !-moz-appearance-none",
        "!outline-none !border-none",
      )}
      style={{
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none',
        outline: 'none',
        border: 'none',
        backgroundColor: 'white',
      }}
    />
  </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
