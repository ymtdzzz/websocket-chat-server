import { AuthenticationDetails, CognitoRefreshToken, CognitoUser, CognitoUserAttribute, CognitoUserPool, CognitoUserSession, IAuthenticationDetailsData, ICognitoUserData, ICognitoUserPoolData } from 'amazon-cognito-identity-js';
import { CognitoIdentityServiceProvider } from 'aws-sdk';

import CONSTANTS from '../constants';

interface Tokens {
  accessToken: string,
  refreshToken: string,
  tokenId: string,
}

const getTokens = (authResult: CognitoUserSession): Tokens => {
  const accessToken = authResult.getAccessToken().getJwtToken();
  const refreshToken = authResult.getRefreshToken().getToken();
  const tokenId = authResult.getIdToken().getJwtToken();

  return {
    accessToken,
    refreshToken,
    tokenId,
  };
}

const authenticate = (cognitoUser: CognitoUser, authenticationDetails: AuthenticationDetails): Promise<Tokens> => {
  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        resolve(getTokens(result));
      },
      newPasswordRequired: (userAttributes: CognitoUserAttribute) => {
        // This is not production ready
        // We should manage this by the user on production environments
        cognitoUser.completeNewPasswordChallenge(
          authenticationDetails.getPassword(),
          userAttributes,
          this,
        );
      },
      onFailure: (e) => {
        reject(e);
      }
    });
  });
}

const refresh = (cognitoUser: CognitoUser, token: CognitoRefreshToken): Promise<Tokens> => {
  return new Promise((resolve, reject) => {
    cognitoUser.refreshSession(token, (err, session) => {
      if (err) {
        reject(err);
      } else {
        resolve(getTokens(session));
      }
    });
  });
}

class CognitoConnector {
  _userpool: CognitoUserPool;
  _cognitoidp: CognitoIdentityServiceProvider;

  constructor() {
    const poolData: ICognitoUserPoolData = {
      UserPoolId: CONSTANTS.COGNITO_USER_POOL,
      ClientId: CONSTANTS.COGNITO_USER_POOL_CLIENT,
    };
    this._userpool = new CognitoUserPool(poolData);
    this._cognitoidp = new CognitoIdentityServiceProvider();
  }

  async authenticateUser(user: string, password: string) {
    // Generate an AuthenticationDetails object
    const authenticationData: IAuthenticationDetailsData = {
      Username: user,
      Password: password,
    };
    const authenticationDetails = new AuthenticationDetails(authenticationData);

    // Generate a CognitoUser object
    const userData: ICognitoUserData = {
      Username: user,
      Pool: this._userpool,
    };
    const cognitoUser = new CognitoUser(userData);

    // Invoke the authenticate method
    return await authenticate(cognitoUser, authenticationDetails);
  }

  findUserBySub(sub: string) {
    return this._cognitoidp.listUsers({
      UserPoolId: this._userpool.getUserPoolId(),
      //AttributesToGet: null,
      Filter: `sub=\"${sub}\"`,
      //Limit: 1,
    }, (e, res) => {
      if (e) {
        throw Error(`Unable to find user by sub: ${e}, sub: ${sub}, res: ${res}`);
      } else if (res.Users.length !== 1) {
        throw Error(`User not found: ${e}, sub: ${sub}, res: ${JSON.stringify(res)}`);
      } else {
        return res.Users[0].Attributes['Username'];
      }
    }).promise();
  }

  async refreshToken(user: string, token: string) {
    // Generate a CognitoUser object
    const userData: ICognitoUserData = {
      Username: user,
      Pool: this._userpool,
    };
    const cognitoUser = new CognitoUser(userData);

    // Generate a RefreshToken object
    const refreshToken = new CognitoRefreshToken({RefreshToken: token});
    console.log(refreshToken);
    console.log(refreshToken.getToken());

    // Invoke the refresh method
    return await refresh(cognitoUser, refreshToken);
  }
}

const COGNITO_CONNECTOR = new CognitoConnector();
export default COGNITO_CONNECTOR;
