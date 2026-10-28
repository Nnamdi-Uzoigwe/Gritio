/** Collision-resistant local id without extra dependencies. */
export function newId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  const rand2 = Math.random().toString(36).slice(2, 6);
  return `${time}${rand}${rand2}`;
}
