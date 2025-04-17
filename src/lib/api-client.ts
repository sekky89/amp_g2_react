import { fetchAuthSession } from "aws-amplify/auth";
import axios from "axios";

const session = await fetchAuthSession();
const apiClient = axios.create({
	baseURL: "https://5h9kqtqoxi.execute-api.ap-northeast-1.amazonaws.com",
	headers: {
		Authorization: session.tokens?.idToken?.toString(),
		"Content-Type": "application/json",
	},
	timeout: 1000,
});

export default apiClient;
