import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Model } from '@shared/schema';

type PerformancePoint = {
  step: number;
  accuracy: number;
};

interface PerformanceChartProps {
  model: Model | null;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 shadow rounded border border-gray-200">
        <p className="text-sm font-medium">{`Step ${label}`}</p>
        <p className="text-xs text-gray-600">{`Accuracy: ${payload[0].value}%`}</p>
      </div>
    );
  }

  return null;
};

export function PerformanceChart({ model, className }: PerformanceChartProps) {
  const [data, setData] = useState<PerformancePoint[]>([]);

  useEffect(() => {
    if (!model) return;

    // Generate sample performance data based on current model accuracy
    const currentAcc = parseFloat(model.currentAccuracy.replace('%', ''));
    const previousAcc = model.previousAccuracy ? parseFloat(model.previousAccuracy.replace('%', '')) : currentAcc - 5;
    
    // Generate 20 data points showing progress from previous to current accuracy
    const performanceData: PerformancePoint[] = [];
    
    // Starting at a lower accuracy
    let startingAcc = previousAcc - 10;
    if (startingAcc < 50) startingAcc = 50; // Minimum starting accuracy
    
    // Generate improving trend with some randomness
    for (let i = 0; i < 20; i++) {
      const progress = i / 19; // 0 to 1
      const targetAcc = startingAcc + (currentAcc - startingAcc) * progress;
      
      // Add some randomness (+/- 2%)
      const randomVariation = (Math.random() - 0.5) * 4;
      let pointAcc = targetAcc + randomVariation;
      
      // Ensure we end at exactly the current accuracy
      if (i === 19) pointAcc = currentAcc;
      
      // Ensure accuracy doesn't exceed 100%
      if (pointAcc > 99.9) pointAcc = 99.9;
      
      performanceData.push({
        step: i + 1,
        accuracy: parseFloat(pointAcc.toFixed(1))
      });
    }
    
    setData(performanceData);
  }, [model]);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[200px] ${className}`}>
        <div className="text-gray-400">Loading chart data...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="step" 
            tick={{ fontSize: 12 }} 
            stroke="#94a3b8"
            label={{ value: 'Training Step', position: 'insideBottomRight', offset: -5, fontSize: 12 }}
          />
          <YAxis 
            domain={[
              Math.floor(Math.min(...data.map(d => d.accuracy)) - 2), 
              Math.ceil(Math.max(...data.map(d => d.accuracy)) + 2)
            ]}
            tick={{ fontSize: 12 }}
            stroke="#94a3b8"
            label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="accuracy" 
            stroke="#4F46E5" 
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 2 }}
            activeDot={{ r: 5, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
