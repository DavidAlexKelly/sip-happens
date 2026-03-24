export interface Challenge {
  id: string;
  text: string;
  action: string;
  icon: string;
  intensity: 1 | 2 | 3;
  mode: string;
}

export interface GameMode {
  id: string;
  label: string;
  icon: string;
  color: string;
  desc: string;
  intensity: string;
  time: string;
}

// ─────────────────────────────────────────────
// PENALTY SYSTEM
// ─────────────────────────────────────────────

export interface PenaltyContext {
  currentRound?: number;
  totalRounds?: number;
  intensity?: 1 | 2 | 3;
  mode?: string;
  multiplier?: number; // 1–4, set by the in-game slider
}

export const PENALTY = {
  sip: 1,
  small: 2,
  medium: 3,
  large: 4,
  max: 5,
  finish: 99,
} as const;

/**
 * Returns the final sip count for a given tier.
 * Applies the player-set multiplier, then any
 * future scaling hooks below.
 */
export function getPenalty(
  base: keyof typeof PENALTY,
  ctx: PenaltyContext = {}
): number {
  const value = PENALTY[base];
  if (value === 99) return 99; // finish drink — never scale

  const multiplier = ctx.multiplier ?? 1;

  // Future hooks (uncomment to enable):
  // const roundBonus = ctx.currentRound && ctx.totalRounds
  //   ? ctx.currentRound / ctx.totalRounds > 0.5 ? 1 : 0 : 0;
  // const modeBonus = ctx.mode === 'wild' ? 1 : 0;
  // const intensityBonus = ctx.intensity === 3 ? 1 : 0;

  return value * multiplier; // + roundBonus + modeBonus + intensityBonus;
}

/**
 * Formats a penalty number for display.
 * 99 → "finish your drink", else → "X sip(s)"
 */
export function formatPenalty(count: number): string {
  if (count === 99) return 'finish your drink';
  return count === 1 ? '1 sip' : `${count} sips`;
}

// ─────────────────────────────────────────────
// MODES
// ─────────────────────────────────────────────

export const MODES: GameMode[] = [
  {
    id: 'social',
    label: 'SOCIAL',
    icon: 'people',
    color: '#ff7afb',
    desc: 'Perfect icebreaker. Lighthearted dares and casual questions to get the rhythm flowing.',
    intensity: 'Easy Vibes',
    time: '15-30 MIN',
  },
  {
    id: 'truth',
    label: 'TRUTH',
    icon: 'eye',
    color: '#ff7cba',
    desc: 'No hiding. Raw truths and personal confessions laid bare on the table.',
    intensity: 'Medium',
    time: '20-40 MIN',
  },
  {
    id: 'dare',
    label: 'DARE',
    icon: 'flash',
    color: '#ed6ae9',
    desc: 'Embrace the chaos. High-energy tasks designed to make everyone lose their cool.',
    intensity: 'High',
    time: '25-45 MIN',
  },
  {
    id: 'drink',
    label: 'DRINK',
    icon: 'wine',
    color: '#00fbfb',
    desc: 'Classic drinking prompts. Everyone who does X, takes a sip.',
    intensity: 'Medium',
    time: '20-40 MIN',
  },
  {
    id: 'wild',
    label: 'WILD 🔥',
    icon: 'flame',
    color: '#ff6e84',
    desc: 'No holds barred. Our most daring challenge set yet. 18+ only.',
    intensity: 'Intense',
    time: '30-60 MIN',
  },
  {
    id: 'all',
    label: 'MIX IT ALL',
    icon: 'shuffle',
    color: '#f0edf1',
    desc: 'A curated shuffle of every mode. The ultimate Electric Nocturne experience.',
    intensity: 'Varies',
    time: '30-60 MIN',
  },
];

// ─────────────────────────────────────────────
// CHALLENGE DATA
// ─────────────────────────────────────────────

