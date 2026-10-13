import "server-only";
import { CodeforcesClient } from "./client";
import { externalFetch } from "../http";
export const codeforces = new CodeforcesClient(externalFetch);
