// Import CodeMirror
const CodeMirror = window.CodeMirror // Declare the variable using global CodeMirror from CDN

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

class CodeAnalyzer {
  constructor() {
    this.currentHighlightedLine = null
  }

  parseCode(code) {
    const analysis = {
      algorithm: this.detectAlgorithm(code),
      arrayData: this.extractArrayData(code),
      hasLoops: this.detectLoops(code),
      complexity: this.estimateComplexity(code),
      errors: this.validateCode(code),
    }
    return analysis
  }

  detectAlgorithm(code) {
    const algorithms = [
      { name: "bubble", patterns: ["bubble", "Bubble Sort", "for.*for.*swap", "arr\\[j\\].*arr\\[j\\+1\\]"] },
      { name: "selection", patterns: ["selection", "Selection Sort", "min.*=.*i", "findMin"] },
      { name: "insertion", patterns: ["insertion", "Insertion Sort", "key.*=.*arr\\[i\\]", "while.*j.*>=.*0"] },
      { name: "merge", patterns: ["merge", "Merge Sort", "mergeSort", "merge$$.*left.*right$$"] },
      { name: "quick", patterns: ["quick", "Quick Sort", "quickSort", "partition", "pivot"] },
      { name: "heap", patterns: ["heap", "Heap Sort", "heapify", "buildHeap"] },
      { name: "linear_search", patterns: ["linear.*search", "Linear Search", "for.*arr\\[i\\].*==.*target"] },
      {
        name: "binary_search",
        patterns: ["binary.*search", "Binary Search", "while.*left.*<=.*right", "mid.*=.*(left.*right)"],
      },
    ]

    for (const algo of algorithms) {
      for (const pattern of algo.patterns) {
        if (new RegExp(pattern, "i").test(code)) {
          return algo.name
        }
      }
    }
    return "unknown"
  }

