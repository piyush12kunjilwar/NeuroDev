import React, { useRef, useEffect } from 'react';
import { Clipboard, GitBranch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeViewProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

export function CodeView({ code, language = 'python', title, className }: CodeViewProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const { toast } = useToast();

  // Function to copy code to clipboard
  const copyToClipboard = () => {
    if (code) {
      navigator.clipboard.writeText(code)
        .then(() => {
          toast({
            title: 'Code copied to clipboard',
            description: 'You can now paste it wherever you need.',
            duration: 3000,
          });
        })
        .catch(err => {
          toast({
            title: 'Failed to copy code',
            description: 'Please try again or copy manually.',
            variant: 'destructive',
          });
          console.error('Failed to copy:', err);
        });
    }
  };

  // Function to handle forking the code (for MVP just display a toast)
  const forkCode = () => {
    toast({
      title: 'Code forked!',
      description: 'You can now make your own changes to this code.',
      duration: 3000,
    });
  };

  // Replace the class formatting with spans for syntax highlighting
  useEffect(() => {
    if (codeRef.current) {
      // A very basic syntax highlighter for Python
      // In a real app, you would use a library like Prism.js or highlight.js
      let formattedCode = code
        // Keywords
        .replace(/\b(import|from|class|def|return|if|else|for|while|in|as|with|try|except|finally|raise|assert|continue|break|pass|and|or|not|is|None|True|False)\b/g, '<span class="text-blue-500">$1</span>')
        // Function calls
        .replace(/([a-zA-Z_][a-zA-Z0-9_]*)\(/g, '<span class="text-yellow-500">$1</span>(')
        // Strings
        .replace(/(["'])(.*?)\1/g, '<span class="text-green-500">$1$2$1</span>')
        // Numbers
        .replace(/\b(\d+)\b/g, '<span class="text-purple-500">$1</span>')
        // Comments
        .replace(/(#.*)$/gm, '<span class="text-gray-400">$1</span>');
      
      codeRef.current.innerHTML = formattedCode;
    }
  }, [code]);

  return (
    <div className={`bg-gray-800 rounded-md shadow-inner overflow-hidden ${className}`}>
      {title && (
        <div className="flex justify-between items-center bg-gray-700 px-4 py-2">
          <span className="text-sm text-gray-200 font-medium">{title}</span>
          <div className="flex space-x-2">
            <button 
              onClick={copyToClipboard}
              className="text-gray-400 hover:text-gray-200 transition focus:outline-none"
              aria-label="Copy code"
            >
              <Clipboard className="h-4 w-4" />
            </button>
            <button 
              onClick={forkCode}
              className="text-gray-400 hover:text-gray-200 transition focus:outline-none"
              aria-label="Fork code"
            >
              <GitBranch className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
        <pre 
          ref={codeRef}
          className="p-4 text-xs text-gray-300 font-mono"
        >
          {code}
        </pre>
      </div>
    </div>
  );
}
