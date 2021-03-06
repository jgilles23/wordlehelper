import { w_valid, w_solutions } from "./words.js"
import { prob_by_ln } from "./probability_play.js"

let seed = 155 //Any seed for x
let delta = 32452867 //A prime greater than 2315*2315

//Class to store the words
class Word {
    constructor(string) {
        this.word = string
        this.counts = {}
        string.split("").forEach(c => {
            if (this.counts[c]) {
                this.counts[c] += 1
            } else {
                this.counts[c] = 1
            }
        })
    }
}

//7717, 6271

//Convert valid words & solutions into Word Class
let solutions = w_solutions.map(x => new Word(x))
let valids = w_valid.map(x => new Word(x))
valids = solutions.concat(valids)

//Shuffle solutions
// let num_shuffles = w_solutions.length*10
// for (let i = 0; i < num_shuffles; i++) {
//     let x = parseInt(Math.random()*w_solutions.length)
//     let y = parseInt(Math.random()*w_solutions.length)
//     let a = solutions[x]
//     solutions[y] = solutions[x]
//     solutions[x] = a
// }

class Sieve_Base {
    constructor() {
        this.greens = new Array(5)
        this.reds = new Array(5)
        this.at_least = {}
        this.exactly = {}
    }
    test(word) {
        //Test a word aganit the sieve to see if it passes
        for (let i = 0; i < 5; i++) {
            //Test for reds and greens
            if (this.greens[i] === undefined) {
                if (this.reds[i] === word.word[i]) {
                    //Word contains a red letter
                    // console.log("fail reds #", i)
                    return false
                }
            } else {
                if (this.greens[i] !== word.word[i]) {
                    //word does not contain a green letter
                    // console.log("fail greens #", i)
                    return false
                }
            }
        }
        //Test exactly
        for (let c in this.exactly) {
            if (word.counts[c] === undefined) {
                if (this.exactly[c] !== 0) {
                    // console.log("fail zero", c)
                    return false
                }
            } else {
                if (word.counts[c] !== this.exactly[c]) {
                    //Word does not contian the right number of letters
                    // console.log("fail exactly", c)
                    return false
                }
            }
        }
        //Test at least
        for (let c in this.at_least) {
            if (!(word.counts[c] >= this.at_least[c])) {
                //Word does not contian enough of a letter
                // console.log("fail at least", c)
                return false
            }
        }
        //All tests passed, this is a valid word
        return true
    }
}

//Class to store sieves to be applied to future checks
class Sieve extends Sieve_Base {
    constructor(solution, guess) {
        //Create a sieve that can be tested aganist additional checks
        //The input solution and guess must be of class Word
        super()
        //Add reds and greens
        for (let i = 0; i < 5; i++) {
            if (solution.word[i] == guess.word[i]) {
                this.greens[i] = guess.word[i]
            } else {
                this.reds[i] = guess.word[i]
            }
        }
        //Add at leasts and exactly
        for (let c in guess.counts) {
            if (solution.counts[c] === undefined) {
                //There are non of the letter in the solution
                this.exactly[c] = 0
            } else if (guess.counts[c] > solution.counts[c]) {
                //The solution has less of the letter than the guess
                //Therefore we know the exact number of that letter
                this.exactly[c] = solution.counts[c]
            } else {
                //Solution has more than or equal to the guess
                //We know there at least that many of a letter
                this.at_least[c] = guess.counts[c]
            }
        }
    }
}

function best_move(primary_sieves = []) {
    let my_solutions = solutions.filter(solution => {
        for (let sieve of primary_sieves) {
            if (sieve.test(solution) === false) {
                return false
            }
        }
        return true
    })
    // my_solutions = solutions.slice(0,200) //Taking down the results
    console.log(my_solutions.length, "solutions remaining")
    let i = 0
    let scores = valids.map(guess => {
        if (i % 1000 == 0) { console.log(i, "of", valids.length, guess.word) }
        let count = 0
        for (let solution of my_solutions) {
            if (guess.word === solution.word) {
                continue
            }
            let sieve = new Sieve(solution, guess)
            for (let check of my_solutions) {
                if (sieve.test(check)) {
                    count += 1
                }
            }
        }
        i++
        return count / my_solutions.length / my_solutions.length
    })
    //Find the best of the scores, and corresponding word
    let best_word = ""
    let best_score = scores.length
    for (let i = 0; i < scores.length; i++) {
        if (scores[i] < best_score) {
            best_word = valids[i].word
            best_score = scores[i]
        }
    }
    console.log("Best:", best_word, best_score, "words", best_score * my_solutions.length)
}

export class Sieve_Colors extends Sieve_Base {
    constructor(word, colors) {
        super()
        word = word.split("")
        colors = colors.split("")
        //Go through greens & reds
        for (let i = 0; i < 5; i++) {
            if (colors[i] === "g") {
                this.greens[i] = word[i]
            } else {
                this.reds[i] = word[i]
            }
        }
        //Check for at_least and exactly
        let gy_count = {}
        let k_count = {}
        for (let i = 0; i < 5; i++) {
            let c = word[i]
            if (gy_count[c] === undefined) {
                gy_count[c] = 0
                k_count[c] = 0
            }
            if (colors[i] === "k") {
                k_count[c] += 1
            } else {
                gy_count[c] += 1
            }
        }
        //Iterate through characters
        for (let c in gy_count) {
            if (k_count[c] >= 1) {
                this.exactly[c] = gy_count[c]
            } else {
                this.at_least[c] = gy_count[c]
            }
        }
        console.log(this)
    }
}

