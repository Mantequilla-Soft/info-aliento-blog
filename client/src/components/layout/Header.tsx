import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useKeychain } from '@/context/KeychainContext';
import { useLanguage } from '@/context/LanguageContext';
import LoginModal from '../modals/LoginModal';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import UserSwitchModal from '@/components/modals/UserSwitchModal';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';

import alientoLogo from '@/assets/aliento-logo.png';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [userSwitchModalOpen, setUserSwitchModalOpen] = useState(false);
  const { isLoggedIn, user, logout } = useKeychain();
  const { t } = useLanguage();
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogin = () => {
    setLoginModalOpen(true);
  };

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm transition-colors duration-200">
        <div className="container mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center flex-shrink-0">
              <div className="flex-shrink-0 mr-1 sm:mr-0">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                  {/* New Aliento logo */}
                  <img 
                    src={alientoLogo} 
                    alt="Aliento Logo" 
                    className="h-9 w-9"
                  />
                  <span className="text-lg font-semibold hidden xs:inline-block">Aliento Witness</span>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                <Link href="/" className={`px-3 py-2 text-sm font-medium ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                  {t('nav.home')}
                </Link>
                <Link href="/witnesses" className={`px-3 py-2 text-sm font-medium ${isActive('/witnesses') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                  {t('nav.witnesses')}
                </Link>
                <Link href="/schedule" className={`px-3 py-2 text-sm font-medium ${isActive('/schedule') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                  {t('nav.schedule') || 'Schedule'}
                </Link>
                <Link href="/about" className={`px-3 py-2 text-sm font-medium ${isActive('/about') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                  {t('nav.about')}
                </Link>
              </nav>
            </div>
            
            {/* Authentication */}
            <div className="flex items-center gap-2">
              <div className="ml-auto flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              
              {!isLoggedIn ? (
                <Button
                  onClick={handleLogin}
                  variant="default"
                  size="sm"
                  className="inline-flex items-center justify-center px-2 py-1 h-8 text-xs"
                >
                  <span className="material-symbols-outlined text-xs mr-1">login</span>
                  <span className="hidden sm:inline">{t('login.withKeychain')}</span>
                  <span className="sm:hidden">{t('login')}</span>
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={user?.profileImage} 
                            alt={user?.username || 'User profile'} 
                          />
                          <AvatarFallback>
                            {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden sm:flex flex-col">
                          <span className="text-sm font-medium">@{user?.username}</span>
                          <span className="text-xs text-muted-foreground">
                            {user?.hivePower} <span className="opacity-70">(own)</span>
                          </span>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <div className="p-2 text-sm">
                      <div className="flex flex-col space-y-1 mb-2">
                        <div className="text-muted-foreground">Own Hive Power:</div>
                        <div className="font-medium">{user?.hivePower}</div>
                      </div>
                      <div className="flex flex-col space-y-1 mb-2">
                        <div className="text-muted-foreground">Effective Hive Power:</div>
                        <div className="font-medium">{user?.effectiveHivePower}</div>
                        <div className="text-xs text-muted-foreground">
                          (includes delegations in/out)
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1 mb-2">
                        <div className="text-muted-foreground">Proxied Hive Power:</div>
                        <div className="font-medium">{user?.proxiedHivePower}</div>
                        <div className="text-xs text-muted-foreground">
                          (power proxied to this account)
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1 mb-2">
                        <div className="text-muted-foreground">Witness Votes:</div>
                        {user?.proxy ? (
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium px-2 py-0.5 rounded-full text-xs">
                              Proxy: @{user.proxy}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="bg-primary/20 text-primary font-medium px-2 py-0.5 rounded-full text-xs">
                              {user?.freeWitnessVotes} free votes
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({30 - (user?.freeWitnessVotes || 0)}/30 used)
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 border-t border-border pt-2">
                        <Link href="/user-stats">
                          <DropdownMenuItem className="cursor-pointer">
                            <span className="material-symbols-outlined text-sm mr-2">person</span>
                            {t('userStats.viewStats')}
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setUserSwitchModalOpen(true)} className="cursor-pointer">
                          <span className="material-symbols-outlined text-sm mr-2">people</span>
                          Switch User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                          <span className="material-symbols-outlined text-sm mr-2">logout</span>
                          {t('logout')}
                        </DropdownMenuItem>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Mobile menu button */}
              <button 
                type="button" 
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                onClick={toggleMobileMenu}
              >
                <span className="sr-only">Open main menu</span>
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        <div 
          className={`md:hidden fixed inset-0 z-40 transform ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out`}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="fixed inset-y-0 right-0 max-w-xs w-full bg-background shadow-xl transform transition-transform duration-300 ease-in-out"
            style={{ width: '80%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-5 border-b border-border">
              <span className="text-lg font-semibold">{t('language')}</span>
              <button 
                type="button" 
                className="text-muted-foreground hover:text-foreground focus:outline-none"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-2 pt-2 pb-3 space-y-1 overflow-y-auto">
              <Link 
                href="/" 
                className={`block px-4 py-3 rounded-md text-base font-medium ${isActive('/') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-primary'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined align-bottom mr-2">home</span>
                {t('nav.home')}
              </Link>
              <Link 
                href="/witnesses" 
                className={`block px-4 py-3 rounded-md text-base font-medium ${isActive('/witnesses') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-primary'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined align-bottom mr-2">supervised_user_circle</span>
                {t('nav.witnesses')}
              </Link>
              <Link 
                href="/schedule" 
                className={`block px-4 py-3 rounded-md text-base font-medium ${isActive('/schedule') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-primary'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined align-bottom mr-2">schedule</span>
                {t('nav.schedule') || 'Schedule'}
              </Link>
              <Link 
                href="/about" 
                className={`block px-4 py-3 rounded-md text-base font-medium ${isActive('/about') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-primary'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined align-bottom mr-2">info</span>
                {t('nav.about')}
              </Link>
              
              {/* Divider */}
              <div className="my-3 border-t border-border"></div>
              
              {/* Account section */}
              <div className="px-4 py-3">
                {!isLoggedIn ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">{t('login.withKeychain')} {t('login.toVoteForWitnesses')}</p>
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogin();
                      }}
                      variant="default"
                      className="w-full"
                    >
                      <span className="material-symbols-outlined mr-2">login</span>
                      {t('login.withKeychain')}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center mb-3">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage 
                          src={user?.profileImage} 
                          alt={user?.username || 'User profile'} 
                        />
                        <AvatarFallback>
                          {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="font-medium">@{user?.username}</div>
                        <div className="text-xs text-muted-foreground flex flex-col gap-1">
                          <div>
                            {user?.hivePower} <span className="opacity-70">(own)</span>
                          </div>
                          <div>
                            {user?.proxiedHivePower} <span className="opacity-70">(proxied)</span>
                          </div>
                          {user?.proxy ? (
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium px-2 py-0.5 rounded-full inline-block mt-1 w-fit">
                              Proxy: @{user.proxy}
                            </span>
                          ) : (
                            <span className="bg-primary/20 text-primary font-medium px-2 py-0.5 rounded-full inline-block mt-1 w-fit">
                              {user?.freeWitnessVotes} free votes
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-3">
                          <Link 
                            href="/user-stats"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-sm text-primary"
                          >
                            {t('userStats.viewStats')}
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive p-0 h-auto"
                            onClick={() => {
                              setMobileMenuOpen(false);
                              handleLogout();
                            }}
                          >
                            {t('logout')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      
      <UserSwitchModal 
        open={userSwitchModalOpen} 
        onClose={() => setUserSwitchModalOpen(false)} 
      />
    </>
  );
}
