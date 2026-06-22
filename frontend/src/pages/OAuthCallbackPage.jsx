import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { needsProfileCompletion } from "@/utils/profileCompletion";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeExternalLogin } = useAuth();
  const [error, setError] = useState("");
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) {
      return;
    }

    processed.current = true;

    const token = searchParams.get("token");
    const userPayload = searchParams.get("user");

    if (!token || !userPayload) {
      setError("OAuth login did not return a valid session.");
      return;
    }

    try {
      const user = JSON.parse(userPayload);

      completeExternalLogin({
        token,
        user,
      });
      navigate(needsProfileCompletion(user) ? "/complete-profile" : "/", { replace: true });
    } catch {
      setError("OAuth login response could not be processed.");
    }
  }, [completeExternalLogin, navigate, searchParams]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="alert alert-danger">{error}</div>
        <Link className="btn btn-dark" to="/login">
          Back to login
        </Link>
      </div>
    );
  }

  return <LoadingSpinner label="Completing sign in..." />;
}
