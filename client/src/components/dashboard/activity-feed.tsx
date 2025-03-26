import React from 'react';
import { Activity } from '@shared/schema';
import { 
  GitCommit, 
  BarChart, 
  Database,
  Server,
  Activity as ActivityIcon,
  LucideIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  activities: Activity[];
  loading?: boolean;
  className?: string;
}

// Map of activity types to icons
const activityIconMap: Record<string, LucideIcon> = {
  'submitted_contribution': GitCommit,
  'contribution_accepted': GitCommit,
  'updated_performance': BarChart,
  'contributed_data': Database,
  'compute_contribution': Server,
  'default': ActivityIcon
};

export function ActivityFeed({ activities, loading = false, className }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className={`flow-root ${className}`}>
        <div className="animate-pulse space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="relative pb-8">
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`flow-root ${className}`}>
        <div className="text-center py-6">
          <ActivityIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-900">No activity yet</h3>
          <p className="text-sm text-gray-500 mt-1">
            Activities will appear here as users contribute to the model.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flow-root ${className}`}>
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => {
          const IconComponent = activityIconMap[activity.action] || activityIconMap.default;
          const isLast = activityIdx === activities.length - 1;
          
          // Determine icon color based on activity type
          let iconColor = 'text-primary';
          if (activity.action === 'updated_performance') iconColor = 'text-secondary';
          if (activity.action === 'contributed_data') iconColor = 'text-accent';
          if (activity.action === 'compute_contribution') iconColor = 'text-secondary';
          
          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span 
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" 
                    aria-hidden="true" 
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ring-8 ring-white">
                      <IconComponent className={`${iconColor} h-5 w-5`} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <div className="text-sm">
                        {activity.userId ? (
                          <a href="#" className="font-medium text-gray-900">
                            User #{activity.userId}
                          </a>
                        ) : (
                          <span className="font-medium text-gray-900">System</span>
                        )}
                        {' '}
                        {activity.description.charAt(0).toLowerCase() + activity.description.slice(1)}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    {activity.metadata && (
                      <div className="mt-2 text-sm text-gray-700">
                        {activity.metadata.improvement && (
                          <p>
                            Performance improved by {activity.metadata.improvement}
                            {activity.metadata.reward && ` • Rewarded ${activity.metadata.reward} NXS`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
