import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { getCurrentUser, logout } from '../utils/auth';

interface HeaderProps {
  onToggleMenu: () => void;
  onLogout?: () => void;
}

export default function Header({ onToggleMenu, onLogout }: HeaderProps) {
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
    else window.location.reload();
  };

  const handleToggle = () => {
    // Call the provided toggle callback so App can control sidebar state
    try {
      if (onToggleMenu) onToggleMenu();
    } catch (e) {
      // fallback: emit legacy event
      try {
        window.dispatchEvent(new CustomEvent('toggleSidebar'));
      } catch (err) {
        // ignore
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-card border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20"> {/* increased header height */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-transparent text-primary-foreground flex items-center justify-center overflow-hidden">
                <img
                  src="https://img.freepik.com/premium-vector/blue-symbol-that-is-white-background_1061618-334.jpg"
                  alt="logo"
                  className="w-12 h-12 object-cover"
                />
              </div>
              <div>
                <div className="text-lg font-semibold">Restaurant Management</div>
                <div className="text-xs text-muted-foreground">{user?.restaurantName || 'Your Restaurant'}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3" style={{ zIndex: 60 }}>
            {/* Use a native button to ensure clicks aren't swallowed by overlays */}
            <button
              type="button"
              onClick={handleToggle}
              aria-label="Open menu"
              className="p-2 rounded-md hover:bg-muted/50 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>

        
          </div>
        </div>
      </div>
    </header>
  );
}
