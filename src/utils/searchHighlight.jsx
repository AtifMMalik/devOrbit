import React from 'react';

/**
 * Wraps matches of keyword within a string in a <mark className="search-highlight">.
 * Preserves exact original casing.
 */
export function highlightText(text, keyword) {
  if (!text || !keyword || !keyword.trim()) return text;
  const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.trim().toLowerCase() ? (
          <mark key={i} className="search-highlight">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

/**
 * Cycles to the next or previous highlighted match on the current page,
 * marks it with .active-match, and smoothly scrolls it into center view.
 */
export function cycleOnPageMatch(direction = 'next', currentIndex = -1) {
  const matches = Array.from(document.querySelectorAll('mark.search-highlight'));
  if (matches.length === 0) return { currentIndex: -1, total: 0 };

  let nextIndex = currentIndex;
  if (direction === 'next') {
    nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % matches.length;
  } else if (direction === 'prev') {
    nextIndex = currentIndex <= 0 ? matches.length - 1 : (currentIndex - 1) % matches.length;
  } else if (direction === 'first') {
    nextIndex = 0;
  }

  matches.forEach((el, idx) => {
    if (idx === nextIndex) {
      el.classList.add('active-match');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      el.classList.remove('active-match');
    }
  });

  return { currentIndex: nextIndex, total: matches.length };
}

