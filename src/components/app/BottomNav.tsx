import { useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, Search, MessageSquare, Users } from "lucide-react";

interface BottomNavProps {
  userType?: "founder" | "investor" | null;
  inboxBadge?: number;
}

export function BottomNav({ inboxBadge = 0 }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      icon: LayoutGrid,
      label: "Home",
      paths: ["/app/home", "/home"],
      onClick: () => navigate("/feed"),
    },
    {
      icon: Search,
      label: "People",
      paths: ["/dashboard"],
      onClick: () => navigate("/people/swipe"),
    },
    {
      icon: MessageSquare,
      label: "Messages",
      paths: ["/matches", "/requests"],
      onClick: () => navigate("/messages"),
      badge: inboxBadge,
    },
    {
      icon: Users,
      label: "Connections",
      paths: ["/connections"],
      onClick: () => navigate("/connections"),
    },
  ];

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-10 px-8 py-0"
      style={{
        width: "calc(100% - 32px)",
        maxWidth: 358,
        height: 66,
        background: "rgba(255,255,255,0.94)",
        boxShadow: "0 8px 24px -12px rgba(0,0,0,0.18)",
        borderRadius: 26,
        border: "1px solid #E6E6E3",
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
              style={{ color: active ? "#0B0B0B" : "#74746D" }}
              strokeWidth={active ? 2 : 1.6}
            />
            {tab.badge ? (
              <span
                className="absolute -top-1 -right-1 flex items-center justify-center text-[9px] font-bold rounded-full"
                style={{
                  minWidth: 14,
                  height: 14,
                  padding: "0 3px",
                  background: "#0B0B0B",
                  color: "#FFFFFF",
                  border: "2px solid #FFFFFF",
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
