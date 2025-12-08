import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className" | "children"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  badge?: number;
  children: ReactNode;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, children, badge, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
            "hover:bg-muted hover:text-foreground",
            isActive 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground",
            className
          )
        }
        {...props}
      >
        {children}
        {badge && badge > 0 && (
          <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs absolute -top-1 -right-1">
            {badge > 99 ? '99+' : badge}
          </Badge>
        )}
      </RouterNavLink>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
