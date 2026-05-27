"use client";

import { useEffect, useRef, useState } from "react";
import { Client, type IMessage } from "@stomp/stompjs";

/**
 * Live attendance counters delivered on /topic/session/{id}/live.
 * Matches SessionEventPublisher.LiveCounters on the backend.
 */
export interface LiveCounters {
  present: number;
  absent: number;
  late: number;
  suspicious: number;
  pendingReview: number;
  total: number;
}

/**
 * Discriminated union mirroring SessionEventPublisher.SessionEvent on the
 * backend. The `type` field is the discriminator.
 */
export type SessionEvent =
  | {
      type: "ATTENDANCE_MARKED";
      sessionId: number;
      challengeId: number;
      studentId: number;
      studentName: string;
      status: "PRESENT" | "PENDING_REVIEW" | "SUSPICIOUS" | "LATE" | "REJECTED";
      riskScore: number;
      timestamp: string;
    }
  | {
      type: "CHALLENGE_STARTED";
      sessionId: number;
      challengeId: number;
      challengeCode: string;
      expiryTime: string;
      timestamp: string;
    }
  | { type: "CHALLENGE_EXPIRED"; sessionId: number; challengeId: number; timestamp: string }
  | { type: "SESSION_STARTED"; sessionId: number; timestamp: string }
  | { type: "SESSION_CLOSED"; sessionId: number; status: string; timestamp: string };

export type ConnectionState = "idle" | "connecting" | "connected" | "disconnected" | "error";

interface Options {
  /** Override the WebSocket URL. Defaults to ws(s)://{host}/ws. */
  url?: string;
  /** When false the hook stays idle (e.g. in mock mode). */
  enabled?: boolean;
  /** Latest N events to keep in memory. Default 50. */
  maxEvents?: number;
}

/**
 * Subscribes to a session's `/topic/session/{id}/events` and `/topic/session/{id}/live`.
 *
 * Returns:
 *   - `counters`     : the latest LiveCounters payload (null until first message)
 *   - `events`       : ring buffer of the latest events (newest first)
 *   - `state`        : connection state for UI feedback
 *
 * The hook is a no-op when `enabled === false` — useful in mock mode where
 * the backend isn't running and we don't want noisy reconnect attempts.
 */
export function useSessionLiveStream(
  sessionId: number | null,
  { url, enabled = true, maxEvents = 50 }: Options = {},
): { counters: LiveCounters | null; events: SessionEvent[]; state: ConnectionState } {
  const [counters, setCounters] = useState<LiveCounters | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [state, setState] = useState<ConnectionState>("idle");
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!enabled || sessionId == null) {
      setState("idle");
      return;
    }

    const wsUrl = url ?? buildWsUrl();
    if (!wsUrl) {
      setState("error");
      return;
    }

    setState("connecting");

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 4000,
      // STOMP is chatty in dev; flip these on if you need to debug.
      debug: () => {},
    });

    client.onConnect = () => {
      setState("connected");
      client.subscribe(`/topic/session/${sessionId}/events`, (msg: IMessage) => {
        try {
          const ev = JSON.parse(msg.body) as SessionEvent;
          setEvents(prev => [ev, ...prev].slice(0, maxEvents));
        } catch {
          // ignore malformed events
        }
      });
      client.subscribe(`/topic/session/${sessionId}/live`, (msg: IMessage) => {
        try {
          setCounters(JSON.parse(msg.body) as LiveCounters);
        } catch {
          // ignore
        }
      });
    };

    client.onStompError = () => setState("error");
    client.onWebSocketClose = () => setState("disconnected");

    client.activate();
    clientRef.current = client;

    return () => {
      void client.deactivate();
      clientRef.current = null;
    };
  }, [sessionId, enabled, url, maxEvents]);

  return { counters, events, state };
}

function buildWsUrl(): string | null {
  if (typeof window === "undefined") return null;
  // In dev the Next.js config proxies /api/backend/* but not /ws. The
  // simplest reliable option is to hit the backend directly via the
  // base URL provided in the env var (defaulting to localhost:8080).
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
  try {
    const u = new URL(apiBase);
    const wsProto = u.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProto}//${u.host}/ws`;
  } catch {
    return null;
  }
}
