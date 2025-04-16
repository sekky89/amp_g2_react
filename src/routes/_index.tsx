import type { Route } from "./+types/_index";

export const meta = ({}: Route.MetaArgs) => {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
};

const RootPage = () => {
  return <h1>hello</h1>;
};

export default RootPage;
