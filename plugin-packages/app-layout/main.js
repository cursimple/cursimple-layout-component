// Layouts are applied from the component page; there is nothing to sign in to or sync.
export async function checkLogin() { return {loggedIn: true}; }
export async function sync() { return {items: []}; }
