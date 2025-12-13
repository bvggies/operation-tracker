import { motion as framerMotion } from 'framer-motion';

// Create safe motion components that fallback to regular HTML elements if motion is undefined
let SafeMotion = {
  div: 'div',
  aside: 'aside',
  li: 'li',
  button: 'button',
  span: 'span',
};

// Check if framer-motion is available and create safe wrappers
if (framerMotion && typeof framerMotion.div === 'function') {
  SafeMotion = {
    div: framerMotion.div,
    aside: framerMotion.aside,
    li: framerMotion.li,
    button: framerMotion.button,
    span: framerMotion.span,
  };
}

// Helper to get motion props if motion is available
export const getMotionProps = (props) => {
  if (!framerMotion || typeof framerMotion.div !== 'function') {
    return {};
  }
  return props;
};

export default SafeMotion;

