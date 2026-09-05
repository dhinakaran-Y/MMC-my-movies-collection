import { OAuth2Client } from "google-auth-library";
import User from "#models/user.model";
import jwt from "jsonwebtoken";
import WatchList from "#models/watchList.model";

const isProd = process.env.NODE_ENV === "production";

export async function googleLogin(req, res) {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  try {
    // 1. Exchange authorization code for tokens
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      isProd
        ? "https://mmc-my-movies-collection.vercel.app/api/auth/google/callback"
        : "http://localhost:3000/api/auth/google/callback",
    );

    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    let { sub: googleId, email, name, picture } = payload;
    console.log("📸 [GOOGLE] ID Token picture:", picture);

    // Fallback: If picture was not included in the ID token, check Google's userinfo endpoint
    if (!picture && tokens.access_token) {
      try {
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          },
        );
        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          console.log("📸 [GOOGLE] UserInfo API response:", {
            picture: userInfo.picture,
            email: userInfo.email,
            name: userInfo.name,
          });
          if (userInfo.picture) {
            picture = userInfo.picture;
          }
        }
      } catch (err) {
        console.error("Could not fetch Google userinfo:", err);
      }
    }

    // Default avatar if no custom photo was uploaded to Google (matching Google's purple circle style)
    const resolvedPicture =
      picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name || email.split("@")[0],
      )}&background=8e24aa&color=fff&size=256`;
    console.log("📸 [GOOGLE] Final resolvedPicture to save:", resolvedPicture);

    // 2. Find existing Google user (ONLY look at google accounts, never local)
    let user = await User.findOne({
      googleId,
      authProvider: "google",
    });

    if (!user) {
      // Also check by email + google provider
      user = await User.findOne({
        email: email.toLowerCase(),
        authProvider: "google",
      });
    }

    if (!user) {
      // 3. Create NEW Google user (completely separate from any local account)
      user = new User({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        authProvider: "google",
        googleId,
        profileImage: resolvedPicture,
        googleProfileImage: resolvedPicture,
        password: null,
      });
      await user.save();

      // Create watchlist for new user
      const watchList = new WatchList({
        ownerId: user._id,
        watchedMoviesList: [],
      });
      await watchList.save();

      console.log(`✅ [GOOGLE-LOGIN] New Google user created: ${user.email}`);
    } else {
      // Update googleId if missing, update profile pic
      let needsSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (resolvedPicture && user.googleProfileImage !== resolvedPicture) {
        user.googleProfileImage = resolvedPicture;
        needsSave = true;
      }
      if (!user.profileImage) {
        user.profileImage = resolvedPicture;
        needsSave = true;
      }
      if (needsSave) await user.save();

      console.log(`✅ [GOOGLE-LOGIN] Existing Google user logged in: ${user.email}`);
    }

    // 4. Generate JWT (includes authProvider for identification)
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, authProvider: "google" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" },
    );

    // 5. Set cookie
    const cookieOptions = {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    };

    if (isProd) {
      cookieOptions.sameSite = "None";
      cookieOptions.secure = true;
    } else {
      cookieOptions.sameSite = "Lax";
      cookieOptions.secure = false;
    }

    res.cookie("token", token, cookieOptions);
    console.log(`✅ [GOOGLE-LOGIN] Cookie set for user: ${user.name}`);
    res.json({ message: `Welcome ${user.name}!`, token });
  } catch (error) {
    console.error("🔴 [GOOGLE-LOGIN] Error:", error);
    res.status(500).json({ error: "Google authentication failed" });
  }
}
