// eslint-disable-next-line import/prefer-default-export
export const hello = (event, context, callback) => {
  const p = new Promise((resolve) => {
    resolve('success');
  });
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless Webpack (Ecma Script) v1.0! First module!',
      input: event,
    }),
  };
  p
    // .then(() => callback(null, {
    //   message: 'Go Serverless Webpack (Ecma Script) v1.0! First module!',
    //   event,
    // }))
    .then(() => callback(null, response))
    .catch(e => callback(e));
};
