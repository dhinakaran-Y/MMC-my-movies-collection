"use client";

import { useState, useEffect } from "react";
import FilteredLanguagesArr from "@/data/FilteredLanguagesArr.json";
import dynamic from "next/dynamic";

const Select = dynamic(() => import("react-select"), { ssr: false });

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
  const [previewImage, setPreviewImage] = useState(
    initialData?.profileImage || "",
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedLanguage(initialData?.language || "");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

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
              <img
                src={previewImage || "/profile-img.png"}
                alt="Profile Avatar Preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-brand/40 shadow-lg shadow-black/40"
              />
              <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold">
                📷 Change
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <span className="text-[11px] text-white/40 mt-1">
              Click photo to change avatar
            </span>
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
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
              Email
            </label>
            <input
              name="email"
              type="email"
              defaultValue={initialData?.email}
              required
              className="w-full px-4 py-3 bg-dark-body1 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-brand"
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
              unstyled
              classNames={{
                control: ({ isFocused }) =>
                  `bg-dark-body1 text-white p-2 rounded-xl border transition-all ${
                    isFocused
                      ? "border-brand ring-1 ring-brand"
                      : "border-white/10"
                  } cursor-pointer text-sm`,
                menu: () =>
                  "bg-slate-800 border border-white/10 rounded-xl mt-2 overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar",
                option: ({ isFocused, isSelected }) =>
                  `px-3 py-2 cursor-pointer text-sm transition-colors ${
                    isSelected
                      ? "bg-brand text-white"
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
              New Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="Leave blank to keep current"
              className="w-full px-4 py-3 bg-dark-body1 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

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
