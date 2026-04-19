const LocalStrategy = require("passport-local").Strategy;
const crypto = require("crypto");
const User = require("../models/User");

module.exports = function (passport) {
  // Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          // Find user by email
          const user = await User.findOne({ email: email.toLowerCase() });

          if (!user) {
            return done(null, false, {
              message: "No user found with that email",
            });
          }

          // Check if user is approved (for sellers, veterinaries, organizations)
          if (
            (user.role === "seller" ||
              user.role === "veterinary" ||
              user.role === "organization") &&
            !user.isApproved
          ) {
            return done(null, false, {
              message:
                "Your account is pending approval. Please wait for admin approval.",
            });
          }

          // Match password (supports legacy plaintext upgrade)
          const isMatch = await user.comparePassword(password);

          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Incorrect password" });
          }
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Google OAuth Strategy (optional, enabled only when env vars are provided)
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const publicApiUrl = process.env.PUBLIC_API_URL;
  const renderExternalUrl = process.env.RENDER_EXTERNAL_URL;
  const port = process.env.PORT || 5000;
  const fallbackBaseUrl = `http://localhost:${port}`;

  const normalizeBaseUrl = (raw) => {
    if (!raw) return null;
    const s = String(raw).trim();
    if (!s) return null;
    try {
      return new URL(s).origin;
    } catch {
      // Allow env like "tail-react.onrender.com"
      try {
        return new URL(`https://${s}`).origin;
      } catch {
        return s.replace(/\/+$/g, "");
      }
    }
  };

  const isLocalhostOrigin = (raw) => {
    if (!raw) return false;
    try {
      const u = new URL(String(raw));
      return u.hostname === "localhost" || u.hostname === "127.0.0.1";
    } catch {
      return false;
    }
  };

  const deployedBaseUrl =
    normalizeBaseUrl(process.env.GOOGLE_CALLBACK_BASE_URL) ||
    normalizeBaseUrl(publicApiUrl) ||
    normalizeBaseUrl(renderExternalUrl);

  const envCallbackUrl = process.env.GOOGLE_CALLBACK_URL
    ? String(process.env.GOOGLE_CALLBACK_URL).trim()
    : "";

  const shouldIgnoreEnvCallbackUrl =
    !!envCallbackUrl &&
    isLocalhostOrigin(envCallbackUrl) &&
    !!deployedBaseUrl &&
    !isLocalhostOrigin(deployedBaseUrl);

  const callbackBaseUrl = deployedBaseUrl || fallbackBaseUrl;

  const callbackURL =
    (!shouldIgnoreEnvCallbackUrl && envCallbackUrl) ||
    `${String(callbackBaseUrl).replace(/\/$/, "")}/api/auth/google/callback`;

  if (googleClientId && googleClientSecret) {
    const GoogleStrategy = require("passport-google-oauth20").Strategy;

    if (shouldIgnoreEnvCallbackUrl) {
      console.warn(
        "WARN: GOOGLE_CALLBACK_URL points to localhost but a deployed base URL is present. Ignoring GOOGLE_CALLBACK_URL and using:",
        callbackURL
      );
    } else {
      console.log("Google OAuth callbackURL:", callbackURL);
    }

    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile?.emails?.[0]?.value;
            if (!email) {
              return done(null, false, {
                message:
                  "Google account did not provide an email address. Please use a different sign-in method.",
              });
            }

            const normalizedEmail = email.toLowerCase();
            const googleId = profile.id;
            const displayName = profile.displayName || normalizedEmail.split("@")[0];
            const photoUrl = profile?.photos?.[0]?.value;

            let user = await User.findOne({ email: normalizedEmail });

            if (user) {
              // Enforce the same approval rule for privileged roles
              if (
                (user.role === "seller" ||
                  user.role === "veterinary" ||
                  user.role === "organization") &&
                !user.isApproved
              ) {
                return done(null, false, {
                  message:
                    "Your account is pending approval. Please wait for admin approval.",
                });
              }

              let changed = false;
              if (!user.googleId) {
                user.googleId = googleId;
                changed = true;
              }
              if (!user.authProvider) {
                user.authProvider = "local";
                changed = true;
              }
              if (
                photoUrl &&
                (user.profileImage === "/uploads/users/default-avatar.png" ||
                  !user.profileImage)
              ) {
                user.profileImage = photoUrl;
                changed = true;
              }

              if (changed) {
                await user.save();
              }
              return done(null, user);
            }

            // Create a new customer account by default.
            // This avoids bypassing admin approval for privileged roles.
            const randomPassword = crypto.randomBytes(32).toString("hex");

            user = new User({
              name: displayName,
              email: normalizedEmail,
              password: randomPassword,
              role: "customer",
              authProvider: "google",
              googleId,
              profileImage: photoUrl || "/uploads/users/default-avatar.png",
            });

            await user.save();
            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }

  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).select("-password");
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
