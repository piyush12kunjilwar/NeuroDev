import React from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { 
  Home, 
  Brain, 
  GitBranch, 
  Coins, 
  Network, 
  Users, 
  GraduationCap, 
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // If no user, don't render sidebar
  if (!user) return null;
  
  return (
    <div className={`hidden md:flex md:w-64 flex-shrink-0 flex-col bg-sidebar text-sidebar-foreground ${className}`}>
      {/* Logo and app name */}
      <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
        <div className="flex items-center">
          <svg className="h-8 w-8 text-sidebar-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" fill="currentColor"/>
            <path d="M2 12H7" stroke="currentColor" strokeWidth="2"/>
            <path d="M17 12H22" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 7V2" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 22V17" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span className="ml-2 text-xl font-heading font-bold">NeuroNexus</span>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="overflow-y-auto flex-grow">
        <nav className="mt-5 px-2">
          <Link href="/">
            <a className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md ${location === '/' ? 'bg-sidebar-primary bg-opacity-10 text-sidebar-primary' : 'text-gray-300 hover:bg-sidebar-primary hover:bg-opacity-10 hover:text-sidebar-primary'}`}>
              <Home className="mr-3 h-5 w-5 text-sidebar-primary" />
              Dashboard
            </a>
          </Link>
          
          <Link href="/models">
            <a className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md ${location === '/models' ? 'bg-sidebar-primary bg-opacity-10 text-sidebar-primary' : 'text-gray-300 hover:bg-sidebar-primary hover:bg-opacity-10 hover:text-sidebar-primary'}`}>
              <Brain className="mr-3 h-5 w-5 text-gray-400 group-hover:text-sidebar-primary" />
              Models
            </a>
          </Link>
          
          <Link href="/contributions">
            <a className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md ${location === '/contributions' ? 'bg-sidebar-primary bg-opacity-10 text-sidebar-primary' : 'text-gray-300 hover:bg-sidebar-primary hover:bg-opacity-10 hover:text-sidebar-primary'}`}>
              <GitBranch className="mr-3 h-5 w-5 text-gray-400 group-hover:text-sidebar-primary" />
              Contributions
            </a>
          </Link>
          
          <Link href="/tokens">
            <a className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md ${location === '/tokens' ? 'bg-sidebar-primary bg-opacity-10 text-sidebar-primary' : 'text-gray-300 hover:bg-sidebar-primary hover:bg-opacity-10 hover:text-sidebar-primary'}`}>
              <Coins className="mr-3 h-5 w-5 text-gray-400 group-hover:text-sidebar-primary" />
              Tokens
            </a>
          </Link>
          
          <Link href="/compute">
            <a className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md ${location === '/compute' ? 'bg-sidebar-primary bg-opacity-10 text-sidebar-primary' : 'text-gray-300 hover:bg-sidebar-primary hover:bg-opacity-10 hover:text-sidebar-primary'}`}>
              <Network className="mr-3 h-5 w-5 text-gray-400 group-hover:text-sidebar-primary" />
              Compute Network
            </a>
          </Link>
          
          <Link href="/community">
            <a className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md ${location === '/community' ? 'bg-sidebar-primary bg-opacity-10 text-sidebar-primary' : 'text-gray-300 hover:bg-sidebar-primary hover:bg-opacity-10 hover:text-sidebar-primary'}`}>
              <Users className="mr-3 h-5 w-5 text-gray-400 group-hover:text-sidebar-primary" />
              Community
            </a>
          </Link>
          
          {/* Learning Resources Section */}
          <div className="pt-4 pb-2">
            <div className="flex items-center px-2">
              <div className="flex-shrink-0">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Learning Resources</span>
              </div>
            </div>
          </div>
          
          <Link href="/tutorials">
            <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/tutorials' ? 'bg-sidebar-primary bg-opacity-10 text-sidebar-primary' : 'text-gray-300 hover:bg-sidebar-primary hover:bg-opacity-10 hover:text-sidebar-primary'}`}>
              <GraduationCap className="mr-3 h-5 w-5 text-gray-400 group-hover:text-sidebar-primary" />
              Tutorials
            </a>
          </Link>
          
          <Link href="/docs">
            <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/docs' ? 'bg-sidebar-primary bg-opacity-10 text-sidebar-primary' : 'text-gray-300 hover:bg-sidebar-primary hover:bg-opacity-10 hover:text-sidebar-primary'}`}>
              <BookOpen className="mr-3 h-5 w-5 text-gray-400 group-hover:text-sidebar-primary" />
              Documentation
            </a>
          </Link>
        </nav>
      </div>
      
      {/* User profile */}
      <div className="flex-shrink-0 flex border-t border-sidebar-border p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div className="inline-block h-9 w-9 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user.username}</p>
              <p className="text-xs font-medium text-gray-400">{user.tokens} NXS</p>
            </div>
            <button 
              onClick={handleLogout}
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
  );
}
