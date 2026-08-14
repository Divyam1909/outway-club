/**
 * The two-minute form that sits in front of every booking.
 *
 * One file, read by four places: the form the traveller fills in, the API
 * route that validates the answers, the ops email, and the admin screen that
 * groups people by them. Anything hard-coded in only one of those four drifts
 * within a month, so nothing is.
 *
 * IMPORTANT: every id in QUESTIONNAIRE is a column name in `trip_requests`
 * (supabase/migrations/0006_trip_requests.sql). Adding a question here without
 * adding the column there will make submissions fail.
 */

export interface Choice {
  value: string;
  label: string;
  /** One line under the label. Optional, and short. */
  hint?: string;
}

export interface Question {
  id: string;
  label: string;
  help?: string;
  /** Which step of the form asks it. Keeps each screen to three questions. */
  section: "style" | "you";
  options: readonly Choice[];
}

/**
 * Printed under anything that quotes a clock time. Itineraries move: a temple
 * closes early, the ghat road floods, a flight lands late. Saying so once, in
 * the same words everywhere, is more honest than pretending 5:30 PM is a
 * promise.
 */
export const TIMINGS_NOTE =
  "All timings are indicative and subject to change with weather, traffic, local conditions and monument hours.";

/** Short form of the same, for tight spaces. */
export const TIMINGS_NOTE_SHORT = "Timings are indicative and subject to change.";

// ---------------------------------------------------------------------------
// Getting to the start point
// ---------------------------------------------------------------------------

/**
 * Where people are travelling in from. Ordered by how many travellers we
 * actually see from each, not alphabetically — the top of the list should be
 * one tap for most people.
 */
export const ORIGIN_CITIES = [
  { value: "delhi", label: "Delhi NCR" },
  { value: "mumbai", label: "Mumbai" },
  { value: "bengaluru", label: "Bengaluru" },
  { value: "pune", label: "Pune" },
  { value: "ahmedabad", label: "Ahmedabad" },
  { value: "jaipur", label: "Jaipur" },
  { value: "hyderabad", label: "Hyderabad" },
  { value: "kolkata", label: "Kolkata" },
  { value: "chennai", label: "Chennai" },
  { value: "indore", label: "Indore" },
  { value: "surat", label: "Surat" },
  { value: "chandigarh", label: "Chandigarh" },
  { value: "local", label: "I'm already there" },
  { value: "other", label: "Another city" },
] as const satisfies readonly Choice[];

/**
 * The one thing people actually write in asking about. Booking the flight or
 * train is not included in the trip price — we book it on their behalf and
 * they pay the fare, which is why "quote me first" is a separate answer from
 * "yes, book it".
 */
export const TRAVEL_HELP_OPTIONS = [
  {
    value: "book_flight",
    label: "Book my flight",
    hint: "We book it with the group and you pay the fare.",
  },
  {
    value: "book_train",
    label: "Book my train",
    hint: "Sleeper or 3AC, whatever's running that weekend.",
  },
  {
    value: "book_best",
    label: "Book whichever works out better",
    hint: "We'll compare both and come back with the options.",
  },
  {
    value: "quote_first",
    label: "Quote me first, then I'll decide",
    hint: "No commitment, just the fares.",
  },
  {
    value: "own",
    label: "I'll travel on my own",
    hint: "You book it, we'll tell you when to land and leave.",
  },
] as const satisfies readonly Choice[];

// ---------------------------------------------------------------------------
// The questionnaire
// ---------------------------------------------------------------------------

/**
 * Not a personality test — a grouping tool. Eighteen people on one bus works
 * when they wanted roughly the same weekend, and falls apart when half came to
 * rest and half came to drink. These six questions are the ones that predict
 * that.
 */
