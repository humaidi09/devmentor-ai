// Keep credentials/config, but force loopback fixtures onto the managed local socket.
exports.localDockerEnv = () => {
  const env = { ...process.env };
  for (const key of [
    "DOCKER_HOST",
    "DOCKER_CONTEXT",
    "DOCKER_TLS",
    "DOCKER_TLS_VERIFY",
    "DOCKER_CERT_PATH",
  ])
    delete env[key];
  return env;
};
