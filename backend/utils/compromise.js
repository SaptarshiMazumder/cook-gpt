const compromise = require('compromise');

function detectCookingRelated(prompt) {
    const doc = compromise(prompt);
    const nouns = doc.nouns().out('array');

    const cookingKeywords = [
        "recipe", "cook", "bake", "fry", "grill", "boil", "roast", "ingredients",
        "dish", "meal", "food", "flavor", "chef", "cuisine", "kitchen"
    ];

    return nouns.some(noun => cookingKeywords.includes(noun.toLowerCase()));
}

module.exports = { detectCookingRelated };
