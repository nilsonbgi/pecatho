export function isTimestampInFuture(value: string | null | undefined) {
  return Boolean(value && new Date(value).getTime() > Date.now());
}

export function isTimestampCurrentOrFuture(value: string | null | undefined) {
  return Boolean(value && new Date(value).getTime() >= Date.now());
}

export function isTimestampPastOrCurrent(value: string | null | undefined) {
  return Boolean(value && new Date(value).getTime() <= Date.now());
}

export function isFollowupDue(updatedAt: string | null | undefined, createdAt: string) {
  return Date.now() - new Date(updatedAt || createdAt).getTime() >= 48 * 60 * 60 * 1000;
}
