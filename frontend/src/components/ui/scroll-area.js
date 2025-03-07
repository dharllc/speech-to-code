import React, { useState, useEffect, useRef } from 'react';

const ScrollArea = ({ className, children, ...props }) => {
  const scrollAreaRef = useRef(null);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const [scrollerHeight, setScrollerHeight] = useState(20);
  const [hovering, setHovering] = useState(false);
  
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      setScrollPos(scrollPercentage * (clientHeight - scrollerHeight));
      setShowScrollbar(scrollHeight > clientHeight);
    };
    
    // Initial check
    handleScroll();
    
    // Re-check on scroll
    scrollArea.addEventListener('scroll', handleScroll);
    
    // Re-check on resize
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(scrollArea);
    
    return () => {
      scrollArea.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [scrollerHeight]);
  
  const scrollbarStyles = {
    opacity: (showScrollbar && hovering) ? 1 : 0,
    transition: 'opacity 0.2s',
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '8px',
    padding: '2px',
  };
  
  const scrollerStyles = {
    position: 'absolute',
    right: '2px',
    width: '4px',
    height: `${scrollerHeight}px`,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '3px',
    transform: `translateY(${scrollPos}px)`,
  };

  return (
    <div 
      className={`relative overflow-hidden ${className || ''}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      {...props}
    >
      <div 
        ref={scrollAreaRef}
        className="h-full overflow-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
      <div style={scrollbarStyles}>
        <div style={scrollerStyles} />
      </div>
    </div>
  );
};

export { ScrollArea }; 