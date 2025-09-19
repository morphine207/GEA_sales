import { ConfigConst } from "../config.const";
import { storeLsCredentials } from "./ls-credentials";

export async function authenticateUser(): Promise<boolean> {
    const username = prompt("Enter your username:");
    const password = prompt("Enter your password:");

    if(!username || !password) {
        console.error('username or password is not defined')
        return false;
    }

    const repsonse = await fetch(
        `${ConfigConst.apiUrl}`,
        {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": "Basic " + btoa(`${username}:${password}`)
            }
        }
    )

    if(repsonse.ok) {
        storeLsCredentials(username, password)
        return true;
    }

    return false
}