import { useApp } from '@/contexts/AppContext';
import { skillCategories, skills } from '@/lib/mock-data';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SkillsOverview() {
  const { userSkills, isLoadingSkills } = useApp();

  // Vibrant colors for different categories
  const categoryColors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
  ];

  // Aggregate skills by category for radar chart
  const categoryData = skillCategories.slice(0, 6).map((cat, index) => {
    const categorySkills = userSkills.filter(us => {
      const skill = skills.find(s => s.id === us.skillId);
      return skill?.categoryId === cat.id;
    });
    const avgScore = categorySkills.length > 0
      ? Math.round(categorySkills.reduce((sum, s) => sum + s.score, 0) / categorySkills.length)
      : 0;
    return {
      category: cat.name.split(' ')[0], // Shorten name
      score: avgScore,
      fullMark: 100,
      color: categoryColors[index % categoryColors.length],
    };
  });

  if (isLoadingSkills) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full space-y-2">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display">Skills Radar</CardTitle>
        <p className="text-sm text-muted-foreground">Your skill distribution across categories</p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={categoryData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <defs>
                {categoryData.map((entry, index) => (
                  <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={entry.color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={entry.color} stopOpacity={0.1}/>
                  </linearGradient>
                ))}
              </defs>
              <PolarGrid
                stroke="hsl(var(--border))"
                strokeWidth={1}
                gridType="polygon"
              />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
                className="text-sm"
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickCount={5}
              />
              {categoryData.map((entry, index) => (
                <Radar
                  key={`radar-${index}`}
                  name={entry.category}
                  dataKey="score"
                  stroke={entry.color}
                  fill={`url(#gradient-${index})`}
                  fillOpacity={0.6}
                  strokeWidth={3}
                  dot={{ fill: entry.color, strokeWidth: 2, r: 4 }}
                  animationBegin={index * 200}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              ))}
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  padding: '12px',
                }}
                labelStyle={{
                  color: 'hsl(var(--foreground))',
                  fontWeight: 600,
                  fontSize: '14px',
                  marginBottom: '4px'
                }}
                itemStyle={{
                  color: 'hsl(var(--foreground))',
                  fontSize: '13px'
                }}
                formatter={(value: number, name: string) => [`${value}%`, name]}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '10px',
                  fontSize: '12px'
                }}
                iconType="circle"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
