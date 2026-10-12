import React, { useMemo } from 'react';
import katex, { renderToString } from 'katex';

export interface MathRendererProps {
  /** Text that can contain mixed text with $inline$ or $$block$$ LaTeX formulas */
  content?: string;
  /** Direct pure LaTeX formula */
  math?: string;
  /** Children can be passed as string or ReactNode */
  children?: React.ReactNode;
  /** Whether pure LaTeX formula is in block/display mode */
  displayMode?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface ParsedToken {
  type: 'text' | 'inline-math' | 'block-math';
  value: string;
}

/**
 * Universal safe KaTeX renderToString that works regardless of module export format (CJS/ESM/Vite)
 */
export function safeRenderToString(
  latex: string,
  options: {
    displayMode?: boolean;
    throwOnError?: boolean;
    output?: 'htmlAndMathml' | 'html' | 'mathml';
  } = {}
): string {
  const opts = {
    displayMode: false,
    throwOnError: false,
    output: 'htmlAndMathml' as const,
    ...options,
  };

  try {
    if (typeof renderToString === 'function') {
      return renderToString(latex, opts);
    }
    if (typeof (katex as any)?.renderToString === 'function') {
      return (katex as any).renderToString(latex, opts);
    }
    if (typeof (katex as any)?.default?.renderToString === 'function') {
      return (katex as any).default.renderToString(latex, opts);
    }
    throw new Error('KaTeX renderToString function is unavailable');
  } catch {
    return `<span class="katex-error font-mono text-danger">[Lỗi công thức: ${latex}]</span>`;
  }
}

/**
 * Strip enclosing math delimiters ($$, $, \[, \], \(, \)) if present
 */
export function cleanMathDelimiters(raw: string): string {
  if (!raw) return '';
  let str = raw.trim();
  if (str.startsWith('$$') && str.endsWith('$$') && str.length >= 4) {
    return str.slice(2, -2).trim();
  }
  if (str.startsWith('\\[') && str.endsWith('\\]') && str.length >= 4) {
    return str.slice(2, -2).trim();
  }
  if (str.startsWith('\\(') && str.endsWith('\\') && str.length >= 4) {
    return str.slice(2, -2).trim();
  }
  if (str.startsWith('$') && str.endsWith('$') && str.length >= 2) {
    return str.slice(1, -1).trim();
  }
  return str;
}

/**
 * Regex to detect common pure LaTeX commands when no delimiter is used
 */
const PURE_LATEX_COMMANDS = /^\s*\\(frac|sqrt|sum|int|lim|begin|pmatrix|cases|vec|alpha|beta|gamma|delta|Delta|lambda|Lambda|sigma|Sigma|pi|Pi|theta|Theta|omega|Omega|infty|pm|le|ge|leq|geq|ne|neq|approx|equiv|times|cdot|circ|cup|cap|in|notin|subset|subseteq|forall|exists|partial|nabla)/;

/**
 * Check if a text is likely pure LaTeX even without dollar signs
 */
export function isLikelyPureLatex(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  return trimmed.startsWith('\\') && PURE_LATEX_COMMANDS.test(trimmed);
}

/**
 * Check if a string contains any mathematical delimiters or commands
 */
export function hasMathFormula(text: string): boolean {
  if (!text) return false;
  return /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$([^\$]+?)\$|\\\([\s\S]+?\\\))/.test(text) || isLikelyPureLatex(text);
}

/**
 * Tokenize a mixed text into plain text, inline math, and block math.
 * Handles escaped dollar signs (\$), block math ($$...$$, \[...\]),
 * inline math ($...$, \(...\)), and multiline formulas safely.
 */
