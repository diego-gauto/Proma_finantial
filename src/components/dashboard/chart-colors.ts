const chartColors = [
  "#76d64b",
  "#f3b45d",
  "#6f8cff",
  "#ffef3f",
  "#ff7684",
  "#5fd4ff",
  "#c879ff",
  "#21c3a8",
  "#ff8f5a",
  "#9dd66d"
];

export function getCategoryColor(index: number): string {
  return chartColors[index % chartColors.length];
}
