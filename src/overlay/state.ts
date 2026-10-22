import type { Settings, Role } from "../shared/settings";
import type {
    PlayerChangedDetail,
    PartyMember,
    RawPartyMember,
    TargetCombatant,
} from "../plugin/types";
import { content_type } from "../data/content-type";
import { zone_info } from "../data/zones";

export interface PlayerPet {
    name: string;
    id: string;
    ownerId: string;
}
interface GameState {
    target: TargetCombatant | null;
    inCombat: boolean;
    blockRuinGained: boolean;
    player: PlayerChangedDetail | null;
    playerPrevious: PlayerChangedDetail | null;
    playerTags: {
        job?: string;
        percentHP?: number;
        deficitHP?: string;
        currentMaxHP?: string;
        percentMP?: number;
        deficitMP?: string;
        currentMaxMP?: string;
    };
    playerPets: PlayerPet[];
    currentrole: Role | null;
    zone: {
        id?: number;
        name?: string;
        info: (typeof zone_info)[number] | undefined;
        type: string;
    };
    partyList: PartyMember[];
    rawPartyList: RawPartyMember[];
    stats: {
        skillSpeed: number;
        spellSpeed: number;
        stacks: number;
        maxStacks: number;
    };
    previous_MP: number;
}
export const ui: {
    locked: boolean;
    actlocked: boolean;
    gridshown: boolean;
    dragPosition: Partial<Record<string, { x: number; y: number }>>;
    activeSettingsWindow: Window | null;
    labels: { health: string; mana: string };
} = {
    locked: true,
    actlocked: false,
    gridshown: false,
    dragPosition: {},
    activeSettingsWindow: null,
    labels: { health: "", mana: "" },
};

let currentSettings: Settings | null = null;
export const runtime = {
    previewingSettings: false,
    get currentSettings(): Settings {
        if (currentSettings === null)
            throw new Error("Settings have not loaded");
        return currentSettings;
    },
    set currentSettings(value: Settings) {
        currentSettings = value;
    },
    get hasSettings(): boolean {
        return currentSettings !== null;
    },
};

export const gameState: GameState = {
    target: null,
    inCombat: false,
    blockRuinGained: false,
    player: null,
    playerPrevious: null,
    playerTags: {},
    playerPets: [],
    currentrole: null,
    zone: { info: undefined, type: "Unspecified" },
    partyList: [],
    rawPartyList: [],
    stats: {
        skillSpeed: 0,
        spellSpeed: 0,
        stacks: 0,
        maxStacks: 0,
    },
    previous_MP: 0,
};

export let activeElements = {
    dotBars: new Map<number, string>(),
    buffBars: new Map<number, string>(),
    raidBuffs: new Map<string, string>(),
    mitigations: new Map<string, string>(),
    partyCooldowns: new Map<string, string>(),
    customCooldowns: new Map<string, string>(),
    countdowns: new Map<string, ReturnType<typeof setInterval>>(),
    currentCharges: new Map<string, number>(),
    tts: new Map<string, ReturnType<typeof setInterval>>(),
    ttsLastCalled: new Map<string, number>(),
};

export const GAME_DATA = {
    CONTENT_TYPE: content_type,
    // MP Data copied from cactbot constants: https://github.com/quisquous/cactbot/blob/ecfa4665ba7652e9d4a278e360cc2aadab54bb5a/ui/jobs/constants.ts
    EFFECT_TICK: 3.0,
    MP_DATA: {
        normal: 0.06,
        combat: 0.02,
        umbral_1: 0.3,
        umbral_2: 0.45,
        umbral_3: 0.6,
        tick: 3.0,
    },
    // Comes from https://www.akhmorning.com/allagan-studies/stats/speed/ and https://www.akhmorning.com/allagan-studies/modifiers/levelmods/ (SUB)
    SPEED_LOOKUP: new Map([
        [1, 56],
        [2, 57],
        [3, 60],
        [4, 62],
        [5, 65],
        [6, 68],
        [7, 70],
        [8, 73],
        [9, 76],
        [10, 78],
        [11, 82],
        [12, 85],
        [13, 89],
        [14, 93],
        [15, 96],
        [16, 100],
        [17, 104],
        [18, 109],
        [19, 113],
        [20, 116],
        [21, 122],
        [22, 127],
        [23, 133],
        [24, 138],
        [25, 144],
        [26, 150],
        [27, 155],
        [28, 162],
        [29, 168],
        [30, 173],
        [31, 181],
        [32, 188],
        [33, 194],
        [34, 202],
        [35, 209],
        [36, 215],
        [37, 223],
        [38, 229],
        [39, 236],
        [40, 244],
        [41, 253],
        [42, 263],
        [43, 272],
        [44, 283],
        [45, 292],
        [46, 302],
        [47, 311],
        [48, 322],
        [49, 331],
        [50, 341],
        [51, 342],
        [52, 344],
        [53, 345],
        [54, 346],
        [55, 347],
        [56, 349],
        [57, 350],
        [58, 351],
        [59, 352],
        [60, 354],
        [61, 355],
        [62, 356],
        [63, 357],
        [64, 358],
        [65, 359],
        [66, 360],
        [67, 361],
        [68, 362],
        [69, 363],
        [70, 364],
        [71, 365],
        [72, 366],
        [73, 367],
        [74, 368],
        [75, 370],
        [76, 372],
        [77, 374],
        [78, 376],
        [79, 378],
        [80, 380],
        [81, 382],
        [82, 384],
        [83, 386],
        [84, 388],
        [85, 390],
        [86, 392],
        [87, 394],
        [88, 396],
        [89, 398],
        [90, 400],
        [91, 402],
        [92, 404],
        [93, 406],
        [94, 408],
        [95, 410],
        [96, 412],
        [97, 414],
        [98, 416],
        [99, 418],
        [100, 420],
    ]),
    ZONE_INFO: zone_info,
};

export const UPDATE_INTERVAL = 10;
