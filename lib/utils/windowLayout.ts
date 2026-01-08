import { WindowState, WindowPosition, WindowSize } from '../types/window';
import { getViewportSize, snapToGrid, centerWindow, constrainToBounds } from './bounds';

export type SnapEdge = 'left' | 'right' | 'top' | 'bottom';
export type SnapCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type SnapSide = 'left-half' | 'right-half' | 'top-half' | 'bottom-half';
export type SnapPosition = SnapEdge | SnapCorner | SnapSide;

export interface SnapThreshold {
  edge: number;
  corner: number;
}

export const SNAP_THRESHOLDS: SnapThreshold = {
  edge: 20,
  corner: 30,
};

export const snapToEdge = (
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number; snapped: boolean } => {
  const viewport = getViewportSize();
  const { edge } = SNAP_THRESHOLDS;
  
  let newX = x;
  let newY = y;
  let snapped = false;

  // Left edge
  if (Math.abs(x) < edge) {
    newX = 0;
    snapped = true;
  }

  // Right edge
  if (Math.abs(x + width - viewport.width) < edge) {
    newX = viewport.width - width;
    snapped = true;
  }

  // Top edge
  if (Math.abs(y) < edge) {
    newY = 0;
    snapped = true;
  }

  // Bottom edge
  if (Math.abs(y + height - viewport.height) < edge) {
    newY = viewport.height - height;
    snapped = true;
  }

  return { x: newX, y: newY, snapped };
};

export const snapToHalf = (
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number; snapped: boolean } => {
  const viewport = getViewportSize();
  const { edge } = SNAP_THRESHOLDS;
  
  let result = { x, y, width, height, snapped: false };

  // Snap to left half
  if (Math.abs(x) < edge && Math.abs(y) < edge) {
    result.x = 0;
    result.y = 0;
    result.width = viewport.width / 2;
    result.height = viewport.height;
    result.snapped = true;
  }

  // Snap to right half
  if (Math.abs(x + width - viewport.width) < edge && Math.abs(y) < edge) {
    result.x = viewport.width / 2;
    result.y = 0;
    result.width = viewport.width / 2;
    result.height = viewport.height;
    result.snapped = true;
  }

  // Snap to top half
  if (Math.abs(x) < edge && Math.abs(y) < edge) {
    result.x = 0;
    result.y = 0;
    result.width = viewport.width;
    result.height = viewport.height / 2;
    result.snapped = true;
  }

  // Snap to bottom half
  if (Math.abs(x) < edge && Math.abs(y + height - viewport.height) < edge) {
    result.x = 0;
    result.y = viewport.height / 2;
    result.width = viewport.width;
    result.height = viewport.height / 2;
    result.snapped = true;
  }

  return result;
};

export const calculateCascadeLayout = (
  windows: WindowState[],
  basePosition: WindowPosition = { x: 100, y: 100 },
  offset: number = 30
): Map<string, WindowPosition> => {
  const layout = new Map<string, WindowPosition>();
  
  windows.forEach((window, index) => {
    const position: WindowPosition = {
      x: basePosition.x + (index * offset),
      y: basePosition.y + (index * offset),
    };
    
    const constrained = constrainToBounds(
      position.x,
      position.y,
      window.size.width,
      window.size.height
    );
    
    layout.set(window.id, { x: constrained.x, y: constrained.y });
  });
  
  return layout;
};

export const calculateGridLayout = (
  windows: WindowState[],
  padding: number = 50
): Map<string, { position: WindowPosition; size: WindowSize }> => {
  const layout = new Map<string, { position: WindowPosition; size: WindowSize }>();
  const viewport = getViewportSize();
  const count = windows.length;
  
  if (count === 0) return layout;
  
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  
  const windowWidth = Math.floor((viewport.width - (padding * 2)) / cols);
  const windowHeight = Math.floor((viewport.height - (padding * 2)) / rows);
  
  windows.forEach((window, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    const position: WindowPosition = {
      x: padding + (col * windowWidth),
      y: padding + (row * windowHeight),
    };
    
    const size: WindowSize = {
      width: windowWidth - 10,
      height: windowHeight - 10,
    };
    
    layout.set(window.id, { position, size });
  });
  
  return layout;
};

export const calculateHorizontalLayout = (
  windows: WindowState[],
  padding: number = 50
): Map<string, { position: WindowPosition; size: WindowSize }> => {
  const layout = new Map<string, { position: WindowPosition; size: WindowSize }>();
  const viewport = getViewportSize();
  const count = windows.length;
  
  if (count === 0) return layout;
  
  const windowWidth = Math.floor((viewport.width - (padding * 2)) / count);
  const windowHeight = viewport.height - (padding * 2);
  
  windows.forEach((window, index) => {
    const position: WindowPosition = {
      x: padding + (index * windowWidth),
      y: padding,
    };
    
    const size: WindowSize = {
      width: windowWidth - 10,
      height: windowHeight,
    };
    
    layout.set(window.id, { position, size });
  });
  
  return layout;
};

export const calculateVerticalLayout = (
  windows: WindowState[],
  padding: number = 50
): Map<string, { position: WindowPosition; size: WindowSize }> => {
  const layout = new Map<string, { position: WindowPosition; size: WindowSize }>();
  const viewport = getViewportSize();
  const count = windows.length;
  
  if (count === 0) return layout;
  
  const windowWidth = viewport.width - (padding * 2);
  const windowHeight = Math.floor((viewport.height - (padding * 2)) / count);
  
  windows.forEach((window, index) => {
    const position: WindowPosition = {
      x: padding,
      y: padding + (index * windowHeight),
    };
    
    const size: WindowSize = {
      width: windowWidth,
      height: windowHeight - 10,
    };
    
    layout.set(window.id, { position, size });
  });
  
  return layout;
};

export type LayoutType = 'cascade' | 'grid' | 'horizontal' | 'vertical';

export const applyLayout = (
  windows: WindowState[],
  layoutType: LayoutType,
  padding = 50
): Map<string, { position?: WindowPosition; size?: WindowSize }> => {
  switch (layoutType) {
    case 'cascade':
      return calculateCascadeLayout(windows) as any;
    case 'grid':
      return calculateGridLayout(windows, padding);
    case 'horizontal':
      return calculateHorizontalLayout(windows, padding);
    case 'vertical':
      return calculateVerticalLayout(windows, padding);
    default:
      return new Map();
  }
};

export const maximizeWindow = (): { position: WindowPosition; size: WindowSize } => {
  const viewport = getViewportSize();
  return {
    position: { x: 0, y: 0 },
    size: { width: viewport.width, height: viewport.height },
  };
};

export const getQuarterSize = (): { position: WindowPosition; size: WindowSize } => {
  const viewport = getViewportSize();
  return {
    position: { x: viewport.width / 2, y: 0 },
    size: { width: viewport.width / 2, height: viewport.height / 2 },
  };
};

export const getCenteredSize = (width: number, height: number): WindowPosition => {
  return centerWindow(width, height);
};
