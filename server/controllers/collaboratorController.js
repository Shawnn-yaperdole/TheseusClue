const Project = require('../models/Project');
const Chat = require('../models/Chat');
const { emitSystemMessage } = require('../sockets/chatSocket');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { notify } = require('../services/notificationService');
const env = require('../config/env');

let ioInstance = null;
const setIo = (io) => { ioInstance = io; };

// Moves a project from 'pending_approval'/'building' to 'pending_payment'
// once every active collaborator has accepted terms. Actual locking now
// happens only after the owner completes payment (see payForProject).
const checkReadyForPayment = async (project) => {
  const activeCollaborators = project.collaborators.filter((c) => c.inviteStatus === 'accepted');
  if (activeCollaborators.length === 0) return false;

  const allTermsAccepted = activeCollaborators.every((c) => c.termsStatus === 'accepted');

  if (allTermsAccepted && !['pending_payment', 'locked'].includes(project.status)) {
    project.status = 'pending_payment';
    project.payment = {
      status: 'unpaid',
      amount: env.PLATFORM_LOCK_FEE,
      cardLast4: '',
      paidAt: null
    };
    await project.save();

    if (project.groupChatId && ioInstance) {
      await emitSystemMessage(
        ioInstance,
        project.groupChatId,
        project.ownerId,
        'All parties have accepted the terms. Awaiting payment from the event planner to finalize and lock this event.',
        'payment_required'
      );
    }

    if (ioInstance) {
      await notify(ioInstance, project.ownerId, {
        type: 'payment_required',
        message: `All parties have accepted the terms for "${project.title}". Pay the platform fee to finalize and lock the event.`,
        link: `/events/${project._id}`,
        projectId: project._id
      });
    }
    return true;
  }
  return false;
};

// @route POST /api/projects/:id/invite
const inviteCollaborator = asyncHandler(async (req, res) => {
  const { targetUserId, vendorCategory, chatId } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) throw new AppError('Project not found', 404);
  if (!project.ownerId.equals(req.user.id)) {
    throw new AppError('Only the owner can invite collaborators', 403);
  }
  if (['pending_payment', 'locked', 'in_progress', 'completed'].includes(project.status)) {
    throw new AppError('Cannot invite to a project that is pending payment, locked or completed project', 400);
  }

  let collaborator = project.collaborators.find((c) => c.userId.equals(targetUserId));

  if (collaborator) {
    if (collaborator.inviteStatus === 'accepted') {
      throw new AppError('This vendor is already part of the project', 409);
    }
    collaborator.inviteStatus = 'pending';
    collaborator.termsStatus = 'not_submitted';
    collaborator.proposedTerms = {};
    collaborator.chatId = chatId || collaborator.chatId;
    collaborator.history.push({ event: 're-invited' });
  } else {
    project.collaborators.push({
      userId: targetUserId,
      vendorCategory,
      inviteStatus: 'pending',
      termsStatus: 'not_submitted',
      chatId: chatId || null,
      history: [{ event: 'invited' }]
    });
  }

  project.status = 'pending_approval';
  await project.save();

  if (chatId && ioInstance) {
    await emitSystemMessage(
      ioInstance,
      chatId,
      req.user.id,
      `You've been invited to collaborate on the project "${project.title}" as ${vendorCategory}.`,
      'invite_sent'
    );
  }

  if (ioInstance) {
    await notify(ioInstance, targetUserId, {
      type: 'invite_received',
      message: `You've been invited to "${project.title}" as ${vendorCategory}.`,
      link: `/events/${project._id}`,
      projectId: project._id
    });
  }

  res.status(200).json(project);
});

