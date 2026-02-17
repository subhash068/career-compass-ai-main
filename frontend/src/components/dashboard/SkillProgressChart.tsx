import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

export function SkillProgressChart() {
  const { userSkills, isLoadingSkills } = useApp();

  // Generate progress data from user skills
  const progressData = userSkills
    .filter((s: any) => s.score > 0)
    .sort((a: any, b: any) => {
      const dateA = new Date(a.assessedAt || a.assessed_at || 0);
      const dateB = new Date(b.assessedAt || b.assessed_at || 0);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(-10) // Last 10 assessments
    .map((skill: any, index: number) => ({
      date: new Date(skill.assessedAt || skill.assessed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      score: skill.score || 0,
      skill: skill.skill?.name || skill.skill_name || `Skill ${index + 1}`,
      fullDate: new Date(skill.assessedAt || skill.assessed_at).toLocaleDateString()
    }));

  if (isLoadingSkills) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (progressData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Skill Progress
          </CardTitle>
          <p className="text-sm text-muted-foreground">Track your improvement over time</p>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Complete assessments to see your progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Skill Progress
        </CardTitle>
        <p className="text-sm text-muted-foreground">Track your improvement over time</p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={progressData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${value}% - ${props.payload.skill}`,
                  'Score'
                ]}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorScore)"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
