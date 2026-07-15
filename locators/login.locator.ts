export const loginLocators = {
  form: {
    emailInput: { role: 'textbox', name: 'Email' },
    passwordInput: { role: 'textbox', name: 'Password' },
    loginButton: { role: 'button', name: 'Sign in' },
  },

  nav: {
    profileDropdown: { role: 'button', name: /User Avatar/ },
    logoutButton: { role: 'button', name: 'Keluar' },
  },
};
