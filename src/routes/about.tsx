import type { Route } from "./+types/about";

export const meta = ({}: Route.MetaArgs) => {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
};

const AboutPage = () => {
  return <h1>About</h1>;
};

export default AboutPage;
