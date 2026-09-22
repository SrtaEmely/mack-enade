import React from 'react';

export type LogoVariant = 'horizontal' | 'vertical' | 'monogram' | 'header' | 'hero' | 'minimal' | 'footer';
export type LogoColor = 'red' | 'black' | 'white' | 'auto';

interface UPMLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: LogoVariant;
  color?: LogoColor;
  className?: string;
  showEnadeBadge?: boolean;
}

/**
 * Official Universidade Presbiteriana Mackenzie (UPM) Logo Component
 * Incorporates the authentic Mackenzie circular "M" monogram, horizontal signature,
 * and vertical institutional marks in red (#EA0029), black (#111111), and white (#FFFFFF).
 */
export const UPMLogo: React.FC<UPMLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  color = 'red',
  className = '',
  showEnadeBadge = true,
}) => {
  const hexColor = color === 'white' ? '#FFFFFF' : color === 'black' ? '#18181B' : '#EA0029';
  const textColor = color === 'white' ? '#FFFFFF' : '#18181B';

  const sizeHeights = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  };

  // Monogram SVG rendering the authentic Mackenzie Collegiate 'M' inside circular band
  const renderMonogram = (dim = 'h-full aspect-square') => (
    <svg
      viewBox="0 0 500 500"
      className={`${dim} select-none shrink-0`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer circular band */}
      <circle
        cx="250"
        cy="250"
        r="212"
        stroke={hexColor}
        strokeWidth="46"
      />
      {/* Mackenzie Collegiate M: Left vertical with serifs */}
      <path
        d="M 128 140 H 202 V 158 C 188 160 184 170 184 186 V 314 C 184 330 188 340 202 342 V 360 H 128 V 342 C 142 340 146 330 146 314 V 186 C 146 170 142 160 128 158 Z"
        fill={hexColor}
      />
      {/* Mackenzie Collegiate M: Right vertical with serifs */}
      <path
        d="M 298 140 H 372 V 158 C 358 160 354 170 354 186 V 314 C 354 330 358 340 372 342 V 360 H 298 V 342 C 312 340 316 330 316 314 V 186 C 316 170 312 160 298 158 Z"
        fill={hexColor}
      />
      {/* Mackenzie Collegiate M: Center vertex diagonal chevron */}
      <path
        d="M 184 182 L 243 328 C 246 335 254 335 257 328 L 316 182 L 282 182 L 250 268 L 218 182 Z"
        fill={hexColor}
      />
    </svg>
  );

  // Pure monogram mode
  if (variant === 'monogram') {
    return (
      <div
        id="upm-monogram-logo"
        className={`inline-flex items-center justify-center ${sizeHeights[size]} ${className}`}
        title="Universidade Presbiteriana Mackenzie"
      >
        {renderMonogram()}
      </div>
    );
  }

  // Vertical stacked mark
  if (variant === 'vertical') {
    return (
      <div
        id="upm-vertical-logo"
        className={`inline-flex flex-col items-center text-center gap-2 select-none ${className}`}
        title="Universidade Presbiteriana Mackenzie"
      >
        <div className={sizeHeights[size]}>{renderMonogram()}</div>
        <div className="flex flex-col items-center leading-tight">
          <span
            className="text-xs font-semibold tracking-tight"
            style={{ color: textColor }}
          >
            Universidade Presbiteriana
          </span>
          <span
            className="text-xl font-black tracking-tighter"
            style={{ color: hexColor }}
          >
            Mackenzie
          </span>
          {showEnadeBadge && (
            <span className="mt-1 inline-block bg-[#EA0029] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
              Piloto ENADE 2026
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default: Horizontal signature (Header, Hero, Minimal, Footer)
  return (
    <div
      id="upm-horizontal-logo"
      className={`inline-flex items-center gap-3 select-none ${sizeHeights[size]} ${className}`}
      title="Universidade Presbiteriana Mackenzie - Mack ENADE"
      aria-label="Mackenzie ENADE"
    >
      {/* Monogram emblem */}
      <div className="h-full py-0.5">{renderMonogram()}</div>

      {/* Signature Typography */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-2">
          <span
            className="font-extrabold tracking-tight uppercase text-sm sm:text-base"
            style={{ color: textColor }}
          >
            MACKENZIE
          </span>
          {showEnadeBadge && (
            <span className="bg-[#EA0029] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase shadow-xs">
              ENADE
            </span>
          )}
        </div>
        {variant !== 'minimal' && (
          <span
            className="text-[10px] sm:text-xs font-medium tracking-normal mt-0.5 truncate max-w-[200px] sm:max-w-none"
            style={{ color: color === 'white' ? '#E4E4E7' : '#71717A' }}
          >
            Universidade Presbiteriana Mackenzie
          </span>
        )}
      </div>
    </div>
  );
};
