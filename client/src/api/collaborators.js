import api from './axios';

export const inviteCollaborator = (projectId, data) =>
  api.post(`/projects/${projectId}/invite`, data);

export const respondToInvite = (projectId, accept) =>
  api.post(`/projects/${projectId}/invite/respond`, { accept });

export const proposeTerms = (projectId, data) =>
  api.post(`/projects/${projectId}/terms`, data);

export const respondToTerms = (projectId, accept) =>
  api.post(`/projects/${projectId}/terms/respond`, { accept });

export const leaveProject = (projectId) =>
  api.post(`/projects/${projectId}/leave`);

export const removeCollaborator = (projectId, targetUserId) =>
  api.post(`/projects/${projectId}/remove`, { targetUserId });

export const requestToJoin = (projectId, data) => 
  api.post(`/projects/${projectId}/request`, data);

export const respondToRequest = (projectId, data) => 
  api.post(`/projects/${projectId}/request/respond`, data);