export function parseMathTokens(text: string): ParsedToken[] {
  if (!text || typeof text !== 'string') return [];

  const tokens: ParsedToken[] = [];
  // Regex to match:
  // 1. Escaped dollar sign: \$
  // 2. Block math: $$ ... $$
  // 3. Block math: \[ ... \]
  // 4. Inline math: \( ... \)
  // 5. Inline math: $ ... $ (opening not followed by space, closing not preceded by space, or multiline)
  const mathRegex = /(\\\$|\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s)(?:\\\$|[^\$])+?(?<!\s)\$|\$[^\$]+?\$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(text)) !== null) {
    // Add text preceding the match
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        value: text.slice(lastIndex, match.index),
      });
    }

    const rawMatch = match[0];

    // Escaped dollar sign: \$ -> render as regular text "$"
    if (rawMatch === '\\$') {
      tokens.push({
        type: 'text',
        value: '$',
      });
    } else if (rawMatch.startsWith('$$') && rawMatch.endsWith('$$')) {
      tokens.push({
        type: 'block-math',
        value: rawMatch.slice(2, -2).trim(),
      });
    } else if (rawMatch.startsWith('\\[') && rawMatch.endsWith('\\]')) {
      tokens.push({
        type: 'block-math',
        value: rawMatch.slice(2, -2).trim(),
      });
    } else if (rawMatch.startsWith('\\(') && rawMatch.endsWith('\\)')) {
      tokens.push({
        type: 'inline-math',
        value: rawMatch.slice(2, -2).trim(),
      });
    } else if (rawMatch.startsWith('$') && rawMatch.endsWith('$')) {
      const inner = rawMatch.slice(1, -1).trim();
      // If it looks like currency or conversational text (e.g. "$50 và $100"), check whether it's valid LaTeX
      tokens.push({
        type: 'inline-math',
        value: inner,
      });
    }

    lastIndex = match.index + rawMatch.length;
  }

  // Add trailing text
  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      value: text.slice(lastIndex),
    });
  }

  return tokens;
}

/**
 * Render text with line breaks preserved using <br /> without breaking text-truncate
 */
function renderTextLines(text: string, keyPrefix: string | number) {
  if (!text.includes('\n')) {
    return <React.Fragment key={keyPrefix}>{text}</React.Fragment>;
  }

  const lines = text.split('\n');
  return (
    <React.Fragment key={keyPrefix}>
      {lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
    </React.Fragment>
  );
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  math,
  children,
  displayMode = false,
  className = '',
  style,
}) => {
  // If direct math prop is provided
  const directRendered = useMemo(() => {
    if (!math) return null;
    const cleanFormula = cleanMathDelimiters(math);
    return safeRenderToString(cleanFormula, { displayMode, throwOnError: false });
  }, [math, displayMode]);

  // Extract raw text from content or children
  const rawInput = useMemo(() => {
    if (content !== undefined && content !== null) {
      return String(content);
    }
    if (typeof children === 'string' || typeof children === 'number') {
      return String(children);
    }
    return '';
  }, [content, children]);

  // If input is likely pure LaTeX without dollar delimiters
  const pureLatexRendered = useMemo(() => {
    if (math || !rawInput) return null;
    if (isLikelyPureLatex(rawInput) && !rawInput.includes('$')) {
      return safeRenderToString(rawInput.trim(), { displayMode, throwOnError: false });
    }
    return null;
  }, [math, rawInput, displayMode]);

  // Parse mixed text with embedded LaTeX tokens
  const parsedElements = useMemo(() => {
    if (math || pureLatexRendered || !rawInput) return null;

    const tokens = parseMathTokens(rawInput);
    return tokens.map((tok, idx) => {
      if (tok.type === 'text') {
        return renderTextLines(tok.value, idx);
      }

      const isBlock = tok.type === 'block-math';
      const renderedHtml = safeRenderToString(tok.value, {
        displayMode: isBlock,
        throwOnError: false,
      });

      return (
        <span
          key={idx}
          className={isBlock ? 'velica-math-block my-2 text-center' : 'velica-math-inline inline-math-item'}
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      );
    });
  }, [rawInput, math, pureLatexRendered]);

  if (directRendered) {
    return (
      <span
        className={`velica-math-rendered ${displayMode ? 'velica-math-block' : 'velica-math-inline'} ${className}`}
        style={style}
        dangerouslySetInnerHTML={{ __html: directRendered }}
      />
    );
  }

  if (pureLatexRendered) {
    return (
      <span
        className={`velica-math-rendered ${displayMode ? 'velica-math-block' : 'velica-math-inline'} ${className}`}
        style={style}
        dangerouslySetInnerHTML={{ __html: pureLatexRendered }}
      />
    );
  }

  if (!rawInput && !children) {
    return null;
  }

  if (!parsedElements && children) {
    return <span className={`velica-math-container ${className}`} style={style}>{children}</span>;
  }

  return (
    <span className={`velica-math-container ${className}`} style={style}>
      {parsedElements}
    </span>
  );
};

export default MathRenderer;
