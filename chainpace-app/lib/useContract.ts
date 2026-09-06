// lib/useContract.ts
"use client";

import { useCallback } from "react";
import { Contract } from "ethers";
import { useWeb3 } from "@/lib/useWeb3";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

export function useContract() {
  const web3 = useWeb3();

  const readContract = useCallback(() => {
    const provider = web3.getProvider();
    if (!provider) throw new Error("Wallet not connected");
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }, [web3]);

  const writeContract = useCallback(async () => {
    const signer = await web3.getSigner();
    if (!signer) throw new Error("Wallet not connected");
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }, [web3]);

  return {
    // ---- writes ----
    createHabit: async (title: string, cadenceDays: number) => {
      const c = await writeContract();
      const tx = await c.createHabit(title, cadenceDays);
      return tx.wait();
    },
    logCompletion: async (habitId: number | bigint, metadataURI = "") => {
      const c = await writeContract();
      const tx = await c.logCompletion(habitId, metadataURI);
      return tx.wait();
    },
    deactivateHabit: async (habitId: number | bigint) => {
      const c = await writeContract();
      const tx = await c.deactivateHabit(habitId);
      return tx.wait();
    },
    sendFriendRequest: async (to: string) => {
      const c = await writeContract();
      const tx = await c.sendFriendRequest(to);
      return tx.wait();
    },
    acceptFriendRequest: async (from: string) => {
      const c = await writeContract();
      const tx = await c.acceptFriendRequest(from);
      return tx.wait();
    },
    createCompetition: async (opponent: string, durationDays: number) => {
      const c = await writeContract();
      const tx = await c.createCompetition(opponent, durationDays);
      return tx.wait();
    },

    // ---- reads (free, no gas) ----
    getTodayHabits: async (address: string) =>
      readContract().getTodayHabits(address),
    getCurrentStreak: async (habitId: number | bigint) =>
      readContract().getCurrentStreak(habitId),
    getBestStreak: async (address: string) =>
      readContract().getBestStreak(address),
    getWeeklyCompletionBps: async (address: string) =>
      readContract().getWeeklyCompletionBps(address),
    getProofScore: async (address: string) =>
      readContract().getProofScore(address),
    getPoints: async (address: string) => readContract().getPoints(address),
    getCircleRank: async (address: string) =>
      readContract().getCircleRank(address),
    getFriends: async (address: string) => readContract().getFriends(address),

    // ---- raw contract for event subscriptions ----
    getRawContract: readContract,
  };
}
