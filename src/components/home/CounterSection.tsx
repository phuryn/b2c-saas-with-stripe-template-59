
import React, { useState, useEffect, useRef } from "react";

const CounterSection: React.FC = () => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimationReady, setIsAnimationReady] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const targetCount = 109016;
  const animationDuration = 2000; // milliseconds
  
  useEffect(() => {
    // Initialize visibility state
    setIsVisible(false);
    
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setIsVisible(true);
        // Add a slight delay before setting animation ready
        setTimeout(() => {
          setIsAnimationReady(true);
        }, 50);
      }
    }, { threshold: 0.2 });
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (!isVisible) return;
    
    let startTimestamp: number | null = null;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      
      const progress = Math.min((timestamp - startTimestamp) / animationDuration, 1);
      const currentCount = Math.floor(progress * targetCount);
      
      setCount(currentCount);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [isVisible]);
  
  const formattedCount = count.toLocaleString();
  
  return (
    <section className="section-padding bg-primary-blue text-white" ref={sectionRef}>
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div 
            className={`text-5xl md:text-7xl font-bold mb-6 animate-fade-up ${isAnimationReady ? 'animate-ready' : ''}`}
          >
            {formattedCount}
          </div>
          <p 
            className={`text-xl md:text-2xl animate-fade-up ${isAnimationReady ? 'animate-ready' : ''}`}
            style={{ transitionDelay: "0.3s" }}
          >
            subscribers from companies like Amazon, Google, and Meta
          </p>
        </div>
      </div>
    </section>
  );
};

export default CounterSection;
