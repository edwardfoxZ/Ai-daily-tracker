// test/ChainpaceCore.ts
import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("ChainpaceCore", function () {
  let chainpace: any;
  let owner: any;
  let friend: any;
  let stranger: any;

  beforeEach(async () => {
    [owner, friend, stranger] = await ethers.getSigners();
    chainpace = await ethers.deployContract("ChainpaceCore");
  });

  // =========================================================
  // HABITS
  // =========================================================

  describe("Habits", function () {
    it("should create a habit and emit HabitCreated", async function () {
      await expect(chainpace.createHabit("Morning run", 1))
        .to.emit(chainpace, "HabitCreated")
        .withArgs(1n, owner.address, "Morning run");

      const habit = await chainpace.habits(1n);
      expect(habit.title).to.equal("Morning run");
      expect(habit.owner).to.equal(owner.address);
      expect(habit.active).to.equal(true);
    });

    it("should reject an empty title", async function () {
      await expect(chainpace.createHabit("", 1)).to.be.revertedWith(
        "Title required",
      );
    });

    it("should reject a zero cadence", async function () {
      await expect(chainpace.createHabit("Read", 0)).to.be.revertedWith(
        "Invalid cadence",
      );
    });

    it("should list habits by owner", async function () {
      await chainpace.createHabit("Run", 1);
      await chainpace.createHabit("Read", 1);
      const ids = await chainpace.getHabitsByOwner(owner.address);
      expect(ids.length).to.equal(2);
      expect(ids[0]).to.equal(1n);
      expect(ids[1]).to.equal(2n);
    });

    it("should log a completion and emit HabitCompleted", async function () {
      await chainpace.createHabit("Run", 1);
      await expect(chainpace.logCompletion(1n, "ipfs://proof1")).to.emit(
        chainpace,
        "HabitCompleted",
      );
    });

    it("should reject completion from a non-owner", async function () {
      await chainpace.createHabit("Run", 1);
      await expect(
        chainpace.connect(stranger).logCompletion(1n, "ipfs://proof1"),
      ).to.be.revertedWith("Not your habit");
    });

    it("should reject logging the same habit twice in one day", async function () {
      await chainpace.createHabit("Run", 1);
      await chainpace.logCompletion(1n, "ipfs://proof1");
      await expect(
        chainpace.logCompletion(1n, "ipfs://proof2"),
      ).to.be.revertedWith("Already logged today");
    });

    it("should reject completion on a deactivated habit", async function () {
      await chainpace.createHabit("Run", 1);
      await chainpace.deactivateHabit(1n);
      await expect(
        chainpace.logCompletion(1n, "ipfs://proof1"),
      ).to.be.revertedWith("Inactive habit");
    });

    it("should return today's habits with correct completion state", async function () {
      await chainpace.createHabit("Run", 1);
      await chainpace.createHabit("Read", 1);
      await chainpace.logCompletion(1n, "ipfs://proof1");

      const [ids, titles, completedToday] = await chainpace.getTodayHabits(
        owner.address,
      );
      expect(ids.length).to.equal(2);
      expect(titles[0]).to.equal("Run");
      expect(completedToday[0]).to.equal(true);
      expect(completedToday[1]).to.equal(false);
    });
  });

  // =========================================================
  // STREAKS
  // =========================================================

  describe("Streaks", function () {
    it("should start at streak 0 before any completion", async function () {
      await chainpace.createHabit("Run", 1);
      expect(await chainpace.getCurrentStreak(1n)).to.equal(0n);
    });

    it("should increment streak to 1 after logging today", async function () {
      await chainpace.createHabit("Run", 1);
      await chainpace.logCompletion(1n, "ipfs://proof1");
      expect(await chainpace.getCurrentStreak(1n)).to.equal(1n);
    });

    it("should build a multi-day streak when days are logged consecutively", async function () {
      await chainpace.createHabit("Run", 1);
      await chainpace.logCompletion(1n, "ipfs://day1");
      expect(await chainpace.getCurrentStreak(1n)).to.equal(1n);

      await ethers.provider.send("evm_increaseTime", [86400]); // +1 day
      await ethers.provider.send("evm_mine");
      await chainpace.logCompletion(1n, "ipfs://day2");
      expect(await chainpace.getCurrentStreak(1n)).to.equal(2n);
    });

    it("should reset streak to 0 after a missed day", async function () {
      await chainpace.createHabit("Run", 1);
      await chainpace.logCompletion(1n, "ipfs://day1");

      await ethers.provider.send("evm_increaseTime", [2 * 86400]); // skip a day
      await ethers.provider.send("evm_mine");

      expect(await chainpace.getCurrentStreak(1n)).to.equal(0n);
    });

    it("should track best streak across multiple habits", async function () {
      await chainpace.createHabit("Run", 1);
      await chainpace.createHabit("Read", 1);
      await chainpace.logCompletion(1n, "ipfs://a");
      await chainpace.logCompletion(2n, "ipfs://b");
      expect(await chainpace.getBestStreak(owner.address)).to.equal(1n);
    });
  });

  // =========================================================
  // WEEKLY COMPLETION & PROOF SCORE
  // =========================================================

  describe("Weekly completion & proof score", function () {
    it("should return 0 weekly completion with no habits", async function () {
      expect(await chainpace.getWeeklyCompletionBps(owner.address)).to.equal(
        0n,
      );
    });

    it("should compute weekly completion after one log", async function () {
      await chainpace.createHabit("Run", 1);
      await chainpace.logCompletion(1n, "ipfs://a");
      const bps = await chainpace.getWeeklyCompletionBps(owner.address);
      expect(bps).to.be.gt(0n);
    });

    it("should compute a non-zero proof score after activity", async function () {
      await chainpace.createHabit("Run", 1);
      await chainpace.logCompletion(1n, "ipfs://a");
      const score = await chainpace.getProofScore(owner.address);
      expect(score).to.be.gt(0n);
      expect(score).to.be.lte(100n);
    });

    it("should return 0 proof score for a user with no habits", async function () {
      expect(await chainpace.getProofScore(stranger.address)).to.equal(0n);
    });
  });

  // =========================================================
  // REWARDS / BADGES
  // =========================================================

  describe("Rewards & badges", function () {
    it("should award 10 points per completion", async function () {
      await chainpace.createHabit("Run", 1);
      await chainpace.logCompletion(1n, "ipfs://a");
      expect(await chainpace.getPoints(owner.address)).to.equal(10n);
    });

    it("should unlock the 14-day streak badge and award bonus points", async function () {
      await chainpace.createHabit("Run", 1);

      for (let i = 0; i < 14; i++) {
        await chainpace.logCompletion(1n, `ipfs://day${i}`);
        if (i < 13) {
          await ethers.provider.send("evm_increaseTime", [86400]);
          await ethers.provider.send("evm_mine");
        }
      }

      expect(await chainpace.hasBadge(owner.address, "STREAK_14")).to.equal(
        true,
      );
      // 14 completions * 10 + 150 bonus = 290
      expect(await chainpace.getPoints(owner.address)).to.equal(290n);
    });

    it("should not re-unlock an already-unlocked badge", async function () {
      await chainpace.createHabit("Run", 1);
      for (let i = 0; i < 14; i++) {
        await chainpace.logCompletion(1n, `ipfs://day${i}`);
        await ethers.provider.send("evm_increaseTime", [86400]);
        await ethers.provider.send("evm_mine");
      }
      // streak already reset by day 15 due to extra increase; badge should still be true from day 14
      expect(await chainpace.hasBadge(owner.address, "STREAK_14")).to.equal(
        true,
      );
    });
  });

  // =========================================================
  // FRIENDS
  // =========================================================

  describe("Friends", function () {
    it("should send and accept a friend request", async function () {
      await expect(chainpace.sendFriendRequest(friend.address))
        .to.emit(chainpace, "FriendRequestSent")
        .withArgs(owner.address, friend.address);

      await expect(chainpace.connect(friend).acceptFriendRequest(owner.address))
        .to.emit(chainpace, "FriendRequestAccepted")
        .withArgs(owner.address, friend.address);

      expect(await chainpace.isFriend(owner.address, friend.address)).to.equal(
        true,
      );
      expect(await chainpace.isFriend(friend.address, owner.address)).to.equal(
        true,
      );
    });

    it("should reject friending yourself", async function () {
      await expect(
        chainpace.sendFriendRequest(owner.address),
      ).to.be.revertedWith("Cannot friend yourself");
    });

    it("should reject a duplicate friend request", async function () {
      await chainpace.sendFriendRequest(friend.address);
      await expect(
        chainpace.sendFriendRequest(friend.address),
      ).to.be.revertedWith("Request already sent");
    });

    it("should allow declining a friend request", async function () {
      await chainpace.sendFriendRequest(friend.address);
      await expect(
        chainpace.connect(friend).declineFriendRequest(owner.address),
      )
        .to.emit(chainpace, "FriendRequestDeclined")
        .withArgs(owner.address, friend.address);

      expect(await chainpace.isFriend(owner.address, friend.address)).to.equal(
        false,
      );
    });

    it("should list friends and incoming requests correctly", async function () {
      await chainpace.sendFriendRequest(friend.address);
      const incoming = await chainpace.getIncomingRequests(friend.address);
      expect(incoming.length).to.equal(1);
      expect(incoming[0]).to.equal(owner.address);

      await chainpace.connect(friend).acceptFriendRequest(owner.address);
      const ownerFriends = await chainpace.getFriends(owner.address);
      expect(ownerFriends[0]).to.equal(friend.address);
    });
  });

  // =========================================================
  // CIRCLE RANK
  // =========================================================

  describe("Circle rank", function () {
    it("should rank #1 in a circle of just yourself", async function () {
      const [rank, size] = await chainpace.getCircleRank(owner.address);
      expect(rank).to.equal(1n);
      expect(size).to.equal(1n);
    });

    it("should rank correctly against a friend with a higher score", async function () {
      await chainpace.sendFriendRequest(friend.address);
      await chainpace.connect(friend).acceptFriendRequest(owner.address);

      await chainpace.connect(friend).createHabit("Run", 1);
      await chainpace.connect(friend).logCompletion(1n, "ipfs://a");

      const [rank, size] = await chainpace.getCircleRank(owner.address);
      expect(rank).to.equal(2n); // friend has a higher score, owner has none
      expect(size).to.equal(2n);
    });

    it("should return circle scores for all members", async function () {
      await chainpace.sendFriendRequest(friend.address);
      await chainpace.connect(friend).acceptFriendRequest(owner.address);

      const [members, scores] = await chainpace.getCircleScores(owner.address);
      expect(members.length).to.equal(2);
      expect(members[0]).to.equal(owner.address);
      expect(members[1]).to.equal(friend.address);
      expect(scores.length).to.equal(2);
    });
  });

  // =========================================================
  // COMPETITIONS
  // =========================================================

  describe("Competitions", function () {
    beforeEach(async () => {
      await chainpace.sendFriendRequest(friend.address);
      await chainpace.connect(friend).acceptFriendRequest(owner.address);
    });

    it("should create a competition between friends", async function () {
      await expect(chainpace.createCompetition(friend.address, 7)).to.emit(
        chainpace,
        "CompetitionCreated",
      );

      const comp = await chainpace.competitions(1n);
      expect(comp.challenger).to.equal(owner.address);
      expect(comp.opponent).to.equal(friend.address);
      expect(comp.resolved).to.equal(false);
    });

    it("should reject competing with a non-friend", async function () {
      await expect(
        chainpace.createCompetition(stranger.address, 7),
      ).to.be.revertedWith("Must be friends to compete");
    });

    it("should reject an invalid duration", async function () {
      await expect(
        chainpace.createCompetition(friend.address, 0),
      ).to.be.revertedWith("Invalid duration");
      await expect(
        chainpace.createCompetition(friend.address, 31),
      ).to.be.revertedWith("Invalid duration");
    });

    it("should track completion credits during an active competition", async function () {
      await chainpace.createCompetition(friend.address, 7);
      await chainpace.createHabit("Run", 1);
      await chainpace.logCompletion(1n, "ipfs://a");

      const [challengerScore] = await chainpace.getCompetitionScore(1n);
      expect(challengerScore).to.equal(1n);
    });

    it("should reject resolving before the competition ends", async function () {
      await chainpace.createCompetition(friend.address, 7);
      await expect(chainpace.resolveCompetition(1n)).to.be.revertedWith(
        "Not finished yet",
      );
    });

    it("should resolve and award points to the winner", async function () {
      await chainpace.createCompetition(friend.address, 1);

      await chainpace.createHabit("Run", 1);
      await chainpace.logCompletion(1n, "ipfs://a");

      await ethers.provider.send("evm_increaseTime", [2 * 86400]);
      await ethers.provider.send("evm_mine");

      await expect(chainpace.resolveCompetition(1n))
        .to.emit(chainpace, "CompetitionResolved")
        .withArgs(1n, owner.address, 1n, 0n);

      expect(await chainpace.getPoints(owner.address)).to.equal(210n); // 10 (log) + 200 (win)
    });

    it("should reject resolving twice", async function () {
      await chainpace.createCompetition(friend.address, 1);
      await ethers.provider.send("evm_increaseTime", [2 * 86400]);
      await ethers.provider.send("evm_mine");

      await chainpace.resolveCompetition(1n);
      await expect(chainpace.resolveCompetition(1n)).to.be.revertedWith(
        "Already resolved",
      );
    });

    it("should list competitions by user", async function () {
      await chainpace.createCompetition(friend.address, 7);
      const ownerComps = await chainpace.getCompetitionsByUser(owner.address);
      const friendComps = await chainpace.getCompetitionsByUser(friend.address);
      expect(ownerComps.length).to.equal(1);
      expect(friendComps.length).to.equal(1);
    });
  });
});