  extractArrayData(code) {
    const arrayPatterns = [
      /\{([^}]+)\}/g, // {1, 2, 3, 4}
      /arr.*=.*\[([^\]]+)\]/g, // arr = [1, 2, 3, 4]
      /vector<int>.*\{([^}]+)\}/g, // vector<int> arr = {1, 2, 3, 4}
    ]

    for (const pattern of arrayPatterns) {
      const match = pattern.exec(code)
      if (match) {
        const values = match[1]
          .split(",")
          .map((v) => Number.parseInt(v.trim()))
          .filter((v) => !isNaN(v))
        if (values.length > 0) {
          return values
        }
      }
    }
    return null
  }

  detectLoops(code) {
    const loopPatterns = [/for\s*\(/g, /while\s*\(/g, /do\s*\{/g]
    return loopPatterns.some((pattern) => pattern.test(code))
  }

  estimateComplexity(code) {
    const nestedLoops = (code.match(/for\s*\(/g) || []).length
    if (nestedLoops >= 3) return "O(n³)"
    if (nestedLoops >= 2) return "O(n²)"
    if (nestedLoops >= 1) return "O(n)"
    if (code.includes("log") || code.includes("binary")) return "O(log n)"
    return "O(1)"
  }

  validateCode(code) {
    const errors = []

    // Basic syntax checks
    const openBraces = (code.match(/\{/g) || []).length
    const closeBraces = (code.match(/\}/g) || []).length
    if (openBraces !== closeBraces) {
      errors.push("Mismatched braces")
    }

    const openParens = (code.match(/\(/g) || []).length
    const closeParens = (code.match(/\)/g) || []).length
    if (openParens !== closeParens) {
      errors.push("Mismatched parentheses")
    }

    // Check for common issues
    if (!code.includes("main")) {
      errors.push("No main function found")
    }

    if (!code.includes("#include")) {
      errors.push("No include statements found")
    }

    return errors
  }

  highlightLine(lineNumber) {
    if (this.currentHighlightedLine !== null) {
      editor.removeLineClass(this.currentHighlightedLine, "background", "highlighted-line")
    }

    if (lineNumber !== null && lineNumber >= 0) {
      editor.addLineClass(lineNumber, "background", "highlighted-line")
      this.currentHighlightedLine = lineNumber

      // Scroll to highlighted line
      const lineHandle = editor.getLineHandle(lineNumber)
      if (lineHandle) {
        editor.scrollIntoView({ line: lineNumber, ch: 0 })
      }
    }
  }

  clearHighlight() {
    this.highlightLine(null)
  }
}

class AnimationEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId)
    this.ctx = this.canvas.getContext("2d")
    this.isPlaying = false
    this.isPaused = false
    this.currentFrame = 0
    this.totalFrames = 0
    this.animationSpeed = 5
    this.animationId = null
    this.frames = []
    this.onFrameUpdate = null
    this.codeAnalyzer = new CodeAnalyzer()

    // Set canvas size
    this.resizeCanvas()
    window.addEventListener("resize", () => this.resizeCanvas())
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width * window.devicePixelRatio
    this.canvas.height = rect.height * window.devicePixelRatio
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    this.canvas.style.width = rect.width + "px"
    this.canvas.style.height = rect.height + "px"
  }

  setFrames(frames) {
    this.frames = frames
    this.totalFrames = frames.length
    this.currentFrame = 0
    this.updateTimelineSlider()
  }

  play() {
    if (this.frames.length === 0) return

    this.isPlaying = true
    this.isPaused = false
    this.animate()
    this.updateCanvasState("animating")
  }

  pause() {
    this.isPaused = true
    this.isPlaying = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.updateCanvasState("paused")
  }

  stop() {
    this.isPlaying = false
    this.isPaused = false
    this.currentFrame = 0
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.clear()
    this.updateCanvasState("")
    this.codeAnalyzer.clearHighlight()
  }

  stepForward() {
    if (this.currentFrame < this.totalFrames - 1) {
      this.currentFrame++
      this.renderFrame(this.frames[this.currentFrame])
      this.updateFrameInfo()
    }
  }

  stepBackward() {
    if (this.currentFrame > 0) {
      this.currentFrame--
      this.renderFrame(this.frames[this.currentFrame])
      this.updateFrameInfo()
    }
  }

  goToFrame(frameIndex) {
    if (frameIndex >= 0 && frameIndex < this.totalFrames) {
      this.currentFrame = frameIndex
      this.renderFrame(this.frames[this.currentFrame])
      this.updateFrameInfo()
    }
  }

  setSpeed(speed) {
    this.animationSpeed = speed
  }

  animate() {
    if (!this.isPlaying || this.isPaused) return

    const frameDelay = 1000 / this.animationSpeed

    setTimeout(() => {
      if (this.currentFrame < this.totalFrames - 1) {
        this.currentFrame++
        this.renderFrame(this.frames[this.currentFrame])
        this.updateFrameInfo()
        this.animationId = requestAnimationFrame(() => this.animate())
      } else {
        this.isPlaying = false
        this.updateCanvasState("")
        this.codeAnalyzer.clearHighlight()
      }
    }, frameDelay)
  }

  renderFrame(frameData) {
    this.clear()

    if (frameData.type === "array") {
      this.renderArray(frameData)
    } else if (frameData.type === "tree") {
      this.renderTree(frameData)
    } else if (frameData.type === "graph") {
      this.renderGraph(frameData)
    }

    if (frameData.codeLine !== undefined) {
      this.codeAnalyzer.highlightLine(frameData.codeLine)
    }
  }

  renderArray(frameData) {
    const { array, highlights, comparisons, sorted } = frameData
    const canvasWidth = this.canvas.width / window.devicePixelRatio
    const canvasHeight = this.canvas.height / window.devicePixelRatio

    const barWidth = Math.min(60, (canvasWidth - 40) / array.length)
    const maxValue = Math.max(...array)
    const barMaxHeight = canvasHeight - 80

    array.forEach((value, index) => {
      const x = 20 + index * (barWidth + 5)
      const barHeight = (value / maxValue) * barMaxHeight
      const y = canvasHeight - 40 - barHeight

      // Determine bar color with priority order
      let color = "#3b82f6" // Default blue
      if (sorted && sorted.includes(index)) {
        color = "#10b981" // Green for sorted
      } else if (highlights && highlights.includes(index)) {
        color = "#f59e0b" // Orange for highlighted
      } else if (comparisons && comparisons.includes(index)) {
        color = "#ef4444" // Red for comparison
      }

      // Draw bar with gradient effect
      const gradient = this.ctx.createLinearGradient(x, y, x, y + barHeight)
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, this.adjustBrightness(color, -20))

      this.ctx.fillStyle = gradient
      this.ctx.fillRect(x, y, barWidth, barHeight)

      // Draw border
      this.ctx.strokeStyle = this.adjustBrightness(color, -40)
      this.ctx.lineWidth = 1
      this.ctx.strokeRect(x, y, barWidth, barHeight)

      // Draw value text
      this.ctx.fillStyle = "#e2e8f0"
      this.ctx.font = "12px JetBrains Mono"
      this.ctx.textAlign = "center"
      this.ctx.fillText(value.toString(), x + barWidth / 2, canvasHeight - 20)

      // Draw index
      this.ctx.fillStyle = "#64748b"
      this.ctx.font = "10px JetBrains Mono"
      this.ctx.fillText(index.toString(), x + barWidth / 2, canvasHeight - 5)
    })
  }

  renderTree(frameData) {
    // Tree rendering implementation
    this.ctx.fillStyle = "#64748b"
    this.ctx.font = "14px Inter"
    this.ctx.textAlign = "center"
    this.ctx.fillText(
      "Tree visualization coming soon...",
      this.canvas.width / 2 / window.devicePixelRatio,
      this.canvas.height / 2 / window.devicePixelRatio,
    )
  }

  renderGraph(frameData) {
    // Graph rendering implementation
    this.ctx.fillStyle = "#64748b"
    this.ctx.font = "14px Inter"
    this.ctx.textAlign = "center"
    this.ctx.fillText(
      "Graph visualization coming soon...",
      this.canvas.width / 2 / window.devicePixelRatio,
      this.canvas.height / 2 / window.devicePixelRatio,
    )
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  updateCanvasState(state) {
    const canvasArea = document.querySelector(".canvas-area")
    canvasArea.className = `canvas-area ${state}`
  }

  updateFrameInfo() {
    const algorithmInfo = document.getElementById("algorithmInfo")
    const algorithmName = algorithmInfo.querySelector(".algorithm-name")
    const stepCounter = algorithmInfo.querySelector(".step-counter")

    if (this.frames[this.currentFrame]) {
      const frame = this.frames[this.currentFrame]
      algorithmName.textContent = frame.algorithm || "Algorithm Visualizer"
      stepCounter.textContent = `Step: ${this.currentFrame}/${this.totalFrames - 1}`

      // Update timeline
      this.updateTimelineSlider()

      // Update status with frame description
      if (frame.description) {
        updateStatus(frame.description)
      }
    }

    if (this.onFrameUpdate) {
      this.onFrameUpdate(this.currentFrame, this.frames[this.currentFrame])
    }
  }

  updateTimelineSlider() {
    if (timelineSlider && this.totalFrames > 0) {
      timelineSlider.max = this.totalFrames - 1
      timelineSlider.value = this.currentFrame
      timelineInfo.textContent = `${this.currentFrame} / ${this.totalFrames - 1}`
    }
  }

  adjustBrightness(color, amount) {
    const usePound = color[0] === "#"
    const col = usePound ? color.slice(1) : color
    const num = Number.parseInt(col, 16)
    let r = (num >> 16) + amount
    let g = ((num >> 8) & 0x00ff) + amount
    let b = (num & 0x0000ff) + amount
    r = r > 255 ? 255 : r < 0 ? 0 : r
    g = g > 255 ? 255 : g < 0 ? 0 : g
    b = b > 255 ? 255 : b < 0 ? 0 : b
    return (usePound ? "#" : "") + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")
  }
}

