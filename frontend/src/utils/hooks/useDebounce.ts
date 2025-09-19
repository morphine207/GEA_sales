import { useEffect, useRef } from "react";


//TODO: this needs update in clearning useEffect
export const useDebounce = (cb: () => void, delay: number) => {
    const callbackRef = useRef(cb);

    useEffect(() => {
        callbackRef.current = cb;
    }, [cb]);

    useEffect(() => {
        const handler = setTimeout(() => {
        callbackRef.current();
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [delay]);
};