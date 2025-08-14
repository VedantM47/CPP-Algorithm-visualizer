// Main JavaScript for KEA Algorithm Visualizer
document.addEventListener("DOMContentLoaded", () => {
  console.log("KEA Algorithm Visualizer loaded")

  // Get button elements
  const inputCodeBtn = document.getElementById("inputCodeBtn")
  const standardAlgorithmsBtn = document.getElementById("standardAlgorithmsBtn")

  // Add click event listeners
  inputCodeBtn.addEventListener("click", () => {
    console.log("Input Your Code clicked")
    window.location.href = "code-editor.html"
  })

  standardAlgorithmsBtn.addEventListener("click", () => {
    console.log("Standard Algorithms clicked")
    window.location.href = "algorithm-library.html"
  })

  const featureCards = document.querySelectorAll(".feature-card")
  featureCards.forEach((card, index) => {
    card.style.cursor = "pointer"
    card.addEventListener("click", () => {
      const featureTitle = card.querySelector("h4").textContent

      switch (featureTitle) {
        case "Step-by-Step Execution":
          window.location.href = "step-by-step.html"
          break
        case "Custom Code Input":
          window.location.href = "code-editor.html"
          break
        case "Algorithm Library":
          window.location.href = "algorithm-library.html"
          break
        case "Browser-Based":
          window.location.href = "Browwser-based.html"
          break
        default:
          console.log(`Feature clicked: ${featureTitle}`)
      }
    })

    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-4px)"
    })

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)"
    })
  })

  // Animate the preview bars on page load
  animatePreviewBars()

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })
})

function animatePreviewBars() {
  const bars = document.querySelectorAll(".bar")
  let currentIndex = 0

  function highlightNextBars() {
    // Reset all bars
    bars.forEach((bar) => bar.classList.remove("active"))

    // Highlight current pair (simulating comparison)
    if (currentIndex < bars.length - 1) {
      bars[currentIndex].classList.add("active")
      bars[currentIndex + 1].classList.add("active")
    }

    currentIndex = (currentIndex + 1) % (bars.length - 1)
    if (currentIndex === 0) {
      setTimeout(highlightNextBars, 2000) // Pause before restarting
    } else {
      setTimeout(highlightNextBars, 1500)
    }
  }

  // Start animation after a short delay
  setTimeout(highlightNextBars, 1000)
}

// Utility functions for future use
const Utils = {
  // Function to create page transitions
  navigateToPage: (pageName) => {
    console.log(`Navigating to ${pageName}`)
    // TODO: Implement page routing in later steps
  },

  // Function to show loading states
  showLoading: (element) => {
    element.style.opacity = "0.6"
    element.style.pointerEvents = "none"
  },

  hideLoading: (element) => {
    element.style.opacity = "1"
    element.style.pointerEvents = "auto"
  },
}