class SortingVisualizer {
  constructor(animationEngine) {
    this.engine = animationEngine
  }

  generateBubbleSortFrames(array, codeLines = {}) {
    const frames = []
    const arr = [...array]
    const n = arr.length

    // Initial frame
    frames.push({
      type: "array",
      array: [...arr],
      highlights: [],
      comparisons: [],
      algorithm: "Bubble Sort",
      description: "Initial array",
      codeLine: codeLines.init || null,
    })

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        // Comparison frame
        frames.push({
          type: "array",
          array: [...arr],
          highlights: [],
          comparisons: [j, j + 1],
          algorithm: "Bubble Sort",
          description: `Comparing elements at positions ${j} and ${j + 1}`,
          codeLine: codeLines.compare || null,
        })

        if (arr[j] > arr[j + 1]) {
          // Swap elements
          ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]

          // Swap frame
          frames.push({
            type: "array",
            array: [...arr],
            highlights: [j, j + 1],
            comparisons: [],
            algorithm: "Bubble Sort",
            description: `Swapped elements at positions ${j} and ${j + 1}`,
            codeLine: codeLines.swap || null,
          })
        }
      }

      // Mark sorted element
      frames.push({
        type: "array",
        array: [...arr],
        highlights: [],
        comparisons: [],
        sorted: [n - i - 1],
        algorithm: "Bubble Sort",
        description: `Element at position ${n - i - 1} is now in correct position`,
        codeLine: codeLines.sorted || null,
      })
    }

    // Final frame
    frames.push({
      type: "array",
      array: [...arr],
      highlights: [],
      comparisons: [],
      sorted: Array.from({ length: n }, (_, i) => i),
      algorithm: "Bubble Sort",
      description: "Array is fully sorted!",
      codeLine: codeLines.complete || null,
    })

    return frames
  }

  generateSelectionSortFrames(array, codeLines = {}) {
    const frames = []
    const arr = [...array]
    const n = arr.length

    frames.push({
      type: "array",
      array: [...arr],
      highlights: [],
      comparisons: [],
      algorithm: "Selection Sort",
      description: "Initial array",
      codeLine: codeLines.init || null,
    })

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i

      // Mark current position
      frames.push({
        type: "array",
        array: [...arr],
        highlights: [i],
        comparisons: [],
        algorithm: "Selection Sort",
        description: `Finding minimum element from position ${i}`,
        codeLine: codeLines.findMin || null,
      })

      for (let j = i + 1; j < n; j++) {
        // Compare with current minimum
        frames.push({
          type: "array",
          array: [...arr],
          highlights: [minIdx],
          comparisons: [j],
          algorithm: "Selection Sort",
          description: `Comparing element at position ${j} with current minimum`,
          codeLine: codeLines.compare || null,
        })

        if (arr[j] < arr[minIdx]) {
          minIdx = j
          frames.push({
            type: "array",
            array: [...arr],
            highlights: [minIdx],
            comparisons: [],
            algorithm: "Selection Sort",
            description: `New minimum found at position ${minIdx}`,
            codeLine: codeLines.newMin || null,
          })
        }
      }

      // Swap if needed
      if (minIdx !== i) {
        ;[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
        frames.push({
          type: "array",
          array: [...arr],
          highlights: [i, minIdx],
          comparisons: [],
          algorithm: "Selection Sort",
          description: `Swapped elements at positions ${i} and ${minIdx}`,
          codeLine: codeLines.swap || null,
        })
      }

      // Mark as sorted
      frames.push({
        type: "array",
        array: [...arr],
        highlights: [],
        comparisons: [],
        sorted: Array.from({ length: i + 1 }, (_, idx) => idx),
        algorithm: "Selection Sort",
        description: `Position ${i} is now sorted`,
        codeLine: codeLines.sorted || null,
      })
    }

    // Final frame
    frames.push({
      type: "array",
      array: [...arr],
      highlights: [],
      comparisons: [],
      sorted: Array.from({ length: n }, (_, i) => i),
      algorithm: "Selection Sort",
      description: "Array is fully sorted!",
      codeLine: codeLines.complete || null,
    })

    return frames
  }

  generateInsertionSortFrames(array, codeLines = {}) {
    const frames = []
    const arr = [...array]
    const n = arr.length

    frames.push({
      type: "array",
      array: [...arr],
      highlights: [],
      comparisons: [],
      sorted: [0],
      algorithm: "Insertion Sort",
      description: "Initial array - first element is considered sorted",
      codeLine: codeLines.init || null,
    })

    for (let i = 1; i < n; i++) {
      const key = arr[i]
      let j = i - 1

      // Show current element to insert
      frames.push({
        type: "array",
        array: [...arr],
        highlights: [i],
        comparisons: [],
        sorted: Array.from({ length: i }, (_, idx) => idx),
        algorithm: "Insertion Sort",
        description: `Inserting element ${key} into sorted portion`,
        codeLine: codeLines.insert || null,
      })

      while (j >= 0 && arr[j] > key) {
        // Show comparison
        frames.push({
          type: "array",
          array: [...arr],
          highlights: [i],
          comparisons: [j],
          sorted: Array.from({ length: i }, (_, idx) => idx),
          algorithm: "Insertion Sort",
          description: `Comparing ${key} with ${arr[j]}`,
          codeLine: codeLines.compare || null,
        })

        arr[j + 1] = arr[j]

        // Show shift
        frames.push({
          type: "array",
          array: [...arr],
          highlights: [j + 1],
          comparisons: [],
          sorted: Array.from({ length: i }, (_, idx) => idx),
          algorithm: "Insertion Sort",
          description: `Shifting ${arr[j]} to the right`,
          codeLine: codeLines.shift || null,
        })

        j--
      }

      arr[j + 1] = key

      // Show insertion
      frames.push({
        type: "array",
        array: [...arr],
        highlights: [j + 1],
        comparisons: [],
        sorted: Array.from({ length: i + 1 }, (_, idx) => idx),
        algorithm: "Insertion Sort",
        description: `Inserted ${key} at position ${j + 1}`,
        codeLine: codeLines.place || null,
      })
    }

    // Final frame
    frames.push({
      type: "array",
      array: [...arr],
      highlights: [],
      comparisons: [],
      sorted: Array.from({ length: n }, (_, i) => i),
      algorithm: "Insertion Sort",
      description: "Array is fully sorted!",
      codeLine: codeLines.complete || null,
    })

    return frames
  }

  generateMergeSortFrames(array, codeLines = {}) {
    const frames = []
    const arr = [...array]

    frames.push({
      type: "array",
      array: [...arr],
      highlights: [],
      comparisons: [],
      algorithm: "Merge Sort",
      description: "Initial array",
      codeLine: codeLines.init || null,
    })

    const mergeSort = (arr, left, right, depth = 0) => {
      if (left >= right) return

      const mid = Math.floor((left + right) / 2)

      // Show division
      frames.push({
        type: "array",
        array: [...arr],
        highlights: Array.from({ length: right - left + 1 }, (_, i) => left + i),
        comparisons: [],
        algorithm: "Merge Sort",
        description: `Dividing array from ${left} to ${right}`,
        codeLine: codeLines.divide || null,
      })

      mergeSort(arr, left, mid, depth + 1)
      mergeSort(arr, mid + 1, right, depth + 1)
      merge(arr, left, mid, right, codeLines)
    }

    const merge = (arr, left, mid, right, codeLines) => {
      const leftArr = arr.slice(left, mid + 1)
      const rightArr = arr.slice(mid + 1, right + 1)

      let i = 0,
        j = 0,
        k = left

      while (i < leftArr.length && j < rightArr.length) {
        frames.push({
          type: "array",
          array: [...arr],
          highlights: [k],
          comparisons: [left + i, mid + 1 + j],
          algorithm: "Merge Sort",
          description: `Comparing ${leftArr[i]} and ${rightArr[j]}`,
          codeLine: codeLines.compare || null,
        })

        if (leftArr[i] <= rightArr[j]) {
          arr[k] = leftArr[i]
          i++
        } else {
          arr[k] = rightArr[j]
          j++
        }

        frames.push({
          type: "array",
          array: [...arr],
          highlights: [k],
          comparisons: [],
          algorithm: "Merge Sort",
          description: `Placed ${arr[k]} at position ${k}`,
          codeLine: codeLines.place || null,
        })

        k++
      }

      while (i < leftArr.length) {
        arr[k] = leftArr[i]
        frames.push({
          type: "array",
          array: [...arr],
          highlights: [k],
          comparisons: [],
          algorithm: "Merge Sort",
          description: `Copying remaining element ${arr[k]}`,
          codeLine: codeLines.copy || null,
        })
        i++
        k++
      }

      while (j < rightArr.length) {
        arr[k] = rightArr[j]
        frames.push({
          type: "array",
          array: [...arr],
          highlights: [k],
          comparisons: [],
          algorithm: "Merge Sort",
          description: `Copying remaining element ${arr[k]}`,
          codeLine: codeLines.copy || null,
        })
        j++
        k++
      }
    }

    mergeSort(arr, 0, arr.length - 1)

    // Final frame
    frames.push({
      type: "array",
      array: [...arr],
      highlights: [],
      comparisons: [],
      sorted: Array.from({ length: arr.length }, (_, i) => i),
      algorithm: "Merge Sort",
      description: "Array is fully sorted!",
      codeLine: codeLines.complete || null,
    })

    return frames
  }

  generateQuickSortFrames(array, codeLines = {}) {
    const frames = []
    const arr = [...array]

    frames.push({
      type: "array",
      array: [...arr],
      highlights: [],
      comparisons: [],
      algorithm: "Quick Sort",
      description: "Initial array",
      codeLine: codeLines.init || null,
    })

    const quickSort = (arr, low, high) => {
      if (low < high) {
        const pi = partition(arr, low, high, codeLines)
        quickSort(arr, low, pi - 1)
        quickSort(arr, pi + 1, high)
      }
    }

    const partition = (arr, low, high, codeLines) => {
      const pivot = arr[high]

      frames.push({
        type: "array",
        array: [...arr],
        highlights: [high],
        comparisons: [],
        algorithm: "Quick Sort",
        description: `Pivot selected: ${pivot} at position ${high}`,
        codeLine: codeLines.pivot || null,
      })

      let i = low - 1

      for (let j = low; j < high; j++) {
        frames.push({
          type: "array",
          array: [...arr],
          highlights: [high],
          comparisons: [j],
          algorithm: "Quick Sort",
          description: `Comparing ${arr[j]} with pivot ${pivot}`,
          codeLine: codeLines.compare || null,
        })

        if (arr[j] < pivot) {
          i++
          ;[arr[i], arr[j]] = [arr[j], arr[i]]

          frames.push({
            type: "array",
            array: [...arr],
            highlights: [i, j],
            comparisons: [],
            algorithm: "Quick Sort",
            description: `Swapped ${arr[j]} and ${arr[i]}`,
            codeLine: codeLines.swap || null,
          })
        }
      }
      ;[arr[i + 1], arr[high]] = [arr[high], arr[i + 1]]

      frames.push({
        type: "array",
        array: [...arr],
        highlights: [i + 1],
        comparisons: [],
        algorithm: "Quick Sort",
        description: `Pivot ${pivot} placed at correct position ${i + 1}`,
        codeLine: codeLines.place || null,
      })

      return i + 1
    }

    quickSort(arr, 0, arr.length - 1)

    // Final frame
    frames.push({
      type: "array",
      array: [...arr],
      highlights: [],
      comparisons: [],
      sorted: Array.from({ length: arr.length }, (_, i) => i),
      algorithm: "Quick Sort",
      description: "Array is fully sorted!",
      codeLine: codeLines.complete || null,
    })

    return frames
  }
}

