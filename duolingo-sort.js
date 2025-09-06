// Duolingo Sort - Multi-language number parsing and sorting

// Roman numeral conversion
function romanToInt(roman) {
  const romanMap = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };

  let result = 0;
  for (let i = 0; i < roman.length; i++) {
    const current = romanMap[roman[i]];
    const next = romanMap[roman[i + 1]];

    if (next && current < next) {
      result += next - current;
      i++; // Skip next character
    } else {
      result += current;
    }
  }
  return result;
}

// English number parsing
function englishToInt(english) {
  const lowerEnglish = english.toLowerCase().trim();

  const ones = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };

  const scales = {
    hundred: 100,
    thousand: 1000,
    million: 1000000,
    billion: 1000000000,
  };

  if (ones[lowerEnglish] !== undefined) {
    return ones[lowerEnglish];
  }

  let result = 0;
  let current = 0;
  const words = lowerEnglish.split(/\s+/);

  for (const word of words) {
    if (ones[word] !== undefined) {
      current += ones[word];
    } else if (scales[word] !== undefined) {
      if (word === "hundred") {
        current *= scales[word];
      } else {
        result += current * scales[word];
        current = 0;
      }
    }
  }

  return result + current;
}

// German number parsing
function germanToInt(german) {
  const lowerGerman = german.toLowerCase().trim();

  const ones = {
    null: 0,
    eins: 1,
    zwei: 2,
    drei: 3,
    vier: 4,
    fünf: 5,
    sechs: 6,
    sieben: 7,
    acht: 8,
    neun: 9,
    zehn: 10,
    elf: 11,
    zwölf: 12,
    dreizehn: 13,
    vierzehn: 14,
    fünfzehn: 15,
    sechzehn: 16,
    siebzehn: 17,
    achtzehn: 18,
    neunzehn: 19,
    zwanzig: 20,
    dreißig: 30,
    vierzig: 40,
    fünfzig: 50,
    sechzig: 60,
    siebzig: 70,
    achtzig: 80,
    neunzig: 90,
  };

  const scales = {
    hundert: 100,
    tausend: 1000,
    million: 1000000,
    milliarde: 1000000000,
  };

  if (ones[lowerGerman] !== undefined) {
    return ones[lowerGerman];
  }

  // Handle compound numbers like "einundzwanzig" (21)
  if (lowerGerman.includes("und")) {
    const parts = lowerGerman.split("und");
    if (parts.length === 2) {
      const first = germanToInt(parts[0]);
      const second = germanToInt(parts[1]);
      if (first < 10 && second >= 20 && second < 100) {
        return first + second;
      }
    }
  }

  // Handle hundreds like "dreihundert" (300)
  for (const [word, value] of Object.entries(ones)) {
    if (lowerGerman.startsWith(word) && lowerGerman.endsWith("hundert")) {
      return value * 100;
    }
  }

  // Handle complex numbers
  let result = 0;
  let current = 0;
  let temp = lowerGerman;

  // Simple parsing for common patterns
  for (const [word, value] of Object.entries(scales)) {
    if (temp.includes(word)) {
      const parts = temp.split(word);
      if (parts[0]) {
        const multiplier = germanToInt(parts[0]) || 1;
        result += multiplier * value;
      } else {
        result += value;
      }
      temp = parts[1] || "";
    }
  }

  if (temp) {
    result += germanToInt(temp) || 0;
  }

  return result || ones[lowerGerman] || 0;
}

// Traditional Chinese number parsing
function traditionalChineseToInt(chinese) {
  const digits = {
    零: 0,
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };

  const units = {
    十: 10,
    百: 100,
    千: 1000,
    萬: 10000,
    億: 100000000,
  };

  let result = 0;
  let current = 0;
  let i = 0;

  while (i < chinese.length) {
    const char = chinese[i];

    if (digits[char] !== undefined) {
      current = current * 10 + digits[char];
    } else if (units[char] !== undefined) {
      if (char === "萬" || char === "億") {
        result = (result + current) * units[char];
        current = 0;
      } else {
        if (current === 0 && char === "十") {
          current = 1; // Handle cases like "十" meaning 10
        }
        current *= units[char];
        result += current;
        current = 0;
      }
    }
    i++;
  }

  return result + current;
}

