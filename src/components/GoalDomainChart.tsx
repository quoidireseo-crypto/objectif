import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Goal, LifeDomain } from '../types';

interface GoalDomainChartProps {
  goals: Goal[];
}

const DOMAINS: LifeDomain[] = [
  'Santé & Bien-être',
  'Projet Personnel',
  'Relations & Famille',
  'Apprentissage',
  'Finances',
  'Spiritualité',
  'Autre'
];

export function GoalDomainChart({ goals }: GoalDomainChartProps) {
  const data = useMemo(() => {
    return DOMAINS.map(domain => {
      const domainGoals = goals.filter(g => g.domain === domain);
      const total = domainGoals.length;
      const completed = domainGoals.filter(g => g.status === 'Atteint').length;
      
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      let shortName: string = domain;
      if (domain === 'Santé & Bien-être') shortName = 'Santé';
      if (domain === 'Projet Personnel') shortName = 'Projets';
      if (domain === 'Relations & Famille') shortName = 'Relations';
      
      return {
        name: shortName,
        fullDomain: domain,
        taux: rate,
        total,
        completed
      };
    }).filter(d => d.total > 0);
  }, [goals]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm w-full">
      <div className="mb-6">
        <h3 className="text-xl md:text-2xl font-light text-stone-900">Progression par Pilier</h3>
        <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 font-sans mt-1">Taux d'atteinte des objectifs selon le domaine de vie</p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE7E2" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#a8a29e', fontFamily: 'Inter, sans-serif' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#a8a29e', fontFamily: 'Inter, sans-serif' }}
              dx={-10}
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: '1px solid #e7e5e4', fontSize: '12px', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
              itemStyle={{ color: '#047857', fontWeight: 'bold' }}
              labelStyle={{ color: '#78716c', marginBottom: '4px' }}
              formatter={(value: number, name: string, props: any) => [`${value}% (${props.payload.completed}/${props.payload.total})`, 'Complétion']}
              labelFormatter={(label, props) => props.length > 0 ? props[0].payload.fullDomain : label}
              cursor={{ fill: '#f5f5f4' }}
            />
            <Bar 
              dataKey="taux" 
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.taux === 100 ? '#047857' : '#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
