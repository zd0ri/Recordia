const customWords = [
    'gagi', 'gago', 'gaga', 'tangina', 'putangina', 'puta', 'pucha',
    'pakshet', 'punyeta', 'kupal', 'ulol', 'bobo', 'tanga', 'tarantado',
    'hinayupak', 'bwisit', 'lintik', 'leche', 'inutil', 'siraulo',
    'kingina', 'shuta',
    'fuck', 'fucking', 'shit', 'bullshit', 'bitch', 'asshole', 'bastard',
    'motherfucker', 'dumbass', 'jackass', 'idiot', 'stupid', 'moron',
    'dickhead', 'prick', 'slut', 'whore', 'damn', 'crap', 'hell', 'loser',
    'trash', 'scumbag', 'pakyu'
];
const customPhrases = [
    'hayop ka', 'walang hiya', 'tangina mo', 'putangina mo', 'gago ka',
    'ulol ka', 'bobo mo', 'tanga mo', 'kupal ka', 'gaga ka', 'leche ka',
    'fuck you', 'son of a bitch', 'piss off', 'go to hell', 'shut up',
    'shut the fuck up', 'suck my dick', 'suck it', 'fucking idiot',
    'stupid bitch', 'dumb fuck', 'piece of shit', 'you suck', 'asshole ka',
    'fuck ka', 'stupid mo', 'bobo ka', "you're so gago", "you're so stupid",
    "tangina you're annoying", "putangina you're dumb",
    "gago you're an idiot",
    'ulol ka bro', 'shut up ka', 'fuck off ka', 'what the hell ka',
    'ang stupid mo', 'ang bobo mo', 'ang tanga mo', 'napaka-gago mo',
    'fucking kupal', 'stupid na tao', "you're a gago",
    'bitch ka', 'asshole mo', 'damn ka', 'wala kang utak',
    'wala kang kwenta', 'basura ka', 'peste ka'
];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const phrasePatterns = customPhrases.map((phrase) => new RegExp(
    `(^|[^a-z0-9])${phrase.split(/([\s-]+)/).map((part) => (
        /^[\s-]+$/.test(part)
            ? '[\\s-]+'
            : escapeRegex(part).replace(/['’]/g, "['’]")
    )).join('')}(?=$|[^a-z0-9])`,
    'gi'
));

module.exports = (comment) => {
    let cleaned = String(comment || '');

    // Filter custom phrases
    phrasePatterns.forEach((pattern) => {
        cleaned = cleaned.replace(
            pattern,
            (match) => match.replace(/[a-z0-9]/gi, '*')
        );
    });

    // Filter individual bad words
    customWords.forEach((word) => {
        const pattern = new RegExp(
            `\\b${escapeRegex(word)}\\b`,
            'gi'
        );

        cleaned = cleaned.replace(pattern, (match) => '*'.repeat(match.length));
    });

    return cleaned.replace(/\*+/g, '***');
};
