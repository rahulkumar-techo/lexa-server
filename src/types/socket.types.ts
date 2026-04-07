export type JoinChatPayload = {
  chatId: string;
};

export type SendMessagePayload = {
  chatId: string;
  message: string;
  scenario?: string;
};

export type TypingPayload = {
  chatId: string;
};

export type SocketMessage =
  | { type: "JOIN_CHAT"; payload: JoinChatPayload }
  | { type: "SEND_MESSAGE"; payload: SendMessagePayload }
  | { type: "TYPING"; payload: TypingPayload };
