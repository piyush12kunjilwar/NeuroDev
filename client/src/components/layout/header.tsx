import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // If no user, don't render header
  if (!user) return null;
  
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                onClick={onMobileMenuToggle}
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" />
              </button>
            </div>
            
            {/* Logo on mobile */}
            <div className="flex-shrink-0 flex items-center">
              <div className="md:hidden flex items-center">
                <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" fill="currentColor"/>
                </svg>
                <span className="ml-2 text-xl font-heading font-bold text-dark">NeuroNexus</span>
              </div>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link href="/">
                <a className={`${location === '/' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Dashboard
                </a>
              </Link>
              <Link href="/models">
                <a className={`${location === '/models' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Active Models
                </a>
              </Link>
              <Link href="/community">
                <a className={`${location === '/community' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Community Projects
                </a>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            {/* New contribution button */}
            <div className="flex-shrink-0">
              <Button className="relative inline-flex items-center px-4 py-2 shadow-sm">
                <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>New Contribution</span>
              </Button>
            </div>
            
            {/* Notifications and user menu (desktop) */}
            <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
              <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </button>
              
              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="ml-3 bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    id="user-menu-button"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => logoutMutation.mutate()}
                    className="text-red-600"
                  >
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Mobile menu for when the sidebar is hidden
export function MobileMenu({ onClose }: { onClose: () => void }) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  if (!user) return null;
  
  return (
    <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-70">
      <div className="fixed inset-0 flex z-40">
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-sidebar">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <svg className="h-8 w-8 text-sidebar-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" fill="currentColor"/>
              </svg>
              <span className="ml-2 text-xl font-heading font-bold text-white">NeuroNexus</span>
            </div>
            
            <nav className="mt-5 px-2 space-y-1">
              <Link href="/">
                <a 
                  className={`group flex items-center px-2 py-3 text-base font-medium rounded-md ${location === '/' ? 'bg-sidebar-primary bg-opacity-10 text-white' : 'text-gray-300 hover:bg-sidebar-accent hover:bg-opacity-10 hover:text-white'}`}
                  onClick={onClose}
                >
                  <Home className="mr-4 h-6 w-6 text-sidebar-primary" />
                  Dashboard
                </a>
              </Link>
              
              <Link href="/models">
                <a 
                  className={`group flex items-center px-2 py-3 text-base font-medium rounded-md ${location === '/models' ? 'bg-sidebar-primary bg-opacity-10 text-white' : 'text-gray-300 hover:bg-sidebar-accent hover:bg-opacity-10 hover:text-white'}`}
                  onClick={onClose}
                >
                  <Brain className="mr-4 h-6 w-6 text-gray-400 group-hover:text-sidebar-primary" />
                  Models
                </a>
              </Link>
              
              <Link href="/contributions">
                <a 
                  className={`group flex items-center px-2 py-3 text-base font-medium rounded-md ${location === '/contributions' ? 'bg-sidebar-primary bg-opacity-10 text-white' : 'text-gray-300 hover:bg-sidebar-accent hover:bg-opacity-10 hover:text-white'}`}
                  onClick={onClose}
                >
                  <GitBranch className="mr-4 h-6 w-6 text-gray-400 group-hover:text-sidebar-primary" />
                  Contributions
                </a>
              </Link>
              
              <Link href="/tokens">
                <a 
                  className={`group flex items-center px-2 py-3 text-base font-medium rounded-md ${location === '/tokens' ? 'bg-sidebar-primary bg-opacity-10 text-white' : 'text-gray-300 hover:bg-sidebar-accent hover:bg-opacity-10 hover:text-white'}`}
                  onClick={onClose}
                >
                  <Coins className="mr-4 h-6 w-6 text-gray-400 group-hover:text-sidebar-primary" />
                  Tokens
                </a>
              </Link>
              
              <Link href="/compute">
                <a 
                  className={`group flex items-center px-2 py-3 text-base font-medium rounded-md ${location === '/compute' ? 'bg-sidebar-primary bg-opacity-10 text-white' : 'text-gray-300 hover:bg-sidebar-accent hover:bg-opacity-10 hover:text-white'}`}
                  onClick={onClose}
                >
                  <Network className="mr-4 h-6 w-6 text-gray-400 group-hover:text-sidebar-primary" />
                  Compute Network
                </a>
              </Link>
              
              <Link href="/community">
                <a 
                  className={`group flex items-center px-2 py-3 text-base font-medium rounded-md ${location === '/community' ? 'bg-sidebar-primary bg-opacity-10 text-white' : 'text-gray-300 hover:bg-sidebar-accent hover:bg-opacity-10 hover:text-white'}`}
                  onClick={onClose}
                >
                  <Users className="mr-4 h-6 w-6 text-gray-400 group-hover:text-sidebar-primary" />
                  Community
                </a>
              </Link>
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-sidebar-border p-4">
            <div className="flex-shrink-0 group block">
              <div className="flex items-center">
                <div className="inline-block h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-white">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user.username}</p>
                  <p className="text-xs font-medium text-gray-400">{user.tokens} NXS</p>
                </div>
                <button 
                  onClick={() => logoutMutation.mutate()}
                  className="ml-auto p-1 rounded-full text-gray-400 hover:text-white transition focus:outline-none"
                  aria-label="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 w-14" aria-hidden="true">
          {/* Dummy element to force sidebar to shrink to fit close icon */}
        </div>
      </div>
    </div>
  );
}