// Initialize animation engine
const animationEngine = new AnimationEngine("visualizationCanvas")

// Initialize sorting visualizer
const sortingVisualizer = new SortingVisualizer(animationEngine)

// Initialize code analyzer
const codeAnalyzer = new CodeAnalyzer()

// Get DOM elements
const runBtn = document.getElementById("runBtn")
const resetBtn = document.getElementById("resetBtn")
const stepBtn = document.getElementById("stepBtn")
const clearBtn = document.getElementById("clearBtn")
const outputArea = document.getElementById("outputArea")
const statusText = document.getElementById("statusText")

const playBtn = document.getElementById("playBtn")
const pauseBtn = document.getElementById("pauseBtn")
const stepForwardBtn = document.getElementById("stepForwardBtn")
const stepBackBtn = document.getElementById("stepBackBtn")
const resetVisualizationBtn = document.getElementById("resetVisualizationBtn")
const speedSlider = document.getElementById("speedSlider")
const speedValue = document.getElementById("speedValue")
const timelineSlider = document.getElementById("timelineSlider")
const timelineInfo = document.getElementById("timelineInfo")
const algorithmSelect = document.getElementById("algorithmSelect")
const customizeBtn = document.getElementById("customizeBtn")
const customizeModal = document.getElementById("customizeModal")
const closeModal = document.getElementById("closeModal")
const cancelCustomize = document.getElementById("cancelCustomize")
const applyCustomize = document.getElementById("applyCustomize")
const arraySize = document.getElementById("arraySize")
const arraySizeValue = document.getElementById("arraySizeValue")
const arrayValues = document.getElementById("arrayValues")
const exportBtn = document.getElementById("exportBtn")
const fullscreenBtn = document.getElementById("fullscreenBtn")

