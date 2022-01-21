//Import a very big engligh word list
//Save a file of only those words with 5 letters
// import fs from "fs"
import { w_valid, w_solutions } from "./words.js"
let wo_valid = w_valid
let wo_solutions = w_solutions

let url = "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt";

//put all words into the valid words list
wo_valid.push(...wo_solutions);
//Pre-save word counts
let wo_counts = {}
wo_valid.forEach(word => {
    wo_counts[word] = count_letters(word)
})
//console.log(word_counts)

function count_letters(word) {
    let unique_letters = new Set(word)
    let counts = {}
    unique_letters.forEach(letter => {
        counts[letter] = word.split(letter).length - 1
    })
    return counts
}

export class Clues {
    constructor() {
        //Letter must be in these positions
        this.greens = [undefined, undefined, undefined, undefined, undefined];
        //Letter must not be in these positions
        this.reds = [new Set(), new Set(), new Set(), new Set(), new Set()];
        //1-5: at least that many occurances
        //10-15: exactly that many occurances minus 10
        this.yellows = {}
    };

    words_valid = wo_valid;
    words_solutions = wo_solutions;
    word_counts = wo_counts;

    addClue(word, colors) {
        //Next calculate the yellows & blacks - things that we need at least 1 more of
        for (let i = 0; i < 5; i++) {
            //Count the number of matches
            let match_green_yellow = 0;
            let match_black = 0;
            for (let j = 0; j < 5; j++) {
                if (word[j] == word[i]) {
                    if (colors[j] == "k") {
                        match_black += 1;
                    } else {
                        match_green_yellow += 1
                    }
                }
            }
            // console.log(word, colors, i, "green_yellow", match_green_yellow, "black", match_black)
            //If a yellow does not exist for it yet, create the yellow
            if (!(word[i] in this.yellows)) {
                this.yellows[word[i]] = 0;
            }
            if (match_black > 0) {
                //Letter occurs exactly this number of times plus 10
                this.yellows[word[i]] = 10 + match_green_yellow
            } else if (match_green_yellow > this.yellows[word[i]]) {
                //Letter occurs at lest this number of times
                this.yellows[[word[i]]] = match_green_yellow
            }
            //Add to the greens list
            if (colors[i] == "g") {
                this.greens[i] = word[i]
            } else {
                //Letter not allowed in this particular position
                this.reds[i].add(word[i])
            }
        }
    }
    generateClue(word, solution) {
        let clues = [undefined, undefined, undefined, undefined, undefined]
        for (let i = 0; i < 5; i++) {
            if (word[i] == solution[i]) {
                //Occurs at the correct position
                clues[i] = "g"
                solution = solution.substr(0, i) + "?" + solution.substr(i + 1)
            }
        }
        for (let i = 0; i < 5; i++) {
            if (clues[i] == "g") {
                //skip greens
                continue
            }
            let count = this.countOccurances(solution, word[i])
            if (count == 0) {
                //No more occurances in the string
                clues[i] = "k"
            } else {
                //More occurances in the string, but not in this position
                clues[i] = "y"
                solution = solution.substr(0, i) + "?" + solution.substr(i + 1)
            }
        }
        return clues
    }
    generateAndAddClue(word, solution) {
        let clue = this.generateClue(word, solution)
        this.addClue(word, clue)
    }
    addGuess() {

    }
    checkFit(word, verbose=false) {
        let word_count = this.word_counts[word]
        if (word_count === undefined) {
            word_count = count_letters(word)
            console.log("Manually counting letters.", word, word_count)
        }
        //Checks greens and reds
        for (let i = 0; i < 5; i++) {
            if (this.greens[i] !== undefined && this.greens[i] != word[i]) {
                //Does not match one of the greens
                if (verbose) {console.log("false on green:", i)}
                return false
            }
            if (this.reds[i].has(word[i])) {
                //Matches one of the reds
                if (verbose) {console.log("false on red:", i)}
                return false
            }
        }
        //Check for counts
        // for (let letter in word_count) {
        //     if (letter in this.yellows) {
        //         if (this.yellows[letter] >= 10) {
        //             if (word_count[letter] != this.yellows.letter - 10) {
        //                 //Exact count for that letter is wrong
        //                 return false
        //             }
        //         } else if (word_count[letter] < this.yellows.letter) {
        //             //Letter does not have at least the required count
        //             return false
        //         }
        //     }
        // }
        for (let letter in this.yellows) {
            if (this.yellows[letter] == 10) {
                if (letter in word_count){
                    if (verbose) {console.log("false on none allowed (10):", letter)}
                    return false
                }
            } else if (!(letter in word_count)){
                if (verbose) {console.log("false on not in word:", letter)}
                return false
            } else if (this.yellows[letter] > 10) {
                if (this.yellows[letter] - 10 != word_count[letter]) {
                    if (verbose) {console.log("false on only exact allowed:", letter)}
                    return false
                }
            } else {
                if (this.yellows[letter] > word_count[letter]) {
                    if (verbose) {console.log("false on not enough:", letter)}
                    return false
                }
            }
        }
        //Passes all the tests, may be a valid word
        return true
    }
    countOccurances(word, character) {
        return word.split(character).length - 1
    }
    filter_words(list) {
        let new_words = []
        list.forEach(word => {
            // if (word == "robot") {
            //     console.log(word)
            //     console.log(this.yellows)
            //     console.log(this.checkFit(word, true))
            //     console.log(this.word_counts[word])
            // }
            if (this.checkFit(word)) {
                new_words.push(word)
            }
        })
        return new_words
    }
    get_scores(guesses, solutions, checks) {
        //Iterate through all possible clues
        let guesses_average_remaining = {}
        guesses.forEach((guess, i) => {
            if (i % parseInt(guesses.length / 10) == 0) {
                console.log(i, "of", guesses.length)
            }
            let remaining = [];
            solutions.forEach(solution => {
                let sub_remaining = 0
                let clues = new Clues();
                clues.generateAndAddClue(guess, solution)
                checks.forEach(check => {
                    if (clues.checkFit(check)) {
                        sub_remaining += 1
                    }
                })
                if (sub_remaining === 0) {
                    //Do nothing
                } else {
                    remaining.push(sub_remaining)
                }
            })
            let a
            if (remaining.length == 0) {
                a = 9999
            } else {
                let sum = 0;
                remaining.forEach(r => {
                    sum += r
                })
                a = sum / remaining.length;
            }
            if (solutions.includes(guess)) {
                if (a == 9999) {
                    a = 0
                } else {
                    a = a * (solutions.length - 1) / solutions.length;
                }
            }
            guesses_average_remaining[guess] = a;
        })
        // console.log(guesses_average_remaining)
        //Sort remaining
        let keysSorted = Object.keys(guesses_average_remaining).sort(function (a, b) {
            return guesses_average_remaining[a] - guesses_average_remaining[b]
        })
        let words_with_scores = []
        keysSorted.forEach(key => {
            words_with_scores.push(key, guesses_average_remaining[key])
        })
        return [keysSorted, words_with_scores];
    }
    sample(list, start, skip) {
        let subset = []
        for (let i = start; i < list.length; i += skip) {
            subset.push(list[i])
        }
        console.log("Sample size", subset.length, "of", list.length)
        return subset
    }
    best_guess() {
        // console.log(this.yellows)
        let wv = this.filter_words(this.words_valid);
        // let wv = this.words_valid;
        let ws = this.filter_words(this.words_solutions);
        console.log("remaining solutions", ws.length, ws);
        //Calculate the best guess
        let ret = this.get_scores(wv, ws, ws);
        console.log(ret[1].slice(0,10))
        return ret[1]
    }
}

