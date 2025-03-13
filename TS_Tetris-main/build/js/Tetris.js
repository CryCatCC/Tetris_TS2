var TetrisGame = /** @class */ (function () {
    function TetrisGame(selector) {
        this._COLORS = [
            'black', 'orange', 'blue', 'yellow', 'cyan', 'red', 'green', 'magenta', 'white'
        ];
        this._TETROMINOS = [
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
        this._TETROMINOS_FREQ = {
            //         L J O I Z S T
            'classic': [3, 3, 2, 1, 3, 3, 2],
            'bonuses': [3, 3, 3, 2, 2, 2, 3],
            'limited': [3, 3, 2, 1, 3, 3, 2]
        };
        this._TETROMINOS_COUNT = [
            0, 0, 0, 0, 0, 0, 0
        ];
        this._LIM_TETROMINOS_EXC = [
            ["I"], ["I", "O"], ["O", "J", "L"], ["I", "O", "J", "L"]
        ];
        // field characteristics
        this._WIDTH = 10;
        this._HEIGHT = 20;
        this._TETR_SIDE = 32;
        this._field = [];
        // current tetrominos
        this._currX = 0;
        this._currY = 0;
        // next tetrominos
        this._NEXT_QUANTITY = 4;
        this._nextTetrIndexes = [];
        // frame Time
        this._timeStart = 0;
        this._timeFinish = 0;
        this._movingTime = 0;
        this._speedTimer = 500;
        this._score = 0;
        this._level_score = 0;
        this._level = 1;
        this._placed = 0;
        this._canvas = document.querySelector(selector);
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
    TetrisGame.prototype.init = function (mode) {
        window.addEventListener('keydown', this.onPressKeyboard, false);
        // reset every game variable
        this._field = TetrisGame.fieldInit(this._WIDTH, this._HEIGHT);
        this._gameOver = false;
        this._isRunning = true;
        this._score = 0;
        this._level_score = 0;
        this._level = 1;
        this._speedTimer = 500;
        this._switched = 0;
        this._placed = 0;
        this._bomb_t = false;
        this._TETROMINOS_COUNT = [
            0, 0, 0, 0, 0, 0, 0
        ];
        // set mode prop
        this._mode = mode;
        if (this._mode == 'limited')
            this._NEXT_QUANTITY = 2;
        // start new game
        this.getNewTetr();
        this.update();
    };
    TetrisGame.prototype.stop = function () {
        this._isRunning = false;
    };
    TetrisGame.prototype.run = function () {
        this._isRunning = true;
        this.update();
    };
    TetrisGame.prototype.update = function () {
        if (!this._gameOver && this._isRunning) {
            this._timeStart = performance.now();
            // calculate moving time
            this._movingTime += this._timeStart - this._timeFinish; // timer
            if (this._movingTime > this._speedTimer) {
                this._currY += 1;
                this._movingTime = 0;
            }
            // check collision. If collision detected and can't set tetrominos solid - game Over!
            if (this.checkCollision(this._currSchema, 0, 0)) {
                if (!this.setSolid())
                    this._gameOver = true;
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
        else if (this._gameOver) {
            // game over!
            var ctx = this._ctx;
            ctx.fillStyle = '#003b1f';
            ctx.fillRect(145, 200, 250, 120);
            ctx.font = '26px bold Courier New';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('GameOver!', 180, 238);
            ctx.fillText("Score: ".concat(this._score), 180, 264);
            ctx.fillText("Q - quit, R - retry", 180, 290);
            // remember score
            localStorage.setItem(this._mode, JSON.stringify(this._score));
        }
    };
    TetrisGame.prototype.render = function () {
        var ctx = this._ctx;
        var canvas = this._canvas;
        // clear all game window
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000b1f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // field draw
        for (var y = 0; y < this._HEIGHT; y++) {
            for (var x = 0; x < this._WIDTH; x++) {
                ctx.fillRect(x * this._TETR_SIDE, y * this._TETR_SIDE, this._TETR_SIDE - 1, this._TETR_SIDE - 1);
                this.drawTetr(x * this._TETR_SIDE, y * this._TETR_SIDE, this._COLORS[this._field[y][x]]);
            }
        }
        // current tetrominos draw
        for (var y = 0; y < this._currSchema.length; y++) {
            for (var x = 0; x < this._currSchema[y].length; x++) {
                if (this._currSchema[y][x] === 1) {
                    this.drawTetr((x + this._currX) * this._TETR_SIDE, (y + this._currY) * this._TETR_SIDE, this._COLORS[this._TETROMINOS[this._currTetrIndex].color]);
                }
            }
        }
        // draw next tetrominos
        for (var i = 0; i < this._nextTetrIndexes.length; i++)
            for (var y = 0; y < this._TETROMINOS[this._nextTetrIndexes[i]].schema.length; y++)
                for (var x = 0; x < this._TETROMINOS[this._nextTetrIndexes[i]].schema[y].length; x++)
                    if (this._TETROMINOS[this._nextTetrIndexes[i]].schema[y][x] === 1)
                        this.drawTetr((x + this._WIDTH + 1) * this._TETR_SIDE, y * this._TETR_SIDE + ((i + 1) * 4 * this._TETR_SIDE), this._COLORS[this._TETROMINOS[this._nextTetrIndexes[i]].color]);
        // draw bonuses
        if (this._mode == 'bonuses') {
            if (this._placed >= 20 && this._level >= 1) {
                ctx.fillStyle = '#ff0000';
            }
            else
                ctx.fillStyle = "#777777";
            ctx.fillText('Bomb', (this._WIDTH + 1) * this._TETR_SIDE, 30);
            if (this._level >= 1 && !this._slowed && this._bomb_t) {
                ctx.fillStyle = '#ff7733';
            }
            else if (this._level >= 1 && this._slowed) {
                ctx.fillStyle = '#77ffff';
            }
            else
                ctx.fillStyle = "#777777";
            ctx.fillText('Slowed', (this._WIDTH + 3) * this._TETR_SIDE, 30);
        }
        // print game info
        ctx.font = '26px bold Courier New';
        ctx.fillStyle = '#ffffff';
        ctx.fillText("Score: ".concat(this._score), (this._WIDTH + 1) * this._TETR_SIDE, 60);
        ctx.fillText("Level: ".concat(this._level), (this._WIDTH + 1) * this._TETR_SIDE, 86);
        ctx.font = '16px Courier New';
        ctx.fillText("Next Tetrominos", (this._WIDTH + 1) * this._TETR_SIDE, 112);
    };
    TetrisGame.prototype.drawTetr = function (x, y, color) {
        this._ctx.fillStyle = color;
        this._ctx.fillRect(x, y, this._TETR_SIDE - 1, this._TETR_SIDE - 1);
    };
    TetrisGame.prototype.checkCollision = function (schema, offsetX, offsetY) {
        // offsetX - move left/right
        // offsetY - rotate / down
        // at first we need to check, if tetrominos doesn't off board
        var pieces = 0;
        var piecesInBoard = 0;
        for (var y = 0; y < schema.length; y++)
            for (var x = 0; x < schema[y].length; x++) {
                if (schema[y][x] == 1) {
                    pieces++;
                    var pieceX = x + this._currX + offsetX;
                    if (pieceX >= 0 && pieceX < this._WIDTH)
                        piecesInBoard++;
                }
            }
        // if one of pieces off board, it's collision!
        if (piecesInBoard < pieces)
            return true;
        for (var y = 0; y < schema.length; y++) {
            for (var x = 0; x < schema[y].length; x++) {
                if (schema[y][x] == 1) {
                    var pieceY = y + this._currY + offsetY;
                    var pieceX = x + this._currX + offsetX;
                    if (y + this._currY > -1 && ((pieceY >= this._HEIGHT || pieceX < 0 || pieceX >= this._WIDTH)
                        || (this._field[pieceY][pieceX] != 0 && pieceX >= 0 && pieceX < this._WIDTH && pieceY >= 0)))
                        return true;
                }
            }
        }
        return false;
    };
    TetrisGame.prototype.setSolid = function () {
        if (this._currY <= -1)
            return false;
        else {
            for (var y = 0; y < this._currSchema.length; y++) {
                for (var x = 0; x < this._currSchema[y].length; x++) {
                    if (this._currSchema[y][x] === 1 && y + this._currY - 1 >= 0 && x + this._currX >= 0 && x + this._currX < this._WIDTH) {
                        this._field[y + this._currY - 1][x + this._currX] = this._TETROMINOS[this._currTetrIndex].color;
                    }
                }
            }
            this._switched = 0;
            this._placed += 1;
            return true;
        }
    };
    TetrisGame.prototype.onPressKeyboard = function (event) {
        //  console.log(event.code);
        switch (event.code) {
            case 'ShiftLeft':
                if (this._mode == 'limited' || (this._mode == 'classic' && this._switched == 1) || (this._mode == 'bonuses' && this._switched == 2))
                    break;
                this.switchToNextTetr();
                this._switched += 1;
                break;
            case 'ArrowUp':
                var newSchema = TetrisGame.rotateClockwise(this._currSchema);
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
                window.open("/", "_self");
                break;
            case 'KeyT':
                // slowDown
                if (this._mode == 'bonuses' && this._level >= 1 && !this._slowed && this._bomb_t) {
                    this._speedTimer += 140;
                    this._slowed = true;
                    this._bomb_t = false;
                }
                break;
            case 'KeyB':
                if (this._mode == 'bonuses' && this._level >= 1 && this._placed >= 20) {
                    this.bomb();
                    this._placed = 0;
                    this._bomb_t = true;
                }
                break;
        }
    };
    TetrisGame.prototype.switchToNextTetr = function () {
        var memory = this._currTetrIndex;
        this._currTetrIndex = this._nextTetrIndexes[0];
        this._nextTetrIndexes[0] = memory;
        this._currSchema = TetrisGame.copy(this._TETROMINOS[this._currTetrIndex].schema);
        this._currY = -this._currSchema.length + 1;
        this._currX = Math.floor((this._WIDTH / 2) - (this._currSchema[0].length / 2));
    };
    TetrisGame.prototype.isTetrIndexValid = function (index) {
        return this._TETROMINOS_COUNT[index] < this._TETROMINOS_FREQ[this._mode][index] && (this._mode != 'limited'
            || (this._mode == 'limited' && this._LIM_TETROMINOS_EXC[this._level > 4 ? 3 : this._level - 1].indexOf(this._TETROMINOS[index].name) == -1));
    };
    TetrisGame.prototype.tetrGenerator = function () {
        // generate random number
        var newIndex = Math.floor(Math.random() * (this._TETROMINOS.length - 0.1));
        // check if can generate this tetr
        var full_tetrs = 0;
        while (!this.isTetrIndexValid(newIndex) && full_tetrs < this._TETROMINOS_COUNT.length) // check if this tetr is allowed 
         {
            newIndex = (newIndex + 1) % this._TETROMINOS_COUNT.length;
            full_tetrs++;
        }
        //  if all tetr is out, reset count
        if (full_tetrs == this._TETROMINOS_COUNT.length) {
            for (var i = 0; i < this._TETROMINOS_COUNT.length; i++)
                this._TETROMINOS_COUNT[i] = 0;
            while (!this.isTetrIndexValid(newIndex))
                newIndex = (newIndex + 1) % this._TETROMINOS_COUNT.length;
        }
        // incr this tetr count
        this._TETROMINOS_COUNT[newIndex] += 1;
        //
        //console.log(this._TETROMINOS_COUNT);
        //console.log("freq: ",this._TETROMINOS_FREQ[this._mode])
        return newIndex;
    };
    TetrisGame.prototype.getNewTetr = function () {
        var newIndex;
        if (this._nextTetrIndexes.length === 0) {
            for (var i = 0; i < this._NEXT_QUANTITY; i++) {
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
        for (var i = 0; i < Math.random() * 4; i++) {
            this._currSchema = TetrisGame.rotateClockwise(this._currSchema);
        }
        this._currY = -this._currSchema.length + 1;
        this._currX = Math.floor((this._WIDTH / 2) - (this._currSchema[0].length / 2));
    };
    TetrisGame.fieldInit = function (width, height) {
        var newArray = [];
        for (var y = 0; y < height; y++) {
            newArray.push([]);
            for (var x = 0; x < width; x++) {
                newArray[y].push(0);
            }
        }
        return newArray;
    };
    TetrisGame.copy = function (arr) {
        return JSON.parse(JSON.stringify(arr));
    };
    TetrisGame.rotateClockwise = function (arr) {
        var transformedArray = [];
        // get new size of figure
        var M = arr.length;
        var N = arr[0].length;
        // create arrays for figure data
        for (var y = 0; y < N; y++) {
            transformedArray.push([]);
            for (var x = 0; x < M; x++) {
                transformedArray[y].push([]);
            }
        }
        // insert data
        for (var y = 0; y < M; y++) {
            for (var x = 0; x < N; x++) {
                transformedArray[x][M - 1 - y] = arr[y][x];
            }
        }
        //console.log(transformedArray);
        return transformedArray;
    };
    TetrisGame.prototype.linesEraser = function () {
        var completeLines = [];
        // search for lines to erase
        for (var y = this._HEIGHT - 1; y > 0; y--) {
            var TetrsInRow = 0;
            for (var x = 0; x < this._WIDTH; x++)
                if (this._field[y][x] !== 0)
                    TetrsInRow++;
            if (TetrsInRow === this._WIDTH)
                completeLines.push(y);
        }
        // calculate score increase
        var inc = completeLines.length < 4 ? completeLines.length * 100 : 500;
        this._score += inc;
        this._level_score += inc;
        // increase level for each 1000 points
        if (this._level_score > 1000) {
            this._level += 1;
            this._speedTimer -= 70;
            this._level_score = 0;
        }
        if (completeLines.length > 0)
            console.log(completeLines);
        // erase completed lines
        var j = 0;
        while (j < completeLines.length) {
            for (var y = completeLines[j]; y > 0; y--) {
                if (y == 0)
                    this._field[y][0] = 0;
                for (var x = 0; x < this._WIDTH; x++)
                    this._field[y][x] = this._field[y - 1][x];
            }
            for (var i = 0; i < completeLines.length; i++)
                completeLines[i]++;
            j++;
        }
        // turn off time-slower
        if (inc > 0 && this._slowed) {
            this._speedTimer -= 140;
            this._slowed = !this._slowed;
        }
    };
    TetrisGame.prototype.bomb = function () {
        var completeLines = [];
        // search for lines to erase (3 random lines that have at least 1 tetrominos piece)
        for (var i = 0; i < 3; i++) {
            var is_pushed = false;
            while (!is_pushed) {
                // generate random line index
                var y = Math.floor(Math.random() * (this._HEIGHT - 1));
                // generate if this line already will be erased
                while (completeLines.indexOf(y) != -1)
                    y = Math.floor(Math.random() * (this._HEIGHT - 1));
                var TetrsInRow = 0;
                for (var x = 0; x < this._WIDTH; x++)
                    if (this._field[y][x] !== 0)
                        TetrsInRow++;
                if (TetrsInRow > 0) {
                    completeLines.push(y);
                    is_pushed = true;
                }
            }
        }
        // fill lines with white color pieces and erase them by default eraser
        for (var j = 0; j < 3; j++) {
            var y = completeLines[j];
            for (var x = 0; x < this._WIDTH; x++) {
                this._field[y][x] = this._COLORS[8];
            }
        }
    };
    return TetrisGame;
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGV0cmlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL1RldHJpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtJQXFHSSxvQkFBbUIsUUFBaUI7UUFsRzVCLFlBQU8sR0FBRztZQUNoQixPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU87U0FDaEYsQ0FBQztRQUVNLGdCQUFXLEdBQUc7WUFDcEI7Z0JBQ0UsSUFBSSxFQUFFLEdBQUc7Z0JBQ1QsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsTUFBTSxFQUFFO29CQUNOLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ1QsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDVjthQUNGLEVBQUU7Z0JBQ0QsSUFBSSxFQUFFLEdBQUc7Z0JBQ1QsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsTUFBTSxFQUFFO29CQUNOLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ1QsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDVjthQUNGLEVBQUU7Z0JBQ0QsSUFBSSxFQUFFLEdBQUc7Z0JBQ1QsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsTUFBTSxFQUFFO29CQUNOLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDTixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ1A7YUFDRixFQUFFO2dCQUNELElBQUksRUFBRSxHQUFHO2dCQUNULEtBQUssRUFBRSxDQUFDO2dCQUNSLE1BQU0sRUFBRTtvQkFDTixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDYjthQUNGLEVBQUU7Z0JBQ0QsSUFBSSxFQUFFLEdBQUc7Z0JBQ1QsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsTUFBTSxFQUFF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