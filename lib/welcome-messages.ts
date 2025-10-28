export type WelcomeMessage = {
  id: number;
  message: string;
};

const welcomeMessages: WelcomeMessage[] = [
  // MECHANICAL/TECHNICAL (10 messages)
  {
    id: 1,
    message: "boost pressure: stable.",
  },
  {
    id: 2,
    message: "compression ratio: approved.",
  },
  {
    id: 3,
    message: "timing advanced. ready.",
  },
  {
    id: 4,
    message: "wastegate closed. you're in.",
  },
  {
    id: 5,
    message: "intercooler efficiency: 100%.",
  },
  {
    id: 6,
    message: "vtec kicked in.",
  },
  {
    id: 7,
    message: "turbo spooled. hold on.",
  },
  {
    id: 8,
    message: "fuel pump primed.",
  },
  {
    id: 9,
    message: "launch control: armed.",
  },
  {
    id: 10,
    message: "redline approved.",
  },

  // INSIDER/COMMUNITY (10 messages)
  {
    id: 11,
    message: "the pre-grid is filling up.",
  },
  {
    id: 12,
    message: "garage door: opened.",
  },
  {
    id: 13,
    message: "you found the dyno sheet.",
  },
  {
    id: 14,
    message: "pit crew: +1.",
  },
  {
    id: 15,
    message: "grid position secured.",
  },
  {
    id: 16,
    message: "paddock access: granted.",
  },
  {
    id: 17,
    message: "tech inspection: passed.",
  },
  {
    id: 18,
    message: "restricted class: removed.",
  },
  {
    id: 19,
    message: "the build list got longer.",
  },
  {
    id: 20,
    message: "somebody gets it.",
  },

  // CRYPTIC/MYSTERIOUS (10 messages)
  {
    id: 21,
    message: "not everyone makes it past this point.",
  },
  {
    id: 22,
    message: "remember this feeling.",
  },
  {
    id: 23,
    message: "you'll wish you screenshot this.",
  },
  {
    id: 24,
    message: "2am. garage lights on. you know.",
  },
  {
    id: 25,
    message: "the archives remember.",
  },
  {
    id: 26,
    message: "we've been expecting you.",
  },
  {
    id: 27,
    message: "your progress is safe now.",
  },
  {
    id: 28,
    message: "the backup existed all along.",
  },
  {
    id: 29,
    message: "deleted but not forgotten.",
  },
  {
    id: 30,
    message: "they can't delete this.",
  },

  // TIME/PATIENCE (10 messages)
  {
    id: 31,
    message: "patience. good things spool slowly.",
  },
  {
    id: 32,
    message: "first gear. hold tight.",
  },
  {
    id: 33,
    message: "the long game starts now.",
  },
  {
    id: 34,
    message: "countdown initiated.",
  },
  {
    id: 35,
    message: "logged. archived. remembered.",
  },
  {
    id: 36,
    message: "the waiting list is now the access list.",
  },
  {
    id: 37,
    message: "you're early. that matters.",
  },
  {
    id: 38,
    message: "filed under: cannot be deleted.",
  },
  {
    id: 39,
    message: "timestamp recorded.",
  },
  {
    id: 40,
    message: "your position is permanent.",
  },

  // EXCLUSIVE/GATEKEEPING (10 messages)
  {
    id: 41,
    message: "not everyone gets through.",
  },
  {
    id: 42,
    message: "verification: complete. access: pending.",
  },
  {
    id: 43,
    message: "clearance level: updated.",
  },
  {
    id: 44,
    message: "you made it to the pre-grid.",
  },
  {
    id: 45,
    message: "restricted section: authorized.",
  },
  {
    id: 46,
    message: "threshold crossed.",
  },
  {
    id: 47,
    message: "entered the pit lane.",
  },
  {
    id: 48,
    message: "you passed tech inspection.",
  },
  {
    id: 49,
    message: "the gate opened for you.",
  },
  {
    id: 50,
    message: "access: granted. status: active.",
  },
];

/**
 * Get a random welcome message
 */
export function getRandomWelcomeMessage(): { id: number; message: string } {
  const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
  const selected = welcomeMessages[randomIndex];
  return { id: selected.id, message: selected.message };
}

/**
 * Get a specific welcome message by ID
 */
export function getWelcomeMessageById(id: number): { id: number; message: string } | null {
  const message = welcomeMessages.find(m => m.id === id);
  return message ? { id: message.id, message: message.message } : null;
}

/**
 * Get all welcome messages (for admin view)
 */
export function getAllMessages(): WelcomeMessage[] {
  return welcomeMessages;
}