// @route POST /api/projects/:id/invite/respond
const respondToInvite = asyncHandler(async (req, res) => {
  const { accept } = req.body;
  const project = await Project.findById(req.params.id);
  
  if (!project) throw new AppError('Project not found', 404);
  
  const collaborator = project.collaborators.find((c) => c.userId.equals(req.user.id));
  if (!collaborator) throw new AppError('You were not invited to this project', 404);
  if (collaborator.inviteStatus !== 'pending') {
    throw new AppError('This invite is no longer pending', 400);
  }
  
  if (accept) {
    collaborator.inviteStatus = 'accepted';
    collaborator.termsStatus = 'pending';
    collaborator.history.push({ event: 'accepted' });
    
    let groupChat;
    if (project.groupChatId) {
      groupChat = await Chat.findById(project.groupChatId);
      if (groupChat && !groupChat.participants.some((p) => p.equals(req.user.id))) {
        groupChat.participants.push(req.user.id);
        await groupChat.save();
      }
    
    } else {
      groupChat = await Chat.create({
        type: 'group',
        projectId: project._id,
        participants: [project.ownerId, req.user.id],
        messages: []
      });
      project.groupChatId = groupChat._id;
    }
    
    if (ioInstance) {
      await emitSystemMessage(
        ioInstance,
        groupChat._id,
        req.user.id,
        `${req.user.name || 'A collaborator'} has joined the project.`,
        'invite_accepted'
      );
    }
    
    if (collaborator.chatId && ioInstance) {
      await emitSystemMessage(
        ioInstance,
        collaborator.chatId,
        req.user.id,
        'Invite accepted! A group chat has been created for this project.',
        'invite_accepted'
      );
    }

    if (ioInstance) {
      await notify(ioInstance, project.ownerId, {
        type: 'invite_accepted',
        message: `${req.user.name} accepted your invite for "${project.title}".`,
        link: `/events/${project._id}`,
        projectId: project._id
      });
    }
  
  } else {
    collaborator.inviteStatus = 'declined';
    collaborator.history.push({ event: 'declined' });
    
    if (collaborator.chatId && ioInstance) {
      await emitSystemMessage(
        ioInstance,
        collaborator.chatId,
        req.user.id,
        'Invite declined.',
        'invite_declined'
      );
    }

    if (ioInstance) {
      await notify(ioInstance, project.ownerId, {
        type: 'invite_declined',
        message: `${req.user.name} declined your invite for "${project.title}".`,
        link: `/events/${project._id}`,
        projectId: project._id
      });
    }
  }
  
  await project.save();
  res.json(project);
});

// @route POST /api/projects/:id/terms
const proposeTerms = asyncHandler(async (req, res) => {
  const { targetUserId, price, deliverables, dateConfirmed, notes } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) throw new AppError('Project not found', 404);
  if (!project.ownerId.equals(req.user.id)) {
    throw new AppError('Only the owner can propose terms', 403);
  }
  if (['pending_payment', 'locked', 'in_progress', 'completed'].includes(project.status)) {
    throw new AppError('Cannot modify terms once the project has moved to payment or beyond', 400);
  }

  const collaborator = project.collaborators.find((c) => c.userId.equals(targetUserId));
  if (!collaborator || collaborator.inviteStatus !== 'accepted') {
    throw new AppError('Collaborator not found or not yet accepted', 404);
  }

  collaborator.proposedTerms = { price, deliverables, dateConfirmed, notes };
  collaborator.termsStatus = 'pending';
  collaborator.history.push({ event: 'terms_proposed' });

  await project.save();

  const targetChat = project.groupChatId || collaborator.chatId;
  if (targetChat && ioInstance) {
    await emitSystemMessage(
      ioInstance,
      targetChat,
      req.user.id,
      'New terms have been proposed. Please review and respond.',
      'terms_proposed'
    );
  }

  if (ioInstance) {
    await notify(ioInstance, targetUserId, {
      type: 'terms_proposed',
      message: `New terms proposed for "${project.title}". Please review.`,
      link: `/events/${project._id}`,
      projectId: project._id
    });
  }

  res.json(project);
});