export function best_move_jump(primary_sieves = [], return_others) {
    let my_solutions = solutions.filter(solution => {
        for (let sieve of primary_sieves) {
            if (sieve.test(solution) === false) {
                return false
            }
        }
        return true
    })
    // my_solutions = solutions.slice(0,5) //Taking down the results
    console.log("solutions remaining", my_solutions.length, "sample", my_solutions.slice(0, 5).map(a => a.word))
    //Prepare a list to step through so that we can go quickly
    let pairs = Array(parseInt((my_solutions.length ** 2) / 2 + my_solutions.length / 2))
    let k = 0
    for (let i = 0; i < my_solutions.length; i++) {
        for (let j = i; j < my_solutions.length; j++) {
            pairs[k] = [i, j]
            k++
        }
    }
    console.log("Pairs made")
    //Mix up the list
    for (let i = 0; i < 5 * pairs.length; i++) {
        let x = parseInt(Math.random() * pairs.length)
        let y = parseInt(Math.random() * pairs.length)
        let pair = pairs[x]
        pairs[x] = pairs[y]
        pairs[y] = pair
    }
    // console.log(pairs.slice(0,10))
    console.log("Pairs mixed")
    //Do the rest of the stuff
    let i = 0
    let breaks = [200, 1000, 5000, 20000, 200000]
    let break_count = breaks.map(x => 0)
    let no_break_count = 0
    let best_word
    let best_score = 1.1
    for (let guess of valids) {
        // if (i % 1 == 0) { console.log(i, "of", valids.length, guess.word) }
        let count = 0
        let sieves = new Array(my_solutions.length)
        let j = 0
        for (let [x, y] of pairs) {
            let break_flag = false
            for (let break_ind = 0; break_ind < breaks.length; break_ind++) {
                if ((j + 1 === breaks[break_ind]) || (j + 2 === breaks[break_ind])) {
                    if (prob_by_ln(count, j + 1, best_score) < 0.001) {
                        //Not likely to be correct, stop searching
                        // console.log("break", guess.word)
                        break_count[break_ind]++
                        break_flag = true
                        break
                    }
                }
            }
            if (break_flag) {
                break
            }
            let solution = my_solutions[x]
            let check = my_solutions[y]
            if (guess.word === solution.word) {
                count += 0
            } else {
                if (sieves[x] === undefined) {
                    sieves[x] = new Sieve(solution, guess)
                }
                if (sieves[x].test(check)) {
                    count += 2
                }
            }
            //Up the count by the appropriate amount
            if (x === y) {
                j += 1
            } else {
                j += 2
            }
        }
        i++
        if (j === my_solutions.length ** 2) {
            //Find the best of the scores, and corresponding word
            no_break_count += 1 
            let score = count / j
            if (score < best_score) {
                best_score = score
                best_word = guess.word
                console.log("NEW BEST  :", i, guess.word, "Score", score, "Words", count / my_solutions.length, "Breaks", break_count, "No Breaks", no_break_count)
            } else if (j > 100000) {
                console.log("- not best:", i, guess.word, "Score", score, "Words", count / my_solutions.length, "Breaks", break_count, "No Breaks", no_break_count)
            }
        }
    }
    console.log("BEST:",best_word, "Score", best_score, "Words", best_score * my_solutions.length, "Breaks", break_count, "No Breaks", no_break_count)
    if (return_others) {
        //Calculate if any of the colors of the best guess are guarenteed green
        let color = ["k", "k", "k", "k", "k"]
        for (let i = 0; i < 5; i++) {
            let break_flag = false
            for (let word of my_solutions) {
                if (best_word[i] !== word.word[i]) {
                    break_flag = true
                    break
                }
            }
            if (break_flag === false) {
                color[i] = "g"
            }
        }
        color = color.join("")
        //Return the guess at the colors in the word
        return [best_word, color]
    } else {
        return best_word
    }
}

// best_move()

//Test cases
if (false) {
    let sieves = []
    sieves.push(new Sieve(new Word("build"), new Word("roate")))
    // sieves.push(new Sieve(new Word("great"), new Word("tweel")))
    // sieves.push(new Sieve(new Word("robot"), new Word("pyres")))
    console.log("SIEVES", sieves)
    // best_move(sieves)
    best_move_jump(sieves)
}

if (false) {
    //Check that the sieves work
    let s = new Sieve_Colors("soonx", "kyykk")
    console.log(s)
}

if (false) {
    let types = {}
    for (let a = 0; a < solutions.length; a++) {
        let inds = [100, 1112, a]
        let permutations = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]
        let results = []
        for (let perm of permutations) {
            let [i, j, k] = perm
            let x = inds[i]
            let y = inds[j]
            let z = inds[k]
            let guess = solutions[x]
            let solution = solutions[y]
            let check = solutions[z]
            let sieve = new Sieve(solution, guess)
            results.push(sieve.test(check))
        }
        let results_string = results.join("-")
        if (types[results_string] === undefined) {
            types[results_string] = 0
        }
        types[results_string] += 1
    }
    console.log(types)
}

//roate 60.42462203023758
//soare 62.30107991360691
