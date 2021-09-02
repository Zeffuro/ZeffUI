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
    
    