// @route POST /api/projects/:id/terms/respond
const respondToTerms = asyncHandler(async (req, res) => {
  const { accept } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) throw new AppError('Project not found', 404);

  const collaborator = project.collaborators.find((c) => c.userId.equals(req.user.id));
  if (!collaborator || collaborator.termsStatus !== 'pending') {
    throw new AppError('No pending terms to respond to', 400);
  }

  collaborator.termsStatus = accept ? 'accepted' : 'rejected';
  collaborator.history.push({ event: accept ? 'terms_accepted' : 'terms_rejected' });
  await project.save();

  if (project.groupChatId && ioInstance) {
    await emitSystemMessage(
      ioInstance,
      project.groupChatId,
      req.user.id,
      accept
        ? `${req.user.name || 'A collaborator'} accepted the proposed terms.`
        : `${req.user.name || 'A collaborator'} rejected the proposed terms.`,
      accept ? 'terms_accepted' : null
    );
  }

  const readyForPayment = await checkReadyForPayment(project);

  if (ioInstance) {
    await notify(ioInstance, project.ownerId, {
      type: accept ? 'terms_accepted' : 'terms_rejected',
      message: accept
        ? `${req.user.name} accepted the terms for "${project.title}".`
        : `${req.user.name} rejected the terms for "${project.title}".`,
      link: `/events/${project._id}`,
      projectId: project._id
    });
  }

  res.json({ project, readyForPayment });
});

// @route POST /api/projects/:id/leave
const leaveProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('Project not found', 404);
  if (['locked', 'in_progress', 'completed'].includes(project.status)) {
    throw new AppError('Cannot leave a locked, in-progress, or completed project', 400);
  }

  const collaborator = project.collaborators.find((c) => c.userId.equals(req.user.id));
  if (!collaborator || collaborator.inviteStatus !== 'accepted') {
    throw new AppError('You are not an active collaborator on this project', 404);
  }

  await removeCollaboratorInternal(project, collaborator, req.user.id, 'left');
  res.json(project);
});

// @route POST /api/projects/:id/remove
const removeCollaborator = asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('Project not found', 404);
  if (!project.ownerId.equals(req.user.id)) {
    throw new AppError('Only the owner can remove collaborators', 403);
  }
  if (['locked', 'in_progress', 'completed'].includes(project.status)) {
    throw new AppError('Cannot remove collaborators from a locked, in-progress, or completed project', 400);
  }

  const collaborator = project.collaborators.find((c) => c.userId.equals(targetUserId));
  if (!collaborator || collaborator.inviteStatus !== 'accepted') {
    throw new AppError('Collaborator not found or not active', 404);
  }

  await removeCollaboratorInternal(project, collaborator, req.user.id, 'removed');
  res.json(project);
});

// @route POST /api/projects/:id/request
// @access vendor — initiates a request to join an open project
const requestToJoin = asyncHandler(async (req, res) => {
  const { vendorCategory, chatId } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) throw new AppError('Project not found', 404);
  if (!project.openToRequests) throw new AppError('This project is not open to requests', 400);
  if (['pending_payment', 'locked', 'in_progress', 'completed', 'cancelled'].includes(project.status)) {
    throw new AppError('This project is no longer accepting requests', 400);
  }
  if (project.ownerId.equals(req.user.id)) {
    throw new AppError("You can't request to join your own project", 400);
  }

  let collaborator = project.collaborators.find((c) => c.userId.equals(req.user.id));

  if (collaborator && ['requested', 'pending', 'accepted'].includes(collaborator.inviteStatus)) {
    throw new AppError('You already have an active request or invite on this project', 409);
  }

  if (collaborator) {
    collaborator.inviteStatus = 'requested';
    collaborator.termsStatus = 'not_submitted';
    collaborator.proposedTerms = {};
    collaborator.chatId = chatId || collaborator.chatId;
    collaborator.history.push({ event: 'requested' });
  } else {
    project.collaborators.push({
      userId: req.user.id,
      vendorCategory,
      inviteStatus: 'requested',
      termsStatus: 'not_submitted',
      chatId: chatId || null,
      history: [{ event: 'requested' }]
    });
  }

  await project.save();

  if (chatId && ioInstance) {
    await emitSystemMessage(
      ioInstance,
      chatId,
      req.user.id,
      `${req.user.name} has requested to join "${project.title}" as ${vendorCategory}.`,
      'invite_sent'
    );
  }

  if (ioInstance) {
    await notify(ioInstance, project.ownerId, {
      type: 'request_received',
      message: `${req.user.name} requested to join "${project.title}" as ${vendorCategory}.`,
      link: `/events/${project._id}`,
      projectId: project._id
    });
  }

  res.status(200).json(project);
});

