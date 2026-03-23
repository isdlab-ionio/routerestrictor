import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Map, List, LayoutDashboard, Download, Menu, X } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Map', icon: Map },
  { to: '/restrictions', label: 'Restrictions', icon: List },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/export', label: 'Export', icon: Download },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <img src="/corfu-logo.png" alt="Municipality of Corfu" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-white">RouteRestrictor</h1>
              <p className="text-xs text-slate-400">
                Corfu Street Access Management
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              end={to === '/'}
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-700 px-6 py-4 flex items-center gap-2">
          <img src="/corfu-logo.png" alt="" className="h-6 w-auto opacity-50" />
          <p className="text-xs text-slate-500">
            Δήμος Κεντρικής Κέρκυρας<br/>και Διαποντίων Νήσων
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar for mobile */}
        <header className="flex items-center border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="ml-3 text-lg font-semibold text-slate-800">
            RouteRestrictor
          </h1>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
