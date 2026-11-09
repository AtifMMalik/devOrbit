/**
 * Calculates pixel coordinates of caret in textarea or input elements.
 * Based on the standard textarea-caret mirror algorithm.
 */

const properties = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  'MozTabSize',
];

export function getCaretCoordinates(element, position) {
  if (!element || typeof window === 'undefined' || typeof document === 'undefined') {
    return { top: 0, left: 0, height: 20 };
  }

  const isInput = element.nodeName === 'INPUT';
  const div = document.createElement('div');
  div.id = 'devorbit-caret-mirror-div';
  document.body.appendChild(div);

  const style = div.style;
  const computed = window.getComputedStyle(element);

  style.whiteSpace = 'pre-wrap';
  if (!isInput) style.wordWrap = 'break-word';
  style.position = 'absolute';
  style.visibility = 'hidden';
  style.top = '-9999px';
  style.left = '-9999px';

  properties.forEach((prop) => {
    style[prop] = computed[prop];
  });

  style.overflow = 'hidden';

  div.textContent = element.value.substring(0, position);
  if (isInput) {
    div.textContent = div.textContent.replace(/\s/g, '\u00a0');
  }

  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);

  const coordinates = {
    top: span.offsetTop + parseInt(computed['borderTopWidth'] || '0', 10),
    left: span.offsetLeft + parseInt(computed['borderLeftWidth'] || '0', 10),
    height: parseInt(computed['lineHeight'] || computed['fontSize'] || '16', 10),
  };

  document.body.removeChild(div);

  const rect = element.getBoundingClientRect();
  const coordTop = typeof coordinates.top === 'number' && !isNaN(coordinates.top) ? coordinates.top : 20;
  const coordLeft = typeof coordinates.left === 'number' && !isNaN(coordinates.left) ? coordinates.left : 10;
  const coordHeight = typeof coordinates.height === 'number' && !isNaN(coordinates.height) ? coordinates.height : 18;

  return {
    top: (rect.top || 0) + coordTop - (element.scrollTop || 0),
    left: (rect.left || 0) + coordLeft - (element.scrollLeft || 0),
    height: coordHeight,
  };
}