// @route POST /api/projects/:id/request/respond
// @access owner — approves or declines a vendor-initiated request
const respondToRequest = asyncHandler(async (req, res) => {
  const { targetUserId, accept } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) throw new AppError('Project not found', 404);
  if (!project.ownerId.equals(req.user.id)) {
    throw new AppError('Only the owner can respond to requests', 403);
  }

  const collaborator = project.collaborators.find((c) => c.userId.equals(targetUserId));
  if (!collaborator || collaborator.inviteStatus !== 'requested') {
    throw new AppError('No pending request found for this vendor', 404);
  }

  if (accept) {
    collaborator.inviteStatus = 'accepted';
    collaborator.termsStatus = 'pending';
    collaborator.history.push({ event: 'accepted' });

    if (project.status === 'draft' || project.status === 'building') {
      project.status = 'pending_approval';
    }

    let groupChat;
    if (project.groupChatId) {
      groupChat = await Chat.findById(project.groupChatId);
      if (groupChat && !groupChat.participants.some((p) => p.equals(targetUserId))) {
        groupChat.participants.push(targetUserId);
        await groupChat.save();
      }
    } else {
      groupChat = await Chat.create({
        type: 'group',
        projectId: project._id,
        participants: [project.ownerId, targetUserId],
        messages: []
      });
      project.groupChatId = groupChat._id;
    }

    if (ioInstance) {
      await emitSystemMessage(
        ioInstance,
        groupChat._id,
        req.user.id,
        `${collaborator.vendorCategory} request approved — welcome to the project.`,
        'invite_accepted'
      );
      await notify(ioInstance, targetUserId, {
        type: 'request_approved',
        message: `Your request to join "${project.title}" was approved.`,
        link: `/events/${project._id}`,
        projectId: project._id
      });
    }
  } else {
    collaborator.inviteStatus = 'declined';
    collaborator.history.push({ event: 'declined' });

    if (ioInstance) {
      if (collaborator.chatId) {
        await emitSystemMessage(
          ioInstance,
          collaborator.chatId,
          req.user.id,
          'Your request to join this project was declined.',
          'invite_declined'
        );
      }
      await notify(ioInstance, targetUserId, {
        type: 'request_declined',
        message: `Your request to join "${project.title}" was declined.`,
        link: `/events/${project._id}`,
        projectId: project._id
      });
    }
  }

  await project.save();
  res.json(project);
});

