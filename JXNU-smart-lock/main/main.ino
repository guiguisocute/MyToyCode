/* =====================================================
 *  JXNU 智能门锁 - Blinker + 米家版
 *  功能：RFID 刷卡 + 小爱同学语音控制 + Blinker App 控制
 * ===================================================== */

// ===== Blinker 配置（必须放在最前面） =====
#define BLINKER_WIFI
#define BLINKER_MIOT_LIGHT  // 使用灯类型设备（支持开/关控制）

#include <Blinker.h>        // Blinker 物联网库
#include <SPI.h>            // 引入硬件 SPI 库，负责 11/12/13 三线的 MOSI/MISO/SCK
#include <MFRC522.h>        // 引入 MFRC522 RFID 驱动库
#include "DoorServo.h"      // 舵机动作封装
#include "UidStore.h"       // 白名单管理

/* ========== 用户配置区（请修改以下信息） ========== */
char auth[] = "1d2c7aa1b5cb";  // ★ Blinker Secret Key
char ssid[] = "N301";             // WiFi 名称
char pswd[] = "66663333";         // WiFi 密码
/* ================================================== */

/* ----------------- 硬件脚位映射 ---------------- */
#define RC522_SS    10    // RC522 的片选脚，SDA 线接 UNO D10
#define RC522_RST    9    // RC522 的复位脚，RST 线接 UNO D9
#define SERVO_PIN    8    // 舵机信号线接 UNO D8

/* ----------------- 对象实例化 ---------------- */
MFRC522 rfid(RC522_SS, RC522_RST);  // RC522 对象：初始化时告诉库 SS 和 RST 脚
DoorServo  door(SERVO_PIN);         // DoorServo 对象：非阻塞开门+关门
UidStore   uidStore;                // 白名单管理对象

/* -------- 全局状态与参数 -------- */
uint32_t lastSuccess = 0;          // 上次正常交互或复位的时间戳（ms）
const uint8_t  MAX_TRIES      = 3; // PICC_ReadCardSerial 最大重试次数
const uint32_t NO_CARD_TIMEOUT = 5000; // 连续无卡超时时间：5 秒
bool lockState = false;            // 锁状态：false=关闭, true=打开

/* ========== 小爱同学回调函数 ========== */

// 小爱同学电源状态控制（开门/关门）
void miotPowerState(const String & state) {
    Serial.print(F("[MIOT] Received command: "));
    Serial.println(state);
    
    if (state == BLINKER_CMD_ON) {
        Serial.println(F("[MIOT] >> Opening door via voice"));
        door.openThenClose();      // 开门，3秒后自动关闭
        lockState = true;
        BlinkerMIOT.powerState("on");
        BlinkerMIOT.print();
        
        // 延迟后更新状态为关闭（因为舵机会自动归位）
        // 注意：实际状态会在 3 秒后自动变为关闭
    } 
    else if (state == BLINKER_CMD_OFF) {
        Serial.println(F("[MIOT] >> Door is already closed"));
        lockState = false;
        BlinkerMIOT.powerState("off");
        BlinkerMIOT.print();
    }
}

// 小爱同学查询状态
void miotQuery(int32_t queryCode) {
    Serial.print(F("[MIOT] Query code: "));
    Serial.println(queryCode);
    
    BlinkerMIOT.powerState(lockState ? "on" : "off");
    BlinkerMIOT.print();
}

// ====== 硬复位 RC522 的小函数 ======
void rfidHardReset() {
  // 将 RST 拉低，强制给 RC522 一个硬件复位脉冲
  digitalWrite(RC522_RST, LOW);
  delay(10);                      // 拉低保持 10 ms，确保被芯片识别
  digitalWrite(RC522_RST, HIGH); // 再拉高，RC522 重新上电
  delay(5);                       // 等待内部上电稳定
  rfid.PCD_Init();                // 调用库的初始化，重建寄存器设置
}

