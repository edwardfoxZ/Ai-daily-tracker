"use client";

import { useCallback, useEffect, useState } from "react";
import { useWeb3 } from "@/lib/useWeb3";
import {
  CHAINPACE_ADDRESS,
  EXPECTED_CHAIN_ID,
  getChainpace,
} from "@/lib/contract";

export interface OnChainHabit {
  id: string;
  title: string;
  cadenceDays: number;
  streak: number;
  done: boolean;
  active: boolean;
}

export interface OnChainCompetition {
  id: string;
  challenger: string;
  opponent: string;
  startTime: number;
  endTime: number;
  resolved: boolean;
  winner: string;
  youScore: number;
  themScore: number;
}

export interface CircleMember {
  address: string;
  score: number;
}

export function useChainpace() {
  const web3 = useWeb3();
  const [habits, setHabits] = useState<OnChainHabit[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [incoming, setIncoming] = useState<string[]>([]);
  const [competitions, setCompetitions] = useState<OnChainCompetition[]>([]);
  const [proofScore, setProofScore] = useState(0);
  const [weeklyBps, setWeeklyBps] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [rank, setRank] = useState(1);
  const [circleSize, setCircleSize] = useState(1);
  const [circle, setCircle] = useState<CircleMember[]>([]);
  const [has14, setHas14] = useState(false);
  const [has30, setHas30] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const address = web3.address;
  const isConnected = web3.isConnected;
  const getProvider = web3.getProvider;
  const getSigner = web3.getSigner;

  const ready =
    isConnected &&
    !!address &&
    !!CHAINPACE_ADDRESS &&
    web3.chain?.kind === "evm";

  const wrongNetwork =
    ready &&
    typeof web3.chain?.id === "number" &&
    web3.chain.id !== EXPECTED_CHAIN_ID;

  const refresh = useCallback(async () => {
    if (!ready || !address) return;
    const provider = getProvider();
    if (!provider) return;

    setLoading(true);
    setError(null);
    try {
      const c = getChainpace(provider);
      const user = address;

      const [today, score, bps, streak, pts, circleRank, scores, fr, reqs, comps, b14, b30] =
        await Promise.all([
          c.getTodayHabits(user),
          c.getProofScore(user),
          c.getWeeklyCompletionBps(user),
          c.getBestStreak(user),
          c.getPoints(user),
          c.getCircleRank(user),
          c.getCircleScores(user),
          c.getFriends(user),
          c.getIncomingRequests(user),
          c.getCompetitionsByUser(user),
          c.hasBadge(user, "STREAK_14"),
          c.hasBadge(user, "STREAK_30"),
        ]);

      const ids: bigint[] = [...today[0]];
      const titles: string[] = [...today[1]];
      const done: boolean[] = [...today[2]];

      const nextHabits: OnChainHabit[] = [];
      for (let i = 0; i < ids.length; i++) {
        const h = await c.habits(ids[i]);
        const st = await c.getCurrentStreak(ids[i]);
        nextHabits.push({
          id: ids[i].toString(),
          title: titles[i],
          cadenceDays: Number(h.cadenceDays ?? h[3]),
          streak: Number(st),
          done: done[i],
          active: Boolean(h.active ?? h[5]),
        });
      }

      const compIds: bigint[] = [...comps];
      const nextComps: OnChainCompetition[] = [];
      for (const id of compIds) {
        const row = await c.competitions(id);
        const [cs, os] = await c.getCompetitionScore(id);
        const challenger: string = row.challenger ?? row[1];
        const opponent: string = row.opponent ?? row[2];
        const youAreChallenger =
          challenger.toLowerCase() === user.toLowerCase();
        nextComps.push({
          id: id.toString(),
          challenger,
          opponent,
          startTime: Number(row.startTime ?? row[3]),
          endTime: Number(row.endTime ?? row[4]),
          resolved: Boolean(row.resolved ?? row[5]),
          winner: row.winner ?? row[6],
          youScore: Number(youAreChallenger ? cs : os),
          themScore: Number(youAreChallenger ? os : cs),
        });
      }

      const members: string[] = [...scores[0]];
      const memberScores: bigint[] = [...scores[1]];

      setHabits(nextHabits.filter((h) => h.active));
      setFriends([...fr]);
      setIncoming([...reqs]);
      setCompetitions(nextComps);
      setProofScore(Number(score));
      setWeeklyBps(Number(bps));
      setBestStreak(Number(streak));
      setPoints(Number(pts));
      setRank(Number(circleRank[0]));
      setCircleSize(Number(circleRank[1]));
      setCircle(
        members.map((addr, i) => ({
          address: addr,
          score: Number(memberScores[i]),
        })),
      );
      setHas14(Boolean(b14));
      setHas30(Boolean(b30));
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || "Failed to read contract");
    } finally {
      setLoading(false);
    }
  }, [ready, address, getProvider]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const send = useCallback(
    async (fn: (c: ReturnType<typeof getChainpace>) => Promise<any>) => {
      const signer = await getSigner();
      if (!signer) throw new Error("Connect a wallet first");
      setTxPending(true);
      setError(null);
      try {
        const c = getChainpace(signer);
        const tx = await fn(c);
        await tx.wait();
        await refresh();
      } catch (e: any) {
        const msg = e?.reason || e?.shortMessage || e?.message || "Transaction failed";
        setError(msg);
        throw e;
      } finally {
        setTxPending(false);
      }
    },
    [getSigner, refresh],
  );

  const createHabit = (title: string, cadenceDays = 1) =>
    send((c) => c.createHabit(title, cadenceDays));

  const logCompletion = (habitId: string, uri = "") =>
    send((c) => c.logCompletion(BigInt(habitId), uri));

  const deactivateHabit = (habitId: string) =>
    send((c) => c.deactivateHabit(BigInt(habitId)));

  const sendFriendRequest = (to: string) => send((c) => c.sendFriendRequest(to));

  const acceptFriendRequest = (from: string) =>
    send((c) => c.acceptFriendRequest(from));

  const declineFriendRequest = (from: string) =>
    send((c) => c.declineFriendRequest(from));

  const createCompetition = (opponent: string, durationDays = 7) =>
    send((c) => c.createCompetition(opponent, durationDays));

  const resolveCompetition = (id: string) =>
    send((c) => c.resolveCompetition(BigInt(id)));

  return {
    ...web3,
    ready,
    wrongNetwork,
    contractAddress: CHAINPACE_ADDRESS,
    expectedChainId: EXPECTED_CHAIN_ID,
    habits,
    friends,
    incoming,
    competitions,
    proofScore,
    weeklyBps,
    bestStreak,
    points,
    rank,
    circleSize,
    circle,
    has14,
    has30,
    loading,
    txPending,
    error,
    refresh,
    createHabit,
    logCompletion,
    deactivateHabit,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    createCompetition,
    resolveCompetition,
  };
}