// Shared logic for leave + remove — plain helper, not a route, so no asyncHandler needed;
// errors thrown here propagate up to whichever asyncHandler-wrapped route called it.
const removeCollaboratorInternal = async (project, collaborator, actingUserId, eventType) => {
  collaborator.inviteStatus = eventType;
  collaborator.termsStatus = 'rejected';
  collaborator.history.push({ event: eventType });

  if (project.groupChatId) {
    const groupChat = await Chat.findById(project.groupChatId);

    if (groupChat) {
      groupChat.participants = groupChat.participants.filter((p) => !p.equals(collaborator.userId));

      const remainingVendors = project.collaborators.filter(
        (c) => c.inviteStatus === 'accepted' && !c.userId.equals(collaborator.userId)
      );

      if (remainingVendors.length === 0) {
        await Chat.findByIdAndDelete(project.groupChatId);
        project.groupChatId = null;
      } else {
        await groupChat.save();
        if (ioInstance) {
          await emitSystemMessage(
            ioInstance,
            groupChat._id,
            actingUserId,
            eventType === 'left' ? 'A collaborator has left the project.' : 'A collaborator was removed from the project.',
            eventType === 'left' ? 'member_left' : 'member_removed'
          );
        }
      }
    }
  }

  const hasActiveCollaborators = project.collaborators.some((c) => c.inviteStatus === 'accepted');
  if (!hasActiveCollaborators && project.status !== 'draft') {
    project.status = 'building';
  }

  await project.save();

  if (ioInstance) {
    if (eventType === 'left') {
      await notify(ioInstance, project.ownerId, {
        type: 'collaborator_left',
        message: `A collaborator has left "${project.title}".`,
        link: `/events/${project._id}`,
        projectId: project._id
      });
    } else {
      await notify(ioInstance, collaborator.userId, {
        type: 'collaborator_removed',
        message: `You were removed from "${project.title}".`,
        link: `/events/${project._id}`,
        projectId: project._id
      });
    }
  }
};

// @route POST /api/projects/:id/pay
// @access owner only, only while status === 'pending_payment'
//
// PLACEHOLDER PAYMENT FLOW. No real payment processor is connected.
// Card fields are validated for shape only and are NEVER persisted —
// only a non-sensitive last4 + amount + timestamp are stored, mirroring
// how a real gateway (e.g. Stripe) hands back a token instead of raw
// card data. Do not treat this as PCI-compliant; replace before going live.
const payForProject = asyncHandler(async (req, res) => {
  const { cardNumber, expiry, cvc, nameOnCard } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) throw new AppError('Project not found', 404);
  if (!project.ownerId.equals(req.user.id)) {
    throw new AppError('Only the event owner can complete payment', 403);
  }
  if (project.status !== 'pending_payment') {
    throw new AppError('This project is not awaiting payment', 400);
  }

  const cleanedCard = (cardNumber || '').replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(cleanedCard)) throw new AppError('Invalid card number', 400);
  if (!/^\d{2}\/\d{2}$/.test(expiry || '')) throw new AppError('Invalid expiry date', 400);
  if (!/^\d{3,4}$/.test(cvc || '')) throw new AppError('Invalid security code', 400);
  if (!nameOnCard || !nameOnCard.trim()) throw new AppError('Name on card is required', 400);

  // Simulated processing — always succeeds for now.
  project.payment = {
    status: 'paid',
    amount: project.payment?.amount || env.PLATFORM_LOCK_FEE,
    cardLast4: cleanedCard.slice(-4),
    paidAt: new Date()
  };
  project.status = 'locked';
  await project.save();

  if (project.groupChatId && ioInstance) {
    await emitSystemMessage(
      ioInstance,
      project.groupChatId,
      project.ownerId,
      'Payment received. The event plan is now locked in, and contact details have been shared between all parties.',
      'project_locked'
    );
  }

  if (ioInstance) {
    const recipientIds = [
      project.ownerId,
      ...project.collaborators.filter((c) => c.inviteStatus === 'accepted').map((c) => c.userId)
    ];
    for (const recipientId of recipientIds) {
      await notify(ioInstance, recipientId, {
        type: 'project_locked',
        message: `"${project.title}" is now locked in — contact details are now visible to everyone involved.`,
        link: `/events/${project._id}`,
        projectId: project._id
      });
    }
  }

  res.json(project);
});

module.exports = {
  setIo,
  inviteCollaborator,
  respondToInvite,
  proposeTerms,
  respondToTerms,
  leaveProject,
  removeCollaborator,
  requestToJoin,
  respondToRequest,
  payForProject
};