import React from 'react';
import { 
  Brain, 
  GitBranch, 
  Coins, 
  NetworkIcon, 
  LucideIcon 
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  linkText?: string;
  linkHref?: string;
  icon: 'brain' | 'git-branch' | 'coins' | 'network';
  color: 'primary' | 'secondary' | 'accent' | 'gray';
}

const iconMap: Record<StatCardProps['icon'], LucideIcon> = {
  'brain': Brain,
  'git-branch': GitBranch,
  'coins': Coins,
  'network': NetworkIcon
};

const colorMap: Record<StatCardProps['color'], {
  bg: string;
  text: string;
  hover: string;
}> = {
  'primary': {
    bg: 'bg-primary-100',
    text: 'text-primary',
    hover: 'hover:text-primary-700'
  },
  'secondary': {
    bg: 'bg-secondary-100',
    text: 'text-secondary',
    hover: 'hover:text-secondary-700'
  },
  'accent': {
    bg: 'bg-accent-100',
    text: 'text-accent',
    hover: 'hover:text-accent-700'
  },
  'gray': {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    hover: 'hover:text-gray-900'
  }
};

export function StatCard({ title, value, linkText, linkHref, icon, color }: StatCardProps) {
  const Icon = iconMap[icon];
  const colorClasses = colorMap[color];
  
  return (
    <Card className="overflow-hidden shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${colorClasses.bg} rounded-md p-3`}>
            <Icon className={`${colorClasses.text} w-5 h-5`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      
      {linkText && linkHref && (
        <div className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a 
              href={linkHref} 
              className={`font-medium ${colorClasses.text} ${colorClasses.hover}`}
            >
              {linkText}
              <span className="sr-only"> {title}</span>
            </a>
          </div>
        </div>
      )}
    </Card>
  );
}
