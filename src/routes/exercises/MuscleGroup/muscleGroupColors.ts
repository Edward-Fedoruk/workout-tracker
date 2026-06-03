/**
 * Ordered palette of colours available for muscle groups.
 */
export const MUSCLE_GROUP_PALETTE = [
  '#E53935', // Red
  '#D81B60', // Pink
  '#8E24AA', // Purple
  '#3949AB', // Indigo
  '#1E88E5', // Blue
  '#039BE5', // Light Blue
  '#00ACC1', // Cyan
  '#00897B', // Teal
  '#43A047', // Green
  '#7CB342', // Light Green
  '#FB8C00', // Orange
  '#6D4C41', // Brown
  '#757575', // Grey (default / "unset")
] as const;

export const DEFAULT_MUSCLE_GROUP_COLOR = '#757575';

/**
 * Returns white or black text colour depending on which has better contrast
 * against the given hex background. Keeps chips readable at any palette colour.
 */
export const contrastText = (hex: string): '#000' | '#fff' => {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  // Perceived luminance (WCAG formula)
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.55 ? '#000' : '#fff';
};
