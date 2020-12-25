/* exported regexList */
var regexList = 
{
	"00": {
		regex: "] 00:",
		matches: [
			// CHINESE
			{
				"regex": "距离战斗开始还有(?<seconds>[0-9]{1,2})秒！\\（[a-zA-Z-' ]{2,31}\\）",
				"function": "startCountdownTimer"
			},
			{
				"regex": "“.*”任务开始。",
				"function": "onInstanceStart"
			},
			{
				"regex": "“.*”任务结束了。",
				"function": "onInstanceEnd"
			},
			// ENGLISH
			{
				"regex": "Battle commencing in (?<seconds>[0-9]{1,2}) seconds! \\([a-zA-Z-' ]{2,31}\\)",
				"function": "startCountdownTimer"
			},
			{
				"regex": "[\\w-'èéêîïôàæûç,:\\-() ]{1,99} has begun\\.",
				"function": "onInstanceStart"
			},
			{
				"regex": "[\\w-'èéêîïôàæûç,:\\-() ]{1,99} has ended\\.",
				"function": "onInstanceEnd"
			},
			// FRENCH La mission “La Crique aux tributs” commence.
			{
				"regex": "Début du combat dans (?<seconds>[0-9]{1,2}) secondes! \\([a-zA-Z-' ]{2,31}\\)",
				"function": "startCountdownTimer"
			},
			{
				"regex": "La mission “.*” commence\\.",
				"function": "onInstanceStart"
			},
			{
				"regex": "La mission “.*” prend fin\\.",
				"function": "onInstanceEnd"
			},
			// GERMAN
			{
				"regex": "Noch (?<seconds>[0-9]{1,2}) Sekunden bis Kampfbeginn! \\([a-zA-Z-' ]{2,31}\\)",
				"function": "startCountdownTimer"
			},
			{
				"regex": "„.*“ hat begonnen\\.",
				"function": "onInstanceStart"
			},
			{
				"regex": "„.*“ wurde beendet\\.",
				"function": "onInstanceEnd"
			},
			// JAPANESE
			{
				"regex": "戦闘開始まで(?<seconds>[0-9]{1,2})秒！ \\（[a-zA-Z-' ]{2,31}\\）",
				"function": "startCountdownTimer"
			},
			{
				"regex": "「.*」の攻略を開始した。",
				"function": "onInstanceStart"
			},
			{
				"regex": "「.*」の攻略を終了した。",
				"function": "onInstanceEnd"
			},
			// KOREAN
			{
				"regex": "/전투 시작 (?<seconds>[0-9]{1,2})초 전! \\（[a-zA-Z-' ]{2,31}\\）",
				"function": "startCountdownTimer"
			},
			{
				"regex": ".* 공략을 시작합니다.",
				"function": "onInstanceStart"
			},
			{
				"regex": ".* 공략을 종료했습니다.",
				"function": "onInstanceEnd"
			},
		]
	},
	"0C": {
		regex: "] 0C:",
		matches: [
			{
				"regex": "Player Stats: [0-9]{2}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:(?<sks>[0-9]{1,4}):(?<sps>[0-9]{1,4}):0:[0-9]{1,4}",
				"function": "handlePlayerStats"
			}
		]
	},
	"1A":{
		regex: "] 1A:",
		matches: [
			{
				"regex": "(?<targetid>[A-F0-9]{8}):(?<target>.*) gains the effect of (?<effect>.*) from (?<player>[a-zA-Z-' ]{2,31}) for (?<duration>\\d{1,4}\\.?(\\d{1,2})?) Seconds\\.",
				"function": "handleEffect"
			}
		]
	},
	"15":{
		regex: "] 15:",
		matches: [
			{
				"regex": "(?<playerid>[A-F0-9]{8}):(?<player>[a-zA-Z-' ]{2,31}):(?<skillid>[A-F0-9]{2,4}):(?<skillname>.*):(?<targetid>[A-F0-9]{8})?:(?<target>[a-zA-Z-' ]{2,31})?:(?<power>\\d)?",
				"function": "handleSkill"
			}
		]
	},
	"16":{
		regex: "] 16:",
		matches: [
			{
				"regex": "(?<playerid>[A-F0-9]{8}):(?<player>[a-zA-Z-' ]{2,31}):(?<skillid>[A-F0-9]{2,4}):(?<skillname>.*):(?<targetid>[A-F0-9]{8})?:(?<target>[a-zA-Z-' ]{2,31})?:(?<power>\\d)?",
				"function": "handleSkill"
			}
		]
	}
}
;