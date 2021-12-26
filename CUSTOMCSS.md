Here I'll place some example CSS for some regularly asked features/setups

Skin the HP and MP bar regularly without using game images/textures. This example has been made with some extra settings: https://i.imgur.com/bwTdWBH.png

![image](https://user-images.githubusercontent.com/4972345/130081199-4d786dc1-b1ca-4fe2-a05c-af425b9a71d2.png)

    #health-bar, #mana-bar {
      -webkit-text-stroke: 0.45px rgba(0, 0, 0, 0.1);
      font-weight: bold !important;
      text-shadow: 1.5px 1.5px black;
      -webkit-font-smoothing: antialiased;
      width: 200px !important;
      height: 40px !important;
    }
    #health-bar {
      height: 40px !important;
    }
    #mana-bar {
      height: 10px !important;
    }
    #health-bar::-webkit-progress-value, #mana-bar::-webkit-progress-value {
      background-size: auto !important;
      background-image: linear-gradient(Gray, LightGray) !important;
    }
    #health-bar::-webkit-progress-bar, #mana-bar::-webkit-progress-bar {
      background-size: auto !important;
      background-image: linear-gradient(black, black) !important;
      border-style: solid;
      border-width: 2px;
    }

HP/MP Text Color

    #health-bar:after, #mana-bar:after {
      color: red !important;
    }


Adjust Party Buff Rows per party member (adjust the numbers in each translate to the correct location). If you use Grow to the left you need negative values.

    #party-row-1 {
        position: absolute;
        transform: translate(200px, 200px);
    }
    #party-row-2 {
        position: absolute;
        transform: translate(200px, 300px);
    }
    #party-row-3 {
        position: absolute;
        transform: translate(200px, 400px);
    }
    #party-row-4 {
        position: absolute;
        transform: translate(200px, 500px);
    }
    #party-row-5 {
        position: absolute;
        transform: translate(400px, 200px);
    }
    #party-row-6 {
        position: absolute;
        transform: translate(400px, 300px);
    }
    #party-row-7 {
        position: absolute;
        transform: translate(400px, 400px);
    }
    #party-row-8 {
        position: absolute;
        transform: translate(400px, 500px);
    }


If you want any of the custom positioned Party Rows to grow from right to left, you need to add these to the #party-row-number css:

    right: 0px;
    bottom: 0px;
    
And on flex-direction on the boxes:
    
    #party-row-1-box {
        flex-direction: row-reverse;
    }
    
    
More Custom CSS Options for manually positioning Party Cooldowns by rhopland

Miniguide: 
    
Do you want to see the structure as you change it? Remove the /* ... */ from all "border" elements. 
This will let you see the outline.

Change width between left and right side of cooldown tracker:
1. Find "#party-bar"
2. Within the brackets {} after #party-bar, find "grid-template-columns". Edit the center px value.

Change how many icons show before you break to next line:
1. Find "#party-row-X-box", where X is 1 to 8. There should be a comma between each.
2. Within the brackets {}, find width. Make it smaller for fewer icons, or bigger for more. 

Change height of the icon space (for party frames taller or shorter than 80px):
1. Find "#party-bar"
2. Within the brackets {}, find "grid-template-rows: repeat(4, 80px)" Change the pixel value to desired height.
3. Find "#party-row-X-box", where X is 1 to 8. There should be a comma between each.
4. Change ""height" to either the same as or 1 px smaller than the value you changed above.

5. (Optional) If you icons now seem small or overlap, go in ZeffUI settings and go to party frames options.
Change the "scale" value as desired.

    #party-row-1 { 
        grid-area: party-1;
        /*border: 2px solid red; */
    }
    #party-row-2 { 
        grid-area: party-2;
        /*border: 2px solid red;*/
    }
    #party-row-3 { 
        grid-area: party-3;
        /*border: 2px solid red;*/
    }
    #party-row-4 { 
        grid-area: party-4;
        /*border: 2px solid red; */
    }
    #party-row-5 { 
        grid-area: party-5;
        /*border: 2px solid red; */
    }
    #party-row-6 { 
        grid-area: party-6;
        /*border: 2px solid red; */
    }
    #party-row-7 { 
        grid-area: party-7;
        /*border: 2px solid red;*/
    }
    #party-row-8 { 
        grid-area: party-8;
        /*border: 2px solid red; */
    }
    #party-bar {
        /*border: 2px solid black; */
        display: grid !important; 
        grid-template-columns: fit-content(100px) 360px fit-content(100px) !important;
        grid-template-rows: repeat(4, 80px) !important;
        grid-template-areas:
        "party-1 . party-2"
        "party-3 . party-4"
        "party-5 . party-6"
        "party-7 . party-8" !important;
    }
    #party-row-1-box, #party-row-2-box, #party-row-3-box, #party-row-4-box, #party-row-5-box, #party-row-6-box, #party-row-7-box, #party-row-8-box {
        /*border: 2px solid yellow;*/
        display: flex;
        width: 200px;
        height: 79px;
        flex-wrap: wrap;
    }
    #party-row-1-box, #party-row-3-box, #party-row-5-box, #party-row-7-box {
        justify-content: right;
        flex-direction: row-reverse;
    }
    
    
Nicer looking pulltimer by rhopland


    #timer-bar {
        width: 600px !important;
        height: 40px !important;
    }
    #timer-bar:after {
        color: yellow !important;
        font-size: 34px !important;
        /*border: 2px solid red;*/
        float: right;
        margin-top: -25px;
        margin-right: -45px;
    }
    #timer-bar::-webkit-progress-bar {
        border-style: solid;
        border-width: 1px;
        background-size: auto !important;
        background-image: linear-gradient(Gray, LightGray) !important;
    }
    #timer-bar::-webkit-progress-value {
        background-size: auto !important;
        background-image: linear-gradient(Gray, LightGray) !important;
    }
