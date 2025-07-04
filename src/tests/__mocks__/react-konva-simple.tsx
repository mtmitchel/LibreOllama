import React from 'react';

export const Stage = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const Layer = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const Circle = (props: any) => <div data-testid="konva-circle" {...props} />;
export const Star = (props: any) => <div data-testid="konva-star" {...props} />; 