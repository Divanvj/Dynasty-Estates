/*
  Response shapes of the /api/console routes, derived from the server functions
  so the two cannot drift. `import type` is erased at build time: nothing from
  the server modules (or firebase-admin) reaches the browser bundle.
*/
import type {
  getErrorGroups,
  getEventLog,
  getOverview,
  getUsers,
  getVitals,
  runIntegrityScan,
} from "@/lib/server/console-data";
import type { Check, getDeploys, getFirebaseStatus } from "@/lib/server/platform-checks";

export type Overview = Awaited<ReturnType<typeof getOverview>>;
export type ErrorGroups = Awaited<ReturnType<typeof getErrorGroups>>;
export type ErrorGroup = ErrorGroups["groups"][number];
export type Vitals = Awaited<ReturnType<typeof getVitals>>;
export type LogEvent = Awaited<ReturnType<typeof getEventLog>>[number];
export type IntegrityResult = Awaited<ReturnType<typeof runIntegrityScan>>;
export type ConsoleUser = Awaited<ReturnType<typeof getUsers>>[number];
export type Deploys = Awaited<ReturnType<typeof getDeploys>>;
export type FirebaseStatus = Awaited<ReturnType<typeof getFirebaseStatus>>;
export type GoLiveCheck = Check;
