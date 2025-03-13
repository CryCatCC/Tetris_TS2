class TetrisGame {
    private readonly _canvas : HTMLCanvasElement;
    private readonly _ctx : CanvasRenderingContext2D;
    private _COLORS = [
      'black', 'orange', 'blue', 'yellow', 'cyan', 'red', 'green', 'magenta', 'white'
    ];
  
    private _TETROMINOS = [
      {
        name: 'L',
        color: 1,
        schema: [
          [1, 1, 1],
          [1, 0, 0]
        ]
      }, {
        name: 'J',
        color: 2,
        schema: [
          [1, 1, 1],
          [0, 0, 1]
        ]
      }, {
        name: 'O',
        color: 3,
        schema: [
          [1, 1],
          [1, 1]
        ]
      }, {
        name: 'I',
        color: 4,
        schema: [
          [1, 1, 1, 1]
        ]
      }, {
        name: 'Z',
        color: 5,
        schema: [
          [0, 1, 1],
          [1, 1, 0]
        ]
      }, {
        name: 'S',
        color: 6,
        schema: [
          [1, 1, 0],
          [0, 1, 1]
        ]
      }, {
        name: 'T',
        color: 7,
        schema: [
          [0, 1, 0],
          [1, 1, 1]
        ]
      }
    ];
    private _TETROMINOS_FREQ = {
      //         L J O I Z S T
      'classic':[3,3,2,1,3,3,2],
      'bonuses':[3,3,3,2,2,2,3],
      'limited':[3,3,2,1,3,3,2]
    };
    private _TETROMINOS_COUNT = [
      0,0,0,0,0,0,0
    ];
    private _LIM_TETROMINOS_EXC = [
      ["I"],["I","O"],["O","J","L"],["I","O","J","L"]
    ];
    // field characteristics
    private readonly _WIDTH = 10;
    private readonly _HEIGHT = 20;
    private readonly _TETR_SIDE = 32;
    private _field = [];

    // current tetrominos
    private _currX = 0;
    private _currY = 0;
    private _currTetrIndex;
    private _currSchema;
    private _switched : number;
    // next tetrominos
    private _NEXT_QUANTITY = 4;
    private _nextTetrIndexes = [];
    // frame Time
    private _timeStart = 0;
    private _timeFinish = 0;
    private _movingTime = 0;
    // level, scores, speed
    private _slowed : boolean;
    private _speedTimer = 500;
    private _score = 0;
    private _level_score = 0;
    private _level = 1;
    private _gameOver : boolean;
    private _isRunning : boolean;
    private _mode : string;
    private _placed = 0;
    private _bomb_t : boolean;

    public constructor(selector : string) {
      this._canvas = document.querySelector(selector) as HTMLCanvasElement; 
      this._ctx = this._canvas.getContext('2d');            
                                               
      this.init = this.init.bind(this);                                            
      this.update = this.update.bind(this);         
      this.render = this.render.bind(this);         

      this.drawTetr = this.drawTetr.bind(this);
      this.onPressKeyboard = this.onPressKeyboard.bind(this); 
      this.getNewTetr = this.getNewTetr.bind(this);   
      this.checkCollision = this.checkCollision.bind(this); 
      this.linesEraser = this.linesEraser.bind(this); 

      this.stop = this.stop.bind(this);
      this.run = this.run.bind(this);
    }
    public init(mode : string) {
      window.addEventListener('keydown', this.onPressKeyboard, false);
      // reset every game variable
      
      this._field = TetrisGame.fieldInit(this._WIDTH, this._HEIGHT);
      this._gameOver = false;
      this._isRunning = true;
      this._score = 0;
      this._level_score = 0;
      this._level = 1;
      this._speedTimer = 500
      this._switched = 0;
      this._placed = 0;
      this._bomb_t = false;
      this._TETROMINOS_COUNT = [
        0,0,0,0,0,0,0
      ];
      // set mode prop
                      
      this._mode = mode;  
      
      if (this._mode=='limited') this._NEXT_QUANTITY = 2; 
      
      
      // start new game
      
      this.getNewTetr();
      this.update();
    }
    public stop(){
      this._isRunning = false;
    }
    public run(){
      this._isRunning = true;
      this.update();
    }
    private update() {
      if (!this._gameOver && this._isRunning){
        this._timeStart = performance.now();
        // calculate moving time
        this._movingTime += this._timeStart - this._timeFinish; // timer
        
        if (this._movingTime > this._speedTimer) {
          this._currY += 1;
          this._movingTime = 0;
        }
        // check collision. If collision detected and can't set tetrominos solid - game Over!
        if (this.checkCollision(this._currSchema, 0, 0)) {
          if (!this.setSolid()) this._gameOver = true;
          this.getNewTetr();
        }
        // erase complete lines
        this.linesEraser();
        // render game
        this.render();
        // request to animate the frame
        requestAnimationFrame(this.update);
        this._timeFinish = performance.now();
      }
      else if (this._gameOver){
        // game over!
        const ctx = this._ctx;
        ctx.fillStyle = '#003b1f';
        ctx.fillRect(145, 200, 250, 120);
        ctx.font = '26px bold Courier New';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('GameOver!',180,238);
        ctx.fillText(`Score: ${this._score}`, 180, 264);
        ctx.fillText(`Q - quit, R - retry`,180,290);
        // remember score
        localStorage.setItem(this._mode,JSON.stringify(this._score));
      }
    }
    private render() {
      const ctx = this._ctx;
      const canvas = this._canvas;

      // clear all game window
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000b1f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // field draw
      for (let y = 0; y < this._HEIGHT; y++) {
        for (let x = 0; x < this._WIDTH; x++) {
          ctx.fillRect(x * this._TETR_SIDE, y * this._TETR_SIDE, this._TETR_SIDE-1, this._TETR_SIDE-1)
          this.drawTetr(
            x * this._TETR_SIDE,
            y * this._TETR_SIDE,
            this._COLORS[this._field[y][x]]
          )
        }
      }
      // current tetrominos draw
      for (let y = 0; y < this._currSchema.length; y++) {
        for (let x = 0; x < this._currSchema[y].length; x++) {
          if (this._currSchema[y][x] === 1) {
            this.drawTetr(
              (x + this._currX) * this._TETR_SIDE,
              (y + this._currY) * this._TETR_SIDE,
              this._COLORS[this._TETROMINOS[this._currTetrIndex].color]
            )
          }
        }
      }
      // draw next tetrominos
      for (let i = 0; i < this._nextTetrIndexes.length; i++) 
        for (let y = 0; y < this._TETROMINOS[this._nextTetrIndexes[i]].schema.length; y++) 
          for (let x = 0; x < this._TETROMINOS[this._nextTetrIndexes[i]].schema[y].length; x++) 
            if (this._TETROMINOS[this._nextTetrIndexes[i]].schema[y][x] === 1) 
              this.drawTetr((x + this._WIDTH + 1) * this._TETR_SIDE,y * this._TETR_SIDE + ((i + 1) * 4* this._TETR_SIDE),this._COLORS[this._TETROMINOS[this._nextTetrIndexes[i]].color])  
      // draw bonuses

      if (this._mode=='bonuses'){
        if (this._placed>=20 && this._level>=1) {
          ctx.fillStyle ='#ff0000';
        }else 
          ctx.fillStyle="#777777";
        ctx.fillText('Bomb',(this._WIDTH+1)*this._TETR_SIDE,30);

        if (this._level>=1 && !this._slowed && this._bomb_t){
          ctx.fillStyle='#ff7733';
        }else if (this._level>=1 && this._slowed){
          ctx.fillStyle ='#77ffff';
        }else
        ctx.fillStyle="#777777";
        ctx.fillText('Slowed',(this._WIDTH+3)*this._TETR_SIDE,30);
      }
      // print game info
      ctx.font = '26px bold Courier New';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Score: ${this._score}`, (this._WIDTH + 1) * this._TETR_SIDE, 60);
      ctx.fillText(`Level: ${this._level}`, (this._WIDTH + 1) * this._TETR_SIDE, 86);
      ctx.font = '16px Courier New';
      ctx.fillText(`Next Tetrominos`, (this._WIDTH + 1) * this._TETR_SIDE, 112);

     
      
    }
    private drawTetr(x : number, y : number, color : string) {
      this._ctx.fillStyle = color;
      this._ctx.fillRect(
        x,
        y,
        this._TETR_SIDE-1,
        this._TETR_SIDE-1
      )
    }
    private checkCollision(schema : Array<Array<number>>, offsetX : number, offsetY : number) : boolean {
      // offsetX - move left/right
      // offsetY - rotate / down
      // at first we need to check, if tetrominos doesn't off board
      let pieces = 0;
      let piecesInBoard = 0;
      for (let y = 0; y < schema.length; y++) 
        for (let x = 0; x < schema[y].length; x++) {
          if (schema[y][x]==1)
          {
            pieces++;
            const pieceX = x + this._currX + offsetX;
            if (pieceX>=0 && pieceX< this._WIDTH) piecesInBoard++;
          }
      }
      // if one of pieces off board, it's collision!
      if (piecesInBoard < pieces) return true;

      for (let y = 0; y < schema.length; y++) {
        for (let x = 0; x < schema[y].length; x++) {
          if (schema[y][x]==1)
            {
            const pieceY = y + this._currY + offsetY;
            const pieceX = x + this._currX + offsetX;
    
            if (y+this._currY > -1 &&  ((pieceY >= this._HEIGHT || pieceX < 0 || pieceX >= this._WIDTH)
                || (this._field[pieceY][pieceX] != 0 && pieceX >=0 && pieceX < this._WIDTH && pieceY >= 0 )))
             return true;
          }
        }
      }
      
      return false;
    }
    private setSolid() {
      if (this._currY<=-1) return false;
      else{
        for (let y = 0; y < this._currSchema.length; y++) {
          for (let x = 0; x < this._currSchema[y].length; x++) {
            if (this._currSchema[y][x] === 1 && y+this._currY-1>=0 && x+this._currX >=0 && x+this._currX<this._WIDTH) {
              this._field[y + this._currY - 1][x + this._currX] = this._TETROMINOS[this._currTetrIndex].color;
            }
          }
        }
        this._switched = 0;
        this._placed+=1;
        return true;
      }
    }
    private onPressKeyboard(event) {
    //  console.log(event.code);
      switch (event.code) {
        case 'ShiftLeft':
          if (this._mode=='limited' || (this._mode=='classic' && this._switched==1) || (this._mode=='bonuses' && this._switched==2)) break;   
            this.switchToNextTetr();
            this._switched +=1;
            break;
        case 'ArrowUp':
          const newSchema = TetrisGame.rotateClockwise(this._currSchema);
          if (!this.checkCollision(newSchema, 0, 0) && !this.checkCollision(newSchema, 0, 1)) {
            this._currSchema = newSchema;
          }
          break;
        case 'ArrowLeft':
          if (!this.checkCollision(this._currSchema, -1, 0)) {
            this._currX -= 1;
            this._movingTime = 0;
          }
          break;
        case 'ArrowRight':
          if (!this.checkCollision(this._currSchema, 1, 0)) {
            this._currX += 1;
          }
          break;
        case 'ArrowDown':
          if (!this.checkCollision(this._currSchema, 0, 1)) {
            this._currY += 1;
          }
          break;
        case 'Space':
          while (!this.checkCollision(this._currSchema, 0, 1)) {
            this._currY += 1;
            this._movingTime = 0;
          }
          break;
        case 'KeyR':
          if (this._gameOver)
            this.init(this._mode);
          break;
        case 'KeyQ':
          window.open("/","_self");
          break;
        case 'KeyT':
          // slowDown
          if (this._mode=='bonuses' && this._level>=1 && !this._slowed && this._bomb_t){
            this._speedTimer+=140;
            this._slowed = true;
            this._bomb_t = false;
          }
          break;
        case 'KeyB':
          if (this._mode=='bonuses' && this._level>=1 && this._placed>=20)
          { 
            this.bomb();
            this._placed = 0;
            this._bomb_t = true;
          }
          break;
      }
    }
    private switchToNextTetr(){
      let memory = this._currTetrIndex;
      this._currTetrIndex = this._nextTetrIndexes[0];
      this._nextTetrIndexes[0]=memory;
      this._currSchema = TetrisGame.copy(this._TETROMINOS[this._currTetrIndex].schema);
      
       this._currY = -this._currSchema.length + 1;
       this._currX = Math.floor((this._WIDTH / 2) - (this._currSchema[0].length / 2));
    }
    private isTetrIndexValid(index):boolean{
      return this._TETROMINOS_COUNT[index]<this._TETROMINOS_FREQ[this._mode][index] && (this._mode!='limited' 
          || (this._mode=='limited' && this._LIM_TETROMINOS_EXC[this._level>4?3:this._level-1].indexOf(this._TETROMINOS[index].name)==-1));
    }
    private tetrGenerator():number{
      // generate random number
      let newIndex = Math.floor(Math.random()*(this._TETROMINOS.length-0.1));
      // check if can generate this tetr
      let full_tetrs = 0;
                               
      while (!this.isTetrIndexValid(newIndex) && full_tetrs<this._TETROMINOS_COUNT.length) // check if this tetr is allowed 
      {     
        newIndex = (newIndex+1)%this._TETROMINOS_COUNT.length;
        full_tetrs++;
      }
      //  if all tetr is out, reset count
      if (full_tetrs==this._TETROMINOS_COUNT.length){
        for (let i = 0; i < this._TETROMINOS_COUNT.length; i++)
          this._TETROMINOS_COUNT[i] = 0;
        while (!this.isTetrIndexValid(newIndex)) newIndex =(newIndex+1)%this._TETROMINOS_COUNT.length;
      }
      // incr this tetr count
      this._TETROMINOS_COUNT[newIndex]+=1;
      //
      //console.log(this._TETROMINOS_COUNT);
      //console.log("freq: ",this._TETROMINOS_FREQ[this._mode])
      return newIndex;
    }
    private getNewTetr() {
      let newIndex : number;
      if (this._nextTetrIndexes.length === 0) {
        for(let i = 0; i < this._NEXT_QUANTITY; i++) {
          newIndex = this.tetrGenerator();
          // if (this._mode=='limited')
          // if (this._LIM_TETROMINOS_EXC[this._level>4?3:this._level-1].indexOf(this._TETROMINOS[newIndex].name)!=-1) {
          //   i--;
          //   continue;
          // }
          this._nextTetrIndexes.push(newIndex);
        }
      }
      // set current tetr
      this._currTetrIndex = this._nextTetrIndexes[0];
      this._currSchema = TetrisGame.copy(this._TETROMINOS[this._currTetrIndex].schema);
      // shift next tetr
      this._nextTetrIndexes.shift();

      // generate new tetr
      newIndex = this.tetrGenerator();
      // if (this._mode=='limited')
      //   while (this._LIM_TETROMINOS_EXC[this._level>4?3:this._level-1].indexOf(this._TETROMINOS[newIndex].name)!=-1) {
      //     newIndex = this.tetrGenerator();
      //   }
      this._nextTetrIndexes.push(newIndex);

      // rotate tetr
      for (let i = 0; i < Math.random() * 4; i++) {
        this._currSchema = TetrisGame.rotateClockwise(this._currSchema);
      }
  
      this._currY = -this._currSchema.length + 1;
      this._currX = Math.floor((this._WIDTH / 2) - (this._currSchema[0].length / 2));
    }
  
    private static fieldInit(width : number, height : number) : Array<Array<number>>{
      let newArray = [];
      for (let y = 0; y < height; y++) {
        newArray.push([]);
        for(let x = 0; x < width; x++) {
          newArray[y].push(0);
        }
      }
  
      return newArray;
    }
  
    private static copy(arr : Array<Array<number>>) : Array<Array<number>> {
      return JSON.parse(JSON.stringify(arr));
    }
  
    private static rotateClockwise(arr : Array<Array<number>>) : Array<Array<number>> {
      let transformedArray = [];
      // get new size of figure
      const M = arr.length;
      const N = arr[0].length;
      // create arrays for figure data
      for (let y = 0; y < N; y++) {
        transformedArray.push([]);
        for (let x = 0; x < M; x++) {
          transformedArray[y].push([]);
        }
      }
      // insert data
      for (let y = 0; y < M; y++) {
        for (let x = 0; x < N; x++) {
          transformedArray[x][M - 1 - y] = arr[y][x];
        }
      }
      //console.log(transformedArray);
      return transformedArray;
    }
  
    private linesEraser() {
      let completeLines = [];
      // search for lines to erase
      for (let y = this._HEIGHT - 1; y > 0; y--) {
        let TetrsInRow = 0;
        for (let x = 0; x < this._WIDTH; x++) if (this._field[y][x] !== 0) TetrsInRow++;  
        if (TetrsInRow === this._WIDTH) completeLines.push(y);
      }
      // calculate score increase
      let inc = completeLines.length<4?completeLines.length*100:500;
      this._score += inc;
      this._level_score += inc;
      // increase level for each 1000 points
      if (this._level_score>1000){
        this._level += 1;
        this._speedTimer -= 70;
        this._level_score = 0;
      }
      if (completeLines.length>0)
      console.log(completeLines);
      // erase completed lines
      let j = 0;
      while(j<completeLines.length){
        for (let y = completeLines[j]; y>0; y--){
          if (y==0) this._field[y][0]=0;
          for (let x = 0; x < this._WIDTH; x++)
            this._field[y][x]=this._field[y-1][x];
        }
        for (let i = 0; i < completeLines.length; i++)
          completeLines[i]++;
        j++;
      }

      // turn off time-slower
      if (inc>0 && this._slowed) {
        this._speedTimer-=140;
        this._slowed = !this._slowed;
      }
    }
    private bomb(){
      let completeLines = [];
      // search for lines to erase (3 random lines that have at least 1 tetrominos piece)
      for (let i = 0; i < 3; i++) {
        let is_pushed = false;
        while(!is_pushed){
          // generate random line index
          let y = Math.floor(Math.random()*(this._HEIGHT-1));
          // generate if this line already will be erased
          while (completeLines.indexOf(y)!=-1) y = Math.floor(Math.random()*(this._HEIGHT-1));

          let TetrsInRow = 0;
          for (let x = 0; x < this._WIDTH; x++) if (this._field[y][x] !== 0) TetrsInRow++;  
          if (TetrsInRow >0){
            completeLines.push(y);
            is_pushed = true;
          }  
        }
      }
      // fill lines with white color pieces and erase them by default eraser
      for (let j = 0; j < 3; j++){
        let y = completeLines[j];
        for (let x = 0; x < this._WIDTH; x++){
          this._field[y][x] = this._COLORS[8];
        }
      }
      
    }
  }
  