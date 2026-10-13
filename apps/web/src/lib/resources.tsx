"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAccount, api } from "./account";
import { DEMO_RESOURCES, DEMO_CATEGORIES } from "./demo-data";
import type { SupportResource, SupportCategory } from "./types";
interface Resources {
  resources: SupportResource[];
  categories: SupportCategory[];
  campuses: { id: string; name: string; status: string }[];
  loading: boolean;
  error: string;
}
const Context = createContext<Resources | null>(null);
export function ResourcesProvider({ children }: { children: ReactNode }) {
  const { demo, data, userId } = useAccount();
  const [value, setValue] = useState<Resources>({
    resources: [],
    categories: [],
    campuses: [],
    loading: !demo,
    error: "",
  });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const changed = () => setRevision((r) => r + 1);
    window.addEventListener("close-ai-resources-updated", changed);
    return () =>
      window.removeEventListener("close-ai-resources-updated", changed);
  }, []);
  const campus = data?.profile.campus_id;
  useEffect(() => {
    if (demo) return;
    let active = true;
    setValue((v) => ({ ...v, loading: true, error: "" }));
    api<Omit<Resources, "loading" | "error">>("/api/resources")
      .then((v) => {
        if (active)
          setValue({
            ...v,
            resources: userId
              ? v.resources.filter((r) => r.campusId === campus)
              : v.resources,
            loading: false,
            error: "",
          });
      })
      .catch(() => {
        if (active)
          setValue({
            resources: [],
            categories: [],
            campuses: [],
            loading: false,
            error: "Resources could not be loaded. Try again.",
          });
      });
    return () => {
      active = false;
    };
  }, [demo, campus, userId, revision]);
  return (
    <Context.Provider
      value={
        demo
          ? {
              resources: DEMO_RESOURCES,
              categories: DEMO_CATEGORIES,
              campuses: [
                {
                  id: "demo-u",
                  name: "Demo University — fictional",
                  status: "demo",
                },
              ],
              loading: false,
              error: "",
            }
          : value
      }
    >
      {children}
    </Context.Provider>
  );
}
export function useResources() {
  const value = useContext(Context);
  if (!value) throw new Error("ResourcesProvider required");
  return value;
}
