var regexList = 
{
	"00": {
		regex: "] 00:",
		matches: [
			{
				"regex": "Battle commencing in (?<seconds>[0-9]{1,2}) seconds! \\([a-zA-Z-' ]{2,31}\\)",
				"function": "startCountdownTimer"
			},
			{
				"regex": "Début du combat dans (?<seconds>[0-9]{1,2}) secondes ! \\([a-zA-Z-' ]{2,31}\\)",
				"function": "startCountdownTimer"
			},
			{
				"regex": "Noch (?<seconds>[0-9]{1,2}) Sekunden bis Kampfbeginn! \\([a-zA-Z-' ]{2,31}\\)",
				"function": "startCountdownTimer"
			},
			{
				"regex": "距离战斗开始还有(?<seconds>[0-9]{1,2})秒！\\([a-zA-Z-' ]{2,31}\\)",
				"function": "startCountdownTimer"
			},
			{
				"regex": "戦闘開始まで(?<seconds>[0-9]{1,2})秒！\\([a-zA-Z-' ]{2,31}\\)",
				"function": "startCountdownTimer"
			},
			{
				"regex": "/전투 시작 (?<seconds>[0-9]{1,2})초 전! \\([a-zA-Z-' ]{2,31}\\)",
				"function": "startCountdownTimer"
			},
			{
				"regex": "[\\w-'èéêîïôàæûç,:\\-() ]{1,99} has begun\\.",
				"function": "onInstanceStart"
			},
			{
				"regex": "[\\w-'èéêîïôàæûç,:\\-() ]{1,99} has ended\\.",
				"function": "onInstanceEnd"
			}
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
				"regex": "(?<targetid>[A-F0-9]{8}):(?<target>[\\w-'èéêîïôàæûç, ]{1,99}) gains the effect of (?<effect>[-a-zA-Z' ]{2,31}) from (?<player>[a-zA-Z-' ]{2,31}) for (?<duration>\\d{1,4}\\.?(\\d{1,2})?) Seconds\\.",
				"function": "handleEffect"
			}
		]
	},
	"15":{
		regex: "] 15:",
		matches: [
			{
				"regex": "(?<playerid>[A-F0-9]{8}):(?<player>[a-zA-Z-' ]{2,31}):(?<skillid>[A-F0-9]{2,4}):(?<skillname>[-a-zA-Z' ]{2,31}):(?<targetid>[A-F0-9]{8})?:(?<target>[a-zA-Z-' ]{2,31})?:(?<power>\\d)?",
				"function": "handleSkill"
			}
		]
	},
	"16":{
		regex: "] 16:",
		matches: [
			{
				"regex": "(?<playerid>[A-F0-9]{8}):(?<player>[a-zA-Z-' ]{2,31}):(?<skillid>[A-F0-9]{2,4}):(?<skillname>[-a-zA-Z' ]{2,31}):(?<targetid>[A-F0-9]{8})?:(?<target>[a-zA-Z-' ]{2,31})?:(?<power>\\d)?",
				"function": "handleSkill"
			}
		]
	}
}
;