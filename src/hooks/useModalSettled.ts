import { useEffect, useState } from 'react';
import { Dimensions, type LayoutChangeEvent } from 'react-native';

// Only a modal that never grows waits this long; on a phone the growth takes about a frame.
const settleTimeoutMs = 3000;

// Android lays a modal out at the window's height, then grows it to the screen's, so a sheet shown early jumps down.
export function useModalSettled() {
  const [laidOut, setLaidOut] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!laidOut || settled) {
      return;
    }
    const timer = setTimeout(() => setSettled(true), settleTimeoutMs);
    return () => clearTimeout(timer);
  }, [laidOut, settled]);

  function onRootLayout(event: LayoutChangeEvent) {
    const { height } = event.nativeEvent.layout;
    setLaidOut(true);
    if (
      height >= Dimensions.get('screen').height - 1 ||
      height > Dimensions.get('window').height + 1
    ) {
      setSettled(true);
    }
  }

  return { settled, onRootLayout };
}
