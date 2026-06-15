import { call } from './client';

export interface ChatMessage {
  id: number;
  trip_instance_id: number;
  sender_id: number;
  sender_type: 'user' | 'driver';
  sender: {
    id: number;
    name: string;
    profile_image: string | null;
  };
  message: string;
  seen_at: string | null;
  created_at: string;
  is_mine: boolean;
}

export interface ChatListResponse {
  data: ChatMessage[];
  meta: { current_page: number; last_page: number; total: number; };
  success: boolean;
}

export function getTripMessages(tripInstanceId: number) {
  return call<ChatListResponse>(`chats/trip/${tripInstanceId}`);
}

export function sendMessage(tripInstanceId: number, message: string) {
  const body: Record<string, unknown> = { trip_instance_id: tripInstanceId, message };
  return call<{ data: ChatMessage } | ChatMessage>('chats/send', {
    method: 'POST',
    body,
  });
}
