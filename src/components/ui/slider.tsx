import React, { useState, useEffect, useRef } from "react";

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  onValueChange?: (value: number[]) => void;
  className?: string;
  id?: string;
}

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value = [0],
  onValueChange,
  className = "",
  id,
}: SliderProps) {
  const [localValue, setLocalValue] = useState(value[0]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value[0]);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
    onValueChange?.([newValue]);
  };

  const percentage = ((localValue - min) / (max - min)) * 100;

  return (
    <div className={`relative w-full flex items-center ${className}`}>
      <div
        ref={trackRef}
        className="absolute h-2 rounded-full bg-secondary w-full"
      />
      <div
        className="absolute h-2 rounded-full bg-primary"
        style={{ width: `${percentage}%` }}
      />
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={handleChange}
        className="w-full h-2 appearance-none bg-transparent cursor-pointer z-10"
        style={{
          WebkitAppearance: "none",
          appearance: "none",
        }}
      />
      <div
        className="absolute rounded-full bg-primary border-2 border-background w-4 h-4 focus:outline-none pointer-events-none"
        style={{ left: `calc(${percentage}% - 0.5rem)` }}
      />
    </div>
  );
} 