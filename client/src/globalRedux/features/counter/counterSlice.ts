import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CounterState {
    count: number;
    productQuantity: number;
}

const initialState: CounterState = {
    count: 0,
    productQuantity: 1,
};

export const counterSlice = createSlice({
    name: 'counter',
    initialState,
    reducers: {
        increment: (state, action: PayloadAction<keyof CounterState>) => {
            state[action.payload] += 1;
        },
        decrement: (state, action: PayloadAction<keyof CounterState>) => {
            state[action.payload] -= 1;
        },
        reset: (state) => {
            state.count = 0;
        },
        incrementByAmount: (state, action: PayloadAction<number>) => {
            state.count += action.payload;
        },
        decrementByAmount: (state, action: PayloadAction<number>) => {
            state.count -= action.payload;
        },
    },
});

export const { increment, decrement, reset, incrementByAmount, decrementByAmount } = counterSlice.actions;

export default counterSlice.reducer;