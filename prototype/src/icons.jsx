// Minimal hairline icons. Used VERY sparingly — type does most of the work.
const Icon = ({ d, size = 16, stroke = 1.5, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const IconArrow = (p) => <Icon {...p} d="M5 12h14 M13 6l6 6-6 6" />;
const IconArrowLeft = (p) => <Icon {...p} d="M19 12H5 M11 6l-6 6 6 6" />;
const IconCheck = (p) => <Icon {...p} d="M4 12l5 5L20 6" />;
const IconMic = (p) => <Icon {...p} d={
  <g>
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0 M12 18v3" />
  </g>
} />;
const IconClose = (p) => <Icon {...p} d="M6 6l12 12 M18 6L6 18" />;
const IconPlay = (p) => <Icon {...p} d="M7 5l12 7-12 7V5z" />;
const IconPause = (p) => <Icon {...p} d={<g><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></g>} />;
const IconDot = (p) => <Icon {...p} d={<circle cx="12" cy="12" r="3" />} />;

Object.assign(window, {
  Icon, IconArrow, IconArrowLeft, IconCheck, IconMic, IconClose, IconPlay, IconPause, IconDot,
});
