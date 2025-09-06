const evaluatex = require("evaluatex")
/**
 * 
 * @param {string} str 
 */
function clean(str) {
    return str.replaceAll("$$", "").split("=").at(-1)
}

const ltex = "sqrt(x^2 + y^2)"

const fn = evaluatex(clean(ltex), {
        "TradeAmount": 11300.0,
        "Discount": 500.0,
        "ConversionRate": 1.2
      })
console.log(fn({x: 3, y: 4}))