import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// A tiny, safe Markdown subset for editor text: paragraphs, "- " lists,
// "### " headings, **bold**, *italic* and [links](https://…).

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${i++}`;
    if (match[2]) nodes.push(<strong key={key}>{match[2]}</strong>);
    else if (match[3]) nodes.push(<em key={key}>{match[3]}</em>);
    else if (match[4]) {
      const href = match[5];
      const safe = /^(https?:|mailto:|tel:|\/|#)/.test(href) ? href : '#';
      const external = /^https?:/.test(safe);
      nodes.push(
        <a key={key} href={safe} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {match[4]}
        </a>,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function withBreaks(text: string, key: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <Fragment key={`${key}-${i}`}>
      {inline(line, `${key}-${i}`)}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));
}

export function RichText({ text, className }: { text?: unknown; className?: string }) {
  if (typeof text !== 'string' || !text.trim()) return null;
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className={cn('prose-site', className)}>
      {blocks.map((block, i) => {
        const key = `b${i}`;
        const lines = block.split('\n');
        if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
          return (
            <ul key={key}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-•]\s+/, ''), `${key}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.startsWith('### ')) return <h3 key={key}>{inline(block.slice(4), key)}</h3>;
        return <p key={key}>{withBreaks(block, key)}</p>;
      })}
    </div>
  );
}
