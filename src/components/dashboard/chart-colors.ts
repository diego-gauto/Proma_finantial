const chartColors = [
  "#008a7a",
  "#6d5bd0",
  "#f5ad55",
  "#3f7ee8",
  "#d72c6c",
  "#37a56f",
  "#f6d94a",
  "#6fb7ff",
  "#b54be8",
  "#ff7b54"
];

export function getCategoryColor(index: number): string {
  return chartColors[index % chartColors.length];
}
