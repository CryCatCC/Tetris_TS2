Tetris game

To run you have to install node, cd into build folder and run:
```node server.js```
after that open url:
```localhost:3000/```

Modes w description: 

1. Classic
    - all figures
    - rotate figures
    - switch between next and current figure (once)
    - see next 4 figures

2. Limited
    - you can use only defined figures
        - Level 1: except I
        - Level 2: except I, O
        - Level 3: except O, J, L
        - Level 4 and higher: except I, O, J, L
    - see only next 2 figures
    - cannot switch between current and next figure

3. Bonuses
    - all Classic mode features
    - switch figures twice
    - Slower: slow game by pressing T key (active before first line being erased and after bomb use)
    - Bomb: after every 20 placed figures you can erase random 3 lines by pressing B key
