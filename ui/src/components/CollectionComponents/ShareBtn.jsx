"use client";

export default function ShareButton({ title, text, url }) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url || window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(url || window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="px-6 py-2 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-white font-bold transition-all shadow-lg active:scale-95">
      Share Collection
    </button>
  );
}
