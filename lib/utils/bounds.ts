import { WindowPosition, WindowSize } from '../types/window';

export interface BoundsConfig {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  padding?: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export const getViewportSize = (): ViewportSize => {
  if (typeof window !== 'undefined') {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  return { width: 1920, height: 1080 };
};

export const constrainToBounds = (
  x: number,
  y: number,
  width: number,
  height: number,
  config: BoundsConfig = {}
): { x: number; y: number; width: number; height: number } => {
  const {
    minWidth = 300,
    minHeight = 200,
    maxWidth = getViewportSize().width,
    maxHeight = getViewportSize().height,
    padding = 0,
  } = config;

  const constrainedWidth = Math.max(minWidth, Math.min(width, maxWidth));
  const constrainedHeight = Math.max(minHeight, Math.min(height, maxHeight));

  const viewport = getViewportSize();
  const maxX = viewport.width - constrainedWidth - padding;
  const maxY = viewport.height - constrainedHeight - padding;

  const constrainedX = Math.max(padding, Math.min(x, maxX));
  const constrainedY = Math.max(padding, Math.min(y, maxY));

  return {
    x: constrainedX,
    y: constrainedY,
    width: constrainedWidth,
    height: constrainedHeight,
  };
};

export const constrainPosition = (
  x: number,
  y: number,
  width: number,
  height: number,
  padding = 0
): WindowPosition => {
  const viewport = getViewportSize();
  return {
    x: Math.max(padding, Math.min(x, viewport.width - width - padding)),
    y: Math.max(padding, Math.min(y, viewport.height - height - padding)),
  };
};

export const constrainSize = (
  width: number,
  height: number,
  minWidth = 300,
  minHeight = 200
): WindowSize => {
  const viewport = getViewportSize();
  return {
    width: Math.max(minWidth, Math.min(width, viewport.width)),
    height: Math.max(minHeight, Math.min(height, viewport.height)),
  };
};

export const isPositionInBounds = (x: number, y: number, padding = 0): boolean => {
  const viewport = getViewportSize();
  return x >= padding && y >= padding && x <= viewport.width - padding && y <= viewport.height - padding;
};

export const isWindowInBounds = (
  position: WindowPosition,
  size: WindowSize,
  padding = 0
): boolean => {
  const viewport = getViewportSize();
  return (
    position.x >= padding &&
    position.y >= padding &&
    position.x + size.width <= viewport.width - padding &&
    position.y + size.height <= viewport.height - padding
  );
};

export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const snapPositionToGrid = (
  position: WindowPosition,
  gridSize = 20
): WindowPosition => {
  return {
    x: snapToGrid(position.x, gridSize),
    y: snapToGrid(position.y, gridSize),
  };
};

export const centerWindow = (width: number, height: number): WindowPosition => {
  const viewport = getViewportSize();
  return {
    x: Math.round((viewport.width - width) / 2),
    y: Math.round((viewport.height - height) / 2),
  };
};

export const getCascadeOffset = (index: number, offset = 30): WindowPosition => {
  return {
    x: 100 + (index * offset),
    y: 100 + (index * offset),
  };
};
