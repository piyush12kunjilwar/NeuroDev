import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header, MobileMenu } from '@/components/layout/header';
import { StatCard } from '@/components/dashboard/stat-card';
import { ModelEvolution } from '@/components/dashboard/model-evolution';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { ContributionForm } from '@/components/dashboard/contribution-form';
import { ModelVisualization } from '@/components/ui/model-visualization';
import { CodeView } from '@/components/ui/code-view';
import { ContributionsList } from '@/components/dashboard/contributions-list';
import { NetworkGraph } from '@/components/ui/network-graph';
import { Button } from '@/components/ui/button';
import { useModel } from '@/hooks/use-model';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { 
    currentModel, 
    activities, 
    contributions,
    isLoading,
    submitCompute,
    isComputeRunning
  } = useModel();
  
  // Get stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/stats'],
    enabled: !!user,
  });
  
  // For compute button loading state
  const [isComputeLoading, setIsComputeLoading] = useState(false);
  
  // Handle compute contribution
  const handleComputeContribution = async () => {
    setIsComputeLoading(true);
    try {
      await submitCompute();
    } finally {
      setIsComputeLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Mobile menu */}
      {mobileMenuOpen && <MobileMenu onClose={() => setMobileMenuOpen(false)} />}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        
        {/* Main */}
        <main className="flex-1 overflow-y-auto neural-bg">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold font-heading text-gray-900">Dashboard</h1>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mt-4">
                {isStatsLoading ? (
                  // Loading skeleton
                  <>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white shadow rounded-lg h-32 animate-pulse">
                        <div className="p-6">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-md bg-gray-200"></div>
                            <div className="ml-5 w-0 flex-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                              <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <StatCard
                      title="Active Models"
                      value={stats?.activeModels || 0}
                      linkText="View all models"
                      linkHref="/models"
                      icon="brain"
                      color="primary"
                    />
                    
                    <StatCard
                      title="Your Contributions"
                      value={stats?.userContributions || 0}
                      linkText="View contributions"
                      linkHref="/contributions"
                      icon="git-branch"
                      color="secondary"
                    />
                    
                    <StatCard
                      title="Your Tokens (NXS)"
                      value={user?.tokens || 0}
                      linkText="View wallet"
                      linkHref="/tokens"
                      icon="coins"
                      color="accent"
                    />
                    
                    <StatCard
                      title="Compute Contributors"
                      value={stats?.computeContributors || 0}
                      linkText="View network"
                      linkHref="/compute"
                      icon="network"
                      color="gray"
                    />
                  </>
                )}
              </div>
              
              {/* Current Project Section */}
              <div className="mt-8">
                <h2 className="text-xl font-heading font-medium text-gray-900 mb-4">
                  Current Project: MNIST Classifier
                </h2>
                
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="md:grid md:grid-cols-3 md:divide-x">
                    {/* Model Performance */}
                    <div className="p-6">
                      <ModelEvolution model={currentModel} loading={isLoading} />
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="p-6">
                      <h3 className="font-heading text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                      <ActivityFeed activities={activities} loading={isLoading} />
                    </div>
                    
                    {/* Contribution Interface */}
                    <div className="p-6">
                      <h3 className="font-heading text-lg font-medium text-gray-900 mb-4">Contribute to Model</h3>
                      <ContributionForm modelId={1} />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Model Viewer Section */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Model Visualization */}
                <div className="lg:col-span-2 bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading text-lg font-medium text-gray-900">Model Visualization</h3>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 4v6h6"/>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                          </svg>
                          Reset View
                        </Button>
                        <Button size="sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                          View in AR
                        </Button>
                      </div>
                    </div>
                    
                    {/* 3D Model Visualization */}
                    <div className="relative rounded-lg bg-gray-100 overflow-hidden" style={{ height: '360px' }}>
                      <ModelVisualization className="h-full" />
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-500">Architecture:</span>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {currentModel?.architecture || 'Convolutional Neural Network'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Parameters:</span>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {currentModel?.parameters || '1.28M'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Last Updated:</span>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {currentModel ? 
                            new Date(currentModel.lastUpdated).toLocaleString() : 
                            '2 hours ago'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Code View */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <h3 className="font-heading text-lg font-medium text-gray-900 mb-4">Model Code</h3>
                    
                    <div className="mt-2 relative">
                      <CodeView 
                        code={currentModel?.code || ''} 
                        language="python"
                        title="model.py"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <a href="#" className="text-sm font-medium text-primary hover:text-primary-700">
                        View full codebase →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Community Contributions */}
              <div className="mt-8">
                <h2 className="text-xl font-heading font-medium text-gray-900 mb-4">Community Contributions</h2>
                <ContributionsList 
                  contributions={contributions}
                  loading={isLoading}
                  limit={3}
                  showViewAll={true}
                />
              </div>
              
              {/* Join Compute Network */}
              <div className="mt-8 mb-8">
                <div className="bg-primary bg-opacity-5 rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-8 sm:px-8 sm:py-12 md:grid md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-2">
                      <h2 className="text-xl font-heading font-semibold text-primary mb-2">Contribute Your Computing Power</h2>
                      <p className="text-base text-gray-700 mb-6">
                        Help train and optimize AI models by sharing your idle computing resources. 
                        Our federated infrastructure ensures your data stays private while you earn NXS tokens.
                      </p>
                      <div className="mt-5 sm:mt-8">
                        <div className="rounded-md shadow">
                          <Button 
                            className="w-full flex items-center justify-center px-8 py-3 md:py-3 md:text-lg md:px-10"
                            onClick={handleComputeContribution}
                            disabled={isComputeLoading || isComputeRunning}
                          >
                            {isComputeLoading || isComputeRunning ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isComputeRunning ? 'Computing...' : 'Processing...'}
                              </>
                            ) : (
                              'Join Compute Network'
                            )}
                          </Button>
                        </div>
                        <p className="mt-3 text-sm text-gray-600">
                          Average earnings last month: <span className="font-medium text-accent">138 NXS</span> per active contributor
                        </p>
                      </div>
                    </div>
                    <div className="mt-8 md:mt-0 flex items-center justify-center">
                      <div className="rounded-full bg-white p-5 shadow-md">
                        <NetworkGraph numNodes={30} className="h-24 w-24" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
