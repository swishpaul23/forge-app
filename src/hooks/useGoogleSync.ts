import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClientType, SupabaseClientUntyped, User } from "../types";
import type { TimeBlock } from "./useTimeBlocks";

type GoogleTokenRow = {
  access_token: string;
  expires_at: string;
  google_email: string | null;
  last_synced_at: string | null;
};

export type ChallengeTask = {
  key: string;
  label: string;
  cat: string;
  nonNeg?: boolean;
  gtask_id?: string | null;
};

export type ForgeChallenge = {
  id: string;
  name: string;
  kpis: ChallengeTask[];
  gtask_list_id?: string | null;
};

export type Challenges = { main: ForgeChallenge | null; secondary: ForgeChallenge[] };
export type Kpis = Record<string, boolean>;

export interface GoogleSyncHook {
  isConnected: boolean;
  email: string | null;
  lastSyncedAt: string | null;
  connect: () => void;
  disconnect: () => void;
  pushBlockToCalendar: (block: TimeBlock) => Promise<string | null>;
  updateCalendarEvent: (block: TimeBlock) => Promise<void>;
  deleteCalendarEvent: (gcalEventId: string) => Promise<void>;
  // Not in the original interface sketch, but required by it: creating a
  // challenge's Google Tasks list/tasks has to go through this hook's token
  // handling too, so App.jsx isn't duplicating googleFetch's error handling.
  createTaskList: (name: string) => Promise<string | null>;
  createTask: (listId: string, label: string) => Promise<string | null>;
  pushTaskCompletion: (task: ChallengeTask, listId: string) => Promise<void>;
  pollTaskCompletions: (challenges: Challenges, kpis: Kpis) => Promise<Partial<Kpis>>;
}

const REDIRECT_PATH = "/app";
const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/tasks",
  "openid",
  "email",
].join(" ");

// Google Calendar's colorId is a fixed 1–11 palette, not arbitrary hex, so
// custom user tags (arbitrary hex) fall back to the calendar's default
// color — only the four built-in system tags get a deliberate mapping.
const TAG_TO_GCAL_COLOR: Record<string, string> = {
  fitness: "11", // Tomato
  mindset: "3",  // Grape
  work:    "9",  // Blueberry
  rest:    "10", // Basil
};

const randomState = (): string => Math.random().toString(36).slice(2) + Date.now().toString(36);

function buildGCalEvent(block: TimeBlock) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const start = new Date(`${block.date}T00:00:00`);
  start.setHours(Math.floor(block.start_time), (block.start_time % 1) * 60, 0, 0);
  const end = new Date(start.getTime() + block.duration * 60 * 60 * 1000);

  const colorId = block.tag_id ? TAG_TO_GCAL_COLOR[block.tag_id] : undefined;

  return {
    summary: block.label,
    description: block.completed ? "✓ Completed in Forge" : "",
    start: { dateTime: start.toISOString(), timeZone },
    end:   { dateTime: end.toISOString(),   timeZone },
    ...(colorId ? { colorId } : {}),
  };
}

