import { createBrowserRouter } from "react-router-dom";
import ScaffoldHome from "./ScaffoldHome";

// Placeholder router for the scaffolding step.
// Real routes (auth guard, team/player/match/stats) are added in later steps.
export const router = createBrowserRouter([
  {
    path: "/",
    element: <ScaffoldHome />,
  },
]);
