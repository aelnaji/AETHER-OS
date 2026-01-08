'use client';

import React from 'react';

interface ResizeHandlesProps {
  windowId: string;
  onMouseDown: (e: React.MouseEvent, handle: string) => void;
}

const RESIZE_HANDLE_SIZE = 8;
const RESIZE_HANDLE_SIZE_MOBILE = 12;

export function ResizeHandles({ windowId, onMouseDown }: ResizeHandlesProps) {
  const handles = [
    { position: 'nw', cursor: 'nwse-resize', className: 'top-0 left-0' },
    { position: 'n', cursor: 'ns-resize', className: 'top-0 left-1/2 -translate-x-1/2' },
    { position: 'ne', cursor: 'nesw-resize', className: 'top-0 right-0' },
    { position: 'e', cursor: 'ew-resize', className: 'top-1/2 right-0 -translate-y-1/2' },
    { position: 'se', cursor: 'nwse-resize', className: 'bottom-0 right-0' },
    { position: 's', cursor: 'ns-resize', className: 'bottom-0 left-1/2 -translate-x-1/2' },
    { position: 'sw', cursor: 'nesw-resize', className: 'bottom-0 left-0' },
    { position: 'w', cursor: 'ew-resize', className: 'top-1/2 left-0 -translate-y-1/2' },
  ];

  return (
    <>
      {handles.map((handle) => {
        const isCorner = handle.position.length === 2;
        const size = isCorner ? RESIZE_HANDLE_SIZE_MOBILE : RESIZE_HANDLE_SIZE;

        return (
          <div
            key={handle.position}
            className={`absolute ${handle.className} ${handle.cursor} hover:bg-amber-500/50 hover:bg-amber-400 transition-colors group/resize ${
              isCorner
                ? 'w-3 h-3 rounded-tl-md rounded-br-md'
                : 'w-1.5 h-1.5 rounded-full'
            }`}
            style={{
              width: size,
              height: size,
            }}
            onMouseDown={(e) => onMouseDown(e, handle.position)}
            title={`Resize ${handle.position.toUpperCase()}`}
          />
        );
      })}
    </>
  );
}
