module.exports = function processError(err) {
  if (err.asset) {
    err.customOutput = err.message.replace(
      /$/m,
      `: ${err.asset.urlOrDescription}`
    );
  }
  return err;
};