function calculate_first_guess() {

    let sample_start = 5
    let ss
    let ret

    console.log("EPOCH 1");
    ss = Clues.sample(words_solutions, 2, 25);
    ret = Clues.get_scores(words_valid, ss, ss);

    console.log("EPOCH 2");
    ss = Clues.sample(words_solutions, sample_start + 131, 6);
    ret = Clues.get_scores(ret[0].slice(0, 2000), ss, ss);

    console.log("EPOCH 3");
    ss = Clues.sample(words_solutions, sample_start + 211, 2);
    ret = Clues.get_scores(ret[0].slice(0, 200), ss, ss);

    console.log("EPOCH 4");
    ss = words_solutions;
    ret = Clues.get_scores(ret[0].slice(0, 20), ss, ss);

    console.log(ret[1].slice(0, 10));

}

//SOLUTION
// [
//     'soare',
//     191.72397408207343,
//     'saine',
//     212.192656587473,
//     'saice',
//     218.87775377969763,
//     'raise',
//     219.75507559395248,
//     'raile',
//     222.79179265658746
//   ]

if (false) {
    calculate_first_guess
}

if (false) {
    let clues = new Clues(word_counts)
    clues.addClue("soare", "kgkyk")
    let ret = clues.best_guess()
    console.log(ret.slice(0, 10))

    clues.addClue("toyon", "ygkgk")
    ret = clues.best_guess()
    console.log(ret.slice(0, 10))

    clues.addClue("motor", "kgygy")
    ret = clues.best_guess()
    console.log(ret.slice(0, 10))
}

// let clues = new Clues(word_counts)
// clues.addClue("irate", "kykyk")
// console.log(clues.checkFit("cigar"))
// clues.best_guess()