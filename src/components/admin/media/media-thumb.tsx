'use client';

import { FileText, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MediaInfo } from '@/lib/types';

export function MediaThumb({ media, className, alt = '' }: { media?: MediaInfo | null; className?: string; alt?: string }) {
  if (!media) {
    return <div className={cn('flex items-center justify-center bg-muted text-xs text-muted-foreground', className)}>Missing file</div>;
  }
  if (media.kind === 'video') {
    return (
      <div className={cn('relative overflow-hidden bg-black', className)}>
        <video src={`${media.url}#t=0.5`} muted preload="metadata" className="size-full object-cover" />
        <span className="absolute right-1.5 bottom-1.5 flex size-6 items-center justify-center rounded-full bg-black/70 text-white">
          <Play className="size-3 fill-current" />
        </span>
      </div>
    );
  }
  if (media.kind === 'document') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-1 bg-muted text-muted-foreground', className)}>
        <FileText className="size-6" />
        <span className="max-w-full truncate px-2 text-[10px]">{media.title}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={media.url}
      alt={alt}
      loading="lazy"
      className={cn('bg-muted object-cover', className)}
      style={media.blurDataUrl ? { backgroundImage: `url(${media.blurDataUrl})`, backgroundSize: 'cover' } : undefined}
    />
  );
}
