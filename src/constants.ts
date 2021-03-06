const CONSTANTS = {
  RSTUDIO_INSTANCE: process.env.RSTUDIO_INSTANCE,
  ENVIRONMENT: process.env.ENVIRONMENT,
  COGNITO_USER_POOL: process.env.COGNITO_USER_POOL,
  COGNITO_USER_POOL_CLIENT: process.env.COGNITO_USER_POOL_CLIENT,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  BUCKET_NAME: process.env.BUCKET_NAME,
  DYNAMODB_FILES_GSI: process.env.DYNAMODB_FILES_GSI,
  DYNAMODB_FILES_TABLE: process.env.DYNAMODB_FILES_TABLE,
  DYNAMODB_JOBS_STATE_GSI: process.env.DYNAMODB_JOBS_STATE_GSI,
  DYNAMODB_JOBS_TIME_GSI: process.env.DYNAMODB_JOBS_TIME_GSI,
  DYNAMODB_JOBS_TABLE: process.env.DYNAMODB_JOBS_TABLE,
  DYNAMODB_SOCKETS_TYPE_GSI: process.env.DYNAMODB_SOCKETS_TYPE_GSI,
  DYNAMODB_SOCKETS_SUB_GSI: process.env.DYNAMODB_SOCKETS_SUB_GSI,
  DYNAMODB_SOCKETS_PARTNER_SUB_GSI: process.env.DYNAMODB_SOCKETS_PARTNER_SUB_GSI,
  DYNAMODB_SOCKETS_TABLE: process.env.DYNAMODB_SOCKETS_TABLE,
  DYNAMODB_LOGS_TABLE: process.env.DYNAMODB_LOGS_TABLE,
  DYNAMODB_LOGS_FROM_SUB_GSI: process.env.DYNAMODB_LOGS_FROM_SUB_GSI,
  DYNAMODB_LOGS_TO_SUB_GSI: process.env.DYNAMODB_LOGS_TO_SUB_GSI,
  DYNAMODB_OPTIONS: {},
  GLUE_JOB_NAME: process.env.GLUE_JOB_NAME,
  KEYS_URL: process.env.KEYS_URL,
  SIGNED_URL_EXPIRE_SECONDS: 60 * 60,
  WEBSOCKET_API_ENDPOINT: process.env.WEBSOCKET_API_ENDPOINT
};

export default CONSTANTS;
