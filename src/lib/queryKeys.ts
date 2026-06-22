// Centralized React Query keys so invalidation stays consistent.
export const qk = {
  teams: (userId: number) => ["teams", userId] as const,
  team: (id: number) => ["team", id] as const,
  players: (teamId: number) => ["players", teamId] as const,
  matches: (teamId: number) => ["matches", teamId] as const,
  match: (id: number) => ["match", id] as const,
  quarters: (matchId: number) => ["quarters", matchId] as const,
  records: (quarterId: number) => ["records", quarterId] as const,
};
