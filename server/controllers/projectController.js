const Project = require('../models/Project');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const VendorProfile = require('../models/VendorProfile');
const { getEmbedding } = require('../services/embeddingService');
const { getCategoryLabel } = require('../constants/vendorCategories');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @route POST /api/projects
const createProject = asyncHandler(async (req, res) => {
  const { title, description, budget, schedule } = req.body;

  if (!title) {
    throw new AppError('Title is required', 400);
  }

  const project = await Project.create({
    ownerId: req.user.id,
    title,
    description,
    budget,
    schedule,
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
    filter.title = { $regex: escapeRegex(search), $options: 'i' };
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

  const { title, description, budget, schedule, requiredVendors } = req.body;
  if (title !== undefined) project.title = title;
  if (description !== undefined) project.description = description;
  if (budget !== undefined) project.budget = budget;
  if (schedule !== undefined) project.schedule = schedule;
  if (requiredVendors !== undefined) project.requiredVendors = requiredVendors;

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

  if (['locked', 'in_progress', 'completed'].includes(project.status)) {
    throw new AppError('Cannot delete a locked, in-progress, or completed project', 400);
  }

  await project.deleteOne();
  res.json({ message: 'Project deleted' });
});

// @route POST /api/projects/:id/toggle-open
const toggleOpenToRequests = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('Project not found', 404);
  if (!project.ownerId.equals(req.user.id)) {
    throw new AppError('Only the owner can change this setting', 403);
  }
  if (['locked', 'in_progress', 'completed', 'cancelled'].includes(project.status)) {
    throw new AppError('Cannot change request settings on a locked or closed project', 400);
  }

  project.openToRequests = !project.openToRequests;
  await project.save();

  res.json({ openToRequests: project.openToRequests });
});

// @route GET /api/projects/open/browse
// Vendor-facing browse list: projects open to requests, not owned by this user,
// not yet locked/closed.
const getOpenProjects = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const filter = {
    openToRequests: true,
    ownerId: { $ne: req.user.id },
    status: { $nin: ['locked', 'in_progress', 'completed', 'cancelled'] }
  };

  if (search) {
    filter.title = { $regex: escapeRegex(search), $options: 'i' };
  }

  const projects = await Project.find(filter)
    .populate('ownerId', 'name organizationName')
    .sort({ updatedAt: -1 });

  const shaped = projects.map((p) => {
    const myEntry = p.collaborators.find((c) => c.userId.equals(req.user.id));
    return {
      _id: p._id,
      title: p.title,
      description: p.description,
      budget: p.budget,
      status: p.status,
      requiredVendors: p.requiredVendors,
      owner: {
        id: p.ownerId._id,
        name: p.ownerId.organizationName || p.ownerId.name
      },
      myStatus: myEntry ? myEntry.inviteStatus : null
    };
  });

  res.json(shaped);
});

// @route GET /api/projects/:id/recommendations
const getRecommendations = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('Project not found', 404);
  if (!project.ownerId.equals(req.user.id)) throw new AppError('Forbidden', 403);

  const alreadyInvolvedIds = project.collaborators
    .filter((c) => ['pending', 'requested', 'accepted'].includes(c.inviteStatus))
    .map((c) => c.userId.toString());

  const slots = [];

  for (let i = 0; i < project.requiredVendors.length; i++) {
    const slot = project.requiredVendors[i];
    if (slot.fulfilled) continue;

    // Semantic matching doesn't make sense for freeform "Other" categories —
    // every "Other" vendor could be doing something completely different.
    if (slot.category === 'other') {
      slots.push({ slotIndex: i, category: slot.category, customLabel: slot.customLabel, vendors: [], unsupported: true });
      continue;
    }

    const categoryLabel = getCategoryLabel(slot.category);
    const queryText = [
      `Event: ${project.title}`,
      project.description,
      `Looking for a ${categoryLabel} vendor for this event.`
    ].filter(Boolean).join('. ');

    let vendors = [];
    try {
      const queryVector = await getEmbedding(queryText, 'query');

      const matches = await VendorProfile.aggregate([
        {
          $vectorSearch: {
            index: 'vendor_vector_index',
            path: 'embedding',
            queryVector,
            numCandidates: 50,
            limit: 10,
            filter: { category: slot.category }
          }
        },
        {
          $project: {
            userId: 1,
            category: 1,
            businessName: 1,
            description: 1,
            location: 1,
            pricing: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]);

      const filtered = matches.filter((m) => !alreadyInvolvedIds.includes(m.userId.toString())).slice(0, 3);
      vendors = await VendorProfile.populate(filtered, { path: 'userId', select: 'name' });
    } catch (err) {
      console.error(`Recommendation error for slot ${i} (${slot.category}):`, err.message);
    }

    slots.push({ slotIndex: i, category: slot.category, customLabel: slot.customLabel, vendors });
  }

  res.json({ slots });
});

module.exports = {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  toggleFavorite,
  toggleOpenToRequests,
  getOpenProjects,
  getRecommendations
};