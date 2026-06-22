import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/userService";
import { needsProfileCompletion } from "@/utils/profileCompletion";

function validate(values) {
  const errors = {};

  if (values.Name.trim().length < 2) {
    errors.Name = "Name must be at least 2 characters";
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

  return errors;
}

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    Name: user?.Name || "",
    Address: user?.Address === "OAuth user" ? "" : user?.Address || "",
    Password: "",
    ConfirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!needsProfileCompletion(user)) {
    return <Navigate to="/" replace />;
  }

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setServerError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);

    try {
      await userService.updateUser(user.UserID, {
        Name: form.Name.trim(),
        Address: form.Address.trim(),
        Password: form.Password,
      });
      await refreshProfile();
      navigate("/", { replace: true });
    } catch (reason) {
      setServerError(reason.message || "Profile could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg border-0 rounded-lg mt-5">
              <div className="card-body p-4">
                <h3 className="text-center mb-4">Complete Your Account</h3>
                {serverError ? <div className="alert alert-danger">{serverError}</div> : null}
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="completeName" className="form-label">
                      Full Name
                    </label>
                    <input
                      id="completeName"
                      className={`form-control ${errors.Name ? "is-invalid" : ""}`}
                      value={form.Name}
                      onChange={(event) => updateField("Name", event.target.value)}
                    />
                    {errors.Name ? <div className="invalid-feedback">{errors.Name}</div> : null}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="completeAddress" className="form-label">
                      Address
                    </label>
                    <input
                      id="completeAddress"
                      className={`form-control ${errors.Address ? "is-invalid" : ""}`}
                      value={form.Address}
                      onChange={(event) => updateField("Address", event.target.value)}
                    />
                    {errors.Address ? <div className="invalid-feedback">{errors.Address}</div> : null}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="completePassword" className="form-label">
                      Password
                    </label>
                    <input
                      id="completePassword"
                      type="password"
                      className={`form-control ${errors.Password ? "is-invalid" : ""}`}
                      value={form.Password}
                      onChange={(event) => updateField("Password", event.target.value)}
                    />
                    {errors.Password ? <div className="invalid-feedback">{errors.Password}</div> : null}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="completeConfirmPassword" className="form-label">
                      Confirm Password
                    </label>
                    <input
                      id="completeConfirmPassword"
                      type="password"
                      className={`form-control ${errors.ConfirmPassword ? "is-invalid" : ""}`}
                      value={form.ConfirmPassword}
                      onChange={(event) => updateField("ConfirmPassword", event.target.value)}
                    />
                    {errors.ConfirmPassword ? (
                      <div className="invalid-feedback">{errors.ConfirmPassword}</div>
                    ) : null}
                  </div>
                  <div className="d-grid">
                    <button className="btn btn-custom btn-lg" type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save Account Details"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
