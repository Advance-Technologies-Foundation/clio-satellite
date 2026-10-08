// Google Analytics 4 property for anonymous usage statistics (see docs/architecture/analytics.md).
// Left empty in git: the release workflow fills them from the GA_MEASUREMENT_ID and GA_API_SECRET
// repository secrets. While empty (local and unpacked builds), nothing is ever sent.
self.ClioAnalyticsConfig = {
  measurementId: '',
  apiSecret: '',
};
