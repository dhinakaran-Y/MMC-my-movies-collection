"use client";

import { useState, useEffect } from "react";
import FilteredLanguagesArr from "@/data/FilteredLanguagesArr.json";
import dynamic from "next/dynamic";

const Select = dynamic(() => import("react-select"), { ssr: false });

function getUserInitials(name) {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function UserEditForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    initialData?.language || "",
  );
  const [selectedRegion, setSelectedRegion] = useState(
    initialData?.region || "IN",
  );
  const [previewImage, setPreviewImage] = useState(
    initialData?.profileImage || "",
  );

  const isGoogleUser = initialData?.authProvider === "google";
  const googlePhoto =
    initialData?.googleProfileImage ||
    (isGoogleUser && initialData?.profileImage?.includes("googleusercontent.com")
      ? initialData?.profileImage
      : "");

  useEffect(() => {
    if (isOpen) {
      setSelectedLanguage(initialData?.language || "");
      setSelectedRegion(initialData?.region || "IN");
      setPreviewImage(initialData?.profileImage || "");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be under 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
        setPreviewImage(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const languageOptions = [
    { value: "", label: "All Languages (Worldwide)" },
    ...FilteredLanguagesArr.map((l) => ({
      value: l.language,
      label: l.languageName,
    })),
  ];

  const currentOption =
    languageOptions.find((opt) => opt.value === selectedLanguage) ||
    languageOptions[0];

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

  const currentRegionOption =
    regionOptions.find((opt) => opt.value === selectedRegion) ||
    regionOptions[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    if (isGoogleUser) {
      delete data.password;
      delete data.email;
    }

    try {
      await onSubmit(data); // Calls the function from ProfileDiv
      onClose();
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dark-body2 p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-white/10 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white">
          ✕
        </button>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold text-white mb-2">Edit Profile</h2>

          {/* Profile Picture Upload Preview */}
          <div className="flex flex-col items-center justify-center mb-2">
            <div className="relative group cursor-pointer">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile Avatar Preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-brand/40 shadow-lg shadow-black/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-brand shadow-lg flex justify-center items-center font-bold text-white text-3xl tracking-wider border-2 border-brand/40">
                  {getUserInitials(initialData?.name)}
                </div>
              )}
              {!isGoogleUser && (
                <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold">
                  📷 Change
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>

            {/* Google accounts: 2 Photo Options */}
            {isGoogleUser ? (
              <div className="flex flex-col items-center gap-2 mt-2 w-full">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(googlePhoto || initialData?.profileImage || "")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      previewImage === (googlePhoto || initialData?.profileImage)
                        ? "bg-brand text-white border-brand shadow-md shadow-brand/20"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Google Photo</span>
                  </button>

                  <label
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      previewImage !== (googlePhoto || initialData?.profileImage) && previewImage
                        ? "bg-brand text-white border-brand shadow-md shadow-brand/20"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                <span className="text-[10px] text-white/40">
                  {previewImage === (googlePhoto || initialData?.profileImage)
                    ? "Default Google profile photo active"
                    : "Custom uploaded photo active"}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-white/40 mt-1">
                Click photo to change avatar
              </span>
            )}
          </div>
          <input type="hidden" name="profileImage" value={previewImage} />

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
              Name
            </label>
            <input
              name="name"
              type="text"
              defaultValue={initialData?.name}
              required
              autoFocus
              className="w-full px-4 py-3 bg-dark-body1 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
                Email
              </label>
              {isGoogleUser && (
                <span className="text-[10px] text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full font-medium">
                  Google Account (Read-only)
                </span>
              )}
            </div>
            <input
              name="email"
              type="email"
              defaultValue={initialData?.email}
              readOnly={isGoogleUser}
              disabled={isGoogleUser}
              required={!isGoogleUser}
              className={`w-full px-4 py-3 bg-dark-body1 border text-white rounded-xl outline-none ${
                isGoogleUser
                  ? "opacity-50 cursor-not-allowed bg-white/5 border-white/5"
                  : "border-white/10 focus:ring-2 focus:ring-brand"
              }`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
              Preferred Language
            </label>
            <input type="hidden" name="language" value={selectedLanguage} />
            <Select
              id="profileLanguageSelect"
              options={languageOptions}
              value={currentOption}
              placeholder="Search preferred language..."
              isSearchable
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              unstyled
              classNames={{
                control: ({ isFocused }) =>
                  `bg-dark-body1 text-white p-2 rounded-xl border transition-all ${
                    isFocused
                      ? "border-brand ring-1 ring-brand"
                      : "border-white/10"
                  } cursor-pointer text-sm`,
                menu: () =>
                  "bg-slate-800 border border-white/15 rounded-xl shadow-2xl overflow-hidden mt-1",
                menuList: () =>
                  "max-h-52 overflow-y-auto custom-scrollbar p-1",
                option: ({ isFocused, isSelected }) =>
                  `px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                    isSelected
                      ? "bg-brand text-white font-medium"
                      : isFocused
                        ? "bg-white/10 text-white"
                        : "text-white/70"
                  }`,
                placeholder: () => "text-white/30 px-2 text-sm",
                singleValue: () => "text-white px-2 text-sm",
                input: () => "text-white px-2 text-sm",
                dropdownIndicator: () => "text-white/40 hover:text-white px-2",
              }}
              onChange={(opt) => setSelectedLanguage(opt ? opt.value : "")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
              Preferred Region
            </label>
            <input type="hidden" name="region" value={selectedRegion} />
            <Select
              id="profileRegionSelect"
              options={regionOptions}
              value={currentRegionOption}
              placeholder="Select region..."
              isSearchable
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              unstyled
              classNames={{
                control: ({ isFocused }) =>
                  `bg-dark-body1 text-white p-2 rounded-xl border transition-all ${
                    isFocused
                      ? "border-brand ring-1 ring-brand"
                      : "border-white/10"
                  } cursor-pointer text-sm`,
                menu: () =>
                  "bg-slate-800 border border-white/15 rounded-xl shadow-2xl overflow-hidden mt-1",
                menuList: () =>
                  "max-h-52 overflow-y-auto custom-scrollbar p-1",
                option: ({ isFocused, isSelected }) =>
                  `px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                    isSelected
                      ? "bg-brand text-white font-medium"
                      : isFocused
                        ? "bg-white/10 text-white"
                        : "text-white/70"
                  }`,
                placeholder: () => "text-white/30 px-2 text-sm",
                singleValue: () => "text-white px-2 text-sm",
                input: () => "text-white px-2 text-sm",
                dropdownIndicator: () => "text-white/40 hover:text-white px-2",
              }}
              onChange={(opt) => setSelectedRegion(opt ? opt.value : "IN")}
            />
          </div>

          {isGoogleUser ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
                Password
              </label>
              <div className="w-full px-4 py-3 bg-white/5 border border-white/5 text-white/50 rounded-xl text-xs flex items-center gap-2.5 cursor-not-allowed select-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-white/40 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>Password is managed by your Google account</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
                New Password
              </label>
              <input
                name="password"
                type="password"
                placeholder="Leave blank to keep current"
                className="w-full px-4 py-3 bg-dark-body1 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand py-3 rounded-xl font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
