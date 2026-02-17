import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Plus, 
  Trash2, 
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  category: 'assessment' | 'learning' | 'career' | 'skill';
}

export function WeeklyGoals() {
  const { userSkills, learningPath } = useApp();
  const [goals, setGoals] = useState<Goal[]>(() => {
    // Generate default goals based on user state
    const defaultGoals: Goal[] = [];
    
    if (userSkills.length === 0) {
      defaultGoals.push({
        id: '1',
        title: 'Complete first skill assessment',
        completed: false,
        category: 'assessment'
      });
    }
    
    if (!learningPath) {
      defaultGoals.push({
        id: '2',
        title: 'Explore career matches',
        completed: false,
        category: 'career'
      });
    }
    
    if (learningPath && (learningPath.progress || 0) < 100) {
      defaultGoals.push({
        id: '3',
        title: 'Complete next learning step',
        completed: false,
        category: 'learning'
      });
    }
    
    return defaultGoals;
  });

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const completedCount = goals.filter(g => g.completed).length;
  const totalCount = goals.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const toggleGoal = (id: string) => {
    setGoals(goals.map(g => 
      g.id === id ? { ...g, completed: !g.completed } : g
    ));
  };

  const addGoal = () => {
    if (newGoalTitle.trim()) {
      setGoals([...goals, {
        id: Date.now().toString(),
        title: newGoalTitle,
        completed: false,
        category: 'skill'
      }]);
      setNewGoalTitle('');
      setShowAddForm(false);
    }
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'assessment': return 'bg-blue-100 text-blue-700';
      case 'learning': return 'bg-purple-100 text-purple-700';
      case 'career': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              Weekly Goals
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {completedCount} of {totalCount} completed
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <Progress value={progress} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {showAddForm && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="Add a new goal..."
              className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background"
              onKeyDown={(e) => e.key === 'Enter' && addGoal()}
            />
            <Button size="sm" onClick={addGoal}>Add</Button>
          </div>
        )}

        <div className="space-y-2">
          {goals.map((goal) => (
            <div 
              key={goal.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <Checkbox 
                checked={goal.completed}
                onCheckedChange={() => toggleGoal(goal.id)}
              />
              <div className="flex-1 min-w-0">
                <span className={`text-sm block truncate ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {goal.title}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${getCategoryColor(goal.category)}`}>
                  {goal.category}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteGoal(goal.id)}
              >
                <Trash2 className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>

        {goals.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No goals set for this week</p>
            <Button 
              variant="link" 
              size="sm" 
              className="mt-1"
              onClick={() => setShowAddForm(true)}
            >
              Add your first goal
            </Button>
          </div>
        )}

        {progress === 100 && goals.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">All goals completed! 🎉</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
