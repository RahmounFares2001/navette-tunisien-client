import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
    showAuthSection: boolean;
    showCardSection: boolean;
    showProfileSideBar: boolean;
    showAdminSideBar: boolean;
    showAdminEditStock: boolean;

}

const initialState: UiState = {
    showAuthSection: false,
    showCardSection: false,
    showProfileSideBar: false,
    showAdminSideBar: true,
    showAdminEditStock: false,
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setUi: (state, action: PayloadAction<{ key: keyof UiState; value: UiState[keyof UiState] }>) => {
            const { key, value } = action.payload;
            state[key] = value;
        },
    },
});
// dispatch(setUi({ key: 'showAuthSection', value: true }));


export const { setUi } = uiSlice.actions;

export default uiSlice.reducer;