let isRunning = false
let currentStep = 0
let customArray = [64, 34, 25, 12, 22, 11, 90]

playBtn.addEventListener("click", () => {
  animationEngine.play()
  updateStatus("Animation playing")
})

pauseBtn.addEventListener("click", () => {
  animationEngine.pause()
  updateStatus("Animation paused")
})

stepForwardBtn.addEventListener("click", () => {
  animationEngine.stepForward()
  updateStatus("Stepped forward")
})

stepBackBtn.addEventListener("click", () => {
  animationEngine.stepBackward()
  updateStatus("Stepped backward")
})

resetVisualizationBtn.addEventListener("click", () => {
  animationEngine.stop()
  updateStatus("Visualization reset")
})

speedSlider.addEventListener("input", (e) => {
  const speed = Number.parseInt(e.target.value)
  animationEngine.setSpeed(speed)
  speedValue.textContent = `${speed}x`
})

timelineSlider.addEventListener("input", (e) => {
  const frameIndex = Number.parseInt(e.target.value)
  animationEngine.goToFrame(frameIndex)
  updateStatus(`Jumped to frame ${frameIndex}`)
})

// Customize modal controls
customizeBtn.addEventListener("click", () => {
  customizeModal.style.display = "block"
})

closeModal.addEventListener("click", () => {
  customizeModal.style.display = "none"
})

