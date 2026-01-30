import { Link, useLocation } from "wouter";
import { cn } from "../../lib/utils";

export default function Navbar() {
  const [location] = useLocation();

  const navigationItems = [
    { href: "/", label: "Dashboard" },
    { href: "/upload", label: "Upload" },
    { href: "/results", label: "Results" },
    { href: "/analysis", label: "Analysis" },
  ];

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-water text-primary-foreground text-sm"></i>
            </div>
            <Link href="/">
              <span className="text-xl font-bold text-primary cursor-pointer hover:text-primary/90 transition-colors">
                DeepSea-AI
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "transition-colors hover:text-foreground cursor-pointer",
                    location === item.href
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  )}
                  data-testid={`nav-link-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <i className="fas fa-user text-muted-foreground text-sm"></i>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
