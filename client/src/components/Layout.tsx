import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    CalendarCheck,
    Settings,
    LogOut,
    Menu,
    TrendingUp,
    Dumbbell,
    Clock,
    ShoppingCart,
    Archive,
    Info,
    ChevronDown,
    CircleDollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import DeveloperInfoModal from './DeveloperInfoModal';

interface NavItemProps {
    to: string;
    icon: React.ElementType;
    label: string;
    active: boolean;
}

const NavItem = ({ to, icon: Icon, label, active }: NavItemProps) => (
    <Link
        to={to}
        className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
            active
                ? "bg-gym-primary text-white shadow-lg shadow-gym-primary/20"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
        )}
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </Link>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isDevInfoOpen, setIsDevInfoOpen] = React.useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['SUPERADMIN', 'ADMIN'] },
        { to: '/pos', icon: ShoppingCart, label: 'Tienda', roles: ['SUPERADMIN', 'ADMIN', 'RECEPTION'] },
        { to: '/products', icon: Archive, label: 'Inventario', roles: ['SUPERADMIN', 'ADMIN'] },
        { to: '/equipment', icon: Dumbbell, label: 'Equipamiento', roles: ['SUPERADMIN', 'ADMIN', 'RECEPTION', 'TRAINER'] },
        { to: '/members', icon: Users, label: 'Miembros', roles: ['SUPERADMIN', 'ADMIN', 'RECEPTION', 'TRAINER'] },
        { to: '/attendance', icon: CalendarCheck, label: 'Asistencia', roles: ['SUPERADMIN', 'ADMIN', 'RECEPTION', 'TRAINER'] },
        { to: '/payments', icon: CreditCard, label: 'Ingresos', roles: ['SUPERADMIN', 'ADMIN', 'RECEPTION'] },
        { to: '/expenses', icon: TrendingUp, label: 'Egresos', roles: ['SUPERADMIN', 'ADMIN', 'RECEPTION'] },
        { to: '/cash-flow', icon: CircleDollarSign, label: 'Caja', roles: ['SUPERADMIN', 'ADMIN', 'RECEPTION'] },
        { to: '/plans', icon: TrendingUp, label: 'Planes', roles: ['SUPERADMIN', 'ADMIN'] },
        { to: '/classes', icon: Dumbbell, label: 'Clases', roles: ['SUPERADMIN', 'ADMIN'] },
        { to: '/schedules', icon: Clock, label: 'Horarios', roles: ['SUPERADMIN', 'ADMIN', 'RECEPTION', 'TRAINER'] },
        { to: '/settings', icon: Settings, label: 'Configuración', roles: ['SUPERADMIN', 'ADMIN'] },
    ];

    const filteredNavItems = navItems.filter(item =>
        !item.roles || (user && item.roles.includes(user.role))
    );

    return (
        <div className="min-h-screen bg-gym-dark text-white flex">
            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-black/40 backdrop-blur-xl border-r border-white/5 transition-transform duration-300 lg:relative lg:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-10 h-10 bg-gym-primary rounded-xl flex items-center justify-center font-bold text-xl italic">
                            ei
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">GYM</h1>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {filteredNavItems.map((item) => (
                            <NavItem
                                key={item.to}
                                to={item.to}
                                icon={item.icon}
                                label={item.label}
                                active={location.pathname === item.to}
                            />
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-gym-dark/50 backdrop-blur-md sticky top-0 z-30">
                    <button
                        className="p-2 lg:hidden"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <div className="flex-1 lg:pl-4">
                        <h2 className="text-lg font-semibold">
                            {navItems.find(i => i.to === location.pathname)?.label || 'eiGYM'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Developer Info Button */}
                        <button
                            onClick={() => setIsDevInfoOpen(true)}
                            className="p-2.5 text-gray-400 hover:text-gym-primary hover:bg-white/5 rounded-xl transition-all"
                            title="Acerca de"
                        >
                            <Info size={20} />
                        </button>

                        <div className="w-px h-6 bg-white/10 mx-2" />

                        {/* User Profile and Logout */}
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-3 p-1.5 pl-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10 group"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-white group-hover:text-gym-primary transition-colors leading-tight">{user?.name}</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{user?.role.toLowerCase()}</p>
                                </div>
                                <div className="w-10 h-10 bg-gym-primary/20 rounded-xl flex items-center justify-center font-bold text-gym-primary border border-gym-primary/10">
                                    {user?.name.charAt(0)}
                                </div>
                                <ChevronDown size={16} className={cn("text-gray-500 transition-transform", isUserMenuOpen && "rotate-180")} />
                            </button>

                            {isUserMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-gym-dark border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 border-b border-white/5 sm:hidden">
                                            <p className="text-sm font-bold text-white">{user?.name}</p>
                                            <p className="text-xs text-gray-400 capitalize">{user?.role.toLowerCase()}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 transition-colors"
                                        >
                                            <LogOut size={18} />
                                            <span className="font-bold text-sm">Cerrar Sesión</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-6 overflow-auto">
                    {children}
                </div>

                <footer className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-md flex justify-center items-center">
                    <p className="text-sm text-gray-500 font-medium">
                        Powered by:{' '}
                        <a
                            href="https://eistreaming.net"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gym-primary hover:text-gym-primary/80 transition-colors font-bold"
                        >
                            einteractivo!net
                        </a>
                    </p>
                </footer>

                <DeveloperInfoModal
                    isOpen={isDevInfoOpen}
                    onClose={() => setIsDevInfoOpen(false)}
                />
            </main>
        </div>
    );
};

export default Layout;
