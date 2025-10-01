import request from 'supertest';
import app from '@/index';
import Token from '@/models/Token';

const getCsrfToken = async (agent: request.SuperAgentTest) => {
  const response = await agent.get('/api/csrf-token').expect(200);
  return response.body.csrfToken as string;
};

describe('Auth API', () => {
  const agent = request.agent(app);

  afterEach(async () => {
    await Token.deleteMany({});
  });

  it('registers and logs in a new user', async () => {
    const csrfRegister = await getCsrfToken(agent);

    const registerResponse = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', csrfRegister)
      .send({
        email: 'testuser@example.com',
        password: 'Str0ngPassword!123',
        firstName: 'Test',
        lastName: 'User'
      })
      .expect(201);

    expect(registerResponse.body.user).toHaveProperty('email', 'testuser@example.com');

    const csrfLogin = await getCsrfToken(agent);

    const loginResponse = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', csrfLogin)
      .send({ email: 'testuser@example.com', password: 'Str0ngPassword!123' })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('token');
    expect(loginResponse.body).toHaveProperty('refreshToken');
  });
});
