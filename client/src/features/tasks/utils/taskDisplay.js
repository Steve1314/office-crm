const isIdentifier = (value) => /^[a-f\d]{24}$/i.test(String(value || '').trim());

const getName = (value) => {
  if (!value || typeof value !== 'object') return '';
  return value.name || value.fullName || '';
};

export const getTaskAssignerName = (task, users = []) => {
  const assignedBy = task?.assignedBy;
  const assignedById = assignedBy && typeof assignedBy === 'object'
    ? assignedBy._id || assignedBy.id
    : assignedBy;
  const populatedName = getName(assignedBy);
  if (populatedName) return populatedName;

  if (assignedById && isIdentifier(assignedById)) {
    const matchingUser = users.find(user =>
      String(user._id || user.id || '').toLowerCase() === String(assignedById).toLowerCase()
    );
    if (matchingUser?.name) return matchingUser.name;
  }

  const assignedByName = getName(task?.assignedByName) || task?.assignedByName;
  if (assignedByName && !isIdentifier(assignedByName)) return String(assignedByName);

  if (assignedBy && typeof assignedBy === 'string' && !isIdentifier(assignedBy)) {
    return assignedBy;
  }

  return 'Unknown user';
};
