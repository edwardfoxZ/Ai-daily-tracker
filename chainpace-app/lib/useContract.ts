"use client";

import { useCallback } from "react";
import { Contract } from "ethers";
import { useWeb3 } from "@/lib/useWeb3";
import {
  CHAINPACE_ADDRESS,
  CONTRACT_ADDRESS,
  CHAINPACE_ABI,
} from "@/lib/contract";

const ADDRESS = CHAINPACE_ADDRESS || CONTRACT_ADDRESS;

export function useContract() {
  const web3 = useWeb3();

  const readContract = useCallback(() => {
    const provider = web3.getProvider();
    if (!provider) throw new Error("Wallet not connected");
    if (!ADDRESS) throw new Error("Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
    return new Contract(ADDRESS, CHAINPACE_ABI, provider);
  }, [web3]);

  const writeContract = useCallback(async () => {
    const signer = await web3.getSigner();
    if (!signer) throw new Error("Wallet not connected");
    if (!ADDRESS) throw new Error("Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
    return new Contract(ADDRESS, CHAINPACE_ABI, signer);
  }, [web3]);

  return {
    createHabit: async (title: string, cadenceDays: number) => {
      const c = await writeContract();
      const tx = await c.createHabit(title, cadenceDays);
      return tx.wait();
    },
    logCompletion: async (habitId: number | bigint | string, metadataURI = "") => {
      const c = await writeContract();
      const tx = await c.logCompletion(BigInt(habitId), metadataURI);
      return tx.wait();
    },
    deactivateHabit: async (habitId: number | bigint | string) => {
      const c = await writeContract();
      const tx = await c.deactivateHabit(BigInt(habitId));
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
    declineFriendRequest: async (from: string) => {
      const c = await writeContract();
      const tx = await c.declineFriendRequest(from);
      return tx.wait();
    },
    createCompetition: async (opponent: string, durationDays: number) => {
      const c = await writeContract();
      const tx = await c.createCompetition(opponent, durationDays);
      return tx.wait();
    },
    resolveCompetition: async (id: number | bigint | string) => {
      const c = await writeContract();
      const tx = await c.resolveCompetition(BigInt(id));
      return tx.wait();
    },
    getTodayHabits: async (address: string) =>
      readContract().getTodayHabits(address),
    getCurrentStreak: async (habitId: number | bigint | string) =>
      readContract().getCurrentStreak(BigInt(habitId)),
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
    getRawContract: readContract,
  };
}
