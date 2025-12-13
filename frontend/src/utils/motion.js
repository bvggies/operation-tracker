import { motion } from 'framer-motion';

// Create safe motion components that fallback to regular HTML elements if motion is undefined
export const SafeMotion = {
  div: (motion && typeof motion.div === 'function') ? motion.div : 'div',
  aside: (motion && typeof motion.aside === 'function') ? motion.aside : 'aside',
  li: (motion && typeof motion.li === 'function') ? motion.li : 'li',
  button: (motion && typeof motion.button === 'function') ? motion.button : 'button',
  span: (motion && typeof motion.span === 'function') ? motion.span : 'span',
};

// Helper to get motion props if motion is available
export const getMotionProps = (props) => {
  if (!motion || typeof motion.div !== 'function') {
    return {};
  }
  return props;
};

export default SafeMotion;

