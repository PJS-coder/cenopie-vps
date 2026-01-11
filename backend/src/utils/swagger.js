import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cenopie API',
      version: '1.0.0',
      description: 'API documentation for Cenopie backend services',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // files containing annotations as above
};

const specs = swaggerJsdoc(options);
export default specs;