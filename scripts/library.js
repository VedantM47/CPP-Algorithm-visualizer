// Algorithm Library JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Tab switching functionality
  const tabButtons = document.querySelectorAll(".tab-btn")
  const algorithmGrids = document.querySelectorAll(".algorithms-grid")

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all tabs
      tabButtons.forEach((tab) => tab.classList.remove("active"))
      // Add active class to clicked tab
      button.classList.add("active")

      // Hide all algorithm grids
      algorithmGrids.forEach((grid) => grid.classList.add("hidden"))
      // Show selected category grid
      const category = button.getAttribute("data-category")
      document.getElementById(category).classList.remove("hidden")
    })
  })

  // Algorithm card interactions
  const visualizeButtons = document.querySelectorAll(".action-btn.primary")
  const viewCodeButtons = document.querySelectorAll(".action-btn.secondary")

  visualizeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const algorithmName = e.target.closest(".algorithm-card").querySelector("h4").textContent
      // Redirect to code editor with pre-loaded algorithm
      window.location.href = `code-editor.html?algorithm=${encodeURIComponent(algorithmName)}`
    })
  })

  viewCodeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const algorithmName = e.target.closest(".algorithm-card").querySelector("h4").textContent
      // Show code modal or redirect to code view
      showAlgorithmCode(algorithmName)
    })
  })

  // Demo controls for step-by-step page
  const demoButtons = document.querySelectorAll(".demo-btn")
  demoButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const buttonText = e.target.textContent.trim()

      if (buttonText.includes("Try Full Editor")) {
        window.location.href = "code-editor.html"
      } else {
        // Handle demo playback controls
        console.log(`Demo control: ${buttonText}`)
      }
    })
  })
})

function showAlgorithmCode(algorithmName) {
  // This would show a modal with the algorithm code
  // For now, just redirect to editor with the algorithm
  window.location.href = `code-editor.html?algorithm=${encodeURIComponent(algorithmName)}`
}
