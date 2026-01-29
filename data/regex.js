/* exported regexList */
var regexList = {
    "00": {
        regex: /^\[[^\]]+\] ChatLog 00:/,
        matches: [
            // CHINESE
            {
                regex: /距离战斗开始还有(?<seconds>[0-9]{1,2})秒！\s*（.{1,12}）/,
                function: "handleCountdownTimer",
            },
            {
                regex: /.{1,12}取消了战斗开始倒计时。/,
                function: "stopCountdownTimer",
            },
            {
                regex: /“.*”任务开始。/,
                function: "onInstanceStart",
            },
            {
                regex: /“.*”任务结束了。/,
                function: "onInstanceEnd",
            },
            // TRADITIONAL CHINESE
            {
                regex: /距離戰鬥開始還有(?<seconds>[0-9]{1,2})秒！\s*（.{1,12}）/,
                function: "handleCountdownTimer",
            },
            {
                regex: /.{1,12}取消了戰鬥開始倒計時。/,
                function: "stopCountdownTimer",
            },
            {
                regex: /“.*”任務開始。/,
                function: "onInstanceStart",
            },
            {
                regex: /“.*”任務結束了。/,
                function: "onInstanceEnd",
            },
            // ENGLISH
            {
                regex: /Battle commencing in (?<seconds>[0-9]{1,2}) seconds! \([a-zA-Z-' ]{2,31}\)/,
                function: "handleCountdownTimer",
            },
            {
                regex: /Countdown canceled by [a-zA-Z-' ]{2,31}/,
                function: "stopCountdownTimer",
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
                regex: /Le compte à rebours a été interrompu par \([a-zA-Z-w' ]{2,31}\)/,
                function: "stopCountdownTimer",
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
                regex: /[a-zA-Z-' ]{2,31} hat den Countdown abgebrochen/,
                function: "stopCountdownTimer",
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
                regex: /[a-zA-Z-' ]{2,31}により、戦闘開始カウントがキャンセルされました。/,
                function: "stopCountdownTimer",
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
                regex: /전투 시작 (?<seconds>[0-9]{1,2})초 전! \(.{1,12}\)/,
                function: "handleCountdownTimer",
            },
            {
                regex: /.{1,12} 님이 초읽기를 취소했습니다\\./,
                function: "stopCountdownTimer",
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
        regex: /^\[[^\]]+\] AddCombatant 03:/,
        matches: [
            {
                //regex: /(?<id>(?:[0-9A-F]{8})):Added new combatant (?<name>(?:[^:]*?))\. {2}Job: (?<job>(?:[^:]*?)) Level: (?<level>(?:[^:]*?)) Max HP: (?<hp>(?:[0-9]+))..*?Pos: \((?<x>(?:-?[0-9]+(?:[.,][0-9]+)?(?:E-?[0-9]+)?)),(?<y>(?:-?[0-9]+(?:[.,][0-9]+)?(?:E-?[0-9]+)?)),(?<z>(?:-?[0-9]+(?:[.,][0-9]+)?(?:E-?[0-9]+)?))\)(?: \((?<npcId>(?:.*?))\))?\./,
                regex: /^\[[^\]]+\] AddCombatant (?<type>03):(?<id>(?:[^:]*)):(?<name>(?:[^:]*)):(?<job>(?:[^:]*)):(?<level>(?:[^:]*)):(?<ownerId>(?:[^:]*)):(?<worldId>(?:[^:]*)):(?<world>(?:[^:]*)):(?<npcNameId>(?:[^:]*)):(?<npcBaseId>(?:[^:]*)):(?<currentHp>(?:[^:]*)):(?<hp>(?:[^:]*)):(?<currentMp>(?:[^:]*)):(?<mp>(?:[^:]*))(?::[^:]*){2}:(?<x>(?:[^:]*)):(?<y>(?:[^:]*)):(?<z>(?:[^:]*)):(?<heading>(?:[^:]*))(?:$|:)/,
                function: "handleAddNewCombatant",
            },
        ],
    },
    "04": {
        regex: /^\[[^\]]+\] RemoveCombatant 04:/,
        matches: [
            {
                //regex: /(?<id>(?:[0-9A-F]{8})):Added new combatant (?<name>(?:[^:]*?))\. {2}Job: (?<job>(?:[^:]*?)) Level: (?<level>(?:[^:]*?)) Max HP: (?<hp>(?:[0-9]+))..*?Pos: \((?<x>(?:-?[0-9]+(?:[.,][0-9]+)?(?:E-?[0-9]+)?)),(?<y>(?:-?[0-9]+(?:[.,][0-9]+)?(?:E-?[0-9]+)?)),(?<z>(?:-?[0-9]+(?:[.,][0-9]+)?(?:E-?[0-9]+)?))\)(?: \((?<npcId>(?:.*?))\))?\./,
                regex: /^\[[^\]]+\] RemoveCombatant (?<type>04):(?<id>(?:[^:]*)):(?<name>(?:[^:]*)):(?<job>(?:[^:]*)):(?<level>(?:[^:]*)):(?<owner>(?:[^:]*)):[^:]*:(?<world>(?:[^:]*)):(?<npcNameId>(?:[^:]*)):(?<npcBaseId>(?:[^:]*)):[^:]*:(?<hp>(?:[^:]*))(?::[^:]*){4}:(?<x>(?:[^:]*)):(?<y>(?:[^:]*)):(?<z>(?:[^:]*)):(?<heading>(?:[^:]*))(?:$|:)/,
                function: "handleRemoveCombatant",
            },
        ],
    },
    "0C": {
        regex: /^\[[^\]]+\] PlayerStats 0C:/,
        matches: [
            {
                //regex: /PlayerStats 0C: [0-9]{2}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:(?<sks>[0-9]{1,4}):(?<sps>[0-9]{1,4}):0:[0-9]{1,4}/,
                regex: /^\[[^\]]+\] PlayerStats (?<type>0C):(?<job>(?:[^:]*)):(?<strength>(?:[^:]*)):(?<dexterity>(?:[^:]*)):(?<vitality>(?:[^:]*)):(?<intelligence>(?:[^:]*)):(?<mind>(?:[^:]*)):(?<piety>(?:[^:]*)):(?<attackPower>(?:[^:]*)):(?<directHit>(?:[^:]*)):(?<criticalHit>(?:[^:]*)):(?<attackMagicPotency>(?:[^:]*)):(?<healMagicPotency>(?:[^:]*)):(?<determination>(?:[^:]*)):(?<sks>(?:[^:]*)):(?<sps>(?:[^:]*)):[^:]*:(?<tenacity>(?:[^:]*)):(?<localContentId>(?:[^:]*))(?:$|:)/,
                function: "handlePlayerStats",
            },
        ],
    },
    "1A": {
        regex: /^\[[^\]]+\] StatusAdd 1A:/,
        matches: [
            {
                //regex: /(?<targetid>[A-F0-9]{8}):(?<target>.*) gains the effect of (?<effect>.*) from (?<player>[^)]*) for (?<duration>\d{1,4}\.?(\d{1,2})?) Seconds\./,
                regex: /^\[[^\]]+\] StatusAdd (?<type>1A):(?<effectId>(?:[^:]*)):(?<effect>(?:(?:[^:]|: )*?)):(?<duration>(?:[^:]*)):(?<playerId>(?:[^:]*)):(?<player>(?:[^:]*)):(?<targetId>(?:[^:]*)):(?<target>(?:[^:]*)):(?<count>(?:[^:]*)):(?<targetMaxHp>(?:[^:]*)):(?<sourceMaxHp>(?:[^:]*))(?:$|:)/,
                function: "handleGainEffect",
            },
        ],
    },
    "1E": {
        regex: /^\[[^\]]+\] StatusRemove 1E:/,
        matches: [
            {
                //regex: /(?<targetid>[A-F0-9]{8}):(?<target>.*) loses the effect of (?<effect>.*) from (?<player>[^)]*)\./,
                regex: /^\[[^\]]+\] StatusRemove (?<type>1E):(?<effectId>(?:[^:]*)):(?<effect>(?:(?:[^:]|: )*?)):[^:]*:(?<playerId>(?:[^:]*)):(?<player>(?:[^:]*)):(?<targetId>(?:[^:]*)):(?<target>(?:[^:]*)):(?<count>(?:[^:]*))(?:$|:)/,
                function: "handleLoseEffect",
            },
        ],
    },
    15: {
        regex: /^\[[^\]]+\] ActionEffect 15:/,
        matches: [
            {
                //regex: /(?<playerid>[A-F0-9]{8}):(?<player>[^:]*):(?<skillid>[A-F0-9]{2,4}):(?<skillname>.*):(?<targetid>[A-F0-9]{8})?:(?<target>[^:]*)?:(?<power>\d)?[^:]+(?::[^:]*){37}$/,
                regex: /^\[[^\]]+\] ActionEffect (?<type>(?:15|16)):(?<playerid>(?:[^:]*)):(?<player>(?:[^:]*)):(?<skillid>(?:[^:]*)):(?<skillname>(?:(?:[^:]|: )*?)):(?<targetid>(?:[^:]*)):(?<target>(?:[^:]*)):(?<flags>(?:[^:]*)):(?<damage>(?:[^:]*))(?::[^:]*){14}:(?<targetCurrentHp>(?:[^:]*)):(?<targetMaxHp>(?:[^:]*)):(?<targetCurrentMp>(?:[^:]*)):(?<targetMaxMp>(?:[^:]*))(?::[^:]*){2}:(?<targetX>(?:[^:]*)):(?<targetY>(?:[^:]*)):(?<targetZ>(?:[^:]*)):(?<targetHeading>(?:[^:]*)):(?<currentHp>(?:[^:]*)):(?<maxHp>(?:[^:]*)):(?<currentMp>(?:[^:]*)):(?<maxMp>(?:[^:]*))(?::[^:]*){2}:(?<x>(?:[^:]*)):(?<y>(?:[^:]*)):(?<z>(?:[^:]*)):(?<heading>(?:[^:]*)):(?<sequence>(?:[^:]*)):(?<targetIndex>(?:[^:]*))(?:$|:)/,
                function: "handleSkill",
            },
        ],
    },
    16: {
        regex: /^\[[^\]]+\] AOEActionEffect 16:/,
        matches: [
            {
                //regex: /(?<playerid>[A-F0-9]{8}):(?<player>[^:]*):(?<skillid>[A-F0-9]{2,4}):(?<skillname>.*):(?<targetid>[A-F0-9]{8})?:(?<target>[^:]*)?:(?<power>\d)?[^:]+(?::[^:]*){37}$/,
                regex: /^\[[^\]]+\] AOEActionEffect (?<type>(?:15|16)):(?<playerid>(?:[^:]*)):(?<player>(?:[^:]*)):(?<skillid>(?:[^:]*)):(?<skillname>(?:(?:[^:]|: )*?)):(?<targetid>(?:[^:]*)):(?<target>(?:[^:]*)):(?<flags>(?:[^:]*)):(?<damage>(?:[^:]*))(?::[^:]*){14}:(?<targetCurrentHp>(?:[^:]*)):(?<targetMaxHp>(?:[^:]*)):(?<targetCurrentMp>(?:[^:]*)):(?<targetMaxMp>(?:[^:]*))(?::[^:]*){2}:(?<targetX>(?:[^:]*)):(?<targetY>(?:[^:]*)):(?<targetZ>(?:[^:]*)):(?<targetHeading>(?:[^:]*)):(?<currentHp>(?:[^:]*)):(?<maxHp>(?:[^:]*)):(?<currentMp>(?:[^:]*)):(?<maxMp>(?:[^:]*))(?::[^:]*){2}:(?<x>(?:[^:]*)):(?<y>(?:[^:]*)):(?<z>(?:[^:]*)):(?<heading>(?:[^:]*)):(?<sequence>(?:[^:]*)):(?<targetIndex>(?:[^:]*))(?:$|:)/,
                function: "handleSkill",
            },
        ],
    },
    18: {
        regex: /^\[[^\]]+\] DoTHoT 18:/,
        matches: [
            {
                //regex: /18:(?<ability>.*)?(?<effect>DoT|HoT) Tick on (?<target>.*) for (?<value>\d{1,6}) damage\./,
                regex: /^\[[^\]]+\] DoTHoT (?<type>(?:18)):(?<playerid>(?:[^:]*)):(?<player>(?:[^:]*)):(?<effect>DoT|HoT):(?<skillid>[A-F0-9]{1,4}):(?<value>[A-F0-9]{1,4}):/,
                function: "handleEffectTick",
            },
        ],
    },
    19: {
        regex: /^\[[^\]]+\] Death 19:/,
        matches: [
            {
                //regex: /19:(?<target>.*) was defeated by (?<killer>.*)\./,
                regex: /^\[[^\]]+\] Death (?<type>19):(?<targetId>(?:[^:]*)):(?<target>(?:[^:]*)):(?<killerId>(?:[^:]*)):(?<killer>(?:[^:]*))(?:$|:)/,
                function: "handleDeath",
            },
        ],
    },
    21: {
        regex: /^\[[^\]]+\] Director 21:/,
        matches: [
            {
                regex: /^\[[^\]]+\] Director 21:(?:[^:]*):(?<command>(?:400000(?:03|0F)))/,
                function: "onPartyWipe",
            },
        ],
    },
};
