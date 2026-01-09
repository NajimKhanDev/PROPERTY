const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const ProjectApi = {

  // Roles
  login: `${BASE_URL}/login`,

  // Customer 
  create_customers: `${BASE_URL}/customers`,
  all_customers: `${BASE_URL}/customers`,
  
  // Property
  create_properties: `${BASE_URL}/properties`,
  all_properties: `${BASE_URL}/properties`,
  all_properties_ready_to_sell: `${BASE_URL}/properties/ready-to-sell`,
  get_property_by_id: `${BASE_URL}/properties`,
  
  sell_property: `${BASE_URL}/sell-properties`


};

export default ProjectApi;
