import { w_valid, w_solutions } from "./words.js"

//Record of words: 2/11 ulcer, 

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

//Convert valid words & solutions into Word Class
let solutions = w_solutions.map(x => new Word(x))
let non_solutions = w_valid.map(x => new Word(x))
let valids = solutions.concat(non_solutions)

//Create counts
function get_partitions(words) {
    let inc = 1 / words.length
    let count_includes = {} //Green or yellow
    for (let c of alphabet) { count_includes[c] = 0 }
    let count_position = {} //Just green
    for (let c of alphabet) { count_position[c] = [0, 0, 0, 0, 0] }
    for (let word of words) {
        for (let c of word.ordered) {
            count_includes[c] += inc
        }
        for (let i of five) {
            count_position[word.word[i]][i] += incr
        }
    }
    let partitions = {
        includes: count_includes,
        position: count_position
    }
    return partitions
}

function best_partition_heuristic(guess, partitions) {
    let remaining = 1.0
    for (let i of five) {
        let c = guess.word[i]
        let inc = partitions.includes[c]
        let pos = partitions.position[c][i]
        remaining *= ((pos) ** 2 + (inc - pos) ** 2 + (1 - inc) ** 2) //green + yellow + black
    }
    //Correct for double letters
    remaining *= 2 ** (5 - guess.ordered.length)
    return remaining
}

