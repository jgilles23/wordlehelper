import { w_valid, w_solutions } from ".././words.js"

//Variables used elsewhere
let five = [0, 1, 2, 3, 4]

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function sum(array) {
    return array.reduce((partialSum, a) => partialSum + a, 0)
}

export function sort_objects_by_property(objects, property) {
    //Modifies the order of the sort in place
    objects.sort((a, b) => a[property] - b[property])
}

//Class to store the words
export class Word {
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
export let solutions = w_solutions.map(x => new Word(x))
export let non_solutions = w_valid.map(x => new Word(x))
export let valids = solutions.concat(non_solutions)
console.log("From helper:", "solutions", solutions.length, "non_solutions", non_solutions.length, "valids", valids.length)

//Function for coloring guesses aganist pairs
export function calc_color(guess, solution) {
    //Calculate a color string (e.g. yykgk for a guess Word and solution Word)
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

export class Span {
    constructor (depth_counts) {
        //Stores the counts of depths
        //[] means new span with no info
        //[1] means this is a leaf
        //[0, 1] would be if 1 solutions are remaining (takes 1 more guess)
        //[0, 1, 1] would be if 2 solutions are remaining (takes 2 more guess)
        this.counts = depth_counts
        //this.average = undefined //Set in calc_average
        //this.numerator = 0 //Set in calc_average
        //this.denomentator = 0 //Set in calc_average
        this.calc_average()
    }
    addSpan(span) {
        //Add another span to this span
        for (let i = 0; i < span.counts.length; i++) {
            if (i < this.counts.length) {
                this.counts[i] += span.counts[i]
            } else {
                this.counts[i] = span.counts[i]
            }
            this.numerator += i * span.counts[i]
            this.denomentator += span.counts[i]
        }
        this.average = this.numerator/this.denomentator
    }
    calc_average() {
        //Calculate the average depth
        this.numerator = 0
        this.denomentator = 0
        if (this.counts.length === 0) {
            return
        } else if (this.counts.length === 1) {
            this.average = 0
            return
        }
        for (let i = 0; i < this.counts.length; i++) {
            this.numerator += i*this.counts[i]
            this.denomentator += this.counts[i]
        }
        this.average = this.numerator/this.denomentator
    }
    copy() {
        return new Span(this.counts)
    }
    increaseDepth() {
        this.average += 1
        this.counts.unshift(0)
    }
    isEqual(other) {
        //Checks of another span is equal to this span
        if (this.counts.length !== other.counts.length) {
            return false
        }
        for (let i = 1; i < this.counts.length; i++) {
            if (this.counts[i] !== other.counts[i]) {
                return false
            }
        }
        if (this.average !== other.average) {
            return false
        }
    }
}

//Create pairs of colors for solutions and guesses
export class Pairs {
    constructor(guesses, solutions) {
        //If guesses and solutions are provided, the pairs object will pre-fill; otherwise it will be computed live
        this.pairs = {} //guesses x solutions
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
    color(guess, solution) {
        //Return the coor of a guess and solution pair
        let guess_dict = this.pairs[guess.word]
        if (guess_dict === undefined) {
            guess_dict = {}
            this.pairs[guess.word] = guess_dict
        }
        let c = this.pairs[guess.word][solution.word]
        if (c === undefined) {
            c = calc_color(guess, solution)
            guess_dict[solution.word] = c
        }
        return c
    }
}

