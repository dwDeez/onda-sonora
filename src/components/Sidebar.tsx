import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

export default function Sidebar() {
  const location = useLocation();
  const { currentUser, users, setCurrentUser } = useUser();

  const navItems = [
    { path: '/', label: 'THE AIRLOCK', icon: 'home' },
    { path: '/void', label: 'THE VOID', icon: 'mic' },
    { path: '/archive', label: 'THE ARCHIVE', icon: 'history' },
    { path: '/terminal', label: 'THE TERMINAL', icon: 'terminal' },
    { path: '/studio', label: 'THE STUDIO', icon: 'tune' },
  ];

  if (currentUser?.role === 'ADMIN') {
    navItems.push({ path: '/admin', label: 'ADMIN PANEL', icon: 'admin_panel_settings' });
  }


  const currentContext = location.state?.context;

  const handleLogout = () => {
    localStorage.removeItem('last_user_id');
    window.location.href = '/welcome';
  };

  return (
    <aside className="hidden md:flex flex-col w-[280px] h-full bg-[#111815] border-r border-[#1f2b25] shrink-0 z-20">
      <div className="flex flex-col h-full justify-between p-6">
        <div className="flex flex-col gap-8">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full size-12 ring-2 ring-[#06f994]/30"
                style={{ backgroundImage: `url("${currentUser.avatar}")` }}
              ></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-[#111815]"></div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-white text-lg font-bold tracking-tight">{currentUser.name}</h1>
                <button
                  onClick={() => {
                    const nextUser = users.find(u => u.id !== currentUser.id) || users[0];
                    if (nextUser) setCurrentUser(nextUser);
                  }}
                  className="p-1 text-muted hover:text-primary transition-colors"
                  title="Switch User"
                >
                  <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                </button>
              </div>
              <p className="text-primary text-xs font-mono tracking-wider">ONLINE // SYNCED</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  state={{ context: currentContext }}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${isActive
                    ? 'bg-[#1f2b25] border border-primary/20 shadow-neon text-white'
                    : 'hover:bg-[#1f2b25] text-[#9bbbae] hover:text-white'
                    }`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'}`}>
                    {item.icon}
                  </span>
                  <span className={`text-sm tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <div className="px-4 py-4 rounded-xl bg-gradient-to-br from-[#1f2b25] to-transparent border border-[#2a3830]">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs text-[#9bbbae] font-mono">WEEKLY GOAL</span>
              <span className="text-primary text-xs font-bold">{currentUser.weekly_goal}%</span>
            </div>
            <div className="w-full bg-[#111815] rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${currentUser.weekly_goal}%` }}></div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl h-10 px-4 bg-[#1f2b25] hover:bg-[#2a3830] text-[#9bbbae] hover:text-white text-sm font-bold tracking-wide transition-all border border-transparent hover:border-[#3a4d42]"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>DISCONNECT</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
