import { Box } from '@chakra-ui/react';
import { animate, motion, useDragControls, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';

const MotionBox = motion.create(Box);
export const PEEK = 150;
const HANDLE = 28;

// Draggable sheet for phones. Three resting heights: peek, half, full.
// Only the handle area drags, so the list inside scrolls normally.
export default function BottomSheet({ snap, setSnap, onCovered, children }) {
  const [vh, setVh] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight));
  const controls = useDragControls();
  const y = useMotionValue(0);

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const full = Math.round(vh - 140); // leaves the floating search bar and chips uncovered
  const visible = { peek: PEEK, half: Math.round(vh * 0.5), full };
  const offset = (s) => full - visible[s];

  useEffect(() => {
    animate(y, offset(snap), { type: 'spring', stiffness: 420, damping: 42 });
    onCovered?.(visible[snap]);
  }, [snap, vh]); // eslint-disable-line react-hooks/exhaustive-deps

  function onDragEnd(_, info) {
    const target = y.get() + info.velocity.y * 0.2; // flick: project where it would stop
    const closest = Object.keys(visible).reduce((best, s) => (
      Math.abs(offset(s) - target) < Math.abs(offset(best) - target) ? s : best
    ), 'half');
    setSnap(closest);
    animate(y, offset(closest), { type: 'spring', stiffness: 420, damping: 42 });
  }

  return (
    <MotionBox
      position="absolute" left={0} right={0} bottom={0} zIndex={1050} bg="surface" roundedTop="24px" shadow="sheet"
      height={`${full}px`} style={{ y }} drag="y" dragControls={controls} dragListener={false}
      dragConstraints={{ top: 0, bottom: full - PEEK }} dragElastic={0.06} onDragEnd={onDragEnd}
      display="flex" flexDirection="column"
    >
      <Box
        height={`${HANDLE}px`} display="grid" placeItems="center" cursor="grab" flexShrink={0}
        onPointerDown={(e) => controls.start(e)} style={{ touchAction: 'none' }}
        role="button" tabIndex={0} aria-label="Resize results panel"
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') setSnap(snap === 'peek' ? 'half' : 'full');
          if (e.key === 'ArrowDown') setSnap(snap === 'full' ? 'half' : 'peek');
        }}
      >
        <Box width="44px" height="5px" rounded="full" bg="gray.300" _dark={{ bg: 'gray.600' }} />
      </Box>
      <Box
        flex="none" display="flex" flexDirection="column" minH={0}
        style={{ height: visible[snap] - HANDLE, transition: 'height .2s' }}
        overflow="hidden" pb="env(safe-area-inset-bottom)"
      >
        {children}
      </Box>
    </MotionBox>
  );
}
