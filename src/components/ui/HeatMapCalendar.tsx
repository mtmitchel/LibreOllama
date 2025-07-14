import React from 'react';
import { Text } from './index';

export interface HeatMapData {
  date: string; // YYYY-MM-DD format
  value: number;
  label?: string;
}

interface HeatMapCalendarProps {
  data: HeatMapData[];
  startDate?: Date;
  endDate?: Date;
  colorScale?: 'green' | 'blue' | 'purple' | 'custom';
  maxValue?: number;
  cellSize?: 'sm' | 'md' | 'lg';
  showMonthLabels?: boolean;
  showWeekdayLabels?: boolean;
  showTooltip?: boolean;
  className?: string;
  onCellClick?: (data: HeatMapData) => void;
  onCellHover?: (data: HeatMapData | null) => void;
  emptyColor?: string;
  tooltipFormatter?: (data: HeatMapData) => string;
}

export function HeatMapCalendar({
  data,
  startDate,
  endDate,
  colorScale = 'green',
  maxValue,
  cellSize = 'md',
  showMonthLabels = true,
  showWeekdayLabels = true,
  showTooltip = true,
  className = '',
  onCellClick,
  onCellHover,
  emptyColor = 'bg-tertiary',
  tooltipFormatter
}: HeatMapCalendarProps) {
  const [hoveredCell, setHoveredCell] = React.useState<HeatMapData | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });

  // Calculate date range
  const today = new Date();
  const defaultEndDate = endDate || today;
  const defaultStartDate = startDate || new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

  // Create data map for quick lookup
  const dataMap = React.useMemo(() => {
    const map = new Map<string, HeatMapData>();
    data.forEach(item => map.set(item.date, item));
    return map;
  }, [data]);

  // Calculate maximum value for intensity scaling
  const calculatedMaxValue = maxValue || Math.max(...data.map(d => d.value), 1);

  // Size classes
  const sizeClasses = {
    sm: { cell: 'w-2 h-2', gap: 'gap-0.5', text: 'text-xs' },
    md: { cell: 'w-3 h-3', gap: 'gap-1', text: 'text-sm' },
    lg: { cell: 'w-4 h-4', gap: 'gap-1', text: 'text-base' }
  };

  const { cell: cellClass, gap: gapClass, text: textClass } = sizeClasses[cellSize];

  // Color scale functions
  const getIntensityColor = (value: number): string => {
    if (value === 0) return emptyColor;
    
    const intensity = Math.min(value / calculatedMaxValue, 1);
    const level = Math.ceil(intensity * 4); // 4 levels of intensity

    const colorScales = {
      green: [
        'bg-green-100',
        'bg-green-300', 
        'bg-green-500',
        'bg-green-700'
      ],
      blue: [
        'bg-blue-100',
        'bg-blue-300',
        'bg-blue-500', 
        'bg-blue-700'
      ],
      purple: [
        'bg-purple-100',
        'bg-purple-300',
        'bg-purple-500',
        'bg-purple-700'
      ],
      custom: [
        'bg-accent-soft',
        'bg-accent-primary/40',
        'bg-accent-primary/70',
        'bg-accent-primary'
      ]
    };

    return colorScales[colorScale][level - 1] || emptyColor;
  };

  // Generate calendar grid
  const generateCalendarData = () => {
    const weeks: (HeatMapData | null)[][] = [];
    const current = new Date(defaultStartDate);
    
    // Start from the beginning of the week
    current.setDate(current.getDate() - current.getDay());

    while (current <= defaultEndDate) {
      const week: (HeatMapData | null)[] = [];
      
      for (let day = 0; day < 7; day++) {
        const dateString = current.toISOString().split('T')[0];
        const cellData = dataMap.get(dateString);
        
        if (current >= defaultStartDate && current <= defaultEndDate) {
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

  return (
    <div className={`relative ${className}`}>
      {/* Month labels */}
      {showMonthLabels && (
        <div className={`mb-2 flex ${gapClass}`}>
          {months.map((month, index) => (
            <div
              key={index}
              className={`${textClass} text-secondary`}
              style={{ width: `${month.width * (cellSize === 'sm' ? 10 : cellSize === 'md' ? 16 : 20)}px` }}
            >
              {month.name}
            </div>
          ))}
        </div>
      )}

      <div className="flex">
        {/* Weekday labels */}
        {showWeekdayLabels && (
          <div className={`mr-2 flex flex-col ${gapClass}`}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className={`${cellClass} ${textClass} flex items-center justify-center text-secondary`}
              >
                {cellSize !== 'sm' ? day[0] : ''}
              </div>
            ))}
          </div>
        )}

        {/* Calendar grid */}
        <div className={`grid-cols- grid${Math.ceil(weeks.length)} ${gapClass}`}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className={`flex flex-col ${gapClass}`}>
              {week.map((cellData, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`
                    ${cellClass} border-border-subtle hover:border-border-primary cursor-pointer rounded-sm
                    border transition-all duration-150 motion-safe:hover:scale-110
                    ${cellData ? getIntensityColor(cellData.value) : 'bg-transparent'}
                  `}
                  onClick={() => cellData && handleCellClick(cellData)}
                  onMouseEnter={(e) => handleCellHover(cellData, e)}
                  onMouseLeave={() => handleCellHover(null)}
                  title={cellData ? `${cellData.date}: ${cellData.value}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && hoveredCell && (
        <div
          className="border-border-default pointer-events-none fixed z-50 rounded-md border bg-surface px-3 py-2 shadow-lg"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 40
          }}
        >
          <Text size="sm" weight="medium">
            {tooltipFormatter
              ? tooltipFormatter(hoveredCell)
              : `${hoveredCell.date}: ${hoveredCell.value}${hoveredCell.label ? ` ${hoveredCell.label}` : ''}`
            }
          </Text>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2">
        <Text size="xs" variant="secondary">Less</Text>
        <div className={`flex ${gapClass}`}>
          <div className={`${cellClass} rounded-sm ${emptyColor}`} />
          {[1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`${cellClass} rounded-sm ${getIntensityColor(calculatedMaxValue * (level / 4))}`}
            />
          ))}
        </div>
        <Text size="xs" variant="secondary">More</Text>
      </div>
    </div>
  );
}

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
            name: new Date(2023, currentMonth, 1).toLocaleDateString('en', { month: 'short' }),
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
      name: new Date(2023, currentMonth, 1).toLocaleDateString('en', { month: 'short' }),
      width: currentWidth
    });
  }

  return months;
} 