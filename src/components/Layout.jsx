import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { CalendarDays, Wallet, Ruler, User } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

export default function Layout() {
  const { unreadCount } = useNotifications();

  return (
    <div className="min-h-screen bg-brand-gray pb-20 max-w-md mx-auto relative shadow-2xl overflow-hidden">
      <div className="h-screen overflow-y-auto bg-brand-white">
        <Outlet />
      </div>
      
      <nav className="fixed bottom-0 w-full max-w-md bg-brand-white border-t border-brand-border flex justify-around items-center py-4 px-2 z-40">
        <NavItem to="/" icon={<CalendarDays size={20} />} label="Agenda" />
        <NavItem 
          to="/finance" 
          icon={
            <div className="relative">
              <Wallet size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-brand-white font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
          } 
          label="Finanças" 
        />
        <NavItem to="/measurements" icon={<Ruler size={20} />} label="Medidas" />
        <NavItem to="/profile" icon={<User size={20} />} label="Perfil" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex flex-col items-center gap-1 transition-colors ${
          isActive ? 'text-brand-black' : 'text-brand-muted hover:text-brand-black'
        }`
      }
    >
      {icon}
      <span className="text-[9px] uppercase tracking-widest font-semibold">{label}</span>
    </NavLink>
  );
}
