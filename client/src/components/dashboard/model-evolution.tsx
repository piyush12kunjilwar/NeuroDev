import React from 'react';
import { PerformanceChart } from '@/components/ui/performance-chart';
import { Model } from '@shared/schema';
import { Link } from 'wouter';
import { Loader2 } from 'lucide-react';

interface ModelEvolutionProps {
  model: Model | null;
  loading?: boolean;
  className?: string;
}

export function ModelEvolution({ model, loading = false, className }: ModelEvolutionProps) {
  if (loading) {
    return (
      <div className={`${className} flex flex-col`}>
        <h3 className="font-heading text-lg font-medium text-gray-900 mb-4">Model Evolution</h3>
        <div className="h-[200px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-16"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!model) {
    return (
      <div className={`${className} flex flex-col`}>
        <h3 className="font-heading text-lg font-medium text-gray-900 mb-4">Model Evolution</h3>
        <div className="h-[200px] flex items-center justify-center bg-gray-100 rounded-md">
          <p className="text-gray-500">No model data available</p>
        </div>
      </div>
    );
  }

  // Calculate improvement
  const currentAcc = parseFloat(model.currentAccuracy.replace('%', ''));
  const previousAcc = model.previousAccuracy ? parseFloat(model.previousAccuracy.replace('%', '')) : currentAcc;
  const improvement = (currentAcc - previousAcc).toFixed(1);
  const isPositive = currentAcc >= previousAcc;

  return (
    <div className={`${className} flex flex-col`}>
      <h3 className="font-heading text-lg font-medium text-gray-900 mb-4">Model Evolution</h3>
      <div className="h-[200px] relative">
        <PerformanceChart model={model} className="h-full" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Current Accuracy</p>
          <p className="text-lg font-semibold text-gray-900">{model.currentAccuracy}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Improvement</p>
          <p className={`text-lg font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{improvement}%
          </p>
        </div>
      </div>
      <div className="mt-4">
        <Link href="/analytics">
          <a className="text-sm font-medium text-primary hover:text-primary-700">
            View detailed analytics →
          </a>
        </Link>
      </div>
    </div>
  );
}
