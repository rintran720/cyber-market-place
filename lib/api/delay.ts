export const delay = (min = 300, max = 800): Promise<void> =>
  new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
