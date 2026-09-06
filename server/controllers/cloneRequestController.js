import CloneRequest from "#models/cloneRequest.model";
import User from "#models/user.model";
import Collection from "#models/collection.model";

// Helper: generate a unique collection name for the requester
async function getUniqueCollectionName(ownerId, baseName) {
  const existing = await Collection.find({ ownerId }).select("collectionName").lean();
  const existingNames = new Set(existing.map((c) => c.collectionName.toLowerCase()));

  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  const clonedName = `${baseName} (cloned)`;
  if (!existingNames.has(clonedName.toLowerCase())) {
    return clonedName;
  }

  let counter = 2;
  while (existingNames.has(`${baseName} (cloned ${counter})`.toLowerCase())) {
    counter++;
  }
  return `${baseName} (cloned ${counter})`;
}

// 1. Send a clone request
export async function sendCloneRequest(req, res) {
  try {
    const requesterId = req.user.id;
    const { email, giverId } = req.body;

    let targetUser;

    if (giverId) {
      targetUser = await User.findById(giverId, { password: 0 });
      if (!targetUser) {
        return res.status(404).json({ error: "User not found." });
      }
    } else if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const matchingUsers = await User.find({ email: normalizedEmail }, { password: 0 });

      if (matchingUsers.length === 0) {
        return res.status(404).json({ error: "No account found with this email." });
      }

      if (matchingUsers.length > 1) {
        const accounts = matchingUsers.map((u) => ({
          _id: u._id,
          name: u.name,
          authProvider: u.authProvider,
        }));
        return res.status(200).json({ multipleAccounts: true, accounts });
      }

      targetUser = matchingUsers[0];
    } else {
      return res.status(400).json({ error: "Email or giverId is required." });
    }

    if (targetUser._id.toString() === requesterId) {
      return res.status(400).json({ error: "You cannot send a clone request to yourself." });
    }

    const existingPending = await CloneRequest.findOne({
      requesterId,
      giverId: targetUser._id,
      status: "pending",
    });

    if (existingPending) {
      return res.status(409).json({
        error: "You already have a pending request to this user.",
      });
    }

    const cloneRequest = new CloneRequest({
      requesterId,
      giverId: targetUser._id,
    });

    await cloneRequest.save();

    return res.status(201).json({
      message: "Clone request sent successfully.",
      data: cloneRequest,
    });
  } catch (error) {
    console.error("Error sending clone request:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        error: "You already have a pending request to this user.",
      });
    }
    return res.status(500).json({ error: "Failed to send clone request." });
  }
}

// 2. Get incoming requests (I am the giver)
export async function getIncomingRequests(req, res) {
  try {
    const giverId = req.user.id;

    const requests = await CloneRequest.find({ giverId })
      .populate("requesterId", "name email authProvider profileImage googleProfileImage")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ data: requests });
  } catch (error) {
    console.error("Error fetching incoming requests:", error);
    return res.status(500).json({ error: "Failed to fetch incoming requests." });
  }
}

// 3. Get my sent requests (I am the requester)
export async function getMyRequests(req, res) {
  try {
    const requesterId = req.user.id;

    const requests = await CloneRequest.find({ requesterId })
      .populate("giverId", "name email authProvider")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ data: requests });
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    return res.status(500).json({ error: "Failed to fetch sent requests." });
  }
}

// 4. Respond to a clone request (giver accepts or rejects)
// Accept now sets status to "shared" — does NOT clone yet
export async function respondToRequest(req, res) {
  try {
    const { id } = req.params;
    const giverId = req.user.id;
    const { action, sharingMode, selectedCollections } = req.body;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ error: "Action must be 'accept' or 'reject'." });
    }

    const cloneRequest = await CloneRequest.findOne({
      _id: id,
      giverId,
      status: "pending",
    });

    if (!cloneRequest) {
      return res.status(404).json({ error: "Clone request not found or already responded." });
    }

    // REJECT
    if (action === "reject") {
      cloneRequest.status = "rejected";
      cloneRequest.message = "Request was rejected.";
      await cloneRequest.save();
      return res.status(200).json({ message: "Request rejected.", data: cloneRequest });
    }

    // ACCEPT — determine shared collections, set status to "shared"
    if (!sharingMode || !["all", "public", "private", "custom"].includes(sharingMode)) {
      return res.status(400).json({ error: "Valid sharingMode is required when accepting." });
    }

    let collectionsToShare;

    switch (sharingMode) {
      case "all":
        collectionsToShare = await Collection.find({ ownerId: giverId }).lean();
        break;
      case "public":
        collectionsToShare = await Collection.find({ ownerId: giverId, visibility: "public" }).lean();
        break;
      case "private":
        collectionsToShare = await Collection.find({ ownerId: giverId, visibility: "private" }).lean();
        break;
      case "custom":
        if (!selectedCollections || !Array.isArray(selectedCollections) || selectedCollections.length === 0) {
          return res.status(400).json({ error: "selectedCollections is required for custom mode." });
        }
        collectionsToShare = await Collection.find({
          _id: { $in: selectedCollections },
          ownerId: giverId,
        }).lean();
        break;
    }

    // Store shared collection IDs and set status to "shared"
    cloneRequest.status = "shared";
    cloneRequest.sharingMode = sharingMode;
    cloneRequest.sharedCollectionIds = (collectionsToShare || []).map((c) => c._id);
    cloneRequest.message = `${(collectionsToShare || []).length} collection(s) shared. Waiting for requester to confirm.`;
    await cloneRequest.save();

    return res.status(200).json({
      message: cloneRequest.message,
      data: cloneRequest,
    });
  } catch (error) {
    console.error("Error responding to clone request:", error);
    return res.status(500).json({ error: "Failed to process clone request." });
  }
}

