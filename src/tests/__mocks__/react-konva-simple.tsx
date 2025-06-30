import React from 'react';

export const Stage = ({ children }) => <div>{children}</div>;
export const Layer = ({ children }) => <div>{children}</div>;
export const Circle = (props) => <div data-testid="konva-circle" {...props} />;
export const Star = (props) => <div data-testid="konva-star" {...props} />; 