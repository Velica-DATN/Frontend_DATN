import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  /** Text that can contain mixed text with $inline$ or $$block$$ LaTeX formulas */
  content?: string;
  /** Direct pure LaTeX formula */
  math?: string;
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
 * Tokenize a string into text, inline math ($...$ or \(...\)), and block math ($$...$$ or \[...\])
 */
function parseMathTokens(text: string): ParsedToken[] {
  if (!text) return [];

  const tokens: ParsedToken[] = [];
  // Regex to match:
  // 1. $$ ... $$ (block math)
  // 2. \[ ... \] (block math)
  // 3. $ ... $ (inline math)
  // 4. \( ... \) (inline math)
  const mathRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$(?:\\\$|[^\$\n])+\$|\\\([\s\S]+?\\\))/g;

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
    if (rawMatch.startsWith('$$') && rawMatch.endsWith('$$')) {
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
      tokens.push({
        type: 'inline-math',
        value: rawMatch.slice(1, -1).trim(),
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
 * Render single LaTeX formula using KaTeX safely
 */
function renderKaTeX(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
    });
  } catch {
    // Fallback if KaTeX fails
    return `<span class="text-danger font-mono">[Lỗi công thức: ${latex}]</span>`;
  }
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  math,
  displayMode = false,
  className = '',
  style,
}) => {
  // If direct math is provided
  const directRendered = useMemo(() => {
    if (!math) return null;
    return renderKaTeX(math, displayMode);
  }, [math, displayMode]);

  // If mixed text content is provided
  const parsedElements = useMemo(() => {
    if (math || !content) return null;

    const tokens = parseMathTokens(content);
    return tokens.map((tok, idx) => {
      if (tok.type === 'text') {
        return (
          <span key={idx} style={{ whiteSpace: 'pre-wrap' }}>
            {tok.value}
          </span>
        );
      }

      const isBlock = tok.type === 'block-math';
      const renderedHtml = renderKaTeX(tok.value, isBlock);

      return (
        <span
          key={idx}
          className={isBlock ? 'd-block text-center my-2' : 'inline-math-item'}
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      );
    });
  }, [content, math]);

  if (directRendered) {
    return (
      <span
        className={`velica-math-rendered ${className}`}
        style={style}
        dangerouslySetInnerHTML={{ __html: directRendered }}
      />
    );
  }

  if (!content) {
    return null;
  }

  return (
    <span className={`velica-math-container ${className}`} style={style}>
      {parsedElements}
    </span>
  );
};
