import { useEffect, useState } from 'react';
import { reportsApi, settingsApi } from '../services/api';

// Regras do limiar (VoteThresholdPolicy.java) calculadas uma vez e compartilhadas entre as telas.
let cache = null;

function settingValue(list, key, fallback) {
  const found = list.find((s) => s.key === key);
  return found ? Number(found.value) : fallback;
}

async function load() {
  const [settings, participation] = await Promise.all([settingsApi.list(), reportsApi.participation()]);
  const quorumPercentage = settingValue(settings, 'quorum_percentage', 10);
  const minVotesFloor = Math.trunc(settingValue(settings, 'min_votes_floor', 5));
  const residents = participation.residents;
  return {
    residents,
    quorumPercentage,
    minVotesFloor,
    approvalPercentage: settingValue(settings, 'approval_percentage', 60),
    staleAfterDays: Math.trunc(settingValue(settings, 'stale_after_days', 90)),
    maxCategories: Math.trunc(settingValue(settings, 'max_categories_per_proposal', 3)),
    requiredVotes: Math.max(minVotesFloor, Math.ceil((residents * quorumPercentage) / 100 - 1e-9)),
  };
}

/** Descarta o cache (ex.: depois de uma autoridade mudar os parâmetros). */
export function invalidateThreshold() {
  cache = null;
}

export function useThreshold() {
  const [data, setData] = useState(cache?.data ?? null);

  useEffect(() => {
    if (cache?.data) {
      setData(cache.data);
      return undefined;
    }
    if (!cache) {
      const entry = { data: null, promise: load() };
      entry.promise.then(
        (result) => {
          entry.data = result;
        },
        () => {
          if (cache === entry) cache = null;
        },
      );
      cache = entry;
    }
    let alive = true;
    cache.promise.then(
      (result) => alive && setData(result),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, []);

  return data;
}
