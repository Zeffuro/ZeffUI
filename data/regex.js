/* exported regexList */
var regexList = {
    "00": {
        regex: /] 00:/,
        matches: [
            // CHINESE
            {
                regex: /距离战斗开始还有(?<seconds>[0-9]{1,2})秒！\s*（.{1,12}）/,
                function: "handleCountdownTimer",
            },
            {
                regex: /“.*”任务开始。/,
                function: "onInstanceStart",
            },
            {
                regex: /“.*”任务结束了。/,
                function: "onInstanceEnd",
            },
            // ENGLISH
            {
                regex: /Battle commencing in (?<seconds>[0-9]{1,2}) seconds! \([a-zA-Z-' ]{2,31}\)/,
                function: "handleCountdownTimer",
            },
            {
                regex: /[\w-'èéêîïôàæûç,:\-() ]{1,99} has begun\./,
                function: "onInstanceStart",
            },
            {
                regex: /[\w-'èéêîïôàæûç,:\-() ]{1,99} has ended\./,
                function: "onInstanceEnd",
            },
            // FRENCH La mission “La Crique aux tributs” commence.
            {
                regex: /Début du combat dans (?<seconds>[0-9]{1,2}) secondes! \([a-zA-Z-w' ]{2,31}\)/,
                function: "handleCountdownTimer",
            },
            {
                regex: /La mission “.*” commence\./,
                function: "onInstanceStart",
            },
            {
                regex: /La mission “.*” prend fin\./,
                function: "onInstanceEnd",
            },
            // GERMAN
            {
                regex: /Noch (?<seconds>[0-9]{1,2}) Sekunden bis Kampfbeginn! \([a-zA-Z-' ]{2,31}\)/,
                function: "handleCountdownTimer",
            },
            {
                regex: /„.*“ hat begonnen\./,
                function: "onInstanceStart",
            },
            {
                regex: /„.*“ wurde beendet\./,
                function: "onInstanceEnd",
            },
            // JAPANESE
            {
                regex: /戦闘開始まで(?<seconds>[0-9]{1,2})秒！ （[a-zA-Z-' ]{2,31}）/,
                function: "handleCountdownTimer",
            },
            {
                regex: /「.*」の攻略を開始した。/,
                function: "onInstanceStart",
            },
            {
                regex: /「.*」の攻略を終了した。/,
                function: "onInstanceEnd",
            },
            // KOREAN
            {
                regex: /\/전투 시작 (?<seconds>[0-9]{1,2})초 전! （[a-zA-Z-' ]{2,31}）/,
                function: "handleCountdownTimer",
            },
            {
                regex: /.* 공략을 시작합니다./,
                function: "onInstanceStart",
            },
            {
                regex: /.* 공략을 종료했습니다./,
                function: "onInstanceEnd",
            },
            // COMMAND
            {
                regex: /\/zeffui/,
                function: "handleSettings",
            },
        ],
    },
    "03": {
        regex: /] 03:/,
        matches: [
            {
                regex: /(?<id>(?:[0-9A-F]{8})):Added new combatant (?<name>(?:[^:]*?))\. {2}Job: (?<job>(?:[^:]*?)) Level: (?<level>(?:[^:]*?)) Max HP: (?<hp>(?:[0-9]+))..*?Pos: \((?<x>(?:-?[0-9]+(?:[.,][0-9]+)?(?:E-?[0-9]+)?)),(?<y>(?:-?[0-9]+(?:[.,][0-9]+)?(?:E-?[0-9]+)?)),(?<z>(?:-?[0-9]+(?:[.,][0-9]+)?(?:E-?[0-9]+)?))\)(?: \((?<npcId>(?:.*?))\))?\./,
                function: "handleAddNewCombatant",
            },
        ],
    },
    "0C": {
        regex: /] 0C:/,
        matches: [
            {
                regex: /Player Stats: [0-9]{2}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:(?<sks>[0-9]{1,4}):(?<sps>[0-9]{1,4}):0:[0-9]{1,4}/,
                function: "handlePlayerStats",
            },
        ],
    },
    "1A": {
        regex: /] 1A:/,
        matches: [
            {
                regex: /(?<targetid>[A-F0-9]{8}):(?<target>.*) gains the effect of (?<effect>.*) from (?<player>[^)]*) for (?<duration>\d{1,4}\.?(\d{1,2})?) Seconds\./,
                function: "handleGainEffect",
            },
        ],
    },
    "1E": {
        regex: /] 1E:/,
        matches: [
            {
                regex: /(?<targetid>[A-F0-9]{8}):(?<target>.*) loses the effect of (?<effect>.*) from (?<player>[^)]*)\./,
                function: "handleLoseEffect",
            },
        ],
    },
    15: {
        regex: /] 15:/,
        matches: [
            {
                regex: /(?<playerid>[A-F0-9]{8}):(?<player>[^:]*):(?<skillid>[A-F0-9]{2,4}):(?<skillname>.*):(?<targetid>[A-F0-9]{8})?:(?<target>[^:]*)?:(?<power>\d)?[^:]+(?::[^:]*){37}$/,
                function: "handleSkill",
            },
        ],
    },
    16: {
        regex: /] 16:/,
        matches: [
            {
                regex: /(?<playerid>[A-F0-9]{8}):(?<player>[^:]*):(?<skillid>[A-F0-9]{2,4}):(?<skillname>.*):(?<targetid>[A-F0-9]{8})?:(?<target>[^:]*)?:(?<power>\d)?[^:]+(?::[^:]*){37}$/,
                function: "handleSkill",
            },
        ],
    },
    18: {
        regex: /] 18:/,
        matches: [
            {
                regex: /18:(?<ability>.*)?(?<effect>DoT|HoT) Tick on (?<target>.*) for (?<value>\d{1,6}) damage\./,
                function: "handleEffectTick",
            },
        ],
    },
    19: {
        regex: /] 19:/,
        matches: [
            {
                regex: /19:(?<target>.*) was defeated by (?<killer>.*)\./,
                function: "handleDeath",
            },
        ],
    },
};
