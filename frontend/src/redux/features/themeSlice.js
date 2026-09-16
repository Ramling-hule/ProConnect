import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isDark: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.isDark = !state.isDark;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.isDark ? 'dark' : 'light');
      }
    },
    setTheme: (state, action) => {
      state.isDark = action.payload;
    }
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;