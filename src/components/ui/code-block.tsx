import * as React from "react"
import { useState } from "react"
import { Check, Copy, Download } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

/**
 * Enhanced Code Block Component - LibreOllama Design System
 *
 * Features:
 * - Syntax highlighting with Prism.js
 * - Copy to clipboard functionality
 * - Language selection
 * - Line numbers
 * - Download code functionality
 * - Dark theme optimized
 * - ADHD-friendly visual feedback
 */

interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  showCopyButton?: boolean
  showDownloadButton?: boolean
  filename?: string
  className?: string
  onLanguageChange?: (language: string) => void
  onCodeChange?: (code: string) => void
  editable?: boolean
}

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'plaintext', label: 'Plain Text' }
]

// Simple syntax highlighting without external dependencies
const highlightCode = (code: string, language: string): string => {
  if (!code) return ''
  
  // Basic highlighting patterns
  const patterns: Record<string, Array<{ regex: RegExp; className: string }>> = {
    javascript: [
      { regex: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await)\b/g, className: 'text-purple-400' },
      { regex: /\b(true|false|null|undefined)\b/g, className: 'text-orange-400' },
      { regex: /\b\d+\b/g, className: 'text-green-400' },
      { regex: /(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, className: 'text-yellow-300' },
      { regex: /\/\/.*$/gm, className: 'text-gray-500 italic' },
      { regex: /\/\*[\s\S]*?\*\//g, className: 'text-gray-500 italic' }
    ],
    typescript: [
      { regex: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|interface|type|enum)\b/g, className: 'text-purple-400' },
      { regex: /\b(true|false|null|undefined|string|number|boolean|any|void)\b/g, className: 'text-orange-400' },
      { regex: /\b\d+\b/g, className: 'text-green-400' },
      { regex: /(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, className: 'text-yellow-300' },
      { regex: /\/\/.*$/gm, className: 'text-gray-500 italic' }
    ],
    python: [
      { regex: /\b(def|class|import|from|if|elif|else|for|while|try|except|finally|with|as|return|yield|lambda|and|or|not|in|is)\b/g, className: 'text-purple-400' },
      { regex: /\b(True|False|None)\b/g, className: 'text-orange-400' },
      { regex: /\b\d+\b/g, className: 'text-green-400' },
      { regex: /(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, className: 'text-yellow-300' },
      { regex: /#.*$/gm, className: 'text-gray-500 italic' }
    ],
    rust: [
      { regex: /\b(fn|let|mut|const|struct|enum|impl|trait|use|mod|pub|if|else|match|for|while|loop|return|break|continue)\b/g, className: 'text-purple-400' },
      { regex: /\b(true|false|None|Some)\b/g, className: 'text-orange-400' },
      { regex: /\b\d+\b/g, className: 'text-green-400' },
      { regex: /"(?:[^"\\]|\\.)*"/g, className: 'text-yellow-300' },
      { regex: /\/\/.*$/gm, className: 'text-gray-500 italic' }
    ]
  }

  const langPatterns = patterns[language] || patterns.javascript
  let highlightedCode = code

  // Apply syntax highlighting
  langPatterns.forEach(({ regex, className }) => {
    highlightedCode = highlightedCode.replace(regex, (match) => {
      return `<span class="${className}">${match}</span>`
    })
  })

  return highlightedCode
}

const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  ({
    code,
    language = 'javascript',
    showLineNumbers = true,
    showCopyButton = true,
    showDownloadButton = false,
    filename,
    className,
    onLanguageChange,
    onCodeChange,
    editable = false,
    ...props
  }, ref) => {
    const [copied, setCopied] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy code:', err)
      }
    }

    const handleDownload = () => {
      const blob = new Blob([code], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `code.${language}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    const lines = code.split('\n')
    const highlightedCode = highlightCode(code, language)
    const highlightedLines = highlightedCode.split('\n')

    return (
      <div
        ref={ref}
        className={cn(
          "relative group rounded-lg border border-bg-quaternary bg-bg-secondary overflow-hidden",
          "transition-all duration-200 hover:border-bg-tertiary",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-bg-tertiary border-b border-bg-quaternary">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="text-sm font-medium text-white">{filename}</span>
            )}
            <select
              value={language}
              onChange={(e) => onLanguageChange?.(e.target.value)}
              className="bg-transparent text-xs text-gray-400 border-none outline-none cursor-pointer hover:text-white transition-colors"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.value} value={lang.value} className="bg-bg-tertiary text-white">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className={cn(
            "flex items-center gap-1 transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            {showCopyButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 w-7 p-0 hover:bg-bg-quaternary"
                title="Copy code"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-400" />
                )}
              </Button>
            )}
            {showDownloadButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-7 w-7 p-0 hover:bg-bg-quaternary"
                title="Download code"
              >
                <Download className="h-3 w-3 text-gray-400" />
              </Button>
            )}
          </div>
        </div>

        {/* Code Content */}
        <div className="relative">
          {editable ? (
            <textarea
              value={code}
              onChange={(e) => onCodeChange?.(e.target.value)}
              className={cn(
                "w-full bg-transparent text-sm font-mono text-white",
                "border-none outline-none resize-none",
                "p-4 leading-6",
                showLineNumbers && "pl-12"
              )}
              style={{ minHeight: '120px' }}
              spellCheck={false}
            />
          ) : (
            <pre className={cn(
              "overflow-x-auto text-sm font-mono leading-6",
              "p-4 text-white",
              showLineNumbers && "pl-12"
            )}>
              {highlightedLines.map((line, index) => (
                <div key={index} className="relative">
                  {showLineNumbers && (
                    <span className="absolute left-0 top-0 w-8 text-right text-gray-500 select-none">
                      {index + 1}
                    </span>
                  )}
                  <span dangerouslySetInnerHTML={{ __html: line || ' ' }} />
                </div>
              ))}
            </pre>
          )}
        </div>

        {/* Copy feedback */}
        {copied && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-md shadow-lg animate-in fade-in-0 slide-in-from-top-1">
            Copied!
          </div>
        )}
      </div>
    )
  }
)

CodeBlock.displayName = "CodeBlock"

export { CodeBlock, type CodeBlockProps, SUPPORTED_LANGUAGES }