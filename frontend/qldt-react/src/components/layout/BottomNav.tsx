import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  shortName?: string;
  roles?: ('Owner' | 'BranchManager' | 'Teacher' | 'Parent')[]; // Roles allowed to see this item
  isManagement?: boolean; // If true, show as management menu
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    shortName: 'Trang chủ'
  },
  {
    name: 'Lớp học',
    path: '/classes',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
  },
  {
    name: 'Buổi học',
    path: '/lessons',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
  },
  {
    name: 'Nhận xét',
    path: '/comments',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    name: 'Bài kiểm tra',
    path: '/exams',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    shortName: 'Kiểm tra'
  },
  {
    name: 'Quản lý',
    path: '/users',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    shortName: 'Quản lý',
    roles: ['Owner', 'BranchManager', 'Teacher'],
    isManagement: true
  },
];

const managementSubMenus: NavItem[] = [
  { name: 'Người dùng', path: '/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { name: 'Gán phụ huynh', path: '/parents/assign', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { name: 'Chi nhánh', path: '/branches', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', roles: ['Owner', 'BranchManager'] },
  { name: 'Học sinh', path: '/students', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', roles: ['Owner', 'BranchManager', 'Teacher'] },
  { name: 'Giáo viên', path: '/teachers', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm0 0v7m-6.824-2.998a12.083 12.083 0 011.665-6.479L12 14l-5.159 2.553a11.965 11.965 0 01-1.665-6.48zm13.648 0a11.965 11.965 0 01-1.665 6.48L12 14l5.159-2.947a12.076 12.076 0 011.665 6.479z', roles: ['Owner', 'BranchManager'] },
  { name: 'Điểm danh', path: '/attendance', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Lịch học', path: '/schedules', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Link chia sẻ', path: '/shared-links', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
];

export const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [openManagementMenu, setOpenManagementMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true; // No role restriction, show to all
    if (!user) return false; // No user, hide
    return item.roles.includes(user.role);
  });

  // Filter management submenus based on user role
  const filteredManagementMenus = managementSubMenus.filter(item => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const isManagementActive = filteredManagementMenus.some(item =>
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenManagementMenu(false);
      }
    };

    if (openManagementMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openManagementMenu]);

  return (
    <>
      {/* Management Menu Overlay */}
      {openManagementMenu && (
        <div className="lg:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setOpenManagementMenu(false)} />
      )}

      {/* Management Submenu */}
      {openManagementMenu && (
        <div
          ref={menuRef}
          className="lg:hidden fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 max-h-[60vh] overflow-y-auto"
        >
          <div className="p-4 space-y-1">
            {filteredManagementMenus.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpenManagementMenu(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text/70 hover:bg-background hover:text-text'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50 shadow-lg">
        {/* Safe area for iOS devices */}
        <div
          className="flex justify-around items-center"
          style={{
            height: '64px',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}
        >
          {filteredNavItems.map((item) => {
            const isActive = item.isManagement
              ? isManagementActive
              : (location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path)));

            if (item.isManagement) {
              return (
                <button
                  key={item.path}
                  onClick={() => setOpenManagementMenu(!openManagementMenu)}
                  className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all duration-200 cursor-pointer touch-manipulation ${isActive
                    ? 'text-primary'
                    : 'text-gray-600 active:text-primary'
                    }`}
                  aria-label={item.name}
                >
                  <div className={`relative flex flex-col items-center justify-center ${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
                    <svg
                      className={`w-6 h-6 mb-1 ${isActive ? 'text-primary' : 'text-gray-600'}`}
                      fill={isActive ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={isActive ? 2.5 : 2}
                        d={item.icon}
                      />
                    </svg>
                    <span className={`text-[10px] font-medium leading-tight text-center px-1 ${isActive ? 'text-primary font-semibold' : 'text-gray-600'
                      }`}>
                      {item.shortName || item.name}
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full" />
                  )}
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all duration-200 cursor-pointer touch-manipulation ${isActive
                  ? 'text-primary'
                  : 'text-gray-600 active:text-primary'
                  }`}
                aria-label={item.name}
              >
                <div className={`relative flex flex-col items-center justify-center ${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
                  <svg
                    className={`w-6 h-6 mb-1 ${isActive ? 'text-primary' : 'text-gray-600'}`}
                    fill={isActive ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={isActive ? 2.5 : 2}
                      d={item.icon}
                    />
                  </svg>
                  <span className={`text-[10px] font-medium leading-tight text-center px-1 ${isActive ? 'text-primary font-semibold' : 'text-gray-600'
                    }`}>
                    {item.shortName || item.name}
                  </span>
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
