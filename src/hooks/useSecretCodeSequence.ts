import { useState, useRef } from 'react';

interface UseSecretCodeSequenceOptions {
  sequence: number[];
  onMatch?: () => void;
}

interface UseSecretCodeSequenceReturn {
  isMatched: boolean;
  registerClick: (value: number) => void;
  reset: () => void;
}

/**
 * Custom hook to track a sequence of clicks using a fixed-length queue (FIFO).
 * The queue maintains the last N clicks and checks if they match the secret sequence.
 * 
 * @param options - Configuration object containing the secret sequence and optional callback
 * @returns Object containing matched state, click registration function, and reset function
 */
export const useSecretCodeSequence = ({
  sequence,
  onMatch,
}: UseSecretCodeSequenceOptions): UseSecretCodeSequenceReturn => {
  const [isMatched, setIsMatched] = useState(false);
  const bufferRef = useRef<number[]>([]);

  /**
   * Register a click value and check if it completes the secret sequence
   * @param value - The clicked option number (1-based)
   */
  const registerClick = (value: number) => {
    // Add new value to the end of the list
    const newList = [...bufferRef.current, value];
    
    // If list is longer than the sequence length, remove the first item (FIFO)
    if (newList.length > sequence.length) {
      newList.shift();
    }
    
    bufferRef.current = newList;
    
    // Check if we have the exact number of values and they match the sequence
    if (newList.length === sequence.length && JSON.stringify(newList) === JSON.stringify(sequence)) {
      setIsMatched(true);
      onMatch?.();
    }
  };

  /**
   * Reset the sequence tracking (e.g., when leaving the page or component)
   */
  const reset = () => {
    bufferRef.current = [];
    setIsMatched(false);
  };

  return {
    isMatched,
    registerClick,
    reset,
  };
};