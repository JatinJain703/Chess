import axios from "axios";

export async function signup(name: string, email: string, password: string) {
    try {
        const resp = await axios.post("http://localhost:3000/auth/signup", { name, email, password });
        return resp.data.token;
    } catch (err: any) {
        if (err.response) {
            throw new Error(err.response.data.message);
        }

        throw new Error("Server not reachable");

    }
}

export async function login(email: string, password: string) {
    try {
        const resp = await axios.post("http://localhost:3000/auth/login", { email, password });
        return resp.data.token;
    } catch (err:any) {
        if (err.response) {
            throw new Error(err.response.data.message);
        }

        throw new Error("Server not reachable");

    }
}