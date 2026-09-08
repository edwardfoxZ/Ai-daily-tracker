import { BrowserProvider, Contract, JsonRpcSigner } from "ethers";

export const CHAINPACE_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

/** Alias used by useContract.ts in some local copies */
export const CONTRACT_ADDRESS = CHAINPACE_ADDRESS;

export const EXPECTED_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? "1337",
);

export const CHAINPACE_ABI = [
  "function createHabit(string title, uint8 cadenceDays) returns (uint256)",
  "function logCompletion(uint256 habitId, string metadataURI)",
  "function deactivateHabit(uint256 habitId)",
  "function getHabitsByOwner(address user) view returns (uint256[])",
  "function getTodayHabits(address user) view returns (uint256[] ids, string[] titles, bool[] completedToday)",
  "function getCurrentStreak(uint256 habitId) view returns (uint256)",
  "function getBestStreak(address user) view returns (uint256)",
  "function getWeeklyCompletionBps(address user) view returns (uint256)",
  "function getProofScore(address user) view returns (uint256)",
  "function getPoints(address user) view returns (uint256)",
  "function hasBadge(address user, string badgeKey) view returns (bool)",
  "function sendFriendRequest(address to)",
  "function acceptFriendRequest(address from)",
  "function declineFriendRequest(address from)",
  "function getFriends(address user) view returns (address[])",
  "function getIncomingRequests(address user) view returns (address[])",
  "function isFriend(address a, address b) view returns (bool)",
  "function getCircleRank(address user) view returns (uint256 rank, uint256 circleSize)",
  "function getCircleScores(address user) view returns (address[] members, uint256[] scores)",
  "function createCompetition(address opponent, uint256 durationDays) returns (uint256)",
  "function resolveCompetition(uint256 id)",
  "function getCompetitionScore(uint256 id) view returns (uint256, uint256)",
  "function getCompetitionsByUser(address user) view returns (uint256[])",
  "function competitions(uint256 id) view returns (uint256 id_, address challenger, address opponent, uint256 startTime, uint256 endTime, bool resolved, address winner)",
  "function habits(uint256 id) view returns (uint256 id_, address owner, string title, uint8 cadenceDays, uint256 createdAt, bool active)",
];

export const CONTRACT_ABI = CHAINPACE_ABI;

export function getChainpace(signerOrProvider: BrowserProvider | JsonRpcSigner) {
  if (!CHAINPACE_ADDRESS) {
    throw new Error("Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
  }
  return new Contract(CHAINPACE_ADDRESS, CHAINPACE_ABI, signerOrProvider);
}

export function shortAddr(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function initialsFromAddr(addr: string) {
  return addr.slice(2, 4).toUpperCase();
}
