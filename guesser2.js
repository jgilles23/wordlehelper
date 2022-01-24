import { w_valid, w_solutions } from "./words.js"

//Add the w_solutions to w_valid & compute guides for both
w_valid.push(...w_solutions)
let w_valid_guide = w_valid.map(word => create_check_guide(word))
let w_solutions_guide = w_solutions.map(word => create_check_guide(word))

/*
CHECK GUIDE - to a wordle word
Each item is a binary number used for comparisons aganist clues
Items:
0) word compressed to concatenated 5 byte segements -> 25 bytes
1) word into 26 bytes stating if there at least 1 of that letter -> 26 byte
2) at least 2 of letter
3) at least 3 of letter
4) exactly 0
5) exactly 1
6) exactly 2

CLUE GUIDE - to a set of clues
Each item is pair of a binary mask and check value to be compared aganist the binary guides
Items:

*/

function create_check_guide(word) {
    //Assumes the provided word is lower case
    //See above for doc string
    let guide = [word_to_25(word), 0, 0, 0, (2 ** 26 - 1), 0, 0]
    //Return the guide
    word.split("").forEach(c => {
        let c_bin = character_to_26(c)
        if ((guide[1] & c_bin) == 0) {
            guide[4] -= c_bin
            guide[5] += c_bin
            guide[1] += c_bin
        } else if ((guide[2] & c_bin) == 0) {
            guide[5] -= c_bin
            guide[6] += c_bin
            guide[2] += c_bin
        } else if ((guide[3] & c_bin) == 0) {
            guide[6] -= c_bin
            guide[3] += c_bin
        }
    })
    return guide
}
function word_to_25(word) {
    return [0, 1, 2, 3, 4].reduce((partial, i) => {
        return partial + (word.charCodeAt(i) - 96) * (32 ** (4 - i))
    }, 0) //Starting value
}
function character_to_26(c) {
    return (2 ** 25) >> (c.charCodeAt(0) - 97)
}

function to_string_26(integer) {
    let s = integer.toString(2).padStart(26, "0")
    let new_s = s[0] + "  "
    for (let i = 1; i < 26; i += 5) {
        let integer = parseInt(s.slice(i, i + 5), 2)
        let character
        if (integer == 0) { character = "." }
        else if (integer == 31) { character = "#" }
        else if (integer > 26) { character = "?" }
        else { character = String.fromCharCode(integer + 96) }
        new_s = new_s + s.slice(i, i + 5) + character + " "
    }
    return new_s
}

let string_26_guide = "a  bcdef  ghijk  lmnop  qrstu  vwxyz";
let all_letters = "abcdefghjklmnop"

function countOccurances(word, character) {
    return word.split(character).length - 1
}

function replace(word, i, replacement = "?") {
    return word.substr(0, i) + replacement + word.substr(i + 1)
}
function mask_25(word, character) {
    return [0, 1, 2, 3, 4].reduce((partial, i) => {
        return partial + (word[i] == character ? 31 : 0) * (32 ** (4 - i))
    }, 0) //Starting value
}

function not_25(integer) {
    return integer ^ (2 ** 25 - 1)
}

function count_trues_25(a) {
    let a_string = a.toString(2)
    return (a_string.split("1").length - 1) / 5
}

function range(start, end, step = 1) {
    const len = Math.floor((end - start) / step)
    return Array(len).fill().map((_, idx) => start + (idx * step))
}

function enumerate(list) {
    return range(0, list.length, 1)
}

// function sort(itemsArray, sortingArr) {
//     let keysSorted = Object.keys(guesses_average_remaining).sort(function (a, b) {
//         return guesses_average_remaining[a] - guesses_average_remaining[b]
//     })
//     return keysSorted
// }

function sort_objects_by_property(objects, property) {
    //Modifies the order of the sort in place
    objects.sort((a, b) => a[property] - b[property])
}

