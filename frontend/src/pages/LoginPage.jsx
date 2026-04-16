import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

function validate(values) {
  const errors = {};

  if (!values.Email.trim()) {
    errors.Email = "Please enter your email";
  } else if (!/\S+@\S+\.\S+/.test(values.Email)) {
    errors.Email = "Please enter a valid email";
  }

  if (!values.Password) {
    errors.Password = "Please enter your password";
  } else if (values.Password.length < 6) {
    errors.Password = "Password must be at least 6 characters";
  }

  return errors;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ Email: "", Password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const redirectTarget = useMemo(() => location.state?.from?.pathname || "/", [location]);

  if (isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setServerError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await login({
        Email: form.Email.trim(),
        Password: form.Password,
      });
      navigate(redirectTarget, { replace: true });
    } catch (reason) {
      setServerError(reason.message || "Login failed. Please check your credentials.");
    }
  }

  return (
    <section className="py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-lg mt-5">
              <div className="card-body p-4">
                <h3 className="text-center mb-4">Login</h3>
                {serverError ? <div className="alert alert-danger">{serverError}</div> : null}
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="loginEmail" className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      className={`form-control ${errors.Email ? "is-invalid" : ""}`}
                      id="loginEmail"
                      value={form.Email}
                      onChange={(event) => setForm((previous) => ({ ...previous, Email: event.target.value }))}
                    />
                    {errors.Email ? <div className="invalid-feedback">{errors.Email}</div> : null}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="loginPassword" className="form-label">
                      Password
                    </label>
                    <input
                      type="password"
                      className={`form-control ${errors.Password ? "is-invalid" : ""}`}
                      id="loginPassword"
                      value={form.Password}
                      onChange={(event) => setForm((previous) => ({ ...previous, Password: event.target.value }))}
                    />
                    {errors.Password ? <div className="invalid-feedback">{errors.Password}</div> : null}
                  </div>
                  <div className="d-grid gap-2">
                    <button type="submit" className="btn btn-custom btn-lg" disabled={loading}>
                      {loading ? "Loading..." : "Login"}
                    </button>
                  </div>
                </form>
              </div>
              <div className="card-footer text-center py-3">
                <div className="small">
                  <Link to="/register" className="text-decoration-none text-custom">
                    Need an account? Sign up!
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
