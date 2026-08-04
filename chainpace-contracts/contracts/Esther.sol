// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ChainpaceCore
/// @notice On-chain habit tracking, streaks, proof scoring, friends, competitions, and rewards.
///         Login/signup stays off-chain in your Go backend — this contract only handles
///         everything that needs to be trustlessly verifiable on-chain.
contract ChainpaceCore {
    // =========================================================
    // HABITS
    // =========================================================

    struct Habit {
        uint256 id;
        address owner;
        string title;
        uint8 cadenceDays;
        uint256 createdAt;
        bool active;
    }

    struct Proof {
        uint256 timestamp;
        string metadataURI; // off-chain link (IPFS/HTTPS) to the actual proof data
    }

    uint256 private nextHabitId = 1;

    mapping(uint256 => Habit) public habits;
    mapping(address => uint256[]) private habitsByOwner;
    mapping(uint256 => Proof[]) public proofsByHabit;
    mapping(uint256 => mapping(uint256 => bool)) private completedOnDay; // habitId => dayIndex => bool
    mapping(address => mapping(uint256 => uint256)) private dailyCompletionCount; // user => dayIndex => count

    event HabitCreated(uint256 indexed id, address indexed owner, string title);
    event HabitCompleted(uint256 indexed habitId, address indexed owner, uint256 timestamp);
    event HabitDeactivated(uint256 indexed habitId, address indexed owner);

    function createHabit(string calldata title, uint8 cadenceDays) external returns (uint256 id) {
        require(bytes(title).length > 0, "Title required");
        require(cadenceDays > 0, "Invalid cadence");

        id = nextHabitId++;
        habits[id] = Habit(id, msg.sender, title, cadenceDays, block.timestamp, true);
        habitsByOwner[msg.sender].push(id);

        emit HabitCreated(id, msg.sender, title);
    }

    function logCompletion(uint256 habitId, string calldata metadataURI) external {
        Habit storage h = habits[habitId];
        require(h.owner == msg.sender, "Not your habit");
        require(h.active, "Inactive habit");

        uint256 dayIndex = block.timestamp / 1 days;
        require(!completedOnDay[habitId][dayIndex], "Already logged today");

        completedOnDay[habitId][dayIndex] = true;
        dailyCompletionCount[msg.sender][dayIndex] += 1;
        proofsByHabit[habitId].push(Proof(block.timestamp, metadataURI));

        _awardPoints(msg.sender, 10);
        _checkStreakBadges(habitId, msg.sender);
        _applyCompetitionCredit(msg.sender);

        emit HabitCompleted(habitId, msg.sender, block.timestamp);
    }

    function deactivateHabit(uint256 habitId) external {
        require(habits[habitId].owner == msg.sender, "Not your habit");
        habits[habitId].active = false;
        emit HabitDeactivated(habitId, msg.sender);
    }

    function getHabitsByOwner(address user) external view returns (uint256[] memory) {
        return habitsByOwner[user];
    }

    /// @notice "Today's plans & habits" — ids + whether each is completed today.
    function getTodayHabits(address user)
        external
        view
        returns (uint256[] memory ids, string[] memory titles, bool[] memory completedToday)
    {
        uint256[] memory owned = habitsByOwner[user];
        ids = new uint256[](owned.length);
        titles = new string[](owned.length);
        completedToday = new bool[](owned.length);

        uint256 dayIndex = block.timestamp / 1 days;
        for (uint256 i = 0; i < owned.length; i++) {
            ids[i] = owned[i];
            titles[i] = habits[owned[i]].title;
            completedToday[i] = completedOnDay[owned[i]][dayIndex];
        }
    }

    function getCurrentStreak(uint256 habitId) public view returns (uint256 streak) {
        uint256 dayIndex = block.timestamp / 1 days;
        while (completedOnDay[habitId][dayIndex]) {
            streak++;
            if (dayIndex == 0) break;
            dayIndex--;
        }
    }

    /// @notice Best streak across all of a user's habits — feeds the proof score.
    function getBestStreak(address user) public view returns (uint256 best) {
        uint256[] memory owned = habitsByOwner[user];
        for (uint256 i = 0; i < owned.length; i++) {
            uint256 s = getCurrentStreak(owned[i]);
            if (s > best) best = s;
        }
    }

    /// @notice Weekly completion in basis points (8650 = 86.50%).
    function getWeeklyCompletionBps(address user) public view returns (uint256 bps) {
        uint256 activeHabits = 0;
        uint256[] memory owned = habitsByOwner[user];
        for (uint256 i = 0; i < owned.length; i++) {
            if (habits[owned[i]].active) activeHabits++;
        }
        if (activeHabits == 0) return 0;

        uint256 dayIndex = block.timestamp / 1 days;
        uint256 completions = 0;
        for (uint256 d = 0; d < 7; d++) {
            if (dayIndex < d) break;
            completions += dailyCompletionCount[user][dayIndex - d];
        }

        uint256 possible = activeHabits * 7;
        bps = (completions * 10000) / possible;
        if (bps > 10000) bps = 10000;
    }

    // =========================================================
    // PROOF SCORE
    // =========================================================

    /// @notice On-chain heuristic (0–100): 60% weekly completion + 40% streak (capped at 30 days).
    function getProofScore(address user) public view returns (uint256 score) {
        uint256 weeklyBps = getWeeklyCompletionBps(user);
        uint256 weeklyComponent = (weeklyBps * 60) / 10000;

        uint256 streak = getBestStreak(user);
        uint256 streakCapped = streak > 30 ? 30 : streak;
        uint256 streakComponent = (streakCapped * 40) / 30;

        score = weeklyComponent + streakComponent;
    }

    // =========================================================
    // REWARDS / POINTS
    // =========================================================

    mapping(address => uint256) public points;
    mapping(address => mapping(string => bool)) public badgesUnlocked;

    event BadgeUnlocked(address indexed user, string badge, uint256 pointsAwarded);

    function _awardPoints(address user, uint256 amount) private {
        points[user] += amount;
    }

    function _checkStreakBadges(uint256 habitId, address user) private {
        uint256 streak = getCurrentStreak(habitId);

        if (streak == 14 && !badgesUnlocked[user]["STREAK_14"]) {
            badgesUnlocked[user]["STREAK_14"] = true;
            _awardPoints(user, 150);
            emit BadgeUnlocked(user, "14-Day Streak", 150);
        }
        if (streak == 30 && !badgesUnlocked[user]["STREAK_30"]) {
            badgesUnlocked[user]["STREAK_30"] = true;
            _awardPoints(user, 300);
            emit BadgeUnlocked(user, "30-Day Streak", 300);
        }
    }

    function getPoints(address user) external view returns (uint256) {
        return points[user];
    }

    function hasBadge(address user, string calldata badgeKey) external view returns (bool) {
        return badgesUnlocked[user][badgeKey];
    }

    // =========================================================
    // FRIENDS
    // =========================================================

    mapping(address => address[]) private friendsList;
    mapping(address => mapping(address => bool)) public isFriend;
    mapping(address => address[]) private incomingRequests;
    mapping(address => mapping(address => bool)) public hasPendingRequest;

    event FriendRequestSent(address indexed from, address indexed to);
    event FriendRequestAccepted(address indexed a, address indexed b);
    event FriendRequestDeclined(address indexed from, address indexed to);

    function sendFriendRequest(address to) external {
        require(to != msg.sender, "Cannot friend yourself");
        require(!isFriend[msg.sender][to], "Already friends");
        require(!hasPendingRequest[msg.sender][to], "Request already sent");

        hasPendingRequest[msg.sender][to] = true;
        incomingRequests[to].push(msg.sender);
        emit FriendRequestSent(msg.sender, to);
    }

    function acceptFriendRequest(address from) external {
        require(hasPendingRequest[from][msg.sender], "No pending request");

        hasPendingRequest[from][msg.sender] = false;
        isFriend[msg.sender][from] = true;
        isFriend[from][msg.sender] = true;
        friendsList[msg.sender].push(from);
        friendsList[from].push(msg.sender);

        _removeIncomingRequest(msg.sender, from);
        emit FriendRequestAccepted(from, msg.sender);
    }

    function declineFriendRequest(address from) external {
        require(hasPendingRequest[from][msg.sender], "No pending request");
        hasPendingRequest[from][msg.sender] = false;
        _removeIncomingRequest(msg.sender, from);
        emit FriendRequestDeclined(from, msg.sender);
    }

    function _removeIncomingRequest(address user, address from) private {
        address[] storage reqs = incomingRequests[user];
        for (uint256 i = 0; i < reqs.length; i++) {
            if (reqs[i] == from) {
                reqs[i] = reqs[reqs.length - 1];
                reqs.pop();
                break;
            }
        }
    }

    function getFriends(address user) external view returns (address[] memory) {
        return friendsList[user];
    }

    function getIncomingRequests(address user) external view returns (address[] memory) {
        return incomingRequests[user];
    }

    // =========================================================
    // CIRCLE RANK / LEADERBOARD
    // =========================================================

    /// @notice Rank of `user` among their friends + themself (1 = highest proof score).
    function getCircleRank(address user) external view returns (uint256 rank, uint256 circleSize) {
        address[] memory friends = friendsList[user];
        uint256 userScore = getProofScore(user);

        uint256 higherCount = 0;
        for (uint256 i = 0; i < friends.length; i++) {
            if (getProofScore(friends[i]) > userScore) higherCount++;
        }
        rank = higherCount + 1;
        circleSize = friends.length + 1;
    }

    /// @notice Raw members + scores for the frontend to sort/render as a leaderboard.
    function getCircleScores(address user)
        external
        view
        returns (address[] memory members, uint256[] memory scores)
    {
        address[] memory friends = friendsList[user];
        members = new address[](friends.length + 1);
        scores = new uint256[](friends.length + 1);

        members[0] = user;
        scores[0] = getProofScore(user);
        for (uint256 i = 0; i < friends.length; i++) {
            members[i + 1] = friends[i];
            scores[i + 1] = getProofScore(friends[i]);
        }
    }

    // =========================================================
    // COMPETITIONS
    // =========================================================

    struct Competition {
        uint256 id;
        address challenger;
        address opponent;
        uint256 startTime;
        uint256 endTime;
        bool resolved;
        address winner;
    }

    uint256 private nextCompetitionId = 1;
    mapping(uint256 => Competition) public competitions;
    mapping(address => uint256[]) private competitionsByUser;
    mapping(uint256 => mapping(address => uint256)) private competitionCredits;

    event CompetitionCreated(uint256 indexed id, address indexed challenger, address indexed opponent, uint256 endTime);
    event CompetitionResolved(uint256 indexed id, address winner, uint256 challengerScore, uint256 opponentScore);

    function createCompetition(address opponent, uint256 durationDays) external returns (uint256 id) {
        require(opponent != msg.sender, "Cannot challenge yourself");
        require(isFriend[msg.sender][opponent], "Must be friends to compete");
        require(durationDays > 0 && durationDays <= 30, "Invalid duration");

        id = nextCompetitionId++;
        uint256 endTime = block.timestamp + (durationDays * 1 days);

        competitions[id] = Competition({
            id: id,
            challenger: msg.sender,
            opponent: opponent,
            startTime: block.timestamp,
            endTime: endTime,
            resolved: false,
            winner: address(0)
        });

        competitionsByUser[msg.sender].push(id);
        competitionsByUser[opponent].push(id);

        emit CompetitionCreated(id, msg.sender, opponent, endTime);
    }

    function _applyCompetitionCredit(address user) private {
        uint256[] memory userComps = competitionsByUser[user];
        for (uint256 i = 0; i < userComps.length; i++) {
            Competition storage c = competitions[userComps[i]];
            if (!c.resolved && block.timestamp >= c.startTime && block.timestamp <= c.endTime) {
                competitionCredits[c.id][user] += 1;
            }
        }
    }

    function resolveCompetition(uint256 id) external {
        Competition storage c = competitions[id];
        require(c.id != 0, "Competition does not exist");
        require(!c.resolved, "Already resolved");
        require(block.timestamp > c.endTime, "Not finished yet");

        uint256 challengerScore = competitionCredits[id][c.challenger];
        uint256 opponentScore = competitionCredits[id][c.opponent];

        c.resolved = true;
        if (challengerScore > opponentScore) {
            c.winner = c.challenger;
            _awardPoints(c.challenger, 200);
        } else if (opponentScore > challengerScore) {
            c.winner = c.opponent;
            _awardPoints(c.opponent, 200);
        }
        // tie -> winner stays address(0), no bonus points

        emit CompetitionResolved(id, c.winner, challengerScore, opponentScore);
    }

    function getCompetitionScore(uint256 id) external view returns (uint256 challengerScore, uint256 opponentScore) {
        challengerScore = competitionCredits[id][competitions[id].challenger];
        opponentScore = competitionCredits[id][competitions[id].opponent];
    }

    function getCompetitionsByUser(address user) external view returns (uint256[] memory) {
        return competitionsByUser[user];
    }
}