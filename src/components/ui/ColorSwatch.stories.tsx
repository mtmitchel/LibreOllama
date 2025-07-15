import type { Story } from '@ladle/react';
import React, { useState } from 'react';
import { ColorSwatch, ColorPalette } from './ColorSwatch';

export const ColorSwatches: Story = () => {
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [selectedPaletteColor, setSelectedPaletteColor] = useState('#ef4444');

  const themeColors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
  ];

  const extendedPalette = [
    // Blues
    '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af',
    // Greens
    '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857', '#065f46',
    // Yellows
    '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e',
    // Reds
    '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
    // Purples
    '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6',
    // Grays
    '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151',
  ];

  return (
    <div className="space-y-12 bg-primary p-8">
      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Sizes</h2>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <ColorSwatch color="#3b82f6" size="sm" />
            <p className="mt-2 text-sm text-secondary">Small (sm)</p>
          </div>
          <div className="text-center">
            <ColorSwatch color="#3b82f6" size="md" />
            <p className="mt-2 text-sm text-secondary">Medium (md)</p>
          </div>
          <div className="text-center">
            <ColorSwatch color="#3b82f6" size="lg" />
            <p className="mt-2 text-sm text-secondary">Large (lg)</p>
          </div>
          <div className="text-center">
            <ColorSwatch color="#3b82f6" size="lg" />
            <p className="mt-2 text-sm text-secondary">Large (lg) - max size</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Interactive states</h2>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <ColorSwatch
              color="#10b981"
              size="lg"
              onClick={() => console.log('Color clicked')}
            />
            <p className="mt-2 text-sm text-secondary">Clickable</p>
          </div>
          <div className="text-center">
            <ColorSwatch
              color="#f59e0b"
              size="lg"
              selected={true}
            />
            <p className="mt-2 text-sm text-secondary">Selected</p>
          </div>
          <div className="text-center">
            <ColorSwatch
              color="#ef4444"
              size="lg"
              disabled={true}
            />
            <p className="mt-2 text-sm text-secondary">Disabled</p>
          </div>
          <div className="text-center">
            <ColorSwatch
              color="#8b5cf6"
              size="lg"
              label="Purple color"
            />
            <p className="mt-2 text-sm text-secondary">With label</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Border variants</h2>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <ColorSwatch color="#ffffff" size="lg" />
            <p className="mt-2 text-sm text-secondary">White color</p>
          </div>
          <div className="text-center">
            <ColorSwatch color="#f3f4f6" size="lg" />
            <p className="mt-2 text-sm text-secondary">Light gray</p>
          </div>
          <div className="text-center">
            <ColorSwatch color="#1f2937" size="lg" />
            <p className="mt-2 text-sm text-secondary">Dark gray</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Custom styling</h2>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <ColorSwatch
              color="#3b82f6"
              size="lg"
              className="shadow-lg"
            />
            <p className="mt-2 text-sm text-secondary">Custom shadow</p>
          </div>
          <div className="text-center">
            <div className="rounded-lg bg-tertiary p-2">
              <ColorSwatch
                color="#10b981"
                size="md"
              />
            </div>
            <p className="mt-2 text-sm text-secondary">Custom container</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Single color selector</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="mb-4 flex items-center gap-4">
            <ColorSwatch
              color={selectedColor}
              size="lg"
              selected={true}
              label={selectedColor}
            />
            <div>
              <p className="text-sm font-medium text-primary">Selected color</p>
              <p className="text-xs text-secondary">{selectedColor}</p>
            </div>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {themeColors.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                size="md"
                onClick={() => setSelectedColor(color)}
                selected={selectedColor === color}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Color palette component</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-primary">Selected: {selectedPaletteColor}</p>
            <ColorSwatch
              color={selectedPaletteColor}
              size="lg"
              selected={true}
            />
          </div>
          <ColorPalette
            colors={extendedPalette}
            selectedColor={selectedPaletteColor}
            onColorSelect={setSelectedPaletteColor}
            size="md"
            columns={8}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Compact palette</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <ColorPalette
            colors={themeColors}
            selectedColor={selectedPaletteColor}
            onColorSelect={setSelectedPaletteColor}
            size="sm"
            columns={4}
            className="w-fit"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Use cases</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Theme customizer</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary">Primary color</span>
                <ColorSwatch
                  color="#3b82f6"
                  size="md"
                  onClick={() => console.log('Open color picker')}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary">Accent color</span>
                <ColorSwatch
                  color="#10b981"
                  size="md"
                  onClick={() => console.log('Open color picker')}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary">Warning color</span>
                <ColorSwatch
                  color="#f59e0b"
                  size="md"
                  onClick={() => console.log('Open color picker')}
                />
              </div>
            </div>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Label colors</h3>
            <div className="space-y-3">
              {[
                { name: 'Work', color: '#3b82f6' },
                { name: 'Personal', color: '#10b981' },
                { name: 'Important', color: '#ef4444' },
                { name: 'Later', color: '#8b5cf6' }
              ].map((label) => (
                <div key={label.name} className="flex items-center gap-3">
                  <ColorSwatch
                    color={label.color}
                    size="sm"
                  />
                  <span className="text-sm text-primary">{label.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ColorSwatches.meta = {
  title: 'Design System/Components/ColorSwatch',
}; 