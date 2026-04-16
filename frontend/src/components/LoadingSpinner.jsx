export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="spinner-page">
      <div className="text-center">
        <div className="spinner-border text-dark mb-3" role="status" />
        <p className="mb-0">{label}</p>
      </div>
    </div>
  );
}
