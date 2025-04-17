import apiClient from "@/lib/api-client";
import type { Route } from "./+types/_index";

export const meta = ({}: Route.MetaArgs) => {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
};

const RootPage = () => {
	apiClient.get("/").then((res) => {
		console.log(res.data);
	});

	return <h1>hello</h1>;
};

export default RootPage;
