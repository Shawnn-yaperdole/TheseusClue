const Project = require('../models/Project');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @route POST /api/projects
const createProject = asyncHandler(async (req, res) => {
  const { title, description, budget, schedule, venue } = req.body;

  if (!title) {
    throw new AppError('Title is required', 400);
  }

  const project = await Project.create({
    ownerId: req.user.id,
    title,
    description,
    budget,
    schedule,
    venue,
    status: 'draft'
  });

  res.status(201).json(project);
});

// @route GET /api/projects
const getMyProjects = asyncHandler(async (req, res) => {
  const { search, status, sort } = req.query;

  const filter = {
    $or: [
      { ownerId: req.user.id },
      { 'collaborators.userId': req.user.id }
    ]
  };

  if (search) {
    filter.title = { $regex: search, $options: 'i' };
  }

  if (status) {
    filter.status = status;
  }

  let sortOption = { updatedAt: -1 };
  if (sort === 'oldest') sortOption = { updatedAt: 1 };
  if (sort === 'recent') sortOption = { updatedAt: -1 };

  const projects = await Project.find(filter).sort(sortOption);

  res.json(projects);
});

// @route GET /api/projects/:id
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('ownerId', 'name email')
    .populate('collaborators.userId', 'name email');

  if (!project) throw new AppError('Project not found', 404);

  const isOwner = project.ownerId._id.equals(req.user.id);
  const isCollaborator = project.collaborators.some((c) => c.userId._id.equals(req.user.id));

  if (!isOwner && !isCollaborator) {
    throw new AppError('Forbidden', 403);
  }

  res.json(project);
});

// @route POST /api/projects/:id/favorite
const toggleFavorite = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('Project not found', 404);

  const isOwner = project.ownerId.equals(req.user.id);
  const isCollaborator = project.collaborators.some((c) => c.userId.equals(req.user.id) && c.inviteStatus === 'accepted');
  if (!isOwner && !isCollaborator) throw new AppError('Forbidden', 403);

  const alreadyFavorited = project.favoritedBy.some((u) => u.equals(req.user.id));

  if (alreadyFavorited) {
    project.favoritedBy = project.favoritedBy.filter((u) => !u.equals(req.user.id));
  } else {
    project.favoritedBy.push(req.user.id);
  }

  await project.save();
  res.json({ favorited: !alreadyFavorited });
});

// @route PUT /api/projects/:id
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('Project not found', 404);

  if (!project.ownerId.equals(req.user.id)) {
    throw new AppError('Only the owner can edit this project', 403);
  }

  if (['locked', 'in_progress', 'completed'].includes(project.status)) {
    throw new AppError('Cannot edit a locked or completed project', 400);
  }

  const { title, description, budget, schedule, venue } = req.body;
  if (title !== undefined) project.title = title;
  if (description !== undefined) project.description = description;
  if (budget !== undefined) project.budget = budget;
  if (schedule !== undefined) project.schedule = schedule;
  if (venue !== undefined) project.venue = venue;

  await project.save();
  res.json(project);
});

// @route DELETE /api/projects/:id
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('Project not found', 404);

  if (!project.ownerId.equals(req.user.id)) {
    throw new AppError('Only the owner can delete this project', 403);
  }

  if (['locked', 'in_progress'].includes(project.status)) {
    throw new AppError('Cannot delete a locked or in-progress project', 400);
  }

  await project.deleteOne();
  res.json({ message: 'Project deleted' });
});

module.exports = {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  toggleFavorite
};