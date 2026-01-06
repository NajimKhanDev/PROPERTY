const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const ProjectApi = {

  // Roles
  login: `${BASE_URL}/login`,

  // Customer 
  create_customers: `${BASE_URL}/customers`,
  all_customers: `${BASE_URL}/customers`,
  
  // Property
  create_properties: `${BASE_URL}/properties`,
  all_properties: `${BASE_URL}/properties`


};

export default ProjectApi;
