import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env";
import { AuthService } from "../services/auth.service";

let configured = false;

export const isGoogleOAuthConfigured = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL,
);

export function configurePassport() {
  if (configured || !isGoogleOAuthConfigured) {
    return;
  }

  configured = true;

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        callbackURL: env.GOOGLE_CALLBACK_URL!,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();

          if (!email) {
            done(null, false, { message: "Google account did not provide an email" });
            return;
          }

          const result = await new AuthService().loginWithSso({
            email,
            name: profile.displayName || email.split("@")[0],
          });

          done(null, result);
        } catch (error) {
          done(error);
        }
      },
    ),
  );
}
