import type { Story } from '@ladle/react';
import React, { useState, useMemo } from 'react';
import { HeatMapCalendar, HeatMapData } from './HeatMapCalendar';

export const HeatMapCalendars: Story = () => {
  const [selectedCell, setSelectedCell] = useState<HeatMapData | null>(null);

  // Generate sample data for different patterns
  const generateData = (pattern: 'random' | 'seasonal' | 'weekdays' | 'sparse'): HeatMapData[] => {
    const data: HeatMapData[] = [];
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      let value = 0;
      switch (pattern) {
        case 'random':
          value = Math.random() < 0.7 ? Math.floor(Math.random() * 20) : 0;
          break;
        case 'seasonal': {
          // Higher activity in winter months
          const month = date.getMonth();
          const isWinter = month === 11 || month === 0 || month === 1;
          value = isWinter ? Math.floor(Math.random() * 25) + 5 : Math.floor(Math.random() * 15);
          break;
        }
        case 'weekdays': {
          // Higher activity on weekdays
          const dayOfWeek = date.getDay();
          const isWeekday = dayOfWeek > 0 && dayOfWeek < 6;
          value = isWeekday ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 8);
          break;
        }
        case 'sparse':
          value = Math.random() < 0.3 ? Math.floor(Math.random() * 15) + 1 : 0;
          break;
      }

      if (value > 0) {
        data.push({
          date: dateString,
          value,
          label: `${value} commits`
        });
      }
    }

    return data;
  };

  const randomData = useMemo(() => generateData('random'), []);
  const seasonalData = useMemo(() => generateData('seasonal'), []);
  const weekdayData = useMemo(() => generateData('weekdays'), []);
  const sparseData = useMemo(() => generateData('sparse'), []);

  // Canvas performance simulation data
  const canvasPerformanceData = useMemo(() => {
    const data: HeatMapData[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90); // Last 3 months

    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      // Simulate performance metrics (render time in ms)
      const baseTime = 16; // Target 60fps
      const variance = Math.random() * 20 - 10; // ±10ms variance
      const renderTime = Math.max(5, baseTime + variance);

      data.push({
        date: dateString,
        value: Math.round(renderTime),
        label: `${Math.round(renderTime)}ms render time`
      });
    }

    return data;
  }, []);

  return (
    <div className="space-y-12 bg-primary p-8">
      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Color scales</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Green scale (default)</h3>
            <HeatMapCalendar
              data={randomData}
              colorScale="green"
              cellSize="sm"
              showMonthLabels={true}
              showWeekdayLabels={false}
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Blue scale</h3>
            <HeatMapCalendar
              data={randomData}
              colorScale="blue"
              cellSize="sm"
              showMonthLabels={true}
              showWeekdayLabels={false}
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Purple scale</h3>
            <HeatMapCalendar
              data={randomData}
              colorScale="purple"
              cellSize="sm"
              showMonthLabels={true}
              showWeekdayLabels={false}
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Custom scale</h3>
            <HeatMapCalendar
              data={randomData}
              colorScale="custom"
              cellSize="sm"
              showMonthLabels={true}
              showWeekdayLabels={false}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Cell sizes</h2>
        <div className="grid grid-cols-1 gap-6">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Small cells</h3>
            <HeatMapCalendar
              data={sparseData}
              cellSize="sm"
              colorScale="green"
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Medium cells</h3>
            <HeatMapCalendar
              data={sparseData}
              cellSize="md"
              colorScale="blue"
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Large cells</h3>
            <HeatMapCalendar
              data={sparseData}
              cellSize="lg"
              colorScale="purple"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Data patterns</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Seasonal pattern</h3>
            <p className="mb-4 text-sm text-secondary">Higher activity in winter months</p>
            <HeatMapCalendar
              data={seasonalData}
              colorScale="blue"
              cellSize="sm"
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Weekday pattern</h3>
            <p className="mb-4 text-sm text-secondary">More activity on weekdays</p>
            <HeatMapCalendar
              data={weekdayData}
              colorScale="green"
              cellSize="sm"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Interactive features</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="mb-4">
            {selectedCell ? (
              <div className="flex items-center gap-3">
                <div className="size-3 rounded bg-accent-primary"></div>
                <span className="text-sm text-primary">
                  <strong>{selectedCell.date}</strong>: {selectedCell.label}
                </span>
              </div>
            ) : (
              <span className="text-sm text-secondary">Click on a cell to see details</span>
            )}
          </div>
          <HeatMapCalendar
            data={randomData}
            colorScale="custom"
            cellSize="md"
            onCellClick={setSelectedCell}
            onCellHover={() => {
              // You could show a temporary tooltip here
            }}
            showTooltip={true}
            tooltipFormatter={(data) => `${data.date}: ${data.value} contributions`}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Custom date range</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Last 6 months</h3>
            <HeatMapCalendar
              data={randomData}
              startDate={new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)}
              endDate={new Date()}
              colorScale="green"
              cellSize="md"
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Custom range (3 months)</h3>
            <HeatMapCalendar
              data={canvasPerformanceData}
              startDate={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)}
              endDate={new Date()}
              colorScale="purple"
              cellSize="md"
              maxValue={50}
              tooltipFormatter={(data) => `Render time: ${data.value}ms`}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Configuration options</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Minimal (no labels)</h3>
            <HeatMapCalendar
              data={sparseData}
              colorScale="custom"
              cellSize="md"
              showMonthLabels={false}
              showWeekdayLabels={false}
              showTooltip={false}
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Full featured</h3>
            <HeatMapCalendar
              data={sparseData}
              colorScale="blue"
              cellSize="md"
              showMonthLabels={true}
              showWeekdayLabels={true}
              showTooltip={true}
              emptyColor="bg-gray-100"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Use cases</h2>
        <div className="grid grid-cols-1 gap-6">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">GitHub-style contribution graph</h3>
            <p className="mb-4 text-sm text-secondary">Track daily coding activity and contributions</p>
            <HeatMapCalendar
              data={randomData}
              colorScale="green"
              cellSize="sm"
              tooltipFormatter={(data) => `${data.value} contributions on ${data.date}`}
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Canvas performance monitoring</h3>
            <p className="mb-4 text-sm text-secondary">Visualize render times and performance metrics over time</p>
            <HeatMapCalendar
              data={canvasPerformanceData}
              colorScale="purple"
              cellSize="md"
              maxValue={50}
              startDate={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)}
              endDate={new Date()}
              tooltipFormatter={(data) => `${data.date}: ${data.value}ms render time`}
            />
            <div className="mt-4 text-xs text-secondary">
              <p>Green = Good performance (&lt;20ms), Red = Poor performance (&gt;40ms)</p>
            </div>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Activity tracking</h3>
            <p className="mb-4 text-sm text-secondary">Monitor user engagement or system usage patterns</p>
            <HeatMapCalendar
              data={weekdayData}
              colorScale="blue"
              cellSize="sm"
              tooltipFormatter={(data) => `${data.value} active users on ${data.date}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

HeatMapCalendars.meta = {
  title: 'Design System/Components/HeatMapCalendar',
}; 