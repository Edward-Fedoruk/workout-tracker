import { type AppDispatch, type RootState } from '.';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Typed `useDispatch` bound to the app's `AppDispatch`.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/**
 * Typed `useSelector` bound to the app's `RootState`.
 */
export const useAppSelector = useSelector.withTypes<RootState>();
