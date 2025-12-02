// 顺丰APP签到请求特征（根据历史抓包优化，匹配签到相关接口）
const SIGN_REQUEST_MATCHERS = [
  { url: /~memberNonactivity~integralTaskSignPlusService~automaticSign/, method: "POST" }, // 核心签到接口
  { url: /~memberNonactivity~integralTaskSignPlusService~queryPointSign/, method: "POST" }, // 签到结果查询接口
  { url: /sign|checkin|automaticSign/, method: "POST" } // 通用签到关键词匹配
];

// 关键信息提取列表（后续编写签到脚本必需的参数）
const KEY_FIELDS = {
  headers: ["Cookie", "User-Agent", "signature", "timestamp", "deviceid", "platform", "syscode", "channel"],
  body: true, // 需要提取请求体
  url: true,  // 需要提取完整URL
  method: true // 需要提取请求方法
};

// 拦截请求并提取信息（Surge拦截触发点：请求发送前）
$httpClient.onRequest((req, next) => {
  const requestUrl = req.url;
  const requestMethod = req.method.toUpperCase();

  // 1. 过滤非签到相关请求（只保留匹配的签到接口）
  const isSignRequest = SIGN_REQUEST_MATCHERS.some(matcher => {
    return matcher.url.test(requestUrl) && matcher.method === requestMethod;
  });
  if (!isSignRequest) {
    next(req); // 非签到请求，正常放行
    return;
  }

  // 2. 提取关键信息
  const capturedData = {
    "📌 签到接口URL": requestUrl,
    "📌 请求方法": requestMethod,
    "📌 关键请求头": {},
    "📌 请求体（Body）": req.body || "无"
  };

  // 提取指定的关键请求头（去重合并Cookie）
  if (req.headers) {
    KEY_FIELDS.headers.forEach(headerKey => {
      const headerValue = req.headers[headerKey] || req.headers[headerKey.toLowerCase()];
      if (headerValue) {
        // 合并多个Cookie（部分请求Cookie可能分散在多个字段）
        if (headerKey.toLowerCase() === "cookie" && typeof headerValue === "object") {
          capturedData["📌 关键请求头"][headerKey] = headerValue.join("; ");
        } else {
          capturedData["📌 关键请求头"][headerKey] = headerValue;
        }
      }
    });
  }

  // 3. 输出信息到Surge日志（debug级别，可在Surge「日志」中查看）
  console.log("\n" + "=".repeat(50));
  console.log("✅ 已捕获顺丰APP签到关键信息：");
  for (const [key, value] of Object.entries(capturedData)) {
    if (typeof value === "object" && value !== null) {
      console.log(`\n${key}：`);
      for (const [subKey, subValue] of Object.entries(value)) {
        console.log(`  ${subKey}: ${subValue}`);
      }
    } else {
      console.log(`\n${key}：${value}`);
    }
  }
  console.log("=".repeat(50) + "\n");

  // 4. 发送系统通知，提示用户已捕获信息
  $notification.post(
    "✅ 顺丰签到信息已捕获",
    "点击查看Surge日志获取完整参数",
    `接口URL：${requestUrl}\n提示：请在Surge「日志」中复制关键信息`
  );

  // 5. 放行请求（不影响APP正常使用）
  next(req);
});

// 拦截响应（可选，补充提取响应中的签到结果字段）
$httpClient.onResponse((res, next) => {
  const requestUrl = res.request.url;
  const requestMethod = res.request.method.toUpperCase();

  // 只处理签到请求的响应
  const isSignRequest = SIGN_REQUEST_MATCHERS.some(matcher => {
    return matcher.url.test(requestUrl) && matcher.method === requestMethod;
  });
  if (isSignRequest && res.body) {
    try {
      const responseData = JSON.parse(res.body);
      console.log("\n" + "=".repeat(50));
      console.log("📊 顺丰签到响应信息（辅助验证）：");
      console.log(`签到结果：${responseData.success ? "成功" : "失败"}`);
      console.log(`连续签到天数：${responseData.obj?.countDay || "未知"}`);
      console.log(`错误信息（若失败）：${responseData.errorMessage || "无"}`);
      console.log("=".repeat(50) + "\n");
    } catch (e) {
      console.log("\n⚠️  签到响应解析失败（非JSON格式）：", res.body);
    }
  }

  next(res);
});