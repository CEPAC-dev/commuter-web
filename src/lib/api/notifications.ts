import { call, ApiError } from './client';
import type { NotificationPaginatedResponse, UnreadCountResponse } from '@/types/user';

/**
 * Get paginated list of notifications
 */
export async function getNotifications(page: number = 1): Promise<NotificationPaginatedResponse> {
  try {
    const response = await call(`notifications?page=${page}`);
    return response as NotificationPaginatedResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to fetch notifications');
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const response = await call('notifications/unread-count');
    const data = response as UnreadCountResponse;
    return data.count;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to fetch unread count');
  }
}

/**
 * Mark a specific notification as read
 */
export async function markNotificationRead(notificationId: string | number): Promise<void> {
  try {
    await call(`notifications/${notificationId}/read`, { method: 'POST' });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<void> {
  try {
    await call('notifications/read-all', { method: 'POST' });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to mark all notifications as read');
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string | number): Promise<void> {
  try {
    await call(`notifications/${notificationId}`, { method: 'DELETE' });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to delete notification');
  }
}
