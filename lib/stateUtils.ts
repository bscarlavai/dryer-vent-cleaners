import { getSupabaseClient } from './supabase'

// This function assumes you have a Postgres function (RPC) called 'states_with_location_counts'
// that returns rows with { state: string, location_count: number }
export async function getStatesWithLocations() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('states_with_location_counts')
      .select('*');

    if (error) {
      console.error('Error fetching states:', error);
      return [];
    }

    // Each row: { state: string, location_count: number }
    const states = (data || [])
      .filter((row: any) => row.state)
      .map((row: any) => ({
        name: row.state,
        locationCount: Number(row.location_count),
        slug: row.state.toLowerCase().replace(/\s+/g, '-')
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return states;
  } catch (error) {
    console.error('Error fetching states:', error);
    return [];
  }
}

export async function getOpen24HourLocationCount() {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('open_24_hour_locations')
    .select('location_id', { count: 'exact', head: true })
    .eq('review_status', 'approved');
  if (error) {
    console.error('Error fetching 24-hour location count:', error);
    return 0;
  }
  return count || 0;
}
