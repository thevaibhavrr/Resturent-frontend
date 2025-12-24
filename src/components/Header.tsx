import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent, useSpring } from 'framer-motion';
import { Menu, LogOut } from 'lucide-react';
import { getCurrentUser, logout } from '../utils/auth';

interface HeaderProps {
  onToggleMenu: () => void;
  onLogout?: () => void;
}

export default function Header({ onToggleMenu, onLogout }: HeaderProps) {
  const user = getCurrentUser();
  
  // Get restaurant name from localStorage settings
  const [restaurantName, setRestaurantName] = useState(() => {
    const settings = localStorage.getItem('restaurantSettings');
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        return parsedSettings.name || 'Restaurant Managment';
      } catch {
        return 'Restaurant Managment';
      }
    }
    return 'Restaurant Managment';
  });

  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);
  const { scrollY } = useScroll();
  const y = useSpring(0, { stiffness: 400, damping: 36 });

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const last = lastYRef.current;
    if (latest > last && latest > 10) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    lastYRef.current = latest;
  });

  useEffect(() => {
    y.set(hidden ? -100 : 0);
  }, [hidden, y]);

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
    <motion.header style={{ y }} className={`fixed top-0 left-0 w-full z-50 bg-card border-b shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20"> {/* increased header height */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-transparent text-primary-foreground flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.png"
                  alt="logo"
                  className="w-12 h-12 object-contain "
                />
              </div>
              <div>
                <div className="text-lg font-semibold">VR Billing</div>
                <div className="text-xs text-muted-foreground">{restaurantName}</div>
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
    </motion.header>
  );
}
