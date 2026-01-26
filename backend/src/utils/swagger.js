import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

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
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.cenopie.com' 
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

let specs;
try {
  specs = swaggerJsdoc(options);
} catch (error) {
  console.warn('Swagger initialization failed:', error.message);
  specs = {
    openapi: '3.0.0',
    info: {
      title: 'Cenopie API',
      version: '1.0.0',
      description: 'API documentation temporarily unavailable',
    },
    paths: {},
  };
}

export function setupSwagger(app) {
  try {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Cenopie API Documentation',
    }));
    console.log('📚 Swagger documentation available at /api-docs');
  } catch (error) {
    console.warn('Swagger setup failed:', error.message);
  }
}

export default specs;