export const getDifficultyBadgeClass = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "badge-success";
    case "medium":
      return "badge-warning";
    case "hard":
      return "badge-error";
    default:
      return "badge-ghost";
  }
};

export const getSessionParticipants = (session) => {
  const fromArray = Array.isArray(session?.participants) ? session.participants : [];
  const seen = new Set(fromArray.map((member) => member?._id || member));

  if (session?.participant) {
    const legacyId = session.participant?._id || session.participant;
    if (!seen.has(legacyId)) {
      return [...fromArray, session.participant];
    }
  }

  return fromArray;
};

export const getSessionMemberStats = (session) => {
  const participants = getSessionParticipants(session);
  const currentMembers = (session?.host ? 1 : 0) + participants.length;
  const maxMembers = session?.maxMembers || 2;

  return {
    currentMembers,
    maxMembers,
    isFull: currentMembers >= maxMembers,
  };
};
