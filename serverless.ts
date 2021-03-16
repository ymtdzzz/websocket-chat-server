import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'websocket-chat-server',
  frameworkVersion: '2',
  custom: {
    user: 'ymatsuda',
    corsOrigin: '*',
    frontendUrl: 'https://reactplayground.zeroclock.dev/WebsocketChat',
    deploymentBucketName: "zeroclock-com-websocket-chat-server-layer-${opt:stage, self:provider.stage}-${opt:region, self:provider.region}",
    'serverless-layers': {
      dependenciesPath: './package.json',
    },
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    },
    autoConfirmUserArn: 'arn:aws:lambda:ap-northeast-1:936630031871:function:LAMBDA_ymatsuda_websocket-chat-server_auth_autoconfirm_dev',
  },
  // Add the serverless-webpack plugin
  plugins: [
    'serverless-webpack',
    'serverless-deployment-bucket',
    'serverless-layers',
  ],
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    region: 'ap-northeast-1',
    apiGateway: {
      minimumCompressionSize: 1024,
    },
    websocketsApiName: "${self:service}-apigw-websocket-${opt:stage, self:provider.stage}",
    websocketsApiRouteSelectionExpression: '$request.body.action',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      ENVIRONMENT: "${opt:stage, self:provider.stage}",
      COGNITO_USER_POOL: {
        Ref: 'CognitoUserPool',
      },
      COGNITO_USER_POOL_CLIENT: {
        Ref: 'CognitoUserPoolClient',
      },
      CORS_ORIGIN: "${self:custom.corsOrigin}",
      DYNAMODB_SOCKETS_TYPE_GSI: "${self:service}-sockets-type-gsi-${opt:stage, self:provider.stage}",
      DYNAMODB_SOCKETS_SUB_GSI: "${self:service}-sockets-sub-gsi-${opt:stage, self:provider.stage}",
      DYNAMODB_SOCKETS_PARTNER_SUB_GSI: "${self:service}-sockets-partner-sub-gsi-${opt:stage, self:provider.stage}",
      DYNAMODB_SOCKETS_TABLE: "${self:service}-sockets-${opt:stage, self:provider.stage}",
      DYNAMODB_LOGS_TABLE: "${self:service}-logs-${opt:stage, self:provider.stage}",
      DYNAMODB_LOGS_FROM_SUB_GSI: "${self:service}-logs-from-sub-gsi-${opt:stage, self:provider.stage}",
      DYNAMODB_LOGS_TO_SUB_GSI: "${self:service}-logs-to-sub-gsi-${opt:stage, self:provider.stage}",
      DYNAMODB_LOGS_TIMESTAMP_GSI: "${self:service}-logs-timestamp-gsi-${opt:stage, self:provider.stage}",
      DYNAMODB_LOGS_MESSAGE_GSI: "${self:service}-logs-timestamp-gsi-${opt:stage, self:provider.stage}",
      KEYS_URL: {
        "Fn::Join": [
          '',
          [
            'https://cognito-idp.',
            "${opt:region, self:provider.region}",
            '.amazonaws.com/',
            {
              Ref: 'CognitoUserPool',
            },
            '/.well-known/jwks.json',
          ]
        ]
      },
      WEBSOCKET_API_ENDPOINT: {
        "Fn::Join": [
          '',
          [
            'https://',
            {
              Ref: 'WebsocketsApi',
            },
            '.execute-api.',
            "${opt:region, self:provider.region}",
            '.amazonaws.com/',
            "${opt:stage, self:provider.stage}/",
          ]
        ]
      }
    },
    deploymentBucket: {
      name: "${self:custom.deploymentBucketName}",
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          'execute-api:ManageConnections',
        ],
        Resource: [
          "arn:aws:execute-api:${opt:region, self:provider.region}:*:**/@connections/*",
        ],
      },
      {
        Effect: 'Allow',
        Action: [
          'cognito-idp:ListUsers',
        ],
        Resource: [
          {
            "Fn::Join": [
              '',
              [
                "arn:aws:cognito-idp:${opt:region, self:provider.region}:*:userpool/",
                {
                  Ref: 'CognitoUserPool',
                },
              ],
            ],
          },
        ],
      },
      {
        Effect: 'Allow',
        Action: [
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
        ],
        Resource: [
          "arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.DYNAMODB_SOCKETS_TABLE}",
          "arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.DYNAMODB_SOCKETS_TABLE}/index/${self:provider.environment.DYNAMODB_SOCKETS_TYPE_GSI}",
          "arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.DYNAMODB_SOCKETS_TABLE}/index/${self:provider.environment.DYNAMODB_SOCKETS_SUB_GSI}",
          "arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.DYNAMODB_SOCKETS_TABLE}/index/${self:provider.environment.DYNAMODB_SOCKETS_PARTNER_SUB_GSI}",
          "arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.DYNAMODB_LOGS_TABLE}",
          "arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.DYNAMODB_LOGS_TABLE}/index/${self:provider.environment.DYNAMODB_LOGS_MESSAGE_GSI}",
          "arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.DYNAMODB_LOGS_TABLE}/index/${self:provider.environment.DYNAMODB_LOGS_FROM_SUB_GSI}",
          "arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.DYNAMODB_LOGS_TABLE}/index/${self:provider.environment.DYNAMODB_LOGS_TO_SUB_GSI}",
        ],
      },
    ]
  },
  functions: {
    authUser: {
      name: "LAMBDA_${self:custom.user}_${self:service}_auth_${opt:stage, self:provider.stage}",
      handler: 'handler.authUser',
      events: [
        {
          http: {
            path: 'auth',
            method: 'post',
            cors: {
              origin: "${self:custom.corsOrigin}",
            },
          },
        },
      ],
    },
    authWebsocket: {
      name: "LAMBDA_${self:custom.user}_${self:service}_auth_websocket_${opt:stage, self:provider.stage}",
      handler: 'handler.authWebsocket',
      // cors: {
      //   origin: "${self:custom.corsOrigin}",
      // },
    },
    defaultSocketHandler: {
      name: "LAMBDA_${self:custom.user}_${self:service}_socket_default_${opt:stage, self:provider.stage}",
      handler: 'handler.defaultSocketHandler',
      events: [
        {
          websocket: {
            route: '$default',
          },
        },
      ],
    },
    greeting: {
      name: "LAMBDA_${self:custom.user}_${self:service}_socket_greeting_${opt:stage, self:provider.stage}",
      handler: 'handler.greeting',
      events: [
        {
          websocket: {
            route: 'GREETING'
          },
        },
      ],
    },
    status: {
      name: "LAMBDA_${self:custom.user}_${self:service}_socket_status_${opt:stage, self:provider.stage}",
      handler: 'handler.status',
      events: [
        {
          websocket: {
            route: 'STATUS',
          },
        },
      ],
    },
    sendmsg: {
      name: "LAMBDA_${self:custom.user}_${self:service}_socket_sendmsg_${opt:stage, self:provider.stage}",
      handler: 'handler.sendmsg',
      events: [
        {
          websocket: {
            route: 'SENDMSG',
          },
        },
      ],
    },
    getmsg: {
      name: "LAMBDA_${self:custom.user}_${self:service}_socket_getmsg_${opt:stage, self:provider.stage}",
      handler: 'handler.getmsg',
      events: [
        {
          websocket: {
            route: 'GETMSG',
          },
        },
      ],
    },
    handleSocketConnect: {
      name: "LAMBDA_${self:custom.user}_${self:service}_socket_connect_${opt:stage, self:provider.stage}",
      handler: 'handler.handleSocketConnect',
      events: [
        {
          websocket: {
            route: '$connect',
            authorizer: {
              name: 'authWebsocket',
              identitySource: ['route.request.querystring.Authorizer'],
            },
          },
        },
      ],
    },
    handleSocketDisconnect: {
      name: "LAMBDA_${self:custom.user}_${self:service}_socket_disconnect_${opt:stage, self:provider.stage}",
      handler: 'handler.handleSocketDisconnect',
      events: [
        {
          websocket: {
            route: '$disconnect',
          },
        },
      ],
    },
    refreshToken: {
      name: "LAMBDA_${self:custom.user}_${self:service}_auth_refresh_${opt:stage, self:provider.stage}",
      handler: 'handler.refreshToken',
      events: [
        {
          http: {
            path: 'auth/refresh',
            method: 'post',
            cors: {
              origin: "${self:custom.corsOrigin}",
            },
          },
        },
      ],
    },
    autoConfirmUser: {
      name: "LAMBDA_${self:custom.user}_${self:service}_auth_autoconfirm_${opt:stage, self:provider.stage}",
      handler: 'handler.autoConfirmUser',
    },
  },
  resources: {
    Resources: {
      CognitoUserPool: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {
          AliasAttributes: [
            'preferred_username',
          ],
          MfaConfiguration: 'OFF',
          UserPoolName: "${self:service}-cognito-${opt:stage, self:provider.stage}",
          Policies: {
            PasswordPolicy: {
              MinimumLength: 6,
              RequireLowercase: false,
              RequireNumbers: true,
              RequireSymbols: false,
              RequireUppercase: true,
            },
          },
          LambdaConfig: {
            // Fn::GetAtt causes circular dependencies
            // For the time being, hard-code the arn
            PreSignUp: "${self:custom.autoConfirmUserArn}",
            // PreSignUp: {
            //   "Fn::GetAtt": [
            //     'AutoConfirmUserLambdaFunction',
            //     'Arn',
            //   ],
            // },
          },
        }
      },
      CognitoUserPoolClient: {
        Type: 'AWS::Cognito::UserPoolClient',
        Properties: {
          ClientName: "${self:service}-cognito-client-${opt:stage, self:provider.stage}",
          GenerateSecret: false,
          UserPoolId: {
            Ref: 'CognitoUserPool',
          },
          SupportedIdentityProviders: ['COGNITO'],
          AllowedOAuthFlows: ['implicit'],
          AllowedOAuthScopes: ['openid'],
          CallbackURLs: ["${self:custom.frontendUrl}", 'http://localhost:3000/WebsocketChat'],
          AllowedOAuthFlowsUserPoolClient: true,
        },
      },
      CognitoUserPoolDomain: {
        Type: 'AWS::Cognito::UserPoolDomain',
        Properties: {
          Domain: "${self:service}-${self:custom.user}-${opt:stage, self:provider.stage}",
          UserPoolId: {
            Ref: 'CognitoUserPool',
          },
        },
      },
      SocketsDynamoDbTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: 'connectionId',
              AttributeType: 'S',
            },
            {
              AttributeName: 'type',
              AttributeType: 'S',
            },
            {
              AttributeName: 'sub',
              AttributeType: 'S',
            },
            {
              AttributeName: 'partnerSub',
              AttributeType: 'S',
            }
          ],
          KeySchema: [{
              AttributeName: 'connectionId',
              KeyType: 'HASH',
          }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
          TableName: "${self:provider.environment.DYNAMODB_SOCKETS_TABLE}",
          GlobalSecondaryIndexes: [
            {
              IndexName: "${self:provider.environment.DYNAMODB_SOCKETS_TYPE_GSI}",
              KeySchema: [
                {
                  AttributeName: 'type',
                  KeyType: 'HASH',
                },
              ],
              Projection: {
                ProjectionType: 'ALL',
              },
              ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1,
              },
            },
            {
              IndexName: "${self:provider.environment.DYNAMODB_SOCKETS_SUB_GSI}",
              KeySchema: [
                {
                  AttributeName: 'sub',
                  KeyType: 'HASH',
                },
              ],
              Projection: {
                ProjectionType: 'ALL',
              },
              ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1,
              },
            },
            {
              IndexName: "${self:provider.environment.DYNAMODB_SOCKETS_PARTNER_SUB_GSI}",
              KeySchema: [
                {
                  AttributeName: 'partnerSub',
                  KeyType: 'HASH',
                },
              ],
              Projection: {
                ProjectionType: 'ALL',
              },
              ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1,
              },
            },
          ],
        }
      },
      LogsDynamoDbTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: 'messageId',
              AttributeType: 'S',
            },
            {
              AttributeName: 'message',
              AttributeType: 'S',
            },
            {
              AttributeName: 'fromSub',
              AttributeType: 'S',
            },
            {
              AttributeName: 'toSub',
              AttributeType: 'S',
            },
            {
              AttributeName: 'timestamp',
              AttributeType: 'N',
            },
          ],
          KeySchema: [{
              AttributeName: 'messageId',
              KeyType: 'HASH',
          }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
          TableName: "${self:provider.environment.DYNAMODB_LOGS_TABLE}",
          GlobalSecondaryIndexes: [
            {
              IndexName: "${self:provider.environment.DYNAMODB_LOGS_MESSAGE_GSI}",
              KeySchema: [
                {
                  AttributeName: 'message',
                  KeyType: 'HASH',
                },
              ],
              Projection: {
                ProjectionType: 'ALL',
              },
              ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1,
              },
            },
            {
              IndexName: "${self:provider.environment.DYNAMODB_LOGS_FROM_SUB_GSI}",
              KeySchema: [
                {
                  AttributeName: 'fromSub',
                  KeyType: 'HASH',
                },
              ],
              Projection: {
                ProjectionType: 'ALL',
              },
              ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1,
              },
            },
            {
              IndexName: "${self:provider.environment.DYNAMODB_LOGS_TO_SUB_GSI}",
              KeySchema: [
                {
                  AttributeName: 'toSub',
                  KeyType: 'HASH',
                },
                {
                  AttributeName: 'timestamp',
                  KeyType: 'RANGE',
                },
              ],
              Projection: {
                ProjectionType: 'ALL',
              },
              ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1,
              },
            },
            // {
            //   IndexName: "${self:provider.environment.DYNAMODB_LOGS_TIMESTAMP_GSI}",
            //   KeySchema: [
            //     {
            //       AttributeName: 'timestamp',
            //       KeyType: 'RANGE',
            //     },
            //   ],
            //   Projection: {
            //     ProjectionType: 'ALL',
            //   },
            //   ProvisionedThroughput: {
            //     ReadCapacityUnits: 1,
            //     WriteCapacityUnits: 1,
            //   },
            // },
          ],
        }
      },
      // Add permission to access AutoConfirmUser manually
      // because this function is linked to CognitoUserPool by hard-coded arn
      // ref: https://stackoverflow.com/questions/42460846/when-i-try-to-login-using-aws-cognito-i-get-an-accessdeniedexception-about-my-cu
      AutoConfirmUserPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          Action: 'lambda:InvokeFunction',
          FunctionName: "${self:custom.autoConfirmUserArn}",
          Principal: "cognito-idp.amazonaws.com",
          SourceArn: {
            'Fn::GetAtt': [
              'CognitoUserPool',
              'Arn',
            ],
          },
        }
      },
    },
    Outputs: {
      CognitoUserPoolId: {
        Value: {
          Ref: 'CognitoUserPool',
        },
        Export: {
          Name: "AWS-CognitoUserPoolId-${self:provider.stage}",
        },
      },
      CognitoUserPoolClientId: {
        Value: {
          Ref: 'CognitoUserPoolClient',
        },
        Export: {
          Name: 'AWS-CognitoUserPoolClientId-${self:provider.stage}',
        },
      },
    }
  }
}

module.exports = serverlessConfiguration;