function partition2(words) {
    let a = 1.0 / words.length
    let p = {
        exact: {}, //Number of words that contain exactly this many occurances of each letter
        pos: {}, //accessed by [letter][exact_count][position]; given exact count of letters, fraction of words contained at this position
    }
    //Fill out initial values
    for (let c of alphabet) {
        p.exact[c] = [1, 0, 0]
        p.pos[c] = [undefined, [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]
    }
    for (let word of words) {
        //Fill p.exact
        for (let c in word.counts) {
            let count = Math.min(word.counts[c], 2)
            p.exact[c][0] -= a
            p.exact[c][count] += a
        }
        //Fill p.pos
        for (let i = 0; i < 5; i++) {
            let c = word.word[i]
            let count = Math.min(word.counts[c], 2)
            p.pos[c][count][i] += a
        }
    }
    return p
}

function heuristic2(guess, p) {
    let a = 1.0;
    for (let c in guess.counts) {
        let count = guess.counts[c]
        if (count === 1) {
            let k = p.exact[c][0]
            let i = guess.pos[c][0]
            let g = p.pos[c][1][i] + p.pos[c][2][i]
            let y = 1 - k - g
            a *= k ** 2 + g ** 2 + y ** 2
        } else if (count === 2) {
            let kk = p.exact[c][0]
            let g0 = p.pos[c][2][guess.pos[c][0]]
            let g1 = p.pos[c][2][guess.pos[c][1]]
            let two = p.exact[c][2]
            let gg = g0 * g1
            let gy = g0 * (two - g1)
            let yg = (two - g0) * g1
            let yy = (two - g0) * (two - g1)
            console.log("hello")
        }
    }
}

function partition3(words) {
    let a = 1.0 / words.length
    let p = {num_solutions: words.length}
    for (let c of alphabet) {
        p[c] = {
            exact: [1, 0, 0],
            first: [0, 0, 0, 0, 0],
            second: [0, 0, 0, 0, 0]
        }
    }
    for (let word of words) {
        for (let c in word.counts) {
            let count = word.counts[c]
            p[c].exact[0] -= a
            if (count === 1) {
                p[c].exact[1] += a
                p[c].first[word.pos[c][0]] += a
            } else { //Count >= 2
                p[c].exact[2] += a
                p[c].second[word.pos[c][1]] += a
                if (count >= 3) {
                    p[c].second[word.pos[c][2]] += a
                }
            }
        }
    }
    return p
}

function heuristic3(guess, p) {
    sum([]) //To allow use in debugger, this line seems to be required?p[]
    let a = 1.0
    for (let c in guess.counts) {
        let count = guess.counts[c]
        let k, g, y
        k = p[c].exact[0]
        let i = guess.pos[c][0]
        if (count === 1) {
            g = p[c].first[i] + p[c].second[i]
            y = 1 - k - g
        } else {
            g = p[c].first[i]
            y = 1 - k - g
        }
        //Update a
        a *= g ** 2 + y ** 2 + k ** 2
        //Look at the second occurance of each letter
        if (count >= 2) {
            let j = guess.pos[c][1]
            k = 1 - p[c].exact[2]
            g = p[c].second[j]
            y = 1 - k - g
            a *= g ** 2 + y ** 2 + k ** 2
            if (count >= 3) {
                let l = guess.pos[c][2]
                g = p[c].second[l]
                y = 1 - k - g
                a *= g ** 2 + y ** 2 + k ** 2
            }
        }
    }
    return a
}

function comp_string(solution, guess) {
    //Check for greens
    let green_string = five.map(i =>
        solution.word[i] === guess.word[i] ? solution.word[i] : "?").join("")
    //Check for exactly 0 occurances
    let zero_string = "0" + guess.ordered.filter(g =>
        !solution.set.has(g)).join("")
    //Check for exactly 1 occurances
    let one_string = "1" + guess.ordered.filter(g =>
        ((solution.counts[g] === 1) && (solution.counts[g] < guess.counts[g]))).join("")
    //Check for exactly 2 occurances
    let two_string = "2" + guess.ordered.filter(g =>
        ((solution.counts[g] === 2) && (solution.counts[g] < guess.counts[g]))).join("")
    let exactly_string = zero_string + one_string + two_string
    //Check for at least 1 occurances
    let at_least_1 = "1" + guess.ordered.filter(g =>
        ((guess.counts[g] === 1) && (solution.counts[g] >= guess.counts[g]))).join("")
    //Check for at least 2 occurances
    let at_least_2 = "2" + guess.ordered.filter(g =>
        ((guess.counts[g] === 2) && (solution.counts[g] >= guess.counts[g]))).join("")
    //Check for at least 3 occurances
    let at_least_3 = "3" + guess.ordered.filter(g =>
        ((guess.counts[g] === 3) && (solution.counts[g] >= guess.counts[g]))).join("")
    let at_least_string = at_least_1 + at_least_2 + at_least_3
    //Create red (not) string
    let red_string = five.map(i =>
        ((green_string[i] === "?") && (solution.set.has(guess.word[i])) ? guess.word[i] : "?")).join("")
    return green_string + "|" + exactly_string + "|" + at_least_string + "|" + red_string
}

function color_guess(solution, guess) {
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

// console.log(color_guess(new Word("grsen"), new Word("grass")))

function score_guess(guess) {
    let guides = {}
    //Sort solutions by matching guide
    for (let solution of solutions) {
        let guide = color_guess(solution, guess)
        if (guide in guides) {
            guides[guide].push(solution)
        } else {
            guides[guide] = [solution]
        }
    }
    //Print guides
    // for (let guide in guides) {
    //     console.log(guide, guides[guide].length, guides[guide].slice(0,3).map(w => w.word))
    // }
    //Calculate score
    let average_words = 0
    for (let guide in guides) {
        average_words += guides[guide].length ** 2
    }
    average_words = average_words / solutions.length
    //Calculate standard deviation
    let sd = 0
    for (let guide in guides) {
        sd += (guides[guide].length - average_words) ** 2
    }
    sd = (sd / solutions.length) ** 0.5
    let score = average_words / solutions.length
    // console.log('"'+guess.word+'"', "score", +score.toFixed(4), "average words", +average_words.toFixed(2), "standard deviation", +sd.toFixed(2), "num colors", Object.keys(guides).length)
    return {
        guess: guess,
        score: score,
        average_words: average_words,
        sd: sd,
        num_colors: Object.keys(guides).length,
    }
    //Setup return object
}

class Guess {
    constructor(word, is_solution = false, level = 0) {
        this.word = word
        this.level = level
        this.is_solution = is_solution
        this.score = 9.0
        this.mean_length = 999.0
    }
    calc_heuristic(p) {
        //Provide the partitions of the remaining solutions, will calculate a heuristic score
        let a = 1.0
        for (let c in this.word.counts) {
            let count = this.word.counts[c]
            let k, g, y
            k = p[c].exact[0]
            let i = this.word.pos[c][0]
            if (count === 1) {
                g = p[c].first[i] + p[c].second[i]
                y = 1 - k - g
            } else {
                g = p[c].first[i]
                y = 1 - k - g
            }
            //Update a
            a *= g ** 2 + y ** 2 + k ** 2
            //Look at the second occurance of each letter
            if (count >= 2) {
                let j = this.word.pos[c][1]
                k = 1 - p[c].exact[2]
                g = p[c].second[j]
                y = 1 - k - g
                a *= g ** 2 + y ** 2 + k ** 2
                if (count >= 3) {
                    let l = this.word.pos[c][2]
                    g = p[c].second[l]
                    y = 1 - k - g
                    a *= g ** 2 + y ** 2 + k ** 2
                }
            }
        }
        //If this is a possible solution, it would score a 0, reduce heuristic accordingly
        if (this.is_solution) {
            a *= (1 - 1/p.num_solutions)
        }
        //Save the heuristic score
        this.heuristic = a
    }
    calc_score(solutions) {
        let guides = {}
        //Sort solutions by matching guide
        for (let solution of solutions) {
            let guide = color_guess(solution, this.word)
            if (guide in guides) {
                guides[guide].push(solution)
            } else {
                guides[guide] = [solution]
            }
        }
        //Calculate score
        let average_words = 0
        for (let guide in guides) {
            if (guide === "ggggg") {
                average_words += 0
            } else {
                average_words += guides[guide].length ** 2
            }
        }
        average_words = average_words / solutions.length
        let score = average_words / solutions.length
        //Calculate standard deviation
        // let sd = 0
        // for (let guide in guides) {
        //     sd += (guides[guide].length - average_words) ** 2
        // }
        // sd = (sd / solutions.length) ** 0.5
        //Save the results
        this.score = score
        this.average_words = average_words
        // this.sd = sd
        this.guides = guides
    }
    breakdown() {
        //Get the mean_length of this Guess
        if (this.is_solution) {
            this.lengths = [1]
        } else {
            this.lengths = [0]
        }
        for (let guide in this.guides) {
            let calc = new Calculator(this.guides[guide])
            let ml = calc.lengths
            for (let i = 0; i < ml.length; i++) {
                if (i + 1 < this.lengths.length) {
                    this.lengths[i + 1] += ml[i]
                } else {
                    this.lengths.push(ml[i])
                }
            }
        }
        //Calculate the average length
        this.mean_length = 0
        let count = 0
        for (let i = 0; i < this.lengths.length; i++) {
            count += this.lengths[i]
            this.mean_length += i*this.lengths[i]
        }
        this.mean_length = this.mean_length / count
    }
}

class Calculator {
    constructor(solutions, level) {
        //Declared variables
        let score_cutoff = 50
        let breakdown_cutoff = 10
        //Store inputs where required
        this.level = level
        //1 solution
        if (solutions.length === 1) {
            this.lengths = [1]
            this.mean_length = 0
            return
        }
        //All solutions
        this.guesses = new Array(valids.length)
        let i = 0
        while (i < solutions.length) {
            this.guesses[i] = new Guess(solutions[i], true, level + 1)
            i++
        }
        let j = 0
        while (j < non_solutions.length) {
            this.guesses[i + j] = new Guess(non_solutions[j], false, level + 1)
            j++
        }
        //Apply the heuristic
        this.p = partition3(solutions)
        this.guesses.forEach(g => g.calc_heuristic(this.p))
        sort_objects_by_property(this.guesses, "heuristic")
        console.log(solutions.length, solutions.slice(0,10).map(w => w.word), this.printable_guesses("heuristic", 10))
        //Get the scores of the best ones
        for (let i = 0; i < this.guesses.length && i < score_cutoff; i++) {
            this.guesses[i].calc_score(solutions)
        }
        sort_objects_by_property(this.guesses, "score")
        console.log(solutions.length, solutions.slice(0,10).map(w => w.word), this.printable_guesses("score", 10))
        //Drill down into the best onese
        i = 0
        for (let i = 0; i < this.guesses.length && i < breakdown_cutoff; i++) {
            this.guesses[i].breakdown()
        }
        sort_objects_by_property(this.guesses, "mean_length")
        console.log(solutions.length, solutions.slice(0,10).map(w => w.word), this.printable_guesses("mean_length", 10))
        //The guesses are now semi-sorted from best to worst
        //Store the best one
        this.lengths = this.guesses[0].lengths
        this.mean_length = this.guesses[0].mean_length
        console.log("mean_length", this.mean_length)
        return
    }
    printable_guesses(property, num) {
        if (num === undefined) {num = this.guesses.length}
        let a = []
        for (let i = 0; i < num; i++) {
            a.push(this.guesses[i].word.word)
            a.push(this.guesses[i][property])
        }
        // console.log(property, a)
        return [property, a]
    }
}

if (false) {
    let heuristic_score = {}
    let partitions = get_partitions(solutions)
    for (let word of valids) {
        heuristic_score[word.word] = best_partition_heuristic(word, partitions)
    }

    let ordered_words = Object.keys(heuristic_score).sort((a, b) => {
        if (heuristic_score[a] > heuristic_score[b]) return 1
        if (heuristic_score[a] < heuristic_score[b]) return -1
        return 0
    })

    for (let key of ordered_words.slice(0, 5)) {
        console.log(heuristic_score[key])
        score_guess(new Word(key))
    }
}

// score_guess(new Word("eefis"))
// let q = color_guess(new Word("fedsd"), new Word("eefis"))
// console.log(q)

// let p = partition3(solutions)
// // console.log(p)
// let w = new Word("beere")
// let a = heuristic3(w, p)
// console.log(a)
// score_guess(w)

if (false) {
    let p = partition3(solutions)
    for (let guess of valids) {
        let r = score_guess(guess)
        r.heuristic = heuristic3(guess, p)
        let delta = r.heuristic - r.score
        if (Math.abs(delta) > 0.03)
            console.log('"' + guess.word + '"', "score", +r.score.toFixed(4), "heuristic", +r.heuristic.toFixed(4), "delta", +delta.toFixed(4))
    }
}

function compare_heuristic(guess) {
    let r = score_guess(guess)
    let delta = guess.heuristic - r.score
    console.log('"' + guess.word + '"', "score", +r.score.toFixed(4), "heuristic", +guess.heuristic.toFixed(4), "delta", +delta.toFixed(4))
}

function ranked_heuristic(solutions) {
    let p = partition3(solutions)
    for (let guess of valids) {
        guess.heuristic = heuristic3(guess, p)
    }
    let ordered_guesses = [...valids]
    sort_objects_by_property(ordered_guesses, "heuristic")
    return ordered_guesses
}

if (false) {
    let ordered_guesses = ranked_heuristic(solutions)
    for (let i = 0; i < 20; i++) {
        compare_heuristic(ordered_guesses[i])
    }
}


// console.log(score_guess(new Word("soare")))
// console.log(score_guess(new Word("roate")))
// await sleep(1000000)

// let p = partition3(solutions)
// let g = new Guess(new Word("soare"), false)
// g.calc_heuristic(p)
// g.score(solutions)
// console.log(g)

if (true) {
    // let calc = new Calculator(solutions)
    let calc = new Calculator([new Word("apple"), new Word("grape")])
}