const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const ProjectApi = {

  // Roles
  login: `${BASE_URL}/login`,

  create_customers: `${BASE_URL}/customers`,
  all_customers: `${BASE_URL}/customers`,



};

export default ProjectApi;
