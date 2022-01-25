import {Sieve_Colors, best_move_jump} from "./guesser3.js"

console.log("Welcome to the console for Wordle Helper!");

class WordLine {
    constructor(game) {
        this.game = game;
        this.editable = true;
        this.div = document.createElement("div");
        this.div.className = "line";
        //Fill with tiles
        this.tiles = []
        for (let i = 0; i < 5; i++) {
            let newTile = new Tile(this)
            this.tiles.push(newTile)
            this.div.appendChild(newTile.div)
        }
        //Add Control
        // this.control = new Typewriter(this)
        // this.div.appendChild(this.control.div)
    }
    typewriter() {
        let basePrompt = "Enter a new 5 letter word.";
        let promptText = basePrompt;
        let continueAsking = true;
        while (continueAsking) {
            let newWord = window.prompt(promptText);
            if (newWord == null) {
                //Do not change anything, return
                return
            } else if (newWord.length != 5) {
                promptText = "Error: word must be 5 letters.\n" + basePrompt;
            } else if (/[^a-zA-Z]/.test(newWord)) {
                promptText = "Error: word must contain only letters.\n" + basePrompt;
            } else {
                continueAsking = false;
                //Result of user input here
                newWord = newWord.toUpperCase();
                this.setWord(newWord);
            }
        }
    }
    setWord(word) {
        word = word.toUpperCase()
        this.tiles.forEach(function (tile, index) {
            tile.setCharacter(word[index])
            tile.setColor("k");
        })
    }
    makeUneditable() {
        if (!this.editable) {
            return
        }
        this.editable = false;
        //Change colors of the tiles
        this.tiles.forEach( tile => tile.setColor());
    }
    makeEditable() {
        this.editable = true;
        //Change the colors of the tiles
        this.tiles.forEach( tile => tile.setColor());
    }
}

class Tile {
    constructor(line) {
        this.line = line;
        this.div = document.createElement("div");
        this.div.className = "tile";
        this.setColor("k")
        let changeColor = this.changeColor
        let me = this;
        this.div.onclick = function() {changeColor.apply(me)};
        this.setCharacter("?")
    }
    setCharacter(character) {
        this.character = character
        this.div.innerHTML = character
    }
    setColor(color) {
        //If a color is provided, change the color
        if (color) {
            this.color = color;
        }
        //Now set the correct color
        let rgb
        if (this.line.editable) {
            switch (this.color) {
                case "k": rgb = "lightgray"; break;
                case "g": rgb = "lightgreen"; break;
                case "y": rgb = "Khaki"; break;
            }
        } else {
            switch (this.color) {
                case "k": rgb = "darkgray"; break;
                case "g": rgb = "green"; break;
                case "y": rgb = "gold"; break;
            }
        }
        this.div.style.backgroundColor = rgb;
    }
    changeColor() {
        if (!this.line.editable) {
            //If the line is locked don't change color
            return
        }
        //Change the color
        switch (this.color) {
            case "k": this.color = "y"; break;
            case "g": this.color = "k"; break;
            case "y": this.color = "g"; break;
        }
        this.setColor()
        
    }


}

class Typewriter {
    constructor(line) {
        this.line = line;
        this.div = document.createElement("div");
        this.div.className = "control";
        this.div.onclick = function() {line.typewriter()};
        this.div.innerHTML = "&#9000;";
    }
}

class Pencil {
    constructor(line) {
        this.line = line;
        this.div = document.createElement("div");
        this.div.className = "control";
        this.div.onclick = function() {line.makeEditable()};
        this.div.innerHTML = "&#9998;";
    }
}

class GenerateLine {
    constructor(game) {
        this.game = game;
        this.div = document.createElement("div");
        this.div.className = "line generate-line";
        this.buttonDiv = document.createElement("div");
        this.buttonDiv.className = "clickButton";
        this.div.appendChild(this.buttonDiv);
        this.buttonDiv.onclick = function() {game.makeLine()};
        this.buttonDiv.innerHTML = "generate word";
    }
}

class Game {
    constructor(mainDiv) {
        this.mainDiv = mainDiv;
        //Create space for making lines
        this.lines = []
        this.wordsDiv = document.createElement("div");
        this.mainDiv.appendChild(this.wordsDiv);
        //Space for the generate words button
        this.generate = new GenerateLine(this);
        this.mainDiv.appendChild(this.generate.div);
        //Pull the options buttons
        let me = this;
        this.refresh_button = document.getElementById("refresh-button");
        this.refresh_button.onclick = function(){me.reload()};
        this.clear_button = document.getElementById("clear-button");
        this.clear_button.onclick = function(){me.clearLine()};
        this.edit_button = document.getElementById("edit-button");
        this.edit_button.onclick = function(){me.lines.at(-1).typewriter()};
        //Generate the first word
        this.makeBlankLine();
        this.lines[0].setWord("roate"); //soare
    }
    reload() {
        location.reload();
    }
    makeLine() {
        let word = this.calculate_line()
        this.makeBlankLine()
        // console.log(word)
        this.lines[this.lines.length-1].setWord(word)
    }
    clearLine() {
        //Delete the most recent line from the screen
        if (this.lines.length > 1) {
            this.wordsDiv.removeChild(this.lines.at(-1).div)
            this.lines.pop()
            this.lines.at(-1).makeEditable()
        } else {
            this.lines.at(-1).setWord("?????")
        }
    }
    calculate_line() {
        //Get words and clues
        let words_with_clues = this.get_words_and_clues()
        let sieves = []
        for (let word in words_with_clues) {
            sieves.push(new Sieve_Colors(word, words_with_clues[word]))
        }
        //Calculate the next move
        let next_word = best_move_jump(sieves)
        return next_word
    }
    makeBlankLine() {
        //Make the old lines no longer editable
        this.lines.forEach(line => line.makeUneditable())
        //Add the new line
        let newLine = new WordLine(this);
        this.lines.push(newLine);
        this.wordsDiv.appendChild(newLine.div);
    }
    get_words_and_clues() {
        let words_with_clues = {}
        this.lines.forEach(line => {
            let word = ""
            let clues = ""
            line.tiles.forEach( tile => {
                word = word + tile.character;
                clues = clues + tile.color;
            })
            word =word.toLowerCase()
            words_with_clues[word] = clues
        })
        return words_with_clues
    }
}

let mainDiv = document.getElementById("main_div");
let game = new Game(mainDiv);

// a = new GenerateLine(game)
// document.body.appendChild(a.div, mainDiv)

// let mainDiv = document.getElementById("main")
// let newLine = new WordLine(this.game)
// document.body.appendChild(newLine.div, mainDiv)