void setup() {
  // --- 准备硬件 ---
  pinMode(RC522_RST, OUTPUT);     // 把 RST 脚设为输出，以便硬复位
  Serial.begin(115200);           // Blinker 推荐使用 115200 波特率
  delay(300);                     // 给你足够时间打开串口窗口

  Serial.println(F("\n========================================"));
  Serial.println(F("  JXNU Smart Lock - Blinker Edition"));
  Serial.println(F("========================================"));

  // --- 初始化 Blinker + WiFi ---
  Serial.println(F("[INIT] Connecting to WiFi..."));
  Blinker.begin(auth, ssid, pswd);
  
  // --- 注册小爱同学回调 ---
  BlinkerMIOT.attachPowerState(miotPowerState);  // 电源控制（开/关）
  BlinkerMIOT.attachQuery(miotQuery);            // 状态查询
  Serial.println(F("[INIT] Xiaomi MiOT callbacks registered"));

  // --- 初始化 SPI + RC522 ---
  SPI.begin();                    // 配置硬件 SPI（三线：MOSI/MISO/SCK）
  digitalWrite(RC522_RST, HIGH);  // 确保 RST 初始为高电平，不在掉电态
  rfid.PCD_Init();                // 复位 & 初始化 RC522 寄存器
  Serial.println(F("[INIT] RC522 RFID module initialized"));

  // --- 白名单载入 ---
  uidStore.begin();               // 从内置列表加载卡片 UID
  lastSuccess = millis();         // 记录此刻作为"最近正常"时间

  Serial.println(F("[READY] System ready! You can:"));
  Serial.println(F("  - Scan RFID card to unlock"));
  Serial.println(F("  - Say '打开智能锁' to Xiao Ai"));
  Serial.println(F("  - Use Blinker App to control"));
}

void loop() {
  // ===== 0. Blinker 保持连接（必须每次 loop 调用） =====
  Blinker.run();

  // ===== 1. 非阻塞舵机状态更新 =====
  // door.update() 会检查是否需要自动"关门"，并在适当时机调用 detach()
  door.update();

  // 检查锁是否已自动关闭，更新状态
  if (lockState && !door.isOpen()) {
    lockState = false;  // 舵机已归位，更新状态
  }

  // ===== 2. 读 VersionReg，检查 RC522 是否掉线/失联 =====
  byte ver = rfid.PCD_ReadRegister(MFRC522::VersionReg);
  // 若读到 0x00 或 0xFF，说明 SPI 通信异常或 RC522 在掉电态
  if (ver == 0x00 || ver == 0xFF) {
    Serial.println(F("[ERROR] RC522 comm failure, resetting..."));
    rfidHardReset();            // 硬复位 RC522
    lastSuccess = millis();     // 重置“最近正常”时间
    return;                     // 本次 loop 不做后续读卡操作
  }

  // ===== 3. 长时间无卡超时重 init =====
  // 如果超过 NO_CARD_TIMEOUT（5s）没检测到卡片，就软重启一次
  if (millis() - lastSuccess > NO_CARD_TIMEOUT) {
    Serial.println(F("[WARN] No card seen for a while, re-init RC522"));
    rfid.PCD_Init();            // 软复位 RC522
    lastSuccess = millis();     // 更新“最近正常”时间
  }

  // ===== 4. 检测是否有新卡靠近 =====
  // IsNewCardPresent() 先判断天线区是否有信号
  // ReadCardSerial() 再实际读取 UID，若任一失败就不继续
  if (!rfid.PICC_IsNewCardPresent()) return;
  
  // ===== 5. 多次尝试读取 UID =====
  bool ok = false;
  for (uint8_t i = 0; i < MAX_TRIES; i++) {
    if (rfid.PICC_ReadCardSerial()) {
      ok = true;
      break;  // 读到就立刻跳出，不再浪费时间
    }
    delay(50); // 等 50 ms 再尝试，给卡片/天线一点恢复时间
  }
  if (!ok) {
    // 连续多次都失败，认为模块可能卡死，重新初始化
    Serial.println(F("[ERROR] PICC_ReadCardSerial failed, re-init RC522"));
    rfid.PCD_Init();
    lastSuccess = millis();
    return;
  }

  // ===== 6. 真正读到卡片，更新 lastSuccess =====
  lastSuccess = millis();

  // ===== 7. 转换 UID 并验证 =====
  char buf[21];                 // 最长支持 10 字节 UID → 20 HEX + '\0'
  uidToHex(rfid.uid, buf);      // 把 uid.uidByte[] 转成大写 HEX 字符串
  Serial.print(F("UID = ")); 
  Serial.println(buf);

  // 白名单检查
  if (uidStore.contains(buf)) {
    Serial.println(F(">> AUTH OK, opening door"));
    door.openThenClose();       // 触发一次舵机开门，3s 后自动归位
  } else {
    Serial.println(F(">> AUTH FAIL"));
  }

  // ===== 8. 结束当前卡片会话 =====
  rfid.PICC_HaltA();            // 命令卡片休眠
  rfid.PCD_StopCrypto1();       // 关闭加密，释放天线
}