export const QUESTIONNAIRE = [
  {
    id: "travel_style",
    label: "What are you coming for?",
    help: "There's no right answer. It just tells us who you'll enjoy travelling with.",
    section: "style",
    options: [
      {
        value: "fun",
        label: "Fun and good company",
        hint: "The people matter more than the monuments.",
      },
      {
        value: "explore",
        label: "To explore the place properly",
        hint: "See it, learn it, don't miss the good stuff.",
      },
      {
        value: "reset",
        label: "To slow down",
        hint: "Rest, food, a view, nothing rushed.",
      },
      {
        value: "adventure",
        label: "Adventure and the outdoors",
        hint: "Early starts, long walks, happy to get wet.",
      },
      {
        value: "create",
        label: "Photos and content",
        hint: "Good light, and time at the spots worth shooting.",
      },
    ],
  },
  {
    id: "pace",
    label: "How should a day run?",
    section: "style",
    options: [
      { value: "packed", label: "Up early, pack it in" },
      { value: "balanced", label: "Balanced, with rest built in" },
      { value: "slow", label: "Slow mornings, no alarms" },
    ],
  },
  {
    id: "evenings",
    label: "Evenings look like…",
    section: "style",
    options: [
      { value: "late", label: "Music, drinks, late nights" },
      { value: "social", label: "A drink and long conversations" },
      { value: "quiet", label: "Dinner, then an early night" },
      { value: "flexible", label: "Whatever the group is doing" },
    ],
  },
  {
    id: "group_type",
    label: "Who's travelling?",
    section: "you",
    options: [
      { value: "solo", label: "Just me" },
      { value: "friend", label: "Me and one friend" },
      { value: "couple", label: "As a couple" },
      { value: "friends", label: "A group of friends" },
      { value: "family", label: "With family" },
    ],
  },
  {
    id: "social_energy",
    label: "A group of strangers for a few days…",
    section: "you",
    options: [
      { value: "here_for_it", label: "Is the main reason I'm coming" },
      { value: "warm", label: "Sounds good, I'll want some quiet too" },
      { value: "reserved", label: "I'd rather mostly keep to my own people" },
    ],
  },
  {
    id: "age_band",
    label: "Your age group",
    help: "Used only to keep a group roughly in the same phase of life.",
    section: "you",
    options: [
      { value: "18_22", label: "18 – 22" },
      { value: "23_27", label: "23 – 27" },
      { value: "28_34", label: "28 – 34" },
      { value: "35_45", label: "35 – 45" },
      { value: "45_plus", label: "45+" },
    ],
  },
] as const satisfies readonly Question[];

/** Every questionnaire answer is required, so this is also the required list. */
export const QUESTION_IDS = QUESTIONNAIRE.map((question) => question.id);

/** The questions one step of the form is responsible for. */
export function questionsInSection(section: Question["section"]): Question[] {
  return QUESTIONNAIRE.filter((question) => question.section === section);
}

// ---------------------------------------------------------------------------
// Lookups, shared by the emails and the admin screen
// ---------------------------------------------------------------------------

function toLabelMap(options: readonly Choice[]): Record<string, string> {
  return Object.fromEntries(options.map((option) => [option.value, option.label]));
}

const LABELS: Record<string, Record<string, string>> = {
  origin_city: toLabelMap(ORIGIN_CITIES),
  travel_help: toLabelMap(TRAVEL_HELP_OPTIONS),
  ...Object.fromEntries(QUESTIONNAIRE.map((q) => [q.id, toLabelMap(q.options)])),
};

/**
 * Turns a stored value back into the words the traveller actually read.
 * Falls back to the raw value so an answer recorded before an option was
 * renamed still shows something rather than an empty cell.
 */
export function answerLabel(field: string, value: string | null | undefined): string {
  if (!value) return "—";
  return LABELS[field]?.[value] ?? value;
}

export function isValidAnswer(field: string, value: unknown): value is string {
  return typeof value === "string" && Boolean(LABELS[field]?.[value]);
}

/** Human label for a question id, used in emails and the admin list. */
export function questionLabel(id: string): string {
  return QUESTIONNAIRE.find((question) => question.id === id)?.label ?? id;
}
