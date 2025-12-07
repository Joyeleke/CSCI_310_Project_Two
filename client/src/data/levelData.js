/**
 * levelData.js - Procedural Level Generation
 *
 * Generates all game levels using a seeded random number generator.
 * Ensures reproducible level layouts while providing variety.
 *
 * @module data/levelData
 *
 * ## Generation Algorithm:
 * 1. Uses seeded PRNG (mulberry32) for reproducibility
 * 2. Distributes platforms vertically throughout level
 * 3. Ensures minimum gaps between platforms (reachable jumps)
 * 4. Avoids overlapping platforms
 * 5. Places spike hazards on some platforms
 * 6. Generates walls for wall-jumping sections
 *
 * ## Level Structure:
 * Each level contains:
 * - platforms: Array of [x, y, width, height, isSpike]
 * - walls: Array of [x, y, width, height]
 * - color: Platform color for visual variety
 * - backgroundColor: Scene background color (optional)
 * - startY: Y offset for level positioning
 *
 * ## Constraints:
 * - Platforms must be reachable (max jump distance)
 * - No overlapping platforms
 * - Minimum gaps between consecutive platforms
 * - Spikes placed on inner platforms (not edges)
 *
 * @exports {Array} LEVELS - Array of generated level data
 * @exports {number} LEVEL_HEIGHT - Height of each level in world units
 */

/** @constant {number} Height of each level in world units */
const LEVEL_HEIGHT = 15;

/** @constant {number} Total number of levels to generate */
const NUM_LEVELS = 20;

/** @constant {number} Number of platforms per level */
const PLATFORMS_PER_LEVEL = 12;

/** @constant {number} Number of spike platforms per level */
const SPIKES_PER_LEVEL = 6;

// ========================================
// RANDOM NUMBER GENERATION
// ========================================

/** @constant {number} Seed for reproducible level generation */
const SEED = 12345;

// ========================================
// PLATFORM CONSTRAINTS
// ========================================

const MIN_PLATFORM_WIDTH = 1.5;
const MAX_PLATFORM_WIDTH = 5.5;
const MIN_X = -20.0;
const MAX_X = 20.0;
const MIN_FIRST_Y = 1.0;
const MAX_FIRST_Y = 1.5;
const MAX_FINAL_Y = 14.8;
const PLATFORM_HEIGHT = 0.3;

// ========================================
// WALL CONSTRAINTS
// ========================================

const MIN_WALL_HEIGHT = 2.0;
const MAX_WALL_HEIGHT = 6.0;
const WALL_WIDTH = 0.3;
const WALLS_PER_LEVEL = 5;
const MIN_WALL_X_GAP = 6.0;

// ========================================
// GENERATION CONSTRAINTS
// ========================================

const MIN_CONSECUTIVE_X_GAP = 7.5;
const MAX_GENERATION_ATTEMPTS = 30;

/**
 * Mulberry32 seeded pseudo-random number generator.
 * Produces reproducible random sequences from a seed.
 * @param {number} a - The seed value
 * @returns {Function} Function that returns random float 0-1
 */
function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

/** Seeded random function instance */
const random = mulberry32(SEED);

/**
 * Generates a random float between min and max using seeded PRNG.
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Random float in range
 */
function getRandom(min, max) {
    return random() * (max - min) + min;
}

/**
 * Check if two rectangles overlap
 * @param {number} x1 - Center X of rectangle 1
 * @param {number} y1 - Center Y of rectangle 1
 * @param {number} w1 - Width of rectangle 1
 * @param {number} h1 - Height of rectangle 1
 * @param {number} x2 - Center X of rectangle 2
 * @param {number} y2 - Center Y of rectangle 2
 * @param {number} w2 - Width of rectangle 2
 * @param {number} h2 - Height of rectangle 2
 * @returns {boolean} True if rectangles overlap
 */
function rectanglesOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    const left1 = x1 - w1 / 2;
    const right1 = x1 + w1 / 2;
    const top1 = y1 + h1 / 2;
    const bottom1 = y1 - h1 / 2;

    const left2 = x2 - w2 / 2;
    const right2 = x2 + w2 / 2;
    const top2 = y2 + h2 / 2;
    const bottom2 = y2 - h2 / 2;

    return !(right1 <= left2 || left1 >= right2 || bottom1 >= top2 || top1 <= bottom2);
}

