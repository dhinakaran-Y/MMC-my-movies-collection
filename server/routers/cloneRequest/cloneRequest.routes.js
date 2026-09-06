import express from "express";
import { authMiddleware } from "#middleware/auth";
import {
  sendCloneRequest,
  getIncomingRequests,
  getMyRequests,
  respondToRequest,
  getSharedCollections,
  confirmClone,
  getNotificationCount,
  dismissRequest,
} from "#controllers/cloneRequestController";

const router = express.Router();

// Send a clone request
router.post("/clone-request", authMiddleware, sendCloneRequest);

// Get incoming requests (I am the giver)
router.get("/clone-requests/incoming", authMiddleware, getIncomingRequests);

// Get my sent requests (I am the requester)
router.get("/clone-requests/sent", authMiddleware, getMyRequests);

// Notification count for header badge
router.get("/clone-requests/notifications", authMiddleware, getNotificationCount);

// Get shared collections for a request (requester views what giver shared)
router.get("/clone-request/:id/shared-collections", authMiddleware, getSharedCollections);

// Respond to a clone request (accept/reject) — giver
router.patch("/clone-request/:id/respond", authMiddleware, respondToRequest);

// Confirm clone (requester picks final selection) — requester
router.patch("/clone-request/:id/confirm", authMiddleware, confirmClone);

// Dismiss a completed/rejected request
router.delete("/clone-request/:id", authMiddleware, dismissRequest);

export default router;
