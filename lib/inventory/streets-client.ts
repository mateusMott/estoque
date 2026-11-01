"use client";
import { useCallback, useEffect, useState } from "react";
import type { Street } from "./streets";

export function useStreets() {
  const [streets, setStreets] = useState<Street[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/streets", { cache: "no-store" });
      const data = (await response.json()) as {
        streets: Street[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error);
      setStreets(data.streets);
    } catch {
      setError(
        "Não foi possível carregar as ruas. Verifique a conexão e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { streets, loading, error, reload };
}
