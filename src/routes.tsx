import { createBrowserRouter, type RouteObject } from "react-router-dom";
import RequireAuth from "./core/auth/RequireAuth";
import CatchAllRedirect from "./core/auth/CatchAllRedirect";
import AppLayout from "./components/AppShell/AppLayout";
import LandingPage from "./features/landing/LandingPage";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import TeamListPage from "./features/team/TeamListPage";
import TeamDetailLayout from "./features/team/TeamDetailLayout";
import TeamOverview from "./features/team/TeamOverview";
import SquadPage from "./features/player/SquadPage";
import PlayerDetailPage from "./features/player/PlayerDetailPage";
import MatchListPage from "./features/match/MatchListPage";
import MatchDetailPage from "./features/match/MatchDetailPage";
import TeamStatsPage from "./features/stats/TeamStatsPage";
import SettingsPage from "./features/settings/SettingsPage";

// Exported so integration tests can mount the same tree under a memory router.
export const routes: RouteObject[] = [
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/myteam", element: <TeamListPage /> },
          { path: "/settings", element: <SettingsPage /> },
          {
            path: "/teams/:teamId",
            element: <TeamDetailLayout />,
            children: [
              { index: true, element: <TeamOverview /> },
              { path: "squad", element: <SquadPage /> },
              { path: "matches", element: <MatchListPage /> },
              { path: "stats", element: <TeamStatsPage /> },
            ],
          },
          {
            path: "/teams/:teamId/matches/:matchId",
            element: <MatchDetailPage />,
          },
          {
            path: "/teams/:teamId/players/:playerId",
            element: <PlayerDetailPage />,
          },
        ],
      },
    ],
  },
  { path: "*", element: <CatchAllRedirect /> },
];

export const router = createBrowserRouter(routes);
