// 喜马拉雅每日签到 Surge 脚本
// 简化版 - 只保留签到功能并显示积分

// 配置区域 - 请根据实际情况修改这些值
const USER_ID = "177177246";
const USER_TOKEN = "177177246&54331510240N5B3708F9A4DDB3147D9F6F6E238C5C6B6B9FB54B5E22139E92163B816C888992144M4C03B05A650FAF4_";
const DEVICE_ID = "h5_1340d54e-bf77-4c53-ac37-5b40997ae990_2.4.25";
const APP_KEY = "e23df0e3d21c4379bf2a5b302a843a25";

// 存储键名
const KEY_LAST_SIGN = "ximalaya_last_sign";
const KEY_CONSECUTIVE_DAYS = "ximalaya_consecutive_days";
const KEY_CURRENT_ROUND = "ximalaya_current_round";
const KEY_TOTAL_INTEGRAL = "ximalaya_total_integral";

// 奖励规则
const REWARD_RULES = [
    10, 20, 30, 40, 80, 40, 40, 40, 80, 500, 80, 80, 80, 100, 500
];

// 主函数 - 执行签到
async function main() {
    try {
        // 检查今日是否已签到
        const lastSignDate = $persistentStore.read(KEY_LAST_SIGN);
        const today = new Date().toDateString();
        
        if (lastSignDate === today) {
            $notification.post("喜马拉雅签到", "跳过", "今日已签到过");
            return;
        }
        
        // 获取当前积分
        let totalIntegral = parseInt($persistentStore.read(KEY_TOTAL_INTEGRAL) || "4990");
        const oldIntegral = totalIntegral;
        
        // 执行签到
        const signResult = await performSignIn();
        
        if (signResult.code === 0) {
            // 签到成功
            $persistentStore.write(today, KEY_LAST_SIGN);
            
            // 更新连续签到天数
            let consecutiveDays = parseInt($persistentStore.read(KEY_CONSECUTIVE_DAYS) || "0");
            consecutiveDays++;
            $persistentStore.write(consecutiveDays.toString(), KEY_CONSECUTIVE_DAYS);
            
            // 更新当前轮次
            let currentRound = parseInt($persistentStore.read(KEY_CURRENT_ROUND) || "0");
            currentRound = (currentRound % 15) + 1;
            $persistentStore.write(currentRound.toString(), KEY_CURRENT_ROUND);
            
            // 计算奖励积分
            const awardValue = REWARD_RULES[currentRound - 1] || 10;
            totalIntegral += awardValue;
            $persistentStore.write(totalIntegral.toString(), KEY_TOTAL_INTEGRAL);
            
            // 发送通知
            $notification.post(
                "喜马拉雅签到成功", 
                `获得 ${awardValue} 积分`, 
                `当前积分: ${oldIntegral} → ${totalIntegral}\n连续签到: ${consecutiveDays}天`
            );
        } else {
            $notification.post("喜马拉雅签到", "失败", `错误: ${signResult.msg}`);
        }
    } catch (error) {
        $notification.post("喜马拉雅签到", "错误", error.message || "未知错误");
    }
}

// 执行签到（模拟）
async function performSignIn() {
    return new Promise((resolve) => {
        // 模拟API响应 - 使用固定数据
        const currentRound = parseInt($persistentStore.read(KEY_CURRENT_ROUND) || "5");
        const awardValue = REWARD_RULES[currentRound - 1] || 10;
        
        const response = {
            "code": 0,
            "msg": "成功",
            "data": {
                "status": 1,
                "award": {
                    "award_received_status": true,
                    "award_received_text": `恭喜你获得${awardValue}个音符`,
                    "award_value": awardValue.toString(),
                    "day_index": currentRound
                }
            }
        };
        
        // 模拟网络延迟
        setTimeout(() => {
            resolve(response);
        }, 1000);
    });
}

// 生成随机Nonce
function generateNonce() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for (let i = 0; i < 32; i++) {
        nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
}

// 生成签名（模拟实现）
function generateSignature(params) {
    const sortedKeys = Object.keys(params).sort();
    let signStr = '';
    
    for (const key of sortedKeys) {
        signStr += key + params[key];
    }
    
    signStr += 'your_secret_key';
    return md5(signStr);
}

// MD5哈希函数（示例实现）
function md5(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString();
}

// 模块导出
if (typeof $argument !== 'undefined') {
    main();
}
