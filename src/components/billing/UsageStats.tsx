
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UsageStatsProps {
  subscription: {
    subscribed: boolean;
    subscription_tier: string | null;
  } | null;
}

const UsageStats: React.FC<UsageStatsProps> = ({ subscription }) => {
  // Hardcoded usage values as requested
  const usageStats = [
    { name: "Short Links", used: 4, total: 100, percentage: 4 },
    { name: "Custom back-halves", used: 20, total: 100, percentage: 20 },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Monthly Usage</h3>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-md">Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {usageStats.map((stat) => (
                <TableRow key={stat.name}>
                  <TableCell className="font-medium">{stat.name}</TableCell>
                  <TableCell className="w-[60%]">
                    <div className="space-y-1">
                      <Progress value={stat.percentage} className="h-2" />
                      <p className="text-sm text-gray-500 text-right">
                        {stat.used} of {stat.total} used
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageStats;