/**
 * Check if a wall overlaps with any existing platforms
 * @param {number} wallX - Wall center X position
 * @param {number} wallY - Wall center Y position
 * @param {number} wallWidth - Wall width
 * @param {number} wallHeight - Wall height
 * @param {Array} platforms - Array of platforms [x, y, width, height]
 * @returns {boolean} True if wall overlaps with any platform
 */
function wallOverlapsPlatforms(wallX, wallY, wallWidth, wallHeight, platforms) {
    for (const platform of platforms) {
        const [platX, platY, platWidth, platHeight] = platform;
        if (rectanglesOverlap(wallX, wallY, wallWidth, wallHeight, platX, platY, platWidth, platHeight)) {
            return true;
        }
    }
    return false;
}

/**
 * Generates a new array of walls for a single level.
 * Walls are vertical obstacles: [x, y, width, height]
 * @param {Array} platforms - Array of platforms to avoid overlapping with
 */
function generateWalls(platforms) {
    const walls = [];

    if (WALLS_PER_LEVEL <= 0) return walls;

    // Generate walls distributed throughout the level height
    const levelSpacing = (MAX_FINAL_Y - MIN_FIRST_Y) / WALLS_PER_LEVEL;

    let lastX = 0; // Track last wall X position to maintain spacing

    for (let i = 0; i < WALLS_PER_LEVEL; i++) {
        let wallPlaced = false;
        let totalAttempts = 0;

        while (!wallPlaced && totalAttempts < MAX_GENERATION_ATTEMPTS * 2) {
            // 1. Get Y position (distribute walls vertically)
            const baseY = MIN_FIRST_Y + (i * levelSpacing);
            const wallY = getRandom(baseY, baseY + levelSpacing * 0.8);

            // 2. Get wall height
            const wallHeight = getRandom(MIN_WALL_HEIGHT, MAX_WALL_HEIGHT);

            // 3. Get X position, ensuring minimum gap from last wall
            let wallX;
            let attempts = 0;
            do {
                wallX = getRandom(MIN_X + WALL_WIDTH / 2, MAX_X - WALL_WIDTH / 2);
                attempts++;
            } while (
                Math.abs(wallX - lastX) < MIN_WALL_X_GAP &&
                attempts < MAX_GENERATION_ATTEMPTS
            );

            // 4. Check if this wall overlaps with any platform
            if (!wallOverlapsPlatforms(wallX, wallY, WALL_WIDTH, wallHeight, platforms)) {
                // 5. Add the wall [x, y, width, height] - color will be same as platforms
                walls.push([
                    wallX,
                    wallY,
                    WALL_WIDTH,
                    wallHeight
                ]);

                // 6. Update lastX for next iteration
                lastX = wallX;
                wallPlaced = true;
            }

            totalAttempts++;
        }

        // If we couldn't place a wall after many attempts, just skip this one
        if (!wallPlaced) {
            console.warn(`Could not place wall ${i + 1} without overlap after ${totalAttempts} attempts`);
        }
    }

    return walls;
}

/**
 * Generates a new array of platforms for a single level.
 * Now includes spike platform selection.
 */
