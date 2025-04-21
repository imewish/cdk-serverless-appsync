import { APIGatewayProxyHandler } from 'aws-lambda';
import dayjs from 'dayjs';

export const handler: APIGatewayProxyHandler = async (event) => {
  const now = dayjs();
  console.log({API_KEY: process.env.API_KEY})
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Lambda!',
      timestamp: now.format(),
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  };
};
