import { configureStore } from "@reduxjs/toolkit";


// reducers
import counterReducer from "./features/counter/counterSlice";
import uiReducer from "./features/ui/uiSlice";

// RTK Query API Slice
import { apiSlice } from "./features/api/apiSlice";

export const store = configureStore({
    reducer: {
        counter: counterReducer,
        ui: uiReducer,
        [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware().concat(apiSlice.middleware)
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