// Simplified Chinese number parsing
function simplifiedChineseToInt(chinese) {
  // Convert simplified to traditional mapping where different
  const simplifiedToTraditional = {
    零: "零",
    一: "一",
    二: "二",
    三: "三",
    四: "四",
    五: "五",
    六: "六",
    七: "七",
    八: "八",
    九: "九",
    十: "十",
    百: "百",
    千: "千",
    万: "萬",
    亿: "億",
  };

  let traditional = "";
  for (const char of chinese) {
    traditional += simplifiedToTraditional[char] || char;
  }

  return traditionalChineseToInt(traditional);
}

// Main parsing function
function parseNumber(numStr) {
  // Remove whitespace
  const trimmed = numStr.trim();

  // Check if it's Arabic numeral
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed);
  }

  // Check if it's Roman numeral
  if (/^[IVXLCDM]+$/.test(trimmed)) {
    return romanToInt(trimmed);
  }

  // Check if it's Chinese (contains Chinese characters)
  if (/[\u4e00-\u9fff]/.test(trimmed)) {
    // Traditional Chinese characters
    if (/[萬億]/.test(trimmed)) {
      return traditionalChineseToInt(trimmed);
    }
    // Simplified Chinese characters
    if (/[万亿]/.test(trimmed)) {
      return simplifiedChineseToInt(trimmed);
    }
    // Default to traditional
    return traditionalChineseToInt(trimmed);
  }

  // Check if it's German (contains umlauts or common German words)
  if (
    /[äöüß]/.test(trimmed) ||
    /\b(und|hundert|tausend|null|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)\b/i.test(
      trimmed
    )
  ) {
    return germanToInt(trimmed);
  }

  // Default to English
  return englishToInt(trimmed);
}

// Language detection for sorting priority
function getLanguagePriority(numStr) {
  const trimmed = numStr.trim();

  // Roman numerals - priority 0
  if (/^[IVXLCDM]+$/.test(trimmed)) {
    return 0;
  }

  // English - priority 1
  if (/^[a-zA-Z\s]+$/.test(trimmed) && !/[äöüß]/.test(trimmed)) {
    return 1;
  }

  // Traditional Chinese - priority 2
  if (/[\u4e00-\u9fff]/.test(trimmed) && /[萬億]/.test(trimmed)) {
    return 2;
  }

  // Simplified Chinese - priority 3
  if (/[\u4e00-\u9fff]/.test(trimmed) && /[万亿]/.test(trimmed)) {
    return 3;
  }

  // Check for other Chinese patterns
  if (/[\u4e00-\u9fff]/.test(trimmed)) {
    return 2; // Default to traditional
  }

  // German - priority 4
  if (
    /[äöüß]/.test(trimmed) ||
    /\b(und|hundert|tausend|null|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)\b/i.test(
      trimmed
    )
  ) {
    return 4;
  }

  // Arabic numerals - priority 5
  if (/^\d+$/.test(trimmed)) {
    return 5;
  }

  return 1; // Default to English
}

function sortDuolingo(part, unsortedList) {
  if (part === "ONE") {
    // Part 1: Convert to integers and return as string integers
    return unsortedList
      .map((num) => parseNumber(num))
      .sort((a, b) => a - b)
      .map((num) => num.toString());
  } else {
    // Part 2: Sort by numerical value, then by language priority
    const withValues = unsortedList.map((num) => ({
      original: num,
      value: parseNumber(num),
      priority: getLanguagePriority(num),
    }));

    withValues.sort((a, b) => {
      if (a.value !== b.value) {
        return a.value - b.value;
      }
      return a.priority - b.priority;
    });

    return withValues.map((item) => item.original);
  }
}

module.exports = {
  sortDuolingo,
  parseNumber,
  getLanguagePriority,
};
