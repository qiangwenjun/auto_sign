// 喜马拉雅每日签到 Surge 脚本
// 修正版 - 确保所有路径都调用 $done()

// 配置区域 - 请根据实际情况修改这些值
const USER_ID = "177177246";
const USER_TOKEN = "177177246&54331510240N5B3708F9A4DDB3147D9F6F6E238C5C6B6B9FB54B5E22139E92163B816C888992144M4C03B05A650FAF4_";
const DEVICE_ID = "h5_1340d54e-bf77-4c53-ac37-5b40997ae990_2.4.25";
const APP_KEY = "e23df0e3d21c4379bf2a5b302a843a25";

// 存储键名
const KEY_LAST_SIGN = "ximalaya_last_sign";
const KEY_CONSECUTIVE_DAYS = "ximalaya_consecutive_days";
const KEY_CURRENT_ROUND = "ximalaya_current_round";
const KEY_INITIALIZED = "ximalaya_initialized";

// 奖励规则
const REWARD_RULES = [
    10, 20, 30, 40, 80, 40, 40, 40, 80, 500, 80, 80, 80, 100, 500
];

// 初始化函数 - 设置初始值
function initialize() {
    if (!$persistentStore.read(KEY_INITIALIZED)) {
        // 设置初始值：今天是第5天签到
        $persistentStore.write("5", KEY_CONSECUTIVE_DAYS);
        $persistentStore.write("5", KEY_CURRENT_ROUND);
        $persistentStore.write("1", KEY_INITIALIZED);
        console.log("初始化完成：第5天签到");
    }
}

// 主函数 - 执行签到
async function main() {
    try {
        // 初始化存储值
        initialize();
        
        // 检查今日是否已签到
        const lastSignDate = $persistentStore.read(KEY_LAST_SIGN);
        const today = new Date().toDateString();
        
        if (lastSignDate === today) {
            // 获取当前状态用于显示
            const consecutiveDays = parseInt($persistentStore.read(KEY_CONSECUTIVE_DAYS) || "5");
            const currentRound = parseInt($persistentStore.read(KEY_CURRENT_ROUND) || "5");
            const awardValue = REWARD_RULES[currentRound - 1] || 10;
            
            $notification.post(
                "喜马拉雅签到", 
                "跳过", 
                `今日已签到过\n今日是第${currentRound}天签到\n获得 ${awardValue} 积分\n连续签到: ${consecutiveDays}天`
            );
            $done();
            return;
        }
        
        // 获取当前状态
        let consecutiveDays = parseInt($persistentStore.read(KEY_CONSECUTIVE_DAYS) || "5");
        let currentRound = parseInt($persistentStore.read(KEY_CURRENT_ROUND) || "5");
        
        // 执行签到
        const signResult = await performSignIn();
        
        if (signResult.code === 0) {
            // 签到成功
            $persistentStore.write(today, KEY_LAST_SIGN);
            
            // 更新连续签到天数
            consecutiveDays++;
            $persistentStore.write(consecutiveDays.toString(), KEY_CONSECUTIVE_DAYS);
            
            // 更新当前轮次
            currentRound = (currentRound % 15) + 1;
            $persistentStore.write(currentRound.toString(), KEY_CURRENT_ROUND);
            
            // 计算奖励积分
            const awardValue = REWARD_RULES[currentRound - 1] || 10;
            
            // 发送通知
            $notification.post(
                "喜马拉雅签到成功", 
                `第${currentRound}天签到，获得 ${awardValue} 积分`, 
                `连续签到: ${consecutiveDays}天`
            );
        } else {
            $notification.post("喜马拉雅签到", "失败", `错误: ${signResult.msg}`);
        }
    } catch (error) {
        $notification.post("喜马拉雅签到", "错误", error.message || "未知错误");
    }
    
    // 确保脚本结束
    $done();
}

// 执行签到（模拟）
async function performSignIn() {
    return new Promise((resolve) => {
        // 获取当前轮次
        const currentRound = parseInt($persistentStore.read(KEY_CURRENT_ROUND) || "5");
        const awardValue = REWARD_RULES[currentRound] || 10;
        
        const response = {
            "code": 0,
            "msg": "成功",
            "data": {
                "status": 1,
                "award": {
                    "award_received_status": true,
                    "award_received_text": `恭喜你获得${awardValue}个音符`,
                    "award_value": awardValue.toString(),
                    "day_index": currentRound + 1
                }
            }
        };
        
        // 模拟网络延迟
        setTimeout(() => {
            resolve(response);
        }, 1000);
    });
}

// 启动主函数
main();
