import React from 'react';
import {
  FileText,
  MessageSquare,
  ShieldAlert,
  Lightbulb,
  ThumbsUp,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Layers,
  Quote,
  ArrowRight,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface StructuredFeedbackRendererProps {
  content: string;
  defaultTitle?: string;
  variant?: 'slate' | 'indigo' | 'amber' | 'emerald';
  className?: string;
}

interface ParsedSection {
  title?: string;
  lines: string[];
}

/**
 * Strips "Bevezetés", "Bevezető", greeting lines, or introductory meta-sentences
 * from the beginning of feedback text, and strips any raw markdown hashes (#, ##, ###).
 */
export function stripIntroductionText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let text = raw.trim();

  // Replace any accidental "építő kritika" with professional feedback wording
  text = text
    .replace(/építő\s+jellegű\s+kritika/gi, 'szakmai visszajelzés és fejlesztendő pontok')
    .replace(/építő\s+kritika/gi, 'fejlesztendő pontok és visszajelzés');

  // Strip opinion phrases from "személyzeti / szemléleti változtatás"
  text = text
    .replace(/A legfontosabb (?:szemléleti|személyzeti) változtatás(?:om)? (?:szerintem|a véleményem szerint|véleményem szerint):?/gi, 'A legfontosabb szemléleti változtatás:')
    .replace(/(?:szerintem|a te véleményed szerint|a véleményem szerint|véleményem szerint)/gi, '');

  const introPatterns = [
    /^(?:#+\s*)?(?:\*\*)?(?:1\.\s*)?(?:Bevezetés|Bevezető|Bevezetés és összefoglaló|Bevezető gondolatok)(?:\*\*)?(?::|\s*-|\s*—)?\s*(?:\r?\n)+/i,
    /^(?:#+\s*)?(?:\*\*)?(?:Bevezetés|Bevezető)(?:\*\*)?(?::|\s*-|\s*—)?\s*/i,
    /^(?:Kedves\s+[^\n!]+[!,\.]\s*(?:\r?\n)*)/i,
    /^(?:Az alábbiakban\s+[^\n]+(?:értékelése|elemzése|összegzése|visszajelzése)[^\n]*:?\s*(?:\r?\n)+)/i,
    /^(?:Bevezetésként\s+[^\n]+(?:\r?\n)+)/i,
  ];

  let changed = true;
  let loops = 0;
  while (changed && loops < 5) {
    changed = false;
    loops++;
    for (const pat of introPatterns) {
      if (pat.test(text)) {
        text = text.replace(pat, '').trim();
        changed = true;
      }
    }
  }

  // Strip any raw markdown heading hashes at the beginning of any lines (e.g. ### Title -> Title)
  text = text.replace(/^[ \t]*#{1,6}[ \t]+/gm, '');

  return text;
}

/**
 * Parses raw markdown or plain text into structured sections.
 */
function parseIntoSections(text: string): ParsedSection[] {
  const cleaned = stripIntroductionText(text);
  if (!cleaned) return [];

  const rawLines = cleaned.split('\n');
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection = { lines: [] };

  const isHeadingLine = (line: string): { isHeading: boolean; title: string } => {
    let trimmed = line.trim();
    if (!trimmed) return { isHeading: false, title: '' };

    // Strip leading markdown hashes if present (#, ##, ###)
    if (/^#{1,6}\s+/.test(trimmed)) {
      trimmed = trimmed.replace(/^#{1,6}\s+/, '').trim();
    }

    // Explicit section title patterns (without hashes)
    if (/^(?:Vezetői Összegzés és Értékelés|Vezetői Elemzés|Vezetői Értékelés)/i.test(trimmed)) {
      const title = trimmed.replace(/\*\*/g, '').replace(/:$/, '').trim();
      return { isHeading: true, title };
    }

    // Numbered title: "1. Szakmai Pontosság..." or "2. Ügyfélközpontúság..." or "### 1. Title"
    if (/^(?:[0-9]+\.|[IVXLCDM]+\.)\s+[A-ZÁÉÍÓÖŐÚÜŰ][^\n]{3,80}/.test(trimmed)) {
      const title = trimmed.replace(/\*\*/g, '').replace(/:$/, '').trim();
      return { isHeading: true, title };
    }

    // Bold title on its own line: **1. Title** or **Title:**
    if (/^\*\*(?:[0-9]+\.\s*)?[^\*]+\*\*:?$/.test(trimmed)) {
      const title = trimmed.replace(/\*\*/g, '').replace(/:$/, '').trim();
      return { isHeading: true, title };
    }

    return { isHeading: false, title: '' };
  };

  for (const line of rawLines) {
    const headingCheck = isHeadingLine(line);
    if (headingCheck.isHeading) {
      if (currentSection.title || currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        title: headingCheck.title,
        lines: [],
      };
    } else {
      currentSection.lines.push(line);
    }
  }

  if (currentSection.title || currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  // If no explicit headings were found, group by double newlines or substantial paragraphs
  if (sections.length === 1 && !sections[0].title) {
    const fullText = sections[0].lines.join('\n').trim();
    const paragraphs = fullText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    if (paragraphs.length > 1) {
      return paragraphs.map((p, idx) => {
        const firstLine = p.trim().split('\n')[0];
        const headingMatch = isHeadingLine(firstLine);
        if (headingMatch.isHeading) {
          const restLines = p.trim().split('\n').slice(1);
          return {
            title: headingMatch.title,
            lines: restLines,
          };
        }
        return {
          title: paragraphs.length > 2 ? `${idx + 1}. Részterület és Szempontok` : undefined,
          lines: p.trim().split('\n'),
        };
      });
    }
  }

  // Filter out any trailing "Kiemelt prioritású fejlesztendő pontok" section per user requirement
  return sections.filter((sec) => {
    const t = (sec.title || '').toLowerCase();
    if (t.includes('kiemelt prioritású fejlesztendő') || t.includes('kiemelt fejlesztendő pontok')) {
      return false;
    }
    return true;
  });
}

/**
 * Returns an icon and theme colors based on the section title keywords.
 */
function getSectionTheme(title?: string): {
  icon: React.ComponentType<{ className?: string }>;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
  cardBg: string;
  isPositive?: boolean;
  isNegative?: boolean;
  defaultTextColor?: string;
} {
  if (!title) {
    return {
      icon: Layers,
      borderClass: 'border-slate-200',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700',
      cardBg: 'bg-white',
      defaultTextColor: 'text-slate-800',
    };
  }

  const t = title.toLowerCase();

  if (t.includes('kockázat') || t.includes('jog') || t.includes('szabályzat') || t.includes('veszély')) {
    return {
      icon: ShieldAlert,
      borderClass: 'border-amber-200/90',
      badgeBg: 'bg-amber-100 text-amber-900',
      badgeText: 'text-amber-950',
      cardBg: 'bg-amber-50/40',
      isNegative: true,
      defaultTextColor: 'text-amber-950',
    };
  }

  if (t.includes('kommunikáció') || t.includes('ügyfél') || t.includes('címzett') || t.includes('hangnem') || t.includes('levél')) {
    return {
      icon: MessageSquare,
      borderClass: 'border-blue-200/90',
      badgeBg: 'bg-blue-100 text-blue-900',
      badgeText: 'text-blue-950',
      cardBg: 'bg-blue-50/40',
      defaultTextColor: 'text-slate-800',
    };
  }

  if (t.includes('javítás') || t.includes('mintamondat') || t.includes('etalon') || t.includes('javaslat') || t.includes('tanács')) {
    return {
      icon: Lightbulb,
      borderClass: 'border-blue-200/90',
      badgeBg: 'bg-blue-100 text-blue-900',
      badgeText: 'text-blue-950',
      cardBg: 'bg-blue-50/30',
      defaultTextColor: 'text-blue-950',
    };
  }

  if (t.includes('pozitív') || t.includes('erősség') || t.includes('megerősít') || t.includes('helyes')) {
    return {
      icon: ThumbsUp,
      borderClass: 'border-emerald-300',
      badgeBg: 'bg-emerald-100 text-emerald-900',
      badgeText: 'text-emerald-950 font-bold',
      cardBg: 'bg-emerald-50/70',
      isPositive: true,
      defaultTextColor: 'text-emerald-950 font-medium',
    };
  }

  if (t.includes('fejleszt') || t.includes('hiba') || t.includes('hiány') || t.includes('javítandó') || t.includes('negatív')) {
    return {
      icon: AlertCircle,
      borderClass: 'border-red-300',
      badgeBg: 'bg-red-100 text-red-900',
      badgeText: 'text-red-950 font-bold',
      cardBg: 'bg-red-50/70',
      isNegative: true,
      defaultTextColor: 'text-red-950 font-medium',
    };
  }

  if (t.includes('szakmai') || t.includes('eljárás') || t.includes('döntés') || t.includes('folyamat')) {
    return {
      icon: FileText,
      borderClass: 'border-indigo-200/80',
      badgeBg: 'bg-indigo-100 text-indigo-900',
      badgeText: 'text-indigo-950',
      cardBg: 'bg-indigo-50/30',
      defaultTextColor: 'text-slate-800',
    };
  }

  return {
    icon: CheckCircle2,
    borderClass: 'border-slate-200',
    badgeBg: 'bg-slate-100 text-slate-700',
    badgeText: 'text-slate-900',
    cardBg: 'bg-white',
    defaultTextColor: 'text-slate-800',
  };
}

/**
 * Format a paragraph: detect inline bold, quotes, and bullets.
 */
function renderFormattedLine(
  line: string,
  index: number,
  theme?: { isPositive?: boolean; isNegative?: boolean; defaultTextColor?: string }
) {
  const trimmed = line.trim();
  if (!trimmed) return <div key={index} className="h-0.5" />;

  // Bullet line (starts with -, •, *, 🟢, 🔴, 💡, ⚠️, 🎯)
  const isBullet = /^[-•\*]\s+/.test(trimmed) || /^(?:🟢|🔴|💡|⚠️|🎯)\s*/.test(trimmed);
  const bulletPrefix = trimmed.match(/^(?:[-•\*]|🟢|🔴|💡|⚠️|🎯)\s*/)?.[0] || '';
  const cleanBulletContent = isBullet ? trimmed.replace(/^(?:[-•\*]|🟢|🔴|💡|⚠️|🎯)\s*/, '') : trimmed;

  // Quote or citation block (e.g. "..." or „...”)
  const isQuotation =
    (/^["„»]/.test(trimmed) && /["”«]$/.test(trimmed)) ||
    trimmed.startsWith('>') ||
    trimmed.startsWith('Idézet:') ||
    trimmed.startsWith('Mintamondat:') ||
    trimmed.startsWith('Javasolt megfogalmazás:');

  // Format inline bold markdown: **bold text**
  const renderInlineMarkdown = (str: string, boldClass?: string) => {
    const parts = str.split(/(\*\*[^\*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className={boldClass || "font-bold text-slate-950"}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Check for original phrasing from employee's text
  const isOriginalPhrase =
    /^(?:[-•\*]\s*)?(?:🔴\s*)?(?:(?:[0-9]+\.\s*)?Eredeti megfogalmazás(?: a leveledből)?|Idézet a leveledből|Eredeti kifejezés|Eredeti problémás megfogalmazás|Eredeti zárás)(?::|\s*—|\s*-)/i.test(
      trimmed
    );

  // Check for suggested phrasing / how to do it differently
  const isSuggestedPhrase =
    /^(?:[-•\*]\s*)?(?:💡\s*)?(?:Javasolt megfogalmazás(?:\s*\(hogyan kellene máshogy\))?|Hogyan kellene máshogy|Javasolt folyamatvezetés)(?::|\s*—|\s*-)/i.test(
      trimmed
    );

  if (isOriginalPhrase) {
    const cleanContent = trimmed.replace(
      /^(?:[-•\*]\s*)?(?:🔴\s*)?(?:(?:[0-9]+\.\s*)?Eredeti megfogalmazás(?: a leveledből)?|Idézet a leveledből|Eredeti kifejezés|Eredeti problémás megfogalmazás|Eredeti zárás)(?::|\s*—|\s*-)\s*/i,
      ''
    );
    return (
      <div
        key={index}
        className="my-0.5 py-1 px-2.5 bg-rose-50/90 border-l-3 border-rose-500 rounded-r-md text-rose-950 flex items-start space-x-1.5 text-xs"
      >
        <span className="font-extrabold text-rose-900 text-[10px] uppercase tracking-wider flex-shrink-0 pt-0.5">
          Eredeti:
        </span>
        <div className="italic font-mono text-[11px] text-rose-950 leading-snug flex-1">
          {renderInlineMarkdown(cleanContent || trimmed, 'font-bold text-rose-950')}
        </div>
      </div>
    );
  }

  if (isSuggestedPhrase) {
    const cleanContent = trimmed.replace(
      /^(?:[-•\*]\s*)?(?:💡\s*)?(?:Javasolt megfogalmazás(?:\s*\(hogyan kellene máshogy\))?|Hogyan kellene máshogy|Javasolt folyamatvezetés)(?::|\s*—|\s*-)\s*/i,
      ''
    );
    return (
      <div
        key={index}
        className="my-0.5 py-1 px-2.5 bg-emerald-50/90 border-l-3 border-emerald-500 rounded-r-md text-emerald-950 flex items-start space-x-1.5 text-xs"
      >
        <span className="font-extrabold text-emerald-900 text-[10px] uppercase tracking-wider flex-shrink-0 pt-0.5">
          Javasolt:
        </span>
        <div className="font-mono text-[11px] text-emerald-950 leading-snug font-medium flex-1">
          {renderInlineMarkdown(cleanContent || trimmed, 'font-bold text-emerald-950')}
        </div>
      </div>
    );
  }

  if (isQuotation) {
    const cleanQuote = trimmed
      .replace(/^>\s*/, '')
      .replace(/^(?:Idézet|Mintamondat|Javasolt megfogalmazás):\s*/i, '');
    return (
      <div
        key={index}
        className="my-0.5 py-1 px-2.5 bg-blue-50/80 border-l-3 border-blue-500 rounded-r-md text-xs text-blue-950 flex items-start space-x-1.5"
      >
        <Quote className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="leading-snug italic font-mono text-[11px] text-blue-950 flex-1">
          {renderInlineMarkdown(cleanQuote, 'font-bold text-blue-950')}
        </div>
      </div>
    );
  }

  // 🟢 Pozitívumok: vizuálisan kompakt, szöveghez közeli sor
  if (bulletPrefix.includes('🟢') || (theme?.isPositive && isBullet)) {
    return (
      <div
        key={index}
        className="flex items-start space-x-1.5 py-0.5 text-xs text-emerald-950 font-medium"
      >
        <span className="text-emerald-600 font-bold flex-shrink-0 text-xs">🟢</span>
        <div className="leading-relaxed text-emerald-950">
          {renderInlineMarkdown(cleanBulletContent, 'font-bold text-emerald-950')}
        </div>
      </div>
    );
  }

  // 🔴 Negatívumok / fejlesztendő pontok: vizuálisan kompakt, szöveghez közeli sor
  if (bulletPrefix.includes('🔴') || (theme?.isNegative && isBullet)) {
    return (
      <div
        key={index}
        className="flex items-start space-x-1.5 py-0.5 text-xs text-red-950 font-medium"
      >
        <span className="text-red-600 font-bold flex-shrink-0 text-xs">🔴</span>
        <div className="leading-relaxed text-red-950">
          {renderInlineMarkdown(cleanBulletContent, 'font-bold text-red-950')}
        </div>
      </div>
    );
  }

  if (isBullet) {
    let iconElement = <span className="text-slate-400 font-bold">•</span>;
    let badgeClass = 'text-slate-800';

    if (bulletPrefix.includes('💡')) {
      iconElement = <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />;
      badgeClass = 'text-amber-950';
    } else if (bulletPrefix.includes('⚠️')) {
      iconElement = <ShieldAlert className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />;
      badgeClass = 'text-rose-950';
    } else if (bulletPrefix.includes('🎯')) {
      iconElement = <Sparkles className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />;
      badgeClass = 'text-amber-950 font-medium';
    }

    return (
      <div key={index} className={`flex items-start space-x-2 py-0.5 text-xs ${badgeClass}`}>
        <span className="flex-shrink-0 pt-0.5">{iconElement}</span>
        <div className="leading-relaxed">{renderInlineMarkdown(cleanBulletContent)}</div>
      </div>
    );
  }

  // Regular paragraph with theme-based text coloring
  const textColor = theme?.isPositive
    ? 'text-emerald-950 font-medium'
    : theme?.isNegative
    ? 'text-red-950 font-medium'
    : theme?.defaultTextColor || 'text-slate-800';

  return (
    <p key={index} className={`text-xs ${textColor} leading-relaxed py-0.5`}>
      {renderInlineMarkdown(trimmed)}
    </p>
  );
}

export const StructuredFeedbackRenderer: React.FC<StructuredFeedbackRendererProps> = ({
  content,
  defaultTitle,
  variant = 'slate',
  className = '',
}) => {
  const sections = parseIntoSections(content);

  if (sections.length === 0) {
    return (
      <div className={`p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 ${className}`}>
        Nincs megjeleníthető részletes elemzés.
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {sections.map((section, idx) => {
        const theme = getSectionTheme(section.title);
        const IconComponent = theme.icon;

        return (
          <div
            key={idx}
            className={`rounded-xl border p-2.5 sm:p-3 transition-all shadow-2xs ${theme.borderClass} ${theme.cardBg}`}
          >
            {/* Section Header (if title exists or default provided) */}
            {(section.title || (sections.length === 1 && defaultTitle)) && (
              <div className="flex items-center space-x-1.5 border-b border-slate-200/60 pb-1.5 mb-2">
                <div className="p-0.5 rounded bg-white shadow-2xs border border-slate-200/70">
                  <IconComponent className="w-3 h-3 text-slate-700" />
                </div>
                <h4 className={`font-bold text-xs sm:text-sm ${theme.badgeText}`}>
                  {section.title || defaultTitle}
                </h4>
              </div>
            )}

            {/* Section Content */}
            <div className="space-y-0.5">
              {section.lines.map((line, lineIdx) => renderFormattedLine(line, lineIdx, theme))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
