import { cn } from "@/lib/utils";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

const menuItems = [
  { id: 'projects', label: 'PROJECTS' },
  { id: 'machines', label: 'MACHINES' },
  { id: 'tco-formula', label: 'TCO FORMULA' },
];

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <nav className="p-4 space-y-2 flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={cn(
              "w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors",
              activeItem === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
      
      <div className="p-4 flex items-center space-x-2 border-t border-sidebar-border">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">M</span>
        </div>
        <div className="text-sm">
          <div className="font-medium text-sidebar-foreground">JIM</div>
          <div className="text-sidebar-foreground/70">ADMIN</div>
        </div>
      </div>
    </aside>
  );
}