cancelCustomize.addEventListener("click", () => {
  customizeModal.style.display = "none"
})

applyCustomize.addEventListener("click", () => {
  applyCustomization()
  customizeModal.style.display = "none"
})

arraySize.addEventListener("input", (e) => {
  arraySizeValue.textContent = e.target.value
  generateRandomArray(Number.parseInt(e.target.value))
})

// Preset buttons
document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const preset = e.target.dataset.preset
    generatePresetArray(preset)
  })
})

// Export functionality
exportBtn.addEventListener("click", () => {
  exportVisualization()
})

// Fullscreen functionality
fullscreenBtn.addEventListener("click", () => {
  toggleFullscreen()
})

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return

  switch (e.key) {
    case " ": // Space - Play/Pause
      e.preventDefault()
      if (animationEngine.isPlaying) {
        animationEngine.pause()
      } else {
        animationEngine.play()
      }
      break
    case "ArrowRight": // Right arrow - Step forward
      e.preventDefault()
      animationEngine.stepForward()
      break
    case "ArrowLeft": // Left arrow - Step backward
      e.preventDefault()
      animationEngine.stepBackward()
      break
    case "r": // R - Reset
    case "R":
      e.preventDefault()
      animationEngine.stop()
      break
    case "f": // F - Fullscreen
    case "F":
      e.preventDefault()
      toggleFullscreen()
      break
  }
})

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === customizeModal) {
    customizeModal.style.display = "none"
  }
})

