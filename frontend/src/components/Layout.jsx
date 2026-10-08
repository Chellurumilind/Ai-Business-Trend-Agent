import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Lightbulb, Moon, ReceiptText, Sun } from 'lucide-react';

const Layout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: ReceiptText },
    { path: '/insights', label: 'AI Insights', icon: Lightbulb },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-600"><LayoutDashboard className="h-6 w-6 text-white" /></div>
            <div><h1 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">Business Trend Agent</h1><p className="text-xs text-gray-500 dark:text-gray-400">AI-Powered Analytics</p></div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/transactions' && location.pathname === '/add');
              return <Link key={item.path} to={item.path} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}><Icon className="h-4 w-4" />{item.label}</Link>;
            })}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden text-right text-xs sm:block"><p className="font-semibold text-gray-700 dark:text-gray-200">Local workspace</p><p className="text-gray-500">No sign-in required</p></div>
            <button onClick={() => setDarkMode(!darkMode)} className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600" aria-label="Toggle dark mode">{darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" />}</button>
          </div>
        </div>
        <nav className="flex overflow-x-auto border-t border-gray-100 px-4 py-2 md:hidden dark:border-gray-700">{navItems.map((item) => { const Icon = item.icon; const isActive = location.pathname === item.path; return <Link key={item.path} to={item.path} className={`mr-2 flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 dark:text-gray-300'}`}><Icon className="h-4 w-4" />{item.label}</Link>; })}</nav>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      <footer className="mt-auto border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"><div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">Built with FastAPI, React, and OpenAI or Gemini © 2026</div></footer>
    </div>
  );
};

export default Layout;
