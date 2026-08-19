"use client";

import { useEffect, useState, useRef } from "react";

export default function RangeSlider({
  title,
  min = 0,
  max = 100,
  step = 1,
  lowValue,
  highValue,
  unit = "",
  onChange,
}) {
  const [minVal, setMinVal] = useState(
    lowValue !== undefined && lowValue !== "" ? Number(lowValue) : min,
  );
  const [maxVal, setMaxVal] = useState(
    highValue !== undefined && highValue !== "" ? Number(highValue) : max,
  );
  const timeoutRef = useRef(null);

  useEffect(() => {
    setMinVal(lowValue !== undefined && lowValue !== "" ? Number(lowValue) : min);
  }, [lowValue, min]);

  useEffect(() => {
    setMaxVal(highValue !== undefined && highValue !== "" ? Number(highValue) : max);
  }, [highValue, max]);

  const triggerChange = (newMin, newMax) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newMin, newMax);
    }, 350);
  };

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), maxVal);
    setMinVal(value);
    triggerChange(value, maxVal);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), minVal);
    setMaxVal(value);
    triggerChange(minVal, value);
  };

  const minPercent = ((minVal - min) / (max - min)) * 100;
  const maxPercent = ((maxVal - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col space-y-1.5 ml-2">
      <div className="flex justify-between items-center text-xs">
        <label className="font-bold text-white/50 uppercase tracking-wider">
          {title}
        </label>
        <span className="text-[11px] font-semibold text-brand">
          {minVal}
          {unit} — {maxVal}
          {unit}
        </span>
      </div>

      <div className="relative h-6 flex items-center my-0.5">
        {/* Background Track */}
        <div className="absolute left-0 right-0 h-1.5 bg-white/15 rounded-full overflow-hidden pointer-events-none">
          {/* Active Highlight Track */}
          <div
            className="absolute top-0 h-full bg-brand rounded-full transition-all duration-75"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />
        </div>

        {/* Min Input Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none cursor-pointer z-10
            [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform
            [&::-moz-range-track]:appearance-none [&::-moz-range-track]:bg-transparent
            [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:transition-transform"
        />

        {/* Max Input Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none cursor-pointer z-20
            [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform
            [&::-moz-range-track]:appearance-none [&::-moz-range-track]:bg-transparent
            [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:transition-transform"
        />
      </div>

      <div className="flex justify-between text-[10px] text-white/40 px-0.5">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}