const CHALLENGES_RAW: Record<string, Omit<Challenge, 'id' | 'mode'>[]> = {
  social: [
    { text: 'Everyone who has a pet, take {sip}!', action: 'Drink up', icon: 'beer', intensity: 1 },
    { text: "Anyone who's been on a date in the last month — drink {sip}!", action: 'Drink up', icon: 'beer', intensity: 1 },
    { text: '{player1} has to describe {player2} in 3 words. {player2} drinks {sip} if they disagree.', action: 'Drink up', icon: 'beer', intensity: 2 },
    { text: "If you've ever ghosted someone… take {small}.", action: 'Drink up', icon: 'beer', intensity: 2 },
    { text: "Everyone who's cried at a film this year, drink {sip}.", action: 'Drink up', icon: 'beer', intensity: 1 },
    { text: "Point at the person you'd least trust with your phone. That person drinks {small}.", action: 'Drink up', icon: 'beer', intensity: 2 },
    { text: "Anyone with a tattoo — show it or drink {small}.", action: 'Show or drink', icon: 'eye', intensity: 2 },
    { text: "If you've ever told someone you were 'on your way' while still in bed — drink {sip}.", action: 'Drink up', icon: 'beer', intensity: 1 },
    { text: '{player1}: name everyone here from most to least likely to be famous. The person ranked last drinks {medium}.', action: 'Drink up', icon: 'beer', intensity: 3 },
    { text: 'Last person to text their ex — take {small} and own it.', action: 'Drink up', icon: 'beer', intensity: 2 },
    { text: "Everyone who's checked their phone in the last 5 minutes, drink {sip}.", action: 'Drink up', icon: 'beer', intensity: 1 },
    { text: '{player1}: what would your group chat say about you behind your back?', action: 'Be honest', icon: 'chatbubble', intensity: 2 },
    { text: 'Stand up! The last player to stand up has to drink {sip}.', action: 'Move it!', icon: 'body', intensity: 1 },
    { text: 'Lava monster! The last person with their feet still on the ground takes {large}.', action: 'Get off the floor!', icon: 'warning', intensity: 2 },
    { text: 'Everyone with a tattoo or piercing, drink {sip}.', action: 'Drink up', icon: 'body', intensity: 1 },
    { text: 'Players who use Twitter/X, drink {sip}.', action: 'Drink up', icon: 'logo-twitter', intensity: 1 },
    { text: "Anyone with a coin in their pocket can give {sip} to anyone who doesn't.", action: 'Check your pockets', icon: 'cash', intensity: 1 },
    { text: 'The player with the most recent birthday, give out {small}.', action: 'Power move', icon: 'gift', intensity: 1 },
    { text: 'Everyone with the letter "O" in their first name, drink {sip}.', action: 'Drink up', icon: 'beer', intensity: 1 },
    { text: 'People in relationships, give {small} to another player.', action: 'Couples tax', icon: 'heart', intensity: 1 },
    { text: 'Blond-haired players, give out {sip}.', action: 'Drink up', icon: 'beer', intensity: 1 },
    { text: "Give out {large} if you're wearing white socks.", action: 'Drink up', icon: 'beer', intensity: 1 },
    { text: 'Rock-paper-scissors! Go around the group, play with the neighbour to your left. Each winner gives {small} to the loser. {player1}, you start.', action: 'Play!', icon: 'hand-left', intensity: 2 },
    { text: "GAME — Video game consoles. Go around the group, if you repeat or can't think of one, drink {sip}. {player1}, you start.", action: 'Think fast', icon: 'game-controller', intensity: 2 },
    { text: 'GAME — What rhymes with "ute"? If you repeat a word or can\'t think of one, drink {sip}. {player1}, you start.', action: 'Think fast', icon: 'chatbubble', intensity: 2 },
    { text: '{player1}, give out {sip} for each item of black clothing you\'re wearing.', action: 'Count it up', icon: 'shirt', intensity: 1 },
    { text: 'People over 25, drink {sip}.', action: 'Drink up', icon: 'beer', intensity: 1 },
    { text: '{player1}, show the love! Give {small} to the player you like most.', action: 'Choose wisely', icon: 'heart', intensity: 2 },
    { text: '{player1}, give out {sip} for every other player in the group.', action: 'Power move', icon: 'beer', intensity: 2 },
    { text: "The player who's spent the most of their life in relationships, give out {small}.", action: 'Couple of the year', icon: 'heart', intensity: 2 },
    { text: "If you're single, give {max} to another player.", action: 'Single and thriving', icon: 'beer', intensity: 2 },
    { text: "The player who's been single for the longest time, give out {medium}.", action: 'Power move', icon: 'beer', intensity: 2 },
  ],

  truth: [
    { text: "{player1}: what's the most embarrassing thing in your search history?", action: 'Answer honestly', icon: 'search', intensity: 2 },
    { text: 'Go around the circle — everyone admits the last lie they told.', action: 'Confess', icon: 'eye', intensity: 2 },
    { text: '{player1}: if you had to date someone in this room, who would it be?', action: 'Truth time', icon: 'heart', intensity: 3 },
    { text: 'Everyone reveals their most expensive impulse buy. The biggest spender drinks {sip}.', action: 'Fess up', icon: 'eye', intensity: 2 },
    { text: "{player1}: what's a secret you've never told anyone in this room? Confess or drink {medium}.", action: 'Confess or drink', icon: 'lock-closed', intensity: 3 },
    { text: 'Who here would survive a zombie apocalypse? Vote — lowest votes drinks {sip}.', action: 'Vote', icon: 'hand-left', intensity: 2 },
    { text: "{player1}: what's your most ridiculous dealbreaker in relationships?", action: 'Spill it', icon: 'eye', intensity: 2 },
    { text: "Everyone confesses something they've never told their parents. Skip = drink {small}.", action: 'Confess', icon: 'eye', intensity: 3 },
    { text: '{player1}: rate everyone in the room on how likely they are to be a secret agent. Lowest-rated drinks {sip}.', action: 'Rate them', icon: 'star', intensity: 2 },
    { text: "What's the most embarrassing thing you've done sober? {player1} goes first.", action: 'Tell all', icon: 'eye', intensity: 2 },
    { text: "Drink {small} if you've ever had your partner stolen by one of your friends.", action: 'That hurts', icon: 'heart-dislike', intensity: 2 },
    { text: '{player1}, if you had to live on a desert island with only one person here, who would it be? The lucky winner gives out {large}.', action: 'Choose!', icon: 'sunny', intensity: 2 },
    { text: '{player1}: talk about a romantic gesture you\'ve made recently, or take {medium}.', action: 'Spill it', icon: 'heart', intensity: 2 },
    { text: '{player1}: find 2 reasons {player2} will be allowed into heaven. If you can, give out {large}. If not, you take them.', action: 'Make the case', icon: 'star', intensity: 2 },
    { text: '{player1}: who here lets their hair down the least on a night out? Name them — they take {large}.', action: 'Call it out', icon: 'eye', intensity: 3 },
    { text: 'Drink {sip} if you\'ve written a poem for someone since you were 15. {player1} goes first.', action: 'Romantic or what?', icon: 'heart', intensity: 2 },
    { text: '{player1}: give {small} to the person you find most attractive here.', action: 'Choose wisely', icon: 'heart', intensity: 3 },
    { text: '{player1}: if you\'re here without your partner tonight, give out {medium}. If you\'re single or they\'re with you, you take them.', action: 'Honesty hour', icon: 'heart', intensity: 2 },
    { text: '{player1}: give out {sip} for each sibling you have.', action: 'Family matters', icon: 'people', intensity: 1 },
  ],

  dare: [
    { text: "{player1}: do your best impression of someone in this room. Everyone votes — if you fail, drink {sip}.", action: 'Perform!', icon: 'happy', intensity: 2 },
    { text: 'Next person to speak drinks {sip}. Game starts NOW.', action: 'Stay silent', icon: 'volume-mute', intensity: 2 },
    { text: '{player1}: text the 5th contact in your phone something random. Show the group.', action: 'Do it!', icon: 'chatbubble', intensity: 3 },
    { text: 'Everyone does their most embarrassing dance move. Worst one drinks {sip}.', action: 'Get moving', icon: 'musical-notes', intensity: 2 },
    { text: '{player1}: speak in an accent for the next 3 rounds or drink {sip} every round you break it.', action: 'Choose wisely', icon: 'mic', intensity: 2 },
    { text: 'First person to make another player genuinely laugh wins. Everyone else drinks {sip}.', action: 'Be funny', icon: 'happy', intensity: 2 },
    { text: '{player1}: post a story on Instagram right now. Others choose what it says.', action: 'Post it!', icon: 'share-social', intensity: 3 },
    { text: 'Everyone sings the chorus of the last song they listened to. Most off-key drinks {small}.', action: 'Sing!', icon: 'mic', intensity: 2 },
    { text: '{player1}: swap phones with {player2} for the next round. What you find stays secret.', action: 'Swap!', icon: 'phone-portrait', intensity: 3 },
    { text: "Everyone has 30 seconds to do their best celebrity impression. Group votes — worst drinks {sip}.", action: 'Perform!', icon: 'happy', intensity: 2 },
    { text: '{player1}: kiss {player2} or drink {sip}.', action: 'Your call', icon: 'heart', intensity: 3 },
    { text: '{player1}: do a 5-second tap dance or drink {sip}.', action: 'Dance!', icon: 'musical-notes', intensity: 2 },
    { text: '{player1}: challenge {player2} to a thumb war. The loser takes {max}.', action: 'Fight!', icon: 'hand-left', intensity: 2 },
    { text: '{player1}: let {player2} pinch your cheek, or drink {sip}.', action: 'Brave enough?', icon: 'happy', intensity: 2 },
    { text: 'Give out {large} if you can suck your big toe right now.', action: 'Prove it', icon: 'body', intensity: 2 },
    { text: 'The first person to volunteer for a maximum penalty can also give one out.', action: "Who's brave?", icon: 'flame', intensity: 3 },
    { text: "{player1}: if your feet are smaller than {player2}'s, drink {sip}. If not, give out {large}.", action: 'Compare!', icon: 'body', intensity: 2 },
    { text: "{player1}: lick {player2}'s cheek or drink {sip}.", action: 'Bold move', icon: 'happy', intensity: 3 },
    { text: '{player1}: give as many sips as you want to {player2} (up to {large}).', action: 'Power move', icon: 'beer', intensity: 2 },
    { text: 'The first person to pull out a condom can give out {large}.', action: "Who's prepared?", icon: 'shield', intensity: 2 },
  ],

  drink: [
    { text: "Anyone who's had more than 3 drinks tonight already — take {sip} more.", action: 'Cheers', icon: 'wine', intensity: 1 },
    { text: 'Waterfall! {player1} starts drinking, everyone follows clockwise. Stop only when the person before you stops.', action: 'Waterfall!', icon: 'beer', intensity: 3 },
    { text: 'Thumb game — {player1} silently puts their thumb on the table. Last person to notice drinks {sip}.', action: 'Watch closely', icon: 'hand-left', intensity: 1 },
    { text: "Everyone drinks {sip} if they've eaten fast food in the last 24 hours.", action: 'Drink up', icon: 'fast-food', intensity: 1 },
    { text: '{player1} picks two people who must race to finish their drink.', action: 'Race!', icon: 'trophy', intensity: 2 },
    { text: "Anyone who's ordered a takeaway alone this week — drink {sip} and respect yourself.", action: 'Drink up', icon: 'pizza', intensity: 1 },
    { text: 'Everyone drinks {sip} for every notification on their phone right now.', action: 'Check your phone', icon: 'notifications', intensity: 2 },
    { text: '{player1} gives out {large} — distribute however you want among the group.', action: 'Power move', icon: 'beer', intensity: 2 },
    { text: "If you've sent a voice note in the last week, drink {sip}.", action: 'Drink up', icon: 'mic', intensity: 1 },
    { text: '{player1}: never have I ever — say something and anyone who has done it drinks {sip}.', action: 'Never have I ever', icon: 'hand-left', intensity: 2 },
    { text: "Drink {small} if you've ever gotten drunk alone.", action: 'Drink up', icon: 'wine', intensity: 2 },
    { text: "Give out {large} if you've ever left the continent you were born on.", action: 'Jet-setter tax', icon: 'airplane', intensity: 1 },
    { text: "Drink {sip} if you've ever gone horseback riding.", action: 'Giddy up', icon: 'beer', intensity: 1 },
    { text: 'Drink {sip} if you sleep like a baby after sex.', action: 'Out cold', icon: 'moon', intensity: 2 },
    { text: "Drink {sip} if you've ever changed your hair colour.", action: 'Drink up', icon: 'color-palette', intensity: 1 },
    { text: "GAME — Drugs. If you repeat or can't think of one, drink {sip}. {player1}, you start.", action: 'Think fast', icon: 'medkit', intensity: 2 },
    { text: 'Anyone with a pack of cigarettes — drink {sip} per cigarette (8 max).', action: "That's on you", icon: 'flame', intensity: 2 },
    { text: '{player1}: take {sip} and give out {max}.', action: 'Power play', icon: 'beer', intensity: 2 },
    { text: '{player1}: give out {sip} for every person in the group.', action: 'Share the love', icon: 'beer', intensity: 2 },
  ],

  wild: [
    { text: '{player1}: show the group your most recent photo. Explain it or drink {medium}.', action: 'Show or drink', icon: 'camera', intensity: 3 },
    { text: 'Most controversial opinion wins. Group votes — worst take drinks {small}.', action: 'Hot take!', icon: 'flame', intensity: 3 },
    { text: '{player1}: read your last DM out loud, or drink {max}.', action: 'Risk it', icon: 'chatbubble', intensity: 3 },
    { text: 'Hot takes round. Go clockwise — weakest take drinks {medium}.', action: 'Hot take!', icon: 'flame', intensity: 3 },
    { text: '{player1}: rank everyone by how wild their night would be without inhibitions.', action: "Rank 'em", icon: 'podium', intensity: 3 },
    { text: 'Everyone confesses their most chaotic life decision. Group picks the wildest — they pour a round for everyone.', action: 'Chaos stories', icon: 'flame', intensity: 3 },
    { text: '{player1}: what is the shadiest thing you have ever done? No lying. Drink {sip} first for courage.', action: 'Confess', icon: 'flame', intensity: 3 },
    { text: 'Group vote: who is most likely to be a secret millionaire? That person gives out {medium}.', action: 'Vote', icon: 'trophy', intensity: 3 },
    { text: "Drink {sip} if your current partner is the best in bed you've ever had. (If they're not — we advise you to pretend!)", action: 'Drink up', icon: 'flame', intensity: 3 },
    { text: "Drink {sip} if your last ex was the best in bed you've ever had.", action: "That's awkward", icon: 'flame', intensity: 3 },
    { text: "Drink {small} if you've ever had multiple situationships at the same time.", action: 'Drink up', icon: 'flame', intensity: 3 },
    { text: "Drink {small} if you've ever hooked up with someone you met through a dating app.", action: 'Modern romance', icon: 'phone-portrait', intensity: 3 },
    { text: "Take as many sips as there are people in this room you'd consider sleeping with.", action: 'Count carefully', icon: 'flame', intensity: 3 },
    { text: "Drink {small} if you've ever measured yourself or a partner. You know what we mean.", action: 'Drink up', icon: 'flame', intensity: 3 },
    { text: '{player1}: take {sip} and let {player2} roast you for 30 seconds.', action: 'Take it', icon: 'flame', intensity: 3 },
  ],
};

