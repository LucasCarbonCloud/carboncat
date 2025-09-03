import React from 'react';
import { PieChart } from 'react-minimal-pie-chart';
import { Field } from '@grafana/data';

export interface OverviewProps {
  fields: Field[];
}

export const Overview: React.FC<OverviewProps> = ({ fields }) => {

  type LogDataMap = {
    [key: string]: { value: number; color: string };
  };

  const data: LogDataMap = {
    DEBUG: { value: 0, color: '#3273d6' },
    INFO: { value: 0, color: '#56a64c' },
    WARN: { value: 0, color: '#edc80c' },
    ERROR: { value: 0, color: '#dd2f44' },
    FATAL: { value: 0, color: '#a253cb' },
  };

  let totalValue = 0;

  fields.forEach((f: Field) => {
    if (f.name === 'level') {
      totalValue = f.values.length;
      f.values.forEach((v: string) => {
        data[v].value += 1;
      });
    }
  });

  let pieData = [];
  for (const [key, { value, color }] of Object.entries(data)) {
    if (value > 0) {
      pieData.push({ title: key, value: value, color: color });
    }
  }

  return (
    <div className={`w-full flex gap-4`}>
      <PieChart animate={true} data={pieData} totalValue={totalValue} className="w-2/3 max-w-52" />
      <div className="flex flex-col justify-between pt-4 w-1/3">
        <table className="text-sm">
          {Object.entries(data).map(([k, v]) => {
            return (
              <tr key={k} className={`font-mono`}>
                <td className={`font-semibold`}>{k}:</td>
                <td>{v.value}</td>
              </tr>
            );
          })}
        </table>
        <div className={`font-mono flex`}>
          <p className={`font-semibold`}>Total:</p>
          <p>{totalValue}</p>
        </div>
      </div>
    </div>
  );
};
