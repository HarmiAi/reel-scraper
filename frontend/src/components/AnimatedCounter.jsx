import React, { useState, useEffect } from 'react';

const AnimatedCounter = ({ target = 12458 }) => {
  const [count, setCount] = useState(target - 250);

  useEffect(() => {
    let start = target - 250;
    const duration = 1500; // 1.5 seconds
    const startTime = performance.now();

    const updateCount = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      if (elapsedTime < duration) {
        const progress = elapsedTime / duration;
        // Ease out quad
        const easeOutProgress = progress * (2 - progress);
        const currentCount = Math.floor(start + (target - start) * easeOutProgress);
        setCount(currentCount);
        requestAnimationFrame(updateCount);
      } else {
        setCount(target);
      }
    };

    requestAnimationFrame(updateCount);
  }, [target]);

  // Format count with commas
  const formattedCount = count.toLocaleString();

  return (
    <div className="animated-counter-container">
      <span className="counter-number text-gradient">{formattedCount}</span>
      <span className="counter-label">Reels Downloaded</span>
    </div>
  );
};

export default AnimatedCounter;
