import React from 'react';

let framerMotion;
try {
  framerMotion = require('framer-motion').motion;
} catch (e) {
  framerMotion = null;
}

// Create wrapper components that always return valid React elements
const createSafeComponent = (tagName) => {
  if (framerMotion && framerMotion[tagName] && typeof framerMotion[tagName] === 'function') {
    return framerMotion[tagName];
  }
  // Return a React component that renders the HTML element
  return React.forwardRef((props, ref) => {
    const { initial, animate, transition, whileHover, ...rest } = props;
    return React.createElement(tagName, { ...rest, ref });
  });
};

// Create safe motion components that fallback to regular HTML elements if motion is undefined
const SafeMotion = {
  div: createSafeComponent('div'),
  aside: createSafeComponent('aside'),
  li: createSafeComponent('li'),
  button: createSafeComponent('button'),
  span: createSafeComponent('span'),
  tr: createSafeComponent('tr'),
};

// Helper to get motion props if motion is available
export const getMotionProps = (props) => {
  if (!framerMotion || typeof framerMotion.div !== 'function') {
    return {};
  }
  return props;
};

export default SafeMotion;

