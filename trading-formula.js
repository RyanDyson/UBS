function tradingFormula(name, formula, variables, type) {
  try {
    const result = evaluateLatexFormula(formula, variables);

    const roundedResult = Math.round(result * 10000) / 10000;

    return { result: roundedResult };
  } catch (error) {
    console.error(`Error evaluating formula for ${name}:`, error);
    return { result: 0.0 };
  }
}

function evaluateLatexFormula(formula, variables) {
  let cleanFormula = formula.replace(/\$\$/g, "").trim();

  if (cleanFormula.includes("=")) {
    cleanFormula = cleanFormula.split("=")[1].trim();
  }

  let jsExpression = convertLatexToJS(cleanFormula);

  jsExpression = replaceVariables(jsExpression, variables);

  return safeEval(jsExpression);
}

function convertLatexToJS(latex) {
  let js = latex;

  js = js.replace(/\\text\{([^}]+)\}/g, "$1");

  js = js.replace(/([a-zA-Z_]+)_\\([a-zA-Z]+)/g, "$1_$2");

  js = js.replace(/E\[([^\]]+)\]/g, "E_$1");

  js = js.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)");

  js = js.replace(/\\times/g, "*");
  js = js.replace(/\\cdot/g, "*");

  js = js.replace(/\\max\(/g, "Math.max(");

  js = js.replace(/\\min\(/g, "Math.min(");

  js = js.replace(/e\^\{([^}]+)\}/g, "Math.exp($1)");
  js = js.replace(/e\^([a-zA-Z_0-9]+)/g, "Math.exp($1)");

  js = js.replace(/\\log\(/g, "Math.log(");
  js = js.replace(/\blog\(/g, "Math.log(");

  js = js.replace(/\\sum/g, "sum");

  return js;
}

function replaceVariables(expression, variables) {
  let result = expression;

  const sortedVars = Object.keys(variables).sort((a, b) => b.length - a.length);

  for (const varName of sortedVars) {
    const value = variables[varName];
    const regex = new RegExp(`\\b${escapeRegExp(varName)}\\b`, "g");
    result = result.replace(regex, value.toString());
  }

  return result;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeEval(expression) {
  const context = {
    Math: Math,
    max: Math.max,
    min: Math.min,
    exp: Math.exp,
    log: Math.log,
    sqrt: Math.sqrt,
    pow: Math.pow,
    abs: Math.abs,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    sum: (...args) => args.reduce((a, b) => a + b, 0),
  };

  const sanitized = expression.replace(/[^0-9a-zA-Z_+\-*/().\s,]/g, "");

  const dangerous =
    /\b(eval|function|constructor|prototype|__proto__|import|require|process|global|window|document)\b/i;
  if (dangerous.test(sanitized)) {
    throw new Error("Expression contains dangerous patterns");
  }

  try {
    const func = new Function(...Object.keys(context), `return ${sanitized}`);
    return func(...Object.values(context));
  } catch (error) {
    console.error("Evaluation error:", error, "Expression:", sanitized);
    throw error;
  }
}

module.exports = {
  tradingFormula,
};
