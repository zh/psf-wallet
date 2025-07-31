import { useLocation, useNavigate } from 'react-router-dom';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  const navItems = [
    { path: '/', label: 'Home', ariaLabel: 'Home page' },
    { path: '/tokens', label: 'Tokens', ariaLabel: 'View and manage tokens' },
    { path: '/send', label: 'Send', ariaLabel: 'Send cryptocurrency' },
    { path: '/tools', label: 'Tools', ariaLabel: 'App tools and settings' }
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="bottom-navigation">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => handleNavigate(item.path)}
          className={`nav-item accessible-focus ${currentPath === item.path ? 'active' : ''}`}
          aria-label={item.ariaLabel}
        >
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNavigation;