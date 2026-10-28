/** Business limits. Change here to adjust the whole app. */
export const LIMITS = {
  maxActiveHabits: 10,
  maxActiveGoals: 10,
} as const;

export const goalLimitMessage = `You've reached your limit of ${LIMITS.maxActiveGoals} active goals. Archive or complete an existing goal to create another.`;

export const habitLimitMessage = `You've reached your limit of ${LIMITS.maxActiveHabits} active habits. Archive or remove an existing habit to create another.`;