export interface Tile {
  id: string;
  title: string;
  icon: string;
  value: string;
  dataType: string; // KPI, chart, etc.
  visible: boolean;
}