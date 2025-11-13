"use client"

import React, { useEffect } from "react"
import "./backgroundanimation.css"

export default function BackgroundAnimation() {
  useEffect(() => {
    const particlesContainer = document.getElementById("particles")
    if (!particlesContainer) return

    const particleCount = 30
    particlesContainer.innerHTML = ""

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div")
      particle.className = "particle"
      particle.style.left = Math.random() * 100 + "%"
      particle.style.animationDelay = Math.random() * 15 + "s"
      particle.style.animationDuration = Math.random() * 10 + 15 + "s"

      if (Math.random() > 0.5) {
        particle.style.setProperty("--particle-color", "#00B2FF")
        particle.style.background = "#00B2FF"
      }

      particlesContainer.appendChild(particle)
    }

    return () => {
      if (particlesContainer) {
        particlesContainer.innerHTML = ""
      }
    }
  }, [])

  return (
    <div className="background-animation-container">
      <div className="grid-bg"></div>
      <div className="gradient-overlay"></div>
      <div className="scanlines"></div>

      <div className="shapes-container">
        <div className="shape shape-circle"></div>
        <div className="shape shape-triangle"></div>
        <div className="shape shape-square"></div>
      </div>

      <div id="particles"></div>
    </div>
  )
}
