import { createSlice } from '@reduxjs/toolkit';
import storageService from '../../services/storageService';

const initialState = {
  user: storageService.getPersistedUser(),
  token: storageService.getPersistedToken(),
  isLoading: false,
  error: null,
  success: false,
  mfaRequired: false,
  tempMfaToken: null,
  tempUserId: null,
  isAuthModalOpen: false,
  authModalMessage: "",
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = false;
    },
    authSuccess: (state, action) => {
      state.isLoading = false;
      state.success = true;
      state.error = null;

      if (action.payload.mfaRequired) {
        state.mfaRequired = true;
        state.tempMfaToken = action.payload.tempToken;
        state.tempUserId = action.payload.userId;
        return;
      }

      state.mfaRequired = false;
      state.tempMfaToken = null;
      state.tempUserId = null;
      const { accessToken, user: apiUser } = action.payload;
      const { _id, name, username, email, institute, profilePicture, role } = apiUser || {};
      const userData = {
        _id: _id,
        id: _id,
        name: name,
        username: username,
        email: email,
        token: accessToken,
        institute: institute,
        profilePicture: profilePicture || '',
        role: role || 'student',
      };
      state.user = userData;
      state.token = accessToken;
      storageService.persistAuth(userData, accessToken);
    },
    authFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.success = false;
      state.error = null;
      state.mfaRequired = false;
      state.tempMfaToken = null;
      state.tempUserId = null;

      storageService.clearAuth();
    },
    resetAuthStatus: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = false;
    },
    openAuthModal: (state, action) => {
      state.isAuthModalOpen = true;
      state.authModalMessage = action.payload || "Please sign in to continue.";
    },
    closeAuthModal: (state) => {
      state.isAuthModalOpen = false;
    }
  },
});

export const { authStart, authSuccess, authFailure, logout, resetAuthStatus, openAuthModal, closeAuthModal } = authSlice.actions;
export default authSlice.reducer;
