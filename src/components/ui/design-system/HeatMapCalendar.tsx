import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';

/**
 * Design System HeatMapCalendar Component
 * 
 * DLS Compliant HeatMap Calendar following Asana patterns
 * - Activity visualization over time
 * - GitHub-style contribution calendar
 * - Hover interactions and tooltips
 */

export interface HeatMapData {
  date: string; // YYYY-MM-DD format
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface HeatMapCalendarProps {
  data: HeatMapData[];
  startDate?: Date;
  endDate?: Date;
  colorScheme?: 'green' | 'blue' | 'purple' | 'brand' | 'custom';
  customColors?: string[];
  maxValue?: number;
  cellSize?: 'sm' | 'md' | 'lg';
  cellGap?: 'sm' | 'md' | 'lg';
  showMonthLabels?: boolean;
  showWeekdayLabels?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  className?: string;
  onCellClick?: (data: HeatMapData) => void;
  onCellHover?: (data: HeatMapData | null) => void;
  tooltipFormatter?: (data: HeatMapData) => React.ReactNode;
  emptyLabel?: string;
}

const colorSchemes = {
  green: [
    'rgba(22, 163, 74, 0.1)',   // green-600/10
    'rgba(22, 163, 74, 0.3)',   // green-600/30
    'rgba(22, 163, 74, 0.6)',   // green-600/60
    'rgba(22, 163, 74, 0.8)',   // green-600/80
    'rgba(22, 163, 74, 1)',     // green-600
  ],
  blue: [
    'rgba(37, 99, 235, 0.1)',   // blue-600/10
    'rgba(37, 99, 235, 0.3)',   // blue-600/30
    'rgba(37, 99, 235, 0.6)',   // blue-600/60
    'rgba(37, 99, 235, 0.8)',   // blue-600/80
    'rgba(37, 99, 235, 1)',     // blue-600
  ],
  purple: [
    'rgba(147, 51, 234, 0.1)',  // purple-600/10
    'rgba(147, 51, 234, 0.3)',  // purple-600/30
    'rgba(147, 51, 234, 0.6)',  // purple-600/60
    'rgba(147, 51, 234, 0.8)',  // purple-600/80
    'rgba(147, 51, 234, 1)',    // purple-600
  ],
  brand: [
    'var(--brand-subtle)',
    'rgba(121, 110, 255, 0.3)',
    'rgba(121, 110, 255, 0.6)',
    'rgba(121, 110, 255, 0.8)',
    'var(--brand-primary)',
  ],
  custom: [],
};

const sizeConfig = {
  sm: { cell: 10, gap: 2, fontSize: '10px' },
  md: { cell: 12, gap: 3, fontSize: '11px' },
  lg: { cell: 16, gap: 4, fontSize: '12px' },
};

const gapConfig = {
  sm: 2,
  md: 3,
  lg: 4,
};

export const HeatMapCalendar: React.FC<HeatMapCalendarProps> = ({
  data,
  startDate,
  endDate,
  colorScheme = 'brand',
  customColors = [],
  maxValue,
  cellSize = 'md',
  cellGap = 'md',
  showMonthLabels = true,
  showWeekdayLabels = true,
  showTooltip = true,
  showLegend = true,
  className = '',
  onCellClick,
  onCellHover,
  tooltipFormatter,
  emptyLabel = 'No activity',
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatMapData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Calculate date range
  const today = new Date();
  const finalEndDate = endDate || today;
  const finalStartDate = startDate || new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

  // Create data map for quick lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, HeatMapData>();
    data.forEach(item => map.set(item.date, item));
    return map;
  }, [data]);

  // Calculate maximum value for intensity scaling
  const calculatedMaxValue = maxValue || Math.max(...data.map(d => d.value), 1);

  // Get color array
  const colors = customColors.length > 0 ? customColors : colorSchemes[colorScheme];

  // Get intensity color
  const getIntensityColor = (value: number): string => {
    if (value === 0) return 'var(--bg-tertiary)';
    
    const intensity = Math.min(value / calculatedMaxValue, 1);
    const colorIndex = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
    
    return colors[colorIndex] || 'var(--bg-tertiary)';
  };

  // Generate calendar grid
  const generateCalendarData = () => {
    const weeks: (HeatMapData | null)[][] = [];
    const current = new Date(finalStartDate);
    
    // Start from the beginning of the week (Sunday)
    current.setDate(current.getDate() - current.getDay());

    while (current <= finalEndDate) {
      const week: (HeatMapData | null)[] = [];
      
      for (let day = 0; day < 7; day++) {
        const dateString = current.toISOString().split('T')[0];
        const cellData = dataMap.get(dateString);
        
        if (current >= finalStartDate && current <= finalEndDate) {
          week.push(cellData || { date: dateString, value: 0 });
        } else {
          week.push(null);
        }
        
        current.setDate(current.getDate() + 1);
      }
      
      weeks.push(week);
    }
    
    return weeks;
  };

  const weeks = generateCalendarData();
  const months = getMonthLabels(weeks);

  // Handle cell interactions
  const handleCellClick = (cellData: HeatMapData) => {
    onCellClick?.(cellData);
  };

  const handleCellHover = (cellData: HeatMapData | null, event?: React.MouseEvent) => {
    setHoveredCell(cellData);
    onCellHover?.(cellData);
    
    if (event && cellData) {
      setTooltipPosition({
        x: event.clientX,
        y: event.clientY
      });
    }
  };

  const config = sizeConfig[cellSize];
  const gap = gapConfig[cellGap];

  return (
    <div className={`relative select-none ${className}`}>
      {/* Month labels */}
      {showMonthLabels && (
        <div className="mb-[var(--space-2)] flex items-end" style={{ gap: `${gap}px` }}>
          {showWeekdayLabels && <div style={{ width: `${config.cell + 8}px` }} />}
          {months.map((month, index) => (
            <div
              key={index}
              className="text-[var(--text-secondary)] font-normal"
              style={{ 
                width: `${month.width * (config.cell + gap) - gap}px`,
                fontSize: config.fontSize,
              }}
            >
              {month.name}
            </div>
          ))}
        </div>
      )}

      <div className="flex" style={{ gap: `${gap + 4}px` }}>
        {/* Weekday labels */}
        {showWeekdayLabels && (
          <div className="flex flex-col" style={{ gap: `${gap}px` }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div
                key={index}
                className="flex items-center justify-center text-[var(--text-secondary)]"
                style={{ 
                  width: `${config.cell}px`,
                  height: `${config.cell}px`,
                  fontSize: config.fontSize,
                }}
              >
                {cellSize !== 'sm' ? day : ''}
              </div>
            ))}
          </div>
        )}

        {/* Calendar grid */}
        <div className="flex" style={{ gap: `${gap}px` }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col" style={{ gap: `${gap}px` }}>
              {week.map((cellData, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`
                    rounded-[2px] border border-[var(--border-subtle)]
                    transition-all duration-[var(--transition-duration)]
                    ${cellData ? 'cursor-pointer hover:border-[var(--border-hover)] hover:scale-110' : ''}
                  `}
                  style={{
                    width: `${config.cell}px`,
                    height: `${config.cell}px`,
                    backgroundColor: cellData ? getIntensityColor(cellData.value) : 'var(--bg-tertiary)',
                  }}
                  onClick={() => cellData && handleCellClick(cellData)}
                  onMouseEnter={(e) => cellData && handleCellHover(cellData, e)}
                  onMouseLeave={() => handleCellHover(null)}
                  title={cellData ? `${cellData.date}: ${cellData.value}` : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-[var(--space-3)] flex items-center gap-[var(--space-2)]">
          <span className="text-[var(--text-small)] text-[var(--text-secondary)]">Less</span>
          <div className="flex" style={{ gap: `${Math.max(gap - 1, 1)}px` }}>
            <div
              className="rounded-[2px]"
              style={{
                width: `${config.cell}px`,
                height: `${config.cell}px`,
                backgroundColor: 'var(--bg-tertiary)',
              }}
            />
            {colors.map((color, index) => (
              <div
                key={index}
                className="rounded-[2px]"
                style={{
                  width: `${config.cell}px`,
                  height: `${config.cell}px`,
                  backgroundColor: color,
                }}
              />
            ))}
          </div>
          <span className="text-[var(--text-small)] text-[var(--text-secondary)]">More</span>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && hoveredCell && createPortal(
        <div
          className="
            fixed z-[var(--z-tooltip)] pointer-events-none
            px-[var(--space-2)] py-[var(--space-1)]
            bg-[var(--text-primary)] text-[var(--text-on-brand)]
            text-[var(--text-small)] font-normal
            rounded-[var(--radius-sm)] shadow-[var(--shadow-popover)]
          "
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 40,
          }}
        >
          {tooltipFormatter ? (
            tooltipFormatter(hoveredCell)
          ) : (
            <div>
              <div className="font-medium">{hoveredCell.date}</div>
              <div>
                {hoveredCell.value > 0 ? (
                  `${hoveredCell.value}${hoveredCell.label ? ` ${hoveredCell.label}` : ''}`
                ) : (
                  emptyLabel
                )}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

// Helper function to generate month labels
function getMonthLabels(weeks: (HeatMapData | null)[][]): Array<{ name: string; width: number }> {
  const months: Array<{ name: string; width: number }> = [];
  let currentMonth = -1;
  let currentWidth = 0;

  weeks.forEach(week => {
    const firstValidDay = week.find(day => day !== null);
    if (firstValidDay) {
      const date = new Date(firstValidDay.date);
      const month = date.getMonth();
      
      if (month !== currentMonth) {
        if (currentMonth !== -1) {
          months.push({
            name: new Date(2024, currentMonth, 1).toLocaleDateString('en', { month: 'short' }),
            width: currentWidth
          });
        }
        currentMonth = month;
        currentWidth = 1;
      } else {
        currentWidth++;
      }
    }
  });

  // Add the last month
  if (currentMonth !== -1) {
    months.push({
      name: new Date(2024, currentMonth, 1).toLocaleDateString('en', { month: 'short' }),
      width: currentWidth
    });
  }

  return months;
}

/**
 * Simple Activity Calendar - Simplified version for basic usage
 */
export interface ActivityCalendarProps {
  data: Array<{ date: string; count: number }>;
  year?: number;
  colorScheme?: HeatMapCalendarProps['colorScheme'];
  showTooltip?: boolean;
  onDayClick?: (date: string, count: number) => void;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  data,
  year = new Date().getFullYear(),
  colorScheme = 'brand',
  showTooltip = true,
  onDayClick,
}) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  const heatMapData: HeatMapData[] = data.map(item => ({
    date: item.date,
    value: item.count,
    label: item.count === 1 ? 'activity' : 'activities',
  }));

  return (
    <HeatMapCalendar
      data={heatMapData}
      startDate={startDate}
      endDate={endDate}
      colorScheme={colorScheme}
      cellSize="sm"
      showTooltip={showTooltip}
      onCellClick={onDayClick ? (data) => onDayClick(data.date, data.value) : undefined}
      tooltipFormatter={(data) => (
        <div>
          <div className="font-medium">{data.date}</div>
          <div>{data.value} {data.label}</div>
        </div>
      )}
    />
  );
};