export class Clues {
    constructor() {
        this.green = 0
        this.green_mask = 0
        this.exactly = [0, 0, 0]
        this.at_least = [0, 0, 0, 0]
        this.reds = []
        this.reds_mask = []
    }
    //Save the valid words & solutions with their guides
    valids = w_valid
    valids_guide = w_valid_guide
    solutions = w_solutions
    solutions_guide = w_solutions_guide
    //Copy this set of clues
    copy() {
        let new_clues = new Clues();
        new_clues.green = this.green
        new_clues.green_mask = this.green_mask
        new_clues.exactly = this.exactly.map(x => x)
        new_clues.at_least = this.at_least.map(x => x)
        new_clues.reds = this.reds.map(x => x)
        new_clues.reds_mask = this.reds_mask.map(x => x)
        return new_clues
    }
    //Function for adding a clue for a particular word
    addClue(word, clue) {
        //Find clues that are green
        let green_mask = mask_25(clue, "g")
        let black_mask = mask_25(clue, "k")
        //Add reds - that letter can never appear in this location
        this.reds_mask.push(not_25(green_mask))
        this.reds.push(this.reds_mask.slice(-1) & word_to_25(word))
        //Add greens - that letter must appear in this location
        this.green_mask = this.green_mask | green_mask
        this.green = this.green | (word_to_25(word) & green_mask)
        //Calculate unique letters
        let unique_characters = new Set(word.split(""))
        unique_characters.forEach(c => {
            let c_mask = mask_25(word, c);
            let gy = count_trues_25(not_25(black_mask) & c_mask)
            let c_26 = character_to_26(c)
            if (count_trues_25(c_mask & black_mask) > 0) {
                //If there are any blacks, its an exact number
                this.exactly[gy] = this.exactly[gy] | c_26
            }
            //There are at least that number of the letter in the solution word, if there are at tleast 1
            for (let i = 1; i <= gy; i++) {
                this.at_least[i] = this.at_least[i] | c_26
            }
        })

    }
    //Function for generating a clue from a particular word and solution pair
    generateClue(word, solution) {
        let clues = [undefined, undefined, undefined, undefined, undefined]
        for (let i = 0; i < 5; i++) {
            if (word[i] == solution[i]) {
                //Occurs at the correct position
                clues[i] = "g"
                solution = replace(solution, i)
            }
        }
        for (let i = 0; i < 5; i++) {
            if (clues[i] == "g") {
                //skip greens
                continue
            }
            let j = 0;
            while (j < 5) {
                if (solution[j] == word[i]) {
                    //More occurances in the string, but not in this position
                    clues[i] = "y"
                    solution = replace(solution, j)
                    break //Exit while loop
                }
                j++
            }
            if (j == 5) {
                //Loop did not break, no more occurances in the string
                clues[i] = "k"
            }
        }
        return clues
    }
    //Generate a clue then add to this class
    generate_clue_and_add(word, solution) {
        let clue = this.generateClue(word, solution)
        this.addClue(word, clue)
    }
    check_fit_guide(guide) {
        //Check the fit of a particular guide
        //Check the greens
        if ((guide[0] & this.green_mask) != this.green) {
            // console.log("fail green");
            return false
        }
        //Check at_least
        for (let i = 1; i <= 3; i++) {
            if ((this.at_least[i] & guide[i]) != this.at_least[i]) {
                // console.log("fail at_least");
                return false
            }
        }
        //Check exactly
        for (let i = 0; i <= 2; i++) {
            if ((guide[i + 4] & this.exactly[i]) != this.exactly[i]) {
                // console.log("fail exactly", i);
                return false
            }
        }
        //Check reds
        for (let i = 0; i < this.reds.length; i++) {
            let m = not_25((guide[0] & this.reds_mask[i]) ^ this.reds[i]) & this.reds_mask[i]
            if (((m & 32505856) == 32505856) || ((m & 1015808) == 1015808) || ((m & 31744) == 31744) || ((m & 992) == 992) || ((m & 31) == 31)) {
                // console.log("fail reds", i);
                return false
            }
        }
        //Made it through all the checks
        return true
    }
    print_guides() {
        console.log("   ", string_26_guide);
        console.log("gm:", to_string_26(this.green_mask))
        console.log("g :", to_string_26(this.green))
        for (let i = 0; i < this.reds.length; i++) {
            console.log("rm:", to_string_26(this.reds_mask[i]))
            console.log("r :", to_string_26(this.reds[i]))
        }
        this.exactly.forEach((e, i) => console.log("e" + String(i) + ":", to_string_26(e)))
        this.at_least.forEach((a, i) => console.log("a" + String(i) + ":", to_string_26(a)))
    }
    score_guesses(guess_inds, solutions_inds) {
        //Provide indices for the guess from valid words
        //Provide indices for the solutions from solutions
        console.log("num guesses", guess_inds.length, "num solutions", solutions_inds.length)
        let marker = parseInt(guess_inds.length / 10)
        let scores = guess_inds.map(guess_i => {
            let guess = this.valids[guess_i]
            if (guess_i % marker == 0) {
                console.log(guess_i, "of", guess_inds.length, ":", guess)
            }
            let guess_sum = 0
            let guess_count = 0
            //Iterate through possible solutions
            solutions_inds.forEach(solution_i => {
                let solution = this.solutions[solution_i]
                if (guess == solution) {
                    //Got the guess correct
                    guess_sum += 0
                    guess_count += 1
                } else {
                    //Create a new clues class to hold  the combo of guess & solution
                    let new_clues = this.copy()
                    let clue = new_clues.generateClue(guess, solution)
                    new_clues.addClue(guess, clue)
                    new_clues.generate_clue_and_add(guess, solution)
                    //Count the number of remaining guesses 
                    guess_sum += new_clues.count_remaining(solutions_inds)
                    guess_count += 1
                }
            })
            return guess_sum / guess_count
        })
        //Sort remaining
        let score_objects = enumerate(scores).map(i => {
            return {
                score: scores[i],
                index: guess_inds[i],
                word: this.valids[i]
            }
        })
        sort_objects_by_property(score_objects, "score")
        let sorted_inds = score_objects.map( a => a["index"] )
        let sorted_scores = score_objects.map( a => a["score"] )
        let sorted_words = score_objects.map( a => a["word"] )
        return [sorted_inds, sorted_scores, sorted_words]
    }
    count_remaining(solutions_inds) {
        //Return the number of remaining possible solutions, given the clues
        //Only test the subset of solutions provided
        if (solutions_inds === undefined) {
            solutions_inds = range(0, this.solutions.length, 1)
        }
        let count = 0
        solutions_inds.forEach(i => {
            if (this.check_fit_guide(this.solutions_guide[i])) {
                count += 1
            }
        })
        return count
    }
    best_guess(guess_inds) {
        //Generate the indexes of valids to use as guesses if needed
        if (guess_inds === undefined) {
            guess_inds = enumerate(this.valids)
        }
        //Generate the indicies of the possible solutions
        let solutions_inds = []
        for (let i = 0; i < this.solutions.length; i++) {
            if (this.check_fit_guide(this.solutions_guide[i])) {
                solutions_inds.push(i)
            }
        }
        //Get scores for the solutions
        let indexes, scores, words
        [indexes, scores, words] = this.score_guesses(guess_inds, solutions_inds)
        console.log(indexes.slice(0, 5), scores.slice(0, 5), words.slice(0, 5))
    }
}

let clues = new Clues()
clues.addClue("irate", "kykyk") //robot
clues.print_guides()
clues.best_guess()

// let q
// q = sort(["b", "c", "a"], [2, 1, 3])
// console.log(q)