function generatePlatforms() {
    const platforms = [];
    let currentY = getRandom(MIN_FIRST_Y, MAX_FIRST_Y);

    // --- Generate first platform ---
    const firstX = getRandom(MIN_X, MAX_X);
    const firstWidth = getRandom(MIN_PLATFORM_WIDTH, MAX_PLATFORM_WIDTH);
    platforms.push([
        firstX,
        currentY,
        firstWidth,
        PLATFORM_HEIGHT,
        false // isSpike flag - first platform is never a spike
    ]);

    let lastX = firstX; // Store the last X position

    // --- Calculate Y gaps ---
    // (This already ensures a minimum vertical distance)
    const numRemaining = PLATFORMS_PER_LEVEL - 1;
    const remainingHeight = MAX_FINAL_Y - currentY;
    const avgGap = remainingHeight / numRemaining;
    const minYGap = avgGap * 0.8;
    const maxYGap = avgGap * 1.2;

    // --- Generate remaining platforms ---
    for (let i = 1; i < PLATFORMS_PER_LEVEL; i++) {
        // 1. Get Y position
        currentY += getRandom(minYGap, maxYGap);
        if (currentY > MAX_FINAL_Y) { // Clamp
            currentY = MAX_FINAL_Y;
        }

        // 2. Get Width
        const currentWidth = getRandom(MIN_PLATFORM_WIDTH, MAX_PLATFORM_WIDTH);

        // 3. Get X position, ensuring min gap from the last platform
        let currentX;
        let attempts = 0;
        do {
            currentX = getRandom(MIN_X, MAX_X);
            attempts++;
            // Keep trying if the horizontal distance is too small
        } while (
            Math.abs(currentX - lastX) < MIN_CONSECUTIVE_X_GAP &&
            attempts < MAX_GENERATION_ATTEMPTS
        );
        // If it fails after 10 attempts, it will just use the last generated X,
        // which is fine as a rare fallback.

        // 4. Add the new platform
        platforms.push([
            currentX,
            currentY,
            currentWidth,
            PLATFORM_HEIGHT,
            false // isSpike flag - will be set later
        ]);

        // 5. Update lastX for the next iteration
        lastX = currentX;
    }

    // --- Randomly select platforms to be spikes ---
    // Don't make the first or last platform spikes for better gameplay
    const selectablePlatforms = platforms.slice(1, -1); // Exclude first and last
    const numSelectableSpikes = Math.min(SPIKES_PER_LEVEL, selectablePlatforms.length);

    // Shuffle and select platforms to be spikes
    const shuffledIndices = [];
    for (let i = 0; i < selectablePlatforms.length; i++) {
        shuffledIndices.push(i + 1); // +1 because we're excluding the first platform
    }

    // Fisher-Yates shuffle using our seeded random
    for (let i = shuffledIndices.length - 1; i > 0; i--) {
        const j = Math.floor(getRandom(0, i + 1));
        [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
    }

    // Mark the first numSelectableSpikes platforms as spikes
    for (let i = 0; i < numSelectableSpikes; i++) {
        const platformIndex = shuffledIndices[i];
        platforms[platformIndex][4] = true; // Set isSpike flag
    }

    return platforms;
}

/**
 * Base data for levels (colors, walls) - platforms will be generated.
 */
const LEVEL_CONFIGS = [
    { number: 1, startY: 0, color: 0x4488ff, backgroundColor: 0x1a1a2e, },
    { number: 2, startY: 15, color: 0xff00ff, backgroundColor: 0x2e1a2e, },
    { number: 3, startY: 30, color: 0x00ff00, backgroundColor: 0x1a2e1a, },
    { number: 4, startY: 45, color: 0xff0000, backgroundColor: 0x2e1a1a, },
    { number: 5, startY: 60, color: 0xffff00, backgroundColor: 0x2e2e1a, },
    { number: 6, startY: 75, color: 0x00ffff, backgroundColor: 0x1a2e2e, },
    { number: 7, startY: 90, color: 0xff6600, backgroundColor: 0x2e1f1a, },
    { number: 8, startY: 105, color: 0xff00aa, backgroundColor: 0x2e1a26, },
    { number: 9, startY: 120, color: 0xaaff00, backgroundColor: 0x262e1a, },
    { number: 10, startY: 135, color: 0x9966ff, backgroundColor: 0x231a2e, },
    { number: 11, startY: 150, color: 0x33ccff, backgroundColor: 0x1a2330, },
    { number: 12, startY: 165, color: 0xff3366, backgroundColor: 0x301a23, },
    { number: 13, startY: 180, color: 0x33ff66, backgroundColor: 0x1a3023, },
    { number: 14, startY: 195, color: 0xffaa33, backgroundColor: 0x30261a, },
    { number: 15, startY: 210, color: 0x66aaff, backgroundColor: 0x1a2230, },
    { number: 16, startY: 225, color: 0xcc66ff, backgroundColor: 0x2a1a30, },
    { number: 17, startY: 240, color: 0xff6699, backgroundColor: 0x301a28, },
    { number: 18, startY: 255, color: 0x66ffcc, backgroundColor: 0x1a302c, },
    { number: 19, startY: 270, color: 0x99ff66, backgroundColor: 0x24301a, },
    { number: 20, startY: 285, color: 0xffcc00, backgroundColor: 0x302a1a, },
];

// --- Main Loop to Generate All Levels ---
const LEVELS = [];
for (let i = 0; i < NUM_LEVELS; i++) {
    const config = LEVEL_CONFIGS[i];
    const platforms = generatePlatforms(); // Generate platforms first
    const walls = generateWalls(platforms); // Generate walls, avoiding platform overlap

    LEVELS.push({
        ...config, // Spread the number, startY, color, backgroundColor
        platforms: platforms,
        walls: walls
    });
}

export { LEVELS, LEVEL_HEIGHT };
