'use server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canAccessClient } from '@/lib/access';
import { canApprove, isClient } from '@/lib/permissions';
import { notifyClientUsers, notifyAgency } from '@/lib/notify';
import { appBaseUrl } from '@/lib/appUrl';
import { revalidatePath } from 'next/cache';

function appLink(path) {
  return appBaseUrl() + path;
}

async function loadAccessiblePost(user, postId) {
  if (!user || !postId) return null;
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, clientId: true, title: true } });
  if (!post) return null;
  if (!(await canAccessClient(user, post.clientId))) return null;
  return post;
}

export async function addComment(formData) {
  const user = await getCurrentUser();
  const postId = String(formData.get('postId') || '');
  const post = await loadAccessiblePost(user, postId);
  if (!post) return;
  const body = String(formData.get('body') || '').trim();
  if (!body) return;
  await prisma.comment.create({ data: { postId: post.id, authorId: user.id, body } });

  try {
    const payload = {
      type: 'comment',
      titleEn: `<b>${user.fullName}</b> commented on <b>${post.title}</b>`,
      titleAr: `<b>${user.fullName}</b> علّق على <b>${post.title}</b>`,
      link: appLink(`/posts/${post.id}`),
    };
    if (isClient(user.role)) await notifyAgency(user.workspaceId, user.id, payload);
    else await notifyClientUsers(post.clientId, user.id, payload);
  } catch (e) { console.error('notify(comment) failed:', e.message); }

  revalidatePath(`/posts/${post.id}`);
}

export async function setStatus(formData) {
  const user = await getCurrentUser();
  const postId = String(formData.get('postId') || '');
  const post = await loadAccessiblePost(user, postId);
  if (!post) return;
  if (!canApprove(user.role)) return;
  const status = String(formData.get('status') || '');
  if (!['approved', 'revision'].includes(status)) return;
  await prisma.post.update({ where: { id: post.id }, data: { status } });

  try {
    const isApproved = status === 'approved';
    const payload = {
      type: isApproved ? 'approval' : 'revision',
      titleEn: isApproved
        ? `<b>${user.fullName}</b> approved <b>${post.title}</b>`
        : `<b>${user.fullName}</b> requested a revision on <b>${post.title}</b>`,
      titleAr: isApproved
        ? `<b>${user.fullName}</b> اعتمد <b>${post.title}</b>`
        : `<b>${user.fullName}</b> طلب تعديلاً على <b>${post.title}</b>`,
      link: appLink(`/posts/${post.id}`),
    };
    // a client approving/revising → tell the agency; an agency member → tell the client
    if (isClient(user.role)) await notifyAgency(user.workspaceId, user.id, payload);
    else await notifyClientUsers(post.clientId, user.id, payload);
  } catch (e) { console.error('notify(status) failed:', e.message); }

  revalidatePath(`/posts/${post.id}`);
  revalidatePath('/');
}
