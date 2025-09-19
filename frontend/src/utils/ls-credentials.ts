export const storeLsCredentials = (username: string, password: string) => {
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);
}

export const getLsCredentials = () => {
    return {
        username: localStorage.getItem("username"),
        password: localStorage.getItem("password")
    }
}

export const clearLsCredentials = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("password");
}