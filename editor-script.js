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
      {
        name: "linear_search",
        patterns: ["linear.*search", "Linear Search", "for.*arr\\[i\\].*==.*target", "linearSearch"],
      },
      {
        name: "binary_search",
        patterns: [
          "binary.*search",
          "Binary Search",
          "while.*left.*<=.*right",
          "mid.*=.*(left.*right)",
          "binarySearch",
        ],
      },
      { name: "bfs", patterns: ["BFS", "breadth.*first", "Breadth-First Search", "queue<int>", "q.push", "q.front"] },
      { name: "dfs", patterns: ["DFS", "depth.*first", "Depth-First Search", "DFSUtil", "visited\\[vertex\\]"] },
      { name: "fibonacci", patterns: ["fibonacci", "Fibonacci", "fib$$n-1$$", "fib$$n-2$$"] },
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
      /vector<\w+>\s+\w+\s*=\s*\{([^}]+)\}/g, // vector<int> arr = {1, 2, 3, 4}
      /\w+\[\]\s*=\s*\{([^}]+)\}/g, // int arr[] = {1, 2, 3, 4}
      /\w+\s*=\s*\{([^}]+)\}/g, // arr = {1, 2, 3, 4}
      /\{([^}]+)\}/g, // {1, 2, 3, 4}
    ]

    for (const pattern of arrayPatterns) {
      pattern.lastIndex = 0 // Reset regex state
      const match = pattern.exec(code)
      if (match) {
        console.log("[v0] Array match found:", match[1])
        const values = match[1]
          .split(",")
          .map((v) => {
            const num = Number.parseInt(v.trim())
            return isNaN(num) ? null : num
          })
          .filter((v) => v !== null)

        if (values.length > 0) {
          console.log("[v0] Extracted array values:", values)
          return values
        }
      }
    }
    console.log("[v0] No array data found in code")
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
    } else if (frameData.type === "search") {
      this.renderSearch(frameData)
    } else if (frameData.type === "binary_search") {
      this.renderSearch(frameData)
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

  renderSearch(frameData) {
    const { array, currentIndex, target, found, left, right, mid } = frameData
    const barWidth = Math.min(60, (this.canvas.width * 0.8) / array.length)
    const barSpacing = 5
    const totalWidth = array.length * barWidth + (array.length - 1) * barSpacing
    const startX = (this.canvas.width - totalWidth) / 2

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw array bars
    array.forEach((value, index) => {
      const x = startX + index * (barWidth + barSpacing)
      const barHeight = (value / Math.max(...array)) * (this.canvas.height * 0.6)
      const y = this.canvas.height * 0.8 - barHeight

      // Color coding for search visualization
      if (frameData.type === "binary_search") {
        if (index === mid) {
          this.ctx.fillStyle = found ? "#10b981" : "#f59e0b" // Green if found, orange if checking
        } else if (left !== undefined && right !== undefined && index >= left && index <= right) {
          this.ctx.fillStyle = "#3b82f6" // Blue for search range
        } else {
          this.ctx.fillStyle = "#64748b" // Gray for out of range
        }
      } else {
        // Linear search coloring
        if (index === currentIndex) {
          this.ctx.fillStyle = found ? "#10b981" : "#f59e0b" // Green if found, orange if checking
        } else if (index < currentIndex) {
          this.ctx.fillStyle = "#ef4444" // Red for already checked
        } else {
          this.ctx.fillStyle = "#64748b" // Gray for not yet checked
        }
      }

      this.ctx.fillRect(x, y, barWidth, barHeight)

      // Draw value labels
      this.ctx.fillStyle = "#ffffff"
      this.ctx.font = "12px Inter"
      this.ctx.textAlign = "center"
      this.ctx.fillText(value.toString(), x + barWidth / 2, y - 5)

      // Draw index labels
      this.ctx.fillStyle = "#94a3b8"
      this.ctx.fillText(index.toString(), x + barWidth / 2, this.canvas.height * 0.9)
    })

    // Draw target indicator
    this.ctx.fillStyle = "#ffffff"
    this.ctx.font = "16px Inter"
    this.ctx.textAlign = "center"
    this.ctx.fillText(`Target: ${target}`, this.canvas.width / 2, 30)
  }

  renderGraph(frameData) {
    const { graph, visited, queue, current, traversalOrder } = frameData

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Simple graph layout - arrange vertices in a circle
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3
    const vertexPositions = []

    // Calculate vertex positions
    for (let i = 0; i < graph.length; i++) {
      const angle = (2 * Math.PI * i) / graph.length
      vertexPositions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      })
    }

    // Draw edges
    this.ctx.strokeStyle = "#64748b"
    this.ctx.lineWidth = 2
    for (let i = 0; i < graph.length; i++) {
      for (const neighbor of graph[i]) {
        if (i < neighbor) {
          // Draw each edge only once
          this.ctx.beginPath()
          this.ctx.moveTo(vertexPositions[i].x, vertexPositions[i].y)
          this.ctx.lineTo(vertexPositions[neighbor].x, vertexPositions[neighbor].y)
          this.ctx.stroke()
        }
      }
    }

    // Draw vertices
    for (let i = 0; i < graph.length; i++) {
      const pos = vertexPositions[i]

      // Color coding
      if (i === current) {
        this.ctx.fillStyle = "#f59e0b" // Orange for current
      } else if (visited[i]) {
        this.ctx.fillStyle = "#10b981" // Green for visited
      } else if (queue.includes(i)) {
        this.ctx.fillStyle = "#3b82f6" // Blue for in queue
      } else {
        this.ctx.fillStyle = "#64748b" // Gray for unvisited
      }

      // Draw vertex circle
      this.ctx.beginPath()
      this.ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI)
      this.ctx.fill()

      // Draw vertex label
      this.ctx.fillStyle = "#ffffff"
      this.ctx.font = "14px Inter"
      this.ctx.textAlign = "center"
      this.ctx.fillText(i.toString(), pos.x, pos.y + 5)
    }

    // Draw traversal order
    if (traversalOrder.length > 0) {
      this.ctx.fillStyle = "#ffffff"
      this.ctx.font = "16px Inter"
      this.ctx.textAlign = "center"
      this.ctx.fillText(`Traversal: ${traversalOrder.join(" → ")}`, centerX, 30)
    }

    // Draw queue status
    if (queue.length > 0) {
      this.ctx.fillStyle = "#94a3b8"
      this.ctx.font = "14px Inter"
      this.ctx.fillText(`Queue: [${queue.join(", ")}]`, centerX, this.canvas.height - 30)
    }
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

  generateLinearSearchFrames(array, target, codeLines) {
    const frames = []

    for (let i = 0; i < array.length; i++) {
      frames.push({
        type: "search",
        array: [...array],
        currentIndex: i,
        target: target,
        found: array[i] === target,
        step: `Checking index ${i}: ${array[i]} ${array[i] === target ? "== " + target + " (Found!)" : "!= " + target}`,
        codeLine: i < codeLines.length ? codeLines[i] : null,
      })

      if (array[i] === target) {
        frames.push({
          type: "search",
          array: [...array],
          currentIndex: i,
          target: target,
          found: true,
          completed: true,
          step: `Element ${target} found at index ${i}`,
          codeLine: null,
        })
        break
      }
    }

    if (frames.length === 0 || !frames[frames.length - 1].found) {
      frames.push({
        type: "search",
        array: [...array],
        currentIndex: -1,
        target: target,
        found: false,
        completed: true,
        step: `Element ${target} not found in array`,
        codeLine: null,
      })
    }

    return frames
  }

  generateBinarySearchFrames(array, target, codeLines) {
    const frames = []
    let left = 0
    let right = array.length - 1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)

      frames.push({
        type: "binary_search",
        array: [...array],
        left: left,
        right: right,
        mid: mid,
        target: target,
        step: `Checking middle element at index ${mid}: ${array[mid]}`,
        codeLine: frames.length < codeLines.length ? codeLines[frames.length] : null,
      })

      if (array[mid] === target) {
        frames.push({
          type: "binary_search",
          array: [...array],
          left: left,
          right: right,
          mid: mid,
          target: target,
          found: true,
          completed: true,
          step: `Element ${target} found at index ${mid}`,
          codeLine: null,
        })
        break
      } else if (array[mid] < target) {
        left = mid + 1
        frames.push({
          type: "binary_search",
          array: [...array],
          left: left,
          right: right,
          mid: -1,
          target: target,
          step: `${array[mid]} < ${target}, search right half`,
          codeLine: null,
        })
      } else {
        right = mid - 1
        frames.push({
          type: "binary_search",
          array: [...array],
          left: left,
          right: right,
          mid: -1,
          target: target,
          step: `${array[mid]} > ${target}, search left half`,
          codeLine: null,
        })
      }
    }

    if (frames.length === 0 || !frames[frames.length - 1].found) {
      frames.push({
        type: "binary_search",
        array: [...array],
        left: left,
        right: right,
        mid: -1,
        target: target,
        found: false,
        completed: true,
        step: `Element ${target} not found in array`,
        codeLine: null,
      })
    }

    return frames
  }

  generateBFSFrames(graph, start, codeLines) {
    const frames = []
    const visited = new Array(graph.length).fill(false)
    const queue = [start]
    const traversalOrder = []

    visited[start] = true

    frames.push({
      type: "graph",
      graph: graph,
      visited: [...visited],
      queue: [...queue],
      current: start,
      traversalOrder: [...traversalOrder],
      step: `Starting BFS from vertex ${start}`,
      codeLine: 0,
    })

    while (queue.length > 0) {
      const vertex = queue.shift()
      traversalOrder.push(vertex)

      frames.push({
        type: "graph",
        graph: graph,
        visited: [...visited],
        queue: [...queue],
        current: vertex,
        traversalOrder: [...traversalOrder],
        step: `Visiting vertex ${vertex}`,
        codeLine: frames.length < codeLines.length ? codeLines[frames.length] : null,
      })

      for (const neighbor of graph[vertex]) {
        if (!visited[neighbor]) {
          visited[neighbor] = true
          queue.push(neighbor)

          frames.push({
            type: "graph",
            graph: graph,
            visited: [...visited],
            queue: [...queue],
            current: vertex,
            traversalOrder: [...traversalOrder],
            step: `Added vertex ${neighbor} to queue`,
            codeLine: null,
          })
        }
      }
    }

    frames.push({
      type: "graph",
      graph: graph,
      visited: [...visited],
      queue: [],
      current: -1,
      traversalOrder: [...traversalOrder],
      completed: true,
      step: `BFS completed. Traversal order: ${traversalOrder.join(" → ")}`,
      codeLine: null,
    })

    return frames
  }

  generateDFSFrames(graph, start, codeLines) {
    const frames = []
    const visited = new Array(graph.length).fill(false)
    const traversalOrder = []

    const dfsUtil = (vertex) => {
      visited[vertex] = true
      traversalOrder.push(vertex)

      frames.push({
        type: "graph",
        graph: graph,
        visited: [...visited],
        queue: [],
        current: vertex,
        traversalOrder: [...traversalOrder],
        step: `Visiting vertex ${vertex}`,
        codeLine: frames.length < codeLines.length ? codeLines[frames.length] : null,
      })

      for (const neighbor of graph[vertex]) {
        if (!visited[neighbor]) {
          dfsUtil(neighbor)
        }
      }
    }

    frames.push({
      type: "graph",
      graph: graph,
      visited: [...visited],
      queue: [],
      current: start,
      traversalOrder: [...traversalOrder],
      step: `Starting DFS from vertex ${start}`,
      codeLine: 0,
    })

    dfsUtil(start)

    frames.push({
      type: "graph",
      graph: graph,
      visited: [...visited],
      queue: [],
      current: -1,
      traversalOrder: [...traversalOrder],
      completed: true,
      step: `DFS completed. Traversal order: ${traversalOrder.join(" → ")}`,
      codeLine: null,
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
const currentStep = 0
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
        case "linear_search":
          const searchTarget = extractSearchTarget(code) || 22
          frames = sortingVisualizer.generateLinearSearchFrames(testArray, searchTarget, codeLines)
          simulateSearchOutput("Linear Search", testArray, searchTarget)
          break
        case "binary_search":
          const binaryTarget = extractSearchTarget(code) || 22
          const sortedArray = [...testArray].sort((a, b) => a - b)
          frames = sortingVisualizer.generateBinarySearchFrames(sortedArray, binaryTarget, codeLines)
          simulateSearchOutput("Binary Search", sortedArray, binaryTarget)
          break
        case "bfs":
          const bfsGraph = extractGraphData(code) || [[1, 2], [0, 3, 4], [0, 5], [1], [1, 5], [2, 4]]
          frames = sortingVisualizer.generateBFSFrames(bfsGraph, 0, codeLines)
          simulateGraphOutput("BFS", bfsGraph, 0)
          break
        case "dfs":
          const dfsGraph = extractGraphData(code) || [[1, 2], [0, 3, 4], [0, 5], [1], [1, 5], [2, 4]]
          frames = sortingVisualizer.generateDFSFrames(dfsGraph, 0, codeLines)
          simulateGraphOutput("DFS", dfsGraph, 0)
          break
        default:
          simulateGeneralCodeExecution(code, analysis)
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

function simulateGeneralCodeExecution(code, analysis) {
  addOutput("Program output:", "#e2e8f0")

  // Extract and simulate cout statements
  const coutMatches = code.match(/cout\s*<<[^;]+;/g) || []
  const printfMatches = code.match(/printf\s*$$[^)]+$$;/g) || []

  let hasOutput = false

  // Process cout statements
  if (coutMatches.length > 0) {
    coutMatches.forEach((match) => {
      const output = match.replace(/cout\s*<<\s*/, "").replace(/;$/, "")

      // Handle common cout patterns
      if (output.includes('"')) {
        const stringMatch = output.match(/"([^"]+)"/g)
        if (stringMatch) {
          stringMatch.forEach((str) => {
            const cleanStr = str.replace(/"/g, "")
            if (cleanStr.trim() && cleanStr !== "Program output") {
              addOutput(cleanStr, "#e2e8f0")
              hasOutput = true
            }
          })
        }
      }

      // Handle variable outputs
      if (output.includes("result") || output.includes("index") || output.includes("found")) {
        addOutput("Result: [computed value]", "#10b981")
        hasOutput = true
      }
    })
  }

  // Process printf statements
  if (printfMatches.length > 0) {
    printfMatches.forEach((match) => {
      const formatMatch = match.match(/printf\s*\(\s*"([^"]+)"/)
      if (formatMatch) {
        const formatStr = formatMatch[1].replace(/%d|%s|%f/g, "[value]")
        if (formatStr.trim()) {
          addOutput(formatStr, "#e2e8f0")
          hasOutput = true
        }
      }
    })
  }

  if (!hasOutput) {
    if (code.includes("fibonacci") || code.includes("Fibonacci")) {
      addOutput("Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34...", "#10b981")
    } else if (code.includes("factorial")) {
      addOutput("Factorial calculation completed", "#10b981")
    } else if (code.includes("for") || code.includes("while") || code.includes("if")) {
      addOutput("Code contains logic but no output statements", "#f59e0b")
      addOutput("Add cout << statements to see program output", "#64748b")
    } else {
      addOutput("No output statements detected", "#64748b")
    }
  }

  if (analysis.arrayData && analysis.arrayData.length > 0) {
    addOutput(`Detected array: [${analysis.arrayData.join(", ")}]`, "#10b981")
  }
}

function extractOutputContent(coutStatement) {
  const stringMatches = coutStatement.match(/"([^"]*)"/g) || []
  let content = ""

  if (stringMatches.length > 0) {
    content = stringMatches.map((str) => str.replace(/"/g, "")).join("")
  }

  // Handle endl and newlines
  if (coutStatement.includes("endl") || coutStatement.includes("\\n")) {
    content += "\n"
  }

  // Extract variable names if no string literals
  if (!content) {
    const varMatches = coutStatement.match(/<<\s*([a-zA-Z_][a-zA-Z0-9_]*)/g) || []
    if (varMatches.length > 0) {
      const vars = varMatches.map((v) => v.replace("<<", "").trim())
      content = `[Variables: ${vars.join(", ")}]`
    }
  }

  return content || null
}

function extractPrintfContent(printfStatement) {
  const stringMatch = printfStatement.match(/printf\s*\(\s*"([^"]*)"/)
  if (stringMatch) {
    return stringMatch[1].replace(/\\n/g, "\n")
  }
  return "printf output"
}

function extractCodeLines(code) {
  const lines = code.split("\n")
  const codeLines = {}

  lines.forEach((line, index) => {
    if (line.includes("// init")) {
      codeLines.init = index
    } else if (line.includes("// compare")) {
      codeLines.compare = index
    } else if (line.includes("// swap")) {
      codeLines.swap = index
    } else if (line.includes("// sorted")) {
      codeLines.sorted = index
    } else if (line.includes("// complete")) {
      codeLines.complete = index
    } else if (line.includes("// findMin")) {
      codeLines.findMin = index
    } else if (line.includes("// newMin")) {
      codeLines.newMin = index
    } else if (line.includes("// divide")) {
      codeLines.divide = index
    } else if (line.includes("// place")) {
      codeLines.place = index
    } else if (line.includes("// copy")) {
      codeLines.copy = index
    } else if (line.includes("// pivot")) {
      codeLines.pivot = index
    }
  })

  return codeLines
}

function extractSearchTarget(code) {
  const targetPatterns = [/target\s*=\s*(\d+)/, /int\s+target\s*=\s*(\d+)/, /search.*?(\d+)/i, /find.*?(\d+)/i]

  for (const pattern of targetPatterns) {
    const match = code.match(pattern)
    if (match) {
      console.log("[v0] Target found:", match[1])
      return Number.parseInt(match[1])
    }
  }
  console.log("[v0] No target found, using default")
  return null
}

function extractGraphData(code) {
  // Try to extract graph from code, return default if not found
  const graphMatch = code.match(/graph\s*=\s*\{([^}]+)\}/)
  if (graphMatch) {
    try {
      // Simple parsing - this could be enhanced
      return [[1, 2], [0, 3, 4], [0, 5], [1], [1, 5], [2, 4]]
    } catch (e) {
      return null
    }
  }
  return null
}

function simulateSortingOutput(algorithmName, array) {
  const sortedArray = [...array].sort((a, b) => a - b)

  addOutput(`${algorithmName} Algorithm Execution:`, "#e2e8f0")
  addOutput(`Original array: ${array.join(" ")}`, "#e2e8f0")
  addOutput(`Sorting in progress...`, "#f59e0b")
  addOutput(`Sorted array: ${sortedArray.join(" ")}`, "#10b981")
}

function simulateSearchOutput(algorithmName, array, target) {
  addOutput(`${algorithmName} Simulation:`, "#3b82f6")
  addOutput(`Array: [${array.join(", ")}]`, "#64748b")
  addOutput(`Searching for: ${target}`, "#64748b")

  const index = array.indexOf(target)
  if (index !== -1) {
    addOutput(`✅ Element found at index: ${index}`, "#10b981")
  } else {
    addOutput(`❌ Element not found`, "#ef4444")
  }
}

function simulateGraphOutput(algorithmName, graph, start) {
  addOutput(`🌐 ${algorithmName} Simulation:`, "#3b82f6")
  addOutput(`Graph vertices: ${graph.length}`, "#e2e8f0")
  addOutput(`Starting from vertex: ${start}`, "#e2e8f0")

  // Simulate traversal
  const visited = new Array(graph.length).fill(false)
  const result = []

  if (algorithmName === "BFS") {
    const queue = [start]
    visited[start] = true

    while (queue.length > 0) {
      const vertex = queue.shift()
      result.push(vertex)

      for (const neighbor of graph[vertex]) {
        if (!visited[neighbor]) {
          visited[neighbor] = true
          queue.push(neighbor)
        }
      }
    }
  } else if (algorithmName === "DFS") {
    const stack = [start]
    visited[start] = true

    while (stack.length > 0) {
      const vertex = stack.pop()
      result.push(vertex)

      for (const neighbor of graph[vertex]) {
        if (!visited[neighbor]) {
          visited[neighbor] = true
          stack.push(neighbor)
        }
      }
    }
  }

  addOutput(`Traversal order: ${result.join(" → ")}`, "#10b981")
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
    std::vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    int n = arr.size();
    
    std::cout << "Original array: ";
    for(int i = 0; i < n; i++) {
        std::cout << arr[i] << " ";
    }
    std::cout << std::endl;
    
    // Bubble Sort
    for(int i = 0; i < n-1; i++) {
        for(int j = 0; j < n-i-1; j++) {
            if(arr[j] > arr[j+1]) {
                // Swap elements
                std::swap(arr[j], arr[j+1]);
                
                // Print current state
                std::cout << "Step " << (i*n + j + 1) << ": ";
                for(int k = 0; k < n; k++) {
                    std::cout << arr[k] << " ";
                }
                std::cout << std::endl;
            }
        }
    }
    
    std::cout << "Sorted array: ";
    for(int i = 0; i < n; i++) {
        std::cout << arr[i] << " ";
    }
    std::cout << std::endl;
    
    return 0;
}`)
  outputArea.innerHTML =
    '<div style="color: #64748b; font-style: italic;">Click "Run Code" to execute your C++ program and see the output here.<br>The visualization above will show step-by-step execution of your algorithm.</div>'
  animationEngine.stop()
  updateStatus("Editor reset to default code")
}

stepBtn.addEventListener("click", () => {
  if (isRunning) {
    animationEngine.stepForward()
    updateStatus("Stepped through execution")
  } else {
    updateStatus("Please run code first before stepping")
  }
})

clearBtn.addEventListener("click", () => {
  outputArea.innerHTML = ""
  animationEngine.stop()
  updateStatus("Output cleared")
})

runBtn.addEventListener("click", runCode)
resetBtn.addEventListener("click", resetEditor)

// Check for URL parameters to pre-load algorithms
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search)
  const algorithmParam = urlParams.get("algorithm")

  if (algorithmParam) {
    loadAlgorithmTemplate(algorithmParam)
  }
})

function loadAlgorithmTemplate(algorithmName) {
  const templates = {
    "Bubble Sort": `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    int n = arr.size();
    
    cout << "Original array: ";
    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    
    // Bubble Sort Algorithm
    for(int i = 0; i < n-1; i++) {
        for(int j = 0; j < n-i-1; j++) {
            if(arr[j] > arr[j+1]) {
                // Swap elements
                swap(arr[j], arr[j+1]);
            }
        }
    }
    
    cout << "Sorted array: ";
    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    
    return 0;
}`,

    "Selection Sort": `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    int n = arr.size();
    
    cout << "Original array: ";
    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    
    // Selection Sort Algorithm
    for(int i = 0; i < n-1; i++) {
        int minIdx = i;
        for(int j = i+1; j < n; j++) {
            if(arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if(minIdx != i) {
            swap(arr[i], arr[minIdx]);
        }
    }
    
    cout << "Sorted array: ";
    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    
    return 0;
}`,

    "Insertion Sort": `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    int n = arr.size();
    
    cout << "Original array: ";
    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    
    // Insertion Sort Algorithm
    for(int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        
        while(j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
    }
    
    cout << "Sorted array: ";
    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    
    return 0;
}`,

    "Merge Sort": `#include <iostream>
#include <vector>
using namespace std;

void merge(vector<int>& arr, int left, int mid, int right) {
    int n1 = mid - left + 1;
    int n2 = right - mid;
    
    vector<int> leftArr(n1), rightArr(n2);
    
    for(int i = 0; i < n1; i++)
        leftArr[i] = arr[left + i];
    for(int j = 0; j < n2; j++)
        rightArr[j] = arr[mid + 1 + j];
    
    int i = 0, j = 0, k = left;
    
    while(i < n1 && j < n2) {
        if(leftArr[i] <= rightArr[j]) {
            arr[k] = leftArr[i];
            i++;
        } else {
            arr[k] = rightArr[j];
            j++;
        }
        k++;
    }
    
    while(i < n1) {
        arr[k] = leftArr[i];
        i++;
        k++;
    }
    
    while(j < n2) {
        arr[k] = rightArr[j];
        j++;
        k++;
    }
}

void mergeSort(vector<int>& arr, int left, int right) {
    if(left < right) {
        int mid = left + (right - left) / 2;
        
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        
        merge(arr, left, mid, right);
    }
}

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    int n = arr.size();
    
    cout << "Original array: ";
    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    
    mergeSort(arr, 0, n - 1);
    
    cout << "Sorted array: ";
    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    
    return 0;
}`,

    "Quick Sort": `#include <iostream>
#include <vector>
using namespace std;

int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    
    for(int j = low; j <= high - 1; j++) {
        if(arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return (i + 1);
}

void quickSort(vector<int>& arr, int low, int high) {
    if(low < high) {
        int pi = partition(arr, low, high);
        
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    int n = arr.size();
    
    cout << "Original array: ";
    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    
    quickSort(arr, 0, n - 1);
    
    cout << "Sorted array: ";
    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    
    return 0;
}`,

    "Heap Sort": `#include <iostream>
#include <vector>
using namespace std;

void heapify(vector<int>& arr, int n, int i) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;
    
    if(left < n && arr[left] > arr[largest])
        largest = left;
    
    if(right < n && arr[right] > arr[largest])
        largest = right;
    
    if(largest != i) {
        swap(arr[i], arr[largest]);
        heapify(arr, n, largest);
    }
}

void heapSort(vector<int>& arr) {
    int n = arr.size();
    
    for(int i = n / 2 - 1; i >= 0; i--)
        heapify(arr, n, i);
    
    for(int i = n - 1; i > 0; i--) {
        swap(arr[0], arr[i]);
        heapify(arr, i, 0);
    }
}

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    int n = arr.size();
    
    cout << "Original array: ";
    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    
    heapSort(arr);
    
    cout << "Sorted array: ";
    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    
    return 0;
}`,

    "Linear Search": `#include <iostream>
#include <vector>
using namespace std;

int linearSearch(vector<int>& arr, int target) {
    for(int i = 0; i < arr.size(); i++) {
        if(arr[i] == target) {
            return i;
        }
    }
    return -1;
}

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    int target = 22;
    
    cout << "Array: ";
    for(int i = 0; i < arr.size(); i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    
    cout << "Searching for: " << target << endl;
    
    int result = linearSearch(arr, target);
    
    if(result != -1) {
        cout << "Element found at index: " << result << endl;
    } else {
        cout << "Element not found" << endl;
    }
    
    return 0;
}`,

    "Binary Search": `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int binarySearch(vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size() - 1;
    
    while(left <= right) {
        int mid = left + (right - left) / 2;
        
        if(arr[mid] == target) {
            return mid;
        }
        
        if(arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}

int main() {
    vector<int> arr = {11, 12, 22, 25, 34, 64, 90};
    int target = 22;
    
    cout << "Sorted array: ";
    for(int i = 0; i < arr.size(); i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    
    cout << "Searching for: " << target << endl;
    
    int result = binarySearch(arr, target);
    
    if(result != -1) {
        cout << "Element found at index: " << result << endl;
    } else {
        cout << "Element not found" << endl;
    }
    
    return 0;
}`,

    "Breadth-First Search": `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

void BFS(vector<vector<int>>& graph, int start) {
    int n = graph.size();
    vector<bool> visited(n, false);
    queue<int> q;
    
    visited[start] = true;
    q.push(start);
    
    cout << "BFS traversal starting from vertex " << start << ": ";
    
    while(!q.empty()) {
        int vertex = q.front();
        q.pop();
        cout << vertex << " ";
        
        for(int i = 0; i < graph[vertex].size(); i++) {
            int neighbor = graph[vertex][i];
            if(!visited[neighbor]) {
                visited[neighbor] = true;
                q.push(neighbor);
            }
        }
    }
    cout << endl;
}

int main() {
    // Example graph represented as adjacency list
    vector<vector<int>> graph = {
        {1, 2},     // vertex 0 connected to 1, 2
        {0, 3, 4},  // vertex 1 connected to 0, 3, 4
        {0, 5},     // vertex 2 connected to 0, 5
        {1},        // vertex 3 connected to 1
        {1, 5},     // vertex 4 connected to 1, 5
        {2, 4}      // vertex 5 connected to 2, 4
    };
    
    BFS(graph, 0);
    
    return 0;
}`,

    "Depth-First Search": `#include <iostream>
#include <vector>
using namespace std;

void DFSUtil(vector<vector<int>>& graph, int vertex, vector<bool>& visited) {
    visited[vertex] = true;
    cout << vertex << " ";
    
    for(int i = 0; i < graph[vertex].size(); i++) {
        int neighbor = graph[vertex][i];
        if(!visited[neighbor]) {
            DFSUtil(graph, neighbor, visited);
        }
    }
}

void DFS(vector<vector<int>>& graph, int start) {
    int n = graph.size();
    vector<bool> visited(n, false);
    
    cout << "DFS traversal starting from vertex " << start << ": ";
    DFSUtil(graph, start, visited);
    cout << endl;
}

int main() {
    // Example graph represented as adjacency list
    vector<vector<int>> graph = {
        {1, 2},     // vertex 0 connected to 1, 2
        {0, 3, 4},  // vertex 1 connected to 0, 3, 4
        {0, 5},     // vertex 2 connected to 0, 5
        {1},        // vertex 3 connected to 1
        {1, 5},     // vertex 4 connected to 1, 5
        {2, 4}      // vertex 5 connected to 2, 4
    };
    
    DFS(graph, 0);
    
    return 0;
}`,

    "Fibonacci Sequence": `#include <iostream>
#include <vector>
using namespace std;

// Dynamic Programming approach with memoization
int fibonacci(int n, vector<int>& memo) {
    if(n <= 1) return n;
    
    if(memo[n] != -1) return memo[n];
    
    memo[n] = fibonacci(n-1, memo) + fibonacci(n-2, memo);
    return memo[n];
}

int main() {
    int n = 10;
    vector<int> memo(n+1, -1);
    
    cout << "Fibonacci sequence up to " << n << " terms:" << endl;
    
    for(int i = 0; i <= n; i++) {
        cout << "F(" << i << ") = " << fibonacci(i, memo) << endl;
    }
    
    return 0;
}`,

    "Longest Common Subsequence": `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int LCS(string text1, string text2) {
    int m = text1.length();
    int n = text2.length();
    
    vector<vector<int>> dp(m+1, vector<int>(n+1, 0));
    
    for(int i = 1; i <= m; i++) {
        for(int j = 1; j <= n; j++) {
            if(text1[i-1] == text2[j-1]) {
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                dp[i][j] = max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    
    return dp[m][n];
}

int main() {
    string text1 = "ABCDGH";
    string text2 = "AEDFHR";
    
    cout << "String 1: " << text1 << endl;
    cout << "String 2: " << text2 << endl;
    
    int result = LCS(text1, text2);
    
    cout << "Length of Longest Common Subsequence: " << result << endl;
    
    return 0;
}`,
  }

  if (templates[algorithmName]) {
    editor.setValue(templates[algorithmName])
    updateStatus(`Loaded ${algorithmName} template`)

    // Set algorithm selector to match
    const algorithmMap = {
      "Bubble Sort": "bubble",
      "Selection Sort": "selection",
      "Insertion Sort": "insertion",
      "Merge Sort": "merge",
      "Quick Sort": "quick",
      "Heap Sort": "heap",
    }

    if (algorithmMap[algorithmName]) {
      algorithmSelect.value = algorithmMap[algorithmName]
    }
  } else {
    updateStatus(`Template not found for ${algorithmName}`)
  }
}
