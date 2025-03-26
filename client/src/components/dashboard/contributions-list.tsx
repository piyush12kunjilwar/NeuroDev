import React from 'react';
import { Contribution } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';
import { useModel } from '@/hooks/use-model';
import { Loader2 } from 'lucide-react';
import { Check, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

interface ContributionsListProps {
  contributions: Contribution[];
  loading?: boolean;
  limit?: number;
  showViewAll?: boolean;
  className?: string;
}

export function ContributionsList({
  contributions,
  loading = false,
  limit,
  showViewAll = true,
  className
}: ContributionsListProps) {
  const { user } = useAuth();
  const { applyContribution } = useModel();
  
  const filteredContributions = limit
    ? contributions.slice(0, limit)
    : contributions;
  
  const handleApply = (contributionId: number) => {
    applyContribution(contributionId);
  };
  
  if (loading) {
    return (
      <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
        <ul role="list" className="divide-y divide-gray-200">
          {[...Array(3)].map((_, i) => (
            <li key={i}>
              <div className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center animate-pulse">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200"></div>
                      <div className="ml-4">
                        <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="flex items-center animate-pulse">
                      <div className="h-5 bg-gray-200 rounded w-16 mr-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  
  if (filteredContributions.length === 0) {
    return (
      <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
        <div className="text-center py-8">
          <div className="text-primary mx-auto h-12 w-12 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No contributions</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start contributing code, compute, or data to help improve AI models.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
      <ul role="list" className="divide-y divide-gray-200">
        {filteredContributions.map((contribution) => {
          const isAdmin = user && user.id === 1; // for demo purposes
          const isPending = contribution.status === 'pending';
          
          return (
            <li key={contribution.id}>
              <div className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                        <div className="h-full w-full flex items-center justify-center">
                          <span className="text-gray-500 font-medium">
                            {contribution.userId.toString().charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-primary">
                          {contribution.type.charAt(0).toUpperCase() + contribution.type.slice(1)} Contribution
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">User #{contribution.userId}</span> •{' '}
                          {formatDistanceToNow(new Date(contribution.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {!isPending && contribution.reward && (
                        <div className="flex items-center mr-4">
                          <svg className="h-4 w-4 text-accent mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-500">{contribution.reward} NXS rewarded</span>
                        </div>
                      )}
                      <div className="flex-shrink-0 flex">
                        {isPending ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" /> Pending
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" /> Accepted
                          </span>
                        )}
                      </div>
                      
                      {isAdmin && isPending && (
                        <Button 
                          size="sm"
                          variant="outline"
                          className="ml-2"
                          onClick={() => handleApply(contribution.id)}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {contribution.description && (
                    <div className="mt-2 text-sm text-gray-700">
                      <p>{contribution.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      
      {showViewAll && contributions.length > (limit || 0) && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredContributions.length}</span> of <span className="font-medium">{contributions.length}</span> contributions
            </div>
            <div>
              <a
                href="#"
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View all
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
