/**
 * BackgroundAnimation Component
 * Provides animated background effects for the application
 */

import React, { useEffect } from 'react';
import './backgroundanimation.css';

const BackgroundAnimation = () => {
  useEffect(() => {
    // Create and initialize floating particles
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    const particleCount = 30;

    // Clear existing particles
    particlesContainer.innerHTML = '';

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 15 + 's';
      particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
      
      // Randomly assign orange or blue color
      if (Math.random() > 0.5) {
        particle.style.setProperty('--particle-color', '#00B2FF');
        particle.style.background = '#00B2FF';
      }
      
      particlesContainer.appendChild(particle);
    }

    // Cleanup function
    return () => {
      if (particlesContainer) {
        particlesContainer.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="background-animation-container">
      {/* Grid Background */}
      <div className="grid-bg"></div>
      
      {/* Gradient Overlay */}
      <div className="gradient-overlay"></div>
      
      {/* Scanlines */}
      <div className="scanlines"></div>

      {/* Animated Shapes */}
      <div className="shapes-container">
        <div className="shape shape-circle"></div>
        <div className="shape shape-triangle"></div>
        <div className="shape shape-square"></div>
      </div>

      {/* Floating Particles */}
      <div id="particles"></div>
    </div>
  );
};
export default BackgroundAnimation;