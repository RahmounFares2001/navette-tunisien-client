import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CurrencySwitcher from '../currency/CurrencySwitcher';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    // document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', key: 'home' },
    { path: '/transfers', key: 'transfers' },
    { path: '/excursions', key: 'excursions' },
    { path: '/about', key: 'about' },
    { path: '/contact', key: 'contact' },
  ];

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇹🇳' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <nav className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            onClick={() => window.scrollTo(0, 0)}
            className="flex items-center space-x-3 rtl:space-x-reverse hover:scale-105 transition-transform"
          >
            <div className="bg-orange-600 text-primary-foreground px-2 py-1 rounded font-bold text-sm">
              NAVETTE <span className='hidden sm:inline' >AEROPORT </span>
              <span className='text-yellow-300'> TUNISIE</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
            <div className="hidden md:flex items-center space-x-8 
               pr-14 rtl:pl-32 rtl:space-x-reverse" >
            {navLinks.map(({ path, key }) => (
              <Link
                key={path}
                to={path}
                onClick={() => window.scrollTo(0, 0)}
                className={`transition-colors duration-300 hover:text-primary font-medium
                  text-sm ${
                  isActive(path) ? 'text-primary border-b-2 border-primary py-1' : 'text-foreground'
                }`}
              >
                {t(`navigation.${key}`)}
              </Link>
            ))}
            </div>

            <CurrencySwitcher />

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" 
                      className="flex items-center space-x-1 rtl:space-x-reverse">
                  <Globe className="h-3 w-3" />
                  <span className="hidden lg:inline">{currentLanguage.code.toUpperCase()}</span>
                  <span className="lg:hidden">{currentLanguage.flag}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={i18n.language === 'ar' ? 'start' : 'end'} className="min-w-[150px]">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`flex items-center space-x-2 rtl:space-x-reverse cursor-pointer ${
                      i18n.language === lang.code ? 'bg-muted' : ''
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin Link */}
            {/* <Link
              to="/admin"
              className="bg-accent text-accent-foreground px-2 py-1 rounded text-sm hover:opacity-90 transition-opacity"
            >
              {t('navigation.admin')}
            </Link> */}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2 rtl:space-x-reverse">
            <CurrencySwitcher />

            {/* Mobile Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={i18n.language === 'ar' ? 'start' : 'end'}>
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer"
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden animate-fade-in">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-border">
              {navLinks.map(({ path, key }) => (
                <Link
                  key={path}
                  to={path}
                  className={`block px-3 py-2 rounded-md font-medium transition-colors text-right ${
                    isActive(path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                  onClick={() => {
                      setIsOpen(false);
                      window.scrollTo(0, 0); }}
                  >
                  {t(`navigation.${key}`)}
                </Link>
              ))}
              {/* <div className='w-full flex items-center justify-center pt-5' >
                <Link
                  to="/admin"
                  className="w-2/3 py-2 rounded-md text-sm
                          bg-blue-500 text-accent-foreground font-medium text-center"
                  onClick={() => setIsOpen(false)}
                >
                  {t('navigation.admin')}
                </Link>
              </div> */}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;