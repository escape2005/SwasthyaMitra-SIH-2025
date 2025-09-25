import React, { useState } from 'react';
import { User, UserCheck, Settings, Info, Phone, Menu, X } from 'lucide-react';
import { useRouter, usePathname } from 'expo-router';

// The usePathname hook is crucial for getting the current route
// The useNavigation hook helps in programmatic navigation

const SideMenuBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { icon: User, label: 'Profile', id: 'profile', router: '/(patient)/profile' },
    { icon: UserCheck, label: 'Doctors', id: 'doctors', router: '/(patient)/doctors' },
    { icon: Settings, label: 'Settings', id: 'settings', router: '/(patient)/settings' },
    { icon: Info, label: 'About Us', id: 'about', router: '/about' },
    { icon: Phone, label: 'Emergency Contacts', id: 'emergency', router: '/sos' },
  ];

interface MenuItem {
    icon: React.ElementType;
    label: string;
    id: string;
    router: string;
}

const handleNavigation = (route: string): void => {
    router.push(route as any);
};

  return (
    <div className="flex h-screen bg-transparent">
      {/* Sidebar */}
      <div
        className={`${isOpen ? 'w-64' : 'w-16'}
          bg-gradient-to-b from-[#E6F7FF] to-[#007BFF] 
          text-[#001F3F] transition-all duration-300 ease-in-out 
          shadow-xl relative z-50`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#001F3F]/20">
          {isOpen && <h2 className="text-xl font-bold">JeevanSetu</h2>}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-[#001F3F]/10 transition-colors"
          >
            {isOpen ? <X size={20} className="text-[#001F3F]" /> : <Menu size={20} className="text-[#001F3F]" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="mt-6">
          <ul className="space-y-2 px-3">
            {menuItems.map((item) => {
              const isActive = pathname === item.router;
              const IconComponent = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigation(item.router)}
                    className={`
                      w-full flex items-center px-3 py-3 rounded-lg 
                      transition-all duration-200
                      ${isActive
                        ? 'bg-[#001F3F]/10 text-[#001F3F] font-bold shadow-md'
                        : 'text-[#001F3F]/80 hover:bg-[#001F3F]/5 hover:text-[#001F3F]'
                      }
                    `}
                    title={!isOpen ? item.label : ''}
                  >
                    <IconComponent size={20} className="min-w-[20px]" />
                    {isOpen && (
                      <span className="ml-3 text-sm font-medium">
                        {item.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {isOpen && (
          <div className="absolute bottom-4 left-4 right-4 text-xs text-[#001F3F]/60 text-center">
            <p>© 2025 JeevanSetu</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideMenuBar;