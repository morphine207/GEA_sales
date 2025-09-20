import { Button } from "@/components/ui/button";

interface HeaderProps {
  onNewProject?: () => void;
}

export function Header({ onNewProject }: HeaderProps) {
  return (
    <header className="bg-background border-b border-border px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">GEA</h1>
          <p className="text-sm text-muted-foreground font-medium">TCO CALCULATION ENGINE</p>
        </div>
        {onNewProject && (
          <Button onClick={onNewProject} className="bg-primary hover:bg-primary/90">
            + NEW PROJECT
          </Button>
        )}
      </div>
    </header>
  );
}