// Challenge templates and task categories

export type TaskCategory = "body" | "mind" | "diet" | "build" | "other";

export const TASK_CATEGORIES: Record<TaskCategory, { label: string; color: string }> = {
  body:  { label: "Body",  color: "#D4922A" },
  mind:  { label: "Mind",  color: "#4A8FD4" },
  diet:  { label: "Diet",  color: "#5DBF8A" },
  build: { label: "Build", color: "#BF5DBF" },
  other: { label: "Other", color: "var(--text-2)" },
};

export type TemplateKpi = { key: string; label: string; cat: TaskCategory };

export type Template = {
  id: string;
  name: string;
  duration: number;
  tag: string;
  kpis: TemplateKpi[];
  blurb: string;
  about: string;
  benefits: string[];
  bestFor: string;
  difficulty: string;
};

export const TEMPLATES: Template[] = [
  {
    id: "75hard",
    name: "75 HARD",
    duration: 75,
    tag: "ENDURANCE",
    kpis: [
      { key: "w1", label: "Workout 1 — 45min", cat: "body" },
      { key: "w2", label: "Workout 2 — 45min", cat: "body" },
      { key: "diet", label: "Stick to diet", cat: "diet" },
      { key: "water", label: "1 gallon water", cat: "diet" },
      { key: "read", label: "Read 10 pages", cat: "mind" },
      { key: "photo", label: "Progress photo", cat: "other" },
    ],
    blurb: "Two-a-day workouts, strict diet, 1 gallon of water, 10 pages of reading. Every day. No days off.",
    about: "75 Hard is a mental toughness program built by Andy Frisella. The premise is simple: complete five daily tasks for 75 consecutive days with zero compromise. Miss a single day and you restart from day one. There are no substitutions, no scaled versions, no excuses.",
    benefits: [
      "Builds ironclad daily discipline",
      "Significant physical transformation",
      "Proven mental resilience framework",
      "Develops non-negotiation with yourself",
    ],
    bestFor: "People who need an external framework to force the habit of showing up. Especially effective if you've tried and quit challenges before.",
    difficulty: "Hard",
  },
  {
    id: "30day",
    name: "30 DAY HARD",
    duration: 30,
    tag: "FOUNDATION",
    kpis: [
      { key: "workout", label: "Workout", cat: "body" },
      { key: "diet", label: "Clean eating", cat: "diet" },
      { key: "mindset", label: "Mindset work", cat: "mind" },
    ],
    blurb: "The accessible entry point. 30 days of workouts, clean eating, and mindset work. Build the foundation.",
    about: "A stripped-back version of the 75 Hard structure, designed for people who are building habits from scratch or coming back after a long break. Three tasks daily for 30 days — enough to feel the compound effect without the extreme commitment.",
    benefits: [
      "Entry-level structure for beginners",
      "Builds the three pillars: body, diet, mind",
      "Short enough to commit to fully",
      "Establishes baseline discipline",
    ],
    bestFor: "First-time challengers, people returning from injury or burnout, or anyone who wants a clear 30-day reset.",
    difficulty: "Moderate",
  },
  {
    id: "10apps",
    name: "10 APPS / 10 DAYS",
    duration: 10,
    tag: "BUILDER",
    kpis: [
      { key: "shipped", label: "App shipped", cat: "build" },
      { key: "deployed", label: "Deployed live", cat: "build" },
      { key: "docs", label: "Documented", cat: "build" },
    ],
    blurb: "Ship one working, deployed app every single day for 10 days. Speed over perfection.",
    about: "A builder's sprint designed to break perfectionism and force rapid shipping. Each day you must design, build, deploy, and document a working app. The constraints are the point — you learn more shipping 10 imperfect things than agonising over one perfect one.",
    benefits: [
      "Destroys perfectionism fast",
      "Forces scope discipline",
      "Builds a portfolio in 10 days",
      "Rapid skill compression under pressure",
    ],
    bestFor: "Developers who overthink, people learning to build, or anyone who wants to prove to themselves they can actually ship.",
    difficulty: "Intense",
  },
  {
    id: "noai",
    name: "30 DAYS NO AI",
    duration: 30,
    tag: "DISCIPLINE",
    kpis: [
      { key: "no_ai", label: "Zero AI used", cat: "mind" },
      { key: "dw", label: "2hr deep work", cat: "build" },
    ],
    blurb: "No AI tools for 30 days. Two hours of uninterrupted deep work daily. Rebuild your raw thinking.",
    about: "A cognitive recalibration challenge. In a world where AI handles first drafts, debugging, and decision support, this forces you to operate without the crutch. Pair it with mandatory deep work sessions and you'll remember what your brain is actually capable of.",
    benefits: [
      "Rediscovers raw problem-solving ability",
      "Rebuilds deep focus capacity",
      "Exposes AI dependency blind spots",
      "Strengthens independent thinking",
    ],
    bestFor: "Developers, writers, and knowledge workers who've noticed their thinking has gotten shallower or their tolerance for hard problems has dropped.",
    difficulty: "Moderate",
  },
  {
    id: "custom",
    name: "CUSTOM",
    duration: 30,
    tag: "YOUR RULES",
    kpis: [],
    blurb: "Define your own daily tasks, your own duration, your own rules. Built entirely around your goals.",
    about: "No template fits every person. Custom lets you define exactly what you're committing to — whether that's language learning, sobriety, creative output, athletic training, or anything else. You set the tasks, you set the duration, you set the standard.",
    benefits: [
      "Fully tailored to your specific goal",
      "No irrelevant tasks diluting your focus",
      "Can be as hard or as focused as you need",
      "Grows with you over multiple challenges",
    ],
    bestFor: "Anyone with a clear goal that doesn't fit the pre-built templates. Also good for veterans who've finished other challenges and want to design their next level.",
    difficulty: "You decide",
  },
];

/**
 * Get a template by ID
 */
export const getTemplateById = (id: string): Template | undefined => TEMPLATES.find(t => t.id === id);

/**
 * Get category color for a task. Accepts any string since custom challenges
 * can define arbitrary category keys — falls back to "other" if unrecognized.
 */
export const getCategoryColor = (cat: string): string =>
  TASK_CATEGORIES[cat as TaskCategory]?.color || TASK_CATEGORIES.other.color;
