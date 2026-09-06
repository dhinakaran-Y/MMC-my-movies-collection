"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/context/AuthContext";
import CloneAcceptModal from "./CloneAcceptModal";
import CloneConfirmModal from "./CloneConfirmModal";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function UserInitial({ name }) {
  const letter = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div className="w-9 h-9 rounded-full bg-brand/20 text-brand flex items-center justify-center text-sm font-bold shrink-0">
      {letter}
    </div>
  );
}

export default function CloneRequestSection() {
  const { user } = useAuth();

  // State
  const [email, setEmail] = useState("");
  const [sendStatus, setSendStatus] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Disambiguation
  const [disambiguationAccounts, setDisambiguationAccounts] = useState(null);

  // Requests
  const [sentRequests, setSentRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  // Modals
  const [acceptModalRequest, setAcceptModalRequest] = useState(null);
  const [confirmModalRequest, setConfirmModalRequest] = useState(null);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    try {
      const [sentRes, incomingRes] = await Promise.all([
        fetch("/api/clone-requests/sent", { credentials: "include" }),
        fetch("/api/clone-requests/incoming", { credentials: "include" }),
      ]);

      if (sentRes.ok) {
        const sentData = await sentRes.json();
        setSentRequests(sentData.data || []);
      }
      if (incomingRes.ok) {
        const incomingData = await incomingRes.json();
        setIncomingRequests(incomingData.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch clone requests:", err);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchRequests();
  }, [user, fetchRequests]);

  // Send clone request
  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSending(true);
    setSendStatus(null);
    setDisambiguationAccounts(null);

    try {
      const res = await fetch("/api/clone-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (data.multipleAccounts) {
        setDisambiguationAccounts(data.accounts);
        return;
      }

      if (!res.ok) {
        setSendStatus({ type: "error", msg: data.error || "Failed to send request." });
        return;
      }

      setSendStatus({ type: "success", msg: "Clone request sent successfully!" });
      setEmail("");
      fetchRequests();
    } catch (err) {
      setSendStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setIsSending(false);
    }
  };

  // Send with explicit giverId (after disambiguation)
  const handleSelectAccount = async (giverId) => {
    setIsSending(true);
    setSendStatus(null);

    try {
      const res = await fetch("/api/clone-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ giverId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSendStatus({ type: "error", msg: data.error || "Failed to send request." });
        return;
      }

      setSendStatus({ type: "success", msg: "Clone request sent successfully!" });
      setEmail("");
      setDisambiguationAccounts(null);
      fetchRequests();
    } catch (err) {
      setSendStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setIsSending(false);
    }
  };

  // Giver rejects
  const handleReject = async (requestId) => {
    try {
      const res = await fetch(`/api/clone-request/${requestId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reject" }),
      });
      if (res.ok) fetchRequests();
    } catch (err) {
      console.error("Failed to reject:", err);
    }
  };

  // Giver accepts (from CloneAcceptModal)
  const handleAcceptConfirm = async (payload) => {
    if (!acceptModalRequest) return;
    try {
      const res = await fetch(`/api/clone-request/${acceptModalRequest._id}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setAcceptModalRequest(null);
        fetchRequests();
      }
    } catch (err) {
      console.error("Failed to accept:", err);
    }
  };

  // Requester confirms clone (from CloneConfirmModal)
  const handleCloneConfirm = async (payload) => {
    if (!confirmModalRequest) return;
    try {
      const res = await fetch(`/api/clone-request/${confirmModalRequest._id}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setConfirmModalRequest(null);
        fetchRequests();
      }
    } catch (err) {
      console.error("Failed to confirm clone:", err);
    }
  };

  // Dismiss
  const handleDismiss = async (requestId) => {
    try {
      const res = await fetch(`/api/clone-request/${requestId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) fetchRequests();
    } catch (err) {
      console.error("Failed to dismiss:", err);
    }
  };

  const pendingIncoming = incomingRequests.filter((r) => r.status === "pending");
  const sharedSent = sentRequests.filter((r) => r.status === "shared");

  return (
    <div className="max-w-3xl mx-auto px-4 mt-8 space-y-6 pb-16">
      {/* ── Section Title ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
          <span className="text-lg">📋</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Clone Collections</h2>
          <p className="text-xs text-white/40">Transfer collections from another account</p>
        </div>
      </div>

      {/* ── Send Request Card ── */}
      <div className="bg-dark-body2 border border-white/5 rounded-2xl p-5">
        <p className="text-sm text-white/60 mb-3">
          Enter the email of the account you want to clone collections from.
        </p>
        <form onSubmit={handleSendRequest} className="flex gap-2">
          <input
            type="email"
            placeholder="e.g. oldaccount@gmail.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSendStatus(null);
              setDisambiguationAccounts(null);
            }}
            required
            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand/50 transition-colors"
          />
          <button
            type="submit"
            disabled={isSending || !email.trim()}
            className="px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
          >
            {isSending ? "Sending..." : "Send Request"}
          </button>
        </form>

        {/* Status message */}
        {sendStatus && (
          <div
            className={`mt-3 px-4 py-2.5 rounded-xl text-sm ${
              sendStatus.type === "success"
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {sendStatus.msg}
          </div>
        )}

        {/* Disambiguation UI */}
        {disambiguationAccounts && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-amber-400/80">
              Multiple accounts found with this email. Select one:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {disambiguationAccounts.map((acc) => (
                <button
                  key={acc._id}
                  onClick={() => handleSelectAccount(acc._id)}
                  disabled={isSending}
                  className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-brand/40 hover:bg-brand/5 transition-all cursor-pointer text-left"
                >
                  <UserInitial name={acc.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{acc.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {acc.authProvider === "google" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white border border-white/15">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          Google
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Local (MMC)
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Shared Requests (awaiting requester confirmation) ── */}
      {sharedSent.length > 0 && (
        <div className="bg-dark-body2 border border-green-500/20 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Ready to Clone</h3>
              <span className="w-5 h-5 rounded-full bg-green-500 text-[11px] font-bold text-dark-body1 flex items-center justify-center">
                {sharedSent.length}
              </span>
            </div>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Review & confirm</span>
          </div>

          <div className="divide-y divide-white/5">
            {sharedSent.map((req) => (
              <div key={req._id} className="px-5 py-4 flex items-center gap-4">
                <UserInitial name={req.giverId?.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {req.giverId?.name || "Unknown User"}
                  </p>
                  <p className="text-xs text-white/40 truncate">{req.giverId?.email}</p>
                  <p className="text-xs text-green-400 mt-0.5">{req.message}</p>
                  <p className="text-[10px] text-white/20 mt-0.5">{timeAgo(req.updatedAt)}</p>
                </div>
                <button
                  onClick={() => setConfirmModalRequest(req)}
                  className="px-4 py-2 bg-green-500/15 text-green-400 text-xs font-semibold rounded-lg hover:bg-green-500/25 transition-colors cursor-pointer border border-green-500/20 whitespace-nowrap"
                >
                  Review & Clone
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Incoming Requests (I'm the giver) ── */}
      {pendingIncoming.length > 0 && (
        <div className="bg-dark-body2 border border-amber-500/20 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Incoming Requests</h3>
              <span className="w-5 h-5 rounded-full bg-amber-500 text-[11px] font-bold text-dark-body1 flex items-center justify-center">
                {pendingIncoming.length}
              </span>
            </div>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Awaiting your response</span>
          </div>

          <div className="divide-y divide-white/5">
            {pendingIncoming.map((req) => (
              <div key={req._id} className="px-5 py-4 flex items-center gap-4">
                <UserInitial name={req.requesterId?.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {req.requesterId?.name || "Unknown User"}
                  </p>
                  <p className="text-xs text-white/40 truncate">
                    {req.requesterId?.email} wants to clone your collections
                  </p>
                  <p className="text-[10px] text-white/20 mt-0.5">{timeAgo(req.createdAt)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setAcceptModalRequest(req)}
                    className="px-3.5 py-1.5 bg-green-500/15 text-green-400 text-xs font-semibold rounded-lg hover:bg-green-500/25 transition-colors cursor-pointer border border-green-500/20"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(req._id)}
                    className="px-3.5 py-1.5 bg-red-500/10 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer border border-red-500/20"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sent Requests ── */}
      {sentRequests.filter((r) => r.status !== "shared").length > 0 && (
        <div className="bg-dark-body2 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">Sent Requests</h3>
          </div>

          <div className="divide-y divide-white/5">
            {sentRequests
              .filter((r) => r.status !== "shared")
              .map((req) => {
                const statusConfig = {
                  pending: {
                    badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",
                    label: "Pending",
                    icon: "⏳",
                  },
                  completed: {
                    badge: "bg-green-500/15 text-green-400 border-green-500/20",
                    label: "Completed",
                    icon: "✅",
                  },
                  rejected: {
                    badge: "bg-red-500/15 text-red-400 border-red-500/20",
                    label: "Rejected",
                    icon: "❌",
                  },
                };

                const cfg = statusConfig[req.status] || statusConfig.pending;

                return (
                  <div key={req._id} className="px-5 py-4 flex items-center gap-4">
                    <UserInitial name={req.giverId?.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {req.giverId?.name || "Unknown User"}
                      </p>
                      <p className="text-xs text-white/40 truncate">{req.giverId?.email}</p>
                      {req.status === "completed" && req.message && (
                        <p className="text-xs text-green-400 mt-0.5">{req.message}</p>
                      )}
                      {req.status === "rejected" && (
                        <p className="text-xs text-red-400/70 mt-0.5">Request was rejected</p>
                      )}
                      <p className="text-[10px] text-white/20 mt-0.5">{timeAgo(req.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${cfg.badge}`}
                      >
                        <span>{cfg.icon}</span>
                        {cfg.label}
                      </span>
                      {req.status !== "pending" && (
                        <button
                          onClick={() => handleDismiss(req._id)}
                          className="text-white/20 hover:text-white/50 transition-colors cursor-pointer"
                          title="Dismiss"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Request History (non-pending incoming) ── */}
      {incomingRequests.filter((r) => r.status !== "pending").length > 0 && (
        <div className="bg-dark-body2 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">Request History</h3>
          </div>

          <div className="divide-y divide-white/5">
            {incomingRequests
              .filter((r) => r.status !== "pending")
              .map((req) => {
                const isCompleted = req.status === "completed";
                const isShared = req.status === "shared";
                return (
                  <div key={req._id} className="px-5 py-4 flex items-center gap-4">
                    <UserInitial name={req.requesterId?.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {req.requesterId?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-white/40 truncate">{req.requesterId?.email}</p>
                      {req.message && (
                        <p className={`text-xs mt-0.5 ${isCompleted ? "text-green-400" : isShared ? "text-amber-400" : "text-red-400/70"}`}>
                          {req.message}
                        </p>
                      )}
                      <p className="text-[10px] text-white/20 mt-0.5">{timeAgo(req.updatedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                          isCompleted
                            ? "bg-green-500/15 text-green-400 border-green-500/20"
                            : isShared
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                              : "bg-red-500/15 text-red-400 border-red-500/20"
                        }`}
                      >
                        {isCompleted ? "✅ Cloned" : isShared ? "⏳ Awaiting" : "❌ Rejected"}
                      </span>
                      {(isCompleted || req.status === "rejected") && (
                        <button
                          onClick={() => handleDismiss(req._id)}
                          className="text-white/20 hover:text-white/50 transition-colors cursor-pointer"
                          title="Dismiss"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoadingRequests && sentRequests.length === 0 && incomingRequests.length === 0 && (
        <div className="text-center py-6 text-white/20 text-sm">
          No clone requests yet. Send one to get started!
        </div>
      )}

      {/* Giver Accept Modal */}
      <CloneAcceptModal
        isOpen={!!acceptModalRequest}
        onClose={() => setAcceptModalRequest(null)}
        request={acceptModalRequest}
        onConfirm={handleAcceptConfirm}
      />

      {/* Requester Confirm Modal */}
      <CloneConfirmModal
        isOpen={!!confirmModalRequest}
        onClose={() => setConfirmModalRequest(null)}
        request={confirmModalRequest}
        onConfirm={handleCloneConfirm}
      />
    </div>
  );
}