export function useGoogleSync(sb: SupabaseClientType | null, user: User | null | undefined): GoogleSyncHook {
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // The access token itself never needs to trigger a re-render, so it lives
  // in a ref rather than state — only connected/email/lastSyncedAt are
  // UI-facing.
  const tokenRef = useRef<{ accessToken: string; expiresAt: string } | null>(null);

  const loadConnectionState = useCallback(async () => {
    if (!sb || !user) return;
    const { data } = await (sb as SupabaseClientUntyped)
      .from("google_tokens")
      .select("access_token, expires_at, google_email, last_synced_at")
      .eq("user_id", user.id)
      .maybeSingle<GoogleTokenRow>();

    if (data) {
      tokenRef.current = { accessToken: data.access_token, expiresAt: data.expires_at };
      setConnected(true);
      setEmail(data.google_email ?? null);
      setLastSyncedAt(data.last_synced_at ?? null);
    } else {
      tokenRef.current = null;
      setConnected(false);
      setEmail(null);
      setLastSyncedAt(null);
    }
  }, [sb, user]);

  // Runs once per session: picks up an OAuth redirect (?code=...) if present,
  // otherwise loads whatever connection state already exists in the DB.
  useEffect(() => {
    if (!sb || !user) return;

    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");

    if (code) {
      const expectedState = sessionStorage.getItem("forge_google_oauth_state");
      sessionStorage.removeItem("forge_google_oauth_state");
      url.searchParams.delete("code");
      url.searchParams.delete("state");
      window.history.replaceState({}, "", url.toString());

      if (returnedState && returnedState === expectedState) {
        const redirectUri = `${window.location.origin}${REDIRECT_PATH}`;
        sb.functions.invoke("google-oauth", { body: { action: "exchange", code, redirectUri } })
          .then(({ data, error }) => {
            if (error || (data && data.error)) {
              console.warn("[useGoogleSync] exchange failed:", error ?? data?.error);
              return;
            }
            loadConnectionState();
          })
          .catch(e => console.warn("[useGoogleSync] exchange failed:", e));
      }
      return;
    }

    loadConnectionState();
  }, [sb, user, loadConnectionState]);

  const handleRefreshFailure = useCallback(() => {
    // Per spec: a failed refresh means "disconnected, prompt reconnect" —
    // we clear local state but leave the DB row alone; connect() will
    // overwrite it on the next successful exchange.
    tokenRef.current = null;
    setConnected(false);
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!sb) return null;
    try {
      const { data, error } = await sb.functions.invoke("google-oauth", { body: { action: "refresh" } });
      if (error || !data?.accessToken) {
        handleRefreshFailure();
        return null;
      }
      tokenRef.current = { accessToken: data.accessToken, expiresAt: data.expiresAt };
      setConnected(true);
      return data.accessToken;
    } catch (e) {
      console.warn("[useGoogleSync] token refresh failed:", e);
      handleRefreshFailure();
      return null;
    }
  }, [sb, handleRefreshFailure]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const cached = tokenRef.current;
    if (cached && new Date(cached.expiresAt).getTime() - Date.now() > 60_000) {
      return cached.accessToken;
    }
    return refreshAccessToken();
  }, [refreshAccessToken]);

  const touchLastSynced = useCallback(async () => {
    if (!sb || !user) return;
    const now = new Date().toISOString();
    try {
      await (sb as SupabaseClientUntyped).from("google_tokens").update({ last_synced_at: now }).eq("user_id", user.id);
      setLastSyncedAt(now);
    } catch (e) {
      // non-fatal — sync timestamp is informational only
    }
  }, [sb, user]);

  // Every outbound Google API call funnels through here so the 401/429/
  // never-throw rules only need to be implemented once.
  const googleFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response | null> => {
    const token = await getAccessToken();
    if (!token) return null;

    const doFetch = (accessToken: string) =>
      fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${accessToken}` } });

    try {
      let res = await doFetch(token);

      if (res.status === 401) {
        const fresh = await refreshAccessToken();
        if (!fresh) return null;
        res = await doFetch(fresh);
      }
      if (res.status === 429) {
        console.warn("[useGoogleSync] rate limited, skipping:", url);
        return null;
      }
      if (!res.ok) {
        console.warn("[useGoogleSync] request failed:", res.status, url);
        return null;
      }
      return res;
    } catch (e) {
      console.warn("[useGoogleSync] network error:", e);
      return null;
    }
  }, [getAccessToken, refreshAccessToken]);

  const connect = useCallback(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      console.warn("[useGoogleSync] VITE_GOOGLE_CLIENT_ID is not set");
      return;
    }
    const state = randomState();
    sessionStorage.setItem("forge_google_oauth_state", state);
    sessionStorage.setItem("forge_post_oauth_page", "settings");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}${REDIRECT_PATH}`,
      response_type: "code",
      scope: OAUTH_SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }, []);

  const disconnect = useCallback(() => {
    if (!sb) return;
    sb.functions.invoke("google-oauth", { body: { action: "disconnect" } })
      .catch(e => console.warn("[useGoogleSync] disconnect failed:", e))
      .finally(() => {
        tokenRef.current = null;
        setConnected(false);
        setEmail(null);
      });
  }, [sb]);

  const pushBlockToCalendar = useCallback(async (block: TimeBlock): Promise<string | null> => {
    if (!connected) return null;
    try {
      const res = await googleFetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildGCalEvent(block)),
      });
      if (!res) return null;
      const data = await res.json();
      await touchLastSynced();
      return data.id ?? null;
    } catch (e) {
      console.warn("[useGoogleSync] pushBlockToCalendar failed:", e);
      return null;
    }
  }, [connected, googleFetch, touchLastSynced]);

  const updateCalendarEvent = useCallback(async (block: TimeBlock): Promise<void> => {
    if (!connected) return;
    try {
      if (!block.gcal_event_id) {
        // No event yet — create instead of patching. updateCalendarEvent
        // returns void (per the hook interface) so, unlike
        // pushBlockToCalendar, it's responsible for persisting the new id
        // itself rather than handing it back to the caller.
        const id = await pushBlockToCalendar(block);
        if (id && sb) {
          await (sb as SupabaseClientUntyped).from("time_blocks").update({ gcal_event_id: id }).eq("id", block.id);
        }
        return;
      }
      const res = await googleFetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${block.gcal_event_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildGCalEvent(block)),
        }
      );
      if (res) await touchLastSynced();
    } catch (e) {
      console.warn("[useGoogleSync] updateCalendarEvent failed:", e);
    }
  }, [connected, googleFetch, pushBlockToCalendar, sb, touchLastSynced]);

  const deleteCalendarEvent = useCallback(async (gcalEventId: string): Promise<void> => {
    if (!connected) return;
    try {
      await googleFetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${gcalEventId}`, {
        method: "DELETE",
      });
      await touchLastSynced();
    } catch (e) {
      console.warn("[useGoogleSync] deleteCalendarEvent failed:", e);
    }
  }, [connected, googleFetch, touchLastSynced]);

  const createTaskList = useCallback(async (name: string): Promise<string | null> => {
    if (!connected) return null;
    try {
      const res = await googleFetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: name }),
      });
      if (!res) return null;
      const data = await res.json();
      await touchLastSynced();
      return data.id ?? null;
    } catch (e) {
      console.warn("[useGoogleSync] createTaskList failed:", e);
      return null;
    }
  }, [connected, googleFetch, touchLastSynced]);

  const createTask = useCallback(async (listId: string, label: string): Promise<string | null> => {
    if (!connected || !listId) return null;
    try {
      const res = await googleFetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: label }),
      });
      if (!res) return null;
      const data = await res.json();
      await touchLastSynced();
      return data.id ?? null;
    } catch (e) {
      console.warn("[useGoogleSync] createTask failed:", e);
      return null;
    }
  }, [connected, googleFetch, touchLastSynced]);

  const pushTaskCompletion = useCallback(async (task: ChallengeTask, listId: string): Promise<void> => {
    if (!connected || !task.gtask_id || !listId) return;
    try {
      const res = await googleFetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${task.gtask_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        }
      );
      if (res) await touchLastSynced();
    } catch (e) {
      console.warn("[useGoogleSync] pushTaskCompletion failed:", e);
    }
  }, [connected, googleFetch, touchLastSynced]);

  const pollTaskCompletions = useCallback(async (challenges: Challenges, kpis: Kpis): Promise<Partial<Kpis>> => {
    if (!connected) return {};
    const listId = challenges.main?.gtask_list_id;
    if (!listId) return {};

    try {
      const res = await googleFetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`);
      if (!res) return {};
      const data = await res.json();
      const googleTasks: { id: string; status: string }[] = data.items ?? [];

      const updates: Partial<Kpis> = {};
      for (const kpi of challenges.main?.kpis ?? []) {
        if (!kpi.gtask_id || kpis[kpi.key]) continue;
        const match = googleTasks.find(t => t.id === kpi.gtask_id);
        if (match?.status === "completed") updates[kpi.key] = true;
      }
      if (Object.keys(updates).length > 0) await touchLastSynced();
      return updates;
    } catch (e) {
      console.warn("[useGoogleSync] pollTaskCompletions failed:", e);
      return {};
    }
  }, [connected, googleFetch, touchLastSynced]);

  return {
    isConnected: connected,
    email,
    lastSyncedAt,
    connect,
    disconnect,
    pushBlockToCalendar,
    updateCalendarEvent,
    deleteCalendarEvent,
    createTaskList,
    createTask,
    pushTaskCompletion,
    pollTaskCompletions,
  };
}
