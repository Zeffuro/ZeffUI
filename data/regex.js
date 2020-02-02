var regexList = 
{
    "00": {
        regex: "] 00:",
        matches: [
            {
                "regex": "Battle commencing in (?<seconds>[0-9]{1,2}) seconds! \\([a-zA-Z-' ]{2,31}\\)",
                "function": "startCountdownTimer"
            }
        ]
    },
    "0C": {
        regex: "] 0C:",
        matches: [
            {
                "regex": "0C:Player Stats: [0-9]{2}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:[0-9]{1,4}:(?<sks>[0-9]{1,4}):(?<sps>[0-9]{1,4}):0:[0-9]{1,4}",
                "function": "handlePlayerStats"
            }
        ]
    },
    "1A":{
        regex: "] 1A:",
        matches: [
            {
                "regex": "1A:(?<targetid>[A-F0-9]{8}):(?<target>[\\w-'èéêîïôàæûç, ]{1,99}) gains the effect of (?<effect>[-a-zA-Z' ]{2,31}) from (?<player>[a-zA-Z-' ]{2,31}) for (?<duration>\\d{1,3}\\.?(\\d{1,2})?) Seconds\.",
                "function": "handleEffect"
            }
        ]
    },
    "15":{
        regex: "] 15:",
        matches: [

        ]
    }
}
;