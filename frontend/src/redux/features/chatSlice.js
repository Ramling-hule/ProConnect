import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  activeChatUser: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    openChat: (state, action) => {
      state.isOpen = true;
      state.activeChatUser = action.payload;
    },
    closeChat: (state) => {
      state.isOpen = false;
      state.activeChatUser = null;
    }
  },
});

export const { openChat, closeChat } = chatSlice.actions;
export default chatSlice.reducer;