import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { needsProfileCompletion } from "@/utils/profileCompletion";

function validate(values) {
  const errors = {};

  if (values.Name.trim().length < 2) {
    errors.Name = "Name must be at least 2 characters";
  }

  if (!/\S+@\S+\.\S+/.test(values.Email)) {
    errors.Email = "Please enter a valid email";
  }

  if (values.Address.trim().length < 5) {
    errors.Address = "Address must be at least 5 characters";
  }

  if (values.Password.length < 6) {
    errors.Password = "Password must be at least 6 characters";
  }

  if (values.ConfirmPassword !== values.Password) {
    errors.ConfirmPassword = "Passwords don't match";
  }

  if (values.Role === "Admin" && !values.AdminPassword.trim()) {
    errors.AdminPassword = "Admin password is required";
  }

  return errors;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({
    Name: "",
    Email: "",
    Address: "",
    Password: "",
    ConfirmPassword: "",
    Role: "Customer",
    AdminPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    let active = true;

    authService
      .getProviders()
      .then((response) => {
        if (active) {
          setGoogleEnabled(Boolean(response.data?.google));
        }
      })
      .catch(() => {
        if (active) {
          setGoogleEnabled(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (isAuthenticated) {
    return <Navigate to={needsProfileCompletion(user) ? "/complete-profile" : "/"} replace />;
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
      await register({
        Name: form.Name.trim(),
        Email: form.Email.trim(),
        Address: form.Address.trim(),
        Password: form.Password,
        ConfirmPassword: form.ConfirmPassword,
        Role: form.Role,
        AdminPassword: form.Role === "Admin" ? form.AdminPassword.trim() : undefined,
      });
      navigate("/", { replace: true });
    } catch (reason) {
      setServerError(reason.message || "Registration failed");
    }
  }

  function updateField(field, value) {
    setForm((previous) => {
      if (field === "Role") {
        return {
          ...previous,
          Role: value,
          AdminPassword: value === "Admin" ? previous.AdminPassword : "",
        };
      }

      return { ...previous, [field]: value };
    });
  }

  return (
    <section className="py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg border-0 rounded-lg mt-5">
              <div className="card-body p-4">
                <h3 className="text-center mb-4">Create Account</h3>
                {serverError ? <div className="alert alert-danger">{serverError}</div> : null}
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="registerName" className="form-label">
                      Full Name
                    </label>
                    <input
                      id="registerName"
                      className={`form-control ${errors.Name ? "is-invalid" : ""}`}
                      value={form.Name}
                      onChange={(event) => updateField("Name", event.target.value)}
                    />
                    {errors.Name ? <div className="invalid-feedback">{errors.Name}</div> : null}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="registerEmail" className="form-label">
                      Email
                    </label>
                    <input
                      id="registerEmail"
                      type="email"
                      className={`form-control ${errors.Email ? "is-invalid" : ""}`}
                      value={form.Email}
                      onChange={(event) => updateField("Email", event.target.value)}
                    />
                    {errors.Email ? <div className="invalid-feedback">{errors.Email}</div> : null}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="registerAddress" className="form-label">
                      Address
                    </label>
                    <input
                      id="registerAddress"
                      className={`form-control ${errors.Address ? "is-invalid" : ""}`}
                      value={form.Address}
                      onChange={(event) => updateField("Address", event.target.value)}
                    />
                    {errors.Address ? <div className="invalid-feedback">{errors.Address}</div> : null}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="registerPassword" className="form-label">
                      Password
                    </label>
                    <input
                      id="registerPassword"
                      type="password"
                      className={`form-control ${errors.Password ? "is-invalid" : ""}`}
                      value={form.Password}
                      onChange={(event) => updateField("Password", event.target.value)}
                    />
                    {errors.Password ? <div className="invalid-feedback">{errors.Password}</div> : null}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      className={`form-control ${errors.ConfirmPassword ? "is-invalid" : ""}`}
                      value={form.ConfirmPassword}
                      onChange={(event) => updateField("ConfirmPassword", event.target.value)}
                    />
                    {errors.ConfirmPassword ? (
                      <div className="invalid-feedback">{errors.ConfirmPassword}</div>
                    ) : null}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="registerRole" className="form-label">
                      Role
                    </label>
                    <select
                      id="registerRole"
                      className="form-select"
                      value={form.Role}
                      onChange={(event) => updateField("Role", event.target.value)}
                    >
                      <option value="Customer">Customer</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  {form.Role === "Admin" ? (
                    <div className="mb-3">
                      <label htmlFor="adminPassword" className="form-label">
                        Admin Password
                      </label>
                      <input
                        id="adminPassword"
                        type="password"
                        required={form.Role === "Admin"}
                        className={`form-control ${errors.AdminPassword ? "is-invalid" : ""}`}
                        value={form.AdminPassword}
                        onChange={(event) => updateField("AdminPassword", event.target.value)}
                      />
                      {errors.AdminPassword ? (
                        <div className="invalid-feedback">{errors.AdminPassword}</div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="d-grid gap-2">
                    <button type="submit" className="btn btn-custom btn-lg" disabled={loading}>
                      {loading ? "Creating account..." : "Create Account"}
                    </button>
                    {googleEnabled ? (
                      <a className="btn btn-outline-dark btn-lg" href={authService.getGoogleLoginUrl()}>
                        Continue with Google
                      </a>
                    ) : null}
                  </div>
                </form>
              </div>
              <div className="card-footer text-center py-3">
                <div className="small">
                  <Link to="/login" className="text-decoration-none text-custom">
                    Have an account? Go to login
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
