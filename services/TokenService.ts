import jwt from 'jsonwebtoken';
import { config } from '../config';

class TokenService {
  generateTokens(payload: any) {
    const accessToken = jwt.sign(payload, config.secret, { expiresIn: '24h' });
    const refreshToken = jwt.sign(payload, config.refreshSecret, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
    }
  }
}

export default new TokenService();
