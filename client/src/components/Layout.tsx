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
    DollarSign,
    Sun,
    Moon,
    Star,
    Trophy,
    BarChart3,
    Globe,
    FileText,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import api, { getUploadUrl } from '../services/api';
import DeveloperInfoModal from './DeveloperInfoModal';
import PWAInstallPrompt from './PWAInstallPrompt';

interface NavItemProps {
    to: string;
    icon: React.ElementType;
    label: string;
    active: boolean;
    isSubItem?: boolean;
}

const NavItem = ({ to, icon: Icon, label, active, isSubItem }: NavItemProps) => {
    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-3 transition-all duration-300 group relative",
                isSubItem 
                    ? "py-2 px-4 text-white/60 hover:text-white hover:translate-x-1" 
                    : "flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-center w-full",
                active && !isSubItem
                    ? "bg-gradient-to-br from-gym-primary/90 to-gym-primary text-white shadow-xl shadow-gym-primary/20"
                    : active && isSubItem
                        ? "text-gym-primary font-black"
                        : (!active && !isSubItem) ? "text-white/60 hover:text-white hover:bg-white/5" : ""
            )}
        >
            <Icon size={isSubItem ? 16 : 20} strokeWidth={active ? 2.5 : 2} className={cn("transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")} />
            <span className={cn(
                "uppercase tracking-tighter italic leading-tight transition-all",
                isSubItem ? "text-[10px] font-bold" : "text-[9px] font-black"
            )}>{label}</span>
            {active && !isSubItem && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            )}
        </Link>
    );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isDevInfoOpen, setIsDevInfoOpen] = React.useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
    const [settings, setSettings] = React.useState<any>(null);
    const [licenseStatus, setLicenseStatus] = React.useState<any>(null);

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fetch both in parallel to avoid multiple re-renders and flickering
                const [publicRes, saasRes] = await Promise.all([
                    api.get('/settings/public'),
                    user?.role === 'SUPERADMIN' ? api.get('/saas/settings') : Promise.resolve({ data: {} })
                ]);

                setSettings({
                    ...publicRes.data,
                    ...saasRes.data
                });
            } catch (error) {
                console.error('Error fetching settings for layout:', error);
            }
        };
        const fetchLicense = async () => {
            try {
                const response = await api.get('/settings/license');
                setLicenseStatus(response.data);
            } catch (error) {
                console.error('Error fetching license status:', error);
            }
        };
        fetchSettings();
        fetchLicense();

        // Listen for live updates from Settings page
        window.addEventListener('settingsUpdated', fetchSettings);
        return () => window.removeEventListener('settingsUpdated', fetchSettings);
    }, [user?.role]); // Only re-run if user role changes (e.g. login/logout)

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navGroups = [
        {
            items: [
                { to: '/', icon: LayoutDashboard, label: 'Panel', roles: ['ADMIN'] },
            ]
        },
        {
            label: 'Gestión de Miembros',
            icon: Users,
            items: [
                { to: '/members', icon: Users, label: 'Miembros', roles: ['ADMIN', 'RECEPTION', 'TRAINER'] },
                { to: '/attendance', icon: CalendarCheck, label: 'Asistencia', roles: ['ADMIN', 'RECEPTION', 'TRAINER'] },
                { to: '/attendance-history', icon: Clock, label: 'Historial', roles: ['ADMIN', 'RECEPTION', 'TRAINER'] },
                { to: '/attendance-ranking', icon: Trophy, label: 'Ranking', roles: ['ADMIN', 'RECEPTION', 'TRAINER'] },
                { to: '/attendance-stats', icon: BarChart3, label: 'Estadísticas', roles: ['ADMIN', 'RECEPTION', 'TRAINER'] },
            ]
        },
        {
            label: 'Gestión de Gym',
            icon: Dumbbell,
            items: [
                { to: '/plans', icon: TrendingUp, label: 'Planes', roles: ['ADMIN'] },
                { to: '/trainers', icon: Users, label: 'Entrenadores', roles: ['ADMIN', 'RECEPTION'] },
                { to: '/classes', icon: Dumbbell, label: 'Clases', roles: ['ADMIN'] },
                { to: '/special-classes', icon: Star, label: 'Clases Especiales', roles: ['ADMIN', 'RECEPTION'] },
                { to: '/schedules', icon: Clock, label: 'Horarios', roles: ['ADMIN', 'RECEPTION', 'TRAINER'] },
            ]
        },
        {
            label: 'Operaciones y Tienda',
            icon: ShoppingCart,
            items: [
                { to: '/pos', icon: ShoppingCart, label: 'Tienda', roles: ['ADMIN', 'RECEPTION'] },
                { to: '/products', icon: Archive, label: 'Inventario', roles: ['ADMIN'] },
                { to: '/equipment', icon: Dumbbell, label: 'Equipamiento', roles: ['ADMIN', 'RECEPTION', 'TRAINER'] },
            ]
        },
        {
            label: 'Contabilidad',
            icon: DollarSign,
            items: [
                { to: '/payments', icon: CreditCard, label: 'Ingresos', roles: ['ADMIN', 'RECEPTION'] },
                { to: '/expenses', icon: TrendingUp, label: 'Egresos', roles: ['ADMIN', 'RECEPTION'] },
                { to: '/cash-flow', icon: DollarSign, label: 'Caja', roles: ['ADMIN', 'RECEPTION'] },
                { to: '/reports', icon: FileText, label: 'Reportes', roles: ['ADMIN', 'RECEPTION'] },
            ]
        },
        {
            items: [
                { to: '/saas/gyms', icon: Globe, label: 'SaaS Admin', roles: ['SUPERADMIN'] },
                { to: '/saas/users', icon: ShieldCheck, label: 'Usuarios SaaS', roles: ['SUPERADMIN'] },
            ]
        },
        {
            items: [
                { to: '/settings', icon: Settings, label: 'Configuración', roles: ['ADMIN'] },
            ]
        }
    ];

    const [openGroups, setOpenGroups] = React.useState<string[]>(['Gestión de Miembros', 'Gestión de Gym', 'Operaciones y Tienda', 'Contabilidad']);

    const toggleGroup = (label: string) => {
        setOpenGroups(prev =>
            prev.includes(label)
                ? prev.filter(g => g !== label)
                : [...prev, label]
        );
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-white flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 lg:w-60 bg-[#BE084E] dark:bg-black border-r border-white/5 transition-transform duration-300 lg:relative lg:translate-x-0 font-sans shadow-2xl",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full py-6 px-4 overflow-y-auto custom-scrollbar text-white no-scrollbar">
                    <div className="flex items-center justify-center mb-8 px-2">
                        { (user?.role === 'SUPERADMIN' ? (settings?.saas_logo_url || settings?.gym_logo_url) : settings?.gym_logo_url) ? (
                            <div className="w-full flex items-center justify-center group">
                                <img
                                    src={getUploadUrl(user?.role === 'SUPERADMIN' ? (settings?.saas_logo_url || settings?.gym_logo_url) : settings?.gym_logo_url)}
                                    alt="Logo"
                                    className="max-h-16 w-auto max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = document.getElementById('logo-sidebar-fallback');
                                        if (fallback) fallback.style.display = 'flex';
                                    }}
                                />
                            </div>
                        ) : (
                            <div id="logo-sidebar-fallback" className="flex flex-col items-center gap-1 text-white/40">
                                <Dumbbell size={24} className="text-white/40" />
                            </div>
                        )}
                    </div>

                    <nav className="flex-1 space-y-4">
                        {navGroups.map((group, idx) => {
                            const filteredItems = group.items.filter(item =>
                                !item.roles || (user && item.roles.includes(user.role))
                            );

                            if (filteredItems.length === 0) return null;

                            if (group.label) {
                                const isOpen = openGroups.includes(group.label);
                                const hasActiveChild = filteredItems.some(item => location.pathname === item.to);

                                return (
                                    <div key={group.label} className="space-y-1">
                                        <button
                                            onClick={() => toggleGroup(group.label!)}
                                            className={cn(
                                                "w-full flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-300 group",
                                                hasActiveChild || isOpen ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <group.icon size={20} className={cn("transition-transform duration-300", (hasActiveChild || isOpen) ? "scale-110" : "group-hover:scale-110")} />
                                                <span className="text-[10px] font-black uppercase tracking-widest italic">{group.label}</span>
                                            </div>
                                            <ChevronDown size={14} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
                                        </button>

                                        {isOpen && (
                                            <div className="overflow-hidden animate-in slide-in-from-top-2 duration-300 bg-black/20 rounded-xl mt-1 py-2">
                                                {filteredItems.map((item) => (
                                                    <NavItem
                                                        key={item.to}
                                                        to={item.to}
                                                        icon={item.icon}
                                                        label={item.label}
                                                        active={location.pathname === item.to}
                                                        isSubItem={true}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <div key={`idx-${idx}`} className="space-y-1">
                                    {filteredItems.map((item) => (
                                        <NavItem
                                            key={item.to}
                                            to={item.to}
                                            icon={item.icon}
                                            label={item.label}
                                            active={location.pathname === item.to}
                                        />
                                    ))}
                                </div>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-4 border-t border-white/5">
                        {licenseStatus && user?.role !== 'SUPERADMIN' && (
                            <div className={cn(
                                "p-2 rounded-2xl flex flex-col items-center gap-1 transition-all text-center",
                                licenseStatus.daysRemaining <= 7 ? "bg-red-500/10" : "bg-blue-500/10"
                            )}>
                                <Clock size={16} className={licenseStatus.daysRemaining <= 7 ? "text-red-500" : "text-blue-500"} />
                                <p className="text-[10px] font-black text-white italic leading-tight">
                                    {licenseStatus.daysRemaining}d
                                </p>
                            </div>
                        )}
                    </div>
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
            <main className="flex-1 flex flex-col min-w-0 bg-gym-body-bg dark:bg-slate-950 min-h-screen transition-colors duration-300">
                {licenseStatus && user?.role !== 'SUPERADMIN' && (licenseStatus.daysRemaining <= 3 || licenseStatus.isExpired) && (
                    <div className={cn(
                        "text-white px-4 py-2 text-center text-xs font-bold z-[60] flex items-center justify-center gap-4",
                        licenseStatus.isExpired ? "bg-red-700" : "bg-red-600 animate-pulse"
                    )}>
                        <div className="flex items-center gap-2">
                            <span>⚠️</span>
                            {licenseStatus.isExpired ? (
                                <span>LICENCIA VENCIDA - MODO LECTURA ACTIVADO</span>
                            ) : (
                                <span>SU LICENCIA VENCE EN {licenseStatus.daysRemaining} {licenseStatus.daysRemaining === 1 ? 'DÍA' : 'DÍAS'}</span>
                            )}
                        </div>
                        <a 
                            href="https://wa.me/51952372009" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white text-red-700 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                            <span>RENOVAR AHORA</span>
                        </a>
                    </div>
                )}
                <header className="h-20 flex items-center justify-between px-8 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-slate-950 sticky top-0 z-30 transition-colors duration-300">
                    <button
                        className="p-2 lg:hidden"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
                            {navGroups.flatMap(g => g.items).find(i => i.to === location.pathname)?.label || 'Escritorio'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 text-slate-400 hover:text-gym-primary hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
                            title={theme === 'light' ? 'Activar Modo Oscuro' : 'Activar Modo Claro'}
                        >
                            {theme === 'light' ? <Moon size={20} strokeWidth={2.5} /> : <Sun size={20} strokeWidth={2.5} />}
                        </button>

                        {/* Developer Info Button */}
                        <button
                            onClick={() => setIsDevInfoOpen(true)}
                            className="p-2.5 text-slate-400 hover:text-gym-primary hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
                            title="Acerca de"
                        >
                            <Info size={20} strokeWidth={2.5} />
                        </button>

                        <div className="w-px h-6 bg-gray-100 dark:bg-white/10 mx-2" />

                        {/* User Profile and Logout */}
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-3 p-1.5 pl-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-white/10 group"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-gym-primary transition-colors leading-tight uppercase italic">{user?.name}</p>
                                    <p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-black tracking-widest italic">{user?.role.toLowerCase()}</p>
                                </div>
                                <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex items-center justify-center border-2 border-transparent group-hover:border-gym-primary transition-all">
                                    {/* Placeholder avatar or initial */}
                                    <span className="font-black text-slate-600 dark:text-slate-400 italic uppercase">{user?.name.charAt(0)}</span>
                                </div>
                                <ChevronDown size={14} strokeWidth={2.5} className={cn("text-slate-400 transition-transform", isUserMenuOpen && "rotate-180")} />
                            </button>

                            {isUserMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-50 dark:border-white/5 sm:hidden">
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic">{user?.name}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-black italic">{user?.role.toLowerCase()}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                        >
                                            <LogOut size={18} strokeWidth={2.5} />
                                            <span className="font-black text-xs uppercase tracking-widest italic">Cerrar Sesión</span>
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

                <footer className="p-10 border-t border-gray-50 dark:border-white/5 bg-white dark:bg-slate-950 flex justify-center items-center transition-colors duration-300">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] italic">
                        <span>{settings?.saas_footer_text || 'Powered by:'}</span>
                        {settings?.saas_footer_logo_url ? (
                            <img
                                src={getUploadUrl(settings.saas_footer_logo_url)}
                                alt="SaaS Logo"
                                className="w-5 h-5 object-contain"
                            />
                        ) : (
                            <img
                                src="https://eistreaming.net/wp-content/uploads/2024/01/icono2-1.png"
                                alt="Default Logo"
                                className="w-5 h-5 object-contain opacity-50 grayscale"
                            />
                        )}
                        <a
                            href={settings?.saas_footer_url || 'https://eistreaming.net'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gym-primary hover:text-gym-primary/80 transition-all font-black uppercase tracking-[0.2em] italic"
                        >
                            {settings?.saas_footer_brand || 'einteractivo'}
                        </a>
                    </div>
                </footer>

                <DeveloperInfoModal
                    isOpen={isDevInfoOpen}
                    onClose={() => setIsDevInfoOpen(false)}
                />
                
                <PWAInstallPrompt />
            </main>
        </div>
    );
};

export default Layout;
