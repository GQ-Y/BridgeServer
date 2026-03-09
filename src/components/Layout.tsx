import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Bot, MessageSquare, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: Home, label: '首页', path: '/' },
    { icon: Bot, label: '智能助手', path: '/agents' },
    { icon: MessageSquare, label: 'AI对话', path: '/chat' },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f0f5fa] overflow-hidden font-sans text-slate-800">
      {/* Sidebar - Fixed width, flat design */}
      <aside className="w-64 bg-[#0056b3] text-white flex flex-col z-20 shrink-0">
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-wide leading-tight">路桥通</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 flex flex-col gap-1 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg transition-colors duration-200 group",
                  isActive 
                    ? "bg-white text-[#0056b3]" 
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-[#0056b3]" : "text-blue-200 group-hover:text-white")} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="p-4">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full text-blue-200 hover:text-white transition-colors p-3 rounded-lg hover:bg-white/10"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="text-sm">退出登录</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative bg-[#f5f7fa]">
        {/* Top Header - Flat, no shadow */}
        <header className="h-16 bg-white flex items-center justify-between px-8 z-10">
          <div className="flex items-center">
             <h1 className="text-lg font-bold text-[#0056b3] flex items-center gap-3">
                <span className="bg-[#0056b3] text-white text-xs px-2 py-1 rounded">路桥通</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-700 font-medium">成都路桥AI大模型助手平台</span>
             </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-700">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                <img src={user?.avatar} alt="User" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
           {children}
        </div>
      </main>
    </div>
  );
}
