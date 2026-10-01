import React from 'react';

interface PannonJobLogoProps {
  className?: string;
  variant?: 'cmyk' | 'light' | 'dark' | 'navy' | 'gray-banner' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSymbolOnly?: boolean;
  showSubtitle?: boolean;
}

export const PannonJobLogo: React.FC<PannonJobLogoProps> = ({
  className = '',
  variant = 'cmyk',
  size = 'md',
  showSymbolOnly = false,
  showSubtitle = false,
}) => {
  // Height / scale configs
  const sizeStyles = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-13',
    xl: 'h-16',
  };

  // Color selection based on variant
  // In pannonjob_cmyk.png:
  // Stripe 1: Deep Navy Blue (#232B70 / #1E2B6D)
  // Stripe 2: Red (#E31E24)
  // Stripe 3: Orange (#F37021)
  // Text: Deep Navy Blue (#232B70) on light backgrounds, or Pure White (#FFFFFF) on dark backgrounds

  const getColors = () => {
    switch (variant) {
      case 'light':
        // For dark backgrounds (like dark slate navbars)
        return {
          stripe1: '#3B82F6', // luminous navy/blue
          stripe2: '#EF4444', // vibrant red
          stripe3: '#F97316', // orange
          text: '#FFFFFF',
        };
      case 'badge':
        return {
          stripe1: '#232B70',
          stripe2: '#E31E24',
          stripe3: '#F37021',
          text: '#232B70',
        };
      case 'gray-banner':
        return {
          stripe1: '#FFFFFF',
          stripe2: '#FFFFFF',
          stripe3: '#FFFFFF',
          text: '#FFFFFF',
        };
      case 'navy':
        return {
          stripe1: '#232B70',
          stripe2: '#E31E24',
          stripe3: '#F37021',
          text: '#232B70',
        };
      case 'dark':
        return {
          stripe1: '#232B70',
          stripe2: '#E31E24',
          stripe3: '#F37021',
          text: '#0F172A',
        };
      case 'cmyk':
      default:
        // Authentic CMYK brand colors
        return {
          stripe1: '#232B70',
          stripe2: '#E31E24',
          stripe3: '#F37021',
          text: '#232B70',
        };
    }
  };

  const colors = getColors();

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center bg-white px-3.5 py-1.5 rounded-xl shadow-xs border border-slate-200/80 ${className}`}>
        <svg
          viewBox={showSymbolOnly ? '0 0 160 110' : '0 0 760 110'}
          className={`${sizeStyles[size]} w-auto select-none`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 3 Slanted Rounded Stripes from pannonjob_cmyk.png */}
          <g transform="translate(14, 15)">
            {/* Stripe 1: Navy */}
            <rect
              x="24"
              y="0"
              width="26"
              height="78"
              rx="6"
              transform="skewX(-28)"
              fill="#232B70"
            />
            {/* Stripe 2: Red */}
            <rect
              x="62"
              y="0"
              width="26"
              height="78"
              rx="6"
              transform="skewX(-28)"
              fill="#E31E24"
            />
            {/* Stripe 3: Orange */}
            <rect
              x="100"
              y="0"
              width="26"
              height="78"
              rx="6"
              transform="skewX(-28)"
              fill="#F37021"
            />
          </g>

          {!showSymbolOnly && (
            <g>
              <text
                x="170"
                y={showSubtitle ? "66" : "75"}
                fontFamily="'Cinzel', 'Playfair Display', 'Times New Roman', Georgia, serif"
                fontSize="50"
                fontWeight="700"
                letterSpacing="0.03em"
                fill="#232B70"
              >
                ESETTANULMÁNYOK
              </text>
              {showSubtitle && (
                <text
                  x="172"
                  y="92"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="18"
                  fontWeight="600"
                  letterSpacing="0.12em"
                  fill="#64748B"
                >
                  MINŐSÉGBIZTOSÍTÁS
                </text>
              )}
            </g>
          )}
        </svg>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox={showSymbolOnly ? '0 0 160 110' : '0 0 760 110'}
        className={`${sizeStyles[size]} w-auto`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 3 Slanted Rounded Stripes from pannonjob_cmyk.png */}
        <g transform="translate(14, 15)">
          {/* Stripe 1 */}
          <rect
            x="24"
            y="0"
            width="26"
            height="78"
            rx="6"
            transform="skewX(-28)"
            fill={colors.stripe1}
          />
          {/* Stripe 2 */}
          <rect
            x="62"
            y="0"
            width="26"
            height="78"
            rx="6"
            transform="skewX(-28)"
            fill={colors.stripe2}
          />
          {/* Stripe 3 */}
          <rect
            x="100"
            y="0"
            width="26"
            height="78"
            rx="6"
            transform="skewX(-28)"
            fill={colors.stripe3}
          />
        </g>

        {/* Wordmark: ESETTANULMÁNYOK */}
        {!showSymbolOnly && (
          <g>
            <text
              x="170"
              y={showSubtitle ? "66" : "75"}
              fontFamily="'Cinzel', 'Playfair Display', 'Times New Roman', Georgia, serif"
              fontSize="50"
              fontWeight="700"
              letterSpacing="0.03em"
              fill={colors.text}
            >
              ESETTANULMÁNYOK
            </text>
            {showSubtitle && (
              <text
                x="172"
                y="92"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="18"
                fontWeight="600"
                letterSpacing="0.12em"
                fill={colors.text}
                opacity="0.8"
              >
                MINŐSÉGBIZTOSÍTÁS
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};

