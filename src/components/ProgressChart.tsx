import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AppData, Task } from '../types';

interface ProgressChartProps {
  tasks: Task[];
}

export function ProgressChart({ tasks }: ProgressChartProps) {
  const data = useMemo(() => {
    // Generate the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      // Find tasks for this day
      const dayTasks = tasks.filter(t => t.date === date);
      const total = dayTasks.length;
      const completed = dayTasks.filter(t => t.isCompleted).length;
      
      // Calculate completion rate (0 if no tasks)
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        name: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date(date)),
        date,
        taux: rate,
        total,
        completed
      };
    });
  }, [tasks]);

  return (
    <div className="bg-white dark:bg-stone-900 p-6 md:p-8 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm w-full">
      <div className="mb-6">
        <h3 className="text-xl md:text-2xl font-light text-stone-900 dark:text-stone-100">Tes avancées</h3>
        <p className="text-[11px] tracking-wide text-stone-400 dark:text-stone-500 font-sans italic mt-1">Les petits et grands pas accomplis vers tes objectifs cette semaine.</p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTaux" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#047857" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#047857" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE7E2" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#a8a29e', fontFamily: 'Inter, sans-serif', textTransform: 'capitalize' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#a8a29e', fontFamily: 'Inter, sans-serif' }}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: '1px solid #e7e5e4', fontSize: '12px', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
              itemStyle={{ color: '#047857', fontWeight: 'bold' }}
              labelStyle={{ color: '#78716c', marginBottom: '4px' }}
              formatter={(value: number) => [`${value}%`, 'Complétion']}
              labelFormatter={(label) => `Jour : ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="taux" 
              stroke="#047857" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorTaux)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
