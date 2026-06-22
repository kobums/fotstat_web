import { useOutletContext } from "react-router-dom";
import type { Team } from "../../core/api/types";

export interface TeamOutletContext {
  team: Team;
}

/** Access the current team provided by TeamDetailLayout's <Outlet>. */
export function useTeamContext(): TeamOutletContext {
  return useOutletContext<TeamOutletContext>();
}
