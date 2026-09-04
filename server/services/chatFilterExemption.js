const Project = require('../models/Project');

// Group chats: exempt once their tied project is locked.
// Single (1:1) chats: never exempt — they aren't tied to one project, so
// there's no specific locked project to scope an exemption to.
const isFilteringExempt = async (chat) => {
  if (chat.type !== 'group' || !chat.projectId) return false;
  const project = await Project.findById(chat.projectId).select('status');
  return project?.status === 'locked';
};

module.exports = { isFilteringExempt };