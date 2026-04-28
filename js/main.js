/**
 * Marco Carnegie
 * 2026-03-11
 * Main Javascript file for canvas and dom manipulation
 */


window.addEventListener("load", () => {
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");
    const btnstr = document.getElementById("btn-start")
    const btne = document.getElementById("btn-easy")
    const btnm = document.getElementById("btn-medium")
    const btnh = document.getElementById("btn-hard")
    const info = document.getElementById("info")
    const gameStuff = document.getElementById("gameStuff")
    const btnplyagn = document.getElementById("btn-plyagn")
    const btnmain = document.getElementById("btn-mainmenu")
    const rounds = document.getElementById("rounds")
    const bombs = document.getElementById("bombs")

    /**
     * 
     * Changes the Canvas size based on screen size, Returns new size of canvas
     */
    function getCanvasSize() {
        const screenSize = Math.min(window.innerWidth, window.innerHeight);
        return screenSize < 600 ? 480 : 600;
    }
    canvas.height = getCanvasSize();
    canvas.width = getCanvasSize();


    let gameState;

    if (localStorage.getItem("choicesMade") != null) {
        localStorage.setItem("choicesMade", localStorage.getItem("choicesMade"))

    } else {
        localStorage.setItem("choicesMade", false)
    }

    if (localStorage.getItem("rounds") != null) {
        localStorage.setItem("rounds", localStorage.getItem("rounds"))

    } else {
        localStorage.setItem("rounds", 0)
    }

    if (localStorage.getItem("choicesMade") != null) {

        gameState = JSON.parse(localStorage.getItem("game"))

    }


    let squares;
    let gridx;
    let gridy;
    let squareSize;
    let bombsNeeded;
    let isFlagging = false;
    let mousex;
    let mousey;
    let gameOn = false;

    /*each sprite is 64x64 */
    const img = new Image();
    img.src = './images/spritesheet.png';
    const title = new Image();
    title.src = './images/title.png'
    const cover = {
        x: (canvas.width - 460) / 2,
        y: (canvas.height - 400) / 2,
        w: 460,
        h: 215,
        draw() {
            ctx.fillStyle = "rgb(212, 212, 212)"
            ctx.fillRect(this.x, this.y, this.w, this.h)
        }
    }


    class Square {
        constructor(x, y, w, h, isBomb, isVisible) {
            this.x = x
            this.y = y
            this.w = w
            this.h = h
            this.isBomb = isBomb
            this.isVisible = isVisible
            this.minesAround;
            this.beenChecked = false;
            this.beenClicked = false;
            this.flaged = false;
            this.misflaged = false



        }


    }
    /**
     * 
     * Draws a square based on if it is flaged,misflaged,visible,bomb,bomb that has been clicked and visible
     * and/or number of bombs around the square
     * 
     * The function takes in an object of type square
     */
    function draw(s) {
        if (s.flaged && !s.isVisible) {
            if (s.misflaged) {
                ctx.drawImage(img, 192, 0, 64, 64, s.x, s.y, s.w, s.h)
            } else {
                ctx.drawImage(img, 128, 0, 64, 64, s.x, s.y, s.w, s.h)
            }

        } else if (!s.isVisible) {

            ctx.drawImage(img, 0, 64, 64, 64, s.x, s.y, s.w, s.h)

        } else if (s.isBomb && s.isVisible && s.beenClicked) {
            ctx.drawImage(img, 64, 0, 64, 64, s.x, s.y, s.w, s.h)

        } else if (s.isBomb && s.isVisible) {
            ctx.drawImage(img, 0, 0, 64, 64, s.x, s.y, s.w, s.h)
        } else {
            const numberSprites = [
                { sx: 64, sy: 64 },
                { sx: 128, sy: 64 },
                { sx: 192, sy: 64 },
                { sx: 0, sy: 128 },
                { sx: 64, sy: 128 },
                { sx: 128, sy: 128 },
                { sx: 192, sy: 128 },
                { sx: 0, sy: 192 },
                { sx: 64, sy: 192 },

            ]
            let sprite = numberSprites[s.minesAround];
            ctx.drawImage(img, sprite.sx, sprite.sy, 64, 64, s.x, s.y, s.w, s.h)
        }
    }




    /**
     * Event listener to see if you click anywhere on the canvas and if you did, what square you hit and how it
     * should be changed accordingly.
     * Takes in the click event
     */
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        mousex = e.clientX - rect.left;
        mousey = e.clientY - rect.top;

        let col = Math.floor(mousex / squareSize)
        let row = Math.floor(mousey / squareSize)

        if (col >= 0 && col < gridx && row >= 0 && row < gridy && localStorage.getItem("choicesMade") == "true") {

            if (!isFlagging) {
                if (!squares[row][col].flaged) {
                    squares[row][col].isVisible = true;
                    if (squares[row][col].isBomb) {
                        squares[row][col].beenClicked = true;
                        makeAllBombsVisible()

                        setTimeout(() => { gameLost() }, 1500)
                    }

                    clearEmpties(col, row)
                }

            } else {
                if (!squares[row][col].flaged) {
                    squares[row][col].flaged = true
                    bombs.innerHTML = parseInt(bombs.innerHTML) - 1
                } else {
                    squares[row][col].flaged = false
                    bombs.innerHTML = parseInt(bombs.innerHTML) + 1
                }

            }
            gameState.curSquares = squares
            localStorage.setItem("game", JSON.stringify(gameState))

        }
        if (localStorage.getItem("choicesMade") == "true"&&checkWin()) {
            gameWon();
        }




    });


    /**
     * Makes the grid of squares based on how many squares you want in the x and y direction
     * and based on how many pixels you want each square to be (Ex: 4*4 pixels)
     * 
     * Paramaters are ints for grid size in x, grid size in y, size of square in pixels^2
     */
    function makeSquares(gridx, gridy, squareSize) {

        canvas.height = gridy * squareSize
        canvas.width = gridx * squareSize

        let sh = squareSize
        let sw = squareSize


        for (let y = 0; y < gridy; y++) {
            let row = []
            for (let x = 0; x < gridx; x++) {
                row.push(new Square(x * (sw), y * (sh), sw, sh, false, false))
            }
            squares.push(row)
        }

        let z = 0
        while (z < bombsNeeded) {
            ranCol = Math.floor(Math.random() * gridx)
            ranRow = Math.floor(Math.random() * gridy)
            if (!squares[ranRow][ranCol].isBomb) {
                squares[ranRow][ranCol].isBomb = true
                z++
            }
        }

        bombs.innerHTML = bombsNeeded
        for (let i = 0; i < squares.length; i++) {
            for (let j = 0; j < squares[i].length; j++) {
                checkMinesAround(i, j, squares[i][j])
            }
        }
    }

    /**
     * Draws every square in grid
     */
    function drawSquares() {
        for (let i = 0; i < squares.length; i++) {
            for (let j = 0; j < squares[i].length; j++) {
                draw(squares[i][j])
            }
        }
    }


    /**
     * Checks how many mines are around an individual square
     * 
     * Params are ints of the row and col of the square (its position) 
     * and the square object (to assign a number)
     * 
     */
    function checkMinesAround(row, col, square) {

        let dx = [-1, -1, -1, 0, 0, 1, 1, 1]
        let dy = [-1, 0, 1, -1, 1, -1, 0, 1]
        let count = 0;

        for (let x = 0; x < 8; x++) {
            let newCol = col + dy[x]
            let newRow = row + dx[x]

            if (newRow < 0 || newCol < 0 || newCol >= gridx || newRow >= gridy) {
                continue;
            }

            if (squares[newRow][newCol].isBomb) {
                count++
            }

        }

        square.minesAround = count
    }

    /**
     * Recursive function to make squares that dont have any bombs in them visible
     * stopping when it sees a bomb or a square that has a number
     * 
     * Takes in ints of row and col of the grid of squares
     * 
     */
    function clearEmpties(col, row) {
        let dx = [-1, -1, -1, 0, 0, 1, 1, 1]
        let dy = [-1, 0, 1, -1, 1, -1, 0, 1]
        let w = squares[row][col]
        if (w.beenChecked || w.isBomb || w.flaged) return;
        w.isVisible = true
        w.beenChecked = true
        if (w.minesAround > 0) return;
        for (let x = 0; x < 8; x++) {
            let newCol = col + dy[x]
            let newRow = row + dx[x]

            if (newRow < 0 || newCol < 0 || newCol >= gridx || newRow >= gridy) {
                continue;
            } else {
                clearEmpties(newCol, newRow)
            }
        }


    }



    /**
     * Changes between flagging and non-flagging mdoe
     */
    document.getElementById("flag").addEventListener("click", () => {
        let c = document.getElementById("flag");
        if (c.style.backgroundColor == "white") {
            c.style.backgroundColor = "red"
            isFlagging = true
        } else {
            c.style.backgroundColor = "white"
            isFlagging = false
        }
    })

    /**
     * Makes all unmarked bombs visible and makes mismarked bombs shown
     */
    function makeAllBombsVisible() {
        for (let i = 0; i < squares.length; i++) {
            for (let j = 0; j < squares[i].length; j++) {
                if (squares[i][j].isBomb && !squares[i][j].flaged) {
                    squares[i][j].isVisible = true
                } else if (!squares[i][j].isBomb && squares[i][j].flaged) {
                    squares[i][j].misflaged = true
                }


            }
        }
    }
    /**
     * 
     * Checks to see if the player has won the game
     * Returns a boolean based on yes or no
     */
    function checkWin() {
        let hidden = 0;
        for (let i = 0; i < squares.length; i++) {
            for (let j = 0; j < squares[i].length; j++) {
                if (!squares[i][j].isVisible) {
                    hidden++
                }

            }
        }

        if (hidden == bombsNeeded) {
            return true
        } else {
            return false
        }
    }

    /**
     * If the player loses the game, resets the canvas to proper size
     * Changes booleans/values in local storage, and brings up the play again menu
     */
    function gameLost() {

        canvas.width = getCanvasSize();
        canvas.height = getCanvasSize();
        localStorage.setItem("choicesMade", false)
        info.classList.remove("hidden")
        info.innerText = `YOU DIED, you completed ${localStorage.getItem("rounds")} rounds.`
        gameState.gameOn = false
        gameStuff.classList.add("hidden")
        btnplyagn.classList.remove("hidden")
        btnmain.classList.remove("hidden")
        localStorage.setItem("rounds", 0)
        rounds.innerText = localStorage.getItem("rounds")
        localStorage.removeItem("game")
    }
    /**
     * If the player wins the game, resets the canvas to proper size
     * Changes booleans/values in local storage, and allows the player to continue
     * their streak
     */
    function gameWon() {
        canvas.width = getCanvasSize();
        canvas.height = getCanvasSize();
        info.classList.remove("hidden")
        localStorage.setItem("choicesMade", false)
        localStorage.setItem("rounds", parseInt(localStorage.getItem("rounds")) + 1)
        info.innerText = `Congrats, you beat this round! Current Rounds Won: ${localStorage.getItem("rounds")}`
        btnplyagn.classList.remove("hidden")
        btnmain.classList.remove("hidden")
        gameStuff.classList.add("hidden")
        localStorage.removeItem("game")
        gameState.gameOn = false
        rounds.innerText = localStorage.getItem("rounds")
    }

    /**
     * Main Menu Animation
     */
    function titleCard() {
        ctx.drawImage(title, (canvas.width - 460) / 2, (canvas.height - 400) / 2, 460, 215)
        cover.draw()
        cover.w -= 6
    }

    /**
     * Function that continuously draws the squares or displays the titlecard if not in a game
     */
    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!gameOn && JSON.parse(localStorage.getItem("game")) == null && info.classList.contains("hidden")) {
            titleCard()
            rounds.innerText = localStorage.getItem("rounds")
        }
        if (localStorage.getItem("choicesMade") == "true") {
            drawSquares();
            rounds.innerText = localStorage.getItem("rounds")
        }



    }

    /**
     * Assigns variables based on the current game state
     */
    function assignVars() {
        squares = gameState.curSquares;
        gridx = gameState.curGridx;
        gridy = gameState.curGridy;
        squareSize = gameState.cursquareSize;
        bombsNeeded = gameState.curNumBombs;
        gameOn = gameState.gameOn
    }

    /**
     * Hides menu buttons and displays game info while playing game
     */
    function makeButtonsHidden() {
        btnstr.classList.add("hidden")
        btne.classList.add("hidden")
        btnm.classList.add("hidden")
        btnh.classList.add("hidden")
        info.classList.add("hidden")
        gameStuff.classList.remove("hidden")
    }

    if (gameState != null && gameState.curSquares.length == 0) {
        makeSquares(gridx, gridy, squareSize);

    } else if (gameState != null) {
        assignVars()
        makeButtonsHidden()
        canvas.height = gridy * squareSize
        canvas.width = gridx * squareSize
        document.getElementById("bombs").innerHTML = bombsNeeded
        localStorage.setItem("game", JSON.stringify(gameState))
    }



    img.onload = () => {
        let int = setInterval(gameLoop, 10)
    };

    /**
     * Creates a new game based on current gamestate
     */
    function addGameToVars() {
        assignVars()
        makeSquares(gridx, gridy, squareSize);
        makeButtonsHidden()
        localStorage.setItem("choicesMade", true)
        localStorage.setItem("game", JSON.stringify(gameState))
    }

    btnstr.addEventListener("click", () => {

        btnstr.classList.add("hidden")
        btne.classList.remove("hidden")
        btnm.classList.remove("hidden")
        btnh.classList.remove("hidden")
        info.classList.remove("hidden")


    })

    btne.addEventListener("mouseover", () => {
        info.innerText = "Easy Difficulty: 9x9 Grid with 10 Bombs"
    })
    btnm.addEventListener("mouseover", () => {
        info.innerText = "Medium Difficulty: 16x16 Grid with 40 Bombs"
    })
    btnh.addEventListener("mouseover", () => {
        info.innerText = "Hard Difficulty: 30x16 Grid with 99 Bombs"
    })

    btne.addEventListener("click", () => {

        gameState = {
            curSquares: [],
            curGridx: 9,
            curGridy: 9,
            cursquareSize: Math.floor(canvas.width / (9)),
            curNumBombs: 10,//10
            gameOn: true
        }
        addGameToVars()
    })
    btnm.addEventListener("click", () => {

        gameState = {
            curSquares: [],
            curGridx: 16,
            curGridy: 16,
            cursquareSize: Math.floor(canvas.width / (16)),
            curNumBombs: 40,//40
            gameOn: true
        }
        addGameToVars()
    })
    btnh.addEventListener("click", () => {

        gameState = {
            curSquares: [],
            curGridx: 30,
            curGridy: 16,
            cursquareSize: Math.floor(canvas.width / (30)),
            curNumBombs: 99,//99
            gameOn: true
        }
        addGameToVars()
    })

    btnplyagn.addEventListener("click", () => {
        btne.classList.remove("hidden")
        btnm.classList.remove("hidden")
        btnh.classList.remove("hidden")
        info.classList.remove("hidden")
        btnplyagn.classList.add("hidden")
        btnmain.classList.add("hidden")
        gameState.gameOn = true
        info.innerText = "Hover Over a Difficulty!"

    })

    btnmain.addEventListener("click", () => {
        localStorage.removeItem("choicesMade")
        window.location.reload()
    })

    document.getElementById("reset").addEventListener("click", () => {
        localStorage.clear()
        window.location.reload()
    })

})