// 5. Get shared collections for a clone request (requester views what's available)
export async function getSharedCollections(req, res) {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;

    const cloneRequest = await CloneRequest.findOne({
      _id: id,
      requesterId,
      status: "shared",
    });

    if (!cloneRequest) {
      return res.status(404).json({ error: "Shared request not found." });
    }

    // Fetch the actual collection documents with movie lists
    const collections = await Collection.find({
      _id: { $in: cloneRequest.sharedCollectionIds },
    }).lean();

    return res.status(200).json({ data: collections });
  } catch (error) {
    console.error("Error fetching shared collections:", error);
    return res.status(500).json({ error: "Failed to fetch shared collections." });
  }
}

// 6. Confirm clone (requester picks final collections to clone)
export async function confirmClone(req, res) {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const { selectedCollections } = req.body;

    const cloneRequest = await CloneRequest.findOne({
      _id: id,
      requesterId,
      status: "shared",
    });

    if (!cloneRequest) {
      return res.status(404).json({ error: "Shared request not found or already confirmed." });
    }

    if (!selectedCollections || !Array.isArray(selectedCollections) || selectedCollections.length === 0) {
      return res.status(400).json({ error: "Select at least one collection to clone." });
    }

    // Only allow cloning from the shared set
    const allowedIds = new Set(cloneRequest.sharedCollectionIds.map((id) => id.toString()));
    const validIds = selectedCollections.filter((id) => allowedIds.has(id.toString()));

    if (validIds.length === 0) {
      return res.status(400).json({ error: "None of the selected collections are in the shared set." });
    }

    const collectionsToClone = await Collection.find({ _id: { $in: validIds } }).lean();

    // Clone each collection
    const clonedDocs = [];
    for (const col of collectionsToClone) {
      const uniqueName = await getUniqueCollectionName(requesterId, col.collectionName);

      const clonedCollection = new Collection({
        ownerId: requesterId,
        collectionName: uniqueName,
        moviesList: [...col.moviesList],
        visibility: col.visibility,
      });

      const saved = await clonedCollection.save();
      clonedDocs.push(saved);
    }

    // Update request status
    cloneRequest.status = "completed";
    cloneRequest.selectedCollections = validIds;
    cloneRequest.clonedCount = clonedDocs.length;
    cloneRequest.message = `${clonedDocs.length} collection${clonedDocs.length !== 1 ? "s" : ""} cloned successfully.`;
    await cloneRequest.save();

    return res.status(200).json({
      message: cloneRequest.message,
      data: cloneRequest,
    });
  } catch (error) {
    console.error("Error confirming clone:", error);
    return res.status(500).json({ error: "Failed to clone collections." });
  }
}

// 7. Notification count (pending incoming + shared sent)
export async function getNotificationCount(req, res) {
  try {
    const userId = req.user.id;

    const [pendingIncoming, sharedSent] = await Promise.all([
      CloneRequest.countDocuments({ giverId: userId, status: "pending" }),
      CloneRequest.countDocuments({ requesterId: userId, status: "shared" }),
    ]);

    return res.status(200).json({ count: pendingIncoming + sharedSent });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    return res.status(500).json({ error: "Failed to fetch notification count." });
  }
}

// 8. Dismiss (delete) a completed/rejected request
export async function dismissRequest(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const cloneRequest = await CloneRequest.findOne({
      _id: id,
      $or: [{ requesterId: userId }, { giverId: userId }],
    });

    if (!cloneRequest) {
      return res.status(404).json({ error: "Clone request not found." });
    }

    await CloneRequest.findByIdAndDelete(id);

    return res.status(200).json({ message: "Request dismissed." });
  } catch (error) {
    console.error("Error dismissing clone request:", error);
    return res.status(500).json({ error: "Failed to dismiss request." });
  }
}
