import { w_valid, w_solutions } from "./words.js"

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sum(array) {
    return array.reduce((partialSum, a) => partialSum + a, 0)
}

function sort_objects_by_property(objects, property) {
    //Modifies the order of the sort in place
    objects.sort((a, b) => a[property] - b[property])
}

//Standard variables
let five = [0, 1, 2, 3, 4]
let alphabet = "abcdefghijklmnopqrstuvwxyz"

//Class to store the words
class Word {
    constructor(string) {
        this.word = string
        // this.set = new Set(string.split("").sort())
        // this.ordered = [...this.set]
        this.counts = {}
        this.pos = {}
        for (let i = 0; i < 5; i++) {
            let c = string[i]
            if (this.counts[c]) {
                this.counts[c] += 1
                this.pos[c].push(i)
            } else {
                this.counts[c] = 1
                this.pos[c] = [i]
            }
        }
    }
}

//Create the solutions lists
let solutions = w_solutions.map(x => new Word(x))
let non_solutions = w_valid.map(x => new Word(x))
let valids = solutions.concat(non_solutions)
console.log(solutions.length, non_solutions.length, valids.length)

//Function for coloring guesses aganist pairs
function calc_color(guess, solution) {
    let editable_counts = { ...solution.counts }
    //Reduce counts for greens
    five.forEach(i => {
        if (guess.word[i] === solution.word[i]) {
            editable_counts[guess.word[i]]--
        }
    })
    //Get the colored answer
    let color = five.map(i => {
        let g = guess.word[i]
        let s = solution.word[i]
        if (g === s) {
            // editable_counts[g]--
            return "g"
        } else if (editable_counts[g] > 0) {
            editable_counts[g]--
            return "y"
        } else {
            return "k"
        }
    }).join("")
    return color
}

//Create pairs of colors for solutions and guesses
class Pairs {
    constructor(guesses, solutions) {
        //If guesses and solutions are provided, the pairs object will pre-fill; otherwise it will be computed live
        this.pairs = {}
        if (guesses===undefined) {
            //Array should be computed at each step if required
            this.prefill = false
        } else {
            //Prefill the pairs array
            this.prefill = true
            process.stdout.write('Pre-filling pairs: ')
            let i = 0
            let log_frac = Math.floor(guesses.length/9)     
            for (let guess of guesses) {
                if (i%log_frac == 0) {
                    process.stdout.write(String(i/log_frac))
                }
                this.pairs[guess.word] = {}
                for (let solution of solutions) {
                    this.pairs[guess.word][solution.word] = calc_color(guess, solution)
                }
                i++
            }
            process.stdout.write(' Complete.\n')
        }
    }
    get_span(guess, solution) {
        if (this.prefill) {
            return this.pairs[guess.word, solution.word]
        }
        //Get the color for a guess/solution pair
        let sub_array = this.pairs[guess.word]
        if (sub_array === undefined) {
            //If guess objetc does not exist, create it
            sub_array = {}
            this.pairs[guess.word] = sub_array
        }
        let color = sub_array[solution.word]
        if (color === undefined) {
            //If the color has not yet been computed, compute the color
            color = get_color(guess, solution)
            sub_array[solution.word] = color
        }
        //Return the color
        return color
    }
}

//Create lookup table of solutions and their lengths
class Spans {
    constructor() {
        ///Input remaining solutions. MUST BE IN A CONSISTENT ORDER for savings to work
        //Store pre-computed spans of the 
        this.spans = {}
        this.counts = {
            new_compute: 0,
            pre_compute: 0,
            simple_compute: 0,
        }
    }
    get_span(solutions_group) {
        //Get the average span of the solutions provided
        //Simple computations
        if (solutions_group.solutions.length === 0) {
            console.log("Was provided a solutions of length 0, this was not expected.")
        } else if (solutions_group.solutions.length === 1) {
            this.counts.simple_compute ++
            return 1.0
        } else if (solutions_group.solutions.length === 2) {
            this.counts.simple_compute ++
            return 1.5
        }
        //Check if this solution set has been computed before
        let span = this.spans[solutions_group.string]
        if (span === undefined) {
            //Has not been computed before, must compute
            this.counts.new_compute ++
            //Do we comput it here? Or where is the computation actually performed?
        } else {
            this.counts.pre_compute ++
        }
    }
    get_ideal_span(guess, solutions_guide) {
        //If the span has already been fully calculated, use that as ideal, oterwise 
        let compound_word
    }
}

class Guess  {
    constructor(guess, solutions) {
        //Input a guess as a Word object, and the remaining solutions for that guess
        this.word = guess
    }
    calc_ideal_span (SG) {
        //Calculate the idea span for a guess given the solutions group of which it is a part
        //Keep the running total of idea breakdown
        let ideal_breakdown = 1.0
        for (let i = 0; i < 5; i ++) {
            let c = this.guess.word[i]
            if (SG.y_anywhere.has(c)) {
                //Yellow possible
                if (SG.g_here[i].has(c)) {
                    //Green is possible
                    if (SG.g_here[i].length === 1) {
                        //Only green is possible
                        ideal_breakdown *= 1.0
                    } else {
                        //Green, yellow, and black possile
                        ideal_breakdown *= 1/3
                    }
                } else {
                    //Only yellow and black possible
                    ideal_breakdown *= 1/2
                }
            }

        }
    }
}

class Solutions_Group {
    constructor(solutions) {
        this.solutions = solutions
        this.string = solutions.map(s => s.word).join("|")
        this.spans = undefined
        //Calculate setup for ideal_span calculations
        this.g_here = [new Set(), new Set(), new Set(), new Set(), new Set()]
        this.y_anywhere = new Set()
        for (let solution of solutions) {
            for (let i = 0; i < 5; i ++) {
                this.g_here[i].add(solution.word[i])
                this.y_anywhere.add(solution.word[i])
            }
        }
    }
    setup_ideal_span_calculations() {

    }
    calc_spans () {
        //First iterate through the possible guesses 
    }
}