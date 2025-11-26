
/**
 * Calculates points for a ranked tournament based on the user's requirements.
 * 
 * Rules:
 * 1. N players total.
 * 2. k-th player from the end (first eliminated) gets 1 point, next 2, etc.
 *    So, place P (1-indexed) gets (N - P + 1) points.
 *    Let BasePoints = N - P + 1.
 * 3. Top 3 bonuses:
 *    - 4th place: BasePoints (no bonus)
 *    - 3rd place: Points(4th) + 3
 *    - 2nd place: Points(3rd) + 3
 *    - 1st place: Points(4th) * 2
 * 4. Bounty: +1 point per knockout.
 * 
 * @param totalPlayers Total number of players in the tournament
 * @param place 1-indexed finishing position (1 = winner)
 * @param bounties Number of players eliminated by this player
 */
export function calculatePoints(totalPlayers: number, place: number, bounties: number): number {
    if (place > totalPlayers || place < 1) {
        throw new Error("Invalid place");
    }

    // Base calculation for 4th place and below
    // If place is k-th from end, points = k.
    // k = Total - Place + 1.
    // Example: 10 players. 10th place (1st out) -> 10 - 10 + 1 = 1 point.
    // 4th place -> 10 - 4 + 1 = 7 points.

    let placePoints = 0;

    if (place >= 4) {
        placePoints = totalPlayers - place + 1;
    } else {
        // Calculate 4th place points as a reference
        // If total players < 4, we still use the formula as if 4th place existed or just logic?
        // The prompt says: "Player for 4th place gets his points by normal rule".
        // If there are less than 4 players, we need to infer.
        // Let's assume N >= 4 for the full formula.
        // If N < 4, we might need to adjust, but let's stick to the formula relative to "what 4th would get".
        // Actually, let's just calculate "Base" for the current position and apply bonuses.

        // Wait, the rule is specific:
        // 3rd = (Points of 4th) + 3
        // 2nd = (Points of 3rd) + 3
        // 1st = (Points of 4th) * 2

        // This implies we MUST calculate what the 4th place WOULD have received.
        // Points(4th) = Total - 4 + 1 = Total - 3.

        const pointsFor4th = Math.max(0, totalPlayers - 3); // Ensure not negative if N < 3

        if (place === 3) {
            placePoints = pointsFor4th + 3;
        } else if (place === 2) {
            // 2nd = 3rd + 3 = (4th + 3) + 3 = 4th + 6
            placePoints = pointsFor4th + 6;
        } else if (place === 1) {
            placePoints = pointsFor4th * 2;
        }
    }

    return placePoints + bounties;
}
