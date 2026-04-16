export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <h2 className="h4 mb-2">{title}</h2>
      {description ? <p className="mb-3">{description}</p> : null}
      {action}
    </div>
  );
}
