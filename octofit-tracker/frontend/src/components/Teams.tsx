import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: string[] };

const loadTeams = () => getJson<{ teams: Team[] }>('/api/teams').then(({ teams }) => teams);

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      emptyMessage="No teams to show yet."
      loadItems={loadTeams}
      renderItem={(team) => <>{team.name} — {team.members.length} members</>}
    />
  );
}
