import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/90 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/80 group-[.toaster]:shadow-elevated rounded-2xl p-4 flex gap-3 items-center border font-sans text-sm",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:text-emerald-500 group-[.toaster]:border-emerald-500/30 group-[.toaster]:bg-emerald-500/10",
          error: "group-[.toaster]:text-destructive group-[.toaster]:border-destructive/30 group-[.toaster]:bg-destructive/10",
          warning: "group-[.toaster]:text-amber-500 group-[.toaster]:border-amber-500/30 group-[.toaster]:bg-amber-500/10",
          info: "group-[.toaster]:text-primary group-[.toaster]:border-primary/20 group-[.toaster]:bg-primary/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
