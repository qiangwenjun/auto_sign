// 顺丰APP签到参数捕获+自动存储脚本（sf-sign-capture.js）
const SIGN_REQUEST_MATCHERS = [
  { url: /~memberNonactivity~integralTaskSignPlusService~automaticSign/, method: "POST" },
  { url: /~memberNonactivity~integralTaskSignPlusService~queryPointSign/, method: "POST" },
  { url: /sign|checkin|automaticSign/, method: "POST" }
];
const STORAGE_KEY = "sf_sign_captured_params"; // 参数存储键名

$httpClient.onRequest((req, next) => {
  const requestUrl = req.url;
  const requestMethod = req.method.toUpperCase();
  const isSignRequest = SIGN_REQUEST_MATCHERS.some(matcher => 
    matcher.url.test(requestUrl) && matcher.method === requestMethod
  );
  if (!isSignRequest) { next(req); return; }

  // 提取并存储关键参数（自动去重合并）
  const capturedParams = {
    url: requestUrl,
    method: requestMethod,
    headers: {},
    body: req.body || "{}"
  };
  // 提取核心请求头（完全复用APP真实请求头）
  const keyHeaders = ["Cookie", "User-Agent", "signature", "deviceid", "platform", "syscode", "channel", "referer", "origin", "content-type"];
  keyHeaders.forEach(headerKey => {
    const value = req.headers[headerKey] || req.headers[headerKey.toLowerCase()];
    if (value) {
      capturedParams.headers[headerKey] = Array.isArray(value) ? value.join("; ") : value;
    }
  });
  // 存储到Surge本地（覆盖旧参数，确保最新）
  $persistentStore.write(JSON.stringify(capturedParams), STORAGE_KEY);

  // 通知+日志提示
  console.log("✅ 已捕获并存储顺丰签到参数：", JSON.stringify(capturedParams, null, 2));
  $notification.post("顺丰签到参数已存储", "可直接执行定时签到", `接口：${requestUrl.slice(0, 50)}...`);
  next(req);
});

$httpClient.onResponse((res, next) => { next(res); });
