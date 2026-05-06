"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface SessionContextValue {
  sessionId: string | null;
  setSessionId: (id: string) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextValue>({
  sessionId: null,
  setSessionId: () => {},
  clearSession: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionIdState] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("triage_session_id");
    if (stored) setSessionIdState(stored);
  }, []);

  const setSessionId = (id: string) => {
    sessionStorage.setItem("triage_session_id", id);
    setSessionIdState(id);
  };

  const clearSession = () => {
    sessionStorage.removeItem("triage_session_id");
    setSessionIdState(null);
  };

  return (
    <SessionContext.Provider value={{ sessionId, setSessionId, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
