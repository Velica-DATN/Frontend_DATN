/**
 * Simulate realistic API latency to test loading states and preview animations.
 * Default: 200ms - 400ms for responsive previewing.
 */
export const mockDelay = (min = 150, max = 350): Promise<void> =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
  );
