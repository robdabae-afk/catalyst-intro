import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Map, Mail, MessageSquare, User, DollarSign } from "lucide-react";

interface BottomNavigationProps {
    userType?: 'founder' | 'investor';
}

export const BottomNavigation = ({ userType }: BottomNavigationProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { name: "Home", icon: LayoutDashboard, path: "/dashboard" },
        // Replace Inbox/Requests with Portal for Investors
        userType === 'investor'
            ? { name: "Portal", icon: DollarSign, path: "/portal" }
            : { name: "Inbox", icon: Mail, path: "/requests" },
        { name: "Matches", icon: MessageSquare, path: "/matches" },
        ...(userType !== 'investor'
            ? [{ name: "Profile", icon: User, path: "/founder-input" }]
            : [])
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full bg-black/95 backdrop-blur-2xl border-t border-white/5 pb-8 pt-4 px-8 flex justify-between items-center z-50">
            {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;

                return (
                    <div
                        key={item.name}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center gap-2 group cursor-pointer transition-all duration-300 ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <div className={`relative transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:-translate-y-1'}`}>
                            <Icon
                                size={22}
                                strokeWidth={active ? 2.5 : 2}
                                className={`transition-all duration-300 ${active ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : ''}`}
                            />
                            {active && (
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                            )}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${active ? 'opacity-100 mt-1' : 'opacity-0 scale-95'}`}>
                            {item.name}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
