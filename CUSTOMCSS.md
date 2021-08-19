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
