const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRegisterInput = (name, email, password, role) => {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!email || !validateEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!password || !validatePassword(password)) {
    errors.push('Password must be at least 6 characters');
  }

  if (role && !['student', 'admin'].includes(role)) {
    errors.push('Role must be either student or admin');
  }

  return errors;
};

const validateLoginInput = (email, password) => {
  const errors = [];

  if (!email || !validateEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  return errors;
};

export {
  validateEmail,
  validatePassword,
  validateRegisterInput,
  validateLoginInput
};
