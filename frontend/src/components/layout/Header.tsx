import { Button } from "@/components/ui/button";
import SalesMateLogo from "@/resources/SalesMate.png";

interface HeaderProps {
  onNewProject?: () => void;
}

export function Header({ onNewProject }: HeaderProps) {
  return (
    <header className="bg-background border-b border-border px-6 py-4 md:py-5 flex-shrink-0">
      <div className="grid grid-cols-3 items-center">
        <div className="justify-self-start">
          <h1 className="text-3xl md:text-4xl font-bold text-primary">GEA</h1>
        </div>
        <div className="justify-self-center">
          <img src={SalesMateLogo} alt="Sales Mate" className="h-12 md:h-14 select-none" />
        </div>
        <div className="justify-self-end">
          {onNewProject ? (
            <Button onClick={onNewProject} className="bg-primary hover:bg-primary/90">
              + NEW PROJECT
            </Button>
          ) : (
            <div className="w-[140px]" />
          )}
        </div>
      </div>
    </header>
  );
}