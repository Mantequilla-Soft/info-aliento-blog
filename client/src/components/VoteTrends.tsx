import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { getWitnessVoteTrends } from '@/api/hive-hafsql';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useState } from 'react';

interface VoteTrendsProps {
  witnessName: string;
}

export default function VoteTrends({ witnessName }: VoteTrendsProps) {
  const [timeRange, setTimeRange] = useState<7 | 30 | 365>(30);
  const [loadingYear, setLoadingYear] = useState(false);
  
  const { data: trends = [], isLoading } = useQuery({
    queryKey: ['vote-trends', witnessName, timeRange],
    queryFn: () => getWitnessVoteTrends(witnessName, timeRange),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!witnessName,
  });
  
  // Handle year view loading
  const handleLoadYear = () => {
    setLoadingYear(true);
    setTimeRange(365);
    setTimeout(() => setLoadingYear(false), 1000);
  };

  // Calculate summary statistics
  const totalApprovals = trends.reduce((sum, day) => sum + day.approvals, 0);
  const totalRemovals = trends.reduce((sum, day) => sum + day.removals, 0);
  const netChange = totalApprovals - totalRemovals;
  const averageDaily = trends.length > 0 ? (netChange / trends.length).toFixed(1) : '0';
  
  // Calculate HP statistics
  const totalHPGained = trends.reduce((sum, day) => sum + day.hpGained, 0);
  const totalHPLost = trends.reduce((sum, day) => sum + day.hpLost, 0);
  const netHPChange = totalHPGained - totalHPLost;
  
  // Format HP for display
  const formatHP = (hp: number): string => {
    const absHP = Math.abs(hp);
    if (absHP >= 1000000) {
      return `${(hp / 1000000).toFixed(2)}M HP`;
    } else if (absHP >= 1000) {
      return `${(hp / 1000).toFixed(1)}K HP`;
    } else {
      return `${hp.toFixed(0)} HP`;
    }
  };

  // Chart configuration
  const chartConfig = {
    approvals: {
      label: 'New Votes',
      color: 'hsl(142, 76%, 36%)', // green-600
    },
    removals: {
      label: 'Unvotes',
      color: 'hsl(0, 84%, 60%)', // red-500
    },
    net: {
      label: 'Net Change',
      color: 'hsl(217, 91%, 60%)', // blue-500
    },
    hpGained: {
      label: 'HP Gained',
      color: 'hsl(142, 76%, 36%)', // green-600
    },
    hpLost: {
      label: 'HP Lost',
      color: 'hsl(0, 84%, 60%)', // red-500
    },
    hpNetChange: {
      label: 'Net HP Change',
      color: 'hsl(217, 91%, 60%)', // blue-500
    },
  };

  // Format date for display based on time range
  const formatDate = (dateStr: string, index: number) => {
    const date = new Date(dateStr);
    
    // For year view, only show month labels at month boundaries
    if (timeRange === 365) {
      const dayOfMonth = date.getDate();
      // Only show label on 1st of month
      if (dayOfMonth === 1) {
        return date.toLocaleDateString('en-US', { month: 'short' });
      }
      return ''; // Hide other dates
    }
    
    // For 30 days, show every 5th date to reduce crowding
    if (timeRange === 30) {
      if (index % 5 === 0 || index === trends.length - 1) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return '';
    }
    
    // For 7 days, show every other date on mobile
    if (timeRange === 7 && index % 2 !== 0) {
      return '';
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Prepare chart data
  const chartData = trends.map((day, index) => ({
    date: formatDate(day.date, index),
    fullDate: day.date,
    approvals: day.approvals,
    removals: day.removals,
    net: day.net,
    hpGained: Math.round(day.hpGained),
    hpLost: Math.round(day.hpLost),
    hpNetChange: Math.round(day.hpNetChange),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Voting Trends
            </CardTitle>
            <CardDescription>
              Historical voting activity over the past {timeRange} days
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={timeRange === 365 ? "30" : timeRange.toString()} onValueChange={(v) => setTimeRange(Number(v) as 7 | 30)}>
              <TabsList>
                <TabsTrigger value="7" className="text-xs sm:text-sm">7 Days</TabsTrigger>
                <TabsTrigger value="30" className="text-xs sm:text-sm">30 Days</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {timeRange !== 365 && (
              <button
                onClick={handleLoadYear}
                disabled={loadingYear}
                className="px-3 py-1.5 text-xs sm:text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {loadingYear ? 'Loading...' : 'Load Year'}
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : trends.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No voting activity in the past {timeRange} days</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vote Count Summary Stats */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Vote Activity Summary</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                  <div className="text-3xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    {totalApprovals}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total New Votes</div>
              </div>

              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingDown className="h-5 w-5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                  <div className="text-3xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                    {totalRemovals}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Unvotes</div>
              </div>

              <div className={`p-4 rounded-lg text-center ${
                netChange > 0 
                  ? 'bg-blue-50 dark:bg-blue-950' 
                  : netChange < 0 
                  ? 'bg-orange-50 dark:bg-orange-950' 
                  : 'bg-gray-50 dark:bg-gray-950'
              }`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Activity className="h-5 w-5 sm:h-4 sm:w-4" />
                  <div className={`text-3xl sm:text-2xl font-bold ${
                    netChange > 0 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : netChange < 0 
                      ? 'text-orange-600 dark:text-orange-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {netChange > 0 ? '+' : ''}{netChange}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Net Change ({averageDaily}/day avg)
                </div>
              </div>
              </div>
            </div>
            
            {/* HP Power Summary Stats */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Hive Power Impact</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <TrendingUp className="h-5 w-5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                    <div className="text-2xl sm:text-xl font-bold text-green-600 dark:text-green-400">
                      {formatHP(totalHPGained)}
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">HP Gained</div>
                </div>

                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <TrendingDown className="h-5 w-5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                    <div className="text-2xl sm:text-xl font-bold text-red-600 dark:text-red-400">
                      {formatHP(totalHPLost)}
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">HP Lost</div>
                </div>

                <div className={`p-4 rounded-lg text-center ${
                  netHPChange > 0 
                    ? 'bg-blue-50 dark:bg-blue-950' 
                    : netHPChange < 0 
                    ? 'bg-orange-50 dark:bg-orange-950' 
                    : 'bg-gray-50 dark:bg-gray-950'
                }`}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Activity className="h-5 w-5 sm:h-4 sm:w-4" />
                    <div className={`text-2xl sm:text-xl font-bold ${
                      netHPChange > 0 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : netHPChange < 0 
                        ? 'text-orange-600 dark:text-orange-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {netHPChange > 0 ? '+' : ''}{formatHP(netHPChange)}
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Net HP Change
                  </div>
                </div>
              </div>
            </div>

            {/* Stacked Bar Chart */}
            <div className="w-full overflow-x-auto">
              <h4 className="text-sm font-medium mb-3">Daily Vote Activity</h4>
              <ChartContainer config={chartConfig} className="h-64 w-full min-w-[300px]">
                <BarChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: 0, bottom: timeRange === 365 ? 20 : 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                    height={35}
                    angle={timeRange >= 30 ? -45 : 0}
                    textAnchor={timeRange >= 30 ? 'end' : 'middle'}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    width={35}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        labelFormatter={(value, payload) => {
                          const item = payload?.[0]?.payload;
                          return item?.fullDate || value;
                        }}
                      />
                    }
                  />
                  <Bar 
                    dataKey="approvals" 
                    stackId="a" 
                    fill="var(--color-approvals)"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="removals" 
                    stackId="a" 
                    fill="var(--color-removals)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Hive Power Swing Chart */}
            <div className="w-full overflow-x-auto">
              <h4 className="text-sm font-medium mb-3">Hive Power Changes</h4>
              <ChartContainer config={chartConfig} className="h-64 w-full min-w-[300px]">
                <BarChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: 0, bottom: timeRange === 365 ? 20 : 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                    height={35}
                    angle={timeRange >= 30 ? -45 : 0}
                    textAnchor={timeRange >= 30 ? 'end' : 'middle'}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    width={55}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value;
                    }}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        labelFormatter={(value, payload) => {
                          const item = payload?.[0]?.payload;
                          return item?.fullDate || value;
                        }}
                        formatter={(value) => {
                          const num = Number(value);
                          if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M HP`;
                          if (num >= 1000) return `${(num / 1000).toFixed(1)}K HP`;
                          return `${num.toFixed(0)} HP`;
                        }}
                      />
                    }
                  />
                  <Bar 
                    dataKey="hpGained" 
                    stackId="hp" 
                    fill="var(--color-hpGained)"
                    radius={[0, 0, 0, 0]}
                    name="HP Gained"
                  />
                  <Bar 
                    dataKey="hpLost" 
                    stackId="hp" 
                    fill="var(--color-hpLost)"
                    radius={[4, 4, 0, 0]}
                    name="HP Lost"
                  />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Net Change Area Chart */}
            <div className="w-full overflow-x-auto">
              <h4 className="text-sm font-medium mb-3">Net Vote Change Over Time</h4>
              <ChartContainer config={chartConfig} className="h-48 w-full min-w-[300px]">
                <AreaChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: 0, bottom: timeRange === 365 ? 20 : 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                    height={35}
                    angle={timeRange >= 30 ? -45 : 0}
                    textAnchor={timeRange >= 30 ? 'end' : 'middle'}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    width={35}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        labelFormatter={(value, payload) => {
                          const item = payload?.[0]?.payload;
                          return item?.fullDate || value;
                        }}
                      />
                    }
                  />
                  <Area 
                    dataKey="net" 
                    type="monotone"
                    fill="var(--color-net)"
                    fillOpacity={0.2}
                    stroke="var(--color-net)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
