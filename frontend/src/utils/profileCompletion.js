export function needsProfileCompletion(user) {
  return Boolean(user && (!user.Address || user.Address === "OAuth user"));
}
