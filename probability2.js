import jstat from "jstat";

let v = 220 //Samples PASS
let n = 2000 //Samples total
let a = 0.1 //Test probability


let binomial_cdf = 1 - jstat.binomial.cdf(v,n,a)
console.log(binomial_cdf)

let sd = Math.sqrt(n*a*(1-a))
console.log(sd)
let zscore = jstat.zscore(v/n, a, sd)
console.log("zscore", zscore)
let ztest = jstat.ztest(v/n, a, sd, 1)
console.log("ztest", ztest) 


let q = (v-n*a)/Math.sqrt(n*a*(1-a))
console.log(q)
console.log(jstat.ztest(q, 1))