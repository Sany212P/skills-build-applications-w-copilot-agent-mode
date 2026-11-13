import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; reason?: string };

const loadSuggestions = () =>
  getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
    .then(({ suggestions }) => suggestions);

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      emptyMessage="No workout suggestions to show yet."
      loadItems={loadSuggestions}
      renderItem={(workout) => <>{workout.title}{workout.reason ? ` — ${workout.reason}` : ''}</>}
    />
  );
}
