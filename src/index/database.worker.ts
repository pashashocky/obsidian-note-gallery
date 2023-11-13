self.onmessage = async event => {
  const files = await Promise.all(
    event.data.map(async (file: string) => {
      return file;
    }),
  );

  self.postMessage(files);
};
