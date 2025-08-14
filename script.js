// Import CodeMirror
const CodeMirror = window.CodeMirror

// Initialize CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById("codeEditor"), {
  lineNumbers: true,
  mode: "text/x-c++src",
  theme: "monokai",
  indentUnit: 4,
  lineWrapping: true,
  autoCloseBrackets: true,
  matchBrackets: true,
  extraKeys: {
    "Ctrl-Space": "autocomplete",
    F11: (cm) => {
      cm.setOption("fullScreen", !cm.getOption("fullScreen"))
    },
    Esc: (cm) => {
      if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false)
    },
  },
})

// Get DOM elements
const runBtn = document.getElementById("runBtn")
const resetBtn = document.getElementById("resetBtn")
const stepBtn = document.getElementById("stepBtn")
const clearBtn = document.getElementById("clearBtn")
const outputArea = document.getElementById("outputArea")
const statusText = document.getElementById("statusText")

let isRunning = false
let currentStep = 0

// Run button functionality
runBtn.addEventListener("click", () => {
  if (isRunning) {
    stopExecution()
  } else {
    runCode()
  }
})

// Reset button functionality
resetBtn.addEventListener("click", () => {
  resetEditor()
})

// Step button functionality
stepBtn.addEventListener("click", () => {
  stepThroughCode()
})

// Clear output button
clearBtn.addEventListener("click", () => {
  outputArea.innerHTML =
    '<div style="color: #64748b; font-style: italic;">Output cleared. Ready for next execution.</div>'
  updateStatus("Output cleared")
})

function runCode() {
  const code = editor.getValue()
  if (!code.trim()) {
    updateStatus("Error: No code to execute")
    return
  }

  isRunning = true
  runBtn.textContent = "⏹ Stop"
  runBtn.className = "btn btn-secondary"
  updateStatus("Compiling and executing C++ code...")

  // Simulate compilation and execution
  setTimeout(() => {
    simulateExecution(code)
  }, 1000)
}

function stopExecution() {
  isRunning = false
  runBtn.textContent = "▶ Run Code"
  runBtn.className = "btn btn-primary"
  updateStatus("Execution stopped")
}

function resetEditor() {
  editor.setValue(`#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    // Write your C++ algorithm here
    std::cout << "Hello, Algorithm Visualizer!" << std::endl;
    return 0;
}`)
  outputArea.innerHTML = '<div style="color: #64748b; font-style: italic;">Editor reset. Ready for new code.</div>'
  updateStatus("Editor reset")
  currentStep = 0
}

function stepThroughCode() {
  currentStep++
  updateStatus(`Step ${currentStep}: Analyzing code execution...`)

  // Simulate step-by-step execution
  const stepOutput = `<div style="color: #10b981;">Step ${currentStep}: Executing line ${currentStep + 10}...</div>`
  outputArea.innerHTML += stepOutput
  outputArea.scrollTop = outputArea.scrollHeight
}

function simulateExecution(code) {
  outputArea.innerHTML = ""

  // Simulate compilation
  addOutput("🔧 Compiling C++ code...", "#3b82f6")

  setTimeout(() => {
    addOutput("✅ Compilation successful!", "#10b981")
    addOutput("🚀 Starting execution...", "#3b82f6")

    setTimeout(() => {
      // Simulate program output based on the code
      if (code.includes("Bubble Sort")) {
        simulateBubbleSort()
      } else {
        addOutput("Program output:", "#e2e8f0")
        addOutput("Hello, Algorithm Visualizer!", "#e2e8f0")
      }

      setTimeout(() => {
        addOutput("✅ Execution completed successfully!", "#10b981")
        stopExecution()
        updateStatus("Execution completed")
      }, 1000)
    }, 500)
  }, 1500)
}

function simulateBubbleSort() {
  const steps = [
    "Original array: 64 34 25 12 22 11 90",
    "Step 1: 34 64 25 12 22 11 90",
    "Step 2: 34 25 64 12 22 11 90",
    "Step 3: 34 25 12 64 22 11 90",
    "Step 4: 34 25 12 22 11 64 90",
    "Step 5: 34 25 12 22 11 64 90",
    "Step 6: 25 34 12 22 11 64 90",
    "Step 7: 25 12 34 22 11 64 90",
    "Step 8: 25 12 22 34 11 64 90",
    "Step 9: 25 12 22 11 34 64 90",
    "Sorted array: 11 12 22 25 34 64 90",
  ]

  let stepIndex = 0
  const stepInterval = setInterval(() => {
    if (stepIndex < steps.length && isRunning) {
      addOutput(steps[stepIndex], "#e2e8f0")
      stepIndex++
    } else {
      clearInterval(stepInterval)
    }
  }, 800)
}

function addOutput(text, color = "#e2e8f0") {
  const outputLine = document.createElement("div")
  outputLine.style.color = color
  outputLine.style.marginBottom = "5px"
  outputLine.textContent = text
  outputArea.appendChild(outputLine)
  outputArea.scrollTop = outputArea.scrollHeight
}

function updateStatus(message) {
  statusText.textContent = message
}

// Auto-resize editor
window.addEventListener("resize", () => {
  editor.refresh()
})

// Initialize
setTimeout(() => {
  editor.refresh()
}, 100)
