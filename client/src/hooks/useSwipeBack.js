import { useEffect, useRef, useState } from 'react';

/**
 * useSwipeBack - WhatsApp / iOS-style Edge Swipe to Go Back
 * 
 * @param {Function} onBack - Callback function triggered when back swipe completes
 * @param {Object} options
 * @param {number} options.edgeThreshold - Distance from left edge to detect swipe (default: 48px)
 * @param {number} options.minDistance - Minimum horizontal drag to trigger back (default: 75px)
 * @param {boolean} options.enabled - Whether the swipe gesture is active
 */
export function useSwipeBack(onBack, { edgeThreshold = 48, minDistance = 75, enabled = true } = {}) {
  const touchStartRef = useRef({ x: 0, y: 0, isEdgeSwipe: false, time: 0 });
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!enabled || typeof onBack !== 'function') return;

    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      
      // Only initiate if starting within the left edge threshold
      if (touch.clientX <= edgeThreshold) {
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          isEdgeSwipe: true,
          time: Date.now()
        };
      } else {
        touchStartRef.current.isEdgeSwipe = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!touchStartRef.current.isEdgeSwipe || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Cancel if user is primarily scrolling vertically
      if (Math.abs(deltaY) > deltaX * 0.8 && deltaX < 30) {
        touchStartRef.current.isEdgeSwipe = false;
        setIsDragging(false);
        setDragProgress(0);
        return;
      }

      if (deltaX > 0) {
        setIsDragging(true);
        const progress = Math.min(Math.max(deltaX / (window.innerWidth * 0.4), 0), 1);
        setDragProgress(progress);
      }
    };

    const handleTouchEnd = (e) => {
      if (!touchStartRef.current.isEdgeSwipe) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaTime = Date.now() - touchStartRef.current.time;
      const velocity = deltaX / Math.max(deltaTime, 1);

      touchStartRef.current.isEdgeSwipe = false;
      setIsDragging(false);
      setDragProgress(0);

      // Trigger back if distance exceeded OR fast swipe velocity
      if (deltaX >= minDistance || (deltaX > 40 && velocity > 0.4)) {
        onBack();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onBack, edgeThreshold, minDistance, enabled]);

  return { isDragging, dragProgress };
}

export default useSwipeBack;