function generateRandomArray(size) {
  const arr = []
  for (let i = 0; i < size; i++) {
    arr.push(Math.floor(Math.random() * 100) + 1)
  }
  arrayValues.value = arr.join(", ")
  return arr
}

function generatePresetArray(preset) {
  const size = Number.parseInt(arraySize.value)
  let arr = []

  switch (preset) {
    case "random":
      arr = generateRandomArray(size)
      break
    case "sorted":
      arr = Array.from({ length: size }, (_, i) => (i + 1) * 10)
      break
    case "reverse":
      arr = Array.from({ length: size }, (_, i) => (size - i) * 10)
      break
    case "nearly":
      arr = Array.from({ length: size }, (_, i) => (i + 1) * 10)
      // Swap a few elements to make it nearly sorted
      for (let i = 0; i < Math.floor(size / 3); i++) {
        const idx1 = Math.floor(Math.random() * size)
        let idx2 = Math.floor(Math.random() * size)
        while (idx2 === idx1) {
          idx2 = Math.floor(Math.random() * size)
        }
        ;[arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]]
      }
      break
  }

  arrayValues.value = arr.join(", ")
}

function applyCustomization() {
  const values = arrayValues.value
    .split(",")
    .map((v) => Number.parseInt(v.trim()))
    .filter((v) => !isNaN(v))
  if (values.length > 0) {
    customArray = values
    updateStatus(`Custom array applied: ${values.length} elements`)
  }
}

function exportVisualization() {
  const canvas = document.getElementById("visualizationCanvas")
  const link = document.createElement("a")
  link.download = "algorithm-visualization.png"
  link.href = canvas.toDataURL()
  link.click()
  updateStatus("Visualization exported as PNG")
}

function toggleFullscreen() {
  const canvas = document.getElementById("visualizationCanvas")
  if (!document.fullscreenElement) {
    canvas.requestFullscreen().catch((err) => {
      updateStatus(`Error attempting to enable fullscreen: ${err.message}`)
    })
  } else {
    document.exitFullscreen()
  }
}

