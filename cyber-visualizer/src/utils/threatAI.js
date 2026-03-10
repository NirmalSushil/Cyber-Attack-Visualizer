export function predictThreat(ipReputation, trafficVolume, loginAttempts) {

  const score =
    (ipReputation * 0.4) +
    (trafficVolume * 0.3) +
    (loginAttempts * 0.3);

  if (score > 0.7) {
    return "Critical";
  }

  if (score > 0.4) {
    return "High";
  }

  return "Low";
}
