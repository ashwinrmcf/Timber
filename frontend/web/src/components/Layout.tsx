import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutGrid, HardDrive, Wallet, Settings, FolderOpen, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo2.png';

const SidebarItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-none border-l-2 transition-all duration-200 group ${isActive
                ? 'border-white bg-white/5 text-white'
                : 'border-transparent text-silver-400 hover:text-white hover:bg-white/5'
            }`
        }
    >
        <Icon size={18} className="group-hover:scale-110 transition-transform" />
        <span className="font-medium tracking-wide text-sm">{label}</span>
    </NavLink>
);

export default function Layout() {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();

    // Map paths to breadcrumb titles
    const getPageTitle = (path: string) => {
        if (path === '/') return 'Dashboard';
        if (path.startsWith('/files')) return 'My Files';
        if (path.startsWith('/nodes')) return 'Node Network';
        if (path.startsWith('/wallet')) return 'Wallet';
        if (path.startsWith('/settings')) return 'Settings';
        return 'Timber Cloud';
    };

    return (
        <div className="flex h-screen bg-canvas text-white overflow-hidden font-sans selection:bg-silver-500 selection:text-black">

            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-64 bg-black border-r border-silver-800 h-full">
                {/* Brand Area */}
                <div className="h-24 border-b border-silver-800 flex items-center px-6 gap-3">
                    <img src={logo} alt="Timber Cloud" className="h-10 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                    <div className="flex flex-col">
                        <span className="text-xl font-bold tracking-widest text-white font-display leading-none">TIMBER</span>
                        <span className="text-[0.65rem] text-silver-400 font-mono tracking-[0.25em] uppercase ml-0.5">CLOUD</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 flex flex-col gap-1">
                    <div className="text-silver-600 text-[10px] font-mono uppercase tracking-[0.2em] px-6 mb-3 mt-2">Platform</div>
                    <SidebarItem to="/" icon={LayoutGrid} label="Dashboard" />
                    <SidebarItem to="/files" icon={FolderOpen} label="My Files" />
                    <SidebarItem to="/nodes" icon={HardDrive} label="Node Network" />

                    <div className="text-silver-600 text-[10px] font-mono uppercase tracking-[0.2em] px-6 mb-3 mt-8">Account</div>
                    <SidebarItem to="/wallet" icon={Wallet} label="Wallet" />
                    <SidebarItem to="/settings" icon={Settings} label="Settings" />
                </nav>

                {/* User Profile / Footer */}
                <div className="p-4 border-t border-silver-800">
                    <div className="flex items-center gap-3 p-3 border border-transparent hover:border-silver-800 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 bg-silver-800 flex items-center justify-center text-xs font-mono text-silver-200 group-hover:bg-white group-hover:text-black transition-colors">
                            0x
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-silver-200 group-hover:text-white">0x12...4A</span>
                            <span className="text-xs text-silver-600">Pro Plan</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative bg-canvas">

                {/* Header */}
                <header className="h-16 border-b border-silver-800 bg-black/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden text-silver-400" onClick={() => setIsMobileOpen(!isMobileOpen)}>
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-3 md:hidden">
                            <img src={logo} alt="Timber" className="h-8 w-auto drop-shadow-lg" />
                        </div>
                        <h2 className="text-lg font-medium text-white font-display tracking-wide hidden md:block">{getPageTitle(location.pathname)}</h2>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Stats Config */}
                        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-silver-500">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>NET: ONLINE</span>
                            </div>
                            <span>v0.1.0-alpha</span>
                        </div>
                    </div>
                </header>

                {/* Page Content (Scrollable) */}
                <main className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-7xl mx-auto h-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                                className="h-full"
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>

        </div>
    );
}
