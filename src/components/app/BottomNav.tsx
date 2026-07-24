import { useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, Users, FileText, MessageSquare } from "lucide-react";

interface BottomNavProps {
  userType?: "founder" | "investor" | null;
  inboxBadge?: number;
}

export function BottomNav({ userType, inboxBadge = 0 }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      icon: LayoutGrid,
      label: "Home",
      paths: ["/app/home", "/home"],
      onClick: () => navigate("/app/home"),
    },
    {
      icon: Users,
      label: "Discover",
      paths: ["/dashboard"],
      onClick: () => navigate("/dashboard"),
    },
    {
      icon: FileText,
      label: userType === "investor" ? "Deals" : "Cap Table",
      paths: ["/captable", "/investments"],
      onClick: () => navigate(userType === "investor" ? "/investments" : "/captable"),
    },
    {
      icon: MessageSquare,
      label: "Inbox",
      paths: ["/matches", "/requests"],
      onClick: () => navigate("/matches"),
      badge: inboxBadge,
    },
  ];

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-10 px-8 py-0"
      style={{
        width: "calc(100% - 32px)",
        maxWidth: 358,
        height: 66,
        background:
          "linear-gradient(175deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        boxShadow: "inset 0px 1px 0px 1px rgba(255,255,255,0.24)",
        borderRadius: 26,
        outline: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(10px)",
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.paths.some((p) => location.pathname.startsWith(p));
        return (
          <button
            key={tab.label}
            onClick={tab.onClick}
            className="relative flex items-center justify-center"
            style={{ flex: 1 }}
            aria-label={tab.label}
          >
            <Icon
              className="w-5 h-5"
              style={{ color: active ? "#C6A02C" : "#5F5C57" }}
              strokeWidth={1.6}
            />
            {tab.badge ? (
              <span
                className="absolute -top-1 -right-1 flex items-center justify-center text-[9px] font-bold rounded-full"
                style={{
                  minWidth: 14,
                  height: 14,
                  padding: "0 3px",
                  background: "#C6A02C",
                  color: "#2A2005",
                }}
              >
                {tab.badge > 9 ? "9+" : tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