function simulateExecution(code) {
  outputArea.innerHTML = ""

  // Analyze code first
  const analysis = codeAnalyzer.parseCode(code)

  // Display analysis results
  addOutput("🔍 Analyzing code structure...", "#3b82f6")
  addOutput(`Algorithm detected: ${analysis.algorithm}`, "#10b981")
  addOutput(`Time complexity: ${analysis.complexity}`, "#f59e0b")

  if (analysis.errors.length > 0) {
    addOutput("⚠️ Code issues found:", "#ef4444")
    analysis.errors.forEach((error) => addOutput(`  - ${error}`, "#ef4444"))
  }

  // Simulate compilation
  addOutput("🔧 Compiling C++ code...", "#3b82f6")

  setTimeout(() => {
    addOutput("✅ Compilation successful!", "#10b981")
    addOutput("🚀 Starting execution...", "#3b82f6")

    setTimeout(() => {
      // Use extracted array data or custom array
      const testArray = analysis.arrayData || [...customArray]
      let frames = []

      // Check algorithm selection or use analysis
      const selectedAlgorithm = algorithmSelect.value
      const detectedAlgorithm = selectedAlgorithm === "auto" ? analysis.algorithm : selectedAlgorithm

      // Generate code line mappings (simplified)
      const codeLines = extractCodeLines(code)

      switch (detectedAlgorithm) {
        case "bubble":
          frames = sortingVisualizer.generateBubbleSortFrames(testArray, codeLines)
          simulateSortingOutput("Bubble Sort", testArray)
          break
        case "selection":
          frames = sortingVisualizer.generateSelectionSortFrames(testArray, codeLines)
          simulateSortingOutput("Selection Sort", testArray)
          break
        case "insertion":
          frames = sortingVisualizer.generateInsertionSortFrames(testArray, codeLines)
          simulateSortingOutput("Insertion Sort", testArray)
          break
        case "merge":
          frames = sortingVisualizer.generateMergeSortFrames(testArray, codeLines)
          simulateSortingOutput("Merge Sort", testArray)
          break
        case "quick":
          frames = sortingVisualizer.generateQuickSortFrames(testArray, codeLines)
          simulateSortingOutput("Quick Sort", testArray)
          break
        default:
          addOutput("Program output:", "#e2e8f0")
          addOutput("Hello, Algorithm Visualizer!", "#e2e8f0")
          if (analysis.arrayData) {
            addOutput(`Detected array: [${analysis.arrayData.join(", ")}]`, "#10b981")
          }
      }

      if (frames.length > 0) {
        animationEngine.setFrames(frames)
        addOutput(`✨ Visualization ready! Use the controls to play the ${frames[0].algorithm} animation.`, "#10b981")
        addOutput(`📊 Generated ${frames.length} animation frames`, "#64748b")
      }

      setTimeout(() => {
        addOutput("✅ Execution completed successfully!", "#10b981")
        stopExecution()
        updateStatus("Execution completed - Ready for visualization")
      }, 1000)
    }, 500)
  }, 1500)
}

function extractCodeLines(code) {
  const lines = code.split("\n")
  const codeLines = {}

  lines.forEach((line, index) => {
    const trimmedLine = line.trim().toLowerCase()

    if (trimmedLine.includes("swap") || (trimmedLine.includes("arr[j]") && trimmedLine.includes("arr[j+1]"))) {
      codeLines.swap = index
    } else if (trimmedLine.includes("if") && (trimmedLine.includes(">") || trimmedLine.includes("<"))) {
      codeLines.compare = index
    } else if (trimmedLine.includes("for") && trimmedLine.includes("i")) {
      codeLines.init = index
    } else if (trimmedLine.includes("min") && trimmedLine.includes("=")) {
      codeLines.findMin = index
    } else if (trimmedLine.includes("key = arr[i]")) {
      codeLines.insert = index
    } else if (trimmedLine.includes("arr[j+1] = arr[j]")) {
      codeLines.shift = index
    } else if (trimmedLine.includes("arr[j+1] = key")) {
      codeLines.place = index
    } else if (trimmedLine.includes("mergeSort")) {
      codeLines.divide = index
    } else if (trimmedLine.includes("pivot = arr[high]")) {
      codeLines.pivot = index
    } else if (trimmedLine.includes("copy")) {
      codeLines.copy = index
    }
  })

  return codeLines
}

editor.on("change", (cm, change) => {
  // Debounce analysis to avoid excessive calls
  clearTimeout(window.analysisTimeout)
  window.analysisTimeout = setTimeout(() => {
    const code = cm.getValue()
    const analysis = codeAnalyzer.parseCode(code)

    // Update algorithm selector if auto-detect is enabled
    if (algorithmSelect.value === "auto") {
      updateStatus(`Detected: ${analysis.algorithm} (${analysis.complexity})`)
    }

    // Update custom array if found in code
    if (analysis.arrayData && analysis.arrayData.length > 0) {
      customArray = analysis.arrayData
      arrayValues.value = analysis.arrayData.join(", ")
    }
  }, 1000)
})

function simulateSortingOutput(algorithmName, array) {
  const sortedArray = [...array].sort((a, b) => a - b)

  addOutput(`${algorithmName} Algorithm Execution:`, "#e2e8f0")
  addOutput(`Original array: ${array.join(" ")}`, "#e2e8f0")
  addOutput(`Sorting in progress...`, "#f59e0b")
  addOutput(`Sorted array: ${sortedArray.join(" ")}`, "#10b981")
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
  animationEngine.stop()
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
  animationEngine.stop()
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

// Auto-resize editor
window.addEventListener("resize", () => {
  editor.refresh()
})

// Initialize
setTimeout(() => {
  editor.refresh()
}, 100)
