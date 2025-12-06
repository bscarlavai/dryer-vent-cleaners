'use client'
import { useEffect, useState } from 'react';
import TopStatesCard from './TopStatesCard';
import { getSupabaseClient } from '@/lib/supabase';

interface TopStatesSectionProps {
  limit?: number;
  className?: string;
}

export default function TopStatesSection({ limit = 3, className = '' }: TopStatesSectionProps) {
  const [topStates, setTopStates] = useState<Array<{ name: string; count: number; rank: number; slug: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopStates() {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('states_with_location_counts')
        .select('*');
      if (error) {
        setTopStates([]);
        setLoading(false);
        return;
      }
      const states = (data || [])
        .filter((row: any) => row.state)
        .sort((a: any, b: any) => b.location_count - a.location_count)
        .slice(0, limit)
        .map((row: any, index: number) => ({
          name: row.state,
          count: Number(row.location_count),
          slug: row.state.toLowerCase().replace(/\s+/g, '-'),
          rank: index + 1,
        }));
      setTopStates(states);
      setLoading(false);
    }
    fetchTopStates();
  }, [limit]);

  if (loading) {
    return <div className={className}>Loading top states...</div>;
  }
  if (topStates.length === 0) {
    return <div className={className}>No top states found.</div>;
  }
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {topStates.map((state) => (
        <TopStatesCard
          key={state.slug}
          name={state.name}
          count={state.count}
          rank={state.rank}
          href={`/states/${state.slug}`}
        />
      ))}
    </div>
  );
} 