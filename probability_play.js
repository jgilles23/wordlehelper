function factorial(x) {
    let res = 1;
    for (let i = 2; i <=x; i++) {
        res *= i;
    }
    return res
}

function choose(n, x) {
    //n is the bigger number: from n elements choose x elements
    let y = (n-x)
    let res = 1
    while (n > 0) {
        res *= n
        if (x > 0) {
            res /= x
        }
        if (y > 0) {
            res /= y
        }
        n--
        x--
        y--
    }
    return res
}

function prob_at_least(valid, samples, prob) {
    let p = 0
    for (let w = valid; w <= samples; w++) {
        let a = factorial(samples)/factorial(w)/factorial(samples - w)*(prob**w)*((1-prob)**(samples - w))
        p += a
        // console.log(":", w, a)
    }
    return p
}

function prob_at_least_inverse(valid, samples, prob) {
    let p = 0
    for (let w = 0; w < valid; w++) {
        let a = factorial(samples)/factorial(w)/factorial(samples - w)*(prob**w)*((1-prob)**(samples - w))
        p += a
        console.log(":", w, a)
    }
    return 1 - p
}

function ln_factorial(x) {
    let a = fact_ln_lookup[x]
    if (a===undefined) {
        console.log("PROBLEM IN LN FACTORIAL", x)
    }
    return a
    // let sum = 0
    // for (let i = 1; i <= x; i++) {
    //     sum += Math.log(i)
    // }
    // return sum
}

function term_by_ln(w, n, p) {
    let sum = ln_factorial(n) + w*Math.log(p) + (n-w)*Math.log(1-p) - ln_factorial(w) - ln_factorial((n-w))
    let a = Math.exp(sum)
    // console.log(":", w, a)
    return a
}

export function prob_by_ln(v, n, p) {
    let sum = 0
    for (let w = v; w <= n; w++) {
        sum += term_by_ln(w, n, p)
    }
    return sum
}

let M = 200000
let fact_ln_lookup = Array(M + 1)
fact_ln_lookup[0] = 0
for (let i = 1; i <= M; i++) {
    fact_ln_lookup[i] = fact_ln_lookup[i-1] + Math.log(i)
}

// console.log(fact_ln_lookup)

// let eb = 200/2315
// let N = 1000
// console.log("expected best", eb)
// console.log(prob_at_least(150,1000,0.1))

// console.log(prob_by_ln(120,1000,0.1))

if (true) {
    console.log(prob_by_ln(2,3,0.1))
}