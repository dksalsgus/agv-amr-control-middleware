export type RouteNodeKind = "CHARGER" | "STATION" | "STORAGE" | "JUNCTION";

export interface RouteNode {
  id: string;
  x: number;
  y: number;
  kind: RouteNodeKind;
}

export type RouteLane = [string, string];

export interface RouteSearchStep {
  node: RouteNode;
  path: RouteNode[];
}