export const ALL_CHALLENGES: Challenge[] = [];
Object.entries(CHALLENGES_RAW).forEach(([mode, list]) => {
  list.forEach((c, i) => {
    ALL_CHALLENGES.push({ ...c, mode, id: `${mode}-${i}` });
  });
});

export function getChallengePool(mode: string): Challenge[] {
  if (mode === 'all') return ALL_CHALLENGES;
  return ALL_CHALLENGES.filter(c => c.mode === mode);
}

export function substituteTokens(
  text: string,
  players: { name: string }[],
  ctx: PenaltyContext = {}
): string {
  if (players.length === 0) return text;

  const shuffled = [...players].sort(() => Math.random() - 0.5);
  let result = text
    .replace(/{player1}/g, shuffled[0].name)
    .replace(/{player2}/g, shuffled.length > 1 ? shuffled[1].name : shuffled[0].name);

  result = result
    .replace(/{sip}/g,    formatPenalty(getPenalty('sip',    ctx)))
    .replace(/{small}/g,  formatPenalty(getPenalty('small',  ctx)))
    .replace(/{medium}/g, formatPenalty(getPenalty('medium', ctx)))
    .replace(/{large}/g,  formatPenalty(getPenalty('large',  ctx)))
    .replace(/{max}/g,    formatPenalty(getPenalty('max',    ctx)));

  return result;
}