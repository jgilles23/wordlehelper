import * as h from "./helper.js"

let pairs = new h.Pairs()
let solutions_lookup = {}

//General class for Node type objects
class Node {
    constructor(name, parent, solutions, settings) {
        //Takes a name (string) and parent. The name is the name of the edge from parent
        this.children = []
        this.best_average = 1000
        this.best_child = undefined
        this.parent = parent
        this.name = name
        this.solutions = solutions
        if (parent === undefined) {
            this.level = 0
            this.settings = settings
        } else {
            this.level = this.parent.level + 1
            this.settings = parent.settings
        }
        //Standard parts needed by each node
        //Parts for knowing and understanding average depth
        this.depth = undefined
        this.ideal_depth = undefined
        this.isGrown = false
    }
    addChild(child) {
        this.children.push(child)
    }
    forEach(func) {
        for (let child of this.children) {
            func(child)
        }
    }
    evaluate(i = 0) {
        if (this.level <= this.settings.print_level && this.solutions.length > 2) {
            console.log("- ".repeat(this.level), this.name, "(", this.solutions.length, ") [", i, "]")
        }
        this.sub_evaluate()
        if (this.level <= this.settings.print_level) {
            console.log("- ".repeat(this.level), ">", this.name, "(", this.solutions.length, ") [", i, "]", "Depth", this.depth)
        }
    }
}

class ColorNode extends Node {
    //Children by GUESSES
    //Chooses the best guess
    constructor(color, parent, solutions, settings) {
        //Color (string), parent (Node), solutions (list of Words)
        super(color, parent, solutions, settings)
        this.solutions_string = this.solutions.join(",")
    }
    sub_evaluate() {
        //Calculate the spans of this node & choose the best
        if (this.solutions.length === 1) {
            //Only one solution remaining, guess is correct
            if (this.name === "ggggg") {
                this.depth = 0
            } else {
                this.depth = 1
            }
        } else if (this.solutions.length === 2) {
            //Only two solutions remaining, guarenteed correct in (2)
            this.depth = 1.5
        } else {
            //Check if solution has been found before
            let x = solutions_lookup[this.solutions_string]
            if (x !== undefined) {
                this.depth = x[0]
                this.best_average = x[0]
                this.best_child = x[1]
                return
            }
            //Iterate through the possible children solutions that may not be remaining
            let already_checked = new Set(this.solutions)
            let i = 0
            for (let guess of this.solutions) {
                this.evaluate_guess(guess, i)
                if (this.best_average < 1) {
                    break
                }
                i++
            }
            //Non-solutions that may be used as guesses
            if (!(this.best_average <= 1)) {
                for (let guess of h.solutions) {
                    this.evaluate_guess(guess, i)
                    if (this.best_average <= 1) {
                        break
                    }
                    i++
                }
            }
            if (!(this.best_average <= 1)) {
                for (let guess of h.non_solutions) {
                    this.evaluate_guess(guess, i)
                    if (this.best_average <= 1) {
                        break
                    }
                    i++
                }
            }
            //Chose the best child to represent this span
            this.depth = this.best_child.depth + 1
            solutions_lookup[this.solutions_string] = [this.depth, this.best_child]
        }
    }
    evaluate_guess(guess, i) {
        //Function for evaluating a guess, guess should be of type Word
        let child = new GuessNode(guess, this, this.solutions)
        //Calcuate ideal span, evaluate branch only if it may be fruitful
        //child.calc_ideal_depth()
        if (true) {//(child.ideal_depth < this.best_average) {
            child.evaluate(i) //Calc span of the child
            //Check if the child might be the best child
            if (child.depth < this.best_average) {
                this.best_average = child.depth
                this.best_child = child
            }
        } else {
            // if (this.level <= this.settings.print_level) {
            //     // console.log("- ".repeat(child.level), "> REJECT", child.name, "(", child.solutions.length, ")", "Ideal depth", child.ideal_depth)
            // }
        }
    }
    calc_ideal_depth() {
        //Check if this has been found before
        let x = solutions_lookup[this.solutions_string]
        if (x !== undefined) {
            this.ideal_depth = x[0]
            return
        }
        //Calculate the ideal span for a branch (may be the same as actual span)
        if (this.solutions.length === 1) {
            //Only one solution remaining, guess is correct
            if (this.name === "ggggg") {
                this.ideal_depth = 0
            } else {
                this.ideal_depth = 1.0
            }
        } else if (this.solutions.length === 2) {
            //Only two solutions remaining, guarenteed correct in (2)
            this.ideal_depth = 1.5
        } else if (this.solutions.length <= 420) { //SPAN CUTOFF
            this.ideal_depth = (1 + 2 * (this.solutions.length - 1)) / this.solutions.length
        } else {
            this.ideal_depth = (1 + 2 * 419 + 3 * (this.solutions.length - 420)) / this.solutions.length
        }
        //No need to increase depth
    }
    calc_span() {
        if (this.solutions.length === 1) {
            //Only one solution remaining, guess is correct
            if (this.name === "ggggg") {
                this.span = new h.Span([1])
            } else {
                this.span = new h.Span([0, 1])
            }
        } else if (this.solutions.length === 2) {
            //Only two solutions remaining, guarenteed correct in (2)
            this.span = new h.Span([0, 1, 1])
        } else {
            this.best_child.calc_span()
            this.span = this.best_child.span
            this.span.increaseDepth()
        }
    }
}

class RootColorNode extends ColorNode {
    constructor(solutions, settings) {
        //Create a Root Color Node for starting the search tree 
        super(undefined, undefined, solutions, settings)
    }
}

class GuessNode extends Node {
    constructor(guess, parent, solutions, settings) {
        super(guess.word, parent, solutions, settings)
        this.guess = guess
    }
    grow() {
        if (this.isGrown === true) {
            //Don't grow if already grown
            return
        }
        this.isGrown = true
        //Iterate solutions aganist the values to get colors
        let solutions_by_color = {}
        for (let solution of this.solutions) {
            let color = pairs.color(this.guess, solution)
            if (solutions_by_color[color] === undefined) {
                solutions_by_color[color] = []
            }
            solutions_by_color[color].push(solution)
        }
        //Create a node for each color
        for (let color in solutions_by_color) {
            this.addChild(new ColorNode(color, this, solutions_by_color[color]))
        }
    }
    sub_evaluate() {
        //Add together the spans of child nodes
        this.grow() //Will grow if hasn't before
        if (this.children.length === 1) {
            this.depth = 999
            return
        }
        let a = 0
        this.forEach(child => {
            child.evaluate()
            a += child.depth * child.solutions.length
        })
        this.depth = a / this.solutions.length
    }
    calc_ideal_depth() {
        //Calculate a best case scenario average span for this guess
        //Used to quickly determine if more calculation is in order, of if cutoff should be made
        this.grow()
        let a = 0
        for (let child of this.children) {
            child.calc_ideal_depth()
            a += child.ideal_depth * child.solutions.length
        }
        this.ideal_depth = a / this.solutions.length
    }
    calc_span() {
        this.span = new h.Span([])
        this.forEach(child => {
            child.calc_span()
            this.span.addSpan(child.span)
        })
    }
    validate() {

    }
}


let settings = {
    print_level: 3, //How much printing to do
    short_print_level: 4, //What level to short print up to
    guess: "easy", //Accepts easy: guess anything, hard: guess only possible solutions
}

let s = h.solutions//.slice(500, 1000)
console.log(s.map(x => x.word))
let q = new ColorNode(undefined, undefined, s, settings)
q.evaluate()
console.log("BEST", q.depth, q.best_child.guess.word)
q.calc_span()
console.log("span", q.span.counts, q.span.average)