import React from 'react';
import { TimeSeries } from '@grafana/ui';
import { toDataFrame, FieldType, DataFrame, TimeRange, Field, makeTimeRange, dateTimeParse } from '@grafana/data';
import { GraphDrawStyle, BarAlignment, LegendDisplayMode, FieldColorModeId } from '@grafana/schema';

export function TimeSeriesBars({
  chartWidth,
  timeRange,
  fields,
  onChangeTimeRange,
}: {
  chartWidth: number;
  timeRange: TimeRange;
  fields: Field[];
  onChangeTimeRange: (tr: TimeRange) => void;
}) {

  const frame: DataFrame = toDataFrame({
    name: 'history-data',
    fields: fields,
  });


  const colorMap: Record<string, string> = {
    DEBUG: 'blue',
    INFO: 'green',
    WARN: 'yellow',
    ERROR: 'red',
    FATAL: 'purple',
  };

  frame.fields.forEach((f) => {
    if (f.type === FieldType.number) {
      f.config = {
        ...(f.config || {}),
        color: { mode: FieldColorModeId.Fixed, fixedColor: colorMap[f.name] },
        custom: {
          ...(f.config?.custom || {}),
          drawStyle: GraphDrawStyle.Bars, // <-- THIS makes it bars
          lineWidth: 0, // outline width of bars
          fillOpacity: 80, // visible fill
          barAlignment: BarAlignment.Center, // center the bars (or 0)
          barWidthFactor: 0.8, // make bars wider (0..1)

          stacking: { mode: 'normal' }       // if you want stacking behavior
        },
      };
    }
  });


  if (!frame.length || frame.fields.length <= 1) {
    return <div className="text-gray-500 h-35">No data available</div>;
  }

  return (
    <TimeSeries
      frames={[frame]}
      timeRange={timeRange}
      timeZone="browser"
      width={chartWidth}
      height={120}
      legend={{
        displayMode: 'list' as LegendDisplayMode,
        calcs: [],
        placement: 'right',
        showLegend: true,
      }}
      tweakAxis={(axis, field) => {
        if (axis.scaleKey !== 'x') {
          return {
            ...axis,
            show: true,
            // label: field.name,
            formatValue: (v) => v.toFixed(0),
            // incrs: [1, 5, 10, 20, 50], // acceptable tick increments
          };
        }
        return axis;
      }}
    >
      {(builder, alignedFrame) => {
        // hook into uPlot’s events
        builder.addHook('setSelect', (u) => {
          if (u.select.width > 0) {
            const from = u.posToVal(u.select.left, 'x');
            const to = u.posToVal(u.select.left + u.select.width, 'x');

            onChangeTimeRange(makeTimeRange(dateTimeParse(from), dateTimeParse(to)));
          }
        });
        return null;
      }}
</TimeSeries>


  );
}
