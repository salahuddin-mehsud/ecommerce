import { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon, ShoppingCart, Globe, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAdmin } from '../context/AdminContext';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import logo from '../assets/logo.webp';
import { Flame } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { getCartItemsCount } = useCart();
  const { currency, setCurrency, currencyOptions } = useCurrency();
  const { admin, logout } = useAdmin();
  const [hasHotDeals, setHasHotDeals] = useState(false);
  const [showHotDealsBanner, setShowHotDealsBanner] = useState(false);
  const navigate = useNavigate();


  const navigationItems = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/hot-deals", label: "Deals" },
    { href: "/about", label: "About" },
  ];

  // Add admin link if logged in
  if (admin) {
    navigationItems.push({ href: "/admin/dashboard", label: "Admin Dashboard" });
  }

  // Check for active hot deals
  useEffect(() => {
    const checkHotDeals = async () => {
      try {
        const deals = await productAPI.getHotDeals();
        setHasHotDeals(deals.length > 0);
        setShowHotDealsBanner(deals.length > 0);
      } catch (error) {
        console.error('Error checking hot deals:', error);
        setHasHotDeals(false);
      }
    };

    checkHotDeals();
  }, []);

  const handleBannerClick = () => {
    navigate('/hot-deals');
  };

  const handleCloseBanner = (e) => {
    e.stopPropagation();
    setShowHotDealsBanner(false);
  };

  const handleAdminLogout = () => {
    logout();
    navigate('/');
  };

  // Helper: conditional classes for dark / light
  const navBg = isDark ? 'bg-black text-white border-b border-gray-800' : 'bg-white text-gray-900 border-b border-gray-200';
  const smallText = 'text-sm';

  return (
    <div className="sticky top-0 z-50">
      {/* Hot Deals Banner - Remove max-width constraint */}
      {showHotDealsBanner && hasHotDeals && (
        <div
          className="bg-gradient-to-r from-red-600 to-red-500 text-black py-2 px-4 cursor-pointer hover:bg-yellow-500 transition-all duration-200"
          onClick={handleBannerClick}
        >
          <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between relative">
            <div className="flex-1 text-center">
              <span className="text-[8px] md:text-sm font-semibold text-sm flex items-center justify-center">
               <Flame/>  Hot deals available for limited time! Grab these items quickly before they are gone!
              </span>
            </div>
            <button
              onClick={handleCloseBanner}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-800 transition-colors flex-shrink-0"
              aria-label="Close banner"
            >
              <X size={20} className="cursor-pointer hover:text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation Bar - Remove max-width constraint */}
      <nav className={`${navBg} w-full`}>
        <div className="px-4 sm:px-6 lg:px-20">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Section: Logo + Navigation */}
            <div className="flex items-center flex-1">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center">
                  <img
                    src={logo}
                    alt="Daily"
                    className="h-18 w-auto object-contain"
                  />
                </Link>
              </div>

              {/* Desktop Menu - Aligned to start after logo */}
              <div className="hidden md:flex items-center ml-0">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="
                      font-[Inter]
                      text-sm
                      font-medium
                      tracking-wide
                      text-gray-400
                      hover:text-white
                      transition-colors
                      mr-4
                      last:mr-0"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Section: Controls */}
            <div className="hidden md:flex items-center">
              <div className="flex items-center space-x-6">
                {/* Currency Selector */}
                <div className="relative">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={`
                      ${smallText} 
                      appearance-none 
                      bg-transparent 
                      ${isDark ? 'text-gray-300' : 'text-gray-700'} 
                      border border-transparent 
                      focus:outline-none 
                      pr-8 pl-3 py-1.5
                      rounded-md
                      ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
                      transition-colors
                    `}
                  >
                    {currencyOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.code} ({option.symbol})
                      </option>
                    ))}
                  </select>
                  <Globe size={16} className={`absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className={`
                    p-2 
                    rounded-md 
                    ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'} 
                    transition-colors
                  `}
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Cart Icon */}
                <Link 
                  to="/cart" 
                  className={`
                    relative 
                    p-2 
                    rounded-md 
                    ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'} 
                    transition-colors
                  `}
                >
                  <ShoppingCart size={20} />
                  {getCartItemsCount() > 0 && (
                    <span className="
                      absolute 
                      -top-1 
                      -right-1 
                      bg-amber-500 
                      text-white 
                      text-xs 
                      rounded-full 
                      w-5 h-5 
                      flex 
                      items-center 
                      justify-center
                      font-medium
                    ">
                      {getCartItemsCount()}
                    </span>
                  )}
                </Link>

                {/* Admin / Login */}
                {admin ? (
                  <div className="relative group">
                    <button className="
                      flex 
                      items-center 
                      space-x-2 
                      bg-amber-500 
                      text-white 
                      px-4 
                      py-2 
                      rounded-md 
                      hover:bg-amber-600 
                      transition-colors
                    ">
                      <User size={18} />
                      <span className="text-sm font-medium">Admin</span>
                    </button>
                    <div className="
                      absolute 
                      right-0 
                      mt-2 
                      w-56 
                      bg-white 
                      dark:bg-gray-800 
                      rounded-lg 
                      shadow-lg 
                      opacity-0 
                      invisible 
                      group-hover:opacity-100 
                      group-hover:visible 
                      transition-all 
                      duration-150 
                      z-50
                      overflow-hidden
                    ">
                      <div className="py-2">
                        <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                          Logged in as: {admin.email}
                        </div>
                        <Link
                          to="/admin/dashboard"
                          className="
                            block 
                            px-4 
                            py-2 
                            text-sm 
                            text-gray-700 
                            dark:text-gray-300 
                            hover:bg-gray-100 
                            dark:hover:bg-gray-700
                            transition-colors
                          "
                        >
                          Dashboard
                        </Link>
                        <button
                          onClick={handleAdminLogout}
                          className="
                            block 
                            w-full 
                            text-left 
                            px-4 
                            py-2 
                            text-sm 
                            text-red-600 
                            hover:bg-gray-100 
                            dark:hover:bg-gray-700
                            transition-colors
                          "
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-6">
                    <Link
                      to="/admin/login"
                      className={`
                        ${smallText} 
                        font-[Inter]
                        font-medium
                        tracking-wide
                        ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}
                        transition-colors
                      `}
                    >
                      Login
                    </Link>
                    <button
                      onClick={() => {
                        const notifySection = document.getElementById('notify');
                        if (notifySection) {
                          notifySection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`
                        ${smallText} 
                        px-4 
                        py-2 
                        font-[Inter]
                        font-medium
                        tracking-wide 
                        rounded-md 
                        ${isDark 
                          ? 'bg-white text-black hover:bg-gray-200' 
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                        }
                        transition-colors
                        whitespace-nowrap
                      `}
                    >
                      Notify Me
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-4">
              <Link to="/cart" className="relative p-2">
                <ShoppingCart size={22} className={isDark ? 'text-gray-200' : 'text-gray-700'} />
                {getCartItemsCount() > 0 && (
                  <span className="
                    absolute 
                    -top-1 
                    -right-1 
                    bg-amber-500 
                    text-white 
                    text-[10px] 
                    rounded-full 
                    w-5 h-5 
                    flex 
                    items-center 
                    justify-center
                  ">
                    {getCartItemsCount()}
                  </span>
                )}
              </Link>

              <button
                onClick={toggleTheme}
                className="p-2"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={20} className="text-white" /> : <Moon size={20} className="text-gray-700" />}
              </button>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${isDark ? 'text-gray-200' : 'text-gray-700'} p-2`}
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className={`${isDark ? 'bg-black text-white' : 'bg-white text-gray-900'} md:hidden fixed inset-0 z-40 pt-20`}>
            <div className="flex flex-col h-full px-4 sm:px-6">
              {/* Close button */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className={`${isDark ? 'text-gray-200' : 'text-gray-700'} p-2`}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Currency Selector for Mobile */}
              <div className="w-full mb-8 mt-4">
                <label className="block text-sm font-medium mb-2">
                  <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Currency</span>
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="
                    w-full 
                    bg-gray-200 
                    dark:bg-gray-700 
                    text-gray-800 
                    dark:text-gray-200 
                    py-3 
                    px-4 
                    rounded-lg 
                    focus:outline-none 
                    focus:ring-2 
                    focus:ring-amber-500
                  "
                >
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.code} ({option.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Menu Items */}
              <div className="flex flex-col space-y-6 w-full">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`
                      w-full 
                      text-left 
                      ${isDark ? 'text-gray-200' : 'text-gray-700'} 
                      hover:${isDark ? 'text-white' : 'text-gray-900'} 
                      text-lg 
                      font-medium
                      py-3
                      border-b 
                      ${isDark ? 'border-gray-800' : 'border-gray-200'}
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Admin Login/Logout for Mobile */}
                {admin ? (
                  <>
                    <div className="text-gray-400 text-sm py-2">
                      Logged in as: {admin.email}
                    </div>
                    <button
                      onClick={() => {
                        handleAdminLogout();
                        setIsOpen(false);
                      }}
                      className="
                        bg-red-500 
                        text-white 
                        px-8 
                        py-3 
                        rounded-lg 
                        hover:bg-red-600 
                        font-medium
                        transition-colors
                        mt-4
                      "
                    >
                      Logout Admin
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-4 mt-8">
                    <Link
                      to="/admin/login"
                      onClick={() => setIsOpen(false)}
                      className="
                        text-center
                        bg-transparent 
                        border-2 
                        border-gray-900 
                        dark:border-white 
                        text-gray-900 
                        dark:text-white 
                        px-8 
                        py-3 
                        rounded-lg 
                        hover:bg-gray-900 
                        dark:hover:bg-white 
                        hover:text-white 
                        dark:hover:text-gray-900 
                        font-medium
                        transition-colors
                      "
                    >
                      Login
                    </Link>
                    
                    <button
                      onClick={() => {
                        const notifySection = document.getElementById('notify');
                        if (notifySection) {
                          notifySection.scrollIntoView({ behavior: 'smooth' });
                        }
                        setIsOpen(false);
                      }}
                      className="
                        bg-transparent 
                        cursor-pointer 
                        border-2 
                        border-gray-900 
                        dark:border-white 
                        text-gray-900 
                        dark:text-white 
                        px-8 
                        py-3 
                        rounded-lg 
                        hover:bg-gray-900 
                        dark:hover:bg-white 
                        hover:text-white 
                        dark:hover:text-gray-900 
                        font-medium
                        transition-colors
                      "
                    >
                      Notify Me
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom section */}
              <div className="mt-auto py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">Daily &copy; 2025</p>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;