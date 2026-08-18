"use client";

import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/context/AuthContext";
import { useState } from "react";

const Select = dynamic(() => import("react-select"), { ssr: false });

export default function OttFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [hoveredWatchDesc, setHoveredWatchDesc] = useState(null);

  const regionOptions = [
    { value: "IN", label: "India" },
    { value: "US", label: "United States" },
    { value: "GB", label: "United Kingdom" },
    { value: "CA", label: "Canada" },
    { value: "AU", label: "Australia" },
    { value: "DE", label: "Germany" },
    { value: "FR", label: "France" },
    { value: "JP", label: "Japan" },
    { value: "KR", label: "South Korea" },
    { value: "BR", label: "Brazil" },
    { value: "IT", label: "Italy" },
    { value: "ES", label: "Spain" },
    { value: "MX", label: "Mexico" },
    { value: "SE", label: "Sweden" },
    { value: "NL", label: "Netherlands" },
    { value: "SG", label: "Singapore" },
    { value: "AE", label: "UAE" },
    { value: "ZA", label: "South Africa" },
    { value: "PH", label: "Philippines" },
    { value: "TH", label: "Thailand" },
  ];

  const watchOptionOptions = [
    { value: "flatrate", label: "Streaming", desc: "Subscription streaming (Netflix, Prime, etc.)" },
    { value: "buy", label: "Purchase", desc: "Digital purchase to own permanently" },
    { value: "rent", label: "Rental", desc: "Digital rental for a limited period" },
    { value: "free", label: "Free", desc: "Free streaming without subscription" },
    { value: "ads", label: "Ads-Supported", desc: "Free streaming with advertisements" },
  ];

  const activeRegion = searchParams.has("region")
    ? (searchParams.get("region") || "IN")
    : (user?.region || "IN");

  const defaultRegion =
    regionOptions.find((opt) => opt.value === activeRegion) || regionOptions[0];

  const activeWatchOption = searchParams.has("watchOption")
    ? (searchParams.get("watchOption") || "flatrate")
    : (user?.watchOption || "flatrate");

  const defaultWatchOption =
    watchOptionOptions.find((opt) => opt.value === activeWatchOption) || watchOptionOptions[0];

  const updateRoute = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="bg-dark-body2/60 border border-white/10 rounded-2xl p-4 sm:p-5 mb-8 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Label and description */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center text-brand text-sm">
          📺
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">
            OTT Providers
          </h3>
          <p className="text-[11px] text-white/50">
            {hoveredWatchDesc || defaultWatchOption.desc}
          </p>
        </div>
      </div>

      {/* Dropdowns */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
        {/* Region Dropdown */}
        <div className="w-full sm:w-48">
          <Select
            id="ottBarRegionSelect"
            options={regionOptions}
            value={defaultRegion}
            placeholder="Select Region"
            isSearchable
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            menuPosition="fixed"
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
            unstyled
            classNames={{
              control: ({ isFocused }) =>
                `bg-dark-body1 text-white px-3 py-1.5 rounded-xl border transition-all ${
                  isFocused
                    ? "border-brand ring-1 ring-brand"
                    : "border-white/15 hover:border-white/30"
                } cursor-pointer text-xs font-medium`,
              menu: () =>
                "bg-slate-800 border border-white/15 rounded-xl shadow-2xl overflow-hidden mt-1",
              menuList: () =>
                "max-h-56 overflow-y-auto custom-scrollbar p-1",
              option: ({ isFocused, isSelected }) =>
                `px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                  isSelected
                    ? "bg-brand text-white font-semibold"
                    : isFocused
                      ? "bg-white/10 text-white"
                      : "text-white/70"
                }`,
              placeholder: () => "text-white/30 text-xs",
              singleValue: () => "text-white text-xs",
              input: () => "text-white text-xs",
              dropdownIndicator: () => "text-white/40 hover:text-white text-xs",
            }}
            onChange={(selectedOption) =>
              updateRoute("region", selectedOption ? selectedOption.value : "IN")
            }
          />
        </div>

        {/* Watch Option Dropdown */}
        <div className="w-full sm:w-48">
          <Select
            id="ottBarWatchOptionSelect"
            options={watchOptionOptions}
            value={defaultWatchOption}
            placeholder="Watch Option"
            isSearchable={false}
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            menuPosition="fixed"
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
            unstyled
            classNames={{
              control: ({ isFocused }) =>
                `bg-dark-body1 text-white px-3 py-1.5 rounded-xl border transition-all ${
                  isFocused
                    ? "border-brand ring-1 ring-brand"
                    : "border-white/15 hover:border-white/30"
                } cursor-pointer text-xs font-medium`,
              menu: () =>
                "bg-slate-800 border border-white/15 rounded-xl shadow-2xl overflow-hidden mt-1",
              menuList: () =>
                "max-h-56 overflow-y-auto custom-scrollbar p-1",
              option: ({ isFocused, isSelected }) =>
                `px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                  isSelected
                    ? "bg-brand text-white font-semibold"
                    : isFocused
                      ? "bg-white/10 text-white"
                      : "text-white/70"
                }`,
              placeholder: () => "text-white/30 text-xs",
              singleValue: () => "text-white text-xs",
              input: () => "text-white text-xs",
              dropdownIndicator: () => "text-white/40 hover:text-white text-xs",
            }}
            onChange={(selectedOption) => {
              updateRoute("watchOption", selectedOption ? selectedOption.value : "flatrate");
            }}
          />
        </div>
      </div>
    </div>
  );
}
