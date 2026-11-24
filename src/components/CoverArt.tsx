import React, { useEffect, useState } from 'react';
import { CoverDefaults } from '../model/storyIds';

interface CoverArtProps {
  colorHex?: string;
  imageUrl?: string | null;
  fallbackKey?: string;
  label?: string | null;
  className?: string;
}

export const CoverArt: React.FC<CoverArtProps> = ({
  colorHex = '#9575cd',
  imageUrl,
  fallbackKey = '',
  label = null,
  className = '',
}) => {
  const hasExplicitCover = Boolean(imageUrl && imageUrl.trim());
  const fallbackSrc = CoverDefaults.forKey(fallbackKey || imageUrl || colorHex);
  const [src, setSrc] = useState<string>(hasExplicitCover ? imageUrl! : fallbackSrc);

  useEffect(() => {
    setSrc(imageUrl && imageUrl.trim() ? imageUrl : fallbackSrc);
  }, [imageUrl, fallbackSrc]);

  return (
    <div
      className={`relative overflow-hidden select-none ${className}`}
      style={{
        background: `linear-gradient(160deg, ${colorHex}ee 0%, #16141c 100%)`,
      }}
    >
      <img
        src={src}
        alt={label ?? ''}
        draggable={false}
        onError={() => {
          if (src !== fallbackSrc) setSrc(fallbackSrc);
        }}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        loading="lazy"
      />
      {label && !hasExplicitCover && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.62) 100%)',
            }}
          />
          <span className="relative z-10 block p-3 text-white font-medium text-sm leading-snug line-clamp-2">
            {label}
          </span>
        </>
      )}
    </div>
  );
};
