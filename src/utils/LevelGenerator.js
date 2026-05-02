export const WORLD_START = -4400;
export const WORLD_END   =  4600;
const GROUND_Y   = 690;
const MIN_PLAT_Y = 280;
const MAX_PLAT_Y = 580;
const MAX_H_GAP  = 380;

function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePlatforms(level) {
    const count   = 30 + level * 3;
    const range   = WORLD_END - WORLD_START;
    const segment = range / count;
    const platforms = [];

    for (let i = 0; i < count; i++) {
        const x = WORLD_START + i * segment + rnd(0, segment * 0.5);
        const y = rnd(MIN_PLAT_Y, MAX_PLAT_Y);
        const w = rnd(100, 260);
        platforms.push({ x: Math.round(x), y, w });
    }

    platforms.sort((a, b) => a.x - b.x);

    for (let i = 1; i < platforms.length; i++) {
        const gap = platforms[i].x - platforms[i - 1].x;
        if (gap > MAX_H_GAP) {
            platforms[i].x = platforms[i - 1].x + rnd(180, MAX_H_GAP);
        }
    }

    return platforms;
}

function generateCoins(platforms, level) {
    const coinsPerPlatform = 2 + Math.floor(level / 3);
    const coins = [];

    platforms.forEach(({ x, y, w }) => {
        const count = rnd(2, coinsPerPlatform + 1);
        for (let i = 0; i < count; i++) {
            coins.push({
                x: x - w / 2 + (w / (count + 1)) * (i + 1),
                y: y - 35
            });
        }
    });

    const groundCoins = 8 + level;
    for (let i = 0; i < groundCoins; i++) {
        coins.push({ x: rnd(WORLD_START + 300, WORLD_END - 100), y: GROUND_Y - 20 });
    }

    return coins;
}

function pickGroundType(level) {
    if (level >= 4) {
        const r = Math.random();
        return r < 0.45 ? 'cat1' : r < 0.75 ? 'cat2' : 'cat3';
    }
    if (level >= 2) return Math.random() < 0.6 ? 'cat1' : 'cat2';
    return 'cat1';
}

function generateEnemies(platforms, level) {
    const total   = 8 + level * 3;
    const onGround = Math.ceil(total * 0.5);
    const onPlat   = Math.ceil(total * 0.25);
    const inAir    = total - onGround - onPlat;
    const enemies  = [];

    for (let i = 0; i < onGround; i++) {
        enemies.push({
            type:  pickGroundType(level),
            x:     rnd(WORLD_START + 400, WORLD_END - 200),
            y:     GROUND_Y - 20,
            range: rnd(140, 300)
        });
    }

    const widePlats = platforms.filter(p => p.w >= 130);
    widePlats.sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(onPlat, widePlats.length); i++) {
        const p = widePlats[i];
        enemies.push({
            type:  pickGroundType(level),
            x:     p.x,
            y:     p.y - 30,
            range: Math.floor(p.w / 2) - 10
        });
    }

    const birdCount = Math.max(2, inAir + Math.floor(level / 2));
    for (let i = 0; i < birdCount; i++) {
        enemies.push({
            type:  'bird',
            x:     rnd(WORLD_START + 300, WORLD_END - 100),
            y:     rnd(180, 420),
            range: rnd(200, 450)
        });
    }

    return enemies;
}

export function generateLevel(level) {
    const platforms = generatePlatforms(level);
    const coins     = generateCoins(platforms, level);
    const enemies   = generateEnemies(platforms, level);
    return { platforms, coins, enemies };
}
