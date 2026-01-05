import { useNavigate, useLocation } from "react-router-dom";

export const BottomNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { name: "Home", icon: "dashboard", path: "/dashboard" },
        { name: "Roadmap", icon: "map", path: "/roadmap" },
        { name: "Inbox", icon: "mail", path: "/requests" },
        { name: "Matches", icon: "chat_bubble_outline", path: "/matches" },
        { name: "Profile", icon: "person_outline", path: "/founder-input" },
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/10 pb-8 pt-4 px-8 flex justify-between items-center z-50">
            {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                    <div
                        key={item.name}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center gap-1.5 group cursor-pointer transition-colors ${active ? 'text-white' : 'text-gray-600 hover:text-white'}`}
                    >
                        <span className={`material-symbols-outlined transition-transform ${active ? '' : 'group-hover:-translate-y-0.5'}`}>
                            {item.icon}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {item.name}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
