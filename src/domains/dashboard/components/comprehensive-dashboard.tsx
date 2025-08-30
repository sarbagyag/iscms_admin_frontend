'use client';

import React, { useEffect } from 'react';
import { Grid, Column, Tile, SkeletonText, Button, Tag } from '@carbon/react';
import { PageHeader } from '@carbon/ibm-products';
import {
  UserAvatar,
  Document,
  Image,
  Building,
  ChartLine,
  Checkmark,
  Warning,
  Error,
  Information,
} from '@carbon/icons-react';
import { useTranslations } from 'next-intl';
import { useLanguageFont } from '@/shared/hooks/use-language-font';
import { safeErrorToString } from '@/shared/utils/error-utils';
import { DashboardProvider, useDashboardContext } from '../contexts/dashboard-context';
import { DashboardHeader } from './dashboard-header';
import { MetricCardWidget, CompositeMetricCard, StatisticMetricCard } from './widgets/metric-card-widget';
import { useComprehensiveDashboard } from '../hooks/use-dashboard-queries';
import { MetricCardData } from '@/types/dashboard';
import '@/domains/dashboard/styles/comprehensive-dashboard.css';

// ========================================
// DASHBOARD CONTENT COMPONENT
// ========================================

const DashboardContent: React.FC = () => {
  const t = useTranslations();
  const { isNepali } = useLanguageFont();
  const { filters } = useDashboardContext();
  
  const {
    overview,
    system,
    content,
    users,
    hr,
    marketing,
    health,
    isLoading,
    error,
    refetch,
  } = useComprehensiveDashboard({
    dateFrom: filters.dateRange.from,
    dateTo: filters.dateRange.to,
    category: filters.category,
    granularity: filters.granularity,
    includeTrends: filters.includeTrends,
  });

  // Auto-refresh effect
  useEffect(() => {
    if (filters.category === 'all' && filters.includeTrends) {
      const interval = setInterval(() => {
        refetch();
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [filters, refetch]);

  // System overview metrics
  const systemMetrics: MetricCardData[] = [
    {
      title: isNepali ? 'कुल प्रयोगकर्ताहरू' : 'Total Users',
      value: system?.totalUsers || 0,
      trend: '+12%',
      trendDirection: 'up',
      icon: UserAvatar,
      color: 'var(--cds-interactive-01)',
    },
    {
      title: isNepali ? 'सक्रिय प्रयोगकर्ताहरू' : 'Active Users',
      value: system?.activeUsers || 0,
      trend: '+8%',
      trendDirection: 'up',
      icon: UserAvatar,
      color: 'var(--cds-support-success)',
    },
    {
      title: isNepali ? 'कुल कागजातहरू' : 'Total Documents',
      value: system?.totalDocuments || 0,
      trend: '+15%',
      trendDirection: 'up',
      icon: Document,
      color: 'var(--cds-support-info)',
    },
    {
      title: isNepali ? 'कुल मिडिया' : 'Total Media',
      value: system?.totalMedia || 0,
      trend: '+22%',
      trendDirection: 'up',
      icon: Image,
      color: 'var(--cds-support-warning)',
    },
  ];

  // Content analytics metrics
  const contentMetrics: MetricCardData[] = [
    {
      title: isNepali ? 'कुल डाउनलोडहरू' : 'Total Downloads',
      value: content?.totalDownloads || 0,
      trend: '+18%',
      trendDirection: 'up',
      icon: Document,
      color: 'var(--cds-support-success)',
    },
    {
      title: isNepali ? 'कुल हेराइहरू' : 'Total Views',
      value: content?.totalViews || 0,
      trend: '+12%',
      trendDirection: 'up',
      icon: ChartLine,
      color: 'var(--cds-interactive-01)',
    },
    {
      title: isNepali ? 'औसत सहभागिता' : 'Avg Engagement',
      value: `${content?.averageEngagement || 0}%`,
      trend: '+5%',
      trendDirection: 'up',
      icon: ChartLine,
      color: 'var(--cds-support-info)',
    },
  ];

  // User analytics metrics
  const userMetrics: MetricCardData[] = [
    {
      title: isNepali ? 'दैनिक सक्रिय प्रयोगकर्ताहरू' : 'Daily Active Users',
      value: users?.dailyActiveUsers || 0,
      trend: users?.userGrowth?.trend || '+0%',
      trendDirection: users?.userGrowth?.trend?.includes('+') ? 'up' : 'down',
      icon: UserAvatar,
      color: 'var(--cds-support-success)',
    },
    {
      title: isNepali ? 'साप्ताहिक सक्रिय प्रयोगकर्ताहरू' : 'Weekly Active Users',
      value: users?.weeklyActiveUsers || 0,
      trend: '+6%',
      trendDirection: 'up',
      icon: UserAvatar,
      color: 'var(--cds-interactive-01)',
    },
    {
      title: isNepali ? 'मासिक सक्रिय प्रयोगकर्ताहरू' : 'Monthly Active Users',
      value: users?.monthlyActiveUsers || 0,
      trend: '+8%',
      trendDirection: 'up',
      icon: UserAvatar,
      color: 'var(--cds-support-info)',
    },
  ];

  // HR analytics metrics
  const hrMetrics: MetricCardData[] = [
    {
      title: isNepali ? 'कुल कर्मचारीहरू' : 'Total Employees',
      value: hr?.totalEmployees || 0,
      trend: '+3%',
      trendDirection: 'up',
      icon: Building,
      color: 'var(--cds-support-success)',
    },
    {
      title: isNepali ? 'खुला पदहरू' : 'Open Positions',
      value: hr?.openPositions || 0,
      trend: '-2%',
      trendDirection: 'down',
      icon: Building,
      color: 'var(--cds-support-warning)',
    },
    {
      title: isNepali ? 'कर्मचारी सन्तुष्टि' : 'Employee Satisfaction',
      value: `${hr?.employeeSatisfaction || 0}%`,
      trend: '+1%',
      trendDirection: 'up',
      icon: ChartLine,
      color: 'var(--cds-support-success)',
    },
  ];

  // Marketing analytics metrics
  const marketingMetrics: MetricCardData[] = [
    {
      title: isNepali ? 'औसत क्लिक-थ्रु रेट' : 'Avg Click-Through Rate',
      value: `${marketing?.averageClickThroughRate || 0}%`,
      trend: '+8%',
      trendDirection: 'up',
      icon: ChartLine,
      color: 'var(--cds-support-success)',
    },
    {
      title: isNepali ? 'कुल ब्यानर हेराइहरू' : 'Total Banner Views',
      value: marketing?.totalBannerViews || 0,
      trend: '+15%',
      trendDirection: 'up',
      icon: ChartLine,
      color: 'var(--cds-interactive-01)',
    },
    {
      title: isNepali ? 'अद्वितीय भ्रमणकर्ताहरू' : 'Unique Visitors',
      value: marketing?.uniqueVisitors || 0,
      trend: '+12%',
      trendDirection: 'up',
      icon: UserAvatar,
      color: 'var(--cds-support-info)',
    },
  ];

  // Get system health status
  const getSystemHealthStatus = () => {
    if (!health) return { status: 'unknown', color: 'var(--cds-text-03)', icon: Information };
    
    switch (health.status) {
      case 'healthy':
        return { status: 'healthy', color: 'var(--cds-support-success)', icon: Checkmark };
      case 'degraded':
        return { status: 'degraded', color: 'var(--cds-support-warning)', icon: Warning };
      case 'unhealthy':
        return { status: 'unhealthy', color: 'var(--cds-support-error)', icon: Error };
      default:
        return { status: 'unknown', color: 'var(--cds-text-03)', icon: Information };
    }
  };

  const healthStatus = getSystemHealthStatus();

  if (error) {
    return (
      <div className="dashboard-error">
        <Tile className="dashboard-error-tile">
          <div className="dashboard-error-content">
            <h2>{isNepali ? 'ड्यासबोर्ड लोड गर्न असफल' : 'Failed to load dashboard'}</h2>
            <p>{safeErrorToString(error)}</p>
            <Button onClick={refetch}>
              {isNepali ? 'पुनः प्रयास गर्नुहोस्' : 'Try Again'}
            </Button>
          </div>
        </Tile>
      </div>
    );
  }

  return (
    <div className="comprehensive-dashboard">
      {/* Dashboard Header */}
      <DashboardHeader
        title={isNepali ? 'समग्र ड्यासबोर्ड' : 'Comprehensive Dashboard'}
        subtitle={isNepali ? 'आफ्नो iCMS प्रणालीको पूर्ण अवलोकन' : 'Complete overview of your iCMS system'}
        onRefresh={refetch}
      />

      {/* System Health Status */}
      <div className="dashboard-health-status">
        <Grid>
          <Column lg={12} md={4} sm={4}>
            <Tile className="health-status-tile">
              <div className="health-status-content">
                <div className="health-status-icon" style={{ color: healthStatus.color }}>
                  {React.createElement(healthStatus.icon, { size: 24 })}
                </div>
                <div className="health-status-info">
                  <h3 className="health-status-title">
                    {isNepali ? 'प्रणाली स्वास्थ्य' : 'System Health'}
                  </h3>
                  <p className="health-status-message">
                    {health?.message || (isNepali ? 'अज्ञात स्थिति' : 'Unknown status')}
                  </p>
                  <Tag type={healthStatus.status === 'healthy' ? 'green' : healthStatus.status === 'degraded' ? 'warm-gray' : 'red'}>
                    {healthStatus.status}
                  </Tag>
                </div>
              </div>
            </Tile>
          </Column>
        </Grid>
      </div>

      {/* System Overview Metrics */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">
          {isNepali ? 'प्रणाली अवलोकन' : 'System Overview'}
        </h2>
        <Grid>
          {systemMetrics.map((metric, index) => (
            <Column key={index} lg={3} md={4} sm={4}>
              <MetricCardWidget
                data={metric}
                loading={isLoading}
                size="medium"
                onClick={() => console.log(`Clicked on ${metric.title}`)}
              />
            </Column>
          ))}
        </Grid>
      </div>

      {/* Content Analytics */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">
          {isNepali ? 'सामग्री विश्लेषण' : 'Content Analytics'}
        </h2>
        <Grid>
          <Column lg={8} md={4} sm={4}>
            <CompositeMetricCard
              title={isNepali ? 'सामग्री मेट्रिकहरू' : 'Content Metrics'}
              metrics={contentMetrics}
              loading={isLoading}
              layout="horizontal"
            />
          </Column>
          <Column lg={4} md={4} sm={4}>
            <StatisticMetricCard
              title={isNepali ? 'मासिक वृद्धि' : 'Monthly Growth'}
              value={content?.documentGrowth?.monthly || 0}
              unit={isNepali ? 'कागजातहरू' : 'documents'}
              change={content?.documentGrowth?.trend || '+0%'}
              changeType={content?.documentGrowth?.trend?.includes('+') ? 'positive' : 'negative'}
              icon={ChartLine}
            />
          </Column>
        </Grid>
      </div>

      {/* User Analytics */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">
          {isNepali ? 'प्रयोगकर्ता विश्लेषण' : 'User Analytics'}
        </h2>
        <Grid>
          <Column lg={6} md={4} sm={4}>
            <CompositeMetricCard
              title={isNepali ? 'प्रयोगकर्ता गतिविधि' : 'User Activity'}
              metrics={userMetrics}
              loading={isLoading}
              layout="vertical"
            />
          </Column>
          <Column lg={6} md={4} sm={4}>
            <Tile className="role-distribution-tile">
              <h3 className="role-distribution-title">
                {isNepali ? 'भूमिका वितरण' : 'Role Distribution'}
              </h3>
              {isLoading ? (
                <div className="role-distribution-skeleton">
                  <SkeletonText width="100%" />
                  <SkeletonText width="80%" />
                  <SkeletonText width="60%" />
                </div>
              ) : (
                <div className="role-distribution-content">
                  {users?.roleDistribution && Object.entries(users.roleDistribution).map(([role, count]) => (
                    <div key={role} className="role-distribution-item">
                      <span className="role-name">
                        {isNepali ? 
                          (role === 'admin' ? 'एडमिन' : 
                           role === 'editor' ? 'सम्पादक' : 
                           role === 'manager' ? 'प्रबन्धक' : 
                           'प्रयोगकर्ता') : 
                          role.charAt(0).toUpperCase() + role.slice(1)
                        }
                      </span>
                      <span className="role-count">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </Tile>
          </Column>
        </Grid>
      </div>

      {/* HR Analytics */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">
          {isNepali ? 'मानव संसाधन विश्लेषण' : 'HR Analytics'}
        </h2>
        <Grid>
          <Column lg={8} md={4} sm={4}>
            <CompositeMetricCard
              title={isNepali ? 'कर्मचारी मेट्रिकहरू' : 'Employee Metrics'}
              metrics={hrMetrics}
              loading={isLoading}
              layout="horizontal"
            />
          </Column>
          <Column lg={4} md={4} sm={4}>
            <StatisticMetricCard
              title={isNepali ? 'टर्नओभर दर' : 'Turnover Rate'}
              value={hr?.metrics?.turnoverRate || 0}
              unit="%"
              change={hr?.metrics?.turnoverRate ? (hr.metrics.turnoverRate > 5 ? '+2%' : '-1%') : '+0%'}
              changeType={hr?.metrics?.turnoverRate ? (hr.metrics.turnoverRate > 5 ? 'negative' : 'positive') : 'neutral'}
              icon={ChartLine}
            />
          </Column>
        </Grid>
      </div>

      {/* Marketing Analytics */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">
          {isNepali ? 'मार्केटिङ विश्लेषण' : 'Marketing Analytics'}
        </h2>
        <Grid>
          <Column lg={12} md={4} sm={4}>
            <CompositeMetricCard
              title={isNepali ? 'मार्केटिङ प्रदर्शन' : 'Marketing Performance'}
              metrics={marketingMetrics}
              loading={isLoading}
              layout="grid"
            />
          </Column>
        </Grid>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">
          {isNepali ? 'हालैको गतिविधिहरू' : 'Recent Activity'}
        </h2>
        <Grid>
          <Column lg={12} md={4} sm={4}>
            <Tile className="recent-activity-tile">
              <div className="recent-activity-header">
                <h3>{isNepali ? 'शीर्ष सक्रिय प्रयोगकर्ताहरू' : 'Top Active Users'}</h3>
                <Button kind="ghost" size="sm">
                  {isNepali ? 'सबै हेर्नुहोस्' : 'View All'}
                </Button>
              </div>
              {isLoading ? (
                <div className="recent-activity-skeleton">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="activity-skeleton-item">
                      <SkeletonText width="60%" />
                      <SkeletonText width="40%" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="recent-activity-content">
                  {users?.topActiveUsers?.slice(0, 5).map((user, index) => (
                    <div key={user.id} className="activity-item">
                      <div className="activity-user">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">{user.role}</span>
                      </div>
                      <div className="activity-stats">
                        <span className="activity-actions">{user.actions} actions</span>
                        <span className="activity-time">{user.lastActive}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Tile>
          </Column>
        </Grid>
      </div>
    </div>
  );
};

// ========================================
// MAIN DASHBOARD COMPONENT
// ========================================

interface ComprehensiveDashboardProps {
  className?: string;
}

export const ComprehensiveDashboard: React.FC<ComprehensiveDashboardProps> = ({ className = '' }) => {
  return (
    <DashboardProvider>
      <div className={`comprehensive-dashboard-container ${className}`}>
        <DashboardContent />
      </div>
    </DashboardProvider